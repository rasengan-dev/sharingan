/**
 * sharingan-scroll — what every Sharingan section shares (RFC-0002): GSAP
 * with ScrollTrigger and Flip registered once, a scope per section that
 * follows the motion modes and the narrow layout, and the word splitting
 * used by text that darkens as it is read. Installed as
 * `@/lib/sharingan/scroll`; heroes never copy it.
 */
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { DomHero } from "../dom";
import { readMotionMode, type MotionMode } from "../motion";

export { gsap, Flip, ScrollTrigger };

/** A section's behaviour: a DOM hero's, plus `refresh` after the page above it changed height. */
export type SectionEngine<I> = DomHero<I> & { refresh(): void };

/** What a section builds for: the motion mode, and whether the screen is narrow. */
export type ScrollContext = { motion: MotionMode; narrow: boolean };

/** Below this width (px), sections drop their pins and use reveals instead. */
export const NARROW = 768;

/**
 * Recalculates every trigger in page order. ScrollTrigger works through them in
 * the order they were made, so a pin rebuilt above an older section (a tab, a
 * new width, a new config) would otherwise be measured after it, and that
 * section would start as if the pin's scroll length were not there.
 */
function refreshInOrder() {
	ScrollTrigger.sort((a: ScrollTrigger, b: ScrollTrigger) => {
		if (!a.trigger || !b.trigger || a.trigger === b.trigger) return 0;
		return a.trigger.compareDocumentPosition(b.trigger) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
	});
	ScrollTrigger.refresh();
}

/** Sections built in the same frame share one ordered refresh. */
let pending = 0;
function scheduleRefresh() {
	cancelAnimationFrame(pending);
	pending = requestAnimationFrame(refreshInOrder);
}

let registered = false;
/** Registers the plugins once, and refreshes every trigger when the page's height changes. */
function register() {
	if (registered) return;
	registered = true;
	gsap.registerPlugin(ScrollTrigger, Flip);

	// Images and a hero's intro above a section move it down; its pin must follow.
	// After a refresh the height is recorded, so the pin spacing it adds starts no new one.
	let height = document.body.scrollHeight;
	let timer = 0;
	ScrollTrigger.addEventListener("refresh", () => (height = document.body.scrollHeight));
	new ResizeObserver(() => {
		if (Math.abs(document.body.scrollHeight - height) < 2) return;
		window.clearTimeout(timer);
		timer = window.setTimeout(refreshInOrder, 150);
	}).observe(document.body);
}

/**
 * Builds a section's animations inside one GSAP scope on `root`, and builds
 * them again when the reduced-motion preference, the narrow breakpoint or the
 * root's width changes. Everything `build` creates (tweens, triggers, pins) is
 * reverted before the next build and on `destroy`, so no pin spacing is left
 * behind. `build` may return a cleanup for what GSAP does not own.
 */
export function createScrollScope(root: HTMLElement, build: (context: ScrollContext) => void | (() => void)) {
	register();
	let media: gsap.MatchMedia | null = null;

	const start = () => {
		media = gsap.matchMedia(root);
		// GSAP builds only while one condition matches: `always` keeps it building, the others rebuild it when they change.
		media.add({ always: "all", reduce: "(prefers-reduced-motion: reduce)", narrow: `(max-width: ${NARROW - 0.02}px)` }, (context) => {
			const motion = readMotionMode();
			root.dataset.motion = motion;
			return build({ motion, narrow: Boolean(context.conditions?.narrow) });
		});
	};
	start();
	scheduleRefresh();

	// Sizes are measured once per build; a new width means a new build.
	let width = root.clientWidth;
	let timer = 0;
	const resize = new ResizeObserver(() => {
		if (Math.abs(root.clientWidth - width) < 1) return;
		width = root.clientWidth;
		window.clearTimeout(timer);
		timer = window.setTimeout(rebuild, 120);
	});
	resize.observe(root);

	function rebuild() {
		// Reverting a pin removes its spacer for a moment; scroll anchoring would carry the page up with it.
		const scroll = window.scrollY;
		media?.revert();
		start();
		refreshInOrder();
		window.scrollTo(0, scroll);
	}

	return {
		rebuild,
		refresh: refreshInOrder,
		destroy() {
			window.clearTimeout(timer);
			resize.disconnect();
			media?.revert();
			media = null;
			delete root.dataset.motion;
		},
	};
}

/** Whether a section animates against the scroll: motion on and room for it. */
export const scrubs = ({ motion, narrow }: ScrollContext) => motion === "ready" && !narrow;

/**
 * The quiet version of a section, for narrow screens and reduced motion: each
 * element fades in once as it enters. In the `final` mode (posters, tests)
 * nothing moves at all.
 */
export function revealOnEnter(elements: Element[], { motion }: ScrollContext) {
	if (motion === "final" || elements.length === 0) return;
	const moves = motion === "ready";
	for (const element of elements) {
		gsap.from(element, {
			opacity: 0,
			y: moves ? 24 : 0,
			duration: moves ? 0.7 : 0.4,
			ease: "power2.out",
			scrollTrigger: { trigger: element, start: "top 88%", once: true },
		});
	}
}

/**
 * The words of `element`, each in a `[data-sg-word]` span, so they can be
 * darkened one by one. React sections render the spans themselves; for a Web
 * Component the text is split here, and `restore` puts the original text back.
 * Elements inside (an inline image, a link) are kept as they are.
 */
export function splitWords(element: HTMLElement) {
	const existing = [...element.querySelectorAll<HTMLElement>("[data-sg-word]")];
	if (existing.length > 0) return { words: existing, restore: () => {} };

	const original = [...element.childNodes].map((node) => node.cloneNode(true));
	const words: HTMLElement[] = [];
	for (const node of [...element.childNodes]) {
		if (node.nodeType !== Node.TEXT_NODE) continue;
		const parts = (node.textContent ?? "").split(/(\s+)/);
		const fragment = document.createDocumentFragment();
		for (const part of parts) {
			if (part === "") continue;
			if (/^\s+$/.test(part)) {
				fragment.append(part);
				continue;
			}
			const span = document.createElement("span");
			span.dataset.sgWord = "";
			span.textContent = part;
			words.push(span);
			fragment.append(span);
		}
		node.replaceWith(fragment);
	}
	return { words, restore: () => element.replaceChildren(...original) };
}

/** Where `element` sits inside `ancestor` (a positioned element), before any transform: offsets ignore them. */
export function boxWithin(element: HTMLElement, ancestor: HTMLElement) {
	let left = 0;
	let top = 0;
	let node: HTMLElement | null = element;
	while (node && node !== ancestor) {
		left += node.offsetLeft;
		top += node.offsetTop;
		node = node.offsetParent as HTMLElement | null;
	}
	return { left, top, width: element.offsetWidth, height: element.offsetHeight };
}

/** A section's text, split into words for React: `<span data-sg-word>` each, spaces kept between. */
export const wordsOf = (text: string) => text.split(/\s+/).filter(Boolean);
