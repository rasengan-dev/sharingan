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
import { drawDeck, type DeckDrawing } from "./deck";
import { isoDeckConfigSchema, type IsoDeckConfig, type IsoDeckConfigInput } from "./schema";
import { ISO_DECK_STYLE_ID, isoDeckStyles } from "./styles";

/**
 * Markup the engine expects inside the host: the hero's copy (an `h1` or
 * `h2` and what follows it) and optionally a `[data-sg-deck]` with the drawn
 * deck in a `.sg-id-art`, a `.sg-id-tip` and the front key's link (so the deck
 * shows before the script runs). Missing parts are added; an `a[data-sg-key]`
 * anywhere in the host becomes the front key's link. The tooltip's lines come
 * from `data-tagline` and `data-connected-label` on the deck or the host.
 */

/** After the visitor's last key, the story waits this long (ms) before it plays again. */
const IDLE = 3000;
/** How long the deck stays connected (ms). */
const CONNECTED = 2600;
let count = 0;

/** Places the tooltip and the front key's link from a drawing. */
function place(deck: HTMLElement, tip: HTMLElement, link: HTMLElement | null, drawing: DeckDrawing) {
	deck.style.setProperty("--u", String(drawing.unit));
	tip.style.left = drawing.tip.left;
	tip.style.top = drawing.tip.top;
	if (link) Object.assign(link.style, drawing.link);
}

