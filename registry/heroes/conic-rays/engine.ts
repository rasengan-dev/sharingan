import {
	addFrame,
	adoptStyles,
	onMotionPreferenceChange,
	onThemeChange,
	readMotionMode,
	resolveColor,
	trackVisibility,
	type DomHero,
	type DomHeroOptions,
	type MotionMode,
} from "@/lib/sharingan";
import { conicRaysConfigSchema, type ConicRaysConfig, type ConicRaysConfigInput } from "./schema";
import { CONIC_RAYS_STYLE_ID, conicRaysStyles } from "./styles";

/**
 * Markup the engine expects inside the host: the hero's copy, and
 * optionally a `[data-sg-layer]` holding a `.sg-cr-source` with three
 * `.sg-cr-rays` (so the light shows before the script runs). Missing parts
 * are added.
 */

const ORIGIN = { top: "-12%", center: "50%", bottom: "112%" } as const;

/** Conic rays (Sharingan, DOM). Soft rays of light turn slowly behind the headline. */
export function createConicRays({ host, config }: DomHeroOptions<ConicRaysConfigInput>): DomHero<ConicRaysConfigInput> {
	adoptStyles(host, CONIC_RAYS_STYLE_ID, conicRaysStyles);
	host.classList.add("sg-cr");

	let settings: ConicRaysConfig = conicRaysConfigSchema.parse(config ?? {});
	let mode: MotionMode = readMotionMode();
	const cancel = new AbortController();
	const { signal } = cancel;
	const created: Element[] = [];

	let layer = host.querySelector<HTMLElement>("[data-sg-layer]");
	if (!layer) {
		layer = document.createElement("div");
		layer.dataset.sgLayer = "";
		layer.innerHTML = `<div class="sg-cr-source"><div class="sg-cr-rays"></div><div class="sg-cr-rays"></div><div class="sg-cr-rays"></div></div><div class="sg-cr-grain"></div>`;
		host.prepend(layer);
		created.push(layer);
	}
	layer.classList.add("sg-cr-layer");
	layer.setAttribute("aria-hidden", "true");
	const source = layer.querySelector<HTMLElement>(".sg-cr-source");

	const applyLook = () => {
		const { colors } = settings;
		for (let i = 0; i < 3; i++) host.style.setProperty(`--sg-cr-c${i}`, colors[i % colors.length]);
		host.style.setProperty("--p", `${(360 / settings.rays).toFixed(3)}deg`);
		host.style.setProperty("--w", String(settings.spread));
		host.style.setProperty("--spin", `${(90 / settings.speed).toFixed(1)}s`);
		host.style.setProperty("--oy", ORIGIN[settings.origin]);
		host.style.setProperty("--calm", String(settings.calm));
		// Light adds up on dark pages; on light ones it is a tint, so it needs more presence.
		const [r, g, b] = resolveColor(host, getComputedStyle(host).backgroundColor, [1, 1, 1]);
		const dark = 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.18;
		host.dataset.tone = dark ? "dark" : "light";
		host.style.setProperty("--strength", String(Math.min(1, settings.intensity * (dark ? 0.9 : 0.85))));
		host.dataset.motion = mode;
	};
	applyLook();
	const stopTheme = onThemeChange(applyLook);

	// Pause: off screen, reduced motion, still modes
	let visible = false;
	const syncPause = () => host.toggleAttribute("data-paused", mode !== "ready" || !visible);

	// Pointer: the source leans toward it
	let lean = 0;
	let target = 0;
	let stopFrame: (() => void) | null = null;
	const frame = (_time: number, delta: number) => {
		lean += (target - lean) * (1 - Math.exp(-delta * 3));
		source?.style.setProperty("--lean", lean.toFixed(3));
		if (Math.abs(target - lean) < 0.01) {
			stopFrame?.();
			stopFrame = null;
		}
	};
	const follow = (next: number) => {
		target = next;
		if (!stopFrame && mode === "ready") stopFrame = addFrame(frame);
	};
	host.addEventListener(
		"pointermove",
		(event) => {
			if (!settings.pointer || mode !== "ready") return;
			const box = host.getBoundingClientRect();
			const x = (event.clientX - box.left) / box.width;
			// Light from below leans the other way to point at the same spot.
			follow((x - 0.5) * (settings.origin === "bottom" ? 10 : -10));
		},
		{ signal },
	);
	host.addEventListener("pointerleave", () => follow(0), { signal });

	const visibility = trackVisibility(host, (ratio) => {
		visible = ratio > 0;
		syncPause();
	});
	syncPause();

	const stopMotion = onMotionPreferenceChange(() => {
		mode = readMotionMode();
		applyLook();
		syncPause();
	});
	host.dataset.ready = "";

	return {
		setConfig(next) {
			settings = conicRaysConfigSchema.parse(next ?? {});
			applyLook();
		},
		destroy() {
			cancel.abort();
			stopFrame?.();
			stopTheme();
			stopMotion();
			visibility.dispose();
			created.forEach((node) => node.remove());
			source?.style.removeProperty("--lean");
			host.removeAttribute("data-paused");
			delete host.dataset.ready;
		},
	};
}
