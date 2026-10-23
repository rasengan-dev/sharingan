import { adoptStyles, onMotionPreferenceChange, readMotionMode, trackVisibility, type DomHero, type DomHeroOptions, type MotionMode } from "@/lib/sharingan";
import { beamGridConfigSchema, type BeamGridConfig, type BeamGridConfigInput } from "./schema";
import { BEAM_GRID_STYLE_ID, beamGridStyles } from "./styles";

/**
 * Markup the engine expects inside the host: the hero's copy, and
 * optionally an empty `[data-sg-layer]` (with a `.sg-bm-grid` inside, so
 * the grid shows before the script runs). Missing parts are added.
 */

type Axis = "x" | "y";
type Beam = { node: HTMLElement; animation: Animation | null };

const BASE_SPEED = 380; // px per second at speed 1
// The same sequence of beams on every load: `?motion=final` and replays match.
const hash = (n: number) => {
	const x = Math.sin(n * 78.233 + 1.7) * 43758.5453;
	return x - Math.floor(x);
};

/** Beam grid (Sharingan, DOM). Light runs along the lines of a grid. */
export function createBeamGrid({ host, config }: DomHeroOptions<BeamGridConfigInput>): DomHero<BeamGridConfigInput> {
	adoptStyles(host, BEAM_GRID_STYLE_ID, beamGridStyles);
	host.classList.add("sg-bm");

	let settings: BeamGridConfig = beamGridConfigSchema.parse(config ?? {});
	let mode: MotionMode = readMotionMode();
	const cancel = new AbortController();
	const { signal } = cancel;
	const created: Element[] = [];

	// Layers
	let layer = host.querySelector<HTMLElement>("[data-sg-layer]");
	if (!layer) {
		layer = document.createElement("div");
		layer.dataset.sgLayer = "";
		host.prepend(layer);
		created.push(layer);
	}
	layer.classList.add("sg-bm-layer");
	layer.setAttribute("aria-hidden", "true");
	if (!layer.querySelector(".sg-bm-grid")) {
		const grid = document.createElement("div");
		grid.className = "sg-bm-grid";
		layer.append(grid);
		created.push(grid);
	}
	const spot = document.createElement("div");
	spot.className = "sg-bm-spot";
	const beamsLayer = document.createElement("div");
	layer.append(spot, beamsLayer);
	created.push(spot, beamsLayer);

	const applyLook = () => {
		settings.colors.forEach((color, index) => host.style.setProperty(`--sg-bm-c${index}`, color));
		host.style.setProperty("--cell", `${settings.cell}px`);
		host.style.setProperty("--calm", String(settings.calm));
		host.dataset.motion = mode;
	};
	applyLook();

	// Where the lines are: the grid is tiled from the centre, like `background-position: center`.
	let width = 0;
	let height = 0;
	const lines = (axis: Axis) => {
		const size = axis === "x" ? height : width;
		const cell = settings.cell;
		const first = (((size - cell) / 2) % cell + cell) % cell;
		const positions: number[] = [];
		for (let at = first; at <= size; at += cell) positions.push(at);
		return positions;
	};

	// Beams
	const beams = new Set<Beam>();
	let seed = 0;
	const makeBeam = (axis: Axis, line: number, back: boolean, color: string) => {
		const node = document.createElement("span");
		node.className = "sg-bm-beam";
		node.dataset.axis = axis;
		if (back) node.dataset.back = "";
		node.style.setProperty("--c", color);
		const length = settings.length;
		if (axis === "x") Object.assign(node.style, { width: `${length}px`, top: `${line}px` });
		else Object.assign(node.style, { height: `${length}px`, left: `${line}px` });
		beamsLayer.append(node);
		const beam: Beam = { node, animation: null };
		beams.add(beam);
		return beam;
	};
	const remove = (beam: Beam) => {
		beam.animation?.cancel();
		beam.node.remove();
		beams.delete(beam);
	};

	/** Runs a beam from `from` to `to` along its line (pixels along the axis, head position). */
	const run = (beam: Beam, axis: Axis, from: number, to: number, onDone?: () => void) => {
		const length = settings.length;
		const back = to < from;
		// The head leads: the bar starts `length` behind it.
		const start = back ? from : from - length;
		const end = back ? to - length : to;
		const move = (at: number) => (axis === "x" ? `translate3d(${at}px, 0, 0)` : `translate3d(0, ${at}px, 0)`);
		const duration = (Math.abs(end - start) / (BASE_SPEED * settings.speed)) * 1000;
		beam.animation = beam.node.animate([{ transform: move(start) }, { transform: move(end) }], { duration, easing: "linear" });
		beam.animation.onfinish = () => {
			remove(beam);
			onDone?.();
		};
		if (!visible) beam.animation.pause();
	};

	const colorAt = (n: number) => `var(--sg-bm-c${Math.floor(hash(n + 11) * settings.colors.length) % settings.colors.length})`;

	/** One idle beam across the whole hero, then another after a pause. */
	const spawn = () => {
		if (signal.aborted || mode !== "ready" || beams.size >= settings.beams * 2) return;
		const n = seed++;
		const axis: Axis = hash(n) < 0.6 ? "x" : "y";
		const options = lines(axis);
		if (!options.length) return;
		const line = options[Math.floor(hash(n + 3) * options.length)];
		const back = hash(n + 5) < 0.5;
		const span = axis === "x" ? width : height;
		const beam = makeBeam(axis, line, back, colorAt(n));
		run(beam, axis, back ? span + settings.length : -settings.length, back ? -settings.length : span + settings.length, () => {
			const pause = 200 + hash(n + 9) * 1600;
			later(pause, spawn);
		});
	};

	const timers = new Set<number>();
	const later = (ms: number, task: () => void) => {
		const timer = window.setTimeout(() => {
			timers.delete(timer);
			task();
		}, ms);
		timers.add(timer);
	};

	/** Still modes: a few beams resting on their lines, the same every time. */
	const placeStill = () => {
		[...beams].forEach(remove);
		for (let n = 0; n < settings.beams; n++) {
			const axis: Axis = hash(n) < 0.6 ? "x" : "y";
			const options = lines(axis);
			if (!options.length) continue;
			const line = options[Math.floor(hash(n + 3) * options.length)];
			const span = axis === "x" ? width : height;
			const beam = makeBeam(axis, line, false, colorAt(n));
			const at = hash(n + 7) * Math.max(0, span - settings.length);
			beam.node.style.transform = axis === "x" ? `translate3d(${at}px, 0, 0)` : `translate3d(0, ${at}px, 0)`;
		}
	};

	let visible = false;
	let started = false;
	const start = () => {
		if (started || mode !== "ready") return;
		started = true;
		for (let i = 0; i < settings.beams; i++) later(i * 380, spawn);
	};
	const visibility = trackVisibility(host, (ratio) => {
		visible = ratio > 0;
		beams.forEach((beam) => (visible ? beam.animation?.play() : beam.animation?.pause()));
		if (visible) start();
	});

	// Pointer: brighter grid around it; a click sends four beams from the nearest crossing
	host.addEventListener(
		"pointermove",
		(event) => {
			if (!settings.pointer) return;
			const box = host.getBoundingClientRect();
			host.style.setProperty("--mx", `${event.clientX - box.left}px`);
			host.style.setProperty("--my", `${event.clientY - box.top}px`);
			host.toggleAttribute("data-pointer-in", true);
		},
		{ signal },
	);
	host.addEventListener("pointerleave", () => host.removeAttribute("data-pointer-in"), { signal });
	host.addEventListener(
		"click",
		(event) => {
			if (!settings.pointer || mode !== "ready" || (event.target as Element).closest("a, button")) return;
			const box = host.getBoundingClientRect();
			const nearest = (positions: number[], value: number) => positions.reduce((best, at) => (Math.abs(at - value) < Math.abs(best - value) ? at : best), positions[0]);
			const x = nearest(lines("y"), event.clientX - box.left);
			const y = nearest(lines("x"), event.clientY - box.top);
			if (x === undefined || y === undefined) return;
			const n = seed++;
			run(makeBeam("x", y, false, colorAt(n)), "x", x, width + settings.length);
			run(makeBeam("x", y, true, colorAt(n + 1)), "x", x, -settings.length);
			run(makeBeam("y", x, false, colorAt(n + 2)), "y", y, height + settings.length);
			run(makeBeam("y", x, true, colorAt(n + 3)), "y", y, -settings.length);
		},
		{ signal },
	);

	const measure = () => {
		width = host.clientWidth;
		height = host.clientHeight;
		if (mode !== "ready") placeStill();
	};
	const resize = new ResizeObserver(measure);
	resize.observe(host);
	measure();

	const stopMotion = onMotionPreferenceChange(() => {
		mode = readMotionMode();
		applyLook();
		if (mode !== "ready") placeStill();
		else {
			[...beams].forEach(remove);
			started = false;
			if (visible) start();
		}
	});
	host.dataset.ready = "";

	return {
		setConfig(next) {
			settings = beamGridConfigSchema.parse(next ?? {});
			applyLook();
			if (mode !== "ready") placeStill();
		},
		destroy() {
			cancel.abort();
			stopMotion();
			visibility.dispose();
			resize.disconnect();
			timers.forEach((timer) => window.clearTimeout(timer));
			[...beams].forEach(remove);
			created.forEach((node) => node.remove());
			host.removeAttribute("data-pointer-in");
			delete host.dataset.ready;
		},
	};
}
