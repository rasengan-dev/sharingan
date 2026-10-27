/**
 * The mosaic zoom's stylesheet, added once per document: a headline, then a
 * grid of tiles with the featured image spanning the two middle columns. While it
 * scrubs (`data-scrub`), the mosaic is one screen tall and the featured image
 * and the tiles reach their places with `transform` and `opacity` only.
 */
export const MOSAIC_ZOOM_STYLE_ID = "sg-mosaic-zoom";

export const mosaicZoomStyles = /* css */ `
.sg-mz {
	--sg-mz-ink: var(--foreground, #111114);
	--sg-mz-muted: var(--muted-foreground, #66666c);
	--sg-mz-bg: var(--background, #f6f6f4);
	--sg-mz-gutter: clamp(16px, 5vw, 80px);
	position: relative;
	color: var(--sg-mz-ink);
	background: var(--sg-mz-bg);
}
.sg-mz :focus-visible { outline: 2px solid var(--sg-mz-ink); outline-offset: 4px; }
.sg-mz-head {
	display: flex; flex-direction: column; align-items: center; gap: 14px;
	max-width: 760px; margin: 0 auto; padding: clamp(64px, 10vw, 128px) var(--sg-mz-gutter) clamp(32px, 5vw, 56px);
	text-align: center;
}
.sg-mz-eyebrow { margin: 0; font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: var(--sg-mz-muted); }
.sg-mz-head h2 { margin: 0; font-size: clamp(34px, 5vw, 68px); line-height: 1.02; font-weight: 600; letter-spacing: -0.035em; text-wrap: balance; }
.sg-mz-head p:not(.sg-mz-eyebrow) { margin: 0; max-width: 34rem; font-size: 17px; line-height: 1.55; color: var(--sg-mz-muted); }
.sg-mz-cta {
	display: inline-flex; align-items: center; height: 44px; margin-top: 8px; padding: 0 20px; border-radius: 999px;
	font-size: 15px; font-weight: 500; text-decoration: none; color: var(--sg-mz-bg); background: var(--sg-mz-ink);
	transition: transform .15s;
}
.sg-mz-cta:hover { transform: translateY(-2px); }

.sg-mz-stage { position: relative; padding: 0 var(--sg-mz-gutter) clamp(64px, 10vw, 128px); }
.sg-mz-grid {
	display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); grid-auto-flow: dense; gap: 10px;
	max-width: 1280px; margin: 0 auto; padding: 0; list-style: none;
}
.sg-mz-tile { margin: 0; overflow: hidden; border-radius: 18px; aspect-ratio: 4 / 5; background: color-mix(in oklab, var(--sg-mz-ink) 8%, var(--sg-mz-bg)); }
.sg-mz-tile img { display: block; width: 100%; height: 100%; object-fit: cover; }
.sg-mz-feature { position: relative; z-index: 2; grid-column: 1 / span 2; grid-row: 1 / span 2; aspect-ratio: auto; }
.sg-mz-caption {
	position: absolute; left: 12px; bottom: 12px; display: flex; flex-direction: column; gap: 2px; margin: 0;
	padding: 10px 14px; border-radius: 14px; color: #111114; background: rgb(255 255 255 / .9); backdrop-filter: blur(8px);
}
.sg-mz-caption b { font-size: 14px; font-weight: 600; }
.sg-mz-caption span { font-size: 12px; color: #55555b; }

@media (min-width: 768px) {
	.sg-mz-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 14px; }
	.sg-mz-feature { grid-column: 3 / span 2; grid-row: 1 / span 3; }
}

/* Scrubbing: the mosaic fills one screen, pinned */
.sg-mz[data-scrub] .sg-mz-stage { display: grid; place-content: center; height: 100svh; padding: calc(var(--header-height, 64px) + 16px) var(--sg-mz-gutter) 24px; overflow: clip; }
.sg-mz[data-scrub] .sg-mz-grid {
	--tw: min(calc((100vw - 2 * var(--sg-mz-gutter) - 70px) / 6), calc((100svh - var(--header-height, 64px) - 68px) / var(--rows, 3) * .8));
	grid-template-columns: repeat(6, var(--tw));
}
`;
