# 005 — Remove CSS transitions that double-smooth values already eased per frame in JS

- **Status**: TODO
- **Commit**: 617c2fa
- **Severity**: MEDIUM
- **Category**: Interruptibility
- **Estimated scope**: 2 files, 1 line each (CSS inside template strings)

## Problem

Two heroes run a requestAnimationFrame loop that already eases a value toward
its target every frame (exponential smoothing), and then *also* put a CSS
transition on the property that value is written to. Each frame the JS writes a
new, already-smoothed value, and the CSS transition restarts toward it, so the
element trails behind its own animation (a lag stacked on a lag). Motion must
have one source of smoothing: here, the JS loop.

### A. app-window: panels lag the window's tilt

```css
/* registry/heroes/app-window/styles.ts:105-107 — current */
/* Building: panels wait lowered and faded, then arrive in order */
[data-sg-panel] { transition: opacity .55s ease-out, transform .7s cubic-bezier(.2, .9, .25, 1), translate .18s ease-out; }
.sg-aw[data-build] [data-sg-panel]:not(.is-built) { opacity: 0; transform: translateY(1.2em) scale(.98); }
```

```ts
// registry/heroes/app-window/engine.ts:182-186 — current (writes `translate` every frame)
		panels.forEach((panel, index) => {
			const depth = depths[index];
			if (!depth) return;
			panel.style.translate = `${((current.x - 0.5) * depth * 7).toFixed(2)}px ${((current.y - 0.5) * depth * 5).toFixed(2)}px`;
		});
```

```ts
// registry/heroes/app-window/engine.ts:189-196 — current (the per-frame easing)
	const frame = (_time: number, delta: number) => {
		const ease = 1 - Math.exp(-delta * 7);
		let moving = false;
		for (const key of Object.keys(target) as (keyof typeof target)[]) {
			const gap = target[key] - current[key];
			current[key] += gap * ease;
			if (Math.abs(gap) > 0.01) moving = true;
		}
```

The window's tilt (`--rx`/`--ry`, written in the same `paint()`) has no CSS
transition, while the panels' `translate` has `.18s ease-out` on top of the same
eased `current` values. Result: the window leans and the panels arrive ~180ms
behind it, so the depth parallax smears instead of moving as one rigid object.

The `opacity` and `transform` parts of that transition are needed: they drive
the build entrance (`.is-built` toggled in `engine.ts:141`). Only `translate`
is wrong. `translate` and `transform` are separate CSS properties, so removing
the `translate` transition does not affect the build.

### B. split-headline: the letter lift lags its colour

```css
/* registry/heroes/split-headline/styles.ts:54-61 — current */
.sg-sh-char {
	--p: 0; --ix: 0; --iy: 0; --ir: 0;
	display: inline-block;
	transform: translate3d(calc(var(--ix) * 1em), calc(var(--iy) * 1em - var(--p) * .09em), 0) rotate(calc(var(--ir) * 1deg)) scale(calc(1 + var(--p) * .07));
	color: color-mix(in oklab, var(--sg-sh-accent) calc(var(--p) * 100%), var(--sg-sh-ink));
	-webkit-text-stroke: calc(var(--p) * .022em) currentColor;
	transition: transform .14s ease-out;
}
```

```ts
// registry/heroes/split-headline/engine.ts:144 and :154-158 — current
		const ease = 1 - Math.exp(-delta * 10);
		…
			letter.p += (target - letter.p) * ease;
			if (Math.abs(letter.p - letter.written) > 0.004) {
				letter.written = letter.p;
				letter.node.style.setProperty("--p", letter.p.toFixed(3));
			}
```

`--p` is already smoothed per frame. `color` and `-webkit-text-stroke` follow
`--p` instantly (no transition), but `transform` follows it through an extra
`.14s ease-out`, so as the pointer sweeps the headline the accent colour leads
and the lift/scale trails behind it.

**Does the entrance need the base transition? No.** The entrance has its own
transition, scoped to the intro state, which overrides the base one by
specificity while it plays:

```css
/* registry/heroes/split-headline/styles.ts:63-71 — current (keep as is) */
/* Entrance: letters wait away from home, then come back one after another */
.sg-sh[data-intro="pending"] .sg-sh-char { --ix: var(--sx); --iy: var(--sy); --ir: var(--sr); opacity: 0; filter: blur(.06em); }
.sg-sh[data-intro="play"] .sg-sh-char {
	transition:
		transform .9s cubic-bezier(.2, .9, .25, 1.05) calc(var(--i) * var(--sg-sh-stagger)),
		opacity .5s ease-out calc(var(--i) * var(--sg-sh-stagger)),
		filter .6s ease-out calc(var(--i) * var(--sg-sh-stagger));
}
.sg-sh[data-intro-style="type"][data-intro="play"] .sg-sh-char { transition: opacity .01s linear calc(var(--i) * var(--sg-sh-stagger) * 2.2); }
```

