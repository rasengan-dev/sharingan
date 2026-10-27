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
import { curveReelConfigSchema, type CurveReelConfig, type CurveReelConfigInput } from "./schema";
import { CURVE_REEL_STYLE_ID, curveReelStyles } from "./styles";

/**
 * Markup the engine expects inside the host:
 * - `[data-sg-reel]` holding the `[data-sg-card]` elements (links or focusable
 *   elements, each with an image), in the order they pass;
 * - optionally `[data-sg-step]` elements (`data-card` = the card that lights them).
 */

type Pose = { x: number; z: number; ry: number; opacity: number };

const ASPECT = 1.3; // card height / width, as in styles.ts
const DRAG_SLOP = 6; // pixels before a press on a card becomes a drag
const MAX_FLING = 8; // cards per second

const wrap = (value: number, size: number) => ((value % size) + size) % size;
/** `value` wrapped into [-size/2, size/2): the shortest way round. */
const around = (value: number, size: number) => wrap(value + size / 2, size) - size / 2;

/** Curve reel (Sharingan, DOM). A strip of cards on the inside of a curved wall, turning slowly. */
export function createCurveReel({ host, config }: DomHeroOptions<CurveReelConfigInput>): DomHero<CurveReelConfigInput> {
	adoptStyles(host, CURVE_REEL_STYLE_ID, curveReelStyles);
	host.classList.add("sg-cr");

	const reel = host.querySelector<HTMLElement>("[data-sg-reel]");
	const originals = reel ? [...reel.querySelectorAll<HTMLElement>("[data-sg-card]")] : [];
	if (!reel || originals.length === 0) {
		host.dataset.ready = "";
		return { setConfig() {}, destroy() {} };
	}

	let settings: CurveReelConfig = curveReelConfigSchema.parse(config ?? {});
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

	reel.classList.add("sg-cr-reel");
	originals.forEach((card) => card.classList.add("sg-cr-card"));
	const steps = [...host.querySelectorAll<HTMLElement>("[data-sg-step]")];
	steps.forEach((step) => step.classList.add("sg-cr-step"));

	// Cards on the reel: the originals, then copies so the loop never shows a gap.
	let items: HTMLElement[] = [...originals];
	const clones: HTMLElement[] = [];
	const fillLoop = () => {
		const needed = settings.visible + 4;
		if (items.length >= needed && clones.length === 0) return;
		clones.splice(0).forEach((clone) => clone.remove());
		items = [...originals];
		while (items.length < needed) {
			for (const card of originals) {
				const clone = card.cloneNode(true) as HTMLElement;
				clone.removeAttribute("id");
				// Clickable like the card it copies, but out of the tab order and of the accessibility tree.
				clone.setAttribute("aria-hidden", "true");
				clone.tabIndex = -1;
				clone.querySelectorAll<HTMLElement>("a, button, [tabindex]").forEach((inner) => (inner.tabIndex = -1));
				clone.dataset.sgClone = "";
				reel.append(clone);
				clones.push(clone);
				items.push(clone);
			}
		}
	};

	// Steps: each lights up while the cards from its own to the next step's pass the middle.
	const stepCards = () =>
		steps.map((step, index) => {
			const asked = Number(step.dataset.card);
			return Number.isInteger(asked) && asked >= 0 ? asked % originals.length : Math.round((index * originals.length) / steps.length);
		});

	const applyLook = () => {
		host.dataset.motion = mode;
		host.style.setProperty("--sg-cr-accent", settings.accent);
		if (settings.steps) delete host.dataset.steps;
		else host.dataset.steps = "off";
		reel.toggleAttribute("data-draggable", settings.drag && mode === "ready");
	};
	applyLook();

	/*
	 * Geometry: the cards stand on the inside of a curved wall, an elliptic arc
	 * x = a·sin φ, z = zc + b·(1 − cos φ), seen from in front of it. They are
	 * spaced by length along the arc, so the gaps between them stay even and
	 * shrink with the cards. Angles in radians, lengths in pixels.
	 */
	const SAMPLES = 240;
	const MAX_PHI = 1.45;
	const arc = new Float64Array(SAMPLES + 1);
	const geo = { half: 0, a: 0, b: 0, zc: 0, perspective: 1000, card: 0, pitch: 1, edge: 3, spacing: 1 };
	const lengthAt = (phi: number) => Math.hypot(geo.a * Math.cos(phi), geo.b * Math.sin(phi));
	const phiAt = (distance: number) => {
		// Inverse of the arc length table, by bisection then a straight line between samples.
		let low = 0;
		let high = SAMPLES;
		if (distance >= arc[SAMPLES]) return MAX_PHI;
		while (high - low > 1) {
			const middle = (low + high) >> 1;
			if (arc[middle] <= distance) low = middle;
			else high = middle;
		}
		const part = (distance - arc[low]) / (arc[high] - arc[low] || 1);
		return ((low + part) / SAMPLES) * MAX_PHI;
	};

	let measured = "";
	const measure = (force = false) => {
		const width = reel.clientWidth;
		const key = `${width}x${window.innerHeight}`;
		if (!force && key === measured) return false;
		measured = key;
		const curve = settings.curvature;
		// Phones: the arc is wider than the screen, the outer cards bleed off and stay readable.
		const visible = width < 640 ? Math.min(settings.visible, 5) : settings.visible;
		const span = Math.max(width, 520);
		geo.edge = (visible - 1) / 2;
		geo.half = ((20 + 45 * curve) * Math.PI) / 180;
		// The edge cards come forward by a share of the eye's distance; the middle ones are `contrast` times smaller.
		const forward = 0.3 * curve;
		const contrast = 1 + 0.8 * curve;
		const edgeScale = 1 / (1 - forward);
		// The edge cards reach the sides, unless that would make them taller than 40% of the screen.
		geo.a = span / 2 / (edgeScale * Math.sin(geo.half));
		// A little deeper than a circle: the middle cards face the viewer, the turn grows toward the edges.
		geo.b = geo.a * (0.8 + 1.2 * curve);
		const depth = geo.b * (1 - Math.cos(geo.half));
		// The eye sits where that depth gives the wanted contrast (a long lens for a flat strip).
		geo.perspective = curve < 0.02 ? span * 3 : Math.min(span * 3, depth / ((contrast - 1) * (1 - forward)));
		geo.zc = forward * geo.perspective - depth;
		const fill = () => {
			for (let index = 1, total = 0; index <= SAMPLES; index++) {
				const phi = ((index - 0.5) / SAMPLES) * MAX_PHI;
				total += (lengthAt(phi) * MAX_PHI) / SAMPLES;
				arc[index] = total;
			}
			geo.pitch = phiToArc(geo.half) / geo.edge;
			geo.card = geo.pitch / 1.07;
		};
		fill();
		// Too tall: shrink the whole scene, eye included, so the picture keeps its shape.
		const shrink = Math.min(1, Math.min(540, window.innerHeight * 0.4) / (geo.card * ASPECT * edgeScale));
		if (shrink < 1) {
			geo.a *= shrink;
			geo.b *= shrink;
			geo.zc *= shrink;
			geo.perspective *= shrink;
			fill();
		}
		geo.spacing = Math.max(1, geo.pitch * (geo.perspective / (geo.perspective - geo.zc)));
		const reelHeight = Math.ceil(geo.card * ASPECT * edgeScale + 16);
		reel.style.height = `${reelHeight}px`;
		host.style.setProperty("--sg-cr-card", `${geo.card.toFixed(1)}px`);
		// Room under the cards next to the middle, where the steps sit.
		const near = pose(Math.min(2, geo.edge - 1));
		const nearHalf = (geo.card * (ASPECT / 2) * geo.perspective) / (geo.perspective - near.z);
		host.style.setProperty("--sg-cr-hollow", `${Math.max(0, reelHeight / 2 - nearHalf).toFixed(1)}px`);
		return true;
	};
	const phiToArc = (phi: number) => {
		const at = (phi / MAX_PHI) * SAMPLES;
		const low = Math.floor(at);
		return low >= SAMPLES ? arc[SAMPLES] : arc[low] + (arc[low + 1] - arc[low]) * (at - low);
	};

	/** Where a card rests, `slot` cards away from the middle (fractions included). */
	const pose = (slot: number): Pose => {
		const phi = Math.sign(slot) * phiAt(Math.abs(slot) * geo.pitch);
		// The card follows the wall: it turns by the slope of the arc where it stands.
		const slope = (geo.b * Math.sin(phi)) / (geo.a * Math.cos(phi));
		const z = geo.zc + geo.b * (1 - Math.cos(phi));
		// Past the edges the cards fade before they could reach the eye.
		const beyond = Math.max(Math.abs(slot) - geo.edge - 0.8, (z - geo.perspective * 0.6) / (geo.perspective * 0.15));
		return {
			x: geo.a * Math.sin(phi),
			z,
			ry: (-Math.atan(slope) * 180) / Math.PI,
			opacity: Math.abs(phi) >= MAX_PHI ? 0 : Math.max(0, Math.min(1, 1 - beyond)),
		};
	};

	// Motion state, in cards: `offset` is the card in the middle.
	let offset = 0;
	let velocity = 0;
	let target: number | null = null;
	let hovering = false;
	let focusInside = false;
	let dragging = false;
	const tilt = { x: 0, y: 0, goalX: 0, goalY: 0 };

	const paint = () => {
		const count = items.length;
		const perspective = geo.perspective.toFixed(0);
		const lean = `rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg)`;
		items.forEach((card, index) => {
			const at = pose(around(index - offset, count));
			card.style.transform = `perspective(${perspective}px) ${lean} translate3d(${at.x.toFixed(1)}px, 0, ${at.z.toFixed(1)}px) rotateY(${at.ry.toFixed(2)}deg)`;
			card.style.opacity = at.opacity.toFixed(3);
			// Faded cards stay focusable: focus brings them back to the middle.
			card.style.pointerEvents = at.opacity > 0.05 ? "" : "none";
			card.style.zIndex = String(Math.round(at.z + 2000));
		});
		paintSteps();
	};

	const paintSteps = () => {
		if (steps.length === 0) return;
		const count = originals.length;
		const where = wrap(offset, count);
		const starts = stepCards();
		const order = starts.map((card, index) => ({ card, index })).sort((left, right) => left.card - right.card);
		let active = order[order.length - 1];
		for (const entry of order) if (entry.card <= where) active = entry;
		const position = order.indexOf(active);
		const next = order[(position + 1) % order.length];
		const length = wrap(next.card - active.card, count) || count;
		const progress = Math.min(1, wrap(where - active.card, count) / length);
		steps.forEach((step, index) => {
			const on = index === active.index;
			step.toggleAttribute("data-active", on);
			if (on) step.style.setProperty("--sg-cr-progress", progress.toFixed(3));
			else step.style.removeProperty("--sg-cr-progress");
		});
	};

	// The loop: cruise, glide to a focused card, or coast after a fling. Runs only while it can be seen.
	let stopLoop: (() => void) | null = null;
	const frame = (_time: number, delta: number) => {
		tilt.x += (tilt.goalX - tilt.x) * Math.min(1, delta * 4);
		tilt.y += (tilt.goalY - tilt.y) * Math.min(1, delta * 4);
		if (!dragging) {
			if (target !== null) {
				offset += (target - offset) * Math.min(1, delta * 6);
				if (Math.abs(target - offset) < 0.001) offset = target;
				velocity = 0;
			} else {
				const cruise = focusInside ? 0 : (settings.speed / 60) * (hovering ? 0.25 : 1);
				velocity += (cruise - velocity) * Math.min(1, delta * 2.2);
				offset += velocity * delta;
			}
		}
		offset = wrap(offset, items.length);
		if (target !== null) target = offset + around(target - offset, items.length);
		paint();
	};
	const syncLoop = () => {
		const run = mode === "ready" && !host.dataset.intro && visibility.state.ratio > 0;
		if (run && !stopLoop) stopLoop = addFrame(frame);
		if (!run && stopLoop) {
			stopLoop();
			stopLoop = null;
		}
	};

	/** Brings an item to the middle: glides when animating, jumps otherwise. */
	const center = (index: number) => {
		const goal = offset + around(index - offset, items.length);
		if (stopLoop) target = goal;
		else {
			offset = wrap(goal, items.length);
			target = null;
			paint();
		}
	};

	// Pointer: the view leans toward it; over the reel the cruise slows down.
	host.addEventListener(
		"pointermove",
		(event) => {
			if (event.pointerType === "touch" || mode !== "ready") return;
			const box = host.getBoundingClientRect();
			const nx = Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width) * 2 - 1));
			const ny = Math.max(-1, Math.min(1, ((event.clientY - box.top) / box.height) * 2 - 1));
			tilt.goalY = nx * settings.tilt;
			tilt.goalX = -ny * settings.tilt * 0.6;
		},
		{ signal },
	);
	host.addEventListener("pointerleave", () => ((tilt.goalX = 0), (tilt.goalY = 0)), { signal });
	reel.addEventListener("pointerenter", (event) => event.pointerType !== "touch" && (hovering = true), { signal });
	reel.addEventListener("pointerleave", () => (hovering = false), { signal });

	// Drag: the reel follows the pointer, then keeps its momentum. A press that does not move stays a click.
	let press: { id: number; x: number; time: number; moved: boolean } | null = null;
	let fling = 0;
	let swallowClick = false;
	reel.addEventListener(
		"pointerdown",
		(event) => {
			if (!settings.drag || mode !== "ready" || event.button !== 0) return;
			press = { id: event.pointerId, x: event.clientX, time: event.timeStamp, moved: false };
			fling = 0;
		},
		{ signal },
	);
	reel.addEventListener(
		"pointermove",
		(event) => {
			if (!press || event.pointerId !== press.id) return;
			const dx = event.clientX - press.x;
			if (!press.moved) {
				if (Math.abs(dx) < DRAG_SLOP) return;
				press.moved = true;
				dragging = true;
				target = null;
				reel.setPointerCapture(event.pointerId);
				reel.dataset.dragging = "";
			}
			const moved = -dx / geo.spacing;
			const elapsed = Math.max(1, event.timeStamp - press.time) / 1000;
			fling += (moved / elapsed - fling) * 0.5;
			offset += moved;
			press.x = event.clientX;
			press.time = event.timeStamp;
			if (!stopLoop) paint();
		},
		{ signal },
	);
	const release = (event: PointerEvent) => {
		if (!press || event.pointerId !== press.id) return;
		if (press.moved) {
			swallowClick = true;
			later(0, () => (swallowClick = false));
			velocity = Math.max(-MAX_FLING, Math.min(MAX_FLING, fling));
			delete reel.dataset.dragging;
		}
		dragging = false;
		press = null;
	};
	reel.addEventListener("pointerup", release, { signal });
	reel.addEventListener("pointercancel", release, { signal });
	reel.addEventListener("click", (event) => swallowClick && (event.preventDefault(), event.stopPropagation()), { capture: true, signal });
	reel.addEventListener("dragstart", (event) => event.preventDefault(), { signal });

	// Keyboard: a focused card comes to the middle and the reel waits; arrows walk the cards.
	reel.addEventListener(
		"focusin",
		(event) => {
			const index = items.indexOf((event.target as Element).closest("[data-sg-card]") as HTMLElement);
			if (index < 0) return;
			focusInside = true;
			center(index);
		},
		{ signal },
	);
	reel.addEventListener(
		"focusout",
		(event) => {
			if (reel.contains(event.relatedTarget as Node)) return;
			focusInside = false;
			target = null;
		},
		{ signal },
	);
	reel.addEventListener(
		"keydown",
		(event) => {
			if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
			const from = originals.indexOf((event.target as Element).closest("[data-sg-card]") as HTMLElement);
			if (from < 0) return;
			event.preventDefault();
			originals[wrap(from + (event.key === "ArrowRight" ? 1 : -1), originals.length)].focus({ preventScroll: true });
		},
		{ signal },
	);

	// Entrance: stacked in the middle, then opened onto the curve from the middle outward.
	const stack = () => {
		items.forEach((card, index) => {
			const slot = around(index - offset, items.length);
			card.style.transform = `perspective(${geo.perspective.toFixed(0)}px) translate3d(0, ${(geo.card * 0.1).toFixed(1)}px, ${geo.zc.toFixed(1)}px) rotateZ(${(slot * 1.5).toFixed(1)}deg) scale(.92)`;
			card.style.opacity = Math.abs(slot) <= 2 ? "1" : "0";
			card.style.zIndex = String(100 - Math.round(Math.abs(slot)));
		});
	};
	const play = () => {
		host.dataset.intro = "opening";
		requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				if (signal.aborted) return;
				items.forEach((card, index) => card.style.setProperty("--sg-cr-delay", `${Math.round(Math.min(6, Math.abs(around(index - offset, items.length))) * 70)}ms`));
				paint();
				later(1300, () => {
					items.forEach((card) => card.style.removeProperty("--sg-cr-delay"));
					delete host.dataset.intro;
					syncLoop();
				});
			}),
		);
	};
	const visibility = trackVisibility(host, (ratio) => {
		if (host.dataset.intro === "pending" && ratio >= 0.3) play();
		syncLoop();
	});

	// Only a new width (or screen height) changes the geometry; the engine sets the reel's height itself.
	const remeasure = () => {
		if (!measure()) return;
		if (host.dataset.intro === "pending") stack();
		else paint();
	};
	const resize = new ResizeObserver(remeasure);
	resize.observe(reel);
	window.addEventListener("resize", remeasure, { signal });

	fillLoop();
	// Start with the middle card of the originals in the middle, so the first look is balanced.
	offset = Math.floor(originals.length / 2);
	measure();
	if (mode === "ready" && settings.intro) {
		host.dataset.intro = "pending";
		stack();
	} else paint();
	host.dataset.ready = "";

	const stopMotion = onMotionPreferenceChange(() => {
		mode = readMotionMode();
		applyLook();
		if (mode !== "ready") {
			delete host.dataset.intro;
			tilt.x = tilt.y = tilt.goalX = tilt.goalY = 0;
			paint();
		}
		syncLoop();
	});

	return {
		setConfig(next) {
			settings = curveReelConfigSchema.parse(next ?? {});
			applyLook();
			fillLoop();
			measure(true);
			if (host.dataset.intro !== "pending") paint();
		},
		destroy() {
			cancel.abort();
			stopLoop?.();
			stopMotion();
			visibility.dispose();
			resize.disconnect();
			timers.forEach((timer) => window.clearTimeout(timer));
			clones.forEach((clone) => clone.remove());
			for (const card of originals) {
				for (const name of ["transform", "opacity", "pointer-events", "z-index", "--sg-cr-delay"]) card.style.removeProperty(name);
			}
			for (const step of steps) {
				step.removeAttribute("data-active");
				step.style.removeProperty("--sg-cr-progress");
			}
			reel.style.removeProperty("height");
			reel.removeAttribute("data-draggable");
			for (const name of ["--sg-cr-accent", "--sg-cr-card", "--sg-cr-hollow"]) host.style.removeProperty(name);
			delete host.dataset.intro;
			delete host.dataset.steps;
			delete host.dataset.ready;
		},
	};
}
