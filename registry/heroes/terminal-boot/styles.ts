/**
 * The terminal's stylesheet, added once per document. The command is
 * always complete in the DOM: typing only widens a clip over it, one
 * monospace character (`1ch`) at a time, from `--typed`.
 */
export const TERMINAL_BOOT_STYLE_ID = "sg-terminal-boot";

export const terminalBootStyles = /* css */ `
.sg-tb {
	--sg-tb-ink: var(--foreground, #111114);
	--sg-tb-muted: var(--muted-foreground, #66666c);
	--sg-tb-accent: var(--brand, oklch(0.68 0.17 262));
	--sg-tb-mono: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
	position: relative;
	isolation: isolate;
	overflow: hidden;
	display: grid;
	align-items: center;
	gap: clamp(40px, 6vw, 72px);
	padding: clamp(96px, 12vw, 136px) 24px clamp(56px, 8vw, 104px);
	color: var(--sg-tb-ink);
	background: var(--background, #fafafa);
}
@media (min-width: 960px) {
	.sg-tb { grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); padding-inline: max(24px, calc((100% - 1180px) / 2)); }
}
.sg-tb :focus-visible { outline: 2px solid var(--sg-tb-accent); outline-offset: 2px; }

/* Copy */
.sg-tb-copy { display: flex; flex-direction: column; gap: 18px; max-width: 34rem; }
.sg-tb-eyebrow { margin: 0; font-family: var(--sg-tb-mono); font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: var(--sg-tb-muted); }
.sg-tb-copy h1 { margin: 0; font-family: var(--font-display, inherit); font-size: clamp(36px, 5vw, 60px); font-weight: 600; line-height: 1.02; letter-spacing: -0.04em; text-wrap: balance; }
.sg-tb-copy > p:not(.sg-tb-eyebrow) { margin: 0; max-width: 44ch; font-size: 17px; line-height: 1.55; color: var(--sg-tb-muted); text-wrap: pretty; }
.sg-tb-ctas { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px; }
.sg-tb-cta { display: inline-flex; align-items: center; height: 46px; padding: 0 22px; border-radius: 999px; font-weight: 600; text-decoration: none; color: var(--primary-foreground, #fff); background: var(--primary, var(--sg-tb-ink)); }
.sg-tb-cta[data-variant="secondary"] { color: var(--sg-tb-ink); background: transparent; box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--sg-tb-ink) 18%, transparent); }

/* Scene: the product rises out of the terminal and lands over its lower corner */
.sg-tb-scene { position: relative; min-width: 0; padding-bottom: clamp(150px, 21vw, 290px); }

/* No product to reveal: no room kept for it */
.sg-tb:not([data-has-product]) .sg-tb-scene { padding-bottom: 0; }

/* Terminal: dark in every theme, like the real thing */
.sg-tb-terminal {
	position: relative; z-index: 2; overflow: hidden; border-radius: 14px;
	color: #e6e6ea; background: #0d0d11;
	box-shadow: 0 0 0 1px rgb(255 255 255 / .08), 0 30px 60px -24px rgb(0 0 0 / .55);
	font-family: var(--sg-tb-mono); font-size: clamp(12px, 1.25vw, 14px); line-height: 1.7;
}
.sg-tb-bar { display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 12px 0 14px; border-bottom: 1px solid rgb(255 255 255 / .07); }
.sg-tb-dots { display: flex; gap: 6px; }
.sg-tb-dots i { width: 10px; height: 10px; border-radius: 50%; background: rgb(255 255 255 / .16); }
.sg-tb-title { flex: 1; text-align: center; font-size: 12px; color: rgb(230 230 234 / .5); }
.sg-tb-actions { display: flex; gap: 4px; }
.sg-tb-actions button {
	display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border: 0; border-radius: 6px; cursor: pointer;
	font: inherit; font-size: 12px; color: rgb(230 230 234 / .7); background: rgb(255 255 255 / .06);
}
.sg-tb-actions button:hover { color: #fff; background: rgb(255 255 255 / .12); }
.sg-tb-actions button[hidden] { display: none; }
.sg-tb-body { margin: 0; padding: 16px 18px 20px; min-height: 13em; list-style: none; }
.sg-tb-body li { display: flex; gap: 10px; white-space: pre-wrap; overflow-wrap: anywhere; transition: opacity .25s, transform .25s; }
.sg-tb-prompt { color: var(--sg-tb-accent); flex: none; }
[data-sg-command] { display: inline-block; vertical-align: bottom; white-space: pre; overflow: hidden; }
.sg-tb-caret { display: inline-block; width: .6em; height: 1.15em; margin-left: 1px; vertical-align: -0.2em; background: var(--sg-tb-accent); animation: sg-tb-blink 1s steps(1) infinite; }
@keyframes sg-tb-blink { 50% { opacity: 0; } }
.sg-tb[data-run="running"] .sg-tb-caret, .sg-tb[data-run="done"] .sg-tb-caret { display: none; }
[data-sg-icon] { flex: none; width: 1ch; text-align: center; }
[data-status="ok"] [data-sg-icon] { color: #4ade80; }
[data-status="info"] [data-sg-icon] { color: var(--sg-tb-accent); }
[data-status="warn"] [data-sg-icon] { color: #fbbf24; }
[data-status="muted"] { color: rgb(230 230 234 / .45); }
[data-sg-line].is-spinning [data-sg-icon] { color: rgb(230 230 234 / .6); }
[data-sg-done] { margin-top: .6em; color: #fff; font-weight: 600; }
[data-sg-done] [data-sg-icon] { color: var(--sg-tb-accent); }

/* Product window */
.sg-tb-product {
	position: absolute; z-index: 3; right: -5%; bottom: 0; width: 64%; overflow: hidden; border-radius: 12px;
	background: var(--background, #fff);
	box-shadow: 0 0 0 1px color-mix(in oklab, var(--sg-tb-ink) 10%, transparent), 0 40px 80px -30px rgb(0 0 0 / .5);
	transition: transform 1s cubic-bezier(.2, .9, .2, 1), opacity .6s ease-out;
}
.sg-tb-product-bar { display: flex; align-items: center; gap: 8px; height: 30px; padding: 0 12px; font-family: var(--sg-tb-mono); font-size: 11px; color: var(--sg-tb-muted); border-bottom: 1px solid color-mix(in oklab, var(--sg-tb-ink) 8%, transparent); }
.sg-tb-product img { display: block; width: 100%; height: auto; }
@media (max-width: 959px) {
	/* Lines wrap on narrow screens and fill the terminal: the product goes fully below it. */
	.sg-tb-scene { padding-bottom: calc(78% * .625 + 44px); }
	.sg-tb-product { right: -3%; width: 78%; }
}

/* The sequence: what is not shown yet waits, faded and lowered */
.sg-tb[data-run] [data-sg-line]:not(.is-shown), .sg-tb[data-run] [data-sg-done]:not(.is-shown) { opacity: 0; transform: translateY(4px); }
.sg-tb[data-run] .sg-tb-product:not(.is-shown) { opacity: 0; transform: translateY(-30%) scale(.9); }
.sg-tb[data-run="done"] .sg-tb-product.is-shown { transform: translateY(0) rotate(-1.5deg); }

/* Before the engine runs, nothing should show twice; without it, all appears after a moment. */
@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
	.sg-tb:not([data-ready]) [data-sg-line], .sg-tb:not([data-ready]) [data-sg-done], .sg-tb:not([data-ready]) .sg-tb-product, .sg-tb:not([data-ready]) [data-sg-command] {
		opacity: 0; animation: sg-tb-reveal .4s 2.5s forwards;
	}
}
@keyframes sg-tb-reveal { to { opacity: 1; } }

/* Reduced motion and still modes: everything at rest */
.sg-tb:not([data-motion="ready"]) *, .sg-tb:not([data-motion="ready"]) *::before { transition: none !important; animation: none !important; }
`;
