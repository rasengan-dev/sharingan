# 007 — Reduced motion drops movement but keeps colour and opacity feedback

- **Status**: TODO
- **Commit**: 617c2fa, plus `61d6481` (fix/reveal-fallback) for app-window, gallery-fan and terminal-boot. That fix must be merged first: steps 1, 2 and 7 quote its code.
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 7 files (`registry/heroes/{app-window,gallery-fan,bento-tiles,trail-map,curve-reel,gamepad,terminal-boot}/styles.ts`), CSS only, 2–4 lines each.

## Problem

Each hero has four motion modes, read by `readMotionMode()` in `packages/core/src/motion.ts:1-18`:

- `ready`: animate.
- `reduced`: the visitor's OS asks for reduced motion.
- `off`: `?motion=off`, treated like `reduced`.
- `final`: `?motion=final`, a frozen, repeatable frame for screenshots and posters.

The engine writes the mode on the hero's root as `data-motion` (for example `app-window/engine.ts:105`).

Seven DOM heroes end their stylesheet with one rule that removes **every** transition and animation whenever the mode is not `ready`. That rule treats `reduced` and `off` exactly like `final`. So a visitor who asked for reduced motion also loses feedback that is not movement at all:

- caption fades on the raised gallery card and on hovered reel cards;
- step colours and step underlines in curve-reel;
- nav link opacity and the portrait marks' fade in bento-tiles;
- toast fades and pressed-arrow colour in gamepad;
- line fades in terminal-boot when the mode changes mid-run.

These snap instead of easing. Reduced motion means fewer and gentler animations, not none: keep opacity and colour, drop movement.

The seven rules, verbatim at `617c2fa`:

```css
/* registry/heroes/app-window/styles.ts:119-124 — current (after 61d6481) */
/* Reduced motion and still modes: nothing moves. Before the engine has set a mode only transitions are off, so the reveal fallback can run */
.sg-aw:not([data-motion="ready"]) *, .sg-aw:not([data-motion="ready"]) *::before { transition: none !important; }
.sg-aw[data-motion]:not([data-motion="ready"]) *, .sg-aw[data-motion]:not([data-motion="ready"]) *::before { animation: none !important; }
@media (prefers-reduced-motion: reduce) {
	.sg-aw:not([data-motion="ready"]) *, .sg-aw:not([data-motion="ready"]) *::before { animation: none !important; }
}
```

```css
/* registry/heroes/gallery-fan/styles.ts:115-120 — current (after 61d6481) */
/* Reduced motion, ?motion=off and ?motion=final: no movement at all. Before the engine has set a mode only transitions are off, so the reveal fallback can run */
.sg-gf:not([data-motion="ready"]) *, .sg-gf:not([data-motion="ready"]) *::before, .sg-gf:not([data-motion="ready"]) *::after { transition: none !important; }
.sg-gf[data-motion]:not([data-motion="ready"]) *, .sg-gf[data-motion]:not([data-motion="ready"]) *::before, .sg-gf[data-motion]:not([data-motion="ready"]) *::after { animation: none !important; }
@media (prefers-reduced-motion: reduce) {
	.sg-gf:not([data-motion="ready"]) *, .sg-gf:not([data-motion="ready"]) *::before, .sg-gf:not([data-motion="ready"]) *::after { animation: none !important; }
}
```

```css
/* registry/heroes/bento-tiles/styles.ts:346-348 — current */
/* Reduced motion, ?motion=off and ?motion=final: no movement at all */
.sg-bt[data-motion]:not([data-motion="ready"]) *, .sg-bt[data-motion]:not([data-motion="ready"]) *::before, .sg-bt[data-motion]:not([data-motion="ready"]) *::after { transition: none !important; animation: none !important; }
.sg-bt[data-motion]:not([data-motion="ready"]) .sg-bt-marks-scan { display: none; }
```

```css
/* registry/heroes/trail-map/styles.ts:167-168 — current */
/* Reduced motion, ?motion=off and ?motion=final: the route drawn, nothing moving */
.sg-tm:not([data-motion="ready"]) *, .sg-tm:not([data-motion="ready"]) *::before { transition: none !important; animation: none !important; }
```

