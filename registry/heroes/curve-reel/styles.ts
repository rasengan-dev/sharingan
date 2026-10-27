/**
 * The curve reel's stylesheet, added once per document. The engine writes
 * each card's whole `transform` (one perspective per card, all from the
 * reel's centre, so they read as one scene), its opacity and its stacking
 * order; the size of the cards and the room under the middle ones come as
 * `--sg-cr-card` and `--sg-cr-hollow`.
 */
export const CURVE_REEL_STYLE_ID = "sg-curve-reel";

export const curveReelStyles = /* css */ `
.sg-cr {
	--sg-cr-ink: var(--foreground, #0e0e10);
	--sg-cr-muted: var(--muted-foreground, #74747a);
	--sg-cr-paper: var(--background, #fff);
	--sg-cr-accent: oklch(0.68 0.2 45);
	--sg-cr-card: clamp(96px, 11vw, 170px);
	--sg-cr-hollow: 0px;
	position: relative;
	isolation: isolate;
	/* clip, not hidden: focusing a far card must not scroll the hero sideways */
	overflow: hidden;
	overflow: clip;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 100svh;
	padding: calc(var(--header-height, 64px) + clamp(16px, 5svh, 56px)) 16px clamp(32px, 6svh, 72px);
	text-align: center;
	color: var(--sg-cr-ink);
	background: var(--sg-cr-paper);
}
.sg-cr :focus-visible { outline: 2px solid var(--sg-cr-accent); outline-offset: 3px; }

/* Copy */
.sg-cr-eyebrow { margin: 0 0 clamp(8px, 1.6svh, 16px); font-size: clamp(14px, 1.3vw, 17px); font-weight: 600; color: var(--sg-cr-accent); }
.sg-cr h1 { margin: 0; max-width: 14ch; font-family: var(--font-display, inherit); font-size: clamp(34px, min(5vw, 7.5svh), 68px); font-weight: 700; line-height: 1.04; letter-spacing: -0.035em; text-wrap: balance; }
.sg-cr-sub { margin: clamp(10px, 2svh, 18px) 0 0; max-width: 52ch; font-size: clamp(13px, 1.1vw, 15px); line-height: 1.55; color: var(--sg-cr-muted); text-wrap: pretty; }
.sg-cr-cta {
	display: inline-flex; align-items: center; gap: 14px;
	height: 44px; margin-top: clamp(14px, 2.6svh, 26px); padding: 0 5px 0 20px;
	border-radius: 999px; font-size: 14px; font-weight: 600; text-decoration: none;
	color: var(--sg-cr-ink); background: var(--sg-cr-paper);
	box-shadow: 0 0 0 1px color-mix(in oklab, var(--sg-cr-ink) 7%, transparent), 0 10px 24px -14px rgb(0 0 0 / .35);
	transition: transform .2s, box-shadow .2s;
}
.sg-cr-cta:hover { transform: translateY(-1px); box-shadow: 0 0 0 1px color-mix(in oklab, var(--sg-cr-ink) 10%, transparent), 0 14px 28px -14px rgb(0 0 0 / .4); }
.sg-cr-cta-arrow { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; color: #fff; background: var(--sg-cr-accent); transition: transform .2s; }
.sg-cr-cta:hover .sg-cr-cta-arrow { transform: translateX(2px); }
.sg-cr-cta-arrow svg { width: 15px; height: 15px; }

/* Reel: the cards share its centre; the engine places them on the arc and sets its height */
.sg-cr-reel {
	position: relative;
	width: calc(100% + 32px);
	height: calc(var(--sg-cr-card) * 1.7);
	margin: clamp(20px, 5svh, 56px) -16px 0;
	touch-action: pan-y;
	-webkit-mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent);
	mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent);
	/* The fade only runs sideways: let it cover the reflections under the reel too */
	-webkit-mask-clip: no-clip;
	mask-clip: no-clip;
}
.sg-cr-reel[data-draggable] { cursor: grab; }
.sg-cr-reel[data-dragging] { cursor: grabbing; }
.sg-cr-card {
	position: absolute; left: 50%; top: 50%;
	width: var(--sg-cr-card); aspect-ratio: 10 / 13;
	margin: calc(var(--sg-cr-card) * -0.65) 0 0 calc(var(--sg-cr-card) / -2);
	border-radius: calc(var(--sg-cr-card) * .1);
	overflow: hidden;
	color: #fff; text-decoration: none;
	background: color-mix(in oklab, var(--sg-cr-ink) 8%, var(--sg-cr-paper));
	backface-visibility: hidden;
	will-change: transform;
	user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
}
.sg-cr-card img { display: block; width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
.sg-cr-card:focus-visible { outline-offset: -3px; outline-color: #fff; }

/* The project's name, when the card is pointed at or focused */
.sg-cr-caption {
	position: absolute; left: 8%; right: 8%; bottom: 7%;
	padding: .45em .7em; border-radius: 999px;
	font-size: clamp(11px, calc(var(--sg-cr-card) / 13), 14px); font-weight: 600; line-height: 1.2;
	white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
	background: rgb(12 12 14 / .55); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
	opacity: 0; transform: translateY(6px); transition: opacity .25s, transform .25s;
}
.sg-cr-reel:not([data-dragging]) .sg-cr-card:hover .sg-cr-caption, .sg-cr-card:focus-visible .sg-cr-caption { opacity: 1; transform: none; }

/* Steps: they rise into the room under the middle cards */
.sg-cr-steps {
	position: relative; z-index: 1;
	display: flex; flex-wrap: wrap; justify-content: center; gap: 8px clamp(16px, 4vw, 56px);
	margin: calc(var(--sg-cr-hollow) * -1 + 12px) 0 0; padding: 0; list-style: none;
}
.sg-cr-step { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 9em; font-size: clamp(12px, 1vw, 14px); color: var(--sg-cr-muted); transition: color .3s; }
.sg-cr-step b { font-size: 1.05em; font-weight: 700; color: var(--sg-cr-ink); font-variant-numeric: tabular-nums; }
.sg-cr-step b span { color: var(--sg-cr-accent); }
.sg-cr-step::after {
	content: ""; width: 2.4em; height: 2px; margin-top: 4px; border-radius: 2px;
	background: linear-gradient(90deg, var(--sg-cr-accent) calc(var(--sg-cr-progress, 0) * 100%), color-mix(in oklab, var(--sg-cr-ink) 10%, transparent) 0);
	opacity: 0; transition: opacity .3s;
}
.sg-cr-step[data-active] { color: var(--sg-cr-ink); }
.sg-cr-step[data-active]::after { opacity: 1; }
.sg-cr[data-steps="off"] .sg-cr-steps, .sg-cr[data-steps="off"] [data-sg-step] { display: none; }

/* Dark: the cards stand on a floor that reflects them, the button turns to glass */
.dark .sg-cr-card, .sg-cr[data-tone="dark"] .sg-cr-card {
	-webkit-box-reflect: below 6px linear-gradient(transparent 64%, rgb(0 0 0 / .22));
}
.dark .sg-cr-cta, .sg-cr[data-tone="dark"] .sg-cr-cta {
	background: rgb(255 255 255 / .06); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
	box-shadow: inset 0 0 0 1px rgb(255 255 255 / .12), 0 12px 28px -16px rgb(0 0 0 / .8);
}

/* Entrance: stacked in the middle, then opened onto the curve */
.sg-cr[data-intro="pending"] .sg-cr-card { transition: none; }
.sg-cr[data-intro="opening"] .sg-cr-card { transition: transform 1s cubic-bezier(.2, .8, .2, 1), opacity .6s; transition-delay: var(--sg-cr-delay, 0ms); }

@media (max-width: 640px) {
	.sg-cr-steps { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 8px; }
	.sg-cr-step { min-width: 0; }
}

/* Reduced motion, ?motion=off and ?motion=final: no movement at all */
.sg-cr[data-motion]:not([data-motion="ready"]) *, .sg-cr[data-motion]:not([data-motion="ready"]) *::before, .sg-cr[data-motion]:not([data-motion="ready"]) *::after { transition: none !important; animation: none !important; }

/* Before the engine runs (or without it): the cards in a row that scrolls sideways */
.sg-cr:not([data-ready]) .sg-cr-reel {
	display: flex; gap: 12px; height: auto; padding: 0 16px; overflow-x: auto; scroll-snap-type: x mandatory;
	-webkit-mask-image: none; mask-image: none;
}
.sg-cr:not([data-ready]) .sg-cr-card { position: relative; left: auto; top: auto; flex: none; margin: 0; scroll-snap-align: center; }
.sg-cr:not([data-ready]) .sg-cr-steps { margin-top: 24px; }
/* With scripts on, the row waits out of sight for the engine; if it never comes, the row appears */
@media (scripting: enabled) {
	.sg-cr:not([data-ready]) .sg-cr-reel { opacity: 0; animation: sg-cr-reveal .4s 2.5s forwards; }
}
@keyframes sg-cr-reveal { to { opacity: 1; } }
`;
