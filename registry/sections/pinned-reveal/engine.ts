import { adoptStyles, type DomHeroOptions } from "@/lib/sharingan";
import { createScrollScope, gsap, revealOnEnter, scrubs, splitWords, type SectionEngine } from "@/lib/sharingan/scroll";
import { pinnedRevealConfigSchema, type PinnedRevealConfig, type PinnedRevealConfigInput } from "./schema";
import { PINNED_REVEAL_STYLE_ID, pinnedRevealStyles } from "./styles";

/**
 * Markup the engine expects inside the host:
 * - optionally `[data-sg-stage]`, the element pinned while the section scrubs (the host otherwise);
 * - `[data-sg-headline]`, darkened word by word;
 * - `[data-sg-frame]` holding the image, and optionally a `[data-sg-caption]`.
 */

/** Pinned reveal (Sharingan section). The image grows to full width under a pinned headline. */
export function createPinnedReveal({ host, config }: DomHeroOptions<PinnedRevealConfigInput>): SectionEngine<PinnedRevealConfigInput> {
	adoptStyles(host, PINNED_REVEAL_STYLE_ID, pinnedRevealStyles);
	host.classList.add("sg-pr");

	const stage = host.querySelector<HTMLElement>("[data-sg-stage]") ?? host;
	const headline = host.querySelector<HTMLElement>("[data-sg-headline]");
	const frame = host.querySelector<HTMLElement>("[data-sg-frame]");
	const image = frame?.querySelector<HTMLImageElement>("img") ?? null;
	if (!headline || !frame || !image) return { setConfig() {}, refresh() {}, destroy() {} };
	const caption = frame.querySelector<HTMLElement>("[data-sg-caption]");
	const head = headline.closest<HTMLElement>("[data-sg-head]") ?? headline;

	stage.classList.add("sg-pr-stage");
	if (head !== headline) head.classList.add("sg-pr-head");
	frame.classList.add("sg-pr-frame");
	caption?.classList.add("sg-pr-caption");

	let settings: PinnedRevealConfig = pinnedRevealConfigSchema.parse(config ?? {});
	const applyLook = () => host.style.setProperty("--sg-pr-radius", `${settings.radius}px`);
	applyLook();
	const split = splitWords(headline);

	const scope = createScrollScope(host, (context) => {
		if (!scrubs(context)) {
			revealOnEnter([head, frame], context);
			return;
		}
		host.dataset.scrub = "";
		const lift = stage.clientHeight * 0.16;

		gsap.set(split.words, { opacity: 0.45 });
		gsap.set(frame, { scale: settings.start, y: lift });
		if (settings.parallax) gsap.set(image, { scale: 1.3 });
		if (caption) gsap.set(caption, { opacity: 0, y: 16 });

		const tl = gsap.timeline({
			defaults: { ease: "none" },
			scrollTrigger: { trigger: stage, pin: true, start: "top top", end: () => `+=${window.innerHeight * settings.length}`, scrub: 0.4, anticipatePin: 1 },
		});
		tl.to(split.words, { opacity: 1, duration: 0.3, stagger: 2.4 / Math.max(1, split.words.length) }, 0);
		tl.to(frame, { scale: 1, y: 0, duration: 3, ease: "power1.inOut" }, 0);
		if (settings.parallax) tl.to(image, { scale: 1, duration: 3, ease: "power1.inOut" }, 0);
		if (caption) tl.to(caption, { opacity: 1, y: 0, duration: 0.5 }, 2.7);
		tl.to({}, { duration: 0.4 });

		return () => delete host.dataset.scrub;
	});

	return {
		setConfig(next) {
			settings = pinnedRevealConfigSchema.parse(next ?? {});
			applyLook();
			scope.rebuild();
		},
		refresh: scope.refresh,
		destroy() {
			scope.destroy();
			split.restore();
			host.style.removeProperty("--sg-pr-radius");
		},
	};
}
