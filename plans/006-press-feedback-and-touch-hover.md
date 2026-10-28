# 006 — Give every button press feedback and keep hover lifts off touch screens

- **Status**: TODO
- **Commit**: 617c2fa
- **Severity**: MEDIUM
- **Category**: Physicality & origin / Accessibility
- **Estimated scope**: 13 files (`packages/core/src/react.tsx` + 12 `registry/heroes/*/styles.ts`), CSS only. About 2–6 lines changed per file.

## Problem

No pressable control in the collection answers a press. A button that does not move under the finger or cursor feels dead: the click registers, but nothing confirms it. Hover lifts (`translateY(-1px)` / `translateY(-2px)`) also run on touch screens. A tap fires `:hover`, and the hover stays after the finger lifts, so the button sits raised until you tap somewhere else.

The full list, from a grep of every `styles.ts` and `react.tsx` for buttons, CTAs, `:hover` and `:active`, at commit `617c2fa`:

```css
/* packages/core/src/react.tsx:29-39 — current (shared layout of every WebGPU hero) */
.sg-hero-cta {
	display: inline-flex; align-items: center; height: 48px; padding: 0 24px; border-radius: 999px; font-weight: 500; text-decoration: none;
	color: var(--primary-foreground, #0b0c10); background: var(--primary, #f4f4f6); transition: transform .15s, background-color .15s;
}
.sg-hero-cta:hover { transform: translateY(-2px); }
.sg-hero-cta[data-variant="secondary"] {
	color: var(--foreground, #f4f4f6); background: color-mix(in oklab, var(--background, #0b0c10) 60%, transparent);
	box-shadow: inset 0 0 0 1px var(--border, rgb(255 255 255 / .16)); backdrop-filter: blur(4px);
}
.sg-hero-cta[data-variant="secondary"]:hover { transform: none; background: var(--background, #0b0c10); }
.sg-hero-cta:focus-visible { outline: 2px solid var(--primary, #f4f4f6); outline-offset: 4px; }
```

```css
/* registry/heroes/app-window/styles.ts:39 — current: no transition, no hover, no press */
.sg-aw-cta { display: inline-flex; align-items: center; height: 46px; padding: 0 22px; border-radius: 999px; font-weight: 600; text-decoration: none; color: var(--primary-foreground, #fff); background: var(--primary, var(--sg-aw-ink)); }
```

```css
/* registry/heroes/beam-grid/styles.ts:41 — current: no transition, no hover, no press */
.sg-bm-cta { display: inline-flex; align-items: center; height: 46px; padding: 0 22px; border-radius: 999px; font-weight: 600; text-decoration: none; color: var(--primary-foreground, #fff); background: var(--primary, var(--sg-bm-ink)); }
```

```css
/* registry/heroes/conic-rays/styles.ts:48 — current: no transition, no hover, no press */
.sg-cr-cta { display: inline-flex; align-items: center; height: 46px; padding: 0 22px; border-radius: 999px; font-weight: 600; text-decoration: none; color: var(--primary-foreground, #fff); background: var(--primary, var(--sg-cr-ink)); }
```

```css
/* registry/heroes/marquee-type/styles.ts:32-33 — current: ungated lift, no press */
.sg-mq-cta { display: inline-flex; align-items: center; height: 46px; padding: 0 22px; border-radius: 999px; font-weight: 600; text-decoration: none; color: var(--primary-foreground, #fff); background: var(--primary, var(--sg-mq-ink)); transition: transform .15s; }
.sg-mq-cta:hover { transform: translateY(-1px); }
```

```css
/* registry/heroes/split-headline/styles.ts:45-46 — current: ungated lift, no press */
.sg-sh-cta { display: inline-flex; align-items: center; height: 48px; padding: 0 24px; border-radius: 999px; font-weight: 600; text-decoration: none; color: var(--primary-foreground, #fff); background: var(--primary, var(--sg-sh-ink)); transition: transform .15s; }
.sg-sh-cta:hover { transform: translateY(-1px); }
```

