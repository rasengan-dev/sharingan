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
import { splitHeadlineConfigSchema, type SplitHeadlineConfig, type SplitHeadlineConfigInput } from "./schema";
import { SPLIT_HEADLINE_STYLE_ID, splitHeadlineStyles } from "./styles";

/**
 * Markup the engine expects inside the host: one heading marked
 * `[data-sg-split]`, holding plain text. Elements marked `[data-sg-after]`
 * (subheadline, buttons) fade in once the headline has arrived.
 */

type Letter = { node: HTMLElement; x: number; y: number; p: number; written: number };

const ENTRANCE_MS = 900;
// Intl.Segmenter splits graphemes (accents, emoji); typed by hand so projects on an older `lib` still compile.
type Segmenter = { segment(input: string): Iterable<{ segment: string }> };
const SegmenterClass = (Intl as unknown as { Segmenter?: new (locale?: string, options?: { granularity: "grapheme" }) => Segmenter }).Segmenter;
const segmenter = SegmenterClass ? new SegmenterClass(undefined, { granularity: "grapheme" }) : null;
// The same pseudo-random offsets on every load, so `?motion=final` and replays match.
const hash = (n: number) => {
	const x = Math.sin(n * 12.9898) * 43758.5453;
	return x - Math.floor(x);
};

