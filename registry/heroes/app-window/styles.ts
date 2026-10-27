/**
 * The app window's stylesheet, added once per document. Building uses each
 * panel's `transform`; the pointer's depth shift uses its `translate`, a
 * separate property, so the two never fight. The window itself leans with
 * `--rx` / `--ry` and its light follows `--gx` / `--gy`, written by the engine.
 */
export const APP_WINDOW_STYLE_ID = "sg-app-window";

export const appWindowStyles = /* css */ `
.sg-aw {
	--sg-aw-ink: var(--foreground, #111114);
	--sg-aw-muted: var(--muted-foreground, #6b6b72);
	--sg-aw-accent: var(--brand, oklch(0.62 0.2 262));
	--sg-aw-surface: var(--card, var(--background, #fff));
	--sg-aw-line: color-mix(in oklab, var(--sg-aw-ink) 10%, transparent);
	--sg-aw-soft: color-mix(in oklab, var(--sg-aw-ink) 4%, var(--sg-aw-surface));
	--sg-aw-mono: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
	position: relative;
	isolation: isolate;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: clamp(40px, 6vw, 72px);
	padding: clamp(96px, 12vw, 136px) 20px clamp(56px, 8vw, 104px);
	color: var(--sg-aw-ink);
	background:
		radial-gradient(50% 40% at 50% 75%, color-mix(in oklab, var(--sg-aw-accent) 14%, transparent), transparent 70%),
		var(--background, #fafafa);
}
.sg-aw :focus-visible { outline: 2px solid var(--sg-aw-accent); outline-offset: 3px; }

/* Copy */
.sg-aw-copy { display: flex; flex-direction: column; align-items: center; gap: 18px; max-width: 44rem; text-align: center; }
.sg-aw-eyebrow { margin: 0; font-family: var(--sg-aw-mono); font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: var(--sg-aw-muted); }
.sg-aw-copy h1 { margin: 0; font-family: var(--font-display, inherit); font-size: clamp(36px, 5.4vw, 64px); font-weight: 600; line-height: 1.02; letter-spacing: -0.04em; text-wrap: balance; }
.sg-aw-copy > p:not(.sg-aw-eyebrow) { margin: 0; max-width: 46ch; font-size: 17px; line-height: 1.55; color: var(--sg-aw-muted); text-wrap: pretty; }
.sg-aw-ctas { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 8px; }
.sg-aw-cta { display: inline-flex; align-items: center; height: 46px; padding: 0 22px; border-radius: 999px; font-weight: 600; text-decoration: none; color: var(--primary-foreground, #fff); background: var(--primary, var(--sg-aw-ink)); }
.sg-aw-cta[data-variant="secondary"] { color: var(--sg-aw-ink); background: transparent; box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--sg-aw-ink) 18%, transparent); }

/* Stage and window */
.sg-aw-stage { width: min(100%, 1080px); perspective: 1600px; container-type: inline-size; }
.sg-aw-window {
	--rx: 0; --ry: 0; --gx: 50; --gy: 0;
	position: relative; overflow: hidden; border-radius: 14px;
	font-size: clamp(8px, 1.28cqw, 14px); line-height: 1.4;
	background: var(--sg-aw-surface);
	box-shadow: 0 0 0 1px var(--sg-aw-line), 0 2em 4em -1.5em rgb(0 0 0 / .35), 0 .5em 1em -.5em rgb(0 0 0 / .15);
	transform: rotateX(calc(var(--rx) * 1deg)) rotateY(calc(var(--ry) * 1deg));
}
.sg-aw-glare {
	position: absolute; inset: 0; z-index: 5; pointer-events: none;
	background: radial-gradient(60% 50% at calc(var(--gx) * 1%) calc(var(--gy) * 1%), rgb(255 255 255 / .16), transparent 70%);
	mix-blend-mode: soft-light;
}
.sg-aw-chrome { display: flex; align-items: center; gap: .6em; height: 2.6em; padding: 0 1em; border-bottom: 1px solid var(--sg-aw-line); }
.sg-aw-chrome i { width: .7em; height: .7em; border-radius: 50%; background: var(--sg-aw-line); }
.sg-aw-address { margin: 0 auto; padding: .2em 1.2em; border-radius: .5em; font-family: var(--sg-aw-mono); font-size: .82em; color: var(--sg-aw-muted); background: var(--sg-aw-soft); }

.sg-aw-app { display: grid; grid-template-columns: 13em minmax(0, 1fr); min-height: 34em; }
.sg-aw-side { display: flex; flex-direction: column; gap: .2em; padding: 1.2em .8em; border-right: 1px solid var(--sg-aw-line); background: var(--sg-aw-soft); }
.sg-aw-brand { display: flex; align-items: center; gap: .55em; margin: 0 .4em 1em; font-weight: 700; }
.sg-aw-brand::before { content: ""; width: 1.1em; height: 1.1em; border-radius: .3em; background: var(--sg-aw-accent); }
.sg-aw-nav { padding: .45em .6em; border-radius: .5em; color: var(--sg-aw-muted); }
.sg-aw-nav[data-current] { color: var(--sg-aw-ink); font-weight: 600; background: color-mix(in oklab, var(--sg-aw-accent) 12%, transparent); }

.sg-aw-main { display: flex; flex-direction: column; gap: 1.1em; padding: 1.4em 1.6em 1.6em; min-width: 0; }
.sg-aw-head { display: flex; align-items: center; justify-content: space-between; gap: 1em; }
.sg-aw-head h3 { margin: 0; font-size: 1.45em; font-weight: 600; letter-spacing: -0.02em; }
.sg-aw-button { padding: .45em 1em; border-radius: .5em; font-weight: 600; font-size: .9em; color: var(--primary-foreground, #fff); background: var(--sg-aw-accent); }

.sg-aw-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(9em, 1fr)); gap: .9em; }
.sg-aw-card { padding: .9em 1em; border-radius: .7em; background: var(--sg-aw-surface); box-shadow: 0 0 0 1px var(--sg-aw-line), 0 .3em .8em -.4em rgb(0 0 0 / .18); }
.sg-aw-stat-label { font-size: .82em; color: var(--sg-aw-muted); }
.sg-aw-stat-value { display: flex; align-items: baseline; gap: .5em; margin-top: .25em; font-size: 1.6em; font-weight: 650; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.sg-aw-delta { font-size: .5em; font-weight: 600; color: #16a34a; }
.sg-aw-delta[data-down] { color: var(--sg-aw-accent); }

.sg-aw-chart { display: flex; flex-direction: column; gap: .6em; }
.sg-aw-chart svg { display: block; width: 100%; height: 9em; overflow: visible; }
.sg-aw-line { fill: none; stroke: var(--sg-aw-accent); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.sg-aw-area { fill: var(--sg-aw-accent); opacity: .12; }
.sg-aw-grid { stroke: var(--sg-aw-line); stroke-width: 1; vector-effect: non-scaling-stroke; }

.sg-aw-table { padding: 0; overflow: hidden; }
.sg-aw-tr { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: 1em; padding: .6em 1em; border-top: 1px solid var(--sg-aw-line); white-space: nowrap; }
.sg-aw-tr:first-child { border-top: 0; font-size: .82em; color: var(--sg-aw-muted); background: var(--sg-aw-soft); }
.sg-aw-tr > span { overflow: hidden; text-overflow: ellipsis; }
.sg-aw-tr > span:first-child { font-family: var(--sg-aw-mono); }
.sg-aw-badge { justify-self: start; padding: .1em .6em; border-radius: 999px; font-size: .85em; font-weight: 600; background: var(--sg-aw-soft); }
.sg-aw-badge[data-status="ok"] { color: #15803d; background: color-mix(in oklab, #16a34a 14%, transparent); }
.sg-aw-badge[data-status="warn"] { color: #a16207; background: color-mix(in oklab, #eab308 18%, transparent); }
.sg-aw-badge[data-status="error"] { color: #b91c1c; background: color-mix(in oklab, #dc2626 14%, transparent); }

@container (max-width: 640px) {
	.sg-aw-app { grid-template-columns: minmax(0, 1fr); min-height: 0; }
	.sg-aw-side { display: none; }
	.sg-aw-window { font-size: 9.5px; }
	.sg-aw-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
	.sg-aw-tr { grid-template-columns: repeat(3, minmax(0, 1fr)); }
	.sg-aw-tr > span:nth-child(n + 4) { display: none; }
}

/* Building: panels wait lowered and faded, then arrive in order */
[data-sg-panel] { transition: opacity .55s ease-out, transform .7s cubic-bezier(.2, .9, .25, 1), translate .18s ease-out; }
.sg-aw[data-build] [data-sg-panel]:not(.is-built) { opacity: 0; transform: translateY(1.2em) scale(.98); }
/* The chart draws left to right: a clip, since dashes and a non-scaling stroke disagree on length. */
.sg-aw[data-build] .sg-aw-chart svg { clip-path: inset(0 100% 0 0); }
.sg-aw[data-build] .sg-aw-chart.is-built svg { clip-path: inset(0 0 0 0); transition: clip-path 1.5s cubic-bezier(.4, 0, .2, 1) .15s; }
.sg-aw[data-build] .sg-aw-table:not(.is-built) [data-sg-row] { opacity: 0; transform: translateX(-.8em); }
.sg-aw[data-build] [data-sg-row] { transition: opacity .4s ease-out calc(var(--r) * 90ms + .2s), transform .5s cubic-bezier(.2, .9, .25, 1) calc(var(--r) * 90ms + .2s); }

/* Before the engine runs, nothing should build twice; without it, all appears after a moment. */
@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
	.sg-aw:not([data-ready]) [data-sg-panel] { opacity: 0; animation: sg-aw-reveal .4s 2.5s forwards; }
}
@keyframes sg-aw-reveal { to { opacity: 1; } }
/* Reduced motion and still modes: nothing moves. Before the engine has set a mode only transitions are off, so the reveal fallback can run */
.sg-aw:not([data-motion="ready"]) *, .sg-aw:not([data-motion="ready"]) *::before { transition: none !important; }
.sg-aw[data-motion]:not([data-motion="ready"]) *, .sg-aw[data-motion]:not([data-motion="ready"]) *::before { animation: none !important; }
@media (prefers-reduced-motion: reduce) {
	.sg-aw:not([data-motion="ready"]) *, .sg-aw:not([data-motion="ready"]) *::before { animation: none !important; }
}
`;
