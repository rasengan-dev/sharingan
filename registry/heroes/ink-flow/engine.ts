import * as d from "typegpu/data";
import {
	createHeroEngine,
	type HeroEngine,
	type HeroEngineOptions,
	type HeroResolved,
	type LinearColor,
	type PointerState,
	type Scene,
	type SceneContext,
} from "@/lib/sharingan";
import { inkFlowConfigSchema, type InkFlowConfig, type InkFlowConfigInput } from "./schema";
import * as shaders from "./shaders";

/** Long side of the simulation grid and of the ink texture, per detail level. */
const GRID = { low: 112, medium: 160, high: 224 } as const;
const INK = { low: 384, medium: 640, high: 896 } as const;
const PRESSURE_ITERATIONS = 20;
const STILL_STEPS = 150;
const GAIN = 2.2;

type Resolved = HeroResolved<InkFlowConfig>;

type Splat = { x: number; y: number; fx: number; fy: number; color: LinearColor; amount: number; radius: number };

/** Two textures that take turns being read and written. */
class PingPong {
	private views: [GPUTextureView, GPUTextureView];
	constructor(private textures: [GPUTexture, GPUTexture]) {
		this.views = [textures[0].createView(), textures[1].createView()];
	}
	get read() {
		return this.views[0];
	}
	get write() {
		return this.views[1];
	}
	swap() {
		this.views.reverse();
	}
	destroy() {
		this.textures.forEach((texture) => texture.destroy());
	}
}

function gridSize(width: number, height: number, longSide: number): [number, number] {
	const scale = longSide / Math.max(width, height);
	return [Math.max(8, Math.round(width * scale)), Math.max(8, Math.round(height * scale))];
}

/** Slow emitters that keep the ink moving with nobody at the pointer. Deterministic in `time`. */
function ambientSplats(time: number, delta: number, resolved: Resolved, grid: [number, number]): Splat[] {
	return [0, 1, 2].map((i) => {
		const phase = i * 2.1;
		const sx = 0.21 * (1 + i * 0.17);
		const sy = 0.27 * (1 + i * 0.11);
		const x = 0.5 + 0.38 * Math.cos(time * sx + phase);
		const y = 0.5 + 0.3 * Math.sin(time * sy + phase * 1.3);
		const vx = -0.38 * sx * Math.sin(time * sx + phase);
		const vy = 0.3 * sy * Math.cos(time * sy + phase * 1.3);
		return {
			x,
			y,
			fx: vx * grid[0] * 1.6,
			fy: vy * grid[1] * 1.6,
			color: resolved.palette[i % resolved.palette.length],
			amount: 0.32 * delta,
			radius: 0.003,
		};
	});
}

