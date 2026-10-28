import { adoptStyles, type DomHeroOptions } from "@/lib/sharingan";
import { createScrollScope, gsap, revealOnEnter, scrubs, type ScrollTrigger, type SectionEngine } from "@/lib/sharingan/scroll";
import { caseTrackConfigSchema, type CaseTrackConfig, type CaseTrackConfigInput } from "./schema";
import { CASE_TRACK_STYLE_ID, caseTrackStyles } from "./styles";

/**
 * Markup the engine expects inside the host:
 * - `[data-sg-stage]`, the element pinned while the section scrubs, with an optional `[data-sg-head]`;
 * - a `[data-sg-track]` list of `[data-sg-card]` items, the first one optionally `data-featured`;
 * - optionally a `[data-sg-foot]` with `[data-sg-prev]` and `[data-sg-next]` buttons and a
 *   `[data-sg-progress]` bar holding one span.
 */

/** Case track (Sharingan section). A row of cases moves sideways as the page scrolls. */
export function createCaseTrack({ host, config }: DomHeroOptions<CaseTrackConfigInput>): SectionEngine<CaseTrackConfigInput> {
	adoptStyles(host, CASE_TRACK_STYLE_ID, caseTrackStyles);
	host.classList.add("sg-ct");

	const stage = host.querySelector<HTMLElement>("[data-sg-stage]");
	const track = host.querySelector<HTMLElement>("[data-sg-track]");
	const cards = [...host.querySelectorAll<HTMLElement>("[data-sg-card]")];
	if (!stage || !track || cards.length === 0) return { setConfig() {}, refresh() {}, destroy() {} };
	const head = host.querySelector<HTMLElement>("[data-sg-head]");
	const foot = host.querySelector<HTMLElement>("[data-sg-foot]");
	const prev = host.querySelector<HTMLButtonElement>("[data-sg-prev]");
	const next = host.querySelector<HTMLButtonElement>("[data-sg-next]");
	const progress = host.querySelector<HTMLElement>("[data-sg-progress]");

	stage.classList.add("sg-ct-stage");
	head?.classList.add("sg-ct-head");
	foot?.classList.add("sg-ct-foot");
	track.classList.add("sg-ct-track");
	cards.forEach((card) => card.classList.add("sg-ct-card"));
	prev?.classList.add("sg-ct-arrow");
	next?.classList.add("sg-ct-arrow");
	progress?.classList.add("sg-ct-progress");

	let settings: CaseTrackConfig = caseTrackConfigSchema.parse(config ?? {});
	const applyLook = () => {
		host.style.setProperty("--sg-ct-accent", settings.accent);
		host.style.setProperty("--sg-ct-accent-2", settings.accentAlt);
	};
	applyLook();

	// How far along the row is (0 to 1): the bar and the arrows follow it.
	const show = (amount: number) => {
		const share = Math.min(1, track.clientWidth / Math.max(1, track.scrollWidth));
		progress?.style.setProperty("--p", (share + (1 - share) * amount).toFixed(4));
		if (prev) prev.disabled = amount <= 0.001;
		if (next) next.disabled = amount >= 0.999;
	};

	// Where each card starts along the row, from the first.
	const offsets = () => cards.map((card) => card.offsetLeft - cards[0].offsetLeft);
	/** The card that is at the row's start now. */
	const current = (x: number) => offsets().reduce((found, offset, index) => (offset <= x + 4 ? index : found), 0);

	// Set per build: how the arrows and focus move the row.
	let goTo: (index: number) => void = () => {};
	let position = () => 0;

	const cancel = new AbortController();
	const { signal } = cancel;
	prev?.addEventListener("click", () => goTo(current(position()) - 1), { signal });
	next?.addEventListener("click", () => goTo(current(position()) + 1), { signal });
	// Native scrolling (narrow screens, reduced motion): the bar follows the row.
	track.addEventListener(
		"scroll",
		() => {
			if (host.hasAttribute("data-scrub")) return;
			const room = track.scrollWidth - track.clientWidth;
			show(room > 0 ? track.scrollLeft / room : 1);
		},
		{ passive: true, signal },
	);

	const scope = createScrollScope(host, (context) => {
		const smooth = context.motion === "ready" ? "smooth" : "auto";
		if (!scrubs(context)) {
			revealOnEnter([head, track].filter((element): element is HTMLElement => element !== null), context);
			position = () => track.scrollLeft;
			goTo = (index) => {
				const target = offsets()[Math.max(0, Math.min(cards.length - 1, index))];
				track.scrollTo({ left: target, behavior: smooth });
			};
			const room = track.scrollWidth - track.clientWidth;
			show(room > 0 ? track.scrollLeft / room : 1);
			return;
		}

		// How far the row has to move, measured while it still scrolls on its own.
		track.scrollLeft = 0;
		const distance = Math.max(0, track.scrollWidth - track.clientWidth);
		host.dataset.scrub = "";
		const tween = gsap.to(track, {
			x: -distance,
			ease: "none",
			scrollTrigger: {
				trigger: stage,
				pin: true,
				start: "top top",
				end: () => `+=${Math.max(window.innerHeight * 0.5, distance * settings.speed)}`,
				scrub: 0.4,
				anticipatePin: 1,
				onUpdate: (self) => show(self.progress),
			},
		});
		const trigger = tween.scrollTrigger as ScrollTrigger;
		show(trigger.progress);

		// The page scrolls to where a card is at the row's start.
		const scrollFor = (x: number) => trigger.start + (distance > 0 ? Math.min(1, x / distance) : 0) * (trigger.end - trigger.start);
		// From the page's scroll, not the trigger's progress, which only updates on its next frame.
		position = () => Math.min(1, Math.max(0, (window.scrollY - trigger.start) / Math.max(1, trigger.end - trigger.start))) * distance;
		goTo = (index) => {
			const target = offsets()[Math.max(0, Math.min(cards.length - 1, index))];
			window.scrollTo({ top: scrollFor(target), behavior: smooth });
		};
		// Tabbing to a card brings it into view: the row is moved by the page, not by itself.
		const focus = (event: FocusEvent) => {
			const card = (event.target as HTMLElement).closest<HTMLElement>("[data-sg-card]");
			if (!card) return;
			const index = cards.indexOf(card);
			const x = offsets()[index];
			const visible = x >= position() && x + card.offsetWidth <= position() + track.clientWidth;
			if (!visible) window.scrollTo({ top: scrollFor(Math.max(0, x + card.offsetWidth - track.clientWidth + 16)), behavior: "auto" });
		};
		track.addEventListener("focusin", focus);

		return () => {
			track.removeEventListener("focusin", focus);
			delete host.dataset.scrub;
		};
	});

	return {
		setConfig(next) {
			settings = caseTrackConfigSchema.parse(next ?? {});
			applyLook();
			scope.rebuild();
		},
		refresh: scope.refresh,
		destroy() {
			cancel.abort();
			scope.destroy();
			progress?.style.removeProperty("--p");
			host.style.removeProperty("--sg-ct-accent");
			host.style.removeProperty("--sg-ct-accent-2");
		},
	};
}