```css
/* registry/heroes/holo-card/styles.ts:58-59 — current: ungated lift, no press */
.sg-hc-cta { display: inline-flex; align-items: center; height: 46px; padding: 0 22px; border-radius: 999px; font-weight: 600; text-decoration: none; color: var(--primary-foreground, #fff); background: var(--primary, var(--sg-hc-ink)); transition: transform .15s; }
.sg-hc-cta:hover { transform: translateY(-1px); }
/* registry/heroes/holo-card/styles.ts:102 — current: the button-styled link on the card's back, no press */
.sg-hc-back a { align-self: flex-start; padding: .55em 1.1em; border-radius: 999px; font-size: .85em; font-weight: 600; text-decoration: none; color: var(--sg-hc-face-solid); background: var(--sg-hc-face-ink); }
/* registry/heroes/holo-card/styles.ts:134-138 — current: the "Turn over" button, colour hover only, no press */
.sg-hc-flip {
	display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 14px; border: 0; border-radius: 999px; cursor: pointer;
	font: inherit; font-size: 13px; font-weight: 500; color: var(--sg-hc-muted); background: transparent;
}
.sg-hc-flip:hover { color: var(--sg-hc-ink); }
```

```css
/* registry/heroes/gallery-fan/styles.ts:45-46 — current: ungated lift, no press */
.sg-gf-cta { display: inline-flex; align-items: center; height: 42px; padding: 0 20px; border-radius: 999px; font-size: 14px; font-weight: 500; text-decoration: none; color: var(--background, #fff); background: var(--sg-gf-ink); transition: transform .15s; }
.sg-gf-cta:hover { transform: translateY(-1px); }
```

```css
/* registry/heroes/trail-map/styles.ts:50-57 — current: ungated lift, no press */
.sg-tm-cta {
	display: inline-flex; align-items: center; gap: 14px; height: 54px; padding: 0 8px 0 26px; border-radius: 16px;
	font-size: 15px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; text-decoration: none; color: #fff;
	background: linear-gradient(110deg, color-mix(in oklab, var(--sg-tm-accent), #fff 35%), var(--sg-tm-accent) 45%, color-mix(in oklab, var(--sg-tm-accent), #000 8%));
	box-shadow: 0 14px 28px -14px var(--sg-tm-accent);
	transition: transform .15s;
}
.sg-tm-cta:hover { transform: translateY(-1px); }
/* registry/heroes/trail-map/styles.ts:137-141 — current: the routes strip's arrow buttons, no press */
.sg-tm-arrow {
	flex: none; display: grid; place-items: center; width: 40px; height: 40px; border: 0; border-radius: 50%; cursor: pointer;
	color: var(--sg-tm-accent); background: var(--sg-tm-surface); box-shadow: 0 6px 16px -8px rgb(0 0 0 / .3);
}
.sg-tm-arrow:disabled { cursor: default; color: var(--sg-tm-muted); opacity: .5; box-shadow: none; }
```

```css
/* registry/heroes/curve-reel/styles.ts:39-49 — current: ungated lift and arrow nudge, no press */
.sg-cr-cta {
	display: inline-flex; align-items: center; gap: 14px;
	height: 44px; margin-top: clamp(14px, 2.6svh, 26px); padding: 0 5px 0 20px;
	border-radius: 999px; font-size: 14px; font-weight: 600; text-decoration: none;
	color: var(--sg-cr-ink); background: var(--sg-cr-paper);
	box-shadow: 0 0 0 1px color-mix(in oklab, var(--sg-cr-ink) 7%, transparent), 0 10px 24px -14px rgb(0 0 0 / .35);
	transition: transform .2s, box-shadow .2s;
}
.sg-cr-cta:hover { transform: translateY(-1px); box-shadow: 0 0 0 1px color-mix(in oklab, var(--sg-cr-ink) 10%, transparent), 0 14px 28px -14px rgb(0 0 0 / .4); }
.sg-cr-cta-arrow { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; color: #fff; background: var(--sg-cr-accent); transition: transform .2s; }
.sg-cr-cta:hover .sg-cr-cta-arrow { transform: translateX(2px); }
.sg-cr-cta-arrow svg { width: 15px; height: 15px; }
```

