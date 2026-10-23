import {
	addFrame,
	adoptStyles,
	onMotionPreferenceChange,
	readMotionMode,
	trackVisibility,
	type DomHero,
	type DomHeroOptions,
	type MotionMode,
} from "@/lib/sharingan";
import { appWindowConfigSchema, type AppWindowConfig, type AppWindowConfigInput } from "./schema";
import { APP_WINDOW_STYLE_ID, appWindowStyles } from "./styles";

/**
 * Markup the engine expects inside the host:
 * - `[data-sg-window]`, the screen, holding `[data-sg-panel]` parts that build in document order
 *   (`data-depth` 0–3 sets how far a panel shifts with the pointer);
 * - `[data-sg-count]` values that count up, `[data-sg-row]` table rows that arrive one by one;
 * - a `[data-sg-chart]` with an `<svg>`, or with `data-points="1,4,2,…"` for the engine to draw it.
 */

const VIEW = { width: 100, height: 40 };

/** A smooth line through the points (and the area under it), in a 100×40 box. */
export function chartPaths(points: number[]) {
	const min = Math.min(...points);
	const max = Math.max(...points);
	const span = max - min || 1;
	const xy = points.map((value, index) => [
		(index / (points.length - 1)) * VIEW.width,
		VIEW.height - 3 - ((value - min) / span) * (VIEW.height - 6),
	]);
	let line = `M${xy[0][0].toFixed(2)} ${xy[0][1].toFixed(2)}`;
	for (let i = 0; i < xy.length - 1; i++) {
		// Catmull-Rom through each point, written as cubic Béziers.
		const [p0, p1, p2, p3] = [xy[i - 1] ?? xy[i], xy[i], xy[i + 1], xy[i + 2] ?? xy[i + 1]];
		const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
		const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
		line += ` C${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
	}
	const area = `${line} L${VIEW.width} ${VIEW.height} L0 ${VIEW.height} Z`;
	return { line, area, viewBox: `0 0 ${VIEW.width} ${VIEW.height}` };
}

/** "1.2M" → [prefix "", 1.2, decimals 1, suffix "M"]; values that do not start with a number are left alone. */
function parseCount(text: string) {
	const match = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/.exec(text.trim());
	if (!match) return null;
	const number = Number(match[2].replace(/,/g, ""));
	const decimals = match[2].split(".")[1]?.length ?? 0;
	return { prefix: match[1], number, decimals, suffix: match[3], grouped: match[2].includes(",") };
}

/** App window (Sharingan, DOM). A product screen that builds itself, then leans toward the pointer. */
export function createAppWindow({ host, config }: DomHeroOptions<AppWindowConfigInput>): DomHero<AppWindowConfigInput> {
	adoptStyles(host, APP_WINDOW_STYLE_ID, appWindowStyles);
	host.classList.add("sg-aw");

	const win = host.querySelector<HTMLElement>("[data-sg-window]");
	if (!win) {
		host.dataset.ready = "";
		return { setConfig() {}, destroy() {} };
	}

	let settings: AppWindowConfig = appWindowConfigSchema.parse(config ?? {});
	let mode: MotionMode = readMotionMode();
	const cancel = new AbortController();
	const { signal } = cancel;
	const timers = new Set<number>();
	const later = (ms: number, run: () => void) => {
		const timer = window.setTimeout(() => {
			timers.delete(timer);
			run();
		}, ms);
		timers.add(timer);
	};

	win.classList.add("sg-aw-window");
	win.parentElement?.classList.add("sg-aw-stage");
	const panels = [...win.querySelectorAll<HTMLElement>("[data-sg-panel]")];
	win.querySelectorAll<HTMLElement>("[data-sg-row]").forEach((row, index) => row.style.setProperty("--r", String(index)));

	// Charts given as data
	const drawn: Element[] = [];
	for (const chart of win.querySelectorAll<HTMLElement>("[data-sg-chart][data-points]")) {
		if (chart.querySelector("svg")) continue;
		const points = (chart.dataset.points ?? "").split(",").map(Number).filter(Number.isFinite);
		if (points.length < 2) continue;
		const { line, area, viewBox } = chartPaths(points);
		chart.insertAdjacentHTML(
			"beforeend",
			`<svg viewBox="${viewBox}" preserveAspectRatio="none" aria-hidden="true"><path class="sg-aw-grid" d="M0 13H100M0 26H100"/><path class="sg-aw-area" d="${area}"/><path class="sg-aw-line" d="${line}"/></svg>`,
		);
		drawn.push(chart.lastElementChild!);
	}

	// A glare layer for the light
	const glare = document.createElement("span");
	glare.className = "sg-aw-glare";
	glare.setAttribute("aria-hidden", "true");
	win.append(glare);

	const applyLook = () => {
		host.style.setProperty("--sg-aw-accent", settings.accent);
		host.dataset.motion = mode;
	};
	applyLook();

	// Counting up
	const counters = [...win.querySelectorAll<HTMLElement>("[data-sg-count]")].map((node) => ({ node, text: node.textContent ?? "", parsed: parseCount(node.textContent ?? "") }));
	const countUp = (panel: HTMLElement) => {
		for (const counter of counters) {
			if (!counter.parsed || !panel.contains(counter.node)) continue;
			const { prefix, number, decimals, suffix, grouped } = counter.parsed;
			const format = (value: number) =>
				prefix + (grouped ? value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : value.toFixed(decimals)) + suffix;
			const started = performance.now();
			const step = (now: number) => {
				if (signal.aborted) return;
				const t = Math.min(1, (now - started) / 1000);
				const eased = 1 - (1 - t) ** 3;
				counter.node.textContent = t < 1 ? format(number * eased) : counter.text;
				if (t < 1) requestAnimationFrame(step);
			};
			counter.node.textContent = format(0);
			requestAnimationFrame(step);
		}
	};

	// Building
	let built = false;
	const buildAll = () => {
		panels.forEach((panel) => panel.classList.add("is-built"));
		counters.forEach((counter) => (counter.node.textContent = counter.text));
		built = true;
	};
	const build = () => {
		host.dataset.build = "";
		panels.forEach((panel, index) => {
			later(250 + index * settings.stagger, () => {
				panel.classList.add("is-built");
				if (settings.countUp) countUp(panel);
			});
		});
		later(250 + panels.length * settings.stagger + 1400, () => {
			built = true;
			sync();
		});
	};

	// Pointer: the window leans, its panels shift at their depth
	const depths = panels.map((panel) => Number(panel.dataset.depth ?? 0));
	const target = { rx: 0, ry: 0, x: 0.5, y: 0.5, gx: 50, gy: 0 };
	const current = { ...target };
	let inside = false;
	host.addEventListener(
		"pointermove",
		(event) => {
			if (event.pointerType !== "mouse") return;
			const box = win.getBoundingClientRect();
			const x = Math.min(1.2, Math.max(-0.2, (event.clientX - box.left) / box.width));
			const y = Math.min(1.2, Math.max(-0.2, (event.clientY - box.top) / box.height));
			inside = true;
			Object.assign(target, { rx: (0.5 - y) * 7, ry: (x - 0.5) * 9, x, y, gx: x * 100, gy: y * 100 });
		},
		{ signal },
	);
	host.addEventListener(
		"pointerleave",
		() => {
			inside = false;
			Object.assign(target, { rx: 0, ry: 0, x: 0.5, y: 0.5, gx: 50, gy: 0 });
		},
		{ signal },
	);

	const paint = () => {
		win.style.setProperty("--rx", current.rx.toFixed(2));
		win.style.setProperty("--ry", current.ry.toFixed(2));
		win.style.setProperty("--gx", current.gx.toFixed(1));
		win.style.setProperty("--gy", current.gy.toFixed(1));
		panels.forEach((panel, index) => {
			const depth = depths[index];
			if (!depth) return;
			panel.style.translate = `${((current.x - 0.5) * depth * 7).toFixed(2)}px ${((current.y - 0.5) * depth * 5).toFixed(2)}px`;
		});
	};

	const frame = (_time: number, delta: number) => {
		const ease = 1 - Math.exp(-delta * 7);
		let moving = false;
		for (const key of Object.keys(target) as (keyof typeof target)[]) {
			const gap = target[key] - current[key];
			current[key] += gap * ease;
			if (Math.abs(gap) > 0.01) moving = true;
		}
		paint();
		if (!moving && !inside) stop();
	};

	let stopFrame: (() => void) | null = null;
	const stop = () => {
		stopFrame?.();
		stopFrame = null;
	};
	const sync = () => {
		const run = settings.tilt && mode === "ready" && built && visibility.state.ratio > 0;
		if (run && !stopFrame && inside) stopFrame = addFrame(frame);
		if (!run) stop();
	};
	host.addEventListener("pointerenter", () => sync(), { signal });
	host.addEventListener("pointermove", () => !stopFrame && sync(), { signal });

	// Start building the first time the window is well on screen
	let started = false;
	const visibility = trackVisibility(host, (ratio) => {
		if (!started && mode === "ready" && ratio >= 0.35) {
			started = true;
			build();
		}
		sync();
	});

	if (mode === "ready") host.dataset.build = "";
	else buildAll();
	host.dataset.ready = "";

	const stopMotion = onMotionPreferenceChange(() => {
		mode = readMotionMode();
		applyLook();
		if (mode !== "ready") {
			timers.forEach((timer) => window.clearTimeout(timer));
			timers.clear();
			buildAll();
			Object.assign(current, { rx: 0, ry: 0, x: 0.5, y: 0.5, gx: 50, gy: 0 });
			paint();
		}
		sync();
	});

	return {
		setConfig(next) {
			settings = appWindowConfigSchema.parse(next ?? {});
			applyLook();
			sync();
		},
		destroy() {
			cancel.abort();
			stop();
			stopMotion();
			visibility.dispose();
			timers.forEach((timer) => window.clearTimeout(timer));
			glare.remove();
			drawn.forEach((node) => node.remove());
			counters.forEach((counter) => (counter.node.textContent = counter.text));
			panels.forEach((panel) => {
				panel.classList.remove("is-built");
				panel.style.removeProperty("translate");
			});
			for (const name of ["--rx", "--ry", "--gx", "--gy"]) win.style.removeProperty(name);
			delete host.dataset.build;
			delete host.dataset.ready;
		},
	};
}
