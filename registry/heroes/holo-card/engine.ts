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
import { holoCardConfigSchema, type HoloCardConfig, type HoloCardConfigInput } from "./schema";
import { HOLO_CARD_STYLE_ID, holoCardStyles } from "./styles";

/**
 * Markup the engine expects inside the host:
 * - `[data-sg-card]`, holding `[data-sg-front]` and optionally `[data-sg-back]`;
 * - optionally `[data-sg-flip]`, the button that turns it over (added when missing).
 * The foil layers are added to each face when the markup does not bring them.
 */

type Pose = { rx: number; ry: number; px: number; py: number; glow: number; flip: number };

const AT_REST: Pose = { rx: 0, ry: 0, px: 65, py: 30, glow: 0.2, flip: 0 };
// `?motion=final`: a fixed, flattering angle for screenshots and posters.
const FINAL: Pose = { rx: -6, ry: 14, px: 72, py: 28, glow: 0.4, flip: 0 };
const TURN_ICON = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 8a5.5 5.5 0 0 1 9.6-3.7M13.5 8a5.5 5.5 0 0 1-9.6 3.7"/><path d="M12.5 1.8v2.8H9.7M3.5 14.2v-2.8h2.8"/></svg>`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type OrientationWithPermission = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };

/** Holo card (Sharingan, DOM). A foil card that leans toward the light and turns over. */
export function createHoloCard({ host, config }: DomHeroOptions<HoloCardConfigInput>): DomHero<HoloCardConfigInput> {
	adoptStyles(host, HOLO_CARD_STYLE_ID, holoCardStyles);
	host.classList.add("sg-hc");

	const card = host.querySelector<HTMLElement>("[data-sg-card]");
	if (!card) return { setConfig() {}, destroy() {} };

	let settings: HoloCardConfig = holoCardConfigSchema.parse(config ?? {});
	let mode: MotionMode = readMotionMode();
	const cancel = new AbortController();
	const { signal } = cancel;
	const created: Element[] = [];

	// Faces and foil
	card.classList.add("sg-hc-card");
	card.parentElement?.classList.add("sg-hc-stage");
	const front = card.querySelector<HTMLElement>("[data-sg-front]") ?? (card.firstElementChild as HTMLElement);
	const back = card.querySelector<HTMLElement>("[data-sg-back]");
	front.classList.add("sg-hc-face", "sg-hc-front");
	back?.classList.add("sg-hc-face", "sg-hc-back");
	for (const face of [front, back]) {
		if (!face || face.querySelector(".sg-hc-foil")) continue;
		for (const layer of ["sheen", "etch", "glare"]) {
			const node = document.createElement("span");
			node.className = `sg-hc-foil sg-hc-${layer}`;
			node.setAttribute("aria-hidden", "true");
			face.prepend(node);
			created.push(node);
		}
	}

	let flipButton = host.querySelector<HTMLButtonElement>("[data-sg-flip]");
	if (!flipButton) {
		flipButton = document.createElement("button");
		flipButton.type = "button";
		flipButton.dataset.sgFlip = "";
		flipButton.innerHTML = `${TURN_ICON}<span>Turn over</span>`;
		card.after(flipButton);
		created.push(flipButton);
	}
	flipButton.classList.add("sg-hc-flip");
	flipButton.setAttribute("aria-pressed", "false");

	// Look
	const applyLook = () => {
		const { colors } = settings;
		for (let i = 0; i < 4; i++) host.style.setProperty(`--sg-hc-c${i}`, colors[i % colors.length]);
		host.dataset.surface = settings.surface;
		host.dataset.pattern = settings.pattern;
		host.dataset.motion = mode;
		const flippable = settings.flip && back !== null;
		card.toggleAttribute("data-flippable", flippable);
		flipButton.hidden = !flippable;
	};
	applyLook();

	// Turning over
	let flipped = false;
	const setFlipped = (next: boolean) => {
		flipped = next;
		front.inert = flipped;
		front.setAttribute("aria-hidden", String(flipped));
		if (back) {
			back.inert = !flipped;
			back.setAttribute("aria-hidden", String(!flipped));
		}
		flipButton.setAttribute("aria-pressed", String(flipped));
		const label = flipButton.querySelector("span");
		if (label) label.textContent = flipped ? "Turn back" : "Turn over";
		target.flip = flipped ? 1 : 0;
		if (mode !== "ready") paint({ ...still(), flip: target.flip });
	};
	flipButton.addEventListener("click", () => setFlipped(!flipped), { signal });
	card.addEventListener(
		"click",
		(event) => {
			if (!card.hasAttribute("data-flippable") || (event.target as Element).closest("a, button")) return;
			setFlipped(!flipped);
		},
		{ signal },
	);

	// Pose: what the card is now, what it moves toward
	const current: Pose = { ...AT_REST };
	const target: Pose = { ...AT_REST };
	const paint = (pose: Pose) => {
		card.style.setProperty("--rx", pose.rx.toFixed(2));
		card.style.setProperty("--ry", pose.ry.toFixed(2));
		card.style.setProperty("--px", pose.px.toFixed(1));
		card.style.setProperty("--py", pose.py.toFixed(1));
		card.style.setProperty("--glow", pose.glow.toFixed(3));
		card.style.setProperty("--flip", pose.flip.toFixed(4));
	};
	const still = () => (mode === "final" ? FINAL : AT_REST);

	// Mouse and pen: lean toward the pointer
	let hovering = false;
	host.addEventListener(
		"pointermove",
		(event) => {
			if (event.pointerType === "touch" || !settings.tilt) return;
			const box = card.getBoundingClientRect();
			const x = clamp((event.clientX - box.left) / box.width, -0.25, 1.25);
			const y = clamp((event.clientY - box.top) / box.height, -0.25, 1.25);
			const over = x >= 0 && x <= 1 && y >= 0 && y <= 1;
			hovering = true;
			// Facing away when turned over: mirror the horizontal lean.
			const side = flipped ? -1 : 1;
			Object.assign(target, { rx: (0.5 - y) * 22, ry: side * (x - 0.5) * 30, px: x * 100, py: y * 100, glow: over ? 1 : 0.5 });
		},
		{ signal },
	);
	host.addEventListener("pointerleave", () => (hovering = false), { signal });

	// Phones: follow the device's tilt, relative to how it was held at first
	let tilted: { beta: number; gamma: number } | null = null;
	let base: { beta: number; gamma: number } | null = null;
	const orientation = (event: DeviceOrientationEvent) => {
		if (event.beta === null || event.gamma === null) return;
		base ??= { beta: event.beta, gamma: event.gamma };
		tilted = { beta: event.beta, gamma: event.gamma };
	};
	let listening = false;
	const listen = () => {
		if (listening) return;
		listening = true;
		window.addEventListener("deviceorientation", orientation, { signal });
	};
	const Orientation = typeof DeviceOrientationEvent === "undefined" ? undefined : (DeviceOrientationEvent as OrientationWithPermission);
	const touchScreen = window.matchMedia?.("(pointer: coarse)").matches;
	if (settings.gyro && touchScreen && Orientation) {
		if (typeof Orientation.requestPermission !== "function") listen();
		else {
			// iOS only asks from a user gesture: the first touch on the card.
			card.addEventListener(
				"touchend",
				() => {
					Orientation.requestPermission?.()
						.then((answer) => answer === "granted" && listen())
						.catch(() => {});
				},
				{ signal, once: true },
			);
		}
	}

	// One frame loop, only while the card is on screen and motion is allowed
	let stopFrame: (() => void) | null = null;
	const frame = (time: number, delta: number) => {
		if (hovering) {
			// target already follows the pointer
		} else if (tilted && base && settings.gyro) {
			const dx = clamp(tilted.gamma - base.gamma, -25, 25) / 25;
			const dy = clamp(tilted.beta - base.beta, -25, 25) / 25;
			Object.assign(target, { rx: -dy * 12, ry: (flipped ? -1 : 1) * dx * 16, px: 50 + dx * 40, py: 50 + dy * 40, glow: 0.6 });
		} else if (settings.tilt) {
			// Nobody is touching it: a slow drift keeps the foil alive.
			Object.assign(target, { rx: 5 * Math.sin(time * 0.37 + 1), ry: 10 * Math.sin(time * 0.5), px: 50 + 30 * Math.sin(time * 0.5), py: 45 + 20 * Math.cos(time * 0.4), glow: 0 });
		} else {
			Object.assign(target, { ...AT_REST, flip: target.flip });
		}
		const ease = 1 - Math.exp(-delta * 8);
		const turn = 1 - Math.exp(-delta * 5);
		for (const key of ["rx", "ry", "px", "py", "glow"] as const) current[key] += (target[key] - current[key]) * ease;
		current.flip += (target.flip - current.flip) * turn;
		paint(current);
	};
	const visibility = trackVisibility(host, () => sync());
	const sync = () => {
		const run = mode === "ready" && visibility.state.ratio > 0;
		if (run && !stopFrame) stopFrame = addFrame(frame);
		if (!run && stopFrame) {
			stopFrame();
			stopFrame = null;
		}
		if (mode !== "ready") paint({ ...still(), flip: target.flip });
	};
	const stopMotion = onMotionPreferenceChange(() => {
		mode = readMotionMode();
		applyLook();
		sync();
	});

	setFlipped(false);
	paint(mode === "ready" ? current : still());
	sync();

	return {
		setConfig(next) {
			settings = holoCardConfigSchema.parse(next ?? {});
			applyLook();
			if (!settings.flip && flipped) setFlipped(false);
		},
		destroy() {
			cancel.abort();
			stopFrame?.();
			stopMotion();
			visibility.dispose();
			created.forEach((node) => node.remove());
			for (const face of [front, back]) {
				if (!face) continue;
				face.inert = false;
				face.removeAttribute("aria-hidden");
			}
			for (const name of ["--rx", "--ry", "--px", "--py", "--glow", "--flip"]) card.style.removeProperty(name);
		},
	};
}
