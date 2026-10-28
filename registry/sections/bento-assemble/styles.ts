/**
 * The bento assemble's stylesheet, added once per document. Without motion
 * it is a headline over a four-column bento. While it scrubs (`data-scrub`),
 * the stage is one screen tall and the tiles only move by `transform`.
 * The accents are mixed toward the background in the dark theme.
 */
export const BENTO_ASSEMBLE_STYLE_ID = "sg-bento-assemble";

export const bentoAssembleStyles = /* css */ `
.sg-ba {
	--sg-ba-ink: var(--foreground, #111114);
	--sg-ba-muted: var(--muted-foreground, #66666c);
	--sg-ba-bg: var(--background, #f6f6f4);
	--sg-ba-accent: #ee8a7b;
	--sg-ba-accent-2: #b9ccb1;
	--sg-ba-paper: color-mix(in oklab, var(--sg-ba-ink) 4%, var(--sg-ba-bg));
	--sg-ba-fill: var(--sg-ba-accent);
	--sg-ba-fill-2: var(--sg-ba-accent-2);
	--sg-ba-on-fill: #17171a;
	--sg-ba-sheen: white;
	--sg-ba-gutter: clamp(16px, 5vw, 80px);
	position: relative;
	color: var(--sg-ba-ink);
	background: var(--sg-ba-bg);
}
.dark .sg-ba, .sg-ba[data-tone="dark"] {
	--sg-ba-fill: color-mix(in oklab, var(--sg-ba-accent) 58%, #121214);
	--sg-ba-fill-2: color-mix(in oklab, var(--sg-ba-accent-2) 42%, #121214);
	--sg-ba-on-fill: #f6f6f4;
	--sg-ba-sheen: #3b3b40;
}
.sg-ba :focus-visible { outline: 2px solid var(--sg-ba-ink); outline-offset: 4px; }
.sg-ba-stage {
	display: flex; flex-direction: column; justify-content: center; gap: clamp(24px, 3.5vw, 40px);
	max-width: 1280px; margin: 0 auto;
	padding: clamp(64px, 10vw, 128px) var(--sg-ba-gutter);
}

/* Headline, text and badge */
.sg-ba-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 20px 40px; }
.sg-ba-eyebrow { margin: 0 0 12px; font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: var(--sg-ba-muted); }
.sg-ba-head h2 { margin: 0; max-width: 14ch; font-size: clamp(36px, 5.6vw, 76px); line-height: .98; font-weight: 500; letter-spacing: -0.04em; text-wrap: balance; }
.sg-ba-aside { display: flex; align-items: center; gap: 24px; }
.sg-ba-aside p { margin: 0; max-width: 34ch; font-size: 15px; line-height: 1.5; color: var(--sg-ba-muted); }
.sg-ba-badge {
	position: relative; flex: none; display: grid; place-items: center;
	width: 96px; height: 96px; border-radius: 50%;
	color: var(--sg-ba-ink); text-decoration: none;
}
.sg-ba-ring { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.sg-ba-ring text { fill: currentColor; font-size: 10.5px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; }
.sg-ba-play {
	display: grid; place-items: center; width: 46px; height: 46px; border-radius: 50%;
	background: var(--sg-ba-fill); color: var(--sg-ba-on-fill);
	transition: transform .2s;
}
.sg-ba-play::before { content: ""; margin-left: 4px; border-left: 12px solid currentColor; border-top: 8px solid transparent; border-bottom: 8px solid transparent; }
.sg-ba-badge:hover .sg-ba-play { transform: scale(1.08); }

/* The bento */
.sg-ba-grid {
	display: grid; gap: 14px; margin: 0; padding: 0; list-style: none;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	grid-auto-rows: clamp(120px, 19svh, 190px);
	grid-auto-flow: dense;
}
.sg-ba-tile {
	position: relative; overflow: hidden; isolation: isolate;
	display: flex; flex-direction: column; justify-content: flex-end; gap: 6px;
	min-width: 0; padding: 18px 20px; border-radius: 24px;
	background: var(--sg-ba-paper);
	transform-origin: 50% 50%;
}
.sg-ba-tile[data-size="wide"] { grid-column: span 2; }
.sg-ba-tile[data-size="tall"] { grid-row: span 2; }
.sg-ba-tile[data-size="large"] { grid-column: span 2; grid-row: span 2; }
.sg-ba-tile[data-tone="accent"] { color: var(--sg-ba-on-fill); background: linear-gradient(160deg, color-mix(in oklab, var(--sg-ba-fill) 72%, var(--sg-ba-sheen)), var(--sg-ba-fill)); }
.sg-ba-tile[data-tone="accent-2"] { color: var(--sg-ba-on-fill); background: linear-gradient(160deg, color-mix(in oklab, var(--sg-ba-fill-2) 70%, var(--sg-ba-sheen)), var(--sg-ba-fill-2)); }
.sg-ba-tile[data-tone="photo"] { padding: 0; background: color-mix(in oklab, var(--sg-ba-ink) 8%, var(--sg-ba-bg)); }
.sg-ba-tile[data-tone="photo"] > img { position: absolute; inset: 0; z-index: -1; width: 100%; height: 100%; object-fit: cover; }
.sg-ba-tile:not([data-tone="photo"]) > img { width: 56px; height: 56px; margin-bottom: auto; border-radius: 16px; object-fit: cover; }

.sg-ba-figure { position: relative; margin: 0 0 auto; font-size: clamp(34px, 3.6vw, 54px); line-height: 1; font-weight: 300; letter-spacing: -0.04em; font-variant-numeric: tabular-nums; white-space: nowrap; }
.sg-ba-tile h3 { margin: 0; font-size: 17px; line-height: 1.2; font-weight: 600; letter-spacing: -0.01em; }
.sg-ba-tile p:not(.sg-ba-figure) { margin: 0; font-size: 14px; line-height: 1.4; opacity: .72; }
.sg-ba-tile[data-tone="paper"] p:not(.sg-ba-figure) { color: var(--sg-ba-muted); opacity: 1; }
.sg-ba-label {
	position: absolute; top: 14px; left: 14px;
	padding: 5px 11px; border-radius: 999px;
	font-size: 12px; font-weight: 500; color: #17171a; background: rgb(255 255 255 / .86); backdrop-filter: blur(6px);
}
.sg-ba-tile[data-tone="paper"] .sg-ba-label { left: auto; right: 14px; color: var(--sg-ba-on-fill); background: var(--sg-ba-fill); }
.sg-ba-avatars { position: absolute; top: 18px; right: 20px; display: flex; margin: 0; padding: 0 10px 0 0; list-style: none; }
.sg-ba-avatars li { width: 40px; height: 40px; margin-right: -10px; overflow: hidden; border-radius: 50%; border: 2px solid var(--sg-ba-paper); }
.sg-ba-avatars img { display: block; width: 100%; height: 100%; object-fit: cover; }

/* Scrubbing: one screen, pinned */
.sg-ba[data-scrub] .sg-ba-stage { min-height: 100svh; padding-top: calc(var(--header-height, 64px) + 24px); padding-bottom: 24px; }
.sg-ba[data-scrub] .sg-ba-tile { will-change: transform, opacity; }

@media (max-width: 1023.98px) {
	.sg-ba-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-rows: 168px; }
}
`;
