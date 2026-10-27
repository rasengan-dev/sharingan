import { adoptStyles, type DomHeroOptions } from "@/lib/sharingan";
import { createScrollScope, gsap, revealOnEnter, scrubs, type SectionEngine } from "@/lib/sharingan/scroll";
import { parallaxColumnsConfigSchema, type ParallaxColumnsConfig, type ParallaxColumnsConfigInput } from "./schema";
import { PARALLAX_COLUMNS_STYLE_ID, parallaxColumnsStyles } from "./styles";

/**
 * Markup the engine expects inside the host: a `[data-sg-grid]` with two
 * `[data-sg-column]` elements of `[data-sg-card]` items, each card's photo
 * inside a `[data-sg-media]`.
 */

/** Parallax columns (Sharingan section). Two columns of cards drift apart with the scroll. */
export function createParallaxColumns({ host, config }: DomHeroOptions<ParallaxColumnsConfigInput>): SectionEngine<ParallaxColumnsConfigInput> {
	adoptStyles(host, PARALLAX_COLUMNS_STYLE_ID, parallaxColumnsStyles);
	host.classList.add("sg-pc");

	const grid = host.querySelector<HTMLElement>("[data-sg-grid]");
	const columns = [...host.querySelectorAll<HTMLElement>("[data-sg-column]")];
	const cards = [...host.querySelectorAll<HTMLElement>("[data-sg-card]")];
	if (!grid || columns.length === 0) return { setConfig() {}, refresh() {}, destroy() {} };

	grid.classList.add("sg-pc-grid");
	columns.forEach((column) => column.classList.add("sg-pc-column"));
	cards.forEach((card) => card.classList.add("sg-pc-card"));
	host.querySelectorAll("[data-sg-media]").forEach((media) => media.classList.add("sg-pc-media"));

	let settings: ParallaxColumnsConfig = parallaxColumnsConfigSchema.parse(config ?? {});

	const scope = createScrollScope(host, (context) => {
		if (!scrubs(context)) {
			revealOnEnter(cards, context);
			return;
		}
		const travel = window.innerHeight * settings.speed;
		// The left column drifts a little, the right one (set lower) climbs past it.
		columns.forEach((column, index) => {
			const reach = travel * (index === 0 ? 0.1 : 0.36);
			gsap.fromTo(column, { y: reach }, { y: -reach, ease: "none", scrollTrigger: { trigger: grid, start: "top bottom", end: "bottom top", scrub: 0.3 } });
		});
		if (settings.depth) {
			for (const card of cards) {
				const photo = card.querySelector("[data-sg-media] img");
				if (!photo) continue;
				gsap.fromTo(photo, { yPercent: -5 }, { yPercent: 5, ease: "none", scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true } });
			}
		}
	});

	return {
		setConfig(next) {
			settings = parallaxColumnsConfigSchema.parse(next ?? {});
			scope.rebuild();
		},
		refresh: scope.refresh,
		destroy: scope.destroy,
	};
}