```css
/* registry/heroes/bento-tiles/styles.ts:42-52 — current: ungated lift and arrow nudge, no press */
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
```

```css
/* registry/heroes/terminal-boot/styles.ts:35 — current: no transition, no hover, no press */
.sg-tb-cta { display: inline-flex; align-items: center; height: 46px; padding: 0 22px; border-radius: 999px; font-weight: 600; text-decoration: none; color: var(--primary-foreground, #fff); background: var(--primary, var(--sg-tb-ink)); }
/* registry/heroes/terminal-boot/styles.ts:56-60 — current: Copy / Replay buttons, colour hover only, no press */
.sg-tb-actions button {
	display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border: 0; border-radius: 6px; cursor: pointer;
	font: inherit; font-size: 12px; color: rgb(230 230 234 / .7); background: rgb(255 255 255 / .06);
}
.sg-tb-actions button:hover { color: #fff; background: rgb(255 255 255 / .12); }
```

```css
/* registry/heroes/gamepad/styles.ts:66-72 — current: a physical "sink" press with no transition, so it snaps */
.sg-gp-cta {
	display: inline-flex; align-items: center; height: 42px; padding: 0 20px; border-radius: 999px; text-decoration: none;
	font-size: 14px; font-weight: 600; color: var(--primary-foreground, #fff); background: var(--primary, var(--sg-gp-ink));
	box-shadow: 0 2px 0 color-mix(in oklab, var(--primary, var(--sg-gp-ink)), #000 35%);
}
.sg-gp-cta[data-variant="secondary"] { color: var(--sg-gp-ink); background: var(--sg-gp-chip); box-shadow: 0 2px 0 var(--sg-gp-line); }
.sg-gp-cta:active { transform: translateY(2px); box-shadow: none; }
/* registry/heroes/gamepad/styles.ts:187 — current: the legend's section buttons, no press */
.sg-gp-legend button { display: inline-flex; align-items: center; gap: 8px; padding: 6px 4px; border: 0; border-bottom: 1.5px solid transparent; background: none; cursor: pointer; font-size: 14px; }
```

## Target

For every pressable control (buttons, and links styled as buttons):

1. **Base transition**: `transform 160ms cubic-bezier(0.23, 1, 0.32, 1)`. If the element already transitions other properties (`background-color`, `box-shadow`), keep those entries exactly as they are and swap only the `transform` entry.
2. **Press**: `:active { transform: scale(0.97); }`. It comes **after** every hover rule for the same element in source order, so it wins over a hover lift at equal specificity. The press is `scale(0.97)` only, never combined with the lift (no `translateY(-1px) scale(0.97)`).
3. **Hover that moves something** (any `:hover` that sets `transform`) goes inside `@media (hover: hover) and (pointer: fine) { … }`. If a hover rule mixes movement with colour or shadow, split it: the colour or shadow part stays ungated and only the `transform` declaration moves into the media query.
4. **Colour-only hovers stay ungated**: `.sg-tb-actions button:hover`, `.sg-hc-flip:hover`, the secondary `.sg-hero-cta` background.
5. **Disabled buttons do not press**: `.sg-tm-arrow` uses `:not(:disabled):active`.
6. **Gamepad CTA** keeps its physical sink (`translateY(2px)`, shadow gone) and gains `transition: transform 100ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 100ms cubic-bezier(0.23, 1, 0.32, 1);` so the press eases instead of snapping.

Values come from the motion playbook: press feedback is `scale(0.97)` with a 100–160ms strong ease-out (`cubic-bezier(0.23, 1, 0.32, 1)`), and hover motion is gated with `(hover: hover) and (pointer: fine)`.

## Repo conventions to follow