The engine goes `pending` → `play` (`engine.ts:182`) → `done` (`engine.ts:184`)
and only starts the pointer loop after `done` (`arrived = true`, `engine.ts:185-187`).
At `play` → `done` every letter is already at rest, so dropping the base
transition changes nothing visible there. The base transition only ever applied
to the steady-state pointer/idle-wave motion, which is the double smoothing.

## Target

A. app-window — `registry/heroes/app-window/styles.ts:106`:

```css
/* target */
[data-sg-panel] { transition: opacity .55s ease-out, transform .7s cubic-bezier(.2, .9, .25, 1); }
```

B. split-headline — `registry/heroes/split-headline/styles.ts:54-61`:

```css
/* target */
.sg-sh-char {
	--p: 0; --ix: 0; --iy: 0; --ir: 0;
	display: inline-block;
	transform: translate3d(calc(var(--ix) * 1em), calc(var(--iy) * 1em - var(--p) * .09em), 0) rotate(calc(var(--ir) * 1deg)) scale(calc(1 + var(--p) * .07));
	color: color-mix(in oklab, var(--sg-sh-accent) calc(var(--p) * 100%), var(--sg-sh-ink));
	-webkit-text-stroke: calc(var(--p) * .022em) currentColor;
	/* No transition: --p is eased per frame by the engine; the entrance has its own below. */
}
```

Everything else in both files stays byte-identical (in particular
split-headline lines 63-71, the intro-scoped transitions).

## Repo conventions to follow

- CSS lives in a template string in each hero's `styles.ts`; tabs for indentation; terse "why" comments.
- No shared easing tokens exist; curves are written inline (none are added here).
- Exemplar of "JS eases, CSS does not transition": app-window's own window
  tilt — `--rx`/`--ry` are written in `registry/heroes/app-window/engine.ts:178-179`
  and have no CSS transition. The panels should behave the same way.

## Steps

1. In `registry/heroes/app-window/styles.ts`, line 106, delete exactly
   `, translate .18s ease-out` (including the leading comma and space) so the
   line reads:
   `[data-sg-panel] { transition: opacity .55s ease-out, transform .7s cubic-bezier(.2, .9, .25, 1); }`
2. In `registry/heroes/split-headline/styles.ts`, line 60, replace the line
   `	transition: transform .14s ease-out;`
   with
   `	/* No transition: --p is eased per frame by the engine; the entrance has its own below. */`
   (one tab of indentation, same as the surrounding declarations).
3. Do not edit split-headline lines 63-71 or any engine file.

## Boundaries

- Do NOT touch `registry/heroes/app-window/engine.ts` or `registry/heroes/split-headline/engine.ts`
  (the easing rates `delta * 7` / `delta * 10` stay).
- Do NOT touch the build rules in app-window (`styles.ts:107-118`) or the
  `.sg-aw:not([data-motion="ready"])` kill rule (`styles.ts:119`).
- Do NOT touch the split-headline intro rules (`styles.ts:63-82`) or `.sg-sh-cta` (`:45-46`).
- Do NOT change markup/structure; do NOT add dependencies.
- If the quoted "current" lines don't match what you find (drift since 617c2fa),
  STOP and report instead of improvising.

## Verification

- **Mechanical**: from the repo root, `pnpm typecheck` passes.
  `grep -n "translate .18s" registry/heroes/app-window/styles.ts` returns nothing.
  `grep -n "transform .14s" registry/heroes/split-headline/styles.ts` returns nothing.
  `grep -n 'data-intro="play"' registry/heroes/split-headline/styles.ts` still returns lines 65 and 71.
- **Feel check — app-window**: `pnpm dev`, open http://localhost:3100/heroes/app-window.
  Wait for the panels to build in (they still rise and fade in, one after another,
  exactly as before). Then move the pointer briskly across the window and stop.
  - The panels shift in lockstep with the window's lean; when the pointer stops,
    window and panels settle at the same moment (no panel still drifting after the window is still).
  - Leave the hero: window and panels ease back to rest together.
  - In DevTools Animations panel at 10%, moving the pointer shows no CSS
    transition entries for `translate` on `[data-sg-panel]`.
- **Feel check — split-headline**: open http://localhost:3100/heroes/split-headline.
  - Entrance: the letters still fly in from their scattered positions, staggered,
    with the same timing as before (reload a few times; try with the hero's
    `intro` config set to rise / type if the page exposes it).
  - After the entrance, sweep the pointer across the headline: each letter's
    lift and scale move together with its accent colour — no letter turns accent
    and only then rises. Fast sweeps stay smooth (the JS easing does the work).
  - Leave the pointer outside: the idle wave crossing the headline every ~7s lifts
    and colours letters together.
- **Reduced / frozen**: http://localhost:3100/heroes/app-window?motion=final and
  `?motion=off`, and the same for `/heroes/split-headline`: both show the final
  state at rest, nothing moves (unchanged behaviour). Toggle `prefers-reduced-motion: reduce`
  in the Rendering panel and reload: same.
- **Done when**: both lines match the target, typecheck passes, and the
  feel checks show colour/lift and window/panels moving as one.
