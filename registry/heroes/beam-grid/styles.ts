/**
 * The beam grid's stylesheet, added once per document. The grid is two
 * CSS gradients tiled from the centre; beams are short gradient bars moved
 * with `transform` by the Web Animations API, aligned by the engine on the
 * same lines. The brighter grid around the pointer is the same grid,
 * masked by a circle at `--mx` / `--my`.
 */
export const BEAM_GRID_STYLE_ID = "sg-beam-grid";

export const beamGridStyles = /* css */ `
.sg-bm {
	--sg-bm-ink: var(--foreground, #111114);
	--sg-bm-muted: var(--muted-foreground, #66666c);
	--sg-bm-line: color-mix(in oklab, var(--sg-bm-ink) 12%, transparent);
	--sg-bm-c0: var(--brand, oklch(0.62 0.2 262));
	--cell: 64px;
	--calm: .6;
	position: relative;
	isolation: isolate;
	overflow: hidden;
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 680px;
	padding: clamp(96px, 12vw, 136px) 24px clamp(72px, 9vw, 112px);
	color: var(--sg-bm-ink);
	background: var(--background, #fafafa);
}
.sg-bm :focus-visible { outline: 2px solid var(--sg-bm-c0); outline-offset: 3px; }

/* Copy */
.sg-bm-copy { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 18px; max-width: 46rem; text-align: center; }
.sg-bm-eyebrow {
	margin: 0; padding: 6px 12px; border-radius: 999px;
	font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--sg-bm-muted);
	background: var(--background, #fafafa); box-shadow: inset 0 0 0 1px var(--sg-bm-line);
}
.sg-bm-copy h1 { margin: 0; font-family: var(--font-display, inherit); font-size: clamp(40px, 6.4vw, 80px); font-weight: 600; line-height: 1; letter-spacing: -0.045em; text-wrap: balance; }
.sg-bm-copy > p:not(.sg-bm-eyebrow) { margin: 0; max-width: 46ch; font-size: 18px; line-height: 1.55; color: var(--sg-bm-muted); text-wrap: pretty; }
.sg-bm-ctas { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 10px; }
.sg-bm-cta { display: inline-flex; align-items: center; height: 46px; padding: 0 22px; border-radius: 999px; font-weight: 600; text-decoration: none; color: var(--primary-foreground, #fff); background: var(--primary, var(--sg-bm-ink)); }
.sg-bm-cta[data-variant="secondary"] { color: var(--sg-bm-ink); background: var(--background, #fafafa); box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--sg-bm-ink) 18%, transparent); }

/* Layer: grid, brighter grid under the pointer, beams; faded at the edges and behind the copy */
.sg-bm-layer {
	position: absolute; inset: 0; z-index: 0; overflow: hidden;
	-webkit-mask-image: radial-gradient(ellipse 34% 30% at 50% 48%, rgb(0 0 0 / calc(1 - var(--calm))), #000 100%), radial-gradient(ellipse 75% 70% at 50% 50%, #000 40%, transparent 100%);
	-webkit-mask-composite: source-in;
	mask-image: radial-gradient(ellipse 34% 30% at 50% 48%, rgb(0 0 0 / calc(1 - var(--calm))), #000 100%), radial-gradient(ellipse 75% 70% at 50% 50%, #000 40%, transparent 100%);
	mask-composite: intersect;
}
.sg-bm-grid, .sg-bm-spot {
	position: absolute; inset: 0;
	background-image: linear-gradient(to right, var(--sg-bm-line) 1px, transparent 1px), linear-gradient(to bottom, var(--sg-bm-line) 1px, transparent 1px);
	background-size: var(--cell) var(--cell);
	background-position: center;
}
.sg-bm-spot {
	--sg-bm-line: color-mix(in oklab, var(--sg-bm-c0) 55%, transparent);
	opacity: 0; transition: opacity .35s;
	-webkit-mask-image: radial-gradient(circle 190px at var(--mx, 50%) var(--my, 50%), #000, transparent);
	mask-image: radial-gradient(circle 190px at var(--mx, 50%) var(--my, 50%), #000, transparent);
}
.sg-bm[data-pointer-in] .sg-bm-spot { opacity: 1; }

/* Beams: a bright head, a fading tail, a soft halo */
.sg-bm-beam { position: absolute; left: 0; top: 0; pointer-events: none; will-change: transform; }
.sg-bm-beam[data-axis="x"] { height: 1px; background: linear-gradient(90deg, transparent, var(--c)); }
.sg-bm-beam[data-axis="y"] { width: 1px; background: linear-gradient(180deg, transparent, var(--c)); }
.sg-bm-beam[data-axis="x"][data-back] { background: linear-gradient(270deg, transparent, var(--c)); }
.sg-bm-beam[data-axis="y"][data-back] { background: linear-gradient(0deg, transparent, var(--c)); }
.sg-bm-beam::before { content: ""; position: absolute; inset: -3px; background: inherit; opacity: .35; filter: blur(3px); }
.sg-bm-beam::after { content: ""; position: absolute; width: 5px; height: 5px; border-radius: 50%; background: var(--c); box-shadow: 0 0 10px 2px var(--c); }
.sg-bm-beam[data-axis="x"]::after { right: -2px; top: -2px; }
.sg-bm-beam[data-axis="x"][data-back]::after { left: -2px; right: auto; }
.sg-bm-beam[data-axis="y"]::after { bottom: -2px; left: -2px; }
.sg-bm-beam[data-axis="y"][data-back]::after { top: -2px; bottom: auto; }
`;