/** Iso deck (Sharingan, DOM). A macro pad in line art that tells a short story and plays back. */
export function createIsoDeck({ host, config }: DomHeroOptions<IsoDeckConfigInput>): DomHero<IsoDeckConfigInput> {
	adoptStyles(host, ISO_DECK_STYLE_ID, isoDeckStyles);
	host.classList.add("sg-id");

	let settings: IsoDeckConfig = isoDeckConfigSchema.parse(config ?? {});
	let mode: MotionMode = readMotionMode();
	let visible = false;
	const cancel = new AbortController();
	const { signal } = cancel;
	const created: Element[] = [];
	const add = <K extends keyof HTMLElementTagNameMap>(tag: K, className: string, parent: Element, first = false) => {
		const element = document.createElement(tag);
		element.className = className;
		if (first) parent.prepend(element);
		else parent.append(element);
		created.push(element);
		return element;
	};

	// The copy is the page's; the deck is added after it when missing.
	host.querySelector("h1, h2")?.parentElement?.classList.add("sg-id-copy");
	let deck = host.querySelector<HTMLElement>("[data-sg-deck]");
	if (!deck) {
		const panel = add("div", "sg-id-panel", host);
		deck = document.createElement("div");
		deck.className = "sg-id-deck";
		deck.dataset.sgDeck = "";
		deck.dataset.cursor = "out";
		deck.dataset.select = "";
		deck.dataset.tip = "open";
		panel.append(deck);
	}
	const art = deck.querySelector<HTMLElement>(".sg-id-art") ?? add("div", "sg-id-art", deck, true);
	const tip = deck.querySelector<HTMLElement>(".sg-id-tip") ?? add("p", "sg-id-tip", deck);
	tip.setAttribute("aria-hidden", "true");
	const id = (deck.dataset.uid ||= `sg-id-${++count}`);

	// The front key's link: moved into the deck when the page put it elsewhere, and put back on destroy.
	const link = host.querySelector<HTMLAnchorElement>("a.sg-id-keylink, a[data-sg-key]");
	const home = link && link.parentElement !== deck ? { parent: link.parentElement, next: link.nextSibling } : null;
	if (link) {
		link.classList.add("sg-id-keylink");
		if (home) deck.append(link);
	}
	const ctaLabel = link?.textContent?.trim() || undefined;
	const tagline = () => deck.dataset.tagline ?? host.dataset.tagline ?? "";
	const connectedLabel = () => deck.dataset.connectedLabel ?? host.dataset.connectedLabel ?? "Connected";

	// The drawing, and the parts the engine moves. Drawn here unless the server already did.
	type Parts = { keys: Map<string, SVGGElement>; letters: SVGGElement[]; bars: SVGRectElement[]; dial: SVGGElement | null; sway: SVGGElement | null; tile: SVGGElement | null };
	let parts: Parts;
	let layoutKey = "";
	const draw = (force: boolean) => {
		const next = JSON.stringify([settings.keys, settings.wideKey, settings.rows, settings.knob, settings.screen, settings.cable]);
		const drawing = drawDeck(settings, { id, cta: ctaLabel });
		if (force || !art.querySelector("svg")) art.innerHTML = drawing.svg;
		layoutKey = next;
		place(deck, tip, link, drawing);
		const keys = new Map<string, SVGGElement>();
		art.querySelectorAll<SVGGElement>(".sg-id-key").forEach((key) => keys.set(key.dataset.index ?? key.dataset.key!, key));
		parts = {
			keys,
			letters: [...settings.keys].map((_, index) => keys.get(String(index))!).filter(Boolean),
			bars: [...art.querySelectorAll<SVGRectElement>(".sg-id-bar")],
			dial: art.querySelector(".sg-id-dial"),
			sway: art.querySelector(".sg-id-sway"),
			tile: art.querySelector(".sg-id-tile-body"),
		};
		levels = new Float32Array(parts.bars.length);
		written = new Float32Array(parts.bars.length).fill(-1);
	};
	let levels = new Float32Array(0);
	let written = new Float32Array(0);
	draw(false);

	const applyLook = () => {
		host.dataset.motion = mode;
		host.style.setProperty("--sg-id-accent", settings.accent);
		if (settings.accentAlt) host.style.setProperty("--sg-id-accent-2", settings.accentAlt);
		else host.style.removeProperty("--sg-id-accent-2");
		// The page's own dark class is read by the stylesheet; this covers dark pages without it.
		const [r, g, b] = resolveColor(host, getComputedStyle(host).getPropertyValue("--sg-id-bg") || "white", [1, 1, 1]);
		if (0.2126 * r + 0.7152 * g + 0.0722 * b < 0.18) host.dataset.tone = "dark";
		else delete host.dataset.tone;
	};
	applyLook();
	const stopTheme = onThemeChange(applyLook);

	// The still frame: cursor out, tile selected, the tagline (or the connected line) in the tooltip.
	const still = () => {
		deck.dataset.cursor = "out";
		deck.dataset.select = "";
		delete deck.dataset.typing;
		const text = connected ? connectedLabel() : tagline();
		tip.dataset.text = text;
		if (text) deck.dataset.tip = "open";
		else delete deck.dataset.tip;
	};

	// Keys. A press by the visitor counts toward the word; the story's own presses do not.
	let energy = 0;
	let progress = 0;
	let connected = false;
	let connectedAt = 0;
	let connectTimer = 0;
	const down = new Set<SVGGElement>();
	const press = (key: SVGGElement | undefined, byVisitor: boolean) => {
		if (!key || down.has(key)) return;
		down.add(key);
		key.dataset.down = "";
		energy = Math.min(1.4, energy + 0.55);
		if (!byVisitor) return;
		interact();
		if (key.dataset.key === "letter") spell(Number(key.dataset.index));
		if (mode !== "ready") paintStill();
	};
	const release = (key: SVGGElement | undefined) => {
		if (!key || !down.delete(key)) return;
		delete key.dataset.down;
	};
	const tap = (key: SVGGElement | undefined, ms: number) => {
		press(key, false);
		window.setTimeout(() => release(key), ms);
	};

	const spell = (index: number) => {
		const word = settings.keys.toUpperCase();
		const letter = word[index];
		if (word[progress] === letter) progress += 1;
		else progress = word[0] === letter ? 1 : 0;
		if (progress === word.length) {
			progress = 0;
			connect();
		}
	};
	const connect = () => {
		connected = true;
		connectedAt = performance.now();
		host.dataset.connected = "";
		still();
		window.clearTimeout(connectTimer);
		connectTimer = window.setTimeout(() => {
			connected = false;
			delete host.dataset.connected;
			still();
			if (mode !== "ready") paintStill();
		}, CONNECTED);
	};

	// The story, while nobody plays: spell, hold, close, the cursor dives into the tile and comes back
	// out, selects it and types the tagline, which is the still frame again.
	let story: AbortController | null = null;
	let idleTimer = 0;
	const sleep = (ms: number, until: AbortSignal) =>
		new Promise<void>((resolve, reject) => {
			const timer = window.setTimeout(resolve, ms);
			until.addEventListener("abort", () => (window.clearTimeout(timer), reject(until.reason)), { once: true });
		});
	const tell = async (until: AbortSignal) => {
		await sleep(900, until);
		for (;;) {
			for (const key of parts.letters) {
				tap(key, 170);
				await sleep(260, until);
			}
			await sleep(1500, until);
			delete deck.dataset.tip;
			delete deck.dataset.select;
			await sleep(260, until);
			deck.dataset.cursor = "in";
			await sleep(420, until);
			parts.tile?.setAttribute("data-gulp", "");
			await sleep(450, until);
			parts.tile?.removeAttribute("data-gulp");
			await sleep(900, until);
			deck.dataset.cursor = "out";
			await sleep(700, until);
			deck.dataset.select = "";
			await sleep(380, until);
			const text = tagline();
			if (text) {
				tip.dataset.text = "";
				deck.dataset.typing = "";
				deck.dataset.tip = "open";
				for (let i = 1; i <= text.length; i++) {
					tip.dataset.text = text.slice(0, i);
					await sleep(34, until);
				}
				delete deck.dataset.typing;
			}
			await sleep(700, until);
		}
	};
	const startStory = () => {
		if (story || !settings.loop || mode !== "ready" || !visible) return;
		story = new AbortController();
		tell(story.signal).catch(() => {});
	};
	const stopStory = () => {
		if (!story) return;
		story.abort();
		story = null;
		parts.tile?.removeAttribute("data-gulp");
		still();
	};
	/** The visitor is playing: the story steps aside, and comes back after a quiet moment. */
	function interact() {
		stopStory();
		window.clearTimeout(idleTimer);
		idleTimer = window.setTimeout(() => {
			idleTimer = 0;
			startStory();
		}, IDLE);
	}

	// Pointer: a mouse presses what it hovers, a finger what it touches. The front key is under its link.
	let hovered: SVGGElement | undefined;
	const keyAt = (target: EventTarget | null) =>
		target instanceof Element ? (target.closest<SVGGElement>(".sg-id-key") ?? (target === link ? parts.keys.get("cta") : undefined)) : undefined;
	const hover = (event: PointerEvent) => {
		if (event.pointerType !== "mouse") return;
		const key = keyAt(event.target);
		if (key === hovered) return;
		release(hovered);
		hovered = key;
		press(key, true);
	};
	deck.addEventListener("pointerover", hover, { signal });
	deck.addEventListener(
		"pointerleave",
		() => {
			release(hovered);
			hovered = undefined;
		},
		{ signal },
	);
	deck.addEventListener(
		"pointerdown",
		(event) => {
			if (event.pointerType === "mouse") return;
			const key = keyAt(event.target);
			press(key, true);
			const up = () => release(key);
			window.addEventListener("pointerup", up, { once: true, signal });
			window.addEventListener("pointercancel", up, { once: true, signal });
		},
		{ signal },
	);

	// Keyboard: typing the word presses its keys, while the hero is mostly on screen.
	const typed = new Map<string, SVGGElement>();
	const visibility = trackVisibility(host, (ratio) => {
		visible = ratio > 0;
		sync();
	});
	window.addEventListener(
		"keydown",
		(event) => {
			if (!settings.keyboard || event.repeat || event.metaKey || event.ctrlKey || event.altKey || isEditable(event.target)) return;
			if (event.key.length !== 1 || visibility.state.ratio < 0.5) return;
			const letter = event.key.toUpperCase();
			const word = settings.keys.toUpperCase();
			const index = word[progress] === letter ? progress : word.indexOf(letter);
			if (index === -1) return;
			const key = parts.letters[index];
			if (!key) return;
			release(key);
			press(key, true);
			typed.set(event.code, key);
		},
		{ signal },
	);
	window.addEventListener(
		"keyup",
		(event) => {
			release(typed.get(event.code));
			typed.delete(event.code);
		},
		{ signal },
	);

	// The cable sways when the pointer moves fast over the hero.
	let sway = 0;
	let swaySpeed = 0;
	let swayWritten = 0;
	host.addEventListener(
		"pointermove",
		(event) => {
			if (mode === "ready") swaySpeed += Math.max(-40, Math.min(40, event.movementX * 1.6));
		},
		{ passive: true, signal },
	);

	// The meter, the dial and the cable: one frame callback, only while the hero is on screen with motion on.
	const writeBars = (target: (i: number) => number) => {
		for (let i = 0; i < parts.bars.length; i++) {
			const level = Math.max(0.06, Math.min(1, target(i)));
			if (Math.abs(level - written[i]!) < 0.01) continue;
			written[i] = level;
			parts.bars[i]!.style.transform = `scaleY(${level.toFixed(3)})`;
		}
	};
	let dialWritten = Number.NaN;
	const writeDial = (angle: number) => {
		if (!parts.dial || Math.abs(angle - dialWritten) < 0.5) return;
		dialWritten = angle;
		parts.dial.style.transform = `rotate(${angle.toFixed(1)}deg)`;
	};
	const fill = (i: number, total: number, share: number) => (i / total < share ? 1 : 0);
	const frame = (time: number, delta: number) => {
		energy *= Math.exp(-delta * 4.5);
		const total = parts.bars.length;
		const share = connected ? Math.min(1, (performance.now() - connectedAt) / 600) : 0;
		for (let i = 0; i < total; i++) {
			const idle = 0.26 + 0.16 * Math.sin(time * 2.1 + i * 0.55) * (0.6 + 0.4 * Math.sin(time * 0.7 + i * 0.13)) + 0.06 * Math.sin(time * 5.3 + i * 1.7);
			const target = Math.max(idle + energy * (0.45 + 0.25 * Math.sin(i * 0.9 + time * 9)) * (0.4 + (0.6 * i) / total), fill(i, total, share));
			levels[i]! += (target - levels[i]!) * Math.min(1, delta * 16);
		}
		writeBars((i) => levels[i]!);
		writeDial(connected ? 280 * share : -40 + energy * 90 + Math.sin(time * 0.6) * 6);
		// A damped spring, kept within a few degrees.
		swaySpeed += (-80 * sway - 8 * swaySpeed) * delta;
		sway = Math.max(-14, Math.min(14, sway + swaySpeed * delta));
		if (parts.sway && Math.abs(sway - swayWritten) > 0.05) {
			swayWritten = sway;
			parts.sway.style.transform = `rotate(${sway.toFixed(2)}deg)`;
		}
	};
	/** With motion off: the meter rests at its drawn level, or full once connected. */
	const paintStill = () => {
		const total = parts.bars.length;
		writeBars((i) => (connected ? 1 : 0.3 + 0.5 * (i / total) * (0.75 + 0.25 * Math.sin(i * 1.3))));
		writeDial(connected ? 280 : -20);
	};

	let stopFrame: (() => void) | null = null;
	function sync() {
		const running = mode === "ready" && visible;
		host.toggleAttribute("data-paused", !running);
		if (running) {
			stopFrame ??= addFrame(frame);
			if (!idleTimer) startStory();
		} else {
			stopFrame?.();
			stopFrame = null;
			stopStory();
			if (mode !== "ready") paintStill();
		}
	}
	still();
	if (mode !== "ready") paintStill();
	sync();

	const stopMotion = onMotionPreferenceChange(() => {
		mode = readMotionMode();
		applyLook();
		sync();
	});

	return {
		setConfig(next) {
			settings = isoDeckConfigSchema.parse(next ?? {});
			applyLook();
			const key = JSON.stringify([settings.keys, settings.wideKey, settings.rows, settings.knob, settings.screen, settings.cable]);
			if (key !== layoutKey) {
				stopStory();
				down.clear();
				hovered = undefined;
				progress = 0;
				draw(true);
				if (mode !== "ready") paintStill();
			}
			if (!settings.loop) stopStory();
			sync();
		},
		destroy() {
			cancel.abort();
			stopStory();
			stopFrame?.();
			window.clearTimeout(idleTimer);
			window.clearTimeout(connectTimer);
			stopTheme();
			stopMotion();
			visibility.dispose();
			if (link && home?.parent) home.parent.insertBefore(link, home.next);
			created.forEach((node) => node.remove());
			host.removeAttribute("data-paused");
			delete host.dataset.connected;
		},
	};
}
