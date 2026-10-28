# 002 — Trail map stops: light up from scale(0.9), not from nothing with a bounce

- **Status**: TODO
- **Commit**: 617c2fa
- **Severity**: HIGH
- **Category**: Physicality & origin
- **Estimated scope**: 1 file, 2 lines (CSS inside a template string)

## Problem

During the trail map's entrance, each stop on the route (white dots on the SVG
trail) grows from `scale(0)` with an overshooting curve (`cubic-bezier(.3, 1.6, .5, 1)`,
second control point y = 1.6). Two issues:

1. Nothing in the real world appears from nothing; `scale(0)` reads as a dot
   being inflated, not a stop "lighting up" as the route passes.
2. It is the only bouncy curve in the whole collection of heroes, so this one
   element breaks the crisp, calm personality every other hero has. The opacity
   part uses the bare `ease` default (`.3s` with no curve).

Current code, verbatim:

```css
/* registry/heroes/trail-map/styles.ts:75 — current */
.sg-tm-stop { fill: #fff; stroke: rgb(0 0 0 / .18); stroke-width: .25; transform-box: fill-box; transform-origin: center; transition: transform .45s cubic-bezier(.3, 1.6, .5, 1), opacity .3s; transition-delay: var(--at, 0ms); }
```

```css
/* registry/heroes/trail-map/styles.ts:76 — current */
.sg-tm[data-intro="pending"] .sg-tm-stop { transform: scale(0); opacity: 0; }
```

How it is driven (do not change): `registry/heroes/trail-map/engine.ts:183` and
`:185` render each `<circle class="sg-tm-stop" ... style="--at:…ms"/>` with a
per-stop delay; `engine.ts:258` switches `host.dataset.intro` from `"pending"`
to `"drawing"`, which makes the stops transition from the pending state to rest,
each one delayed by `--at` so it lights when the route reaches it. Nothing in
`engine.ts` reads or writes the stops' `transform` or depends on `scale(0)`
(checked: the only `sg-tm-stop` references in the engine are the two markup
lines above).

## Target

```css
/* registry/heroes/trail-map/styles.ts:75 — target */
.sg-tm-stop { fill: #fff; stroke: rgb(0 0 0 / .18); stroke-width: .25; transform-box: fill-box; transform-origin: center; transition: transform 450ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms cubic-bezier(0.23, 1, 0.32, 1); transition-delay: var(--at, 0ms); }
```

```css
/* registry/heroes/trail-map/styles.ts:76 — target */
.sg-tm[data-intro="pending"] .sg-tm-stop { transform: scale(0.9); opacity: 0; }
```

- Curve: strong ease-out `cubic-bezier(0.23, 1, 0.32, 1)` for both properties (no overshoot).
- Durations: transform 450ms, opacity 300ms (unchanged lengths).
- `transition-delay: var(--at, 0ms);` stays exactly as it is.
- `transform-box: fill-box; transform-origin: center;` stay: a dot on a map is
  correctly centred on its own point.

## Repo conventions to follow

- CSS lives in a template string in each hero's `styles.ts`; one rule per line
  for short rules like these. Tabs for indentation.
- There are no shared easing tokens in this repo: write the cubic-bezier inline.
- Exemplar of a non-bouncy entrance curve already in the repo:
  `registry/heroes/trail-map/styles.ts:68` (`transition: transform .5s cubic-bezier(.2, .8, .2, 1);`).
- Reduced motion is already handled for this hero by
  `registry/heroes/trail-map/styles.ts:168`
  (`.sg-tm:not([data-motion="ready"]) *, … { transition: none !important; animation: none !important; }`);
  do not add anything for it.

## Steps

1. Open `registry/heroes/trail-map/styles.ts`. On line 75, in the `.sg-tm-stop`
   rule, replace exactly
   `transition: transform .45s cubic-bezier(.3, 1.6, .5, 1), opacity .3s;`
   with
   `transition: transform 450ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);`.
   Leave every other declaration on that line untouched.
2. On line 76, replace `transform: scale(0);` with `transform: scale(0.9);`.
   Keep `opacity: 0;`.
3. Do not add a comment unless you want a terse one; if you do, keep it to
   `/* Stops light up as the route passes: a short fade from 0.9, no bounce */`
   on its own line directly above line 75.

## Boundaries

- Do NOT touch `registry/heroes/trail-map/engine.ts` (delays, markup, `DRAW_MS`).
- Do NOT change `.sg-tm-pin-glow` / `@keyframes sg-tm-pulse` (line 78-79): its
  `scale(.6)`→`scale(2.2)` is an ambient pulse ring, not an entrance; out of scope.
- Do NOT touch `.sg-tm-reveal` (route draw, lines 73-74) or any other rule.
- Do NOT change markup/structure — motion properties only.
- Do NOT add dependencies, tokens or new files.
- If lines 75-76 don't match the "current" code quoted above (drift since
  commit 617c2fa), STOP and report instead of improvising.

## Verification

- **Mechanical**: from the repo root, `pnpm typecheck` passes with no new errors.
  `grep -n "scale(0)" registry/heroes/trail-map/styles.ts` returns nothing.
  `grep -n "1.6" registry/heroes/trail-map/styles.ts` no longer matches the stop rule.
- **Feel check**: run `pnpm dev`, open http://localhost:3100/heroes/trail-map,
  scroll so the map is at least 30% visible (the entrance triggers then; reload to replay).
  - As the white route draws, each stop appears at the moment the line reaches
    it — fading in while settling up slightly — and never overshoots (no dot
    momentarily larger than its final size).
  - The stops do not "inflate from a pinpoint"; they arrive near full size.
  - In DevTools, Animations panel, set playback to 10% and replay: each stop's
    scale curve starts fast and decelerates into rest, with no rebound past 1.0.
  - The final stop (larger dot at the route's end, `--at` = full draw time)
    still lights last, in step with the badge appearing.
  - Open http://localhost:3100/heroes/trail-map?motion=final and `?motion=off`:
    the stops are visible at full size and opacity immediately, no motion.
  - Toggle `prefers-reduced-motion: reduce` (Rendering panel) and reload:
    stops are shown at rest, nothing animates (existing behaviour, unchanged).
- **Done when**: lines 75-76 equal the target above exactly, typecheck passes,
  and slow-motion playback shows no overshoot.