```css
/* registry/heroes/curve-reel/styles.ts:129-130 — current */
/* Reduced motion, ?motion=off and ?motion=final: no movement at all */
.sg-cr[data-motion]:not([data-motion="ready"]) *, .sg-cr[data-motion]:not([data-motion="ready"]) *::before, .sg-cr[data-motion]:not([data-motion="ready"]) *::after { transition: none !important; animation: none !important; }
```

```css
/* registry/heroes/gamepad/styles.ts:219-220 — current */
/* Reduced motion, ?motion=off and ?motion=final: no movement at all */
.sg-gp:not([data-motion="ready"]) *, .sg-gp:not([data-motion="ready"]) *::before, .sg-gp:not([data-motion="ready"]) *::after { transition: none !important; animation: none !important; }
```

```css
/* registry/heroes/terminal-boot/styles.ts:106-111 — current (after 61d6481) */
/* Reduced motion and still modes: everything at rest. Before the engine has set a mode only transitions are off, so the reveal fallback can run */
.sg-tb:not([data-motion="ready"]) *, .sg-tb:not([data-motion="ready"]) *::before { transition: none !important; }
.sg-tb[data-motion]:not([data-motion="ready"]) *, .sg-tb[data-motion]:not([data-motion="ready"]) *::before { animation: none !important; }
@media (prefers-reduced-motion: reduce) {
	.sg-tb:not([data-motion="ready"]) *, .sg-tb:not([data-motion="ready"]) *::before { animation: none !important; }
}
```

Trail-map has a second leak. The routes strip asks for smooth scrolling in CSS:

```css
/* registry/heroes/trail-map/styles.ts:143-146 — current */
.sg-tm-routes {
	flex: 1; display: flex; gap: 16px; margin: 0; padding: 6px 2px; list-style: none;
	overflow-x: auto; scroll-snap-type: x mandatory; scroll-behavior: smooth; scrollbar-width: none;
}
```

The arrows call `scrollBy` with `behavior: "auto"` outside `ready`:

```ts
// registry/heroes/trail-map/engine.ts:306 — current
		list.scrollBy({ left: direction * (card.getBoundingClientRect().width + 16), behavior: mode === "ready" ? "smooth" : "auto" });
```

`"auto"` means "use the element's CSS `scroll-behavior`", which is `smooth`. So reduced-motion visitors still get a smooth scroll on every arrow click.

### Two selector families: keep the difference

- **trail-map, gamepad** use `.X:not([data-motion="ready"])`. That also matches **before the engine has written `data-motion`** (server-rendered markup, during hydration), so today transitions and animations are off in that window too. This plan keeps that pre-engine behaviour unchanged. Their "full kill" is written as `:not(ready):not(reduced):not(off)`, which covers `final` and the missing attribute.
- **app-window, gallery-fan, terminal-boot** (after `61d6481`) split the rule: transitions are off whenever the mode is not `ready`, including before the engine runs; animations are off only once a mode is set, or under `prefers-reduced-motion: reduce`, so their 2.5s reveal fallback can run if the engine never starts. Keep that split: transitions off for `:not(ready):not(reduced):not(off)`, animations off for `[data-motion="final"]`, and keep the `@media` block.
- **bento-tiles, curve-reel** use `.X[data-motion]:not([data-motion="ready"])`, which does not match before the engine runs. Their full kill becomes `.X[data-motion="final"]`. The engine only ever writes the four values, so this is equivalent.

## Target

For each of the seven heroes, replace the single kill rule with two rules:

1. **`final` (and, for the five `:not(…)` heroes, the pre-engine state)**: the existing full kill, unchanged: `transition: none !important; animation: none !important;`, on exactly the pseudo-elements the hero already lists.
2. **`reduced` and `off`**: `animation: none !important; transition-property: opacity, color, background-color, border-color, fill, stroke !important;` on `*`, `*::before` and `*::after`. Colour and opacity changes keep each element's own declared duration, curve and delay. Transforms, `translate`, `clip-path`, `stroke-dashoffset`, `filter` and `box-shadow` are no longer listed, so they snap.

Trail-map additionally gets:

