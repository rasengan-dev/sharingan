import { adoptStyles, type DomHeroOptions } from "@/lib/sharingan";
import { boxWithin, createScrollScope, gsap, revealOnEnter, scrubs, type SectionEngine } from "@/lib/sharingan/scroll";
import { portraitBurstConfigSchema, type PortraitBurstConfig, type PortraitBurstConfigInput } from "./schema";
import { PORTRAIT_BURST_STYLE_ID, portraitBurstStyles } from "./styles";

/**
 * Markup the engine expects inside the host:
 * - `[data-sg-stage]`, the element pinned while the section scrubs;
 * - in it, a `[data-sg-head]` with the headline, centred;
 * - a list of `[data-sg-person]` items, each a `figure` with its portrait (and an optional
 *   `figcaption`), placed on the stylesheet's slots in order;
 * - optionally `[data-sg-pill]` items, short facts set between the portraits.
 */

/** Portrait burst (Sharingan section). A stack of portraits bursts into a constellation around the headline. */
export function createPortraitBurst({ host, config }: DomHeroOptions<PortraitBurstConfigInput>): SectionEngine<PortraitBurstConfigInput> {
	adoptStyles(host, PORTRAIT_BURST_STYLE_ID, portraitBurstStyles);
	host.classList.add("sg-pb");

	const stage = host.querySelector<HTMLElement>("[data-sg-stage]");
	const people = [...host.querySelectorAll<HTMLElement>("[data-sg-person]")];
	if (!stage || people.length === 0) return { setConfig() {}, refresh() {}, destroy() {} };
	const head = host.querySelector<HTMLElement>("[data-sg-head]");
	const pills = [...host.querySelectorAll<HTMLElement>("[data-sg-pill]")];

	stage.classList.add("sg-pb-stage");
	head?.classList.add("sg-pb-head");
	people.forEach((person) => person.classList.add("sg-pb-person"));
	people[0]?.parentElement?.classList.add("sg-pb-people");
	pills.forEach((pill) => pill.classList.add("sg-pb-pill"));
	pills[0]?.parentElement?.classList.add("sg-pb-pills");

	let settings: PortraitBurstConfig = portraitBurstConfigSchema.parse(config ?? {});
	const applyLook = () => host.style.setProperty("--sg-pb-accent", settings.accent);
	applyLook();

	const scope = createScrollScope(host, (context) => {
		// Small portraits are too small for their names.
		people.forEach((person) => person.toggleAttribute("data-small", person.offsetWidth < 110));
		if (!scrubs(context)) {
			revealOnEnter([head, ...people, ...pills].filter((element): element is HTMLElement => element !== null), context);
			return;
		}

		const width = stage.clientWidth;
		const height = stage.clientHeight;
		// Every portrait starts in one stack at the centre, below it, leaning one way or the other.
		people.forEach((person, index) => {
			const box = boxWithin(person, stage);
			const dx = width / 2 - (box.left + box.width / 2);
			const dy = height / 2 - (box.top + box.height / 2);
			const lean = ((index * 37) % 7) / 3 - 1;
			gsap.set(person, { x: dx + lean * 14, y: dy + height * 0.55, scale: 1.25 / Math.max(0.5, Number(getComputedStyle(person).getPropertyValue("--s")) || 1), rotation: lean * settings.tilt, opacity: 0 });
		});
		gsap.set(pills, { opacity: 0, scale: 0.8 });
		if (head) gsap.set(head, { opacity: 0.3 });

		const tl = gsap.timeline({
			defaults: { ease: "none" },
			scrollTrigger: { trigger: stage, pin: true, start: "top top", end: () => `+=${window.innerHeight * settings.length}`, scrub: 0.4, anticipatePin: 1 },
		});
		// The stack rises to the centre, over the headline,
		tl.to(people, { y: `-=${height * 0.55}`, opacity: 1, duration: 0.8, ease: "power2.out", stagger: 0.04 }, 0);
		// then bursts to the slots, and the headline comes clear.
		tl.to(people, { x: 0, y: 0, scale: 1, rotation: 0, duration: 1.2, ease: "power3.inOut", stagger: { each: 0.03, from: "center" } }, 1);
		if (head) tl.to(head, { opacity: 1, duration: 0.5 }, 1.5);
		tl.to(pills, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)", stagger: 0.1 }, 1.9);
		tl.to({}, { duration: 0.7 });

		// On the way out, each portrait drifts up at its own speed. Triggered by the pinned stage,
		// whose later triggers ScrollTrigger moves past the pin, so it starts where the pin ends.
		if (settings.drift > 0) {
			people.forEach((person, index) => {
				const speed = 0.4 + ((index * 53) % 10) / 10;
				gsap.to(person, {
					yPercent: -120 * settings.drift * speed,
					ease: "none",
					scrollTrigger: { trigger: stage, start: "top top", end: () => `+=${stage.offsetHeight}`, scrub: 0.3 },
				});
			});
		}
	});

	return {
		setConfig(next) {
			settings = portraitBurstConfigSchema.parse(next ?? {});
			applyLook();
			scope.rebuild();
		},
		refresh: scope.refresh,
		destroy() {
			scope.destroy();
			people.forEach((person) => person.removeAttribute("data-small"));
			host.style.removeProperty("--sg-pb-accent");
		},
	};
}
