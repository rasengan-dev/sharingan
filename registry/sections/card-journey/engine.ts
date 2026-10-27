import { adoptStyles, type DomHeroOptions } from "@/lib/sharingan";
import { boxWithin, createScrollScope, Flip, gsap, revealOnEnter, scrubs, splitWords, type SectionEngine } from "@/lib/sharingan/scroll";
import { cardJourneyConfigSchema, type CardJourneyConfig, type CardJourneyConfigInput } from "./schema";
import { CARD_JOURNEY_STYLE_ID, cardJourneyStyles } from "./styles";

/**
 * Markup the engine expects inside the host:
 * - optionally `[data-sg-stage]`, the element pinned while the section scrubs (the host otherwise);
 * - `[data-sg-statement]`, the paragraph read on scroll (split into words here if it is plain text);
 * - optionally `[data-sg-aside]`, the note beside the staircase;
 * - `[data-sg-grid]` with `[data-sg-copy]` and `[data-sg-panel]`, which holds the `[data-sg-card]`
 *   items and, optionally, `[data-sg-tab]` buttons (`data-cards="0,2,4"`: the cards they show).
 */

type Pose = { x: number; y: number; scale: number; rotation: number };

/** Card journey (Sharingan section). A deck, a staircase, then a grid, driven by the scroll. */
export function createCardJourney({ host, config }: DomHeroOptions<CardJourneyConfigInput>): SectionEngine<CardJourneyConfigInput> {
	adoptStyles(host, CARD_JOURNEY_STYLE_ID, cardJourneyStyles);
	host.classList.add("sg-cj");

	const stage = host.querySelector<HTMLElement>("[data-sg-stage]") ?? host;
	const statement = host.querySelector<HTMLElement>("[data-sg-statement]");
	const aside = host.querySelector<HTMLElement>("[data-sg-aside]");
	const grid = host.querySelector<HTMLElement>("[data-sg-grid]");
	const copy = host.querySelector<HTMLElement>("[data-sg-copy]");
	const panel = host.querySelector<HTMLElement>("[data-sg-panel]");
	const cards = [...host.querySelectorAll<HTMLElement>("[data-sg-card]")];
	if (!statement || !grid || !panel || cards.length === 0) return { setConfig() {}, refresh() {}, destroy() {} };

	const tabs = [...host.querySelectorAll<HTMLButtonElement>("[data-sg-tab]")];
	const tabList = tabs[0]?.parentElement ?? null;

	// A Web Component's markup gets the same classes the React section renders.
	stage.classList.add("sg-cj-stage");
	statement.classList.add("sg-cj-statement");
	aside?.classList.add("sg-cj-aside");
	grid.classList.add("sg-cj-grid");
	copy?.classList.add("sg-cj-copy");
	panel.classList.add("sg-cj-panel");
	cards[0].parentElement?.classList.add("sg-cj-cards");
	cards.forEach((card) => card.classList.add("sg-cj-card"));
	tabList?.classList.add("sg-cj-tabs");
	tabs.forEach((tab) => tab.classList.add("sg-cj-tab"));

	// The panel's surface fades in on its own, after the cards have landed.
	let surface = panel.querySelector<HTMLElement>(".sg-cj-panel-bg");
	const ownSurface = !surface;
	if (!surface) {
		surface = document.createElement("div");
		surface.className = "sg-cj-panel-bg";
		surface.setAttribute("aria-hidden", "true");
		panel.prepend(surface);
	}

	let settings: CardJourneyConfig = cardJourneyConfigSchema.parse(config ?? {});
	const applyLook = () => host.style.setProperty("--sg-cj-accent", settings.accent);
	applyLook();

	const split = splitWords(statement);
	const cancel = new AbortController();
	const { signal } = cancel;
	let timeline: gsap.core.Timeline | null = null;
	let quiet = true;

	// Tabs: each shows some of the cards; the grid closes up with Flip.
	const shownBy = (tab: HTMLElement) => {
		const list = tab.dataset.cards?.split(",").map(Number).filter(Number.isInteger);
		return list && list.length > 0 ? new Set(list) : null;
	};
	let selected = Math.max(0, tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true"));
	const showTab = (index: number) => {
		selected = index;
		const only = shownBy(tabs[index]);
		cards.forEach((card, position) => (card.hidden = only ? !only.has(position) : false));
		tabs.forEach((tab, position) => {
			tab.setAttribute("aria-selected", String(position === index));
			tab.tabIndex = position === index ? 0 : -1;
		});
	};
	// A switch animates the cards with Flip and the panel's height alongside, so the surface never jumps.
	// Clicks during a switch are not lost: the last tab asked for follows once the cards have settled.
	let switching = false;
	let queued: number | null = null;
	const selectTab = (index: number) => {
		if (switching) {
			queued = index;
			return;
		}
		if (index === selected) return;
		if (quiet) {
			showTab(index);
			scope.rebuild();
			return;
		}
		switching = true;
		const from = panel.offsetHeight;
		const state = Flip.getState(cards);
		showTab(index);
		const to = panel.offsetHeight;

		// The height is let go only when the last card has landed: until then the cards are taken out of the flow.
		gsap.fromTo(panel, { height: from }, { height: to, duration: 0.6, ease: "power2.inOut" });
		Flip.from(state, {
			duration: 0.6,
			ease: "power2.inOut",
			absolute: true,
			stagger: 0.03,
			onEnter: (entering) => gsap.fromTo(entering, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.45, delay: 0.15, ease: "power2.out" }),
			onLeave: (leaving) => gsap.to(leaving, { opacity: 0, scale: 0.92, duration: 0.3, ease: "power2.in" }),
			onComplete: () => {
				gsap.set(panel, { clearProps: "height" });
				switching = false;
				const next = queued;
				queued = null;
				if (next !== null && next !== selected) selectTab(next);
				// The journey is measured from the cards that are shown; the grid looks the same, so the rebuild is invisible.
				else scope.rebuild();
			},
		});
	};
	if (tabs.length > 0) {
		showTab(selected);
		tabs.forEach((tab, index) => tab.addEventListener("click", () => selectTab(index), { signal }));
		tabList?.addEventListener(
			"keydown",
			(event) => {
				if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
				event.preventDefault();
				// From the focused tab: during a switch, the one shown may still be the previous one.
				const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
				const next = ((current >= 0 ? current : selected) + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
				tabs[next].focus();
				selectTab(next);
			},
			{ signal },
		);
	}

	// Tabbing into the grid before the cards have landed jumps to where they have.
	grid.addEventListener(
		"focusin",
		() => {
			const trigger = timeline?.scrollTrigger;
			if (!trigger || trigger.progress > 0.999) return;
			trigger.scroll(trigger.end);
			trigger.getTween()?.progress(1);
		},
		{ signal },
	);

	const scope = createScrollScope(host, (context) => {
		const shown = cards.filter((card) => !card.hidden);
		// Sized for every card, whichever tab is open: switching tabs never resizes them.
		panel.style.setProperty("--rows", String(Math.max(1, Math.ceil(cards.length / 3))));
		quiet = context.motion !== "ready";

		if (!scrubs(context)) {
			revealOnEnter([statement, aside, copy, panel].filter((element): element is HTMLElement => element !== null), context);
			return;
		}

		host.dataset.scrub = "";
		const width = stage.clientWidth;
		const height = stage.clientHeight;
		const gutter = parseFloat(getComputedStyle(stage).paddingLeft) || 24;
		const count = shown.length;
		const middle = (count - 1) / 2;

		// The deck never covers the paragraph: beside it on wide screens, under it on tall ones (tablets held upright).
		const beside = width >= height * 1.15;
		host.dataset.layout = beside ? "beside" : "below";
		const deckWidth = beside ? Math.min(width * 0.17, height * 0.34 * 0.8) : Math.min(width * 0.26, height * 0.2);
		const deckHeight = deckWidth * 1.4; // a 4:5 image and its caption
		let deckX = width / 2;
		let deckY = height / 2;
		if (beside) {
			// Room on the right for a shuffled card to slide out, then the paragraph takes what is left.
			deckX = width - gutter - deckWidth * 1.4;
			statement.style.setProperty("--sg-cj-text-width", `${Math.max(240, deckX - deckWidth / 2 - gutter - 48)}px`);
		} else {
			const textBottom = statement.offsetTop + statement.offsetHeight;
			// Centred in the room under the paragraph.
			deckY = Math.min(Math.max((textBottom + height) / 2, textBottom + 32 + deckHeight / 2), height - deckHeight / 2 - 16);
		}
		const boxes = shown.map((card) => boxWithin(card, stage));

		const pose = (index: number, x: number, y: number, size: number, rotation: number): Pose => {
			const box = boxes[index];
			return { x: x - (box.left + box.width / 2), y: y - (box.top + box.height / 2), scale: size / box.width, rotation };
		};
		const deck = (index: number) =>
			pose(index, deckX + (index - middle) * 2, deckY + (index - middle) * 1.5, deckWidth, middle === 0 ? 0 : ((index - middle) / middle) * settings.tilt);
		const stair = (index: number) => {
			const t = count > 1 ? index / (count - 1) : 0;
			return pose(index, width * (0.32 + 0.56 * t), height * (0.3 + 0.5 * t), Math.min(width * 0.12, height * 0.3 * 0.8), 0);
		};

		// Stacked captions would run into each other: they appear once the cards have landed.
		const captions = shown.flatMap((card) => [...card.querySelectorAll<HTMLElement>(".sg-cj-caption")]);
		gsap.set(split.words, { opacity: 0.45 });
		gsap.set(captions, { opacity: 0 });
		shown.forEach((card, index) => gsap.set(card, { ...deck(index), zIndex: index + 1 }));
		gsap.set([surface, tabList, copy].filter(Boolean), { opacity: 0, y: 24 });
		if (aside) gsap.set(aside, { opacity: 0, y: 24 });

		const tl = gsap.timeline({
			defaults: { ease: "none" },
			scrollTrigger: { trigger: stage, pin: true, start: "top top", end: () => `+=${window.innerHeight * settings.length}`, scrub: 0.5, anticipatePin: 1 },
		});

		// 1. The paragraph is read; the deck shuffles beside it.
		tl.to(split.words, { opacity: 1, duration: 0.5, stagger: 3.5 / Math.max(1, split.words.length) }, 0);
		if (settings.shuffle && count > 1) {
			const order = shown.map((_, index) => index);
			for (let turn = 0; turn < Math.min(3, count - 1); turn++) {
				const at = 0.6 + turn * 1.1;
				const top = order[order.length - 1];
				const rest = deck(top);
				// Beside the paragraph, cards slide out to the right only, away from the text.
				const side = beside || turn % 2 === 0 ? 1 : -1;
				tl.to(shown[top], { x: rest.x + deckWidth * 0.85 * side, y: rest.y - deckWidth * 0.1, rotation: rest.rotation + 9 * side, duration: 0.45, ease: "power1.out" }, at);
				order.unshift(order.pop()!);
				const stack = [...order];
				tl.set(shown, { zIndex: (index: number) => stack.indexOf(index) + 1 }, at + 0.45);
				tl.to(shown[top], { x: rest.x, y: rest.y, rotation: rest.rotation, duration: 0.45, ease: "power1.in" }, at + 0.46);
			}
		}

		// 2. The paragraph leaves; the deck deals out into a staircase beside the note.
		tl.to(statement, { opacity: 0, y: -40, duration: 0.8 }, 4);
		tl.set(shown, { zIndex: (index: number) => index + 1 }, 4.2);
		tl.to(shown, { x: (index) => stair(index).x, y: (index) => stair(index).y, scale: (index) => stair(index).scale, rotation: 0, duration: 1.6, ease: "power2.inOut", stagger: 0.1 }, 4.2);
		if (aside) tl.to(aside, { opacity: 1, y: 0, duration: 0.8 }, 4.8);

		// 3. The cards land in the grid, which takes its surface, tabs and copy.
		if (aside) tl.to(aside, { opacity: 0, y: -16, duration: 0.6 }, 7);
		tl.to(shown, { x: 0, y: 0, scale: 1, rotation: 0, duration: 1.6, ease: "power2.inOut", stagger: 0.08 }, 7.1);
		tl.to(surface, { opacity: 1, y: 0, duration: 0.8 }, 8);
		tl.to(captions, { opacity: 1, duration: 0.6 }, 8.2);
		tl.to([tabList, copy].filter(Boolean), { opacity: 1, y: 0, duration: 0.8, stagger: 0.15 }, 8.2);
		tl.to({}, { duration: 0.6 });

		timeline = tl;
		return () => {
			delete host.dataset.scrub;
			delete host.dataset.layout;
			statement.style.removeProperty("--sg-cj-text-width");
			timeline = null;
		};
	});

	return {
		setConfig(next) {
			settings = cardJourneyConfigSchema.parse(next ?? {});
			applyLook();
			scope.rebuild();
		},
		refresh: scope.refresh,
		destroy() {
			cancel.abort();
			scope.destroy();
			split.restore();
			if (ownSurface) surface.remove();
			host.style.removeProperty("--sg-cj-accent");
			panel.style.removeProperty("--rows");
		},
	};
}