- CSS lives in template strings (`/* css */ \`…\``) in each hero's `styles.ts`, and in `heroStyles` in `packages/core/src/react.tsx` for the WebGPU heroes. Indent with tabs. Comments are terse and say *why*.
- There are no shared easing tokens. Write `cubic-bezier(0.23, 1, 0.32, 1)` inline every time. Do not reuse bento-tiles' `--sg-bt-ease`; it is a different curve.
- Short rules stay on one line, as the files already do. Multi-line rules stay multi-line.
- An existing media query in the same style is `@media (pointer: coarse) { … }` at `registry/heroes/gamepad/styles.ts:193-196`. Indent the rules inside a multi-line media block with one tab. A media block that holds a single short rule may stay on one line.

## Steps

Line numbers are at commit `617c2fa`. Plan 007 edits the same files further down (the motion kill rules at the end of each stylesheet). If you run 007 first, line numbers shift: find each block by its quoted text, not by its number.

### 1. `packages/core/src/react.tsx` (lines 29-39)

Replace the block quoted in **Problem** (from `.sg-hero-cta {` to the `:focus-visible` line) with:

```css
.sg-hero-cta {
	display: inline-flex; align-items: center; height: 48px; padding: 0 24px; border-radius: 999px; font-weight: 500; text-decoration: none;
	color: var(--primary-foreground, #0b0c10); background: var(--primary, #f4f4f6); transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background-color .15s;
}
.sg-hero-cta[data-variant="secondary"] {
	color: var(--foreground, #f4f4f6); background: color-mix(in oklab, var(--background, #0b0c10) 60%, transparent);
	box-shadow: inset 0 0 0 1px var(--border, rgb(255 255 255 / .16)); backdrop-filter: blur(4px);
}
.sg-hero-cta[data-variant="secondary"]:hover { background: var(--background, #0b0c10); }
/* Lift only where hover is real: on touch, a tap would leave it raised */
@media (hover: hover) and (pointer: fine) {
	.sg-hero-cta:hover { transform: translateY(-2px); }
	.sg-hero-cta[data-variant="secondary"]:hover { transform: none; }
}
/* Press: after the hover rules so it wins; the secondary selector matches its hover's specificity */
.sg-hero-cta:active, .sg-hero-cta[data-variant="secondary"]:active { transform: scale(0.97); }
.sg-hero-cta:focus-visible { outline: 2px solid var(--primary, #f4f4f6); outline-offset: 4px; }
```

### 2. `registry/heroes/app-window/styles.ts` (line 39)

In the `.sg-aw-cta { … }` rule on line 39, add `transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);` as the last declaration, right after `background: var(--primary, var(--sg-aw-ink));`. Then, right after line 40 (the `.sg-aw-cta[data-variant="secondary"]` rule), add:

```css
.sg-aw-cta:active { transform: scale(0.97); }
```

There is no hover rule, so nothing needs gating. Leave `.sg-aw-button` (line 71) alone: it is a decorative `<span>` inside the fake app screen (`app-window.tsx:89`), not a control.

### 3. `registry/heroes/beam-grid/styles.ts` (line 41)

In `.sg-bm-cta { … }` (line 41), add `transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);` as the last declaration, after `background: var(--primary, var(--sg-bm-ink));`. Right after line 42 (the secondary rule), add:

```css
.sg-bm-cta:active { transform: scale(0.97); }
```

### 4. `registry/heroes/conic-rays/styles.ts` (line 48)

In `.sg-cr-cta { … }` (line 48), add `transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);` as the last declaration, after `background: var(--primary, var(--sg-cr-ink));`. Right after line 49 (the secondary rule), add:

```css
.sg-cr-cta:active { transform: scale(0.97); }
```

Conic-rays and curve-reel both use the `sg-cr-` prefix, so on a page that loads both stylesheets their `.sg-cr-cta` rules collide. That collision already exists and is out of scope. This step and step 9 write the same transition and press, so they agree with each other.

### 5. `registry/heroes/marquee-type/styles.ts` (lines 32-34)

