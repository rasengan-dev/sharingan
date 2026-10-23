import * as d from "typegpu/data";
import { createHeroEngine, type HeroEngine, type HeroEngineOptions, type HeroResolved, type Scene, type SceneContext } from "@/lib/sharingan";
import { reactionDiffusionConfigSchema, type ReactionDiffusionConfig, type ReactionDiffusionConfigInput } from "./schema";
import { DrawParams, SimParams, drawShader, seedShader, stepShader } from "./shaders";

/** Long side of the grid, per detail level. */
const GRID = { low: 160, medium: 256, high: 384 } as const;
/** Feed and kill rates (Karl Sims' map of the Gray-Scott model). */
const PATTERNS = { coral: [0.0545, 0.062], maze: [0.029, 0.057], spots: [0.0367, 0.0649] } as const;
const STILL_STEPS = 2400;
const SEED = 3.7;

function createReactionScene({ root, device, context, format }: SceneContext, current: () => HeroResolved<ReactionDiffusionConfig>): Scene {
	const compute = (code: string) =>
		device.createComputePipeline({ layout: "auto", compute: { module: device.createShaderModule({ code }), entryPoint: "main" } });
	const seed = compute(seedShader);
	const step = compute(stepShader);
	const drawModule = device.createShaderModule({ code: drawShader });
	const draw = device.createRenderPipeline({
		layout: "auto",
		vertex: { module: drawModule, entryPoint: "vertexMain" },
		fragment: { module: drawModule, entryPoint: "fragmentMain", targets: [{ format }] },
	});

	const simParams = root.createUniform(SimParams);
	const drawParams = root.createUniform(DrawParams);
	const simBinding = { buffer: root.unwrap(simParams.buffer) };
	const drawBinding = { buffer: root.unwrap(drawParams.buffer) };
	const linear = device.createSampler({ magFilter: "linear", minFilter: "linear", addressModeU: "repeat", addressModeV: "repeat" });

	let canvasSize: [number, number] = [1, 1];
	let grid: [number, number] = [8, 8];
	let detail = current().config.detail;
	let textures: [GPUTexture, GPUTexture] | null = null;
	let views: [GPUTextureView, GPUTextureView] = [] as unknown as [GPUTextureView, GPUTextureView];
	let groups: { seed: GPUBindGroup; steps: [GPUBindGroup, GPUBindGroup]; draws: [GPUBindGroup, GPUBindGroup] } | null = null;
	/** Which texture holds the latest state. */
	let latest = 0;
	const pointer = { x: 0.5, y: 0.5, strength: 0 };

	function allocate() {
		textures?.forEach((texture) => texture.destroy());
		detail = current().config.detail;
		const scale = GRID[detail] / Math.max(canvasSize[0], canvasSize[1]);
		grid = [Math.max(8, Math.round(canvasSize[0] * scale)), Math.max(8, Math.round(canvasSize[1] * scale))];
		const make = () => device.createTexture({ size: grid, format: "rgba16float", usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING });
		textures = [make(), make()];
		views = [textures[0].createView(), textures[1].createView()];
		const bind = (pipeline: GPUComputePipeline | GPURenderPipeline, resources: GPUBindingResource[]) =>
			device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: resources.map((resource, binding) => ({ binding, resource })) });
		groups = {
			seed: bind(seed, [simBinding, views[0]]),
			// steps[i] reads texture i and writes the other one.
			steps: [bind(step, [simBinding, views[0], views[1]]), bind(step, [simBinding, views[1], views[0]])],
			draws: [bind(draw, [drawBinding, views[0], linear]), bind(draw, [drawBinding, views[1], linear])],
		};
	}

	function writeSim() {
		const { config } = current();
		const [feed, kill] = PATTERNS[config.pattern];
		simParams.buffer.write({
			pointer: d.vec4f(pointer.x, pointer.y, pointer.strength, canvasSize[0] / canvasSize[1]),
			calmZone: d.vec4f(0.5, 0.42, 0.36, 0.26),
			feed,
			kill,
			calmStrength: config.calm,
			seed: SEED,
		});
	}

	function reseed() {
		writeSim();
		const encoder = device.createCommandEncoder();
		const pass = encoder.beginComputePass();
		pass.setPipeline(seed);
		pass.setBindGroup(0, groups!.seed);
		pass.dispatchWorkgroups(Math.ceil(grid[0] / 8), Math.ceil(grid[1] / 8));
		pass.end();
		device.queue.submit([encoder.finish()]);
		latest = 0;
	}

	/** `count` steps in one pass: the parameters do not change between them. */
	function simulate(count: number) {
		writeSim();
		const encoder = device.createCommandEncoder();
		const pass = encoder.beginComputePass();
		pass.setPipeline(step);
		for (let i = 0; i < count; i++) {
			pass.setBindGroup(0, groups!.steps[latest]);
			pass.dispatchWorkgroups(Math.ceil(grid[0] / 8), Math.ceil(grid[1] / 8));
			latest = 1 - latest;
		}
		pass.end();
		device.queue.submit([encoder.finish()]);
	}

	function render() {
		const { palette, background, luminance } = current();
		const colors = [0, 1].map((i) => {
			const c = palette[i] ?? palette[palette.length - 1];
			return d.vec4f(c[0], c[1], c[2], 1);
		});
		drawParams.buffer.write({
			colors,
			background: d.vec4f(background[0], background[1], background[2], 1),
			texel: d.vec2f(1 / grid[0], 1 / grid[1]),
			luminance,
		});
		const encoder = device.createCommandEncoder();
		const pass = encoder.beginRenderPass({
			colorAttachments: [{ view: context.getCurrentTexture().createView(), loadOp: "clear", storeOp: "store", clearValue: { r: 0, g: 0, b: 0, a: 1 } }],
		});
		pass.setPipeline(draw);
		pass.setBindGroup(0, groups!.draws[latest]);
		pass.draw(3);
		pass.end();
		device.queue.submit([encoder.finish()]);
	}

	return {
		resize(width, height) {
			canvasSize = [width, height];
			allocate();
			reseed();
		},
		frame(_time, delta, input) {
			const { config } = current();
			if (config.detail !== detail) {
				allocate();
				reseed();
			}
			pointer.strength = config.pointer && input.inside && (input.dx !== 0 || input.dy !== 0) ? 1 : 0;
			pointer.x = input.x;
			pointer.y = input.y;
			if (delta > 0) simulate(config.speed);
			render();
		},
		still() {
			allocate();
			reseed();
			pointer.strength = 0;
			for (let done = 0; done < STILL_STEPS; done += 200) simulate(200);
			render();
		},
		destroy() {
			textures?.forEach((texture) => texture.destroy());
			simParams.buffer.destroy();
			drawParams.buffer.destroy();
		},
	};
}

export type ReactionDiffusionHandle = HeroEngine<ReactionDiffusionConfigInput>;

/** Starts Reaction-diffusion on a canvas. Framework-free: the React component and the Web Component both use it. */
export function createReactionDiffusion(options: HeroEngineOptions<ReactionDiffusionConfigInput>): ReactionDiffusionHandle {
	return createHeroEngine(options, { parse: (input) => reactionDiffusionConfigSchema.parse(input ?? {}), createScene: createReactionScene });
}
