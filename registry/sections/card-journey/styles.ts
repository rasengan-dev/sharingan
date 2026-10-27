/**
 * The card journey's stylesheet, added once per document. Without
 * JavaScript, and under reduced motion, it is the section's final layout: the
 * paragraph, the note, then the grid. While the section scrubs (`data-scrub`
 * on the root), the stage is one screen tall and the paragraph and the note
 * sit over the grid, which the cards leave and reach with `transform` only.
 * The engine puts the deck beside the paragraph or under it (`data-layout`),
 * never over it.
 */
export const CARD_JOURNEY_STYLE_ID = "sg-card-journey";

export const cardJourneyStyles = /* css */ `
.sg-cj {
	--sg-cj-ink: var(--foreground, #111114);
	--sg-cj-muted: var(--muted-foreground, #66666c);
	--sg-cj-bg: var(--background, #f6f6f4);
	--sg-cj-surface: color-mix(in oklab, var(--sg-cj-ink) 5%, var(--sg-cj-bg));
	--sg-cj-accent: var(--foreground, #111114);
	--sg-cj-gutter: clamp(16px, 5vw, 80px);
	position: relative;
	color: var(--sg-cj-ink);
	background: var(--sg-cj-bg);
}
.sg-cj :focus-visible { outline: 2px solid var(--sg-cj-ink); outline-offset: 4px; }
.sg-cj-stage {
	position: relative;
	display: flex; flex-direction: column; gap: clamp(40px, 7vw, 88px);
	max-width: 1280px; margin: 0 auto;
	padding: clamp(64px, 10vw, 128px) var(--sg-cj-gutter);
}

/* The paragraph read on scroll */
.sg-cj-statement {
	margin: 0 auto; max-width: 980px;
	font-size: clamp(26px, 4vw, 54px); line-height: 1.14; font-weight: 600; letter-spacing: -0.025em;
	text-align: center; text-wrap: balance;
}
.sg-cj-statement [data-sg-word] { display: inline-block; }

/* The note beside the staircase */
.sg-cj-aside { max-width: 300px; padding: 20px 22px; border-radius: 20px; background: var(--sg-cj-surface); }
.sg-cj-aside h3 { margin: 0; font-size: 17px; line-height: 1.25; font-weight: 600; letter-spacing: -0.01em; }
.sg-cj-aside p { margin: 8px 0 0; font-size: 14px; line-height: 1.45; color: var(--sg-cj-muted); }

/* The grid: copy, then the panel of cards */
.sg-cj-grid { display: grid; gap: 40px; align-items: center; }
.sg-cj-eyebrow { margin: 0; font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: var(--sg-cj-muted); }
.sg-cj-copy h2 { margin: 12px 0 0; font-size: clamp(32px, 4vw, 52px); line-height: 1.04; font-weight: 600; letter-spacing: -0.03em; text-wrap: balance; }
.sg-cj-copy p:not(.sg-cj-eyebrow) { margin: 16px 0 0; max-width: 34rem; font-size: 16px; line-height: 1.55; color: var(--sg-cj-muted); text-wrap: pretty; }
.sg-cj-cta {
	display: inline-flex; align-items: center; height: 44px; margin-top: 24px; padding: 0 20px; border-radius: 999px;
	font-size: 15px; font-weight: 500; text-decoration: none; color: var(--sg-cj-bg); background: var(--sg-cj-ink);
	transition: transform .15s;
}
.sg-cj-cta:hover { transform: translateY(-2px); }

.sg-cj-panel { position: relative; padding: 14px; border-radius: 28px; }
.sg-cj-panel-bg { position: absolute; inset: 0; border-radius: inherit; background: var(--sg-cj-surface); pointer-events: none; }
.sg-cj-tabs { position: relative; display: flex; flex-wrap: wrap; gap: 4px; margin: 0 0 14px; }
.sg-cj-tab {
	border: 0; height: 34px; padding: 0 14px; border-radius: 999px; cursor: pointer;
	font: inherit; font-size: 14px; color: var(--sg-cj-muted); background: transparent;
	transition: color .15s, background-color .15s;
}
.sg-cj-tab:hover { color: var(--sg-cj-ink); }
.sg-cj-tab[aria-selected="true"] { color: var(--sg-cj-bg); background: var(--sg-cj-accent); }

.sg-cj-cards { position: relative; margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.sg-cj-card { position: relative; border-radius: 16px; }
.sg-cj-card[hidden] { display: none; }
.sg-cj-card > a, .sg-cj-card > div { display: block; border-radius: inherit; color: inherit; text-decoration: none; }
.sg-cj-card img {
	display: block; width: 100%; aspect-ratio: 4 / 5; object-fit: cover; border-radius: inherit;
	background: var(--sg-cj-surface);
	box-shadow: 0 1px 2px rgb(0 0 0 / .08), 0 14px 32px -14px rgb(0 0 0 / .4);
}
.sg-cj-caption { display: flex; flex-direction: column; gap: 1px; padding: 8px 4px 0; font-size: 13px; line-height: 1.3; }
.sg-cj-caption b { font-weight: 600; }
.sg-cj-caption span { color: var(--sg-cj-muted); }

@media (min-width: 768px) {
	.sg-cj-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr); }
	.sg-cj-cards { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

/* Scrubbing: one screen, pinned */
.sg-cj[data-scrub] .sg-cj-stage {
	display: grid; align-content: center; justify-content: stretch;
	height: 100svh; max-width: none; overflow: clip;
	padding: calc(var(--header-height, 64px) + 16px) var(--sg-cj-gutter) 32px;
}
.sg-cj[data-scrub] .sg-cj-statement { position: absolute; inset: 0; z-index: 0; height: fit-content; margin: auto; padding: 0 var(--sg-cj-gutter); }
/* Wide screens: the paragraph on the left, the deck on the right */
.sg-cj[data-layout="beside"] .sg-cj-statement {
	right: auto; left: var(--sg-cj-gutter); width: var(--sg-cj-text-width, 50%); max-width: none; margin: auto 0; padding: 0;
	font-size: clamp(24px, 3.3vw, 48px); text-align: left;
}
/* Tall screens: the paragraph on top, the deck under it */
.sg-cj[data-layout="below"] .sg-cj-statement {
	top: calc(var(--header-height, 64px) + 5svh); bottom: auto; margin: 0 auto;
	font-size: clamp(24px, 3.8vw, 44px);
}
.sg-cj[data-scrub] .sg-cj-aside { position: absolute; z-index: 1; top: calc(var(--header-height, 64px) + 8svh); left: var(--sg-cj-gutter); width: min(300px, 21vw); }
.sg-cj[data-scrub] .sg-cj-grid { position: relative; z-index: 2; grid-template-columns: minmax(0, 1fr) auto; max-width: 1280px; width: 100%; margin: 0 auto; }
.sg-cj[data-scrub] .sg-cj-cards {
	--cw: min(15vw, calc((100svh - var(--header-height, 64px) - 170px) / var(--rows, 2) * .7));
	grid-template-columns: repeat(3, var(--cw));
}
`;
