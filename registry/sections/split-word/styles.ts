/**
 * The split word's stylesheet, added once per document. Without motion it
 * is the two halves of the word with the card between them, and the form
 * below. While it scrubs (`data-scrub`), the stage is one screen tall and
 * each letter only moves by `transform`; nothing animates `letter-spacing`.
 * The card's lean is the `rotate` property, so it holds without JavaScript.
 * The word's size follows the stage's width; the engine then fits it exactly
 * (`--sg-sw-size`), whatever the word.
 */
export const SPLIT_WORD_STYLE_ID = "sg-split-word";

export const splitWordStyles = /* css */ `
.sg-sw {
	--sg-sw-ink: var(--foreground, #111114);
	--sg-sw-muted: var(--muted-foreground, #66666c);
	--sg-sw-bg: var(--background, #f6f6f4);
	--sg-sw-accent: #ee8a7b;
	--sg-sw-fill: var(--sg-sw-accent);
	--sg-sw-on-fill: #17171a;
	--sg-sw-paper: color-mix(in oklab, var(--sg-sw-ink) 5%, var(--sg-sw-bg));
	--sg-sw-tilt: -4deg;
	--sg-sw-gutter: clamp(16px, 5vw, 80px);
	position: relative;
	color: var(--sg-sw-ink);
	background: var(--sg-sw-bg);
}
.dark .sg-sw, .sg-sw[data-tone="dark"] { --sg-sw-fill: color-mix(in oklab, var(--sg-sw-accent) 70%, #121214); --sg-sw-on-fill: #f6f6f4; }
.sg-sw :focus-visible { outline: 2px solid var(--sg-sw-ink); outline-offset: 4px; }
.sg-sw-stage {
	display: flex; flex-direction: column; justify-content: center; align-items: center; gap: clamp(28px, 4vw, 56px);
	max-width: 1280px; margin: 0 auto; overflow-x: clip;
	padding: clamp(72px, 10vw, 136px) var(--sg-sw-gutter);
	container-type: inline-size;
}
.sg-sw-eyebrow { margin: 0; font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: var(--sg-sw-muted); }
.sg-sw-title { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

/* The word, in two halves around the card */
.sg-sw-line { display: flex; align-items: center; justify-content: center; max-width: 100%; }
.sg-sw-half {
	display: flex; white-space: pre;
	font-size: var(--sg-sw-size, clamp(44px, 9cqi, 176px)); line-height: .9; font-weight: 700; letter-spacing: -0.045em; text-transform: uppercase;
}
.sg-sw-letter { display: inline-block; }
.sg-sw-card {
	position: relative; z-index: 1; flex: none; display: flex; flex-direction: column; gap: 4px;
	width: clamp(180px, 17vw, 250px); margin: 0 clamp(6px, 1vw, 16px); padding: 16px 18px; box-sizing: border-box;
	border-radius: 18px; font-size: 13px; line-height: 1.45;
	color: var(--sg-sw-on-fill); background: var(--sg-sw-fill); text-decoration: none;
	box-shadow: 0 2px 4px rgb(0 0 0 / .08), 0 22px 40px -20px rgb(0 0 0 / .45);
	rotate: var(--sg-sw-tilt);
	transition: scale .2s;
}
a.sg-sw-card:hover { scale: 1.03; }
.sg-sw-card b { font-size: 15px; font-weight: 600; }

/* What comes after: the form */
.sg-sw-below { width: 100%; }
.sg-sw-form { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(120px, 170px); gap: 12px; width: 100%; margin: 0; }
.sg-sw-field {
	display: flex; flex-direction: column; gap: 4px; padding: 12px 18px;
	border-radius: 22px; background: var(--sg-sw-paper);
	transition: box-shadow .2s;
}
.sg-sw-field:focus-within { box-shadow: 0 0 0 2px var(--sg-sw-ink); }
.sg-sw-field span { font-size: 12px; color: var(--sg-sw-muted); }
.sg-sw-field input, .sg-sw-field textarea {
	width: 100%; padding: 0; border: 0; outline: none; resize: none;
	font: inherit; font-size: 15px; color: var(--sg-sw-ink); background: transparent;
}
.sg-sw-message { grid-column: 1 / 4; min-height: 120px; }
.sg-sw-message textarea { flex: 1; }
.sg-sw-form[data-no-subject] .sg-sw-message { grid-column: 1 / 3; }
.sg-sw-form[data-no-subject] { grid-template-columns: repeat(2, minmax(0, 1fr)) minmax(120px, 170px); }
.sg-sw-send {
	grid-column: -2; grid-row: 1 / 3;
	display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-start; gap: 8px;
	padding: 18px; border: 0; border-radius: 22px;
	font: inherit; font-size: 16px; font-weight: 600; color: var(--sg-sw-on-fill); background: var(--sg-sw-fill);
	cursor: pointer; transition: transform .2s;
}
.sg-sw-send:hover { transform: translateY(-2px); }
.sg-sw-send svg { width: 22px; height: 22px; }

/* Scrubbing: one screen, pinned */
.sg-sw[data-scrub] .sg-sw-stage { min-height: 100svh; box-sizing: border-box; padding-top: calc(var(--header-height, 64px) + 24px); padding-bottom: 32px; }
.sg-sw[data-scrub] .sg-sw-letter, .sg-sw[data-scrub] .sg-sw-card { will-change: transform; }

@media (max-width: 767.98px) {
	.sg-sw-line { flex-wrap: wrap; row-gap: 24px; }
	.sg-sw-half { font-size: var(--sg-sw-size, clamp(40px, 14cqi, 96px)); }
	.sg-sw-card { order: 3; margin: 0; }
	.sg-sw-form, .sg-sw-form[data-no-subject] { grid-template-columns: 1fr; }
	.sg-sw-message, .sg-sw-form[data-no-subject] .sg-sw-message { grid-column: auto; }
	.sg-sw-send { grid-column: auto; grid-row: auto; flex-direction: row; justify-content: center; align-items: center; }
}
`;
