import { adoptStyles, type DomHeroOptions } from "@/lib/sharingan";
import { createScrollScope, gsap, revealOnEnter, splitWords, type SectionEngine } from "@/lib/sharingan/scroll";
import { scrollReadConfigSchema, type ScrollReadConfig, type ScrollReadConfigInput } from "./schema";
import { SCROLL_READ_STYLE_ID, scrollReadStyles } from "./styles";

/**
 * Markup the engine expects inside the host: a `[data-sg-read]` paragraph, its
 * images either wrapped in `[data-sg-inline]` or set directly as `<img>` in it.
 * Plain text is split into words here.
 */

/** Scroll read (Sharingan section). Words darken one by one with the scroll; it is never pinned. */
export function createScrollRead({ host, config }: DomHeroOptions<ScrollReadConfigInput>): SectionEngine<ScrollReadConfigInput> {
	adoptStyles(host, SCROLL_READ_STYLE_ID, scrollReadStyles);
	host.classList.add("sg-sr");

	const text = host.querySelector<HTMLElement>("[data-sg-read]");
	if (!text) return { setConfig() {}, refresh() {}, destroy() {} };
	text.classList.add("sg-sr-text");

	let settings: ScrollReadConfig = scrollReadConfigSchema.parse(config ?? {});
	const split = splitWords(text);
	// Words and images, in reading order.
	const items = [...text.querySelectorAll<HTMLElement>("[data-sg-word], [data-sg-inline], :scope > img")];
	const pictures = items.filter((item) => !item.hasAttribute("data-sg-word"));

	const scope = createScrollScope(host, (context) => {
		// Not pinned: phones scrub it too.
		if (context.motion !== "ready") {
			revealOnEnter([text], context);
			return;
		}
		gsap.set(split.words, { opacity: settings.from });
		if (settings.pop) gsap.set(pictures, { scale: 0 });

		const tl = gsap.timeline({
			defaults: { ease: "none" },
			scrollTrigger: { trigger: text, start: "top 82%", end: "bottom 45%", scrub: 0.3 },
		});
		items.forEach((item, index) => {
			const picture = pictures.includes(item);
			if (picture && !settings.pop) return;
			tl.to(item, picture ? { scale: 1, duration: 1.2, ease: "back.out(2)" } : { opacity: 1, duration: 1 }, index * 0.5);
		});
	});

	return {
		setConfig(next) {
			settings = scrollReadConfigSchema.parse(next ?? {});
			scope.rebuild();
		},
		refresh: scope.refresh,
		destroy() {
			scope.destroy();
			split.restore();
		},
	};
}
