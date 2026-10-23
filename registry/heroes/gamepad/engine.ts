import {
	addFrame,
	adoptStyles,
	isEditable,
	onMotionPreferenceChange,
	onThemeChange,
	readMotionMode,
	resolveColor,
	trackVisibility,
	type DomHero,
	type DomHeroOptions,
	type MotionMode,
} from "@/lib/sharingan";
import { gamepadConfigSchema, type GamepadConfig, type GamepadConfigInput } from "./schema";
import { GAMEPAD_STYLE_ID, gamepadStyles } from "./styles";

/**
 * Markup the engine expects inside the host, in any order:
 * - `[data-sg-slide="home"]`, the first screen (headline, buttons);
 * - up to four `[data-sg-slide][data-label]`, the sections, on Y, X, B, A;
 * - optional empty `[data-sg-stage]`, `[data-sg-legend]`, `[data-sg-overlay]`
 *   to place the controller, the legend and the floating parts; missing ones
 *   are created. `data-wordmark`, `data-wordmark-tagline` and
 *   `data-collaborators` (comma-separated names) on the host fill the rest.
 */

type Key = "y" | "x" | "b" | "a";
type Direction = "up" | "right" | "down" | "left";
type Control = Key | Direction | "select" | "start";

const KEYS: Key[] = ["y", "x", "b", "a"];
const DIRECTION_TO_KEY: Record<Direction, Key> = { up: "x", right: "a", down: "b", left: "y" };
const PITCH: Record<Control, number> = { y: 392, x: 523, b: 330, a: 659, select: 262, start: 784, up: 440, down: 440, left: 440, right: 440 };
// Gamepad API, standard mapping: 0 bottom, 1 right, 2 left, 3 top face buttons.
const PAD_BUTTONS: Record<number, Control> = { 0: "b", 1: "a", 2: "y", 3: "x", 8: "select", 9: "start", 12: "up", 13: "down", 14: "left", 15: "right" };
const KONAMI: Control[] = ["up", "up", "down", "down", "left", "right", "left", "right", "b", "a"];
const WHO = ["oklch(0.6 0.2 290)", "oklch(0.72 0.17 55)"];

const ARROW = {
	up: "M8 4 13 11H3z",
	right: "M12 8 5 13V3z",
	down: "M8 12 3 5h10z",
	left: "M4 8 11 3v10z",
} as const;
const CURSOR = "M2 2l15 6-6.5 2.2L8 17z";