```css
.sg-tm[data-motion]:not([data-motion="ready"]) .sg-tm-routes { scroll-behavior: auto; }
```

### How the per-element durations pair up (read before judging the result)

Overriding only `transition-property` keeps each element's `transition-duration`, `transition-timing-function` and `transition-delay` lists. CSS pairs those lists with the new property list **by index**, repeating the lists when they are shorter. So `opacity` (first in the new list) takes the element's **first** declared duration and curve, `color` the second, and so on.

For elements whose first entry is already `opacity`, or that declare a single transition, the result is their own timing. For the rest, a few elements get a longer fade than their own opacity transition. None of these elements change opacity or colour while in `reduced` or `off`: their state changes only happen in `ready` (intros) or are driven by `transform`. So none of them changes what a reduced-motion visitor sees. The ones that do change in reduced or off mode:

| Hero | Element | Change in reduced/off | Resulting timing |
| --- | --- | --- | --- |
| gallery-fan | `.sg-gf-caption` (`opacity .3s, transform .3s`) | caption of the raised card fades | opacity .3s (own) |
| curve-reel | `.sg-cr-caption` (`opacity .25s, transform .25s`) | caption on hover/focus | opacity .25s (own) |
| curve-reel | `.sg-cr-step` (`color .3s`) and `::after` (`opacity .3s`) | active step colour and underline | .3s (own) |
| bento-tiles | `.sg-bt-links a` (`opacity .2s`) | nav link hover | .2s (own) |
| bento-tiles | `.sg-bt-marks-spot` (`opacity .3s`) | portrait hover marks | .3s (own) |
| gamepad | `.sg-gp-toast` (`opacity .25s, transform .25s`) | toast in/out | opacity .25s (own) |
| gamepad | `.sg-gp-dpad svg` (`transform .1s`) | pressed arrow turns white | color .1s |
| terminal-boot | `.sg-tb-body li` (`opacity .25s, transform .25s`) | only if the mode switches to reduced mid-run (`finish()`) | opacity .25s (own) |
| terminal-boot | `.sg-tb-product` (`transform 1s cubic-bezier(.2, .9, .2, 1), opacity .6s`) | same, mid-run switch only | opacity 1s with that curve (index pairing) |

### Animations whose end state matters

The task required this check. Every hero's `animation-fill-mode: both/forwards` keyframes either run only in `ready`, or are fallbacks that were already removed outside `ready` by the old rule. Behaviour is unchanged in every case:

- app-window `sg-aw-reveal`, gallery-fan `sg-gf-reveal`, terminal-boot `sg-tb-reveal` (`forwards`): pre-engine fallbacks inside `@media (scripting: enabled) and (prefers-reduced-motion: no-preference)`. They never apply to reduced visitors. Since `61d6481` they run before the engine has set a mode, and this plan keeps that: the `final` animation kill is scoped to `[data-motion="final"]`.
- bento-tiles intro keyframes (`both`): only under `[data-intro]`, which the engine sets only in `ready` (`bento-tiles/engine.ts:409`). `sg-bt-reveal` (`forwards`) applies only while `:not([data-ready])`, and the engine writes `data-ready` together with `data-motion`. `sg-bt-ping` (`both`, on hover) was already killed outside `ready` and still is.
- curve-reel `sg-cr-reveal` (`forwards`): only `:not([data-ready])`, the same as bento.
- gamepad `sg-gp-in` (no fill), `sg-gp-fall` (`forwards`, confetti only spawns in `ready`: `gamepad/engine.ts:421`).
- trail-map: only infinite decorative keyframes (`sg-tm-pulse`, `sg-tm-drift`, `sg-tm-twinkle`), no fill-mode.

## Repo conventions to follow

- CSS lives in each hero's `styles.ts` template string. Tabs, one rule per line for these long selector lists (as the current kill rules are), with a terse `/* … */` comment above each rule saying which modes it serves.
- Prefix per hero: app-window `.sg-aw`, gallery-fan `.sg-gf`, bento-tiles `.sg-bt`, trail-map `.sg-tm`, curve-reel `.sg-cr`, gamepad `.sg-gp`, terminal-boot `.sg-tb`.
- Exemplar of the current comment style: `registry/heroes/gallery-fan/styles.ts:115`.

