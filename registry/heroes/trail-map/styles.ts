/**
 * The trail map's stylesheet, added once per document. The frame's shape is
 * a `clip-path` the engine computes in pixels (rounded corners, a scooped
 * top-left, a notch at the bottom right for the explorers' badge). The route
 * is an SVG over the photo, in the photo's own coordinates; parallax moves
 * the photo and the route together (`--px`, `--py`), and the clouds further.
 */
export const TRAIL_MAP_STYLE_ID = "sg-trail-map";

export const trailMapStyles = /* css */ `
.sg-tm {
	--sg-tm-ink: var(--foreground, #111114);
	--sg-tm-muted: var(--muted-foreground, #66666c);
	--sg-tm-accent: oklch(0.68 0.19 42);
	--sg-tm-surface: var(--card, var(--background, #fff));
	--px: 0; --py: 0;
	position: relative;
	isolation: isolate;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	min-height: 100svh;
	padding-top: calc(var(--header-height, 64px) + clamp(12px, 3svh, 32px));
	color: var(--sg-tm-ink);
	background: var(--background, #fff);
}
.sg-tm :focus-visible { outline: 2px solid var(--sg-tm-accent); outline-offset: 3px; }
.sg-tm-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

.sg-tm-main {
	flex: 1;
	display: grid;
	align-items: center;
	gap: clamp(28px, 4vw, 56px);
	width: 100%;
	max-width: 1240px;
	margin: 0 auto;
	padding: clamp(8px, 2svh, 24px) clamp(16px, 4vw, 40px) clamp(28px, 5svh, 56px);
}
@media (min-width: 960px) {
	.sg-tm-main { grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.15fr); }
}

/* Copy */
.sg-tm-copy { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: flex-start; gap: 20px; }
.sg-tm-eyebrow { margin: 0; font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: var(--sg-tm-muted); }
.sg-tm h1 { margin: 0; max-width: 9ch; font-family: var(--font-display, inherit); font-size: clamp(46px, 6.6vw, 96px); font-weight: 700; line-height: .98; letter-spacing: -0.035em; }
.sg-tm-sub { margin: 0; max-width: 30ch; font-size: clamp(16px, 1.4vw, 19px); line-height: 1.5; color: var(--sg-tm-ink); }
.sg-tm-ctas { display: flex; flex-wrap: wrap; align-items: center; gap: 18px; margin-top: 12px; }
.sg-tm-cta {
	display: inline-flex; align-items: center; gap: 14px; height: 54px; padding: 0 8px 0 26px; border-radius: 16px;
	font-size: 15px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; text-decoration: none; color: #fff;
	background: linear-gradient(110deg, color-mix(in oklab, var(--sg-tm-accent), #fff 35%), var(--sg-tm-accent) 45%, color-mix(in oklab, var(--sg-tm-accent), #000 8%));
	box-shadow: 0 14px 28px -14px var(--sg-tm-accent);
	transition: transform .15s;
}
.sg-tm-cta:hover { transform: translateY(-1px); }
.sg-tm-cta-arrow { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 12px; color: var(--sg-tm-accent); background: #fff; }
.sg-tm-cta-arrow svg { width: 18px; height: 18px; }
.sg-tm-link { font-size: 15px; font-weight: 500; color: var(--sg-tm-ink); text-decoration: underline; text-underline-offset: 4px; text-decoration-color: color-mix(in oklab, var(--sg-tm-ink) 30%, transparent); }

/* Visual: the shaped frame, its badges, the clouds */
.sg-tm-visual { position: relative; width: 100%; aspect-ratio: 1.42; container-type: inline-size; }
.sg-tm-frame { position: absolute; inset: 0; overflow: hidden; background: color-mix(in oklab, var(--sg-tm-ink) 8%, transparent); }
.sg-tm-scene {
	position: absolute; inset: -3%;
	transform: translate3d(calc(var(--px) * -10px), calc(var(--py) * -8px), 0);
	transition: transform .5s cubic-bezier(.2, .8, .2, 1);
}
.sg-tm-scene img { display: block; width: 100%; height: 100%; object-fit: cover; }
.sg-tm-trail { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.sg-tm-route { fill: none; stroke: #fff; stroke-width: .5; stroke-linecap: round; stroke-dasharray: .01 1.45; filter: drop-shadow(0 0 .3px rgb(0 0 0 / .4)); }
.sg-tm-reveal { fill: none; stroke: #fff; stroke-width: 3; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 0; transition: stroke-dashoffset 2.6s cubic-bezier(.45, 0, .3, 1); }
.sg-tm[data-intro="pending"] .sg-tm-reveal { stroke-dashoffset: 1; transition: none; }
.sg-tm-stop { fill: #fff; stroke: rgb(0 0 0 / .18); stroke-width: .25; transform-box: fill-box; transform-origin: center; transition: transform .45s cubic-bezier(.3, 1.6, .5, 1), opacity .3s; transition-delay: var(--at, 0ms); }
.sg-tm[data-intro="pending"] .sg-tm-stop { transform: scale(0); opacity: 0; }
.sg-tm-pin { fill: var(--sg-tm-accent); }
.sg-tm-pin-glow { fill: var(--sg-tm-accent); opacity: .35; transform-box: fill-box; transform-origin: center; animation: sg-tm-pulse 2.4s ease-out infinite; }
@keyframes sg-tm-pulse { from { transform: scale(.6); opacity: .5; } to { transform: scale(2.2); opacity: 0; } }
.sg-tm-walker circle:first-child { fill: var(--sg-tm-accent); opacity: .35; }
.sg-tm-walker circle:last-child { fill: #fff; stroke: var(--sg-tm-accent); stroke-width: .45; }
.sg-tm-walker { transition: opacity .4s; }
.sg-tm:not([data-walking]) .sg-tm-walker { opacity: 0; }

/* Badge at the end of the route */
.sg-tm-summit {
	--bx: 0px; --by: 0px;
	position: absolute; left: 0; top: 0; z-index: 3;
	display: flex; align-items: center; gap: 10px; padding: 8px 14px 8px 8px; border-radius: 999px;
	color: #fff; background: rgb(12 12 14 / .42); backdrop-filter: blur(10px);
	transform: translate(var(--bx), var(--by)) translate(calc(var(--px) * -10px), calc(var(--py) * -8px));
	transition: transform .5s cubic-bezier(.2, .8, .2, 1), opacity .5s;
	font-size: clamp(11px, 1.6cqw, 13px); line-height: 1.2; white-space: nowrap;
}
.sg-tm-summit-icon { display: grid; place-items: center; width: 2.4em; height: 2.4em; border-radius: 50%; background: var(--sg-tm-accent); }
.sg-tm-summit-icon svg { width: 1.2em; height: 1.2em; }
.sg-tm-summit-text b { display: block; font-size: 1.1em; }
.sg-tm-summit-text small { display: block; font-size: 1em; opacity: .8; }
.sg-tm[data-intro="pending"] .sg-tm-summit, .sg-tm[data-intro="drawing"] .sg-tm-summit { opacity: 0; }

/* Explorers, in the frame's notch */
.sg-tm-explorers {
	position: absolute; right: 0; bottom: 0; z-index: 3;
	width: calc(36% - 14px); height: calc(24% - 14px);
	display: flex; align-items: center; justify-content: center; gap: 12px;
	font-size: clamp(11px, 1.5cqw, 13px);
}
.sg-tm-avatars { display: flex; }
.sg-tm-avatar {
	display: grid; place-items: center; width: 2.9em; height: 2.9em; margin-left: -.8em; border-radius: 50%;
	font-size: .9em; font-weight: 600; color: #fff; background: var(--c); box-shadow: 0 0 0 3px var(--background, #fff);
}
.sg-tm-avatar:first-child { margin-left: 0; }
.sg-tm-explorers-text b { display: block; font-size: 1.7em; font-weight: 700; line-height: 1; }
.sg-tm-explorers-text small { display: block; max-width: 9em; font-size: 1em; color: var(--sg-tm-muted); line-height: 1.25; }

/* Clouds and sparkles: decoration, on their own depth */
.sg-tm-cloud {
	position: absolute; z-index: 4; pointer-events: none;
	filter: drop-shadow(0 12px 18px rgb(0 0 0 / .12));
	transform: translate3d(calc(var(--px) * var(--depth, 22px)), calc(var(--py) * var(--depth, 22px) * .6), 0);
	transition: transform .7s cubic-bezier(.2, .8, .2, 1);
}
.sg-tm-cloud svg { display: block; width: 100%; height: auto; animation: sg-tm-drift var(--drift, 14s) ease-in-out infinite alternate; }
.sg-tm-cloud[data-side="left"] { left: -7%; bottom: 13%; width: 27%; --depth: 26px; --drift: 13s; }
.sg-tm-cloud[data-side="right"] { right: -5%; top: 34%; width: 31%; --depth: 18px; --drift: 17s; }
@keyframes sg-tm-drift { from { transform: translateX(-3%); } to { transform: translateX(4%); } }
.dark .sg-tm-cloud { opacity: .92; }
.sg-tm-spark { position: absolute; z-index: 1; width: 22px; height: 22px; color: var(--sg-tm-ink); pointer-events: none; animation: sg-tm-twinkle 3.4s ease-in-out infinite; }
.sg-tm-spark:nth-of-type(2) { animation-delay: -1.2s; width: 14px; height: 14px; }
.sg-tm-spark:nth-of-type(3) { animation-delay: -2.1s; width: 30px; height: 30px; }
@keyframes sg-tm-twinkle { 50% { transform: scale(.55) rotate(20deg); opacity: .35; } }

/* Routes strip */
.sg-tm-band { position: relative; z-index: 2; padding: clamp(16px, 3svh, 28px) 0; background: color-mix(in oklab, var(--sg-tm-ink) 3.5%, var(--background, #fff)); }
.sg-tm-band-inner { display: flex; align-items: center; gap: 12px; max-width: 1240px; margin: 0 auto; padding: 0 clamp(16px, 4vw, 40px); }
.sg-tm-arrow {
	flex: none; display: grid; place-items: center; width: 40px; height: 40px; border: 0; border-radius: 50%; cursor: pointer;
	color: var(--sg-tm-accent); background: var(--sg-tm-surface); box-shadow: 0 6px 16px -8px rgb(0 0 0 / .3);
}
.sg-tm-arrow:disabled { cursor: default; color: var(--sg-tm-muted); opacity: .5; box-shadow: none; }
.sg-tm-arrow svg { width: 18px; height: 18px; }
.sg-tm-routes {
	flex: 1; display: flex; gap: 16px; margin: 0; padding: 6px 2px; list-style: none;
	overflow-x: auto; scroll-snap-type: x mandatory; scroll-behavior: smooth; scrollbar-width: none;
}
.sg-tm-routes::-webkit-scrollbar { display: none; }
.sg-tm-routes li { flex: none; scroll-snap-align: start; }
.sg-tm-route-card {
	display: flex; align-items: center; gap: 14px; width: 270px; padding: 10px 16px 10px 10px; border-radius: 16px;
	color: inherit; text-decoration: none; background: var(--sg-tm-surface); box-shadow: 0 8px 22px -14px rgb(0 0 0 / .35);
	transition: transform .2s;
}
.sg-tm-route-card:hover { transform: translateY(-2px); }
.sg-tm-route-card img { width: 72px; height: 64px; flex: none; border-radius: 12px; object-fit: cover; }
.sg-tm-route-card b { display: block; font-size: 16px; font-weight: 600; }
.sg-tm-route-card small { display: block; margin-top: 2px; font-size: 12px; color: var(--sg-tm-muted); }
.sg-tm-stars { margin-top: 4px; font-size: 11px; letter-spacing: 1px; color: var(--sg-tm-accent); }
.sg-tm-stars span { margin-left: 6px; letter-spacing: 0; color: var(--sg-tm-muted); }

@media (max-width: 640px) {
	.sg-tm-explorers-text small { display: none; }
	.sg-tm-route-card { width: 240px; }
	.sg-tm-arrow { display: none; }
}

/* Reduced motion, ?motion=off and ?motion=final: the route drawn, nothing moving */
.sg-tm:not([data-motion="ready"]) *, .sg-tm:not([data-motion="ready"]) *::before { transition: none !important; animation: none !important; }
`;
