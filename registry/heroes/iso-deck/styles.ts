/**
 * The iso deck's stylesheet, added once per document. The deck is line art:
 * every face is a polygon tinted from a few tokens (`--c` per key: its top,
 * then two darker sides), so it follows the theme and the brand accent. The
 * story is three attributes on the deck, which the engine sets in turn:
 * `data-cursor` (in the tile, or out of it), `data-select` and `data-tip`.
 * Without the engine they hold the still frame: cursor out, tile selected,
 * tooltip open.
 */
export const ISO_DECK_STYLE_ID = "sg-iso-deck";

export const isoDeckStyles = /* css */ `
.sg-id {
	--sg-id-ink: var(--foreground, #16161a);
	--sg-id-muted: var(--muted-foreground, #66666e);
	--sg-id-bg: var(--background, #fbfbfa);
	--sg-id-panel: color-mix(in oklab, var(--sg-id-ink) 5%, var(--sg-id-bg));
	--sg-id-line: color-mix(in oklab, var(--sg-id-ink) 88%, var(--sg-id-bg));
	--sg-id-face: color-mix(in oklab, white 82%, var(--sg-id-bg));
	--sg-id-plate: color-mix(in oklab, var(--sg-id-face) 94%, var(--sg-id-ink));
	--sg-id-shade: #1d1e24;
	--sg-id-screen: color-mix(in oklab, var(--sg-id-ink) 92%, var(--sg-id-bg));
	--sg-id-select-c: #4d8dff;
	--sg-id-mono: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
	--sg-id-accent: var(--brand, oklch(0.84 0.17 145));
	/* The second tone: a split complement of the brand, kept light and soft enough for line art. */
	--sg-id-accent-2: color-mix(in oklab, var(--sg-id-accent) 30%, oklch(0.72 0.15 45));
	--sg-id-on-accent: #0f1311;
	position: relative; isolation: isolate;
	display: grid; grid-template-columns: minmax(0, .85fr) minmax(0, 1.15fr); align-items: center; gap: clamp(28px, 4vw, 64px);
	min-height: max(640px, 100svh); box-sizing: border-box;
	padding: calc(var(--header-height, 64px) + clamp(24px, 4svh, 48px)) clamp(20px, 4vw, 56px) clamp(24px, 5svh, 56px);
	color: var(--sg-id-ink); background: var(--sg-id-bg);
}
@supports (color: oklch(from red l c h)) {
	.sg-id {
		--sg-id-accent-2: oklch(from var(--sg-id-accent) clamp(.66, l, .76) clamp(.11, c, .16) calc(h + 150));
		--sg-id-on-accent: oklch(from var(--sg-id-accent) clamp(0, (.64 - l) * 1000, 1) 0 0);
	}
}
.dark .sg-id, .sg-id[data-tone="dark"] {
	--sg-id-panel: color-mix(in oklab, var(--sg-id-ink) 6%, var(--sg-id-bg));
	--sg-id-face: color-mix(in oklab, var(--sg-id-ink) 13%, var(--sg-id-bg));
	--sg-id-plate: color-mix(in oklab, var(--sg-id-ink) 9%, var(--sg-id-bg));
	--sg-id-line: color-mix(in oklab, var(--sg-id-ink) 72%, var(--sg-id-bg));
	--sg-id-shade: #000;
	--sg-id-screen: color-mix(in oklab, black 55%, var(--sg-id-bg));
}
.sg-id :focus-visible { outline: 2px solid var(--sg-id-ink); outline-offset: 3px; }

/* The copy */
.sg-id-copy { display: flex; flex-direction: column; align-items: flex-start; gap: 20px; max-width: 600px; }
.sg-id-eyebrow { margin: 0; font-size: 14px; font-weight: 500; color: var(--sg-id-muted); }
.sg-id h1 { margin: 0; font-size: clamp(40px, 5.4vw, 82px); line-height: 1; font-weight: 650; letter-spacing: -0.045em; text-wrap: balance; }
.sg-id-sub { margin: 0; max-width: 40ch; font-size: clamp(15px, 1.2vw, 17px); line-height: 1.55; color: var(--sg-id-muted); }
.sg-id-ctas { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px; }
.sg-id-cta {
	display: inline-flex; align-items: center; height: 46px; padding: 0 22px; border-radius: 999px;
	font-size: 15px; font-weight: 600; text-decoration: none;
	color: var(--sg-id-on-accent); background: var(--sg-id-accent);
	transition: transform .16s cubic-bezier(.23, 1, .32, 1), background-color .16s;
}
.sg-id-cta[data-variant="secondary"] { color: var(--sg-id-ink); background: color-mix(in oklab, var(--sg-id-ink) 7%, var(--sg-id-bg)); }
.sg-id-cta:active { transform: scale(.97); }
@media (hover: hover) and (pointer: fine) {
	.sg-id-cta:hover { transform: translateY(-1px); }
	.sg-id-cta[data-variant="secondary"]:hover { background: color-mix(in oklab, var(--sg-id-ink) 11%, var(--sg-id-bg)); }
}

/* The panel, and the deck in it (its own container: the tooltip is sized in deck units) */
.sg-id-panel {
	position: relative; display: grid; place-items: center; overflow: hidden;
	min-height: min(68svh, 620px); padding: clamp(10px, 1.6vw, 24px); box-sizing: border-box;
	border-radius: 28px; background: var(--sg-id-panel);
}
.sg-id-deck { position: relative; width: 100%; container-type: inline-size; -webkit-tap-highlight-color: transparent; }
.sg-id-art, .sg-id-svg { display: block; width: 100%; height: auto; overflow: visible; }
.sg-id-svg { stroke: var(--sg-id-line); stroke-width: 1.25; stroke-linejoin: round; stroke-linecap: round; }

/* Faces: --c is the top, the sides darken toward the shade */
.sg-id-svg { --c: var(--sg-id-face); }
.sg-id-t { fill: var(--c); }
.sg-id-l { fill: color-mix(in oklab, var(--c) 88%, var(--sg-id-shade)); }
.sg-id-r { fill: color-mix(in oklab, var(--c) 76%, var(--sg-id-shade)); }
.sg-id-plate { --c: var(--sg-id-plate); }
.sg-id-print { fill: none; stroke-width: 1.6; }
.sg-id-letter, .sg-id-label { fill: var(--sg-id-line); stroke: none; font-family: var(--sg-id-mono); text-anchor: middle; dominant-baseline: central; }
.sg-id-letter { font-size: 15px; font-weight: 600; }
.sg-id-label { font-size: 9px; font-weight: 500; letter-spacing: .02em; }
.sg-id-key[data-key="cta"] { --c: var(--sg-id-accent); }
.sg-id-key[data-key="cta"] .sg-id-label { fill: var(--sg-id-on-accent); }
.sg-id-key { cursor: default; }
.sg-id-cap { transition: transform .16s cubic-bezier(.23, 1, .32, 1); }
.sg-id-key[data-down] .sg-id-cap { transform: translateY(var(--sg-id-press, 6px)); transition-duration: .07s; }
.sg-id-key .sg-id-t { transition: fill .16s; }
.sg-id-key[data-down] .sg-id-t { fill: color-mix(in oklab, var(--c) 78%, var(--sg-id-accent)); }
.sg-id-key[data-key="cta"][data-down] .sg-id-t { fill: color-mix(in oklab, var(--c) 88%, white); }
.sg-id-ring { fill: none; stroke: var(--sg-id-ink); stroke-width: 2.5; opacity: 0; pointer-events: none; }
.sg-id-deck:has(.sg-id-keylink:focus-visible) .sg-id-ring { opacity: 1; }

/* The knob, the screen and its meter */
.sg-id-dial { transition: transform .3s cubic-bezier(.23, 1, .32, 1); }
.sg-id-screen { --c: var(--sg-id-screen); }
.sg-id-screen .sg-id-t, .sg-id-screen .sg-id-l, .sg-id-screen .sg-id-r { stroke: var(--sg-id-line); }
.sg-id-bar { fill: var(--b); stroke: none; transform-box: fill-box; transform-origin: 50% 100%; }
.sg-id-tick { fill: none; stroke: color-mix(in oklab, var(--sg-id-face) 60%, transparent); stroke-width: .8; }
.sg-id-wire { fill: none; stroke-width: 1.5; }
.sg-id-cable { --c: var(--sg-id-face); }

/* The tile, its line, the spinner */
.sg-id-leader { fill: none; stroke: color-mix(in oklab, var(--sg-id-line) 55%, transparent); stroke-dasharray: 2 5; }
.sg-id-spin circle { fill: none; stroke: color-mix(in oklab, var(--sg-id-line) 40%, transparent); stroke-width: 1.4; stroke-dasharray: 60 21; }
.sg-id-tile { --c: var(--sg-id-face); }
.sg-id-tile .sg-id-l { fill: color-mix(in oklab, var(--sg-id-accent-2) 92%, var(--sg-id-shade)); }
.sg-id-tile .sg-id-r { fill: color-mix(in oklab, var(--sg-id-accent-2) 78%, var(--sg-id-shade)); }
.sg-id-tile-body { transform-box: fill-box; transform-origin: 50% 100%; }
.sg-id-emblem { fill: var(--sg-id-accent); stroke-width: 1.2; }
.sg-id-halo { fill: none; stroke: var(--sg-id-accent); stroke-width: 2; opacity: 0; transform-box: fill-box; transform-origin: center; }

/* The story: selection, cursor, tooltip */
.sg-id-select { fill: white; stroke: var(--sg-id-select-c); stroke-width: 1.2; opacity: 0; transition: opacity .15s ease-out; }
.sg-id-frame { fill: none; }
.sg-id-deck[data-select] .sg-id-select { opacity: 1; }
.sg-id-cursor {
	fill: var(--sg-id-face); stroke: var(--sg-id-line); stroke-width: 1.3;
	transform: translate(var(--in-x), var(--in-y)) scale(.4); opacity: 0;
	transition: transform .5s cubic-bezier(.6, 0, .8, .3), opacity .3s ease-in .2s;
}
.sg-id-deck[data-cursor="out"] .sg-id-cursor {
	transform: translate(var(--out-x), var(--out-y)); opacity: 1;
	transition: transform .65s cubic-bezier(.23, 1, .32, 1), opacity .2s ease-out;
}
.sg-id-tip {
	position: absolute; margin: 0; max-width: calc(var(--u, 10) * 5.6cqw); box-sizing: border-box;
	padding: calc(var(--u, 10) * .16cqw) calc(var(--u, 10) * .24cqw);
	border: 1px solid color-mix(in oklab, var(--sg-id-ink) 16%, transparent); border-radius: calc(var(--u, 10) * .12cqw);
	font: 500 max(10px, calc(var(--u, 10) * .25cqw)) / 1.45 var(--sg-id-mono); color: var(--sg-id-ink);
	background: var(--sg-id-bg); box-shadow: 0 8px 20px -12px rgb(0 0 0 / .3);
	opacity: 0; transform: translateY(4px) scale(.97); transform-origin: 0 0;
	transition: opacity .15s ease-in, transform .15s ease-in; pointer-events: none;
}
.sg-id-tip::before { content: attr(data-text); }
.sg-id-deck[data-typing] .sg-id-tip::after { content: ""; display: inline-block; width: .55em; height: 1.1em; margin-left: 1px; vertical-align: -.2em; background: currentColor; animation: sg-id-caret .9s steps(1) infinite; }
.sg-id-deck[data-tip="open"] .sg-id-tip { opacity: 1; transform: none; transition: opacity .2s ease-out, transform .2s cubic-bezier(.23, 1, .32, 1); }
.sg-id[data-connected] .sg-id-tip { border-color: var(--sg-id-accent); box-shadow: 0 0 0 3px color-mix(in oklab, var(--sg-id-accent) 30%, transparent); }
.sg-id[data-connected] .sg-id-tip::before { content: "● " attr(data-text); }

/* The front key's link: an invisible box over the key, cut to its shape */
.sg-id-keylink { position: absolute; z-index: 2; outline: none; font-size: 0; color: transparent; -webkit-tap-highlight-color: transparent; }
.sg-id-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

/* Moving parts: only with motion on */
.sg-id[data-motion="ready"] .sg-id-leader { animation: sg-id-march 1.2s linear infinite; }
.sg-id[data-motion="ready"] .sg-id-spin circle { transform-box: fill-box; transform-origin: center; animation: sg-id-spin 1.6s linear infinite; }
.sg-id[data-motion="ready"] .sg-id-tile-body[data-gulp] { animation: sg-id-gulp .42s cubic-bezier(.23, 1, .32, 1); }
.sg-id[data-motion="ready"][data-connected] .sg-id-halo { animation: sg-id-halo 1.1s cubic-bezier(.23, 1, .32, 1) infinite; }
.sg-id[data-motion="ready"][data-connected] .sg-id-tile-body { animation: sg-id-pulse 1.1s cubic-bezier(.23, 1, .32, 1) infinite; }
.sg-id[data-paused] * { animation-play-state: paused !important; }
@keyframes sg-id-march { to { stroke-dashoffset: -14; } }
@keyframes sg-id-spin { to { transform: rotate(1turn); } }
@keyframes sg-id-gulp { 35% { transform: scale(1.07, .88); } }
@keyframes sg-id-pulse { 30% { transform: translateY(-3px); } }
@keyframes sg-id-halo { from { opacity: .7; transform: scale(.7); } to { opacity: 0; transform: scale(1.25); } }
@keyframes sg-id-caret { 50% { opacity: 0; } }

/* Reduced motion and still modes: nothing travels; keys still answer, by colour */
.sg-id[data-motion]:not([data-motion="ready"]) .sg-id-cap,
.sg-id[data-motion]:not([data-motion="ready"]) .sg-id-cursor,
.sg-id[data-motion]:not([data-motion="ready"]) .sg-id-tip,
.sg-id[data-motion]:not([data-motion="ready"]) .sg-id-dial { transition-property: opacity, fill, border-color, box-shadow; }
.sg-id[data-motion]:not([data-motion="ready"]) .sg-id-key[data-down] .sg-id-cap { transform: none; }

@media (max-width: 860px) {
	.sg-id { grid-template-columns: minmax(0, 1fr); min-height: 0; }
	.sg-id-panel { min-height: 0; padding: 20px 12px; border-radius: 22px; }
}
`;
