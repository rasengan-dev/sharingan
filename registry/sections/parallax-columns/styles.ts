/**
 * The parallax columns' stylesheet, added once per document: a headline,
 * then two columns of cards, the right one set lower. The engine moves each
 * column, and each photo inside its card, with `transform` only.
 */
export const PARALLAX_COLUMNS_STYLE_ID = "sg-parallax-columns";

export const parallaxColumnsStyles = /* css */ `
.sg-pc {
	--sg-pc-ink: var(--foreground, #111114);
	--sg-pc-muted: var(--muted-foreground, #66666c);
	--sg-pc-bg: var(--background, #f6f6f4);
	position: relative;
	overflow: clip;
	color: var(--sg-pc-ink);
	background: var(--sg-pc-bg);
}
.sg-pc :focus-visible { outline: 2px solid var(--sg-pc-ink); outline-offset: 4px; }
.sg-pc-inner { max-width: 1200px; margin: 0 auto; padding: clamp(64px, 10vw, 140px) clamp(16px, 5vw, 80px); }
.sg-pc-head { display: grid; gap: 16px 48px; align-items: end; margin-bottom: clamp(40px, 7vw, 96px); }
.sg-pc-eyebrow { margin: 0 0 12px; font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: var(--sg-pc-muted); }
.sg-pc-head h2 { margin: 0; font-size: clamp(36px, 5.6vw, 80px); line-height: 1; font-weight: 600; letter-spacing: -0.035em; text-wrap: balance; }
.sg-pc-head > p { margin: 0; max-width: 30rem; font-size: 17px; line-height: 1.55; color: var(--sg-pc-muted); text-wrap: pretty; }

.sg-pc-grid { display: grid; gap: 40px; }
.sg-pc-column { display: flex; flex-direction: column; gap: 40px; }
.sg-pc-card > a, .sg-pc-card > div { display: block; color: inherit; text-decoration: none; }
.sg-pc-media { position: relative; overflow: hidden; aspect-ratio: 4 / 3; border-radius: 24px; background: color-mix(in oklab, var(--sg-pc-ink) 8%, var(--sg-pc-bg)); }
.sg-pc-media img { position: absolute; left: 0; top: -6%; width: 100%; height: 112%; object-fit: cover; display: block; }
.sg-pc-card h3 { margin: 18px 0 0; font-size: 22px; line-height: 1.2; font-weight: 600; letter-spacing: -0.015em; }
.sg-pc-card p { margin: 8px 0 0; max-width: 30rem; font-size: 15px; line-height: 1.5; color: var(--sg-pc-muted); }
.sg-pc-card a:hover h3 { text-decoration: underline; text-underline-offset: 4px; }

@media (min-width: 768px) {
	.sg-pc-head { grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); }
	.sg-pc-grid { grid-template-columns: 1fr 1fr; gap: clamp(24px, 5vw, 80px); align-items: start; }
	.sg-pc-column { gap: clamp(48px, 7vw, 112px); }
	.sg-pc-column + .sg-pc-column { margin-top: clamp(40px, 6vw, 96px); }
}
`;
