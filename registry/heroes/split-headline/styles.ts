/**
 * The split headline's stylesheet, added once per document. Letters only
 * move with `transform` and change paint (`-webkit-text-stroke`, colour):
 * thickening a letter with a stroke instead of a font weight keeps every
 * other letter in place, with any font, variable or not. The engine writes
 * `--p` (0 to 1, how close the pointer is) on each letter.
 */
export const SPLIT_HEADLINE_STYLE_ID = "sg-split-headline";

export const splitHeadlineStyles = /* css */ `
.sg-sh {
	--sg-sh-ink: var(--foreground, #111114);
	--sg-sh-muted: var(--muted-foreground, #66666c);
	--sg-sh-accent: var(--brand, oklch(0.62 0.2 262));
	position: relative;
	isolation: isolate;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 640px;
	padding: clamp(96px, 12vw, 140px) 24px clamp(64px, 8vw, 104px);
	text-align: center;
	color: var(--sg-sh-ink);
	background:
		radial-gradient(60% 50% at 50% 42%, color-mix(in oklab, var(--sg-sh-accent) 10%, transparent), transparent 70%),
		var(--background, #fafafa);
}
.sg-sh :focus-visible { outline: 2px solid var(--sg-sh-ink); outline-offset: 3px; }
.sg-sh-eyebrow { margin: 0; font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 12px; letter-spacing: .16em; text-transform: uppercase; color: var(--sg-sh-muted); }
.sg-sh [data-sg-split] {
	position: relative;
	margin: 22px 0 0;
	max-width: 14ch;
	font-family: var(--font-display, inherit);
	font-size: clamp(48px, 9.5vw, 128px);
	font-weight: 600;
	line-height: .95;
	letter-spacing: -0.045em;
	text-wrap: balance;
}
.sg-sh-sub { margin: 28px 0 0; max-width: 46ch; font-size: 18px; line-height: 1.55; color: var(--sg-sh-muted); text-wrap: pretty; }
.sg-sh-ctas { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 36px; }
.sg-sh-cta { display: inline-flex; align-items: center; height: 48px; padding: 0 24px; border-radius: 999px; font-weight: 600; text-decoration: none; color: var(--primary-foreground, #fff); background: var(--primary, var(--sg-sh-ink)); transition: transform .15s; }
.sg-sh-cta:hover { transform: translateY(-1px); }
.sg-sh-cta[data-variant="secondary"] { color: var(--sg-sh-ink); background: transparent; box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--sg-sh-ink) 18%, transparent); }

/* The heading's text for assistive technology, while the letters are shown */
.sg-sh-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

/* Letters */
.sg-sh-word { display: inline-block; white-space: nowrap; }
.sg-sh-char {
	--p: 0; --ix: 0; --iy: 0; --ir: 0;
	display: inline-block;
	transform: translate3d(calc(var(--ix) * 1em), calc(var(--iy) * 1em - var(--p) * .09em), 0) rotate(calc(var(--ir) * 1deg)) scale(calc(1 + var(--p) * .07));
	color: color-mix(in oklab, var(--sg-sh-accent) calc(var(--p) * 100%), var(--sg-sh-ink));
	-webkit-text-stroke: calc(var(--p) * .022em) currentColor;
	transition: transform .14s ease-out;
}

/* Entrance: letters wait away from home, then come back one after another */
.sg-sh[data-intro="pending"] .sg-sh-char { --ix: var(--sx); --iy: var(--sy); --ir: var(--sr); opacity: 0; filter: blur(.06em); }
.sg-sh[data-intro="play"] .sg-sh-char {
	transition:
		transform .9s cubic-bezier(.2, .9, .25, 1.05) calc(var(--i) * var(--sg-sh-stagger)),
		opacity .5s ease-out calc(var(--i) * var(--sg-sh-stagger)),
		filter .6s ease-out calc(var(--i) * var(--sg-sh-stagger));
}
.sg-sh[data-intro-style="type"][data-intro="play"] .sg-sh-char { transition: opacity .01s linear calc(var(--i) * var(--sg-sh-stagger) * 2.2); }

/* The rest of the hero follows the headline in */
.sg-sh[data-intro="pending"] .sg-sh-after { opacity: 0; transform: translateY(12px); }
.sg-sh[data-intro="play"] .sg-sh-after { transition: opacity .7s ease-out var(--sg-sh-after-delay), transform .7s cubic-bezier(.2, .8, .2, 1) var(--sg-sh-after-delay); }

/* Until the engine has split the headline, keep it hidden so it does not show twice;
   if the engine never runs, it fades in on its own after a moment. */
@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
	.sg-sh:not([data-ready]) [data-sg-split], .sg-sh:not([data-ready]) [data-sg-after] { opacity: 0; animation: sg-sh-reveal .4s 2.5s forwards; }
}
@keyframes sg-sh-reveal { to { opacity: 1; } }
`;
