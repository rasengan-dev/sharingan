import * as d from "typegpu/data";
import { createHeroEngine, type HeroEngine, type HeroEngineOptions, type HeroResolved, type Scene, type SceneContext } from "@/lib/sharingan";
import { particleTypeConfigSchema, type ParticleTypeConfig, type ParticleTypeConfigInput } from "./schema";
import { DrawParams, Particle, SimParams, drawShader, simulateShader } from "./shaders";

/** Floats per particle in the storage buffer: the Particle struct is 32 bytes. */
const STRIDE = 8;
const MAX_PARTICLES = 90_000;
const STILL_STEPS = 120;

/** The headline the particles draw: marked `data-sg-text`, or the hero's first h1. */
function findText(host: HTMLElement): HTMLElement | null {
	return host.querySelector<HTMLElement>("[data-sg-text]") ?? host.querySelector<HTMLElement>("h1");
}

/**
 * Redraws the real headline, word by word at its laid-out position, into an
 * offscreen canvas the size of ours, then keeps one point every `gap`
 * device pixels where a letter is. Returns homes in canvas space (0–1).
 */
function sampleHeadline(target: HTMLElement, canvas: HTMLCanvasElement, gapCss: number): { homes: Float32Array; gap: number } {
	const box = canvas.getBoundingClientRect();
	const scale = canvas.width / Math.max(1, box.width);
	const offscreen = document.createElement("canvas");
	offscreen.width = canvas.width;
	offscreen.height = canvas.height;
	const ctx = offscreen.getContext("2d", { willReadFrequently: true });
	if (!ctx) return { homes: new Float32Array(), gap: 1 };

	const style = getComputedStyle(target);
	ctx.font = `${style.fontStyle} ${style.fontWeight} ${parseFloat(style.fontSize) * scale}px ${style.fontFamily}`;
	const spacing = parseFloat(style.letterSpacing);
	if ("letterSpacing" in ctx && Number.isFinite(spacing)) ctx.letterSpacing = `${spacing * scale}px`;
	ctx.fillStyle = "#fff";
	ctx.textBaseline = "alphabetic";
	const metrics = ctx.measureText("Hg");
	const ascent = metrics.fontBoundingBoxAscent;
	const descent = metrics.fontBoundingBoxDescent;

	const range = document.createRange();
	const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
	for (let node = walker.nextNode(); node; node = walker.nextNode()) {
		const text = node.textContent ?? "";
		for (const word of text.matchAll(/\S+/g)) {
			range.setStart(node, word.index);
			range.setEnd(node, word.index + word[0].length);
			const rect = range.getClientRects()[0];
			if (!rect) continue;
			const x = (rect.left - box.left) * scale;
			const y = (rect.top - box.top) * scale + (rect.height * scale - (ascent + descent)) / 2 + ascent;
			ctx.fillText(word[0], x, y);
		}
	}

	const pixels = ctx.getImageData(0, 0, offscreen.width, offscreen.height).data;
	let gap = Math.max(2, Math.round(gapCss * scale));
	for (;;) {
		const points: number[] = [];
		for (let y = gap / 2; y < offscreen.height; y += gap) {
			for (let x = gap / 2; x < offscreen.width; x += gap) {
				if (pixels[(Math.floor(y) * offscreen.width + Math.floor(x)) * 4 + 3] > 128) points.push(x / offscreen.width, y / offscreen.height);
			}
		}
		// Too many for the budget: sample more sparsely.
		if (points.length / 2 <= MAX_PARTICLES) return { homes: new Float32Array(points), gap };
		gap += 1;
	}
}