Replace lines 32-33 (quoted in **Problem**) and keep line 34 (the secondary rule) where it is, so the block becomes:

```css
.sg-mq-cta { display: inline-flex; align-items: center; height: 46px; padding: 0 22px; border-radius: 999px; font-weight: 600; text-decoration: none; color: var(--primary-foreground, #fff); background: var(--primary, var(--sg-mq-ink)); transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1); }
.sg-mq-cta[data-variant="secondary"] { color: var(--sg-mq-ink); background: transparent; box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--sg-mq-ink) 18%, transparent); }
/* Lift only where hover is real: on touch, a tap would leave it raised */
@media (hover: hover) and (pointer: fine) { .sg-mq-cta:hover { transform: translateY(-1px); } }
/* Press: after the hover lift, so it wins */
.sg-mq-cta:active { transform: scale(0.97); }
```

Do not touch `.sg-mq-track li:hover` (line 63) or `.sg-mq-row[data-look="outline"] li:hover` (line 68). They change colour only and are marquee words, not buttons.

### 6. `registry/heroes/split-headline/styles.ts` (lines 45-47)

Replace lines 45-47 with:

```css
.sg-sh-cta { display: inline-flex; align-items: center; height: 48px; padding: 0 24px; border-radius: 999px; font-weight: 600; text-decoration: none; color: var(--primary-foreground, #fff); background: var(--primary, var(--sg-sh-ink)); transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1); }
.sg-sh-cta[data-variant="secondary"] { color: var(--sg-sh-ink); background: transparent; box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--sg-sh-ink) 18%, transparent); }
/* Lift only where hover is real: on touch, a tap would leave it raised */
@media (hover: hover) and (pointer: fine) { .sg-sh-cta:hover { transform: translateY(-1px); } }
/* Press: after the hover lift, so it wins */
.sg-sh-cta:active { transform: scale(0.97); }
```

### 7. `registry/heroes/holo-card/styles.ts` (three places)

**7a. Lines 58-60.** Replace with:

```css
.sg-hc-cta { display: inline-flex; align-items: center; height: 46px; padding: 0 22px; border-radius: 999px; font-weight: 600; text-decoration: none; color: var(--primary-foreground, #fff); background: var(--primary, var(--sg-hc-ink)); transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1); }
.sg-hc-cta[data-variant="secondary"] { color: var(--sg-hc-ink); background: transparent; box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--sg-hc-ink) 18%, transparent); }
/* Lift only where hover is real: on touch, a tap would leave it raised */
@media (hover: hover) and (pointer: fine) { .sg-hc-cta:hover { transform: translateY(-1px); } }
/* Press: after the hover lift, so it wins */
.sg-hc-cta:active { transform: scale(0.97); }
```

**7b. Line 102** (`.sg-hc-back a`). Add `transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);` as the last declaration, after `background: var(--sg-hc-face-ink);`. Right after that line, add:

```css
.sg-hc-back a:active { transform: scale(0.97); }
```

**7c. Lines 134-138** (`.sg-hc-flip`). Add the transition to the base rule and the press after the colour hover:

```css
.sg-hc-flip {
	display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 14px; border: 0; border-radius: 999px; cursor: pointer;
	font: inherit; font-size: 13px; font-weight: 500; color: var(--sg-hc-muted); background: transparent;
	transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
}
.sg-hc-flip:hover { color: var(--sg-hc-ink); }
.sg-hc-flip:active { transform: scale(0.97); }
```

`.sg-hc-flip:hover` stays ungated because it changes colour only.

### 8. `registry/heroes/gallery-fan/styles.ts` (lines 45-47)

Replace lines 45-47 with:

```css
.sg-gf-cta { display: inline-flex; align-items: center; height: 42px; padding: 0 20px; border-radius: 999px; font-size: 14px; font-weight: 500; text-decoration: none; color: var(--background, #fff); background: var(--sg-gf-ink); transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1); }
.sg-gf-cta[data-variant="secondary"] { color: var(--sg-gf-ink); background: color-mix(in oklab, var(--sg-gf-ink) 6%, transparent); }
/* Lift only where hover is real: on touch, a tap would leave it raised */
@media (hover: hover) and (pointer: fine) { .sg-gf-cta:hover { transform: translateY(-1px); } }
/* Press: after the hover lift, so it wins */
.sg-gf-cta:active { transform: scale(0.97); }
```

### 9. `registry/heroes/curve-reel/styles.ts` (lines 39-50)

Replace lines 39-50 with the block below. The hover shadow stays ungated because a shadow is not movement. Only the two `transform` hovers move into the media query.

```css
.sg-cr-cta {
	display: inline-flex; align-items: center; gap: 14px;
	height: 44px; margin-top: clamp(14px, 2.6svh, 26px); padding: 0 5px 0 20px;
	border-radius: 999px; font-size: 14px; font-weight: 600; text-decoration: none;
	color: var(--sg-cr-ink); background: var(--sg-cr-paper);
	box-shadow: 0 0 0 1px color-mix(in oklab, var(--sg-cr-ink) 7%, transparent), 0 10px 24px -14px rgb(0 0 0 / .35);
	transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow .2s;
}
.sg-cr-cta:hover { box-shadow: 0 0 0 1px color-mix(in oklab, var(--sg-cr-ink) 10%, transparent), 0 14px 28px -14px rgb(0 0 0 / .4); }
.sg-cr-cta-arrow { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; color: #fff; background: var(--sg-cr-accent); transition: transform .2s; }
/* Lift and nudge only where hover is real: on touch, a tap would leave them stuck */
@media (hover: hover) and (pointer: fine) {
	.sg-cr-cta:hover { transform: translateY(-1px); }
	.sg-cr-cta:hover .sg-cr-cta-arrow { transform: translateX(2px); }
}
/* Press: after the hover lift, so it wins */
.sg-cr-cta:active { transform: scale(0.97); }
.sg-cr-cta-arrow svg { width: 15px; height: 15px; }
```

Leave `.sg-cr-cta-arrow`'s own `transition: transform .2s` as it is. It is the inner arrow's nudge, not the press.

### 10. `registry/heroes/bento-tiles/styles.ts` (lines 42-52)

Replace lines 42-52 with:

```css
.sg-bt-btn {
	display: inline-flex; align-items: center; justify-content: center; gap: 10px;
	height: 40px; padding: 0 22px; border-radius: 999px;
	font-size: 14px; font-weight: 500; text-decoration: none; white-space: nowrap;
	color: var(--background, #fff); background: var(--sg-bt-ink);
	box-shadow: 0 10px 22px -12px rgb(0 0 0 / .5);
	transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow .2s;
}
.sg-bt-btn:hover { box-shadow: 0 14px 26px -12px rgb(0 0 0 / .55); }
.sg-bt-btn svg { width: 14px; height: 14px; transition: transform .2s var(--sg-bt-ease); }
/* Lift and nudge only where hover is real: on touch, a tap would leave them stuck */
@media (hover: hover) and (pointer: fine) {
	.sg-bt-btn:hover { transform: translateY(-1px); }
	.sg-bt-btn:hover svg { transform: translateX(3px); }
}
/* Press: after the hover lift, so it wins */
.sg-bt-btn:active { transform: scale(0.97); }
```

Do not touch `.sg-bt-links a:hover` (opacity only) or any `.sg-bt-card…:hover` rule (cards, out of scope).

### 11. `registry/heroes/trail-map/styles.ts` (two places)

**11a. Lines 50-57.** Replace with:

```css
.sg-tm-cta {
	display: inline-flex; align-items: center; gap: 14px; height: 54px; padding: 0 8px 0 26px; border-radius: 16px;
	font-size: 15px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; text-decoration: none; color: #fff;
	background: linear-gradient(110deg, color-mix(in oklab, var(--sg-tm-accent), #fff 35%), var(--sg-tm-accent) 45%, color-mix(in oklab, var(--sg-tm-accent), #000 8%));
	box-shadow: 0 14px 28px -14px var(--sg-tm-accent);
	transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
}
/* Lift only where hover is real: on touch, a tap would leave it raised */
@media (hover: hover) and (pointer: fine) { .sg-tm-cta:hover { transform: translateY(-1px); } }
/* Press: after the hover lift, so it wins */
.sg-tm-cta:active { transform: scale(0.97); }
```

**11b. Lines 137-141.** Replace with:

```css
.sg-tm-arrow {
	flex: none; display: grid; place-items: center; width: 40px; height: 40px; border: 0; border-radius: 50%; cursor: pointer;
	color: var(--sg-tm-accent); background: var(--sg-tm-surface); box-shadow: 0 6px 16px -8px rgb(0 0 0 / .3);
	transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
}
.sg-tm-arrow:disabled { cursor: default; color: var(--sg-tm-muted); opacity: .5; box-shadow: none; }
/* A disabled arrow does nothing, so it does not answer a press */
.sg-tm-arrow:not(:disabled):active { transform: scale(0.97); }
```

Leave `.sg-tm-route-card:hover` (line 154) and `.sg-tm-link` (line 60) alone. The first is a card and the second is a plain text link: both out of scope.

### 12. `registry/heroes/terminal-boot/styles.ts` (two places)

**12a. Line 35** (`.sg-tb-cta`). Add `transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);` as the last declaration, after `background: var(--primary, var(--sg-tb-ink));`. Right after line 36 (the secondary rule), add:

```css
.sg-tb-cta:active { transform: scale(0.97); }
```

**12b. Lines 56-60** (`.sg-tb-actions button`). Replace with:

```css
.sg-tb-actions button {
	display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border: 0; border-radius: 6px; cursor: pointer;
	font: inherit; font-size: 12px; color: rgb(230 230 234 / .7); background: rgb(255 255 255 / .06);
	transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
}
.sg-tb-actions button:hover { color: #fff; background: rgb(255 255 255 / .12); }
.sg-tb-actions button:active { transform: scale(0.97); }
```

The colour hover stays ungated and keeps snapping as it does today. This plan adds no colour transition.

### 13. `registry/heroes/gamepad/styles.ts` (two places)

**13a. Lines 66-72.** Add the transition to `.sg-gp-cta` and leave the sink press as it is:

```css
.sg-gp-cta {
	display: inline-flex; align-items: center; height: 42px; padding: 0 20px; border-radius: 999px; text-decoration: none;
	font-size: 14px; font-weight: 600; color: var(--primary-foreground, #fff); background: var(--primary, var(--sg-gp-ink));
	box-shadow: 0 2px 0 color-mix(in oklab, var(--primary, var(--sg-gp-ink)), #000 35%);
	/* The sink below eases instead of snapping */
	transition: transform 100ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 100ms cubic-bezier(0.23, 1, 0.32, 1);
}
.sg-gp-cta[data-variant="secondary"] { color: var(--sg-gp-ink); background: var(--sg-gp-chip); box-shadow: 0 2px 0 var(--sg-gp-line); }
.sg-gp-cta:active { transform: translateY(2px); box-shadow: none; }
```

**13b. Line 187** (`.sg-gp-legend button`). Add `transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);` as the last declaration, after `font-size: 14px;`. Right after line 189 (`.sg-gp-legend button[aria-pressed="true"] { … }`), add:

```css
.sg-gp-legend button:active { transform: scale(0.97); }
```

Do **not** add press feedback to the controller's own buttons (`.sg-gp-dpad button`, `.sg-gp-mid`, `.sg-gp-face`). The engine already gives them a physical press: it toggles `.is-down` on `pointerdown` (`engine.ts:214`, `:274`), styled at `styles.ts:125`, `:138` and `:155`.

## Boundaries

