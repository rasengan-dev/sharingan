import { adoptStyles, type DomHeroOptions } from "@/lib/sharingan";
import { createScrollScope, gsap, type SectionEngine } from "@/lib/sharingan/scroll";
import { imageMarqueeConfigSchema, type ImageMarqueeConfig, type ImageMarqueeConfigInput } from "./schema";
import { IMAGE_MARQUEE_STYLE_ID, imageMarqueeStyles } from "./styles";

/**
 * Markup the engine expects inside the host: one or two `[data-sg-row]`
 * elements, each holding a `[data-sg-track]` list of words and images. The
 * second row moves the other way; it is decorative and `aria-hidden`.
 */

/** Image marquee (Sharingan section). Rows of words and images pushed sideways by the scroll. */
export function createImageMarquee({ host, config }: DomHeroOptions<ImageMarqueeConfigInput>): SectionEngine<ImageMarqueeConfigInput> {
	adoptStyles(host, IMAGE_MARQUEE_STYLE_ID, imageMarqueeStyles);
	host.classList.add("sg-im");

	const rows = [...host.querySelectorAll<HTMLElement>("[data-sg-row]")];
	if (rows.length === 0) return { setConfig() {}, refresh() {}, destroy() {} };
	rows[0].parentElement?.classList.add("sg-im-band");
	rows.forEach((row) => row.classList.add("sg-im-row"));

	let settings: ImageMarqueeConfig = imageMarqueeConfigSchema.parse(config ?? {});
	const applyLook = () => {
		host.style.setProperty("--sg-im-band", settings.background);
		host.style.setProperty("--sg-im-ink", settings.ink);
		rows.forEach((row, index) => (row.hidden = index >= settings.rows));
	};
	applyLook();

	const scope = createScrollScope(host, (context) => {
		const width = host.clientWidth;
		const travel = (width * settings.distance) / 100;
		const clones: Element[] = [];

		rows.forEach((row, index) => {
			const track = row.querySelector<HTMLElement>("[data-sg-track]");
			if (!track || row.hidden) return;
			track.classList.add("sg-im-track");
			// Repeat the items until the row covers the band and the distance it travels.
			const items = [...track.children];
			const length = track.scrollWidth;
			for (let copies = 1; length > 0 && copies * length < width + travel + length; copies++) {
				for (const item of items) {
					const copy = item.cloneNode(true) as HTMLElement;
					copy.setAttribute("aria-hidden", "true");
					copy.querySelectorAll("img").forEach((image) => (image.alt = ""));
					track.append(copy);
					clones.push(copy);
				}
			}
			// Not pinned: phones move it too. Without motion the rows stay still.
			if (context.motion !== "ready") return;
			const forward = index % 2 === 0;
			gsap.fromTo(
				track,
				{ x: forward ? 0 : -travel },
				{ x: forward ? -travel : 0, ease: "none", scrollTrigger: { trigger: host, start: "top bottom", end: "bottom top", scrub: 0.3 } },
			);
		});

		return () => clones.forEach((clone) => clone.remove());
	});

	return {
		setConfig(next) {
			settings = imageMarqueeConfigSchema.parse(next ?? {});
			applyLook();
			scope.rebuild();
		},
		refresh: scope.refresh,
		destroy() {
			scope.destroy();
			host.style.removeProperty("--sg-im-band");
			host.style.removeProperty("--sg-im-ink");
		},
	};
}
