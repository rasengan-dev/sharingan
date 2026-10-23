/**
 * The gamepad's stylesheet, added once per document (React renders it as a
 * hoisted <style>, the Web Component through `adoptStyles`). Classes are
 * prefixed `sg-gp-` instead of living in a shadow root, so the sections stay
 * in the page's DOM. The controller is drawn in `em`: one font size on the
 * pad scales all of it to its container.
 */
export const GAMEPAD_STYLE_ID = "sg-gamepad";

export const gamepadStyles = /* css */ `
.sg-gp {
	--sg-gp-ink: var(--foreground, #151517);
	--sg-gp-muted: var(--muted-foreground, #66666c);
	--sg-gp-line: color-mix(in oklab, var(--sg-gp-ink) 14%, transparent);
	--sg-gp-chip: color-mix(in oklab, var(--sg-gp-ink) 6%, var(--background, #ececea));
	--sg-gp-display: var(--font-display, inherit);
	--sg-gp-mono: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
	position: relative;
	isolation: isolate;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: clamp(88px, 12vw, 128px) 16px clamp(40px, 6vw, 72px);
	color: var(--sg-gp-ink);
	background-color: var(--background, #ececea);
	background-image: radial-gradient(color-mix(in oklab, var(--sg-gp-ink) 13%, transparent) 1px, transparent 1.2px);
	background-size: 18px 18px;
}
.sg-gp button { font: inherit; color: inherit; }
.sg-gp :focus-visible { outline: 2px solid var(--sg-gp-ink); outline-offset: 3px; }

/* Shells: the controller's plastic */
.sg-gp {
	--shell: #f6f6f3; --shell-mid: #ecece8; --shade: #d4d4cf; --edge: #bdbdb7; --hi: rgb(255 255 255 / .9);
	--dwell-a: #e2e2de; --dwell-b: #d0d0cb; --mark: #8d8d92; --mark-sub: #a3a3a8; --mark-shadow: #fff;
	--label: #7a7a80; --letter: #9a9aa0; --well: #3b3b40; --well-deep: #2a2a2e; --trough: #55555b; --rim: #fff;
}
.sg-gp[data-shell="graphite"] {
	--shell: #3d3d43; --shell-mid: #323237; --shade: #242428; --edge: #121214; --hi: rgb(255 255 255 / .16);
	--dwell-a: #2c2c31; --dwell-b: #202024; --mark: #74747c; --mark-sub: #5f5f66; --mark-shadow: rgb(0 0 0 / .6);
	--label: #8c8c94; --letter: #76767e; --well: #1e1e22; --well-deep: #121215; --trough: #36363c; --rim: rgb(255 255 255 / .08);
}

/* Screen: the sections, one at a time */
.sg-gp-screen { display: grid; place-items: center; text-align: center; width: 100%; max-width: 760px; min-height: 230px; }
.sg-gp [data-sg-slide] { grid-area: 1 / 1; display: flex; flex-direction: column; align-items: center; gap: 14px; }
.sg-gp[data-ready] [data-sg-slide]:not(.is-current) { display: none; }
@media (scripting: enabled) {
	.sg-gp:not([data-ready]) [data-sg-slide]:not([data-sg-slide="home"]) { display: none; }
}
.sg-gp[data-ready] [data-sg-slide].is-current { animation: sg-gp-in .32s cubic-bezier(.2,.9,.3,1.2); }
@keyframes sg-gp-in { from { opacity: 0; transform: translateY(10px) scale(.98); } }
.sg-gp [data-sg-slide] h1, .sg-gp [data-sg-slide] h2 { margin: 0; font-family: var(--sg-gp-display); font-weight: 600; letter-spacing: -0.045em; line-height: .98; text-wrap: balance; }
.sg-gp [data-sg-slide] h1 { font-size: clamp(38px, 6.4vw, 72px); max-width: 13ch; }
.sg-gp [data-sg-slide] h2 { font-size: clamp(28px, 4.2vw, 48px); max-width: 16ch; }
.sg-gp [data-sg-slide] p { margin: 0; max-width: 52ch; line-height: 1.5; color: var(--sg-gp-muted); text-wrap: pretty; }
.sg-gp [data-sg-slide] ul { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin: 0; padding: 0; list-style: none; }
.sg-gp [data-sg-slide] li { padding: 6px 12px; border-radius: 999px; background: var(--sg-gp-chip); box-shadow: 0 1px 0 var(--sg-gp-line); font-size: 13px; }
.sg-gp [data-sg-slide] blockquote { margin: 0; font-family: var(--sg-gp-display); font-size: clamp(20px, 2.6vw, 28px); letter-spacing: -0.02em; line-height: 1.2; max-width: 30ch; text-wrap: balance; }
.sg-gp [data-sg-slide] cite { font-style: normal; font-size: 13px; color: var(--sg-gp-muted); }
.sg-gp-eyebrow { font-family: var(--sg-gp-mono); font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: var(--sg-gp-muted); }
.sg-gp-tag { display: inline-flex; align-items: center; gap: 8px; font-family: var(--sg-gp-mono); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--sg-gp-muted); }
.sg-gp-tag::before { content: ""; width: 9px; height: 9px; border-radius: 2px; background: var(--c, currentColor); }
.sg-gp-ctas { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 6px; }
.sg-gp-cta {
	display: inline-flex; align-items: center; height: 42px; padding: 0 20px; border-radius: 999px; text-decoration: none;
	font-size: 14px; font-weight: 600; color: var(--primary-foreground, #fff); background: var(--primary, var(--sg-gp-ink));
	box-shadow: 0 2px 0 color-mix(in oklab, var(--primary, var(--sg-gp-ink)), #000 35%);
}
.sg-gp-cta[data-variant="secondary"] { color: var(--sg-gp-ink); background: var(--sg-gp-chip); box-shadow: 0 2px 0 var(--sg-gp-line); }
.sg-gp-cta:active { transform: translateY(2px); box-shadow: none; }

/* Stage and controller */
.sg-gp-stage { width: 100%; max-width: 640px; margin-top: clamp(20px, 3vw, 32px); display: flex; justify-content: center; perspective: 1100px; container-type: inline-size; min-height: 120px; }
.sg-gp-pad {
	--rx: 0deg; --ry: 0deg; --gx: 40%; --gy: 20%;
	font-size: clamp(6px, calc((100cqw - 8px) / 41), 15px);
	position: relative; width: 40em; height: 16em; border-radius: 8em;
	/* Flat tilt on purpose: preserve-3d would sort the rotated troughs by depth and let them steal clicks from the buttons. */
	transform: rotateX(var(--rx)) rotateY(var(--ry));
	transition: transform .5s cubic-bezier(.2,.8,.2,1);
	background:
		radial-gradient(60% 70% at var(--gx) var(--gy), var(--hi), transparent 60%),
		linear-gradient(180deg, var(--shell) 0%, var(--shell-mid) 55%, var(--shade) 100%);
	box-shadow:
		inset 0 .15em .2em var(--rim),
		inset 0 -.5em 1em rgb(0 0 0 / .08),
		0 .35em 0 var(--edge),
		0 1.4em 2.4em -1em rgb(0 0 0 / .35),
		0 3em 4em -2.5em rgb(0 0 0 / .25);
}
.sg-gp-pad.is-tracking { transition: transform .08s linear; }
.sg-gp-wordmark { position: absolute; left: 50%; top: 2.1em; transform: translateX(-50%); text-align: center; pointer-events: none; white-space: nowrap; }
.sg-gp-wordmark b { display: block; font-family: var(--sg-gp-display); font-style: italic; font-weight: 800; font-size: 1.55em; letter-spacing: -0.04em; color: var(--mark); text-shadow: 0 .06em 0 var(--mark-shadow); }
.sg-gp-wordmark small { display: block; font-family: var(--sg-gp-mono); font-size: .45em; letter-spacing: .3em; color: var(--mark-sub); margin-top: .2em; }

.sg-gp-dwell {
	position: absolute; left: 2.6em; top: 2.5em; width: 11em; height: 11em; border-radius: 50%; display: grid; place-items: center;
	background: radial-gradient(circle at 50% 40%, var(--dwell-a), var(--dwell-b) 70%);
	box-shadow: inset 0 .35em .7em rgb(0 0 0 / .14), 0 .1em 0 var(--rim);
}
.sg-gp-dpad { position: relative; width: 8.4em; height: 8.4em; transition: transform .1s; }
.sg-gp-dpad::before, .sg-gp-dpad::after {
	content: ""; position: absolute; border-radius: .55em; background: linear-gradient(180deg, #3a3a3f, #2b2b2f);
	box-shadow: inset 0 .12em 0 rgb(255 255 255 / .12), 0 .35em 0 #17171a, 0 .6em .8em -.3em rgb(0 0 0 / .5);
}
.sg-gp-dpad::before { left: 2.85em; top: 0; width: 2.7em; height: 8.4em; }
.sg-gp-dpad::after { left: 0; top: 2.85em; width: 8.4em; height: 2.7em; }
.sg-gp-dpad button {
	position: absolute; z-index: 2; width: 2.7em; height: 2.85em; padding: 0; border: 0; border-radius: .4em;
	background: transparent; cursor: pointer; display: grid; place-items: center; color: #77777d;
}
.sg-gp-dpad button:disabled { cursor: default; opacity: .45; }
.sg-gp-dpad svg { width: 1em; height: 1em; transition: transform .1s; }
.sg-gp-dpad [data-dir="up"] { left: 2.85em; top: 0; }
.sg-gp-dpad [data-dir="down"] { left: 2.85em; bottom: 0; }
.sg-gp-dpad [data-dir="left"] { left: 0; top: 2.85em; width: 2.85em; height: 2.7em; }
.sg-gp-dpad [data-dir="right"] { right: 0; top: 2.85em; width: 2.85em; height: 2.7em; }
.sg-gp-hub { position: absolute; z-index: 1; left: 3.45em; top: 3.45em; width: 1.5em; height: 1.5em; border-radius: 50%; background: radial-gradient(circle at 50% 35%, #2c2c30, #1d1d20); }
.sg-gp-dpad.tilt-up { transform: rotateX(10deg); }
.sg-gp-dpad.tilt-down { transform: rotateX(-10deg); }
.sg-gp-dpad.tilt-left { transform: rotateY(-10deg); }
.sg-gp-dpad.tilt-right { transform: rotateY(10deg); }
.sg-gp-dpad button.is-down svg { transform: scale(.8); color: #fff; }

.sg-gp-mids { position: absolute; left: 50%; top: 7.4em; transform: translateX(-50%); display: flex; gap: 1.6em; }
.sg-gp-mid { display: flex; flex-direction: column; align-items: center; gap: .55em; padding: 0; border: 0; background: none; cursor: pointer; }
.sg-gp-bar {
	position: relative; width: 3.6em; height: 1.15em; border-radius: 1em; transform: rotate(-28deg);
	background: linear-gradient(180deg, #45454b, #232326);
	box-shadow: inset 0 .1em 0 rgb(255 255 255 / .15), 0 .28em 0 #151517, 0 .5em .6em -.2em rgb(0 0 0 / .45);
	transition: transform .08s, box-shadow .08s;
}
.sg-gp-bar::after { content: ""; position: absolute; right: -.9em; top: -.3em; width: .45em; height: .45em; border-radius: 50%; transform: rotate(28deg); }
.sg-gp-mid.is-on .sg-gp-bar::after { background: #3de07a; box-shadow: 0 0 .5em #3de07a; }
.sg-gp-mid span:last-child { font-size: .78em; font-weight: 500; color: var(--label); }
.sg-gp-mid.is-down .sg-gp-bar { transform: rotate(-28deg) translateY(.22em); box-shadow: inset 0 .1em 0 rgb(255 255 255 / .1), 0 .06em 0 #151517; }

.sg-gp-fwell {
	position: absolute; right: 1.5em; top: 1.5em; width: 13em; height: 13em; border-radius: 50%;
	background: radial-gradient(circle at 50% 35%, var(--well), var(--well-deep) 75%);
	box-shadow: inset 0 .4em .9em rgb(0 0 0 / .45), 0 .12em 0 var(--rim), 0 -.06em 0 rgb(0 0 0 / .1);
}
.sg-gp-trough { position: absolute; width: 10.6em; height: 4.7em; border-radius: 2.4em; pointer-events: none; background: var(--trough); box-shadow: inset 0 .25em .5em rgb(0 0 0 / .45); transform: rotate(-38deg); }
.sg-gp-trough.t1 { top: 2.6em; left: 1.6em; }
.sg-gp-trough.t2 { top: 5.6em; left: .8em; }
.sg-gp-face {
	position: absolute; width: 3.5em; height: 3.5em; padding: 0; border: 0; border-radius: 50%; cursor: pointer;
	background: radial-gradient(circle at 35% 28%, color-mix(in oklab, var(--c), #fff 45%) 0 12%, var(--c) 45%, color-mix(in oklab, var(--c), #000 30%) 100%);
	box-shadow: inset 0 -.25em .35em rgb(0 0 0 / .25), 0 .32em 0 color-mix(in oklab, var(--c), #000 55%), 0 .55em .6em -.2em rgb(0 0 0 / .6);
	transition: transform .08s, box-shadow .08s, filter .2s;
}
.sg-gp-face:disabled { cursor: default; filter: grayscale(.8) brightness(.8); }
.sg-gp-face.is-down { transform: translateY(.26em); box-shadow: inset 0 -.15em .3em rgb(0 0 0 / .3), 0 .06em 0 color-mix(in oklab, var(--c), #000 55%), 0 .2em .3em -.2em rgb(0 0 0 / .5); }
.sg-gp-face.is-current { filter: brightness(1.12) saturate(1.1); }
.sg-gp-face.is-current::after { content: ""; position: absolute; inset: -.45em; border-radius: 50%; border: .14em solid color-mix(in oklab, var(--c), #fff 30%); }
.sg-gp-face[data-key="x"] { left: 4.75em; top: 1.15em; }
.sg-gp-face[data-key="a"] { left: 8.35em; top: 4.75em; }
.sg-gp-face[data-key="b"] { left: 4.75em; top: 8.35em; }
.sg-gp-face[data-key="y"] { left: 1.15em; top: 4.75em; }
.sg-gp-letter { position: absolute; font-family: var(--sg-gp-display); font-weight: 600; font-size: 1.05em; color: var(--letter); pointer-events: none; }
.sg-gp-letter.l-x { right: 6.2em; top: .9em; }
.sg-gp-letter.l-a { right: 1.15em; top: 5.6em; }
.sg-gp-letter.l-b { right: 8.3em; top: 12.9em; }
.sg-gp-letter.l-y { right: 13.7em; top: 9.6em; }

/* The section colours, on buttons, legend and tags */
.sg-gp [data-key="y"], .sg-gp [data-sg-key="y"] { --c: var(--sg-gp-y); }
.sg-gp [data-key="x"], .sg-gp [data-sg-key="x"] { --c: var(--sg-gp-x); }
.sg-gp [data-key="b"], .sg-gp [data-sg-key="b"] { --c: var(--sg-gp-b); }
.sg-gp [data-key="a"], .sg-gp [data-sg-key="a"] { --c: var(--sg-gp-a); }

/* Easter egg: the translucent shell */
.sg-gp-pad.is-translucent {
	--mark: rgb(255 255 255 / .75); --mark-sub: rgb(255 255 255 / .55); --mark-shadow: transparent; --label: rgb(255 255 255 / .8);
	--letter: rgb(255 255 255 / .6); --dwell-a: rgb(255 255 255 / .2); --dwell-b: rgb(60 30 160 / .25);
	background:
		radial-gradient(60% 70% at var(--gx) var(--gy), rgb(255 255 255 / .55), transparent 60%),
		repeating-linear-gradient(90deg, rgb(255 255 255 / .06) 0 .12em, transparent .12em 1.4em),
		linear-gradient(180deg, rgb(150 120 235 / .72), rgb(96 66 200 / .82));
	box-shadow: inset 0 .15em .2em rgb(255 255 255 / .6), 0 .35em 0 #4b2fa8, 0 1.4em 2.4em -1em rgb(60 30 160 / .5);
}

/* Legend: the same sections as plain buttons */
.sg-gp-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 22px; margin-top: clamp(24px, 4vw, 40px); min-height: 34px; }
.sg-gp-legend button { display: inline-flex; align-items: center; gap: 8px; padding: 6px 4px; border: 0; border-bottom: 1.5px solid transparent; background: none; cursor: pointer; font-size: 14px; }
.sg-gp-legend button::before { content: ""; width: 8px; height: 8px; border-radius: 2px; background: var(--c); }
.sg-gp-legend button[aria-pressed="true"] { border-bottom-color: var(--c); }
.sg-gp kbd { font-family: var(--sg-gp-mono); font-size: 10px; color: var(--sg-gp-muted); border: 1px solid var(--sg-gp-line); border-radius: 4px; padding: 1px 5px; background: var(--sg-gp-chip); }
.sg-gp-hint { margin: 14px auto 0; max-width: 64ch; text-align: center; font-family: var(--sg-gp-mono); font-size: 11px; line-height: 1.7; color: var(--sg-gp-muted); }
/* On touch screens the controller's buttons get small: the legend is the comfortable target, and keys mean nothing. */
@media (pointer: coarse) {
	.sg-gp-legend button { min-height: 44px; padding-inline: 8px; }
	.sg-gp-legend kbd, .sg-gp-hint { display: none; }
}

/* Collaborator cursors */
.sg-gp-cursor { position: absolute; left: 0; top: 0; z-index: 5; pointer-events: none; transition: transform 1.1s cubic-bezier(.3,.7,.2,1); }
.sg-gp-bob { display: flex; align-items: flex-start; gap: 2px; animation: sg-gp-bob 3.6s ease-in-out infinite; }
.sg-gp-cursor:nth-of-type(2n) .sg-gp-bob { animation-duration: 4.4s; animation-delay: -1.2s; flex-direction: row-reverse; }
.sg-gp-cursor:nth-of-type(2n) svg { transform: scaleX(-1); }
.sg-gp-cursor svg { width: 18px; height: 18px; filter: drop-shadow(0 2px 2px rgb(0 0 0 / .2)); }
.sg-gp-cursor span { margin-top: 14px; padding: 4px 9px; border-radius: 999px; color: #fff; font-size: 12px; font-weight: 600; white-space: nowrap; background: var(--who); box-shadow: 0 6px 12px -6px var(--who); }
@keyframes sg-gp-bob { 50% { transform: translate(6px, -8px); } }
@container (max-width: 520px) { .sg-gp-cursor { display: none; } }
@media (max-width: 640px) { .sg-gp-cursor { display: none; } }

/* Toast and confetti */
.sg-gp-toast {
	position: absolute; left: 50%; bottom: 16px; z-index: 20; max-width: calc(100% - 32px); padding: 10px 16px; border-radius: 999px;
	background: var(--sg-gp-ink); color: var(--background, #f4f4f1); font-size: 13px;
	transform: translate(-50%, 20px); opacity: 0; pointer-events: none; transition: opacity .25s, transform .25s;
}
.sg-gp-toast.show { opacity: 1; transform: translate(-50%, 0); }
.sg-gp-confetti { position: absolute; z-index: 6; width: 8px; height: 8px; border-radius: 2px; pointer-events: none; animation: sg-gp-fall 1.4s cubic-bezier(.2,.6,.4,1) forwards; }
@keyframes sg-gp-fall { to { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); opacity: 0; } }

/* Reduced motion, ?motion=off and ?motion=final: no movement at all */
.sg-gp:not([data-motion="ready"]) *, .sg-gp:not([data-motion="ready"]) *::before, .sg-gp:not([data-motion="ready"]) *::after { transition: none !important; animation: none !important; }
`;
