/**
 * The holo card's stylesheet, added once per document (React renders it as
 * a hoisted <style>, the Web Component through `adoptStyles`). The engine
 * only writes a few custom properties on the card; everything you see is
 * computed here from them:
 * - `--rx`, `--ry`: the tilt, in degrees;
 * - `--px`, `--py`: where the light falls, 0 to 100;
 * - `--flip`: 0 for the front, 1 for the back;
 * - `--glow`: 0 at rest, 1 under the pointer.
 */
export const HOLO_CARD_STYLE_ID = "sg-holo-card";

/** Wavy concentric rings in two opposite phases: the crossed lines of a banknote rosette. */
function guilloche() {
	const paths: string[] = [];
	for (const phase of [1, -1]) {
		for (let ring = 0; ring < 16; ring++) {
			let d = "";
			for (let i = 0; i <= 360; i++) {
				const t = (i / 360) * Math.PI * 2;
				const radius = 6 + ring * 3 + 2.4 * Math.sin(14 * t + phase * ring * 0.8);
				d += `${i ? "L" : "M"}${(radius * Math.cos(t)).toFixed(2)} ${(radius * Math.sin(t)).toFixed(2)}`;
			}
			paths.push(`<path d='${d}Z'/>`);
		}
	}
	const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='-56 -56 112 112'><g fill='none' stroke='white' stroke-width='0.45'>${paths.join("")}</g></svg>`;
	return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export const holoCardStyles = /* css */ `
.sg-hc {
	--sg-hc-ink: var(--foreground, #111114);
	--sg-hc-muted: var(--muted-foreground, #66666c);
	--sg-hc-guilloche: ${guilloche()};
	position: relative;
	isolation: isolate;
	overflow: hidden;
	display: grid;
	align-items: center;
	gap: clamp(40px, 6vw, 80px);
	padding: clamp(96px, 12vw, 136px) 24px clamp(56px, 8vw, 96px);
	color: var(--sg-hc-ink);
	background: var(--background, #fafafa);
}
@media (min-width: 900px) {
	/* The card's column needs a definite width: the stage is a size container, so it has no intrinsic one. */
	.sg-hc { grid-template-columns: minmax(0, 1fr) clamp(320px, 38vw, 460px); padding-inline: max(24px, calc((100% - 1120px) / 2)); }
}
.sg-hc :focus-visible { outline: 2px solid var(--sg-hc-ink); outline-offset: 3px; }

/* Copy */
.sg-hc-copy { display: flex; flex-direction: column; gap: 18px; max-width: 34rem; }
.sg-hc-eyebrow { margin: 0; font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: var(--sg-hc-muted); }
.sg-hc-copy h1 { margin: 0; font-family: var(--font-display, inherit); font-size: clamp(38px, 5.6vw, 64px); font-weight: 600; line-height: 1; letter-spacing: -0.04em; text-wrap: balance; }
.sg-hc-copy > p:not(.sg-hc-eyebrow) { margin: 0; max-width: 46ch; font-size: 17px; line-height: 1.55; color: var(--sg-hc-muted); text-wrap: pretty; }
.sg-hc-ctas { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px; }
.sg-hc-cta { display: inline-flex; align-items: center; height: 46px; padding: 0 22px; border-radius: 999px; font-weight: 600; text-decoration: none; color: var(--primary-foreground, #fff); background: var(--primary, var(--sg-hc-ink)); transition: transform .15s; }
.sg-hc-cta:hover { transform: translateY(-1px); }
.sg-hc-cta[data-variant="secondary"] { color: var(--sg-hc-ink); background: transparent; box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--sg-hc-ink) 18%, transparent); }

/* Stage: sizes the card and gives it depth */
.sg-hc-stage { justify-self: center; display: flex; flex-direction: column; align-items: center; gap: 18px; width: min(100%, 440px); container-type: inline-size; perspective: 1200px; }
.sg-hc-card {
	--rx: 0; --ry: 0; --px: 50; --py: 50; --flip: 0; --glow: 0;
	position: relative; width: 100%; aspect-ratio: 1.586; font-size: clamp(9px, 4cqw, 17px);
	transform-style: preserve-3d;
	transform: rotateX(calc(var(--rx) * 1deg)) rotateY(calc(var(--ry) * 1deg + var(--flip) * 180deg));
	cursor: pointer;
	-webkit-tap-highlight-color: transparent;
}
.sg-hc-card:not([data-flippable]) { cursor: default; }
.sg-hc-face {
	position: absolute; inset: 0; overflow: hidden; border-radius: 4.6%/7.3%;
	backface-visibility: hidden; -webkit-backface-visibility: hidden;
	display: flex; flex-direction: column; justify-content: space-between; padding: 1.5em 1.6em;
	color: var(--sg-hc-face-ink);
	background: var(--sg-hc-face-bg);
	box-shadow:
		inset 0 0 0 1px rgb(255 255 255 / .12),
		0 calc(1.2em + var(--glow) * .8em) calc(2.4em + var(--glow) * 1.6em) -1em rgb(0 0 0 / .45);
}
.sg-hc-back { transform: rotateY(180deg); }
/* The back holds more text: its engraving moves to the corner. */
.sg-hc[data-pattern="guilloche"] .sg-hc-back .sg-hc-etch { --sg-hc-etch-position: 150% 120%; --sg-hc-etch-size: 70% auto; }
.sg-hc[data-surface="dark"] .sg-hc-card { --sg-hc-face-ink: #f4f4f6; --sg-hc-face-sub: rgb(244 244 246 / .62); --sg-hc-face-solid: #121216; --sg-hc-face-bg: radial-gradient(120% 140% at 20% 0%, #2a2a33, #121216 60%, #0b0b0e); }
.sg-hc[data-surface="light"] .sg-hc-card { --sg-hc-face-ink: #17171b; --sg-hc-face-sub: rgb(23 23 27 / .6); --sg-hc-face-solid: #fff; --sg-hc-face-bg: radial-gradient(120% 140% at 20% 0%, #ffffff, #ececf0 60%, #dcdce3); }

/* Printed content sits above the foil, and stays readable over it */
.sg-hc-face > :not(.sg-hc-foil) { position: relative; z-index: 3; }
.sg-hc[data-surface="dark"] .sg-hc-face { text-shadow: 0 1px 2px rgb(0 0 0 / .45); }
.sg-hc-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1em; }
.sg-hc-issuer { font-family: var(--font-mono, ui-monospace, monospace); font-size: .78em; font-weight: 600; letter-spacing: .22em; }
.sg-hc-emblem { width: 2.6em; height: 2.6em; flex: none; }
.sg-hc-name { margin: 0; font-family: var(--font-display, inherit); font-size: 1.9em; font-weight: 600; line-height: 1; letter-spacing: -0.03em; }
.sg-hc-role { margin: .4em 0 0; font-size: .92em; color: var(--sg-hc-face-sub); }
.sg-hc-detail, .sg-hc-number { font-size: .8em; color: var(--sg-hc-face-sub); }
.sg-hc-number { font-family: var(--font-mono, ui-monospace, monospace); letter-spacing: .12em; }
.sg-hc-back h2 { margin: 0; font-family: var(--font-display, inherit); font-size: 1.35em; font-weight: 600; letter-spacing: -0.02em; }
.sg-hc-back ul { margin: .6em 0 0; padding: 0; list-style: none; display: grid; gap: .35em; font-size: .9em; color: var(--sg-hc-face-sub); }
.sg-hc-back li::before { content: "✓ "; color: var(--sg-hc-c0); }
.sg-hc-back a { align-self: flex-start; padding: .55em 1.1em; border-radius: 999px; font-size: .85em; font-weight: 600; text-decoration: none; color: var(--sg-hc-face-solid); background: var(--sg-hc-face-ink); }

/* Foil: a soft sheen everywhere, a bright one in the engraving, the light on top */
.sg-hc-foil { position: absolute; inset: 0; pointer-events: none; border-radius: inherit; }
.sg-hc-sheen, .sg-hc-etch {
	background-image: repeating-linear-gradient(118deg, var(--sg-hc-c0) 0%, var(--sg-hc-c1) 7%, var(--sg-hc-c2) 14%, var(--sg-hc-c3) 21%, var(--sg-hc-c0) 28%);
	background-size: 360% 360%;
	background-position: calc(var(--px) * 1%) calc(var(--py) * 1%);
	z-index: 1;
}
.sg-hc-sheen { mix-blend-mode: color-dodge; opacity: calc(.16 + var(--glow) * .16); }
.sg-hc-etch {
	mix-blend-mode: color-dodge;
	opacity: calc(.26 + var(--glow) * .3);
	-webkit-mask: var(--sg-hc-etch-mask) var(--sg-hc-etch-position) / var(--sg-hc-etch-size) no-repeat;
	mask: var(--sg-hc-etch-mask) var(--sg-hc-etch-position) / var(--sg-hc-etch-size) no-repeat;
}
.sg-hc[data-pattern="guilloche"] .sg-hc-etch { --sg-hc-etch-mask: var(--sg-hc-guilloche); --sg-hc-etch-position: 135% 40%; --sg-hc-etch-size: 78% auto; }
.sg-hc[data-pattern="lines"] .sg-hc-etch {
	--sg-hc-etch-mask: repeating-linear-gradient(62deg, #000 0 1px, transparent 1px 7px); --sg-hc-etch-position: 0 0; --sg-hc-etch-size: 100% 100%;
}
.sg-hc[data-pattern="none"] .sg-hc-etch { display: none; }
.sg-hc[data-surface="light"] .sg-hc-sheen, .sg-hc[data-surface="light"] .sg-hc-etch { mix-blend-mode: multiply; filter: saturate(1.4); }
.sg-hc[data-surface="light"] .sg-hc-etch { opacity: calc(.45 + var(--glow) * .3); }
.sg-hc-glare {
	z-index: 2;
	background: radial-gradient(circle at calc(var(--px) * 1%) calc(var(--py) * 1%), rgb(255 255 255 / .5), rgb(255 255 255 / .08) 35%, transparent 60%);
	mix-blend-mode: overlay;
	opacity: calc(.45 + var(--glow) * .55);
}

/* Turn over */
.sg-hc-flip {
	display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 14px; border: 0; border-radius: 999px; cursor: pointer;
	font: inherit; font-size: 13px; font-weight: 500; color: var(--sg-hc-muted); background: transparent;
}
.sg-hc-flip:hover { color: var(--sg-hc-ink); }
.sg-hc-flip svg { width: 16px; height: 16px; }
.sg-hc-hint { margin: 0; font-size: 12px; color: var(--sg-hc-muted); text-align: center; }
.sg-hc-hint:empty { display: none; }
`;
