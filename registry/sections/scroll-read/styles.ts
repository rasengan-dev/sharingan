/**
 * The scroll read's stylesheet, added once per document: a large paragraph
 * with images set inside the line. The engine only changes each word's
 * opacity and each image's scale.
 */
export const SCROLL_READ_STYLE_ID = "sg-scroll-read";

export const scrollReadStyles = /* css */ `
.sg-sr {
	--sg-sr-ink: var(--foreground, #111114);
	--sg-sr-muted: var(--muted-foreground, #66666c);
	--sg-sr-bg: var(--background, #f6f6f4);
	position: relative;
	color: var(--sg-sr-ink);
	background: var(--sg-sr-bg);
}
.sg-sr :focus-visible { outline: 2px solid var(--sg-sr-ink); outline-offset: 4px; }
.sg-sr-inner {
	display: flex; flex-direction: column; align-items: center; gap: 28px;
	max-width: 1120px; margin: 0 auto;
	padding: clamp(80px, 14vw, 180px) clamp(16px, 5vw, 80px);
	text-align: center;
}
.sg-sr-eyebrow { margin: 0; font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: var(--sg-sr-muted); }
.sg-sr-text {
	margin: 0;
	font-size: clamp(28px, 4.6vw, 64px); line-height: 1.12; font-weight: 600; letter-spacing: -0.03em;
	text-wrap: balance;
}
.sg-sr-text [data-sg-word] { display: inline-block; }
.sg-sr-text [data-sg-inline], .sg-sr-text > img {
	display: inline-block; vertical-align: -0.14em;
	width: 1.55em; height: .92em; margin: 0 .04em; overflow: hidden;
	border-radius: .28em; object-fit: cover;
	box-shadow: 0 1px 2px rgb(0 0 0 / .1), 0 8px 18px -8px rgb(0 0 0 / .35);
}
.sg-sr-text [data-sg-inline] img { display: block; width: 100%; height: 100%; object-fit: cover; }
.sg-sr-cta {
	display: inline-flex; align-items: center; height: 44px; padding: 0 20px; border-radius: 999px;
	font-size: 15px; font-weight: 500; text-decoration: none; color: var(--sg-sr-bg); background: var(--sg-sr-ink);
	transition: transform .15s;
}
.sg-sr-cta:hover { transform: translateY(-2px); }
`;
