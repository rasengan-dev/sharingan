/**
 * The portrait burst's stylesheet, added once per document. The slots are
 * here, by position in the list, so the constellation is the layout without
 * JavaScript: each portrait is placed by its centre (`--x`, `--y`, in percent
 * of the stage) with negative margins, which leaves `transform` to the
 * engine. Below 768 px the portraits are a plain grid under the headline.
 */
export const PORTRAIT_BURST_STYLE_ID = "sg-portrait-burst";

/** [x %, y %, size] of each slot, around a clear band in the middle for the headline. */
const SLOTS: [number, number, number][] = [
	[20, 19, 1],
	[45, 13, 0.72],
	[70, 17, 0.95],
	[88, 37, 0.85],
	[9, 44, 0.6],
	[81, 76, 1],
	[60, 88, 0.66],
	[33, 83, 0.92],
	[12, 75, 0.8],
	[95, 60, 0.48],
	[5, 22, 0.46],
	[49, 92, 0.42],
];

/** [x %, y %] of each pill: in the gaps between the slots. */
const PILLS: [number, number][] = [
	[31, 31],
	[73, 34],
	[22, 61],
	[69, 66],
];

const slotRules = SLOTS.map(([x, y, size], index) => `.sg-pb-person:nth-child(${index + 1}) { --x: ${x}%; --y: ${y}%; --s: ${size}; }`).join("\n");
const pillRules = PILLS.map(([x, y], index) => `.sg-pb-pill:nth-child(${index + 1}) { --x: ${x}%; --y: ${y}%; }`).join("\n");

export const portraitBurstStyles = /* css */ `
.sg-pb {
	--sg-pb-ink: var(--foreground, #111114);
	--sg-pb-muted: var(--muted-foreground, #66666c);
	--sg-pb-bg: var(--background, #f6f6f4);
	--sg-pb-accent: #ee8a7b;
	--sg-pb-pill: color-mix(in oklab, var(--sg-pb-accent) 26%, var(--sg-pb-bg));
	--sg-pb-card: clamp(84px, 10.5vw, 168px);
	position: relative;
	color: var(--sg-pb-ink);
	background: var(--sg-pb-bg);
}
.dark .sg-pb, .sg-pb[data-tone="dark"] { --sg-pb-pill: color-mix(in oklab, var(--sg-pb-accent) 30%, var(--sg-pb-bg)); }
.sg-pb :focus-visible { outline: 2px solid var(--sg-pb-ink); outline-offset: 4px; }
.sg-pb-stage {
	position: relative; overflow: hidden;
	height: max(640px, 100svh); max-width: 1440px; margin: 0 auto;
}

/* The headline, in the clear band */
.sg-pb-head {
	position: absolute; left: 50%; top: calc(50% + var(--header-height, 64px) / 2); z-index: 1;
	display: flex; flex-direction: column; align-items: center; gap: 14px;
	width: min(560px, 56%); margin: 0; translate: -50% -50%;
	text-align: center;
}
.sg-pb-eyebrow { margin: 0; font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: var(--sg-pb-muted); }
.sg-pb-head h2 { margin: 0; font-size: clamp(36px, 5.4vw, 80px); line-height: .98; font-weight: 500; letter-spacing: -0.04em; text-wrap: balance; }
.sg-pb-head > p:not(.sg-pb-eyebrow) { margin: 0; max-width: 40ch; font-size: 15px; line-height: 1.5; color: var(--sg-pb-muted); }
.sg-pb-ctas { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 6px; }
.sg-pb-cta {
	display: inline-flex; align-items: center; height: 42px; padding: 0 18px; border-radius: 999px;
	font-size: 14px; font-weight: 500; text-decoration: none;
	color: var(--sg-pb-bg); background: var(--sg-pb-ink);
	transition: transform .15s;
}
.sg-pb-cta[data-variant="secondary"] { color: var(--sg-pb-ink); background: color-mix(in oklab, var(--sg-pb-ink) 7%, var(--sg-pb-bg)); }
.sg-pb-cta:hover { transform: translateY(-2px); }

/* Portraits, placed by their centre in the room under the page's header */
.sg-pb-people, .sg-pb-pills { position: absolute; inset: calc(var(--header-height, 64px) + 8px) 0 8px; margin: 0; padding: 0; list-style: none; pointer-events: none; }
.sg-pb-person { pointer-events: auto; }
.sg-pb-person {
	--w: calc(var(--sg-pb-card) * var(--s, 1));
	position: absolute; left: var(--x); top: var(--y); z-index: 2;
	width: var(--w); aspect-ratio: 4 / 5;
	margin: calc(var(--w) * -0.625) 0 0 calc(var(--w) / -2);
}
.sg-pb-person figure {
	position: relative; width: 100%; height: 100%; margin: 0; overflow: hidden;
	border-radius: calc(10px + var(--w) * .08);
	background: color-mix(in oklab, var(--sg-pb-ink) 8%, var(--sg-pb-bg));
	box-shadow: 0 1px 2px rgb(0 0 0 / .08), 0 18px 36px -18px rgb(0 0 0 / .35);
}
.sg-pb-person img { display: block; width: 100%; height: 100%; object-fit: cover; }
.sg-pb-person figcaption {
	position: absolute; left: 6px; right: 6px; bottom: 6px;
	padding: 6px 8px; border-radius: 10px;
	font-size: 12px; line-height: 1.25; color: #17171a; background: rgb(255 255 255 / .9);
	opacity: 0; transform: translateY(6px); transition: opacity .2s, transform .2s;
}
.sg-pb-person figcaption b { display: block; font-weight: 600; }
.sg-pb-person:hover figcaption { opacity: 1; transform: none; }
.sg-pb-person[data-small] figcaption { display: none; }
${slotRules}

/* Facts between the faces */
.sg-pb-pill {
	position: absolute; left: var(--x); top: var(--y); z-index: 2;
	padding: 6px 12px; border-radius: 999px; white-space: nowrap;
	font-size: 12px; font-weight: 500; color: var(--sg-pb-ink); background: var(--sg-pb-pill);
	translate: -50% -50%;
}
${pillRules}

@media (max-width: 767.98px) {
	.sg-pb-stage { display: flex; flex-direction: column; gap: 28px; height: auto; padding: 72px 16px; }
	.sg-pb-head { position: static; width: auto; translate: none; }
	.sg-pb-people, .sg-pb-pills { position: static; }
	.sg-pb-people { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
	.sg-pb-person { position: relative; left: auto; top: auto; width: auto; margin: 0; }
	.sg-pb-person figure { border-radius: 16px; }
	.sg-pb-pills { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
	.sg-pb-pill { position: static; translate: none; }
}
`;
