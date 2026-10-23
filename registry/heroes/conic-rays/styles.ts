/**
 * The conic rays' stylesheet, added once per document. Each layer is a
 * `repeating-conic-gradient` blurred once and turned by a CSS animation,
 * so the browser only composites a rotation each frame. The engine sets
 * the variables (palette, ray period, lean toward the pointer) and pauses
 * the animations when the hero is off screen or motion is reduced.
 */
export const CONIC_RAYS_STYLE_ID = "sg-conic-rays";

/** Fine grain on top of the light, so its gradients never band. */
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
	"<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>",
).replace(/%2523/g, "%23")}")`;

export const conicRaysStyles = /* css */ `
.sg-cr {
	--sg-cr-ink: var(--foreground, #111114);
	--sg-cr-muted: var(--muted-foreground, #66666c);
	--sg-cr-c0: var(--brand, oklch(0.66 0.2 262));
	--sg-cr-c1: oklch(0.78 0.14 175);
	--sg-cr-c2: oklch(0.7 0.18 305);
	--p: 36deg;
	--w: .42;
	--oy: -12%;
	--lean: 0;
	--strength: .8;
	--calm: .45;
	--spin: 90s;
	position: relative;
	isolation: isolate;
	overflow: hidden;
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 680px;
	padding: clamp(96px, 12vw, 136px) 24px clamp(72px, 9vw, 112px);
	color: var(--sg-cr-ink);
	background: var(--background, #fafafa);
}
.sg-cr :focus-visible { outline: 2px solid var(--sg-cr-c0); outline-offset: 3px; }

/* Copy */
.sg-cr-copy { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 18px; max-width: 46rem; text-align: center; }
.sg-cr-eyebrow { margin: 0; font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 12px; letter-spacing: .16em; text-transform: uppercase; color: var(--sg-cr-muted); }
.sg-cr-copy h1 { margin: 0; font-family: var(--font-display, inherit); font-size: clamp(40px, 6.4vw, 80px); font-weight: 600; line-height: 1; letter-spacing: -0.045em; text-wrap: balance; }
.sg-cr-copy > p:not(.sg-cr-eyebrow) { margin: 0; max-width: 46ch; font-size: 18px; line-height: 1.55; color: var(--sg-cr-muted); text-wrap: pretty; }
.sg-cr-ctas { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 10px; }
.sg-cr-cta { display: inline-flex; align-items: center; height: 46px; padding: 0 22px; border-radius: 999px; font-weight: 600; text-decoration: none; color: var(--primary-foreground, #fff); background: var(--primary, var(--sg-cr-ink)); }
.sg-cr-cta[data-variant="secondary"] { color: var(--sg-cr-ink); background: color-mix(in oklab, var(--background, #fafafa) 60%, transparent); box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--sg-cr-ink) 18%, transparent); backdrop-filter: blur(8px); }

/* Light */
.sg-cr-layer {
	position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none;
	-webkit-mask-image: radial-gradient(ellipse 36% 26% at 50% 50%, rgb(0 0 0 / calc(1 - var(--calm))), #000 100%);
	mask-image: radial-gradient(ellipse 36% 26% at 50% 50%, rgb(0 0 0 / calc(1 - var(--calm))), #000 100%);
}
.sg-cr-source {
	position: absolute; left: 50%; top: var(--oy); width: 240vmax; height: 240vmax; margin: -120vmax 0 0 -120vmax;
	transform: rotate(calc(var(--lean) * 1deg));
	opacity: var(--strength);
}
.sg-cr-rays {
	position: absolute; inset: 0; border-radius: 50%;
	background: repeating-conic-gradient(from var(--from, 0deg), transparent 0deg, var(--c) calc(var(--p) * var(--w) / 2), transparent calc(var(--p) * var(--w)), transparent var(--p));
	-webkit-mask-image: radial-gradient(circle, #000 0, rgb(0 0 0 / .6) 14%, transparent 42%);
	mask-image: radial-gradient(circle, #000 0, rgb(0 0 0 / .6) 14%, transparent 42%);
	filter: blur(18px);
	animation: sg-cr-spin var(--spin) linear infinite, sg-cr-breathe calc(var(--spin) / 6) ease-in-out infinite alternate;
	animation-delay: var(--delay, 0s), var(--delay, 0s);
}
.sg-cr-rays:nth-child(1) { --c: var(--sg-cr-c0); --from: 0deg; }
.sg-cr-rays:nth-child(2) { --c: var(--sg-cr-c1); --from: 11deg; --delay: -37s; animation-direction: reverse, alternate; animation-duration: calc(var(--spin) * 1.35), calc(var(--spin) / 5); opacity: .8; }
.sg-cr-rays:nth-child(3) { --c: var(--sg-cr-c2); --from: 23deg; --delay: -71s; animation-duration: calc(var(--spin) * .8), calc(var(--spin) / 7); opacity: .7; }
@keyframes sg-cr-spin { to { transform: rotate(1turn); } }
@keyframes sg-cr-breathe { from { opacity: .55; } to { opacity: 1; } }
.sg-cr[data-tone="dark"] .sg-cr-rays { mix-blend-mode: screen; }
.sg-cr-grain { position: absolute; inset: 0; background-image: ${GRAIN}; opacity: .07; mix-blend-mode: overlay; }

/* Off screen, reduced motion and still modes: the light stops where its delays put it */
/* Until the engine has read the motion mode, so ?motion=final always shows the same frame */
.sg-cr[data-paused] .sg-cr-rays, .sg-cr:not([data-ready]) .sg-cr-rays { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .sg-cr-rays { animation-play-state: paused; } }
`;