## Steps

Line numbers are at `617c2fa`. Plan 006 adds lines higher up in some of these same files. If 006 ran first, find each block by its quoted text.

### 1. `registry/heroes/app-window/styles.ts` (lines 119-124)

Replace the six lines quoted under Problem (comment, transition rule, animation rule, the three-line `@media` block) with:

```css
/* ?motion=final, and before the engine has read the mode: no transitions */
.sg-aw:not([data-motion="ready"]):not([data-motion="reduced"]):not([data-motion="off"]) *, .sg-aw:not([data-motion="ready"]):not([data-motion="reduced"]):not([data-motion="off"]) *::before { transition: none !important; }
/* ?motion=final: no animations either. Before the engine runs they stay on, so the reveal fallback can run */
.sg-aw[data-motion="final"] *, .sg-aw[data-motion="final"] *::before { animation: none !important; }
@media (prefers-reduced-motion: reduce) {
	.sg-aw:not([data-motion="ready"]) *, .sg-aw:not([data-motion="ready"]) *::before { animation: none !important; }
}
/* Reduced motion and ?motion=off: nothing moves, colour and opacity still ease */
.sg-aw[data-motion="reduced"] *, .sg-aw[data-motion="reduced"] *::before, .sg-aw[data-motion="reduced"] *::after, .sg-aw[data-motion="off"] *, .sg-aw[data-motion="off"] *::before, .sg-aw[data-motion="off"] *::after { animation: none !important; transition-property: opacity, color, background-color, border-color, fill, stroke !important; }
```

### 2. `registry/heroes/gallery-fan/styles.ts` (lines 115-120)

Replace the six lines quoted under Problem (comment, transition rule, animation rule, the three-line `@media` block) with:

```css
/* ?motion=final, and before the engine has read the mode: no transitions */
.sg-gf:not([data-motion="ready"]):not([data-motion="reduced"]):not([data-motion="off"]) *, .sg-gf:not([data-motion="ready"]):not([data-motion="reduced"]):not([data-motion="off"]) *::before, .sg-gf:not([data-motion="ready"]):not([data-motion="reduced"]):not([data-motion="off"]) *::after { transition: none !important; }
/* ?motion=final: no animations either. Before the engine runs they stay on, so the reveal fallback can run */
.sg-gf[data-motion="final"] *, .sg-gf[data-motion="final"] *::before, .sg-gf[data-motion="final"] *::after { animation: none !important; }
@media (prefers-reduced-motion: reduce) {
	.sg-gf:not([data-motion="ready"]) *, .sg-gf:not([data-motion="ready"]) *::before, .sg-gf:not([data-motion="ready"]) *::after { animation: none !important; }
}
/* Reduced motion and ?motion=off: nothing moves, colour and opacity still ease */
.sg-gf[data-motion="reduced"] *, .sg-gf[data-motion="reduced"] *::before, .sg-gf[data-motion="reduced"] *::after, .sg-gf[data-motion="off"] *, .sg-gf[data-motion="off"] *::before, .sg-gf[data-motion="off"] *::after { animation: none !important; transition-property: opacity, color, background-color, border-color, fill, stroke !important; }
```

### 3. `registry/heroes/bento-tiles/styles.ts` (lines 346-348)

Replace lines 346-347 and keep line 348 (`.sg-bt-marks-scan { display: none; }`) unchanged right after them:

```css
/* ?motion=final: a frozen frame */
.sg-bt[data-motion="final"] *, .sg-bt[data-motion="final"] *::before, .sg-bt[data-motion="final"] *::after { transition: none !important; animation: none !important; }
/* Reduced motion and ?motion=off: nothing moves, colour and opacity still ease */
.sg-bt[data-motion="reduced"] *, .sg-bt[data-motion="reduced"] *::before, .sg-bt[data-motion="reduced"] *::after, .sg-bt[data-motion="off"] *, .sg-bt[data-motion="off"] *::before, .sg-bt[data-motion="off"] *::after { animation: none !important; transition-property: opacity, color, background-color, border-color, fill, stroke !important; }
.sg-bt[data-motion]:not([data-motion="ready"]) .sg-bt-marks-scan { display: none; }
```