const escape = (text: string) => text.replace(/[&<>"]/g, (c) => `&${{ "&": "amp", "<": "lt", ">": "gt", '"': "quot" }[c]};`);

/** Gamepad (Sharingan, DOM). A game controller is the hero's navigation. */
export function createGamepad({ host, config }: DomHeroOptions<GamepadConfigInput>): DomHero<GamepadConfigInput> {
	adoptStyles(host, GAMEPAD_STYLE_ID, gamepadStyles);
	host.classList.add("sg-gp");

	let settings: GamepadConfig = gamepadConfigSchema.parse(config ?? {});
	let mode: MotionMode = readMotionMode();
	const cancel = new AbortController();
	const { signal } = cancel;
	const created: Element[] = [];
	const timers = new Set<number>();
	const later = (ms: number, run: () => void) => {
		const timer = window.setTimeout(() => {
			timers.delete(timer);
			run();
		}, ms);
		timers.add(timer);
		return timer;
	};

	/** Finds a placeholder the markup provides, or adds one. */
	const part = (name: string, tag = "div", place: (node: Element) => void = (node) => host.append(node)) => {
		let node = host.querySelector(`[data-sg-${name}]`);
		if (!node) {
			node = document.createElement(tag);
			node.setAttribute(`data-sg-${name}`, "");
			place(node);
			created.push(node);
		}
		node.classList.add(`sg-gp-${name}`);
		return node as HTMLElement;
	};

	// Sections
	const slides = [...host.querySelectorAll<HTMLElement>("[data-sg-slide]")];
	const home = slides.find((slide) => slide.dataset.sgSlide === "home") ?? slides[0];
	const sections = slides
		.filter((slide) => slide !== home)
		.slice(0, 4)
		.map((slide, index) => ({ key: KEYS[index], slide, label: slide.dataset.label ?? `Section ${index + 1}` }));
	const byKey = new Map(sections.map((section) => [section.key, section]));
	const screen = part("screen", "div", (node) => (home ? home.before(node) : host.prepend(node)));
	screen.setAttribute("aria-live", "polite");
	for (const slide of slides) if (slide.parentElement !== screen) screen.append(slide);
	for (const { key, slide, label } of sections) {
		slide.dataset.sgKey = key;
		if (!slide.querySelector(".sg-gp-tag")) {
			const tag = document.createElement("span");
			tag.className = "sg-gp-tag";
			tag.textContent = `${key.toUpperCase()} · ${label}`;
			slide.prepend(tag);
			created.push(tag);
		}
	}

	// Controller
	const stage = part("stage", "div", (node) => screen.after(node));
	const labelFor = (key: Key) => byKey.get(key)?.label;
	const button = (attributes: string, key: Key, aria: string, inner = "") =>
		`<button type="button" ${attributes} ${labelFor(key) ? `aria-label="${escape(aria)}: ${escape(labelFor(key)!)}"` : `aria-label="${escape(aria)}" disabled`}>${inner}</button>`;
	const wordmark = host.dataset.wordmark ?? "SG·PAD";
	const tagline = host.dataset.wordmarkTagline ?? "";
	stage.innerHTML = `
<div class="sg-gp-pad" role="group" aria-label="Controller navigation">
	<div class="sg-gp-wordmark" aria-hidden="true"><b>${escape(wordmark)}</b>${tagline ? `<small>${escape(tagline)}</small>` : ""}</div>
	<div class="sg-gp-dwell"><div class="sg-gp-dpad">
		${(Object.keys(ARROW) as Direction[])
			.map((dir) => button(`data-dir="${dir}"`, DIRECTION_TO_KEY[dir], dir[0].toUpperCase() + dir.slice(1), `<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="${ARROW[dir]}"/></svg>`))
			.join("")}
		<span class="sg-gp-hub" aria-hidden="true"></span>
	</div></div>
	<div class="sg-gp-mids">
		<button type="button" class="sg-gp-mid" data-mid="select" aria-label="Select: back to the start"><span class="sg-gp-bar" aria-hidden="true"></span><span>Home</span></button>
		<button type="button" class="sg-gp-mid" data-mid="start" aria-label="Start: turn button sounds on" aria-pressed="false"><span class="sg-gp-bar" aria-hidden="true"></span><span>Sound</span></button>
	</div>
	<div class="sg-gp-fwell">
		<span class="sg-gp-trough t1" aria-hidden="true"></span><span class="sg-gp-trough t2" aria-hidden="true"></span>
		${(["x", "a", "b", "y"] as Key[]).map((key) => button(`class="sg-gp-face" data-key="${key}"`, key, key.toUpperCase())).join("")}
	</div>
	${(["x", "a", "b", "y"] as Key[]).map((key) => `<span class="sg-gp-letter l-${key}" aria-hidden="true">${key.toUpperCase()}</span>`).join("")}
</div>`;
	const pad = stage.querySelector<HTMLElement>(".sg-gp-pad")!;
	const dpad = stage.querySelector<HTMLElement>(".sg-gp-dpad")!;
	const startButton = stage.querySelector<HTMLElement>('[data-mid="start"]')!;

	// Legend and hint: the same sections as plain buttons, for everyone
	const legend = part("legend", "nav", (node) => stage.after(node));
	legend.setAttribute("aria-label", "Sections");
	legend.innerHTML = sections
		.map(({ key, label }) => `<button type="button" data-open="${key}" data-key="${key}" aria-pressed="false">${escape(label)} <kbd>${key.toUpperCase()}</kbd></button>`)
		.join("");
	const hint = part("hint", "p", (node) => legend.after(node));
	hint.innerHTML = "Press the buttons, use <kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd> and <kbd>A</kbd> <kbd>B</kbd> <kbd>X</kbd> <kbd>Y</kbd>, <kbd>Esc</kbd> to go back, or plug in a controller.";

	// Floating parts: collaborator cursors, toast
	const overlay = part("overlay");
	overlay.setAttribute("aria-hidden", "true");
	const names = (host.dataset.collaborators ?? "").split(",").map((name) => name.trim()).filter(Boolean).slice(0, 2);
	overlay.innerHTML = names
		.map((name, index) => `<div class="sg-gp-cursor" style="--who: ${WHO[index]}"><div class="sg-gp-bob"><svg viewBox="0 0 20 20"><path d="${CURSOR}" fill="${WHO[index]}" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg><span>${escape(name)}</span></div></div>`)
		.join("");
	const cursors = [...overlay.querySelectorAll<HTMLElement>(".sg-gp-cursor")];
	const toastNode = document.createElement("div");
	toastNode.className = "sg-gp-toast";
	toastNode.setAttribute("role", "status");
	host.append(toastNode);
	created.push(toastNode);

	// Look: section colours, shell, motion
	const applyLook = () => {
		KEYS.forEach((key, index) => host.style.setProperty(`--sg-gp-${key}`, settings.colors[index]));
		let shell = settings.shell;
		if (shell === "auto") {
			const [r, g, b] = resolveColor(host, getComputedStyle(host).backgroundColor, [1, 1, 1]);
			shell = 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.18 ? "graphite" : "clay";
		}
		host.dataset.shell = shell === "translucent" ? "clay" : shell;
		pad.classList.toggle("is-translucent", shell === "translucent" || translucent);
		host.dataset.motion = mode;
	};
	let translucent = false;
	applyLook();
	const stopTheme = onThemeChange(applyLook);
	const stopMotion = onMotionPreferenceChange(() => {
		mode = readMotionMode();
		applyLook();
	});

	// Feedback
	let toastTimer = 0;
	const toast = (text: string) => {
		toastNode.textContent = text;
		toastNode.classList.add("show");
		window.clearTimeout(toastTimer);
		toastTimer = later(2400, () => toastNode.classList.remove("show"));
	};
	let sound = false;
	let audio: AudioContext | null = null;
	const blip = (control: Control) => {
		if (!sound) return;
		try {
			audio ??= new AudioContext();
			const oscillator = audio.createOscillator();
			const gain = audio.createGain();
			oscillator.type = "square";
			oscillator.frequency.value = PITCH[control];
			gain.gain.setValueAtTime(0.05, audio.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.09);
			oscillator.connect(gain).connect(audio.destination);
			oscillator.start();
			oscillator.stop(audio.currentTime + 0.1);
		} catch {
			// No audio is fine.
		}
	};

	// Pressing
	const isDirection = (control: Control): control is Direction => control in DIRECTION_TO_KEY;
	const elementFor = (control: Control) =>
		isDirection(control)
			? dpad.querySelector<HTMLElement>(`[data-dir="${control}"]`)
			: control === "select" || control === "start"
				? stage.querySelector<HTMLElement>(`[data-mid="${control}"]`)
				: stage.querySelector<HTMLElement>(`.sg-gp-face[data-key="${control}"]`);
	const down = (control: Control) => {
		elementFor(control)?.classList.add("is-down");
		if (isDirection(control)) dpad.classList.add(`tilt-${control}`);
	};
	const up = (control: Control) => {
		elementFor(control)?.classList.remove("is-down");
		if (isDirection(control)) dpad.classList.remove(`tilt-${control}`);
	};
	const tap = (control: Control) => {
		down(control);
		later(140, () => up(control));
	};

	// Navigation
	let current: Key | "home" = "home";
	const show = (key: Key | "home") => {
		if (key !== "home" && !byKey.has(key)) return;
		if (key === current) key = "home";
		current = key;
		for (const slide of slides) slide.classList.toggle("is-current", key === "home" ? slide === home : slide === byKey.get(key)?.slide);
		stage.querySelectorAll<HTMLElement>(".sg-gp-face").forEach((face) => face.classList.toggle("is-current", face.dataset.key === key));
		legend.querySelectorAll("button").forEach((item) => item.setAttribute("aria-pressed", String(item.dataset.open === key)));
		if (key !== "home") flyCursor(key);
	};

	let progress = 0;
	const combo = (control: Control) => {
		if (!settings.easterEgg) return false;
		// A wrong step restarts the sequence, counting itself when it is a valid first step.
		progress = control === KONAMI[progress] ? progress + 1 : control === KONAMI[0] ? 1 : 0;
		if (progress < KONAMI.length) return false;
		progress = 0;
		translucent = !translucent;
		applyLook();
		toast(translucent ? "Player 2 joined · translucent edition unlocked" : "Back to the classic shell");
		show("home");
		if (translucent) confetti();
		return true;
	};

	const toggleSound = () => {
		sound = !sound;
		startButton.classList.toggle("is-on", sound);
		startButton.setAttribute("aria-pressed", String(sound));
		startButton.setAttribute("aria-label", sound ? "Start: turn button sounds off" : "Start: turn button sounds on");
		if (sound) blip("start");
		toast(sound ? "Button sounds on" : "Button sounds off");
	};

	const press = (control: Control) => {
		blip(control);
		if (combo(control)) return;
		if (isDirection(control)) return show(DIRECTION_TO_KEY[control]);
		if (control === "select") return show("home");
		if (control === "start") return toggleSound();
		show(control);
	};

	// Mouse and touch: the press shows while held and acts on click (so Enter and Space work too).
	stage.querySelectorAll<HTMLButtonElement>("button").forEach((item) => {
		const control = (item.dataset.key ?? item.dataset.dir ?? item.dataset.mid) as Control;
		item.addEventListener("pointerdown", () => down(control), { signal });
		for (const type of ["pointerup", "pointerleave", "pointercancel"]) item.addEventListener(type, () => up(control), { signal });
		item.addEventListener("click", () => press(control), { signal });
	});
	legend.addEventListener(
		"click",
		(event) => {
			const key = (event.target as Element).closest<HTMLElement>("[data-open]")?.dataset.open as Key | undefined;
			if (!key) return;
			tap(key);
			press(key);
		},
		{ signal },
	);

	// Keyboard: inside the hero, everything; elsewhere on the page, only
	// letters and Esc, and only while the hero is mostly on screen.
	const visibility = trackVisibility(host);
	const KEYMAP: Record<string, Control> = { arrowup: "up", arrowdown: "down", arrowleft: "left", arrowright: "right", a: "a", b: "b", x: "x", y: "y", escape: "select", home: "select", m: "start" };
	const GLOBAL = new Set(["a", "b", "x", "y", "escape"]);
	const held = new Set<Control>();
	const controlFor = (event: KeyboardEvent) => {
		if (!settings.keyboard || event.metaKey || event.ctrlKey || event.altKey || isEditable(event.target)) return undefined;
		const name = event.key.toLowerCase();
		const inside = event.target instanceof Node && host.contains(event.target);
		if (!inside && (!GLOBAL.has(name) || visibility.state.ratio < 0.5)) return undefined;
		// Enter and Space on a focused button already click it.
		return KEYMAP[name];
	};
	window.addEventListener(
		"keydown",
		(event) => {
			const control = controlFor(event);
			if (!control) return;
			if (event.key.startsWith("Arrow") || event.key === "Home") event.preventDefault();
			if (held.has(control)) return;
			held.add(control);
			down(control);
			press(control);
		},
		{ signal },
	);
	window.addEventListener(
		"keyup",
		(event) => {
			const control = KEYMAP[event.key.toLowerCase()];
			if (!control || !held.has(control)) return;
			held.delete(control);
			up(control);
		},
		{ signal },
	);

	// Real controllers, polled on the shared frame loop while one is connected.
	const previous = new Map<string, boolean>();
	let stopPolling: (() => void) | null = null;
	const poll = () => {
		const pads = navigator.getGamepads?.() ?? [];
		let connected = false;
		for (const gamepad of pads) {
			if (!gamepad) continue;
			connected = true;
			for (const [index, control] of Object.entries(PAD_BUTTONS)) {
				const pressed = Boolean(gamepad.buttons[Number(index)]?.pressed);
				const id = `${gamepad.index}:${index}`;
				const was = previous.get(id) ?? false;
				if (pressed && !was && visibility.state.ratio > 0.25) {
					down(control);
					press(control);
				}
				if (!pressed && was) up(control);
				previous.set(id, pressed);
			}
		}
		if (!connected) {
			stopPolling?.();
			stopPolling = null;
		}
	};
	const startPolling = () => {
		if (settings.gamepad && !stopPolling) stopPolling = addFrame(poll);
	};
	window.addEventListener(
		"gamepadconnected",
		(event) => {
			if (!settings.gamepad) return;
			toast(`Controller connected: ${event.gamepad.id.split("(")[0].trim() || "gamepad"}`);
			startPolling();
		},
		{ signal },
	);
	window.addEventListener("gamepaddisconnected", () => settings.gamepad && toast("Controller disconnected"), { signal });
	if ([...(navigator.getGamepads?.() ?? [])].some(Boolean)) startPolling();

	// Tilt and light follow the mouse
	host.addEventListener(
		"pointermove",
		(event) => {
			if (event.pointerType !== "mouse" || !settings.tilt || mode !== "ready") return;
			const box = stage.getBoundingClientRect();
			const x = (event.clientX - box.left) / box.width;
			const y = (event.clientY - box.top) / box.height;
			pad.classList.add("is-tracking");
			pad.style.setProperty("--ry", `${(x - 0.5) * 12}deg`);
			pad.style.setProperty("--rx", `${(0.5 - y) * 10}deg`);
			pad.style.setProperty("--gx", `${Math.min(90, Math.max(10, x * 100))}%`);
			pad.style.setProperty("--gy", `${Math.min(70, Math.max(5, y * 60))}%`);
		},
		{ signal },
	);
	host.addEventListener(
		"pointerleave",
		() => {
			pad.classList.remove("is-tracking");
			for (const name of ["--rx", "--ry", "--gx", "--gy"]) pad.style.removeProperty(name);
		},
		{ signal },
	);

	// Collaborator cursors rest beside the controller and fly to what was opened.
	const place = (node: HTMLElement, x: number, y: number) => (node.style.transform = `translate(${x}px, ${y}px)`);
	const rest = () => {
		const box = host.getBoundingClientRect();
		const shape = pad.getBoundingClientRect();
		if (cursors[0]) place(cursors[0], Math.max(8, shape.left - box.left - 70), shape.top - box.top + shape.height * 0.55);
		if (cursors[1]) place(cursors[1], Math.min(box.width - 96, shape.right - box.left + 6), shape.top - box.top - 6);
	};
	let flyTimer = 0;
	const flyCursor = (key: Key) => {
		const cursor = cursors[0];
		const target = stage.querySelector(`.sg-gp-face[data-key="${key}"]`)?.getBoundingClientRect();
		if (!cursor || !target) return;
		const box = host.getBoundingClientRect();
		const label = cursor.querySelector("span")!;
		label.textContent = `${names[0]} · opened ${byKey.get(key)?.label}`;
		place(cursor, target.left - box.left + target.width * 0.55, target.top - box.top + target.height * 0.55);
		window.clearTimeout(flyTimer);
		flyTimer = later(2600, () => {
			label.textContent = names[0];
			rest();
		});
	};
	const resize = new ResizeObserver(rest);
	resize.observe(host);
	document.fonts?.ready.then(() => !signal.aborted && rest());

	const confetti = () => {
		if (mode !== "ready") return;
		const box = host.getBoundingClientRect();
		const shape = pad.getBoundingClientRect();
		for (let i = 0; i < 48; i++) {
			const bit = document.createElement("span");
			bit.className = "sg-gp-confetti";
			bit.style.left = `${shape.left - box.left + shape.width / 2}px`;
			bit.style.top = `${shape.top - box.top + shape.height / 3}px`;
			bit.style.background = `var(--sg-gp-${KEYS[i % 4]})`;
			bit.style.setProperty("--dx", `${(Math.random() - 0.5) * 700}px`);
			bit.style.setProperty("--dy", `${-80 - Math.random() * 260}px`);
			bit.style.setProperty("--rot", `${Math.random() * 720}deg`);
			host.append(bit);
			later(1500, () => bit.remove());
		}
	};

	show("home");
	host.dataset.ready = "";

	return {
		setConfig(next) {
			settings = gamepadConfigSchema.parse(next ?? {});
			applyLook();
			if (settings.gamepad && [...(navigator.getGamepads?.() ?? [])].some(Boolean)) startPolling();
			else if (!settings.gamepad) {
				stopPolling?.();
				stopPolling = null;
			}
		},
		destroy() {
			cancel.abort();
			stopTheme();
			stopMotion();
			stopPolling?.();
			visibility.dispose();
			resize.disconnect();
			timers.forEach((timer) => window.clearTimeout(timer));
			void audio?.close();
			stage.innerHTML = "";
			legend.innerHTML = "";
			hint.innerHTML = "";
			overlay.innerHTML = "";
			host.querySelectorAll(".sg-gp-confetti").forEach((bit) => bit.remove());
			for (const slide of slides) slide.classList.remove("is-current");
			// The sections are the page's content: put them back before removing what was added.
			if (created.includes(screen)) screen.replaceWith(...slides);
			created.forEach((node) => node.remove());
			delete host.dataset.ready;
		},
	};
}
