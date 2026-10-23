/**
 * The marquee's stylesheet, added once per document. Rows only move with
 * `transform` on their track; the engine writes it every frame.
 */
export const MARQUEE_TYPE_STYLE_ID = "sg-marquee-type";

export const marqueeTypeStyles = /* css */ `
.sg-mq {
	--sg-mq-ink: var(--foreground, #111114);
	--sg-mq-muted: var(--muted-foreground, #66666c);
	--sg-mq-accent: var(--brand, oklch(0.62 0.2 262));
	--sg-mq-tilt: -3deg;
	position: relative;
	isolation: isolate;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: clamp(48px, 7vw, 88px);
	padding: clamp(96px, 12vw, 136px) 0 clamp(64px, 9vw, 112px);
	color: var(--sg-mq-ink);
	background: var(--background, #fafafa);
}
.sg-mq :focus-visible { outline: 2px solid var(--sg-mq-ink); outline-offset: 3px; }

/* Copy */
.sg-mq-copy { display: flex; flex-direction: column; align-items: center; gap: 18px; max-width: 46rem; padding: 0 24px; text-align: center; }
.sg-mq-eyebrow { margin: 0; font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 12px; letter-spacing: .16em; text-transform: uppercase; color: var(--sg-mq-muted); }
.sg-mq-copy h1 { margin: 0; font-family: var(--font-display, inherit); font-size: clamp(36px, 5.4vw, 64px); font-weight: 600; line-height: 1.02; letter-spacing: -0.04em; text-wrap: balance; }
.sg-mq-copy > p:not(.sg-mq-eyebrow) { margin: 0; max-width: 46ch; font-size: 17px; line-height: 1.55; color: var(--sg-mq-muted); text-wrap: pretty; }
.sg-mq-ctas { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 8px; }
.sg-mq-cta { display: inline-flex; align-items: center; height: 46px; padding: 0 22px; border-radius: 999px; font-weight: 600; text-decoration: none; color: var(--primary-foreground, #fff); background: var(--primary, var(--sg-mq-ink)); transition: transform .15s; }
.sg-mq-cta:hover { transform: translateY(-1px); }
.sg-mq-cta[data-variant="secondary"] { color: var(--sg-mq-ink); background: transparent; box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--sg-mq-ink) 18%, transparent); }

/* Band: wider than the hero so its tilted ends never show */
.sg-mq-band {
	width: 112%;
	display: flex;
	flex-direction: column;
	gap: 0;
	font-family: var(--font-display, inherit);
	font-size: clamp(52px, 10vw, 156px);
	font-weight: 700;
	line-height: 1;
	letter-spacing: -0.04em;
	transform: rotate(var(--sg-mq-tilt));
	-webkit-mask-image: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent);
	mask-image: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent);
}
/* Room under the baseline: a clipped row would cut descenders (g, y, p). */
.sg-mq-row { overflow: hidden; white-space: nowrap; touch-action: pan-y; padding: .02em 0 .12em; }
.sg-mq-track { display: flex; width: max-content; }
.sg-mq-track ul { display: flex; margin: 0; padding: 0; list-style: none; }
.sg-mq-track li { display: inline-flex; align-items: center; transition: color .25s, -webkit-text-stroke-color .25s; }
.sg-mq-track li::after {
	content: var(--sg-mq-sep, "✦");
	margin: 0 .38em;
	font-size: .42em;
	color: var(--sg-mq-accent);
	-webkit-text-stroke: 0;
}
.sg-mq-track li:hover { color: var(--sg-mq-accent); -webkit-text-stroke-color: var(--sg-mq-accent); }

/* Outlined rows: the stroke is painted under a fill of the page's colour, which hides
   the inner overlaps many (variable) fonts have where two strokes of a letter meet. */
.sg-mq-row[data-look="outline"] li { color: var(--background, #fafafa); -webkit-text-stroke: max(2px, .024em) var(--sg-mq-ink); paint-order: stroke fill; }
.sg-mq-row[data-look="outline"] li:hover { color: var(--sg-mq-accent); }
`;