- Touch only the rules named above. Do not touch card, tile or reel hovers: `.sg-bt-card:hover` and its descendants, `.sg-tm-route-card:hover`, `.sg-cr-card` captions, `.sg-gf-card`, `.sg-mq-track li:hover`.
- Do not gate colour-only or opacity-only hovers.
- Do not touch the gamepad controller buttons (`.sg-gp-dpad button`, `.sg-gp-mid`, `.sg-gp-face`), app-window's decorative `.sg-aw-button`, or plain text links (`.sg-tm-link`, `.sg-bt-links a`, `.sg-bt-brand`).
- Do not touch the reduced-motion and still-mode kill rules at the end of each stylesheet. Plan 007 owns them. After this plan, in reduced, off and final modes the press scale snaps instead of easing, because those rules remove transitions. That is expected.
- No markup changes, no engine changes, no new dependencies, no shared token file.
- Known limitation, not to fix here: iOS Safari only applies `:active` when a `touchstart` listener exists on the element or an ancestor. Do not add one in this plan.
- If any quoted block does not match the file (drift since `617c2fa`), STOP and report. Do not improvise.

## Verification

- **Mechanical**:
  - `pnpm typecheck` from the repo root passes. These are template strings, so this only guards against broken backticks or `${}`.
  - `grep -n ':hover { transform' packages/core/src/react.tsx registry/heroes/*/styles.ts` lists only lines inside an `@media (hover: hover) and (pointer: fine)` block, or card and tile rules from the out-of-scope list (`.sg-bt-card:hover`, `.sg-bt-card[data-sg-card="portrait"]:hover > img`, `.sg-tm-route-card:hover`).
  - `grep -c 'scale(0.97)' packages/core/src/react.tsx registry/heroes/*/styles.ts` shows react.tsx 1, app-window 1, beam-grid 1, conic-rays 1, marquee-type 1, split-headline 1, holo-card 3, gallery-fan 1, curve-reel 1, bento-tiles 1, trail-map 2, terminal-boot 2, gamepad 1.
- **Feel check**: run `pnpm dev` and open `http://localhost:3100/heroes/<name>` for each of app-window, beam-grid, conic-rays, marquee-type, split-headline, holo-card, gallery-fan, curve-reel, bento-tiles, trail-map, terminal-boot and gamepad, plus one WebGPU hero (for example `http://localhost:3100/heroes/aurora-mesh`) for `.sg-hero-cta`.
  - Press and hold each CTA with the mouse. The button settles slightly smaller (3%) within about a sixth of a second and stays there while held. On release it springs back. On buttons that lift on hover, the press reads as "pushed in", not "lifted and shrunk": there is no upward drift during the press.
  - Click fast, five times in a row. Each press retargets smoothly and never jumps or restarts from a far state.
  - Holo-card: press "Turn over" and the "back" link (turn the card over first). Both scale on press, and pressing the link does not flip the card.
  - Trail-map: press the arrow buttons, then scroll the strip to its start so "previous" is disabled. Pressing the disabled arrow does not scale.
  - Terminal-boot: press Copy and Replay (Replay shows after the run). Both scale, and the colour hover still works.
  - Gamepad: the CTA sinks 2px and its shadow collapses over 100ms instead of snapping. The legend buttons scale. The on-pad controller buttons behave exactly as before.
  - In DevTools, Animations panel at 10%: the press uses one smooth ease-out with a fast start and a long settle. No `ease-in` start.
  - In DevTools device mode (a phone preset, which reports `hover: none` and `pointer: coarse`), reload, then tap each CTA. It does not stay raised after the tap. Bento and curve-reel arrows do not stay nudged.
  - With the mouse on desktop, hover still lifts the CTAs exactly as before (1px, or 2px on WebGPU heroes) and the secondary `.sg-hero-cta` still changes background without lifting.
- **Done when**: every control listed in the Steps has the 160ms transform transition and a `scale(0.97)` press (gamepad CTA: its 100ms sink transition), every transform hover on a control sits inside `@media (hover: hover) and (pointer: fine)`, and typecheck passes.