/** Split headline (Sharingan, DOM). The headline assembles, then answers the pointer. */
export function createSplitHeadline({ host, config }: DomHeroOptions<SplitHeadlineConfigInput>): DomHero<SplitHeadlineConfigInput> {
	adoptStyles(host, SPLIT_HEADLINE_STYLE_ID, splitHeadlineStyles);
	host.classList.add("sg-sh");

	const heading = host.querySelector<HTMLElement>("[data-sg-split]");
	if (!heading) {
		host.dataset.ready = "";
		return { setConfig() {}, destroy() {} };
	}

	let settings: SplitHeadlineConfig = splitHeadlineConfigSchema.parse(config ?? {});
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
	const afters = [...host.querySelectorAll<HTMLElement>("[data-sg-after]")];
	afters.forEach((node) => node.classList.add("sg-sh-after"));

	// Splitting: the heading keeps its text for assistive technology; the letters are decoration.
	const original = [...heading.childNodes];
	const text = (heading.textContent ?? "").replace(/\s+/g, " ").trim();
	let letters: Letter[] = [];
	let fontSize = 16;

	const offsets = (index: number): [number, number, number] => {
		if (settings.intro === "rise") return [0, 0.55, 0];
		if (settings.intro === "type") return [0, 0, 0];
		return [(hash(index + 1) - 0.5) * 4, (hash(index + 7) - 0.5) * 3, (hash(index + 3) - 0.5) * 90];
	};

	const split = () => {
		const reader = document.createElement("span");
		reader.className = "sg-sh-sr";
		reader.textContent = text;
		const visual = document.createElement("span");
		visual.setAttribute("aria-hidden", "true");
		let index = 0;
		text.split(" ").forEach((word, wordIndex) => {
			if (wordIndex > 0) visual.append(" ");
			const wordNode = document.createElement("span");
			wordNode.className = "sg-sh-word";
			// Graphemes, not code units: accents and emoji stay whole.
			const graphemes = segmenter ? [...segmenter.segment(word)].map((part) => part.segment) : [...word];
			for (const grapheme of graphemes) {
				const node = document.createElement("span");
				node.className = "sg-sh-char";
				node.textContent = grapheme;
				const [sx, sy, sr] = offsets(index);
				node.style.cssText = `--i:${index};--sx:${sx.toFixed(2)};--sy:${sy.toFixed(2)};--sr:${sr.toFixed(1)}`;
				wordNode.append(node);
				letters.push({ node, x: 0, y: 0, p: 0, written: 0 });
				index++;
			}
			visual.append(wordNode);
		});
		heading.replaceChildren(reader, visual);
	};

	const unsplit = () => {
		heading.replaceChildren(...original);
		letters = [];
	};

	// Letter centres, in the heading's own space (offsets ignore transforms).
	const measure = () => {
		fontSize = parseFloat(getComputedStyle(heading).fontSize) || 16;
		for (const letter of letters) {
			letter.x = letter.node.offsetLeft + letter.node.offsetWidth / 2;
			letter.y = letter.node.offsetTop + letter.node.offsetHeight / 2;
		}
	};

	const applyLook = () => {
		host.style.setProperty("--sg-sh-accent", settings.accent);
		host.style.setProperty("--sg-sh-stagger", `${settings.stagger}ms`);
		host.dataset.introStyle = settings.intro;
		host.dataset.motion = mode;
	};
	applyLook();

	// Pointer
	const pointer = { x: 0, y: 0, inside: false };
	host.addEventListener(
		"pointermove",
		(event) => {
			const box = heading.getBoundingClientRect();
			pointer.x = event.clientX - box.left;
			pointer.y = event.clientY - box.top;
			pointer.inside = true;
		},
		{ signal },
	);
	host.addEventListener("pointerleave", () => (pointer.inside = false), { signal });

	const frame = (time: number, delta: number) => {
		const reach = settings.radius * fontSize;
		const strength = Math.min(1.2, settings.strength);
		let wave = Number.NaN;
		if (!(pointer.inside && settings.pointer) && settings.idle) {
			// Every seven seconds, a wave crosses the headline in under two.
			const phase = (time % 7) / 1.8;
			if (phase < 1) wave = -reach + phase * (heading.offsetWidth + 2 * reach);
		}
		const ease = 1 - Math.exp(-delta * 10);
		for (const letter of letters) {
			let target = 0;
			if (pointer.inside && settings.pointer) {
				const distance = Math.hypot(letter.x - pointer.x, letter.y - pointer.y) / reach;
				target = Math.exp(-distance * distance) * strength;
			} else if (!Number.isNaN(wave)) {
				const distance = (letter.x - wave) / reach;
				target = Math.exp(-distance * distance) * 0.55 * strength;
			}
			letter.p += (target - letter.p) * ease;
			if (Math.abs(letter.p - letter.written) > 0.004) {
				letter.written = letter.p;
				letter.node.style.setProperty("--p", letter.p.toFixed(3));
			}
		}
	};

	// Lifecycle: split and play the entrance the first time the hero is seen
	let stopFrame: (() => void) | null = null;
	let played = false;
	let arrived = false;
	const sync = () => {
		const run = mode === "ready" && arrived && visibility.state.ratio > 0;
		if (run && !stopFrame) stopFrame = addFrame(frame);
		if (!run && stopFrame) {
			stopFrame();
			stopFrame = null;
		}
	};
	const play = () => {
		played = true;
		const total = settings.stagger * letters.length * (settings.intro === "type" ? 2.2 : 1) + ENTRANCE_MS;
		host.style.setProperty("--sg-sh-after-delay", `${Math.min(total * 0.6, 1400)}ms`);
		// Two frames: the waiting positions must be painted before the transition starts.
		requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				if (signal.aborted) return;
				host.dataset.intro = "play";
				later(total + 200, () => {
					host.dataset.intro = "done";
					arrived = true;
					measure();
					sync();
				});
			}),
		);
	};
	const visibility = trackVisibility(host, (ratio) => {
		if (!played && letters.length && ratio >= 0.3) play();
		sync();
	});

	const start = () => {
		if (mode === "ready") {
			split();
			host.dataset.intro = "pending";
			measure();
		} else {
			// Reduced motion, `?motion=off` and `?motion=final`: the plain headline, at rest.
			delete host.dataset.intro;
		}
		host.dataset.ready = "";
	};
	start();

	const resize = new ResizeObserver(() => letters.length && measure());
	resize.observe(heading);
	document.fonts?.ready.then(() => !signal.aborted && letters.length && measure());

	const stopMotion = onMotionPreferenceChange(() => {
		mode = readMotionMode();
		applyLook();
		if (mode !== "ready" && letters.length) {
			unsplit();
			delete host.dataset.intro;
		}
		sync();
	});

	return {
		setConfig(next) {
			const before = settings.intro;
			settings = splitHeadlineConfigSchema.parse(next ?? {});
			applyLook();
			if (settings.intro !== before && letters.length) {
				letters.forEach((letter, index) => {
					const [sx, sy, sr] = offsets(index);
					letter.node.style.setProperty("--sx", sx.toFixed(2));
					letter.node.style.setProperty("--sy", sy.toFixed(2));
					letter.node.style.setProperty("--sr", sr.toFixed(1));
				});
			}
		},
		destroy() {
			cancel.abort();
			stopFrame?.();
			stopMotion();
			visibility.dispose();
			resize.disconnect();
			timers.forEach((timer) => window.clearTimeout(timer));
			if (letters.length) unsplit();
			afters.forEach((node) => node.classList.remove("sg-sh-after"));
			delete host.dataset.intro;
			delete host.dataset.ready;
		},
	};
}