function createParticleScene({ root, device, context, format, canvas, host }: SceneContext, current: () => HeroResolved<ParticleTypeConfig>): Scene {
	const target = findText(host);
	const simulate = device.createComputePipeline({ layout: "auto", compute: { module: device.createShaderModule({ code: simulateShader }), entryPoint: "main" } });
	const drawModule = device.createShaderModule({ code: drawShader });
	const draw = device.createRenderPipeline({
		layout: "auto",
		vertex: { module: drawModule, entryPoint: "vertexMain" },
		fragment: { module: drawModule, entryPoint: "fragmentMain", targets: [{ format }] },
	});
	const simParams = root.createUniform(SimParams);
	const drawParams = root.createUniform(DrawParams);

	let count = 0;
	let gap = 2;
	let particles: GPUBuffer | null = null;
	let groups: { simulate: GPUBindGroup; draw: GPUBindGroup } | null = null;
	let aspect = 1;
	const pointer = { x: 0.5, y: 0.5, strength: 0 };

	// The canvas draws the headline now: hide the DOM copy, keep it for selection and screen readers.
	const previousColor = target?.style.color ?? "";
	if (target) target.style.color = "transparent";

	/** Samples the headline again and rebuilds the particles; `settled` puts them home at once. */
	function rebuild(settled: boolean) {
		particles?.destroy();
		particles = null;
		count = 0;
		if (!target || canvas.width < 2) return;
		const sample = sampleHeadline(target, canvas, current().config.gap);
		gap = sample.gap;
		count = sample.homes.length / 2;
		if (count === 0) return;

		const data = new Float32Array(count * STRIDE);
		for (let i = 0; i < count; i++) {
			const hx = sample.homes[i * 2];
			const hy = sample.homes[i * 2 + 1];
			const o = i * STRIDE;
			data[o] = settled ? hx : Math.random();
			data[o + 1] = settled ? hy : Math.random();
			data[o + 4] = hx;
			data[o + 5] = hy;
			data[o + 6] = Math.random();
		}
		const typed = root.createBuffer(d.arrayOf(Particle, count)).$usage("storage");
		particles = root.unwrap(typed);
		device.queue.writeBuffer(particles, 0, data);
		const bind = (pipeline: GPUComputePipeline | GPURenderPipeline, uniform: GPUBuffer) =>
			device.createBindGroup({
				layout: pipeline.getBindGroupLayout(0),
				entries: [
					{ binding: 0, resource: { buffer: uniform } },
					{ binding: 1, resource: { buffer: particles! } },
				],
			});
		groups = { simulate: bind(simulate, root.unwrap(simParams.buffer)), draw: bind(draw, root.unwrap(drawParams.buffer)) };
	}

	function step(time: number, delta: number) {
		if (!count) return;
		const { config } = current();
		simParams.buffer.write({
			pointer: d.vec4f(pointer.x, pointer.y, pointer.strength, aspect),
			time,
			dt: delta,
			scatter: config.scatter,
			spring: config.spring,
			count,
		});
		const encoder = device.createCommandEncoder();
		const pass = encoder.beginComputePass();
		pass.setPipeline(simulate);
		pass.setBindGroup(0, groups!.simulate);
		pass.dispatchWorkgroups(Math.ceil(count / 64));
		pass.end();
		device.queue.submit([encoder.finish()]);
	}

	function render() {
		const { config, palette, background } = current();
		const colors = Array.from({ length: 3 }, (_, i) => {
			const c = palette[i] ?? palette[palette.length - 1];
			return d.vec4f(c[0], c[1], c[2], 1);
		});
		const half = (gap * config.size) / 2;
		drawParams.buffer.write({ colors, size: d.vec2f((2 * half) / canvas.width, (2 * half) / canvas.height) });
		const srgb = background.map((c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055));
		const encoder = device.createCommandEncoder();
		const pass = encoder.beginRenderPass({
			colorAttachments: [{ view: context.getCurrentTexture().createView(), loadOp: "clear", storeOp: "store", clearValue: { r: srgb[0], g: srgb[1], b: srgb[2], a: 1 } }],
		});
		if (count) {
			pass.setPipeline(draw);
			pass.setBindGroup(0, groups!.draw);
			pass.draw(6, count);
		}
		pass.end();
		device.queue.submit([encoder.finish()]);
	}

	// Re-sample when the words or the font change; layout changes arrive as resizes.
	let pending = false;
	const resample = () => {
		if (pending) return;
		pending = true;
		requestAnimationFrame(() => {
			pending = false;
			rebuild(true);
		});
	};
	const textObserver = target ? new MutationObserver(resample) : null;
	textObserver?.observe(target!, { characterData: true, childList: true, subtree: true });
	document.fonts?.addEventListener("loadingdone", resample);

	return {
		resize(width, height) {
			aspect = width / height;
			rebuild(false);
		},
		frame(time, delta, input) {
			const { config } = current();
			const goal = config.pointer && input.inside ? 1 : 0;
			pointer.strength += (goal - pointer.strength) * (1 - Math.exp(-delta * 8));
			if (input.inside) {
				pointer.x = input.x;
				pointer.y = input.y;
			}
			step(time, delta);
			render();
		},
		still() {
			rebuild(true);
			pointer.strength = 0;
			for (let i = 0; i < STILL_STEPS; i++) step(i / 60, 1 / 60);
			render();
		},
		destroy() {
			textObserver?.disconnect();
			document.fonts?.removeEventListener("loadingdone", resample);
			if (target) target.style.color = previousColor;
			particles?.destroy();
			simParams.buffer.destroy();
			drawParams.buffer.destroy();
		},
	};
}

export type ParticleTypeHandle = HeroEngine<ParticleTypeConfigInput>;

/** Starts Particle type on a canvas. The host must contain the headline (`data-sg-text`, or its first h1). */
export function createParticleType(options: HeroEngineOptions<ParticleTypeConfigInput>): ParticleTypeHandle {
	return createHeroEngine(options, { parse: (input) => particleTypeConfigSchema.parse(input ?? {}), createScene: createParticleScene });
}
