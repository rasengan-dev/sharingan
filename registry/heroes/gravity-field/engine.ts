import * as d from "typegpu/data";
import { createHeroEngine, type HeroEngine, type HeroEngineOptions, type HeroResolved, type Scene, type SceneContext } from "@/lib/sharingan";
import { gravityFieldConfigSchema, type GravityFieldConfig, type GravityFieldConfigInput } from "./schema";
import { DrawParams, Particle, SimParams, drawShader, seedShader, simulateShader } from "./shaders";

const COUNT = { low: 40_000, medium: 120_000, high: 240_000 } as const;
const STILL_STEPS = 300;
const SEED = 7.31;

/** A slow orbit for the attractor while nobody points. Deterministic in `time`. */
function idleAttractor(time: number): [number, number] {
	return [0.5 + 0.3 * Math.cos(time * 0.23), 0.5 + 0.22 * Math.sin(time * 0.31)];
}

function createGravityScene({ root, device, context, format, canvas }: SceneContext, current: () => HeroResolved<GravityFieldConfig>): Scene {
	const compute = (code: string) =>
		device.createComputePipeline({ layout: "auto", compute: { module: device.createShaderModule({ code }), entryPoint: "main" } });
	const seed = compute(seedShader);
	const simulate = compute(simulateShader);
	const drawModule = device.createShaderModule({ code: drawShader });
	const draw = device.createRenderPipeline({
		layout: "auto",
		vertex: { module: drawModule, entryPoint: "vertexMain" },
		fragment: {
			module: drawModule,
			entryPoint: "fragmentMain",
			targets: [{ format, blend: { color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha" }, alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha" } } }],
		},
	});

	const simParams = root.createUniform(SimParams);
	const drawParams = root.createUniform(DrawParams);
	const simBuffer = root.unwrap(simParams.buffer);
	const drawBuffer = root.unwrap(drawParams.buffer);

	let count = 0;
	let particles: GPUBuffer | null = null;
	let groups: { seed: GPUBindGroup; simulate: GPUBindGroup; draw: GPUBindGroup } | null = null;
	let aspect = 1;
	let clock = 0;
	const pointer = { x: 0.5, y: 0.5, strength: 0 };

	function allocate() {
		particles?.destroy();
		count = COUNT[current().config.detail];
		// Typed by the Particle schema; the GPU fills it in the seed pass.
		particles = root.unwrap(root.createBuffer(d.arrayOf(Particle, count)).$usage("storage"));
		const group = (pipeline: GPUComputePipeline | GPURenderPipeline, uniform: GPUBuffer) =>
			device.createBindGroup({
				layout: pipeline.getBindGroupLayout(0),
				entries: [
					{ binding: 0, resource: { buffer: uniform } },
					{ binding: 1, resource: { buffer: particles! } },
				],
			});
		groups = { seed: group(seed, simBuffer), simulate: group(simulate, simBuffer), draw: group(draw, drawBuffer) };
	}

	function writeSim(time: number, delta: number, attractor: [number, number]) {
		const { config } = current();
		simParams.buffer.write({
			pointer: d.vec4f(pointer.x, pointer.y, pointer.strength, aspect),
			attractor: d.vec2f(attractor[0], attractor[1]),
			time,
			dt: delta,
			gravity: config.gravity,
			flow: config.flow,
			count,
			seed: SEED,
		});
	}

	function dispatch(pipeline: GPUComputePipeline, group: GPUBindGroup) {
		const encoder = device.createCommandEncoder();
		const pass = encoder.beginComputePass();
		pass.setPipeline(pipeline);
		pass.setBindGroup(0, group);
		pass.dispatchWorkgroups(Math.ceil(count / 64));
		pass.end();
		device.queue.submit([encoder.finish()]);
	}

	function reseed() {
		writeSim(0, 0, idleAttractor(0));
		dispatch(seed, groups!.seed);
	}

	function render() {
		const { config, palette, background, luminance } = current();
		const ratio = canvas.width / Math.max(1, canvas.clientWidth);
		const colors = Array.from({ length: 3 }, (_, i) => {
			const c = palette[i] ?? palette[palette.length - 1];
			return d.vec4f(c[0], c[1], c[2], 1);
		});
		drawParams.buffer.write({
			colors,
			calmZone: d.vec4f(0.5, 0.42, 0.34, 0.24),
			size: d.vec2f((config.size * ratio) / canvas.width, (config.size * ratio) / canvas.height),
			calmStrength: config.calm,
			// Dots read lighter on white: give them more body there.
			alpha: 0.5 + 0.3 * luminance,
		});
		const srgb = background.map((c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055));
		const encoder = device.createCommandEncoder();
		const pass = encoder.beginRenderPass({
			colorAttachments: [{ view: context.getCurrentTexture().createView(), loadOp: "clear", storeOp: "store", clearValue: { r: srgb[0], g: srgb[1], b: srgb[2], a: 1 } }],
		});
		pass.setPipeline(draw);
		pass.setBindGroup(0, groups!.draw);
		pass.draw(6, count);
		pass.end();
		device.queue.submit([encoder.finish()]);
	}

	allocate();
	reseed();

	return {
		resize(width, height) {
			aspect = width / height;
		},
		frame(time, delta, input) {
			const { config } = current();
			if (COUNT[config.detail] !== count) {
				allocate();
				reseed();
			}
			clock = time;
			const target = config.pointer && input.inside ? 1 : 0;
			const ease = 1 - Math.exp(-delta * 4);
			pointer.strength += (target - pointer.strength) * ease;
			if (input.inside) {
				pointer.x = input.x;
				pointer.y = input.y;
			}
			writeSim(clock, delta, idleAttractor(clock));
			dispatch(simulate, groups!.simulate);
			render();
		},
		still() {
			if (COUNT[current().config.detail] !== count) allocate();
			reseed();
			pointer.strength = 0;
			const delta = 1 / 60;
			for (let i = 0; i < STILL_STEPS; i++) {
				writeSim(i * delta, delta, idleAttractor(i * delta));
				dispatch(simulate, groups!.simulate);
			}
			render();
		},
		destroy() {
			particles?.destroy();
			simParams.buffer.destroy();
			drawParams.buffer.destroy();
		},
	};
}

export type GravityFieldHandle = HeroEngine<GravityFieldConfigInput>;

/** Starts Gravity field on a canvas. Framework-free: the React component and the Web Component both use it. */
export function createGravityField(options: HeroEngineOptions<GravityFieldConfigInput>): GravityFieldHandle {
	return createHeroEngine(options, { parse: (input) => gravityFieldConfigSchema.parse(input ?? {}), createScene: createGravityScene });
}
