import { adoptStyles, type DomHeroOptions } from "@/lib/sharingan";
import { createScrollScope, gsap, revealOnEnter, scrubs, type SectionEngine } from "@/lib/sharingan/scroll";
import { splitWordConfigSchema, type SplitWordConfig, type SplitWordConfigInput } from "./schema";
import { SPLIT_WORD_STYLE_ID, splitWordStyles } from "./styles";

/**
 * Markup the engine expects inside the host:
 * - `[data-sg-stage]`, the element pinned while the section scrubs;
 * - a `[data-sg-line]` holding two `[data-sg-half]` elements (the word's two halves, as
 *   text or as one `[data-sg-letter]` span per letter) with the `[data-sg-card]` between them;
 * - optionally a `[data-sg-below]` element (the form), shown once the card is in.
 * The halves are a picture of the word: give them `aria-hidden` and the word itself to a heading.
 */

/** Splits a half's text into one span per letter (a space is kept as one); returns how to put it back. */
function splitLetters(half: HTMLElement) {
	const existing = [...half.querySelectorAll<HTMLElement>("[data-sg-letter]")];
	if (existing.length > 0) return { letters: existing, restore: () => {} };
	const text = half.textContent ?? "";
	const letters = [...text].map((character) => {
		const span = document.createElement("span");
		span.dataset.sgLetter = "";
		span.textContent = character;
		return span;
	});
	half.replaceChildren(...letters);
	return { letters, restore: () => (half.textContent = text) };
}

/** Split word (Sharingan section). A giant word comes together, then parts for a card. */
export function createSplitWord({ host, config }: DomHeroOptions<SplitWordConfigInput>): SectionEngine<SplitWordConfigInput> {
	adoptStyles(host, SPLIT_WORD_STYLE_ID, splitWordStyles);
	host.classList.add("sg-sw");

	const stage = host.querySelector<HTMLElement>("[data-sg-stage]");
	const line = host.querySelector<HTMLElement>("[data-sg-line]");
	const halves = [...host.querySelectorAll<HTMLElement>("[data-sg-half]")].slice(0, 2);
	const card = host.querySelector<HTMLElement>("[data-sg-card]");
	if (!stage || !line || halves.length < 2 || !card) return { setConfig() {}, refresh() {}, destroy() {} };
	const below = host.querySelector<HTMLElement>("[data-sg-below]");

	stage.classList.add("sg-sw-stage");
	line.classList.add("sg-sw-line");
	halves.forEach((half) => half.classList.add("sg-sw-half"));
	card.classList.add("sg-sw-card");
	below?.classList.add("sg-sw-below");
	const splits = halves.map(splitLetters);
	const [left, right] = splits.map((split) => split.letters);
	[...left, ...right].forEach((letter) => letter.classList.add("sg-sw-letter"));

	let settings: SplitWordConfig = splitWordConfigSchema.parse(config ?? {});
	const applyLook = () => {
		host.style.setProperty("--sg-sw-accent", settings.accent);
		host.style.setProperty("--sg-sw-tilt", `${settings.tilt}deg`);
	};
	applyLook();

	// The word fills the line without overflowing it, whatever its length.
	const fit = () => {
		host.style.removeProperty("--sg-sw-size");
		const style = getComputedStyle(stage);
		const room = stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
		// Summed from the parts: a centred row overflows on both sides, which scrollWidth misses.
		const margins = parseFloat(getComputedStyle(card).marginLeft) + parseFloat(getComputedStyle(card).marginRight);
		const natural = halves[0].offsetWidth + card.offsetWidth + margins + halves[1].offsetWidth;
		if (natural <= room) return;
		const size = parseFloat(getComputedStyle(halves[0]).fontSize);
		host.style.setProperty("--sg-sw-size", `${Math.floor(size * (room / natural) * 0.98)}px`);
	};

	const scope = createScrollScope(host, (context) => {
		fit();
		if (!scrubs(context)) {
			revealOnEnter([line, below].filter((element): element is HTMLElement => element !== null), context);
			return;
		}
		host.dataset.scrub = "";
		const height = stage.clientHeight;
		// The gap the card sits in: closing it brings the halves together into one word.
		const gap = halves[1].offsetLeft - (halves[0].offsetLeft + halves[0].offsetWidth);
		const letters = [...left, ...right];
		const width = (halves[0].offsetWidth + halves[1].offsetWidth) / Math.max(1, letters.length);
		const middle = (letters.length - 1) / 2;
		const closed = (letter: HTMLElement) => (left.includes(letter) ? gap / 2 : -gap / 2);

		// The letters start spread wide from the middle of the closed word, and faint.
		letters.forEach((letter, index) => gsap.set(letter, { x: closed(letter) + (index - middle) * width * settings.spread, opacity: 0.2 }));
		gsap.set(card, { y: height * 0.7, rotation: 10, scale: 0.92 });
		if (below) gsap.set(below, { opacity: 0, y: 32 });

		const tl = gsap.timeline({
			defaults: { ease: "none" },
			scrollTrigger: { trigger: stage, pin: true, start: "top top", end: () => `+=${window.innerHeight * settings.length}`, scrub: 0.4, anticipatePin: 1 },
		});
		// The letters pull together into one word,
		tl.to(letters, { x: (_index: number, letter: HTMLElement) => closed(letter), opacity: 1, duration: 1, ease: "power2.out", stagger: { each: 0.02, from: "center" } }, 0);
		// the word parts at its split, and the card rises into the gap,
		tl.to(letters, { x: 0, duration: 0.9, ease: "power3.inOut" }, 1.2);
		tl.to(card, { y: 0, rotation: 0, scale: 1, duration: 1, ease: "power3.out" }, 1.35);
		// then what comes after.
		if (below) tl.to(below, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 2.2);
		tl.to({}, { duration: 0.4 });

		return () => delete host.dataset.scrub;
	});

	return {
		setConfig(next) {
			settings = splitWordConfigSchema.parse(next ?? {});
			applyLook();
			scope.rebuild();
		},
		refresh: scope.refresh,
		destroy() {
			scope.destroy();
			splits.forEach((split) => split.restore());
			host.style.removeProperty("--sg-sw-accent");
			host.style.removeProperty("--sg-sw-tilt");
			host.style.removeProperty("--sg-sw-size");
		},
	};
}
