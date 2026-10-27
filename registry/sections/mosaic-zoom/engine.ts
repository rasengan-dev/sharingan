import { adoptStyles, type DomHeroOptions } from "@/lib/sharingan";
import { boxWithin, createScrollScope, gsap, revealOnEnter, scrubs, type SectionEngine } from "@/lib/sharingan/scroll";
import { mosaicZoomConfigSchema, type MosaicZoomConfig, type MosaicZoomConfigInput } from "./schema";
import { MOSAIC_ZOOM_STYLE_ID, mosaicZoomStyles } from "./styles";

/**
 * Markup the engine expects inside the host:
 * - `[data-sg-stage]`, the element pinned while the section scrubs, holding a `[data-sg-mosaic]` grid;
 * - in it, one `[data-sg-feature]` (with an optional `[data-sg-caption]`) and the `[data-sg-tile]` items.
 */

const MAX_ZOOM = 2.4;

/** Mosaic zoom (Sharingan section). A full-screen image shrinks into a mosaic that gathers around it. */
export function createMosaicZoom({ host, config }: DomHeroOptions<MosaicZoomConfigInput>): SectionEngine<MosaicZoomConfigInput> {
	adoptStyles(host, MOSAIC_ZOOM_STYLE_ID, mosaicZoomStyles);
	host.classList.add("sg-mz");

	const stage = host.querySelector<HTMLElement>("[data-sg-stage]");
	const mosaic = host.querySelector<HTMLElement>("[data-sg-mosaic]");
	const feature = host.querySelector<HTMLElement>("[data-sg-feature]");
	const tiles = [...host.querySelectorAll<HTMLElement>("[data-sg-tile]")];
	if (!stage || !mosaic || !feature) return { setConfig() {}, refresh() {}, destroy() {} };
	const caption = feature.querySelector<HTMLElement>("[data-sg-caption]");
	const head = host.querySelector<HTMLElement>("[data-sg-head]");

	stage.classList.add("sg-mz-stage");
	mosaic.classList.add("sg-mz-grid");
	feature.classList.add("sg-mz-tile", "sg-mz-feature");
	tiles.forEach((tile) => tile.classList.add("sg-mz-tile"));
	caption?.classList.add("sg-mz-caption");
	head?.classList.add("sg-mz-head");
	mosaic.style.setProperty("--rows", String(Math.max(3, Math.ceil(tiles.length / 4))));

	let settings: MosaicZoomConfig = mosaicZoomConfigSchema.parse(config ?? {});

	const scope = createScrollScope(host, (context) => {
		if (!scrubs(context)) {
			revealOnEnter([head, mosaic].filter((element): element is HTMLElement => element !== null), context);
			return;
		}
		host.dataset.scrub = "";
		const width = stage.clientWidth;
		const height = stage.clientHeight;
		const box = boxWithin(feature, stage);
		const centerX = box.left + box.width / 2;
		const centerY = box.top + box.height / 2;

		// The feature starts centred and large: covering the stage, up to a zoom that keeps its photo sharp.
		const zoom = Math.min(Math.max(width / box.width, height / box.height) * 1.02, MAX_ZOOM);
		gsap.set(feature, { x: width / 2 - centerX, y: height / 2 - centerY, scale: zoom });
		if (caption) gsap.set(caption, { opacity: 0, y: 12 });
		// The tiles start further out along the line from the feature, nearest first to arrive.
		const order = tiles
			.map((tile) => {
				const own = boxWithin(tile, stage);
				const dx = own.left + own.width / 2 - centerX;
				const dy = own.top + own.height / 2 - centerY;
				gsap.set(tile, { x: dx * settings.spread, y: dy * settings.spread, opacity: 0, scale: 0.85 });
				return { tile, distance: Math.hypot(dx, dy) };
			})
			.sort((a, b) => a.distance - b.distance)
			.map(({ tile }) => tile);

		const tl = gsap.timeline({
			defaults: { ease: "none" },
			scrollTrigger: { trigger: stage, pin: true, start: "top top", end: () => `+=${window.innerHeight * settings.length}`, scrub: 0.4, anticipatePin: 1 },
		});
		tl.to(feature, { x: 0, y: 0, scale: 1, duration: 2, ease: "power2.inOut" }, 0.3);
		tl.to(order, { x: 0, y: 0, opacity: 1, scale: 1, duration: 1.4, ease: "power2.out", stagger: 0.06 }, 0.9);
		if (caption) tl.to(caption, { opacity: 1, y: 0, duration: 0.4 }, 2.2);
		tl.to({}, { duration: 0.4 });

		return () => delete host.dataset.scrub;
	});

	return {
		setConfig(next) {
			settings = mosaicZoomConfigSchema.parse(next ?? {});
			scope.rebuild();
		},
		refresh: scope.refresh,
		destroy() {
			scope.destroy();
			mosaic.style.removeProperty("--rows");
		},
	};
}
