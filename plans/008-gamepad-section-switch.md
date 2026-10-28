# 008 — Gamepad: make the section switch short, ease-out, no overshoot

- **Status**: TODO
- **Commit**: 617c2fa
- **Severity**: MEDIUM
- **Category**: Purpose & frequency / Easing & duration
- **Estimated scope**: 1 file, 2 lines (CSS inside a template string)

## Problem

In the gamepad hero, the screen shows one section at a time. Sections switch
from the on-screen D-pad and A/B/X/Y buttons, from the keyboard (arrow keys,
A/B/X/Y, Esc/Home) and from a physical gamepad. This is navigation the visitor
drives repeatedly, often by keyboard, so the response must be near-instant.
Today each switch plays a 320ms entrance on a curve that overshoots
(`cubic-bezier(.2,.9,.3,1.2)`, y = 1.2), plus a scale-up from `.98`: it feels
slow and wobbly for something pressed over and over.

Current code, verbatim:

```css
/* registry/heroes/gamepad/styles.ts:45-53 — current */
/* Screen: the sections, one at a time */
.sg-gp-screen { display: grid; place-items: center; text-align: center; width: 100%; max-width: 760px; min-height: 230px; }
.sg-gp [data-sg-slide] { grid-area: 1 / 1; display: flex; flex-direction: column; align-items: center; gap: 14px; }
.sg-gp[data-ready] [data-sg-slide]:not(.is-current) { display: none; }
@media (scripting: enabled) {
	.sg-gp:not([data-ready]) [data-sg-slide]:not([data-sg-slide="home"]) { display: none; }
}
.sg-gp[data-ready] [data-sg-slide].is-current { animation: sg-gp-in .32s cubic-bezier(.2,.9,.3,1.2); }
@keyframes sg-gp-in { from { opacity: 0; transform: translateY(10px) scale(.98); } }
```

How switching works (do not change):

```ts
// registry/heroes/gamepad/engine.ts:228-236 — current
	const show = (key: Key | "home") => {
		if (key !== "home" && !byKey.has(key)) return;
		if (key === current) key = "home";
		current = key;
		for (const slide of slides) slide.classList.toggle("is-current", key === "home" ? slide === home : slide === byKey.get(key)?.slide);
		…
```

Non-current slides are hidden with `display: none` (`styles.ts:48`), so the
outgoing section vanishes instantly and the incoming one goes from
`display: none` to shown; that is what restarts the `sg-gp-in` keyframe on
every switch. A keyframe is correct here on purpose: each switch shows a
*different* section entering (there is no single element to retarget), so
restarting from zero is the right behaviour. Only the duration, curve and
travel are wrong. Keyboard entry points: `engine.ts:262-268` (`press` →
`show`), keymap at `engine.ts:292`, keydown at `engine.ts:303-315`.

## Target

```css
/* registry/heroes/gamepad/styles.ts:52-53 — target */
.sg-gp[data-ready] [data-sg-slide].is-current { animation: sg-gp-in 180ms cubic-bezier(0.23, 1, 0.32, 1); }
@keyframes sg-gp-in { from { opacity: 0; transform: translateY(6px); } }
```

- Duration 180ms (frequent, keyboard-driven UI stays well under 300ms).
- Strong ease-out `cubic-bezier(0.23, 1, 0.32, 1)`: no overshoot.
- Travel reduced to `translateY(6px)`, no `scale`.
- Keep it a `@keyframes` animation (see Problem for why).

## Repo conventions to follow

- CSS lives in a template string in each hero's `styles.ts`; tabs; terse "why" comments.
- No shared easing tokens: write the cubic-bezier inline.
- Reduced motion is already handled by
  `registry/heroes/gamepad/styles.ts:219-220`
  (`.sg-gp:not([data-motion="ready"]) * … { transition: none !important; animation: none !important; }`);
  do not add anything.

## Steps

1. In `registry/heroes/gamepad/styles.ts`, line 52, replace
   `animation: sg-gp-in .32s cubic-bezier(.2,.9,.3,1.2);`
   with
   `animation: sg-gp-in 180ms cubic-bezier(0.23, 1, 0.32, 1);`.
2. On line 53, replace
   `@keyframes sg-gp-in { from { opacity: 0; transform: translateY(10px) scale(.98); } }`
   with
   `@keyframes sg-gp-in { from { opacity: 0; transform: translateY(6px); } }`.
3. Optional terse comment directly above line 52 (same indentation, none):
   `/* Pressed often: a short settle, restarted for each section */`.

## Boundaries

- Do NOT touch `registry/heroes/gamepad/engine.ts`.
- Do NOT change how slides are hidden (`styles.ts:48-51`) or turn this into a transition/crossfade.
- Do NOT touch the controller's button press styles, `.sg-gp-face.is-current`
  (`styles.ts:156-157`) or `.sg-gp-cta:active` (`:72`).
- Do NOT change markup/structure; do NOT add dependencies.
- If lines 52-53 don't match the "current" code above (drift since 617c2fa), STOP and report.

## Verification

- **Mechanical**: from the repo root, `pnpm typecheck` passes.
  `grep -n "1.2)" registry/heroes/gamepad/styles.ts` no longer matches the `sg-gp-in` line;
  `grep -n "sg-gp-in" registry/heroes/gamepad/styles.ts` shows exactly the two target lines.
- **Feel check**: `pnpm dev`, open http://localhost:3100/heroes/gamepad.
  - Click into the hero, then press arrow keys / A, B, X, Y rapidly: every
    section appears essentially at once with a tiny upward settle; it never
    feels like you are waiting for it, and nothing bounces past its rest position.
  - Press the same letter twice: it returns to home with the same short settle.
  - Press Esc: back to home, same.
  - Hold an arrow key / mash keys: no sluggish, stacked feeling; each press
    shows the new section immediately.
  - In DevTools Animations panel at 10%: the section rises 6px and fades in,
    with no scale change and no overshoot; the curve decelerates into rest.
  - http://localhost:3100/heroes/gamepad?motion=final and `?motion=off`:
    switching sections shows them instantly with no animation (unchanged).
  - Toggle `prefers-reduced-motion: reduce` (Rendering panel), reload: no animation on switch.
- **Done when**: lines 52-53 match the target exactly, typecheck passes, and
  keyboard switching feels instant with no overshoot.
