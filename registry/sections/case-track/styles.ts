/**
 * The case track's stylesheet, added once per document. Without motion the
 * row is a native horizontal scroller with snap points. While it scrubs
 * (`data-scrub`), the stage is one screen tall, the row stops scrolling on
 * its own and the engine moves it with `transform`.
 */
export const CASE_TRACK_STYLE_ID = "sg-case-track";

export const caseTrackStyles = /* css */ `
.sg-ct {
	--sg-ct-ink: var(--foreground, #111114);
	--sg-ct-muted: var(--muted-foreground, #66666c);
	--sg-ct-bg: var(--background, #f6f6f4);
	--sg-ct-accent: #ee8a7b;
	--sg-ct-accent-2: #b9ccb1;
	--sg-ct-paper: color-mix(in oklab, var(--sg-ct-ink) 4%, var(--sg-ct-bg));
	--sg-ct-tint: color-mix(in oklab, var(--sg-ct-accent) 30%, var(--sg-ct-bg));
	--sg-ct-tint-2: color-mix(in oklab, var(--sg-ct-accent-2) 42%, var(--sg-ct-bg));
	--sg-ct-gutter: clamp(16px, 5vw, 80px);
	--sg-ct-card: clamp(240px, 22vw, 300px);
	--sg-ct-height: clamp(360px, 52svh, 480px);
	position: relative;
	color: var(--sg-ct-ink);
	background: var(--sg-ct-bg);
}
.dark .sg-ct, .sg-ct[data-tone="dark"] {
	--sg-ct-tint: color-mix(in oklab, var(--sg-ct-accent) 24%, var(--sg-ct-bg));
	--sg-ct-tint-2: color-mix(in oklab, var(--sg-ct-accent-2) 22%, var(--sg-ct-bg));
}
.sg-ct :focus-visible { outline: 2px solid var(--sg-ct-ink); outline-offset: 4px; }
.sg-ct-stage {
	display: flex; flex-direction: column; justify-content: center; gap: clamp(24px, 3.5vw, 40px);
	overflow-x: clip;
	padding: clamp(64px, 10vw, 128px) 0;
}
.sg-ct-head, .sg-ct-foot { width: 100%; max-width: 1440px; margin: 0 auto; padding: 0 var(--sg-ct-gutter); box-sizing: border-box; }

/* Headline, text and link */
.sg-ct-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px 40px; }
.sg-ct-eyebrow { margin: 0 0 12px; font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: var(--sg-ct-muted); }
.sg-ct-head h2 { margin: 0; max-width: 16ch; font-size: clamp(34px, 5vw, 68px); line-height: 1; font-weight: 500; letter-spacing: -0.04em; text-wrap: balance; }
.sg-ct-aside { display: flex; flex-direction: column; align-items: flex-start; gap: 14px; max-width: 38ch; }
.sg-ct-aside p { margin: 0; font-size: 15px; line-height: 1.5; color: var(--sg-ct-muted); }
.sg-ct-link { font-size: 14px; font-weight: 500; color: var(--sg-ct-ink); text-underline-offset: 4px; }

/* The row */
.sg-ct-track {
	display: flex; gap: 14px; margin: 0; list-style: none;
	padding: 4px max(var(--sg-ct-gutter), calc((100% - 1440px) / 2 + var(--sg-ct-gutter)));
	overflow-x: auto; scroll-snap-type: x mandatory; scroll-padding-inline: var(--sg-ct-gutter);
	scrollbar-width: none; overscroll-behavior-x: contain;
}
.sg-ct-track::-webkit-scrollbar { display: none; }
.sg-ct-card {
	position: relative; flex: none; display: flex; flex-direction: column; gap: 12px;
	width: var(--sg-ct-card); height: var(--sg-ct-height); padding: 14px; box-sizing: border-box;
	border-radius: 24px; background: var(--sg-ct-paper);
	scroll-snap-align: start;
}
.sg-ct-card:nth-child(3n + 2) { background: var(--sg-ct-tint); }
.sg-ct-card:nth-child(3n + 1) { background: var(--sg-ct-tint-2); }
.sg-ct-card h3 { margin: 0; padding: 4px 4px 0; font-size: 17px; line-height: 1.2; font-weight: 600; letter-spacing: -0.01em; }
.sg-ct-card h3 a { color: inherit; text-decoration: none; }
/* The whole card is the link's target */
.sg-ct-card h3 a::after { content: ""; position: absolute; inset: 0; border-radius: inherit; }
.sg-ct-media { position: relative; flex: 1; min-height: 0; margin: 0; overflow: hidden; border-radius: 16px; }
.sg-ct-media img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform .5s cubic-bezier(.2, .7, .2, 1); }
.sg-ct-card:hover .sg-ct-media img { transform: scale(1.04); }
.sg-ct-tag { align-self: flex-start; padding: 5px 11px; border-radius: 999px; font-size: 12px; font-weight: 500; background: rgb(255 255 255 / .7); color: #17171a; }
.sg-ct-media .sg-ct-tag { position: absolute; top: 10px; left: 10px; }
.sg-ct-go {
	position: absolute; right: 24px; bottom: 24px;
	display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%;
	color: #17171a; background: rgb(255 255 255 / .9);
	transition: transform .2s;
}
.sg-ct-card:hover .sg-ct-go { transform: rotate(-45deg); }

/* The first card: twice as wide, with its story */
.sg-ct-card[data-featured] { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; width: min(640px, calc(var(--sg-ct-card) * 2 + 14px)); }
.sg-ct-story { display: flex; flex-direction: column; gap: 12px; padding: 4px; }
.sg-ct-story h3 { padding: 0; font-size: clamp(19px, 1.6vw, 24px); }
.sg-ct-story p { margin: 0; font-size: 14px; line-height: 1.5; color: color-mix(in oklab, var(--sg-ct-ink) 72%, transparent); }
.sg-ct-story .sg-ct-figure { margin-top: auto; font-size: clamp(28px, 2.6vw, 40px); line-height: 1; font-weight: 300; letter-spacing: -0.03em; color: var(--sg-ct-ink); }

/* Arrows and progress */
.sg-ct-foot { display: flex; align-items: center; gap: 16px; }
.sg-ct-arrow {
	display: grid; place-items: center; width: 40px; height: 40px; padding: 0; border: 0; border-radius: 50%;
	font: inherit; font-size: 18px; color: var(--sg-ct-ink); background: var(--sg-ct-paper); cursor: pointer;
	transition: background .2s, opacity .2s;
}
[data-sg-prev] svg { transform: scaleX(-1); }
.sg-ct-arrow:hover { background: var(--sg-ct-tint); }
.sg-ct-arrow:disabled { opacity: .35; cursor: default; }
.sg-ct-progress { flex: 1; max-width: 320px; height: 2px; overflow: hidden; border-radius: 2px; background: color-mix(in oklab, var(--sg-ct-ink) 12%, transparent); }
.sg-ct-progress span { display: block; width: 100%; height: 100%; background: var(--sg-ct-ink); transform: scaleX(var(--p, .2)); transform-origin: 0 50%; }

/* Scrubbing: one screen, pinned; the row moves by transform */
.sg-ct[data-scrub] .sg-ct-stage { height: 100svh; box-sizing: border-box; padding-top: calc(var(--header-height, 64px) + 24px); padding-bottom: 32px; }
.sg-ct[data-scrub] .sg-ct-track { overflow: visible; scroll-snap-type: none; will-change: transform; }

@media (max-width: 767.98px) {
	.sg-ct-card[data-featured] { grid-template-columns: 1fr; width: 82vw; }
	.sg-ct-card[data-featured] .sg-ct-media { display: none; }
	.sg-ct-card { width: 70vw; height: 400px; }
}
`;
