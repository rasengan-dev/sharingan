/**
 * The pinned reveal's stylesheet, added once per document. Without motion
 * it is a headline over a full-width image. While it scrubs (`data-scrub`),
 * the stage is one screen tall and the frame grows from below with
 * `transform` only, its photo settling inside it.
 */
export const PINNED_REVEAL_STYLE_ID = "sg-pinned-reveal";

export const pinnedRevealStyles = /* css */ `
.sg-pr {
	--sg-pr-ink: var(--foreground, #111114);
	--sg-pr-muted: var(--muted-foreground, #66666c);
	--sg-pr-bg: var(--background, #f6f6f4);
	--sg-pr-radius: 28px;
	--sg-pr-gutter: clamp(16px, 5vw, 80px);
	position: relative;
	color: var(--sg-pr-ink);
	background: var(--sg-pr-bg);
}
.sg-pr :focus-visible { outline: 2px solid var(--sg-pr-ink); outline-offset: 4px; }
.sg-pr-stage {
	display: flex; flex-direction: column; gap: clamp(24px, 4vw, 48px);
	max-width: 1440px; margin: 0 auto;
	padding: clamp(64px, 10vw, 128px) var(--sg-pr-gutter);
}
.sg-pr-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px 32px; }
.sg-pr-eyebrow { margin: 0 0 12px; font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: var(--sg-pr-muted); }
.sg-pr-head h2 { margin: 0; max-width: 14ch; font-size: clamp(36px, 6vw, 88px); line-height: .98; font-weight: 600; letter-spacing: -0.035em; text-wrap: balance; }
.sg-pr-head h2 [data-sg-word] { display: inline-block; }
.sg-pr-cta {
	display: inline-flex; align-items: center; height: 44px; padding: 0 20px; border-radius: 999px;
	font-size: 15px; font-weight: 500; text-decoration: none; color: var(--sg-pr-bg); background: var(--sg-pr-ink);
	transition: transform .15s;
}
.sg-pr-cta:hover { transform: translateY(-2px); }

.sg-pr-frame {
	position: relative; margin: 0; overflow: hidden;
	height: min(72svh, 58vw); border-radius: var(--sg-pr-radius);
	background: color-mix(in oklab, var(--sg-pr-ink) 8%, var(--sg-pr-bg));
	transform-origin: 50% 0%;
}
.sg-pr-frame img { display: block; width: 100%; height: 100%; object-fit: cover; }
.sg-pr-caption {
	position: absolute; left: 16px; bottom: 16px; max-width: min(340px, calc(100% - 32px));
	padding: 14px 16px; border-radius: 16px;
	color: #111114; background: rgb(255 255 255 / .88); backdrop-filter: blur(8px);
}
.sg-pr-caption b { display: block; font-size: 15px; font-weight: 600; }
.sg-pr-caption span { display: block; margin-top: 4px; font-size: 13px; line-height: 1.4; color: #55555b; }

/* Scrubbing: one screen, pinned; the frame takes the room under the headline */
.sg-pr[data-scrub] .sg-pr-stage { height: 100svh; padding-top: calc(var(--header-height, 64px) + 24px); padding-bottom: 24px; }
.sg-pr[data-scrub] .sg-pr-frame { flex: 1; min-height: 0; height: auto; }
`;
