/**
 * The sky launch's stylesheet, added once per document. The clouds are three
 * layers cut by SVG masks (drawn here once, from a seeded random), so they
 * take any CSS colour and follow the theme. The rocket's climb and the
 * headline's words are CSS animations, started by the engine
 * (`data-intro="play"`); without it, or with reduced motion, everything is
 * in its final place. On the way out the engine only writes `--exit` (0 to 1)
 * on the layers it moves.
 */
export const SKY_LAUNCH_STYLE_ID = "sg-sky-launch";

/** A cloud bank: a flat base and a row of round tops, as an SVG data URL for a mask. */
function cloudBank(seed: number, base: number, smallest: number, largest: number) {
	let state = seed;
	const random = () => {
		state = (state * 1664525 + 1013904223) >>> 0;
		return state / 2 ** 32;
	};
	const circles: string[] = [];
	for (let x = -60; x < 1660; ) {
		const r = smallest + random() * (largest - smallest);
		circles.push(`<circle cx='${Math.round(x + r * 0.6)}' cy='${Math.round(base + r * 0.3 - random() * 30)}' r='${Math.round(r)}'/>`);
		x += r * (0.9 + random() * 0.5);
	}
	const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 400' preserveAspectRatio='none'><rect y='${base}' width='1600' height='${400 - base}'/>${circles.join("")}</svg>`;
	return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const BACK = cloudBank(7, 230, 90, 180);
const MIDDLE = cloudBank(23, 250, 70, 150);
const FRONT = cloudBank(41, 270, 60, 125);

export const skyLaunchStyles = /* css */ `
.sg-sl {
	--sg-sl-ink: var(--foreground, #111114);
	--sg-sl-muted: var(--muted-foreground, #66666c);
	--sg-sl-bg: var(--background, #fbfaf8);
	--sg-sl-sun: #f3a39b;
	--sg-sl-sky: #dfe9da;
	--sg-sl-clouds: #f6cdc6;
	--sg-sl-air: color-mix(in oklab, var(--sg-sl-sky) 70%, var(--sg-sl-bg));
	--sg-sl-back: color-mix(in oklab, var(--sg-sl-sky) 95%, var(--sg-sl-ink));
	--sg-sl-middle: var(--sg-sl-clouds);
	--sg-sl-front: var(--sg-sl-bg);
	--sg-sl-trail: rgb(255 255 255 / .95);
	--sg-sl-climb: 21svh;
	--sg-sl-launch: 2.6s;
	position: relative; isolation: isolate; overflow: hidden;
	display: flex; flex-direction: column; align-items: center;
	min-height: max(640px, 100svh); box-sizing: border-box;
	padding: calc(var(--header-height, 64px) + clamp(40px, 8svh, 96px)) 24px 0;
	text-align: center;
	color: var(--sg-sl-ink);
	background: linear-gradient(to bottom, var(--sg-sl-air), var(--sg-sl-bg) 85%);
}
.dark .sg-sl, .sg-sl[data-tone="dark"] {
	--sg-sl-air: color-mix(in oklab, var(--sg-sl-sky) 16%, var(--sg-sl-bg));
	--sg-sl-back: color-mix(in oklab, var(--sg-sl-sky) 22%, var(--sg-sl-bg));
	--sg-sl-middle: color-mix(in oklab, var(--sg-sl-clouds) 34%, var(--sg-sl-bg));
	--sg-sl-trail: rgb(255 255 255 / .8);
}
.sg-sl :focus-visible { outline: 2px solid var(--sg-sl-ink); outline-offset: 3px; }

/* The copy, above the sky */
.sg-sl-copy {
	position: relative; z-index: 5;
	display: flex; flex-direction: column; align-items: center; gap: 18px;
	max-width: 860px;
	opacity: calc(1 - var(--exit, 0) * 1.6);
	transform: translateY(calc(var(--exit, 0) * -10svh));
}
.sg-sl-eyebrow { margin: 0; font-size: 13px; color: var(--sg-sl-muted); }
.sg-sl h1 { margin: 0; font-size: clamp(36px, 5.4vw, 76px); line-height: 1.04; font-weight: 400; letter-spacing: -0.035em; text-wrap: balance; }
.sg-sl-word { display: inline-block; }
.sg-sl-sub { margin: 0; max-width: 46ch; font-size: clamp(15px, 1.25vw, 17px); line-height: 1.55; color: var(--sg-sl-muted); }
.sg-sl-ctas { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 6px; }
.sg-sl-cta {
	display: inline-flex; align-items: center; height: 44px; padding: 0 20px; border-radius: 999px;
	font-size: 15px; font-weight: 500; text-decoration: none;
	color: var(--sg-sl-bg); background: var(--sg-sl-ink);
	transition: transform .15s;
}
.sg-sl-cta[data-variant="secondary"] { color: var(--sg-sl-ink); background: color-mix(in oklab, var(--sg-sl-bg) 70%, transparent); box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--sg-sl-ink) 12%, transparent); backdrop-filter: blur(6px); }
.sg-sl-cta:hover { transform: translateY(-2px); }

/* The sky: sun, clouds, rocket */
.sg-sl-sky { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.sg-sl-sun {
	position: absolute; left: 50%; bottom: 8%;
	width: min(56vw, 64svh, 660px); aspect-ratio: 1; margin-left: calc(min(56vw, 64svh, 660px) / -2);
	border-radius: 50%;
	background: radial-gradient(circle at 50% 30%, color-mix(in oklab, var(--sg-sl-sun) 45%, white), var(--sg-sl-sun) 72%);
	box-shadow: 0 0 120px 20px color-mix(in oklab, var(--sg-sl-sun) 30%, transparent);
}
/* At night the sun is a dusk sun: lit at the horizon, dark under the copy, so light text reads over it. */
.dark .sg-sl-sun, .sg-sl[data-tone="dark"] .sg-sl-sun {
	background: radial-gradient(circle at 50% 90%, color-mix(in oklab, var(--sg-sl-sun) 78%, var(--sg-sl-bg)), color-mix(in oklab, var(--sg-sl-sun) 30%, var(--sg-sl-bg)) 78%);
	box-shadow: 0 0 120px 10px color-mix(in oklab, var(--sg-sl-sun) 14%, transparent);
}
.dark .sg-sl-sub, .sg-sl[data-tone="dark"] .sg-sl-sub { color: color-mix(in oklab, var(--sg-sl-ink) 82%, var(--sg-sl-bg)); }
/* Each bank: the cloud tops (--h tall), then solid colour far below, revealed as it rises. */
.sg-sl-cloud {
	--h: 34svh;
	position: absolute; left: -4%; right: -4%; bottom: -70svh;
	height: calc(var(--h) + 70svh);
	background: var(--c);
	-webkit-mask: var(--m) top / 100% var(--h) no-repeat, linear-gradient(#000, #000) bottom / 100% calc(70svh + 2px) no-repeat;
	mask: var(--m) top / 100% var(--h) no-repeat, linear-gradient(#000, #000) bottom / 100% calc(70svh + 2px) no-repeat;
	transform: translateY(calc(var(--exit, 0) * var(--rise) * -1));
}
.sg-sl-cloud[data-layer="back"] { --h: 46svh; --c: var(--sg-sl-back); --m: ${BACK}; --rise: 8svh; }
.sg-sl-cloud[data-layer="middle"] { --h: 36svh; --c: linear-gradient(to bottom, color-mix(in oklab, var(--sg-sl-middle) 70%, var(--sg-sl-bg)), var(--sg-sl-middle) 40%); --m: ${MIDDLE}; --rise: 22svh; z-index: 2; }
.sg-sl-cloud[data-layer="front"] { --h: 26svh; --c: var(--sg-sl-front); --m: ${FRONT}; --rise: 48svh; z-index: 3; }

.sg-sl-ship {
	position: absolute; left: 50%; bottom: 16%; z-index: 1;
	width: 34px; margin-left: -17px;
	transform: translateY(calc(-1 * var(--sg-sl-climb)));
}
.sg-sl[data-rocket-off] .sg-sl-ship { display: none; }
.sg-sl-rocket { position: relative; z-index: 1; display: block; width: 34px; height: 68px; filter: drop-shadow(0 6px 10px rgb(0 0 0 / .12)); }
.sg-sl-trail {
	position: absolute; top: 56px; left: 50%;
	width: 120px; height: 90svh; margin-left: -60px;
	clip-path: polygon(45% 0, 55% 0, 100% 100%, 0 100%);
	background: linear-gradient(to bottom, var(--sg-sl-trail), color-mix(in oklab, var(--sg-sl-trail) 70%, transparent) 50%, transparent);
}
.sg-sl-flame { transform-origin: 50% 0; }
.sg-sl-veil { position: absolute; left: 0; right: 0; bottom: 0; z-index: 4; height: 8svh; background: linear-gradient(to bottom, transparent, var(--sg-sl-bg)); }

/* The intro: the words, then the rest, while the rocket climbs */
.sg-sl[data-intro="play"] .sg-sl-eyebrow { animation: sg-sl-after .6s cubic-bezier(.2, .8, .2, 1) both; }
.sg-sl[data-intro="play"] .sg-sl-word { animation: sg-sl-word .9s cubic-bezier(.2, .7, .2, 1) calc(.15s + var(--i, 0) * 70ms) both; }
.sg-sl[data-intro="play"] .sg-sl-after { animation: sg-sl-after .8s cubic-bezier(.2, .8, .2, 1) .9s both; }
.sg-sl[data-intro="play"] .sg-sl-ship { animation: sg-sl-launch var(--sg-sl-launch) cubic-bezier(.5, 0, .25, 1) .4s both; }
.sg-sl[data-motion="ready"] .sg-sl-rocket { animation: sg-sl-bob 3.6s ease-in-out infinite; }
.sg-sl[data-motion="ready"] .sg-sl-flame { animation: sg-sl-flicker .18s ease-in-out infinite alternate; }
.sg-sl[data-paused] .sg-sl-rocket, .sg-sl[data-paused] .sg-sl-flame { animation-play-state: paused; }
@keyframes sg-sl-word { from { opacity: 0; transform: translateY(.3em); color: var(--sg-sl-muted); } }
@keyframes sg-sl-after { from { opacity: 0; transform: translateY(12px); } }
@keyframes sg-sl-launch { from { transform: translateY(0); } }
@keyframes sg-sl-bob { 50% { transform: translateY(-6px) rotate(1.5deg); } }
@keyframes sg-sl-flicker { to { transform: scaleY(.7); } }

/* Until the engine runs, the copy and the rocket wait where the intro starts them: the copy
   hidden, the rocket in the clouds. If the engine is late (a slow load) or never runs, they
   come in on their own after a moment, and the engine lets that finish instead of replaying it.
   The engine reads this 2s delay as REVEAL_DELAY: change both together. */
@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
	.sg-sl:not([data-ready]) .sg-sl-copy > * { opacity: 0; animation: sg-sl-reveal .6s ease-out 2s forwards; }
	.sg-sl:not([data-ready]) .sg-sl-ship { transform: none; animation: sg-sl-climb var(--sg-sl-launch) cubic-bezier(.5, 0, .25, 1) 2s forwards; }
}
@keyframes sg-sl-reveal { to { opacity: 1; } }
@keyframes sg-sl-climb { to { transform: translateY(calc(-1 * var(--sg-sl-climb))); } }

@media (max-width: 767.98px) {
	.sg-sl { --sg-sl-climb: 16svh; }
	.sg-sl-sun { bottom: 14%; width: 86vw; margin-left: -43vw; }
}
`;
