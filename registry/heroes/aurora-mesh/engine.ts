import * as d from "typegpu/data";
import { createHeroEngine, type HeroEngine, type HeroEngineOptions, type HeroResolved, type Scene, type SceneContext } from "@/lib/sharingan/webgpu";
import { auroraMeshConfigSchema, type AuroraMeshConfig, type AuroraMeshConfigInput } from "./schema";
import { AuroraParams, auroraShader } from "./shaders";

const STILL_TIME = 18;

function createAuroraScene({ root, device, context, format }: SceneContext, current: () => HeroResolved<AuroraMeshConfig>): Scene {
	const module = device.createShaderModule({ code: auroraShader });
	const pipeline = device.createRenderPipeline({
		layout: "auto",
		vertex: { module, entryPoint: "vertexMain" },
		fragment: { module, entryPoint: "fragmentMain", targets: [{ format }] },
	});
	const params = root.createUniform(AuroraParams);
	const bindGroup = device.createBindGroup({
		layout: pipeline.getBindGroupLayout(0),
		entries: [{ binding: 0, resource: { buffer: root.unwrap(params.buffer) } }],
	});

	let aspect = 1;
	let clock = 0;
	// The pointer's pull eases in and out instead of jumping.
	const pointer = { x: 0.5, y: 0.5, strength: 0 };

	function draw(time: number) {
		const { config, palette, background, luminance } = current();
		const colors = Array.from({ length: 4 }, (_, i) => {
			const c = palette[i] ?? palette[palette.length - 1];
			return d.vec4f(c[0], c[1], c[2], 1);
		});
		params.buffer.write({
			colors,
			background: d.vec4f(background[0], background[1], background[2], 1),
			calmZone: d.vec4f(0.5, 0.42, 0.34, 0.24),
			pointer: d.vec4f(pointer.x, pointer.y, pointer.strength, aspect),
			time,
			intensity: config.intensity,
			calmStrength: config.calm,
			luminance,
			count: Math.min(4, palette.length),
		});
		const encoder = device.createCommandEncoder();
		const pass = encoder.beginRenderPass({
			colorAttachments: [{ view: context.getCurrentTexture().createView(), loadOp: "clear", storeOp: "store", clearValue: { r: 0, g: 0, b: 0, a: 1 } }],
		});
		pass.setPipeline(pipeline);
		pass.setBindGroup(0, bindGroup);
		pass.draw(3);
		pass.end();
		device.queue.submit([encoder.finish()]);
	}

	return {
		resize(width, height) {
			aspect = width / height;
		},
		frame(_time, delta, input) {
			const { config } = current();
			clock += delta * config.speed;
			const target = config.pointer && input.inside ? 1 : 0;
			const ease = 1 - Math.exp(-delta * 3);
			pointer.strength += (target - pointer.strength) * ease;
			if (input.inside) {
				pointer.x += (input.x - pointer.x) * ease;
				pointer.y += (input.y - pointer.y) * ease;
			}
			draw(clock);
		},
		still() {
			pointer.strength = 0;
			draw(STILL_TIME);
		},
		destroy() {
			params.buffer.destroy();
		},
	};
}

export type AuroraMeshHandle = HeroEngine<AuroraMeshConfigInput>;

/** Starts Aurora mesh on a canvas. Framework-free: the React component and the Web Component both use it. */
export function createAuroraMesh(options: HeroEngineOptions<AuroraMeshConfigInput>): AuroraMeshHandle {
	// The light is soft by nature: render at reduced resolution and let the browser scale it up.
	return createHeroEngine(options, { parse: (input) => auroraMeshConfigSchema.parse(input ?? {}), createScene: createAuroraScene, maxPixelRatio: 0.5 });
}