### 4. `registry/heroes/trail-map/styles.ts` (lines 167-168)

Replace lines 167-168 with:

```css
/* ?motion=final, and before the engine has read the mode: the route drawn, a frozen frame */
.sg-tm:not([data-motion="ready"]):not([data-motion="reduced"]):not([data-motion="off"]) *, .sg-tm:not([data-motion="ready"]):not([data-motion="reduced"]):not([data-motion="off"]) *::before { transition: none !important; animation: none !important; }
/* Reduced motion and ?motion=off: nothing moves, colour and opacity still ease */
.sg-tm[data-motion="reduced"] *, .sg-tm[data-motion="reduced"] *::before, .sg-tm[data-motion="reduced"] *::after, .sg-tm[data-motion="off"] *, .sg-tm[data-motion="off"] *::before, .sg-tm[data-motion="off"] *::after { animation: none !important; transition-property: opacity, color, background-color, border-color, fill, stroke !important; }
/* The arrows scroll with behavior "auto", which defers to this: jump, don't glide */
.sg-tm[data-motion]:not([data-motion="ready"]) .sg-tm-routes { scroll-behavior: auto; }
```

Do not edit `trail-map/engine.ts:306`. With the CSS override, its `"auto"` branch now jumps as intended.

### 5. `registry/heroes/curve-reel/styles.ts` (lines 129-130)

Replace lines 129-130 with:

```css
/* ?motion=final: a frozen frame */
.sg-cr[data-motion="final"] *, .sg-cr[data-motion="final"] *::before, .sg-cr[data-motion="final"] *::after { transition: none !important; animation: none !important; }
/* Reduced motion and ?motion=off: nothing moves, colour and opacity still ease */
.sg-cr[data-motion="reduced"] *, .sg-cr[data-motion="reduced"] *::before, .sg-cr[data-motion="reduced"] *::after, .sg-cr[data-motion="off"] *, .sg-cr[data-motion="off"] *::before, .sg-cr[data-motion="off"] *::after { animation: none !important; transition-property: opacity, color, background-color, border-color, fill, stroke !important; }
```

### 6. `registry/heroes/gamepad/styles.ts` (lines 219-220)

Replace lines 219-220 with:

```css
/* ?motion=final, and before the engine has read the mode: a frozen frame */
.sg-gp:not([data-motion="ready"]):not([data-motion="reduced"]):not([data-motion="off"]) *, .sg-gp:not([data-motion="ready"]):not([data-motion="reduced"]):not([data-motion="off"]) *::before, .sg-gp:not([data-motion="ready"]):not([data-motion="reduced"]):not([data-motion="off"]) *::after { transition: none !important; animation: none !important; }
/* Reduced motion and ?motion=off: nothing moves, colour and opacity still ease */
.sg-gp[data-motion="reduced"] *, .sg-gp[data-motion="reduced"] *::before, .sg-gp[data-motion="reduced"] *::after, .sg-gp[data-motion="off"] *, .sg-gp[data-motion="off"] *::before, .sg-gp[data-motion="off"] *::after { animation: none !important; transition-property: opacity, color, background-color, border-color, fill, stroke !important; }
```

### 7. `registry/heroes/terminal-boot/styles.ts` (lines 106-111)

Replace the six lines quoted under Problem (comment, transition rule, animation rule, the three-line `@media` block) with:

```css
/* ?motion=final, and before the engine has read the mode: no transitions */
.sg-tb:not([data-motion="ready"]):not([data-motion="reduced"]):not([data-motion="off"]) *, .sg-tb:not([data-motion="ready"]):not([data-motion="reduced"]):not([data-motion="off"]) *::before { transition: none !important; }
/* ?motion=final: no animations either. Before the engine runs they stay on, so the reveal fallback can run */
.sg-tb[data-motion="final"] *, .sg-tb[data-motion="final"] *::before { animation: none !important; }
@media (prefers-reduced-motion: reduce) {
	.sg-tb:not([data-motion="ready"]) *, .sg-tb:not([data-motion="ready"]) *::before { animation: none !important; }
}
/* Reduced motion and ?motion=off: nothing moves, colour and opacity still ease */
.sg-tb[data-motion="reduced"] *, .sg-tb[data-motion="reduced"] *::before, .sg-tb[data-motion="reduced"] *::after, .sg-tb[data-motion="off"] *, .sg-tb[data-motion="off"] *::before, .sg-tb[data-motion="off"] *::after { animation: none !important; transition-property: opacity, color, background-color, border-color, fill, stroke !important; }
```

