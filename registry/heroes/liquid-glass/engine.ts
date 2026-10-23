import * as d from "typegpu/data";
import { createHeroEngine, type HeroEngine, type HeroEngineOptions, type HeroResolved, type Scene, type SceneContext } from "@/lib/sharingan/webgpu";
import { liquidGlassConfigSchema, type LiquidGlassConfig, type LiquidGlassConfigInput } from "./schema";
import { GlassParams, MAX_DROPS, glassShader } from "./shaders";

const STILL_TIME = 6;

type Picture = { texture: GPUTexture; aspect: number };

/** Loads an image into a texture. The image must be same-origin or served with CORS. */
async function loadPicture(device: GPUDevice, src: string): Promise<Picture | null> {
	try {
		const image = new Image();
		image.crossOrigin = "anonymous";
		image.src = src;
		await image.decode();
		const bitmap = await createImageBitmap(image);
		const texture = device.createTexture({
			size: [bitmap.width, bitmap.height],
			format: "rgba8unorm-srgb",
			usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
		});
		device.queue.copyExternalImageToTexture({ source: bitmap }, { texture }, [bitmap.width, bitmap.height]);
		return { texture, aspect: bitmap.width / bitmap.height };
	} catch (error) {
		console.warn(`[sharingan] liquid-glass could not load "${src}"`, error);
		return null;
	}
}

/** Drops that drift on their own, over and around the screenshot. Deterministic in `time`. */
function idleDrops(time: number, count: number): [number, number, number][] {
	return Array.from({ length: count }, (_, i) => {
		const phase = i * 1.9;
		return [
			0.5 + 0.34 * Math.sin(time * (0.13 + i * 0.03) + phase),
			0.72 + 0.16 * Math.cos(time * (0.17 + i * 0.02) + phase * 1.3),
			0.06 + 0.025 * Math.sin(i * 2.4 + 1),
		];
	});
}

async function createGlassScene({ root, device, context, format }: SceneContext, current: () => HeroResolved<LiquidGlassConfig>): Promise<Scene> {
	const module = device.createShaderModule({ code: glassShader });
	const pipeline = device.createRenderPipeline({
		layout: "auto",
		vertex: { module, entryPoint: "vertexMain" },
		fragment: { module, entryPoint: "fragmentMain", targets: [{ format }] },
	});
	const params = root.createUniform(GlassParams);
	const sampler = device.createSampler({ magFilter: "linear", minFilter: "linear" });

	// Wait for the first image: still frames (posters, screenshots) must include it.
	let source = current().config.image;
	let picture = await loadPicture(device, source);
	let bindGroup: GPUBindGroup;
	const blank = device.createTexture({ size: [1, 1], format: "rgba8unorm-srgb", usage: GPUTextureUsage.TEXTURE_BINDING });
	const bind = () => {
		bindGroup = device.createBindGroup({
			layout: pipeline.getBindGroupLayout(0),
			entries: [
				{ binding: 0, resource: { buffer: root.unwrap(params.buffer) } },
				{ binding: 1, resource: (picture?.texture ?? blank).createView() },
				{ binding: 2, resource: sampler },
			],
		});
	};
	bind();

	let aspect = 1;
	const pointer = { x: 0.5, y: 0.5, strength: 0 };

	function draw(time: number) {
		const { config, palette, background, luminance } = current();
		if (config.image !== source) {
			source = config.image;
			loadPicture(device, source).then((loaded) => {
				picture?.texture.destroy();
				picture = loaded;
				bind();
			});
		}
		const drops = idleDrops(time, config.drops);
		if (pointer.strength > 0.01) drops.push([pointer.x, pointer.y, 0.085 * pointer.strength]);
		const padded = Array.from({ length: MAX_DROPS }, (_, i) => {
			const drop = drops[i];
			return drop ? d.vec4f(drop[0], drop[1], drop[2], 0) : d.vec4f();
		});

		// The screenshot sits low and wide, cut by the bottom edge, like a product hero.
		const imageAspect = picture?.aspect ?? 1.6;
		const halfWidth = Math.min(0.36, (0.5 * imageAspect) / aspect);
		const halfHeight = (halfWidth * aspect) / imageAspect;
		const [tint, rim = tint] = palette;
		params.buffer.write({
			drops: padded,
			background: d.vec4f(background[0], background[1], background[2], 1),
			tint: d.vec4f(tint[0], tint[1], tint[2], 0.35),
			rim: d.vec4f(rim[0], rim[1], rim[2], 1),
			media: d.vec4f(0.5, 0.68 + halfHeight, halfWidth, halfHeight),
			aspect,
			refraction: config.refraction,
			count: Math.min(drops.length, MAX_DROPS),
			luminance,
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
		frame(time, delta, input) {
			const goal = current().config.pointer && input.inside ? 1 : 0;
			const ease = 1 - Math.exp(-delta * 6);
			pointer.strength += (goal - pointer.strength) * ease;
			if (input.inside) {
				pointer.x += (input.x - pointer.x) * Math.min(1, ease * 2);
				pointer.y += (input.y - pointer.y) * Math.min(1, ease * 2);
			}
			draw(time);
		},
		still() {
			pointer.strength = 0;
			draw(STILL_TIME);
		},
		destroy() {
			picture?.texture.destroy();
			blank.destroy();
			params.buffer.destroy();
		},
	};
}

export type LiquidGlassHandle = HeroEngine<LiquidGlassConfigInput>;

/** Starts Liquid glass on a canvas. Framework-free: the React component and the Web Component both use it. */
export function createLiquidGlass(options: HeroEngineOptions<LiquidGlassConfigInput>): LiquidGlassHandle {
	return createHeroEngine(options, { parse: (input) => liquidGlassConfigSchema.parse(input ?? {}), createScene: createGlassScene });
}
