/**
 * The bento tiles' stylesheet, added once per document. The engine adds the
 * wall of tiles (`.sg-bt-tiles`, each tile lifted by `--lift`), the crosses
 * over the portrait, the world map on the dark card, and sets the figures'
 * progress (`--sg-bt-progress`) and the avatars' places on the orbits
 * (`--ring`, `--a`). Everything that moves on hover is plain CSS.
 */
export const BENTO_TILES_STYLE_ID = "sg-bento-tiles";

const PLUS = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cpath d='M12 6.5v11M6.5 12h11' stroke='%23000' stroke-width='2.6'/%3E%3C/svg%3E")`;

export const bentoTilesStyles = /* css */ `
.sg-bt {
	--sg-bt-ink: var(--foreground, #0e0e10);
	--sg-bt-muted: var(--muted-foreground, #6b6b72);
	--sg-bt-paper: color-mix(in oklab, var(--sg-bt-ink) 5%, var(--background, #fff));
	--sg-bt-card: color-mix(in oklab, var(--sg-bt-ink) 7%, var(--background, #fff));
	--sg-bt-edge: color-mix(in oklab, var(--background, #fff) 70%, transparent);
	--sg-bt-accent: oklch(0.88 0.12 125);
	--sg-bt-marks: oklch(0.62 0.23 27);
	--sg-bt-g1: oklch(0.86 0.09 225);
	--sg-bt-g2: oklch(0.94 0.03 250);
	--sg-bt-g3: oklch(0.91 0.06 40);
	--sg-bt-tile: 104px;
	--sg-bt-ease: cubic-bezier(.2, .8, .2, 1);
	position: relative;
	isolation: isolate;
	overflow: hidden;
	overflow: clip;
	display: flex;
	flex-direction: column;
	align-items: center;
	min-height: 100svh;
	padding: calc(var(--header-height, 0px) + 12px) 16px clamp(24px, 5svh, 56px);
	color: var(--sg-bt-ink);
	background: var(--sg-bt-paper);
}
.sg-bt :focus-visible { outline: 2px solid var(--sg-bt-ink); outline-offset: 3px; }
.sg-bt-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

/* Buttons: dark pills */
.sg-bt-btn {
	display: inline-flex; align-items: center; justify-content: center; gap: 10px;
	height: 40px; padding: 0 22px; border-radius: 999px;
	font-size: 14px; font-weight: 500; text-decoration: none; white-space: nowrap;
	color: var(--background, #fff); background: var(--sg-bt-ink);
	box-shadow: 0 10px 22px -12px rgb(0 0 0 / .5);
	transition: transform .2s var(--sg-bt-ease), box-shadow .2s;
}
.sg-bt-btn:hover { transform: translateY(-1px); box-shadow: 0 14px 26px -12px rgb(0 0 0 / .55); }
.sg-bt-btn svg { width: 14px; height: 14px; transition: transform .2s var(--sg-bt-ease); }
.sg-bt-btn:hover svg { transform: translateX(3px); }

/* Top bar */
.sg-bt-nav {
	position: relative; z-index: 2;
	display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
	width: 100%; max-width: 1180px; min-height: 56px;
}
.sg-bt-brand { justify-self: start; font-size: 19px; font-weight: 500; letter-spacing: -0.02em; color: inherit; text-decoration: none; }
.sg-bt-links { display: flex; gap: clamp(16px, 3vw, 36px); margin: 0; padding: 0; list-style: none; }
.sg-bt-links a { font-size: 14px; color: var(--sg-bt-ink); text-decoration: none; opacity: .78; transition: opacity .2s; }
.sg-bt-links a:hover { opacity: 1; }
.sg-bt-nav .sg-bt-btn { justify-self: end; }
.sg-bt[data-nav="off"] .sg-bt-nav { display: none; }

/* Copy */
.sg-bt-copy {
	position: relative; z-index: 1;
	display: flex; flex-direction: column; align-items: center;
	max-width: 880px; margin-top: auto; padding-top: clamp(20px, 4.5svh, 72px); text-align: center;
}
.sg-bt h1 {
	margin: 0; max-width: 17ch;
	font-family: var(--font-display, inherit); font-size: clamp(36px, min(5vw, 7.4svh), 70px); font-weight: 500;
	line-height: 1.04; letter-spacing: -0.045em; text-wrap: balance;
}
.sg-bt-word { display: inline-block; }
.sg-bt-sub { margin: clamp(14px, 2.4svh, 22px) 0 0; max-width: 46ch; font-size: clamp(14px, 1.15vw, 16px); line-height: 1.5; color: var(--sg-bt-muted); text-wrap: pretty; }
.sg-bt-copy .sg-bt-btn { height: 46px; margin-top: clamp(18px, 3.4svh, 30px); padding: 0 22px 0 26px; }

/* The wall of tiles, behind the copy, fading toward the cards */
.sg-bt-tiles {
	position: absolute; inset: 0 0 auto; z-index: -1;
	height: min(78%, 900px);
	overflow: hidden;
	pointer-events: none;
	-webkit-mask-image: linear-gradient(#000 35%, transparent 96%), linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
	mask-image: linear-gradient(#000 35%, transparent 96%), linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
	-webkit-mask-composite: source-in;
	mask-composite: intersect;
}
.sg-bt-tile {
	--lift: 0;
	position: absolute;
	width: var(--sg-bt-tile); height: var(--sg-bt-tile);
	border-radius: calc(var(--sg-bt-tile) * .12);
	background: linear-gradient(150deg, color-mix(in oklab, var(--background, #fff) 55%, var(--sg-bt-paper)), var(--sg-bt-paper) 60%);
	box-shadow:
		inset 0 1px 0 color-mix(in oklab, var(--background, #fff) 90%, transparent),
		0 0 0 1px color-mix(in oklab, var(--sg-bt-ink) 4%, transparent),
		0 calc(4px + var(--lift) * 10px) calc(10px + var(--lift) * 18px) calc(-6px - var(--lift) * 4px) color-mix(in oklab, var(--sg-bt-ink) calc(10% + var(--lift) * 10%), transparent);
	transform: translateY(calc(var(--lift) * -5px)) scale(calc(1 + var(--lift) * .02));
}
.sg-bt-tile[data-press] { animation: sg-bt-press 1.1s var(--sg-bt-ease); }
@keyframes sg-bt-press {
	35% {
		transform: translateY(2px) scale(.97);
		box-shadow: inset 0 2px 6px color-mix(in oklab, var(--sg-bt-ink) 14%, transparent), 0 0 0 1px color-mix(in oklab, var(--sg-bt-ink) 5%, transparent);
	}
}
/* The light under the pointer */
.sg-bt-glow {
	position: absolute; left: 0; top: 0;
	width: 520px; height: 520px; margin: -260px 0 0 -260px; border-radius: 50%;
	background: radial-gradient(closest-side, color-mix(in oklab, var(--background, #fff) 80%, transparent), transparent);
	mix-blend-mode: soft-light;
	opacity: 0; transition: opacity .5s;
	transform: translate(var(--mx, 50vw), var(--my, 0px));
}
.sg-bt[data-pointer] .sg-bt-glow { opacity: 1; }
.dark .sg-bt-tile, .sg-bt[data-tone="dark"] .sg-bt-tile {
	background: linear-gradient(150deg, color-mix(in oklab, var(--sg-bt-ink) 9%, var(--sg-bt-paper)), var(--sg-bt-paper) 70%);
	box-shadow:
		inset 0 1px 0 color-mix(in oklab, var(--sg-bt-ink) 10%, transparent),
		0 0 0 1px color-mix(in oklab, var(--sg-bt-ink) 6%, transparent),
		0 calc(4px + var(--lift) * 10px) calc(12px + var(--lift) * 18px) -6px rgb(0 0 0 / calc(.45 + var(--lift) * .25));
}
.dark .sg-bt-glow, .sg-bt[data-tone="dark"] .sg-bt-glow { background: radial-gradient(closest-side, color-mix(in oklab, var(--sg-bt-ink) 16%, transparent), transparent); mix-blend-mode: screen; }

/* Bento */
.sg-bt-bento {
	position: relative; z-index: 1;
	display: grid; gap: 12px;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	grid-template-rows: repeat(2, clamp(170px, 21svh, 236px));
	grid-template-areas: "integrations portrait highlight folder" "stat portrait orbit orbit";
	width: 100%; max-width: 1080px; margin: clamp(24px, 4.5svh, 56px) 0 auto;
	text-align: left;
}
.sg-bt-card {
	position: relative;
	display: flex; flex-direction: column; justify-content: flex-end;
	min-width: 0; margin: 0; padding: clamp(16px, 1.6vw, 22px);
	border-radius: 16px; overflow: hidden;
	background: var(--sg-bt-card);
	box-shadow: inset 0 0 0 1px var(--sg-bt-edge), 0 1px 2px rgb(0 0 0 / .04), 0 12px 28px -18px rgb(0 0 0 / .22);
	transition: transform .45s var(--sg-bt-ease), box-shadow .45s var(--sg-bt-ease);
}
.sg-bt-card:hover { transform: translateY(-4px); box-shadow: inset 0 0 0 1px var(--sg-bt-edge), 0 2px 4px rgb(0 0 0 / .04), 0 26px 44px -22px rgb(0 0 0 / .32); }
.sg-bt-card h2 { margin: 0; font-size: clamp(18px, 1.7vw, 23px); font-weight: 500; line-height: 1.15; letter-spacing: -0.025em; }
.sg-bt-card p { margin: 6px 0 0; max-width: 30ch; font-size: 12.5px; line-height: 1.4; color: var(--sg-bt-muted); }
.sg-bt-figure { margin: 0 !important; font-size: clamp(40px, 4.4vw, 60px) !important; font-weight: 400; line-height: 1 !important; letter-spacing: -0.05em; font-variant-numeric: tabular-nums; color: inherit !important; }
.dark .sg-bt-card, .sg-bt[data-tone="dark"] .sg-bt-card { --sg-bt-edge: color-mix(in oklab, var(--sg-bt-ink) 8%, transparent); }

/* Integrations: the logos spread and rise in turn */
.sg-bt-card[data-sg-card="integrations"] { grid-area: integrations; justify-content: space-between; }
.sg-bt-apps { display: flex; gap: 10px; margin: 0; padding: 0; list-style: none; }
.sg-bt-app {
	display: grid; place-items: center; width: 40px; height: 40px; border-radius: 10px;
	background: #fff; box-shadow: 0 0 0 1px rgb(0 0 0 / .04), 0 6px 14px -8px rgb(0 0 0 / .3);
	transition: transform .5s var(--sg-bt-ease), box-shadow .5s var(--sg-bt-ease);
	transition-delay: calc(var(--i, 0) * 60ms);
}
.sg-bt-app img { width: 20px; height: 20px; object-fit: contain; }
.sg-bt-card[data-sg-card="integrations"]:hover .sg-bt-app {
	transform: translate(calc(var(--i, 0) * 8px), -6px) rotate(calc((var(--i, 0) - 1) * 5deg));
	box-shadow: 0 0 0 1px rgb(0 0 0 / .04), 0 14px 22px -10px rgb(0 0 0 / .35);
}

.sg-bt-card[data-sg-card="stat"] { grid-area: stat; }

/* Portrait: crosses over the face, a band that scans it, a brighter spot under the pointer */
.sg-bt-card[data-sg-card="portrait"] { grid-area: portrait; padding: 0; background: #1a1a1c; }
.sg-bt-card[data-sg-card="portrait"] > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: grayscale(1) contrast(1.08); transition: transform .8s var(--sg-bt-ease); }
.sg-bt-card[data-sg-card="portrait"]:hover > img { transform: scale(1.04); }
.sg-bt-marks { position: absolute; inset: 0; pointer-events: none; }
:where(.sg-bt-marks > span) {
	position: absolute; inset: 0;
	background: var(--sg-bt-marks);
	-webkit-mask-size: var(--sg-bt-cross, 22px) var(--sg-bt-cross, 22px), 100% 100%;
	mask-size: var(--sg-bt-cross, 22px) var(--sg-bt-cross, 22px), 100% 100%;
	-webkit-mask-repeat: repeat, no-repeat;
	mask-repeat: repeat, no-repeat;
	-webkit-mask-composite: source-in;
	mask-composite: intersect;
}
.sg-bt-marks-face {
	-webkit-mask-image: ${PLUS}, radial-gradient(34% 30% at var(--fx, 50%) var(--fy, 56%), #000 55%, transparent 100%);
	mask-image: ${PLUS}, radial-gradient(34% 30% at var(--fx, 50%) var(--fy, 56%), #000 55%, transparent 100%);
	opacity: .9;
}
.sg-bt-marks-scan {
	-webkit-mask-image: ${PLUS}, linear-gradient(transparent, #000 45%, #000 55%, transparent);
	mask-image: ${PLUS}, linear-gradient(transparent, #000 45%, #000 55%, transparent);
	-webkit-mask-size: var(--sg-bt-cross, 22px) var(--sg-bt-cross, 22px), 100% 22%;
	mask-size: var(--sg-bt-cross, 22px) var(--sg-bt-cross, 22px), 100% 22%;
	-webkit-mask-position: 0 0, 0 -40%;
	mask-position: 0 0, 0 -40%;
	filter: brightness(1.25) drop-shadow(0 0 4px var(--sg-bt-marks));
	animation: sg-bt-scan 5.5s cubic-bezier(.45, 0, .55, 1) infinite;
	transition: opacity .3s;
}
@keyframes sg-bt-scan {
	0% { -webkit-mask-position: 0 0, 0 -40%; mask-position: 0 0, 0 -40%; }
	60%, 100% { -webkit-mask-position: 0 0, 0 140%; mask-position: 0 0, 0 140%; }
}
.sg-bt-marks-spot {
	-webkit-mask-image: ${PLUS}, radial-gradient(circle at var(--px, 50%) var(--py, 50%), #000, transparent 28%);
	mask-image: ${PLUS}, radial-gradient(circle at var(--px, 50%) var(--py, 50%), #000, transparent 28%);
	filter: brightness(1.3) drop-shadow(0 0 5px var(--sg-bt-marks));
	opacity: 0; transition: opacity .3s;
}
.sg-bt-card[data-sg-card="portrait"]:hover .sg-bt-marks-spot { opacity: 1; }
.sg-bt-card[data-sg-card="portrait"]:hover .sg-bt-marks-scan { opacity: 0; }

/* Highlight: the accent card, a bar that fills to the figure */
.sg-bt-card[data-sg-card="highlight"] { grid-area: highlight; color: #101010; background: var(--sg-bt-accent); }
.sg-bt-card[data-sg-card="highlight"] p { color: rgb(16 16 16 / .62); }
.sg-bt-progress {
	position: absolute; left: clamp(16px, 1.6vw, 22px); right: clamp(16px, 1.6vw, 22px); top: clamp(16px, 1.6vw, 22px);
	height: 6px; border-radius: 6px; overflow: hidden; background: rgb(16 16 16 / .1);
}
.sg-bt-progress::after {
	content: ""; position: absolute; inset: 0; border-radius: inherit; background: #101010;
	transform-origin: left; transform: scaleX(var(--sg-bt-progress, 0));
	transition: transform 1.4s var(--sg-bt-ease);
}
.sg-bt-progress[hidden] { display: none; }

/* Folder: a dark card, a world map in dots, a folder that opens */
.sg-bt-card[data-sg-card="folder"] {
	grid-area: folder; align-items: center; justify-content: center;
	color: #fff;
	background: radial-gradient(90% 55% at 50% 115%, color-mix(in oklab, var(--sg-bt-accent) 70%, transparent), transparent 70%), #060607;
}
.dark .sg-bt-card[data-sg-card="folder"], .sg-bt[data-tone="dark"] .sg-bt-card[data-sg-card="folder"] { box-shadow: inset 0 0 0 1px rgb(255 255 255 / .1); }
.sg-bt-map { position: absolute; inset: 14% 4% auto; width: 92%; height: auto; overflow: visible; }
.sg-bt-map circle { fill: #fff; opacity: .42; transform-box: fill-box; transform-origin: center; }
.sg-bt-card[data-sg-card="folder"]:hover .sg-bt-map circle { animation: sg-bt-ping 1.4s ease-out calc(var(--d, 0) * 22ms) both; }
@keyframes sg-bt-ping {
	30% { opacity: 1; fill: var(--sg-bt-accent); transform: scale(1.7); }
	100% { opacity: .42; fill: #fff; transform: none; }
}
.sg-bt-folder {
	position: relative; z-index: 1;
	display: flex; flex-direction: column; align-items: center; gap: 8px;
	font-size: 11px; font-weight: 600; letter-spacing: .02em;
	perspective: 300px;
}
.sg-bt-folder::before, .sg-bt-folder::after { content: ""; display: block; width: 46px; height: 34px; border-radius: 5px; }
/* The back, with its tab */
.sg-bt-folder::before {
	background: linear-gradient(oklch(0.62 0.15 245), oklch(0.56 0.16 250));
	clip-path: polygon(0 0, 40% 0, 48% 16%, 100% 16%, 100% 100%, 0 100%);
	border-radius: 5px 5px 4px 4px;
}
/* The front flap opens toward the viewer */
.sg-bt-folder::after {
	position: absolute; top: 6px; height: 28px;
	background: linear-gradient(oklch(0.8 0.12 235), oklch(0.7 0.14 242));
	box-shadow: 0 -1px 0 rgb(255 255 255 / .35) inset;
	transform-origin: bottom; transition: transform .5s var(--sg-bt-ease);
}
.sg-bt-card[data-sg-card="folder"]:hover .sg-bt-folder::after { transform: rotateX(-32deg); }

/* Orbit: a soft gradient, rings, avatars that travel along them */
.sg-bt-card[data-sg-card="orbit"] {
	grid-area: orbit; justify-content: center;
	color: #101010;
	background: linear-gradient(105deg, var(--sg-bt-g1), var(--sg-bt-g2) 50%, var(--sg-bt-g3));
}
.sg-bt-card[data-sg-card="orbit"] h2 { position: relative; z-index: 1; max-width: 11ch; font-size: clamp(20px, 2vw, 27px); }
.sg-bt-orbits {
	--h: 220px;
	position: absolute; right: 24%; top: 100%; width: 0; height: 0;
	margin: 0; padding: 0; list-style: none;
}
/* The rings: three circles around the same centre */
.sg-bt-orbits::before {
	content: ""; position: absolute;
	width: calc(var(--h) * 2.6); height: calc(var(--h) * 2.6); margin: calc(var(--h) * -1.3);
	border-radius: 50%;
	background:
		radial-gradient(circle, transparent calc(var(--h) * .55 - 1px), rgb(255 255 255 / .85) calc(var(--h) * .55), transparent calc(var(--h) * .55 + 1px)),
		radial-gradient(circle, transparent calc(var(--h) * .9 - 1px), rgb(255 255 255 / .75) calc(var(--h) * .9), transparent calc(var(--h) * .9 + 1px)),
		radial-gradient(circle, transparent calc(var(--h) * 1.25 - 1px), rgb(255 255 255 / .6) calc(var(--h) * 1.25), transparent calc(var(--h) * 1.25 + 1px));
}
.sg-bt-person {
	--r: calc(var(--h) * (.55 + var(--ring, 0) * .35));
	position: absolute; left: -20px; top: -20px; width: 40px; height: 40px;
	animation: sg-bt-orbit 7s ease-in-out calc(var(--ring, 0) * -1.3s) infinite alternate paused;
	transform: rotate(var(--a, -110deg)) translateX(var(--r)) rotate(calc(var(--a, -110deg) * -1));
}
.sg-bt-person img {
	display: block; width: 100%; height: 100%; border-radius: 50%; object-fit: cover;
	box-shadow: 0 0 0 2px #fff, 0 8px 16px -6px rgb(0 0 0 / .35);
}
@keyframes sg-bt-orbit {
	to { transform: rotate(calc(var(--a, -110deg) + var(--swing, 16deg))) translateX(var(--r)) rotate(calc((var(--a, -110deg) + var(--swing, 16deg)) * -1)); }
}
.sg-bt-card[data-sg-card="orbit"]:hover .sg-bt-person { animation-play-state: running; }

/* Entrance: tiles in a wave from the top centre, then the copy word by word, then the cards */
.sg-bt[data-intro] .sg-bt-tile { animation: sg-bt-tile-in .9s var(--sg-bt-ease) calc(var(--d, 0) * 1ms) both; }
.sg-bt[data-intro] .sg-bt-nav { animation: sg-bt-fade .8s var(--sg-bt-ease) .1s both; }
.sg-bt[data-intro] .sg-bt-word { animation: sg-bt-rise .9s var(--sg-bt-ease) calc(250ms + var(--i, 0) * 55ms) both; }
.sg-bt[data-intro] .sg-bt-sub { animation: sg-bt-rise .9s var(--sg-bt-ease) .7s both; }
.sg-bt[data-intro] .sg-bt-copy .sg-bt-btn { animation: sg-bt-rise .9s var(--sg-bt-ease) .82s both; }
.sg-bt[data-intro] .sg-bt-card { animation: sg-bt-card-in 1s var(--sg-bt-ease) calc(950ms + var(--i, 0) * 90ms) both; }
.sg-bt[data-intro] .sg-bt-person { animation: sg-bt-pop .7s var(--sg-bt-ease) calc(1500ms + var(--i, 0) * 110ms) both; }
.sg-bt[data-intro] .sg-bt-app { animation: sg-bt-pop .6s var(--sg-bt-ease) calc(1150ms + var(--i, 0) * 80ms) both; }
.sg-bt[data-intro="pending"] * { animation-play-state: paused !important; }
@keyframes sg-bt-tile-in { from { opacity: 0; transform: translateY(14px) scale(.9); } }
@keyframes sg-bt-fade { from { opacity: 0; transform: translateY(-8px); } }
@keyframes sg-bt-rise { from { opacity: 0; transform: translateY(.45em); filter: blur(6px); } }
@keyframes sg-bt-card-in { from { opacity: 0; transform: translateY(28px) scale(.96); } }
@keyframes sg-bt-pop { from { opacity: 0; scale: .4; } }

/* Tablets: two columns, the portrait on the left */
@media (max-width: 900px) {
	.sg-bt-bento {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		grid-template-rows: repeat(4, minmax(170px, auto));
		grid-template-areas: "portrait integrations" "portrait stat" "highlight folder" "orbit orbit";
	}
}
/* Phones: the figures first, the portrait wide, the bar's links hidden */
@media (max-width: 560px) {
	.sg-bt-nav { grid-template-columns: 1fr auto; }
	.sg-bt-links { display: none; }
	.sg-bt-bento {
		gap: 10px;
		grid-template-rows: 170px 190px 320px 190px;
		grid-template-areas: "highlight folder" "integrations stat" "portrait portrait" "orbit orbit";
	}
	.sg-bt-figure { font-size: 36px !important; }
	.sg-bt-card { padding: 14px; }
	.sg-bt-apps { gap: 6px; }
	.sg-bt-app { width: 34px; height: 34px; }
	.sg-bt-card[data-sg-card="orbit"] h2 { max-width: 9ch; font-size: 20px; }
	.sg-bt-orbits { right: 26%; }
	.sg-bt-person:nth-child(n + 4) { display: none; }
}

/* Reduced motion, ?motion=off and ?motion=final: no movement at all */
.sg-bt[data-motion]:not([data-motion="ready"]) *, .sg-bt[data-motion]:not([data-motion="ready"]) *::before, .sg-bt[data-motion]:not([data-motion="ready"]) *::after { transition: none !important; animation: none !important; }
.sg-bt[data-motion]:not([data-motion="ready"]) .sg-bt-marks-scan { display: none; }

/* With scripts on, the hero waits out of sight for the engine; if it never comes, it appears */
@media (scripting: enabled) {
	.sg-bt:not([data-ready]) > * { opacity: 0; animation: sg-bt-reveal .4s 2.5s forwards; }
}
@keyframes sg-bt-reveal { to { opacity: 1; } }
`;