function createInkScene({ root, device, context, format }: SceneContext, current: () => Resolved): Scene {
	const compute = (code: string, constants?: Record<string, number>) =>
		device.createComputePipeline({
			layout: "auto",
			compute: { module: device.createShaderModule({ code }), entryPoint: "main", constants },
		});

	const pipelines = {
		splatVelocity: compute(shaders.splatShader, { INK: 0 }),
		splatInk: compute(shaders.splatShader, { INK: 1 }),
		curl: compute(shaders.curlShader),
		vorticity: compute(shaders.vorticityShader),
		divergence: compute(shaders.divergenceShader),
		fadePressure: compute(shaders.scaleShader, { FACTOR: 0.8 }),
		pressure: compute(shaders.pressureShader),
		gradient: compute(shaders.gradientShader),
		advectVelocity: compute(shaders.advectShader, { INK: 0 }),
		advectInk: compute(shaders.advectShader, { INK: 1 }),
	};
	const renderModule = device.createShaderModule({ code: shaders.renderShader });
	const render = device.createRenderPipeline({
		layout: "auto",
		vertex: { module: renderModule, entryPoint: "vertexMain" },
		fragment: { module: renderModule, entryPoint: "fragmentMain", targets: [{ format }] },
		primitive: { topology: "triangle-list" },
	});

	// Typed uniforms: the TypeGPU schemas above decide the layout on both sides.
	const simParams = root.createUniform(shaders.SimParams);
	const splatList = root.createUniform(shaders.SplatList);
	const renderParams = root.createUniform(shaders.RenderParams);
	const simBinding = { buffer: root.unwrap(simParams.buffer) };
	const splatBinding = { buffer: root.unwrap(splatList.buffer) };
	const renderBinding = { buffer: root.unwrap(renderParams.buffer) };
	const linear = device.createSampler({ magFilter: "linear", minFilter: "linear", addressModeU: "clamp-to-edge", addressModeV: "clamp-to-edge" });

	let grid: [number, number] = [8, 8];
	let inkSize: [number, number] = [8, 8];
	let detail: InkFlowConfig["detail"] = current().config.detail;
	let canvasSize: [number, number] = [0, 0];
	let velocity: PingPong, pressure: PingPong, ink: PingPong;
	let divergence: GPUTexture, curl: GPUTexture;
	let divergenceView: GPUTextureView, curlView: GPUTextureView;
	let colorIndex = 0;

	// Bind groups depend only on which views are bound: build each combination once.
	const ids = new WeakMap<object, number>();
	let nextId = 0;
	const idOf = (resource: object) => ids.get(resource) ?? (ids.set(resource, ++nextId), nextId);
	let groups = new Map<string, GPUBindGroup>();
	const group = (name: string, pipeline: GPUComputePipeline | GPURenderPipeline, resources: GPUBindingResource[]) => {
		const key = `${name}:${resources.map((resource) => idOf(resource as object)).join(",")}`;
		let bindGroup = groups.get(key);
		if (!bindGroup) {
			bindGroup = device.createBindGroup({
				layout: pipeline.getBindGroupLayout(0),
				entries: resources.map((resource, binding) => ({ binding, resource })),
			});
			groups.set(key, bindGroup);
		}
		return bindGroup;
	};

	const field = (size: [number, number]) =>
		device.createTexture({
			size,
			format: "rgba16float",
			usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
		});

	function allocate() {
		velocity?.destroy();
		pressure?.destroy();
		ink?.destroy();
		divergence?.destroy();
		curl?.destroy();
		detail = current().config.detail;
		grid = gridSize(canvasSize[0], canvasSize[1], GRID[detail]);
		inkSize = gridSize(canvasSize[0], canvasSize[1], INK[detail]);
		velocity = new PingPong([field(grid), field(grid)]);
		pressure = new PingPong([field(grid), field(grid)]);
		ink = new PingPong([field(inkSize), field(inkSize)]);
		divergence = field(grid);
		curl = field(grid);
		divergenceView = divergence.createView();
		curlView = curl.createView();
		groups = new Map();
	}

	function dispatch(pass: GPUComputePassEncoder, name: keyof typeof pipelines, resources: GPUBindingResource[], size: [number, number]) {
		const pipeline = pipelines[name];
		pass.setPipeline(pipeline);
		pass.setBindGroup(0, group(name, pipeline, resources));
		pass.dispatchWorkgroups(Math.ceil(size[0] / 8), Math.ceil(size[1] / 8));
	}

	/** One simulation step. Uniforms are written now, so each step needs its own submit. */
	function step(delta: number, splats: Splat[]) {
		const { config } = current();
		if (config.detail !== detail) allocate();

		simParams.buffer.write({
			texel: d.vec2f(1 / grid[0], 1 / grid[1]),
			dt: delta,
			velocityFade: config.flowFade,
			inkFade: config.inkFade,
			swirl: config.swirl,
		});
		const used = splats.slice(0, shaders.MAX_SPLATS);
		if (used.length > 0) {
			splatList.buffer.write({
				count: used.length,
				aspect: canvasSize[0] / canvasSize[1],
				items: Array.from({ length: shaders.MAX_SPLATS }, (_, i) => {
					const s = used[i];
					return s
						? { point: d.vec2f(s.x, s.y), force: d.vec2f(s.fx, s.fy), color: d.vec4f(s.color[0] * s.amount, s.color[1] * s.amount, s.color[2] * s.amount, s.radius) }
						: { point: d.vec2f(), force: d.vec2f(), color: d.vec4f() };
				}),
			});
		}

		const encoder = device.createCommandEncoder();
		const pass = encoder.beginComputePass();
		if (used.length > 0) {
			dispatch(pass, "splatVelocity", [splatBinding, velocity.read, velocity.write], grid);
			velocity.swap();
			dispatch(pass, "splatInk", [splatBinding, ink.read, ink.write], inkSize);
			ink.swap();
		}
		dispatch(pass, "curl", [velocity.read, curlView], grid);
		dispatch(pass, "vorticity", [simBinding, velocity.read, curlView, velocity.write], grid);
		velocity.swap();
		dispatch(pass, "divergence", [velocity.read, divergenceView], grid);
		dispatch(pass, "fadePressure", [pressure.read, pressure.write], grid);
		pressure.swap();
		for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
			dispatch(pass, "pressure", [pressure.read, divergenceView, pressure.write], grid);
			pressure.swap();
		}
		dispatch(pass, "gradient", [pressure.read, velocity.read, velocity.write], grid);
		velocity.swap();
		dispatch(pass, "advectVelocity", [simBinding, velocity.read, velocity.read, velocity.write, linear], grid);
		velocity.swap();
		dispatch(pass, "advectInk", [simBinding, velocity.read, ink.read, ink.write, linear], inkSize);
		ink.swap();
		pass.end();
		device.queue.submit([encoder.finish()]);
	}

	function draw() {
		// Ink fades into a light page much sooner than into a dark one: give light backgrounds denser ink.
		const { config, background, luminance } = current();
		renderParams.buffer.write({
			background: d.vec4f(background[0], background[1], background[2], 1),
			calmZone: d.vec4f(0.5, 0.42, 0.34, 0.24),
			calmStrength: config.calm,
			gain: GAIN * (1 + 2.5 * luminance),
		});
		const encoder = device.createCommandEncoder();
		const pass = encoder.beginRenderPass({
			colorAttachments: [{ view: context.getCurrentTexture().createView(), loadOp: "clear", storeOp: "store", clearValue: { r: 0, g: 0, b: 0, a: 1 } }],
		});
		pass.setPipeline(render);
		pass.setBindGroup(0, group("render", render, [renderBinding, ink.read, linear]));
		pass.draw(3);
		pass.end();
		device.queue.submit([encoder.finish()]);
	}

	function pointerSplats(pointer: PointerState, time: number, delta: number): Splat[] {
		const resolved = current();
		if (!resolved.config.pointer || !pointer.inside || delta <= 0 || (pointer.dx === 0 && pointer.dy === 0)) return [];
		colorIndex = Math.floor(time / 0.9) % resolved.palette.length;
		return [
			{
				x: pointer.x,
				y: pointer.y,
				fx: (pointer.dx * grid[0] * 0.35) / delta,
				fy: (pointer.dy * grid[1] * 0.35) / delta,
				color: resolved.palette[colorIndex],
				amount: pointer.down ? 0.6 : 0.35,
				radius: pointer.down ? 0.004 : 0.0018,
			},
		];
	}

	return {
		resize(width, height) {
			canvasSize = [width, height];
			allocate();
		},
		frame(time, delta, pointer) {
			const resolved = current();
			const splats = [...(resolved.config.ambient ? ambientSplats(time, delta, resolved, grid) : []), ...pointerSplats(pointer, time, delta)];
			step(delta, splats);
			draw();
		},
		still() {
			// Start from clean fields and play the same few seconds every time.
			allocate();
			const resolved = current();
			const delta = 1 / 60;
			for (let i = 0; i < STILL_STEPS; i++) step(delta, ambientSplats(i * delta, delta, resolved, grid));
			draw();
		},
		destroy() {
			velocity?.destroy();
			pressure?.destroy();
			ink?.destroy();
			divergence?.destroy();
			curl?.destroy();
			simParams.buffer.destroy();
			splatList.buffer.destroy();
			renderParams.buffer.destroy();
		},
	};
}

export type InkFlowHandle = HeroEngine<InkFlowConfigInput>;

/** Starts Ink flow on a canvas. Framework-free: the React component and the Web Component both use it. */
export function createInkFlow(options: HeroEngineOptions<InkFlowConfigInput>): InkFlowHandle {
	return createHeroEngine(options, { parse: (input) => inkFlowConfigSchema.parse(input ?? {}), createScene: createInkScene });
}