## Boundaries

- Only the seven kill rules and the one new trail-map `scroll-behavior` rule. Do not touch engines, markup, or any other rule.
- Do not add a kill rule to heroes that have none: beam-grid, conic-rays, marquee-type, split-headline and holo-card. They handle reduced motion in their engines or `@media` queries and are out of scope.
- WebGPU heroes (aurora-mesh, gravity-field, ink-flow, liquid-glass, particle-type, reaction-diffusion) are out of scope. Their canvas freezes by design.
- Keep `final` exactly as frozen as it is today, including the pseudo-element list each hero already had (app-window, trail-map and terminal-boot list only `::before` in the final rule; do not add `::after` there).
- Keep the pre-engine reveal fallbacks of app-window, gallery-fan and terminal-boot running (fixed in `61d6481`): never kill animations for a host without `data-motion`, except under `prefers-reduced-motion: reduce`.
- If a quoted block does not match (drift since `617c2fa`), STOP and report.

## Verification

- **Mechanical**:
  - `pnpm typecheck` from the repo root passes.
  - `grep -n 'data-motion="reduced"' registry/heroes/*/styles.ts` lists exactly seven rules (app-window, gallery-fan, bento-tiles, trail-map, curve-reel, gamepad, terminal-boot), each also naming `data-motion="off"`.
  - `grep -n 'transition: none !important' registry/heroes/*/styles.ts` still lists seven lines. None of them matches `reduced` or `off`.
- **Feel check**: run `pnpm dev`. For each hero, open `http://localhost:3100/heroes/<name>?motion=off`. Then repeat one or two with the OS setting instead: DevTools > Rendering > "Emulate CSS media feature prefers-reduced-motion: reduce", then reload without `?motion`.
  - gallery-fan: move the mouse across the fan, or Tab through the cards, so another card is raised. Its caption **fades** in over about 0.3s and does not slide up. The cards themselves jump to their new places with no glide.
  - curve-reel: hover a card. The caption fades in without rising. Tab through the reel's cards: each focused card **jumps** to the middle with no glide, and the active step's colour and underline fade (about 0.3s).
  - bento-tiles: hover the nav links (opacity eases) and the portrait (the red marks spot fades in). Hover a card: it does **not** lift smoothly (it snaps up 4px, as before) and no logo or folder motion eases.
  - gamepad: click the pad's "Sound" button (the right-hand middle bar). The toast "Button sounds on" fades in and out without sliding up. Press an on-pad arrow: its icon turns white with a short (0.1s) colour ease. The pad does not tilt toward the mouse.
  - trail-map: click the right arrow in the routes strip. The strip **jumps** one card, with no smooth glide. Then open `?motion=ready` (or no param with no reduced-motion emulation) and confirm the arrows still glide.
  - terminal-boot and app-window: everything shows at its final state on load, with no movement.
  - `?motion=final` on each hero: the frame looks exactly as before this change, and hovering produces no eased change at all (everything snaps).
  - In DevTools, Animations panel at 10% with `?motion=off`: only opacity or colour tracks appear. There is never a transform track.
- **Done when**: in `reduced` and `off`, colour and opacity transitions run on their own durations while no transform, translate, clip-path or keyframe animation runs; `final` is unchanged; trail-map's arrows jump outside `ready`; typecheck passes.

## Found, not fixed (report to the plan owner)

- **Dead reveal fallbacks.** Fixed separately in `61d6481` (branch `fix/reveal-fallback`): the kill rules of app-window, gallery-fan and terminal-boot no longer remove the 2.5s reveal fallback before the engine runs. Steps 1, 2 and 7 build on that code.