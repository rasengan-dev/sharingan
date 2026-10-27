/**
 * The gallery fan's stylesheet, added once per document. The engine writes
 * each card's pose as custom properties (`--x`, `--y`, `--z`, `--ry`, `--rz`, `--s`)
 * and its stacking order; the cards only move with `transform`, under one
 * perspective on the fan.
 */
export const GALLERY_FAN_STYLE_ID = "sg-gallery-fan";

/** Fine paper grain over the hero, so its flat background feels printed. */
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
	"<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 .6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>",
).replace(/%2523/g, "%23")}")`;

export const galleryFanStyles = /* css */ `
.sg-gf {
	--sg-gf-ink: var(--foreground, #111114);
	--sg-gf-muted: var(--muted-foreground, #66666c);
	--card-w: clamp(112px, min(16.5vw, 30svh), 260px);
	position: relative;
	isolation: isolate;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: clamp(8px, 2.5svh, 28px);
	min-height: 100svh;
	padding: calc(var(--header-height, 64px) + clamp(16px, 4svh, 48px)) 16px clamp(32px, 6svh, 64px);
	text-align: center;
	color: var(--sg-gf-ink);
	background: var(--background, #f4f4f2);
}
.sg-gf::before {
	content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none;
	background-image: ${GRAIN}; opacity: .09; mix-blend-mode: multiply;
}
.dark .sg-gf::before, .sg-gf[data-tone="dark"]::before { opacity: .05; mix-blend-mode: screen; }
.sg-gf :focus-visible { outline: 2px solid var(--sg-gf-ink); outline-offset: 4px; }

/* Copy */
.sg-gf-eyebrow { margin: 0; font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: var(--sg-gf-muted); }
.sg-gf h1 { margin: 0; max-width: 13ch; font-family: var(--font-display, inherit); font-size: clamp(38px, min(6.2vw, 9svh), 84px); font-weight: 600; line-height: .98; letter-spacing: -0.045em; text-wrap: balance; }
.sg-gf-sub { margin: 0; max-width: 42ch; font-size: clamp(14px, 1.2vw, 16px); line-height: 1.55; color: var(--sg-gf-muted); text-wrap: pretty; }
.sg-gf-ctas { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.sg-gf-cta { display: inline-flex; align-items: center; height: 42px; padding: 0 20px; border-radius: 999px; font-size: 14px; font-weight: 500; text-decoration: none; color: var(--background, #fff); background: var(--sg-gf-ink); transition: transform .15s; }
.sg-gf-cta:hover { transform: translateY(-1px); }
.sg-gf-cta[data-variant="secondary"] { color: var(--sg-gf-ink); background: color-mix(in oklab, var(--sg-gf-ink) 6%, transparent); }

/* Fan: one perspective; cards stacked by the engine (z-index), not by depth, so the order is always readable */
.sg-gf-fan {
	position: relative;
	width: 100%;
	height: calc(var(--card-w) * 1.25 + clamp(48px, 9svh, 96px));
	margin: clamp(4px, 2svh, 24px) 0;
	perspective: 1400px;
	touch-action: pan-y;
}
.sg-gf-card {
	--x: 0px; --y: 0px; --z: 0px; --ry: 0deg; --rz: 0deg; --s: 1;
	position: absolute; left: 50%; top: 50%;
	width: var(--card-w); aspect-ratio: 4 / 5;
	margin: calc(var(--card-w) * -0.625) 0 0 calc(var(--card-w) / -2);
	border-radius: calc(var(--card-w) * .07);
	text-decoration: none; color: #fff;
	transform: translate3d(var(--x), var(--y), var(--z)) rotateY(var(--ry)) rotateZ(var(--rz)) scale(var(--s));
	transition: transform .7s cubic-bezier(.2, .8, .2, 1), box-shadow .4s, opacity .5s;
	transition-delay: var(--delay, 0ms);
	box-shadow: 0 1.2em 2.4em -1.2em rgb(0 0 0 / .45), 0 .3em .6em -.3em rgb(0 0 0 / .25);
	font-size: calc(var(--card-w) / 15);
	will-change: transform;
}
.sg-gf-card img { display: block; width: 100%; height: 100%; object-fit: cover; border-radius: inherit; pointer-events: none; user-select: none; }
.sg-gf-card::after { content: ""; position: absolute; inset: 0; border-radius: inherit; box-shadow: inset 0 0 0 1px rgb(255 255 255 / .18); pointer-events: none; }
.sg-gf-card[data-active] { box-shadow: 0 2em 3.4em -1.2em rgb(0 0 0 / .55), 0 .4em .8em -.3em rgb(0 0 0 / .3); }
.dark .sg-gf-card { box-shadow: 0 1.2em 2.4em -1em rgb(0 0 0 / .8); }

/* The raised card names its work and its author */
.sg-gf-caption {
	position: absolute; left: .8em; right: .8em; bottom: .8em;
	display: flex; flex-direction: column; align-items: flex-start; gap: .15em;
	padding: .55em .8em; border-radius: .7em; text-align: left;
	background: rgb(10 10 12 / .62); backdrop-filter: blur(8px);
	opacity: 0; transform: translateY(.5em); transition: opacity .3s, transform .3s;
}
.sg-gf-caption b { font-size: 1.05em; font-weight: 600; line-height: 1.2; }
.sg-gf-caption span { font-size: .85em; opacity: .75; }
.sg-gf-card[data-active] .sg-gf-caption { opacity: 1; transform: none; }

/* Entrance: stacked in the middle, then opened card after card */
.sg-gf[data-intro="pending"] .sg-gf-card { opacity: 0; }

/* Collaborator cursors */
.sg-gf-cursor {
	--cx: 0px; --cy: 0px;
	position: absolute; left: 50%; top: 50%; z-index: 40; pointer-events: none;
	transform: translate(var(--cx), var(--cy));
	transition: transform 1.3s cubic-bezier(.3, .7, .2, 1), opacity .4s;
}
.sg-gf-bob { display: flex; flex-direction: column; align-items: flex-start; animation: sg-gf-bob 3.8s ease-in-out infinite; }
.sg-gf-cursor:nth-of-type(2n) .sg-gf-bob { animation-duration: 4.6s; animation-delay: -1.4s; }
.sg-gf-bubble {
	padding: 5px 10px; border-radius: 999px 999px 999px 4px;
	font-size: 13px; font-weight: 500; color: #fff; white-space: nowrap;
	background: var(--c); box-shadow: 0 8px 16px -8px var(--c);
}
.sg-gf-cursor svg { width: 18px; height: 18px; margin: 2px 0 0 -6px; filter: drop-shadow(0 2px 2px rgb(0 0 0 / .2)); }
@keyframes sg-gf-bob { 50% { transform: translate(5px, -7px); } }
.sg-gf[data-intro="pending"] .sg-gf-cursor { opacity: 0; }

@media (max-width: 640px) {
	.sg-gf { --card-w: clamp(92px, 30vw, 150px); }
	.sg-gf-bubble { font-size: 11px; padding: 4px 8px; }
}

/* Reduced motion, ?motion=off and ?motion=final: no movement at all. Before the engine has set a mode only transitions are off, so the reveal fallback can run */
.sg-gf:not([data-motion="ready"]) *, .sg-gf:not([data-motion="ready"]) *::before, .sg-gf:not([data-motion="ready"]) *::after { transition: none !important; }
.sg-gf[data-motion]:not([data-motion="ready"]) *, .sg-gf[data-motion]:not([data-motion="ready"]) *::before, .sg-gf[data-motion]:not([data-motion="ready"]) *::after { animation: none !important; }
@media (prefers-reduced-motion: reduce) {
	.sg-gf:not([data-motion="ready"]) *, .sg-gf:not([data-motion="ready"]) *::before, .sg-gf:not([data-motion="ready"]) *::after { animation: none !important; }
}

/* Before the engine places the cards, keep them out of sight; without it, they appear after a moment */
@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
	.sg-gf:not([data-ready]) .sg-gf-card, .sg-gf:not([data-ready]) .sg-gf-cursor { opacity: 0; animation: sg-gf-reveal .4s 2.5s forwards; }
}
@keyframes sg-gf-reveal { to { opacity: 1; } }
`;
