# 001 — Give four WebGPU heroes their own scene clock that starts where the still frame stands

- **Status**: TODO
- **Commit**: 617c2fa
- **Severity**: HIGH
- **Category**: Cohesion & tokens / Missed opportunities
- **Estimated scope**: 4 files (`registry/heroes/{aurora-mesh,liquid-glass,gravity-field,ink-flow}/engine.ts`), ~5–10 changed lines each

## Problem

### How the runtime starts a WebGPU hero

`packages/core/src/webgpu/mount.ts` warm-starts every live hero: on the first
resize it draws the scene's `still()` frame, and from the next animation frame
on it calls `frame(time, delta, pointer)`.

```ts
// packages/core/src/webgpu/mount.ts:125-127 — current
		if (mode !== "ready") drawStill();
		// Warm start: a live hero begins from its settled still frame instead of an empty canvas.
		else if (firstSize && !destroyed) scene.still();
```

```ts
// packages/core/src/webgpu/mount.ts:105 — current (the live loop)
			stopLoop = addFrame((time, delta) => sized && scene.frame(time, delta, pointer.consume()));
```

`time` comes from the page-wide loop in `packages/core/src/loop.ts`: seconds
since the loop first started on this page, shared by every hero. `delta` is the
time since the previous tick, clamped to 1/30 s. The loop is removed for a
hero while it is off screen (`mount.ts:103-109`), but `time` keeps counting.

The `still()` frame of four heroes draws one moment, and their first live
`frame()` draws a different one. The hero therefore **visibly jumps once,
right after load**, on the element the visitor looks at first. A second jump
happens every time a hero that uses the page-wide `time` comes back on screen:
its picture leaps forward by however long it was off screen.

### A. aurora-mesh: still at t = 18, live starts at t = 0

```ts
// registry/heroes/aurora-mesh/engine.ts:6 — current
const STILL_TIME = 18;
```

```ts
// registry/heroes/aurora-mesh/engine.ts:21-22 — current
	let aspect = 1;
	let clock = 0;
```

```ts
// registry/heroes/aurora-mesh/engine.ts:58-73 — current
		frame(_time, delta, input) {
			const { config } = current();
			clock += delta * config.speed;
			const target = config.pointer && input.inside ? 1 : 0;
			const ease = 1 - Math.exp(-delta * 3);
			pointer.strength += (target - pointer.strength) * ease;
			if (input.inside) {
				pointer.x += (input.x - pointer.x) * ease;
				pointer.y += (input.y - pointer.y) * ease;
			}
			draw(clock);
		},
		still() {
			pointer.strength = 0;
			draw(STILL_TIME);
		},
```

Aurora already has its own clock (advanced by `delta * config.speed`, so it
does not jump when it comes back on screen). Only its starting value is wrong:
the still shows t = 18, the first live frame shows t ≈ 0.

### B. liquid-glass: still at t = 6, live on the page-wide time

```ts
// registry/heroes/liquid-glass/engine.ts:6 — current
const STILL_TIME = 6;
```

```ts
// registry/heroes/liquid-glass/engine.ts:70-71 — current
	let aspect = 1;
	const pointer = { x: 0.5, y: 0.5, strength: 0 };
```

```ts
// registry/heroes/liquid-glass/engine.ts:118-135 — current
	return {
		resize(width, height) {
			aspect = width / height;
		},
		frame(time, delta, input) {
			const goal = current().config.pointer && input.inside ? 1 : 0;
			const ease = 1 - Math.exp(-delta * 6);
			pointer.strength += (goal - pointer.strength) * ease;
			if (input.inside) {
				pointer.x += (input.x - pointer.x) * Math.min(1, ease * 2);
				pointer.y += (input.y - pointer.y) * Math.min(1, ease * 2);
			}
			draw(time);
		},
		still() {
			pointer.strength = 0;
			draw(STILL_TIME);
		},
```

The drops (`idleDrops(time, …)`, deterministic in `time`) sit at their t = 6
positions in the still, then teleport to their page-time positions. Liquid
glass has no `speed` setting, so its clock advances by plain `delta`.

### C. gravity-field: still simulates t = 0…5 s, live uses the page-wide time

```ts
// registry/heroes/gravity-field/engine.ts:7 — current
const STILL_STEPS = 300;
```

```ts
// registry/heroes/gravity-field/engine.ts:39-41 — current
	let aspect = 1;
	let clock = 0;
	const pointer = { x: 0.5, y: 0.5, strength: 0 };
```

```ts
// registry/heroes/gravity-field/engine.ts:122-150 — current
		frame(time, delta, input) {
			const { config } = current();
			if (COUNT[config.detail] !== count) {
				allocate();
				reseed();
			}
			clock = time;
			const target = config.pointer && input.inside ? 1 : 0;
			const ease = 1 - Math.exp(-delta * 4);
			pointer.strength += (target - pointer.strength) * ease;
			if (input.inside) {
				pointer.x = input.x;
				pointer.y = input.y;
			}
			writeSim(clock, delta, idleAttractor(clock));
			dispatch(simulate, groups!.simulate);
			render();
		},
		still() {
			if (COUNT[current().config.detail] !== count) allocate();
			reseed();
			pointer.strength = 0;
			const delta = 1 / 60;
			for (let i = 0; i < STILL_STEPS; i++) {
				writeSim(i * delta, delta, idleAttractor(i * delta));
				dispatch(simulate, groups!.simulate);
			}
			render();
		},
```

The still runs steps at t = 0, 1/60, …, 299/60; the next step should run at
t = 300/60 = 5 s. Live frames instead run at the page-wide `time`, so the
idle attractor (`idleAttractor(time)`, an orbit) jumps to another point of its
orbit on the first live frame and whenever the hero re-enters the viewport.
The particles keep their positions, but the whole swarm suddenly turns toward
the new attractor position.

### D. ink-flow: still simulates t = 0…2.5 s, live uses the page-wide time

```ts
// registry/heroes/ink-flow/engine.ts:18 — current
const STILL_STEPS = 150;
```

```ts
// registry/heroes/ink-flow/engine.ts:118 — current
	let colorIndex = 0;
```

```ts
// registry/heroes/ink-flow/engine.ts:267-280 — current
		frame(time, delta, pointer) {
			const resolved = current();
			const splats = [...(resolved.config.ambient ? ambientSplats(time, delta, resolved, grid) : []), ...pointerSplats(pointer, time, delta)];
			step(delta, splats);
			draw();
		},
		still() {
			// Start from clean fields and play the same few seconds every time.
			allocate();
			const resolved = current();
			const delta = 1 / 60;
			for (let i = 0; i < STILL_STEPS; i++) step(delta, ambientSplats(i * delta, delta, resolved, grid));
			draw();
		},
```

The three ambient emitters (`ambientSplats(time, …)`, orbits deterministic in
`time`) end the still at t = 149/60 and restart live at the page-wide time:
the ink trails break and new trails start somewhere else. `pointerSplats`
also reads `time`, only to cycle the pointer's colour every 0.9 s
(`colorIndex = Math.floor(time / 0.9) % …`, `ink-flow/engine.ts:248`).

## Target

Each of the four scenes keeps **its own scene clock**:

1. It starts at exactly the time the still frame represents.
2. It only advances inside `frame()`, by `delta` (times `config.speed` where
   the hero already has a speed setting: aurora-mesh only). It therefore does
   not advance while the hero is off screen or in a still mode.
3. `still()` sets the clock to the still frame's time, so a still drawn at any
   point (warm start, a still-mode redraw from `invalidate()`, a later switch
   from reduced motion to live) is always continued by the next live frame.
4. The page-wide `time` argument of `frame()` is no longer read by these four
   scenes (rename the parameter to `_time`, as aurora-mesh already does).

Per hero, "the time the still represents":

| Hero | Still draws | Clock after `still()` | First live frame uses |
| --- | --- | --- | --- |
| aurora-mesh | `draw(STILL_TIME)` (18) | `STILL_TIME` | `STILL_TIME + delta * speed` (advance, then draw: unchanged order) |
| liquid-glass | `draw(STILL_TIME)` (6) | `STILL_TIME` | `STILL_TIME + delta` (advance, then draw) |
| gravity-field | steps at `0 … (STILL_STEPS-1)/60` | `STILL_STEPS / 60` (5 s) | simulate at the clock, **then** advance |
| ink-flow | steps at `0 … (STILL_STEPS-1)/60` | `STILL_STEPS / 60` (2.5 s) | splats at the clock, **then** advance |

The two simulations use "use, then advance" so the first live step runs at
exactly the step time that follows the last still step (no skipped or
repeated step). The two shader-only heroes use "advance, then draw" because
that is what aurora already does; one frame of drift between the still and
the first live frame is invisible.

## Repo conventions to follow

- Tabs for indentation; terse comments that say *why*, not *what*.
- Module-level constants in `SCREAMING_CASE` at the top of each engine
  (`STILL_TIME`, `STILL_STEPS`): reuse them, add no new ones.
- Unused frame parameters are prefixed with `_`: exemplar
  `registry/heroes/aurora-mesh/engine.ts:58` `frame(_time, delta, input) {`.
- Exemplar of a scene clock that only advances while live:
  `registry/heroes/aurora-mesh/engine.ts:60` `clock += delta * config.speed;`.
- Engines are framework-free; do not import anything new.
- Code blocks inside the numbered steps are indented by three spaces only
  because they sit in a Markdown list: drop those three spaces; the code
  itself is indented with tabs exactly as in the file.

## Steps

### aurora-mesh (`registry/heroes/aurora-mesh/engine.ts`)

1. Line 22: replace

   ```ts
   	let clock = 0;
   ```

   with

   ```ts
   	// The scene's own time: it starts where the still frame stands, so the warm start flows into live frames.
   	let clock = STILL_TIME;
   ```

2. Lines 70-73: replace the `still()` method

   ```ts
   		still() {
   			pointer.strength = 0;
   			draw(STILL_TIME);
   		},
   ```

   with

   ```ts
   		still() {
   			pointer.strength = 0;
   			clock = STILL_TIME;
   			draw(clock);
   		},
   ```

   Leave `frame()` (lines 58-69) unchanged.

### liquid-glass (`registry/heroes/liquid-glass/engine.ts`)

3. Lines 70-71: replace

   ```ts
   	let aspect = 1;
   	const pointer = { x: 0.5, y: 0.5, strength: 0 };
   ```

   with

   ```ts
   	let aspect = 1;
   	// The scene's own time: it starts where the still frame stands and only runs while the hero is live.
   	let clock = STILL_TIME;
   	const pointer = { x: 0.5, y: 0.5, strength: 0 };
   ```

4. Lines 122-135 (after step 3, two lines lower): replace the `frame()` and
   `still()` methods with

   ```ts
   		frame(_time, delta, input) {
   			const goal = current().config.pointer && input.inside ? 1 : 0;
   			const ease = 1 - Math.exp(-delta * 6);
   			pointer.strength += (goal - pointer.strength) * ease;
   			if (input.inside) {
   				pointer.x += (input.x - pointer.x) * Math.min(1, ease * 2);
   				pointer.y += (input.y - pointer.y) * Math.min(1, ease * 2);
   			}
   			clock += delta;
   			draw(clock);
   		},
   		still() {
   			pointer.strength = 0;
   			clock = STILL_TIME;
   			draw(clock);
   		},
   ```

### gravity-field (`registry/heroes/gravity-field/engine.ts`)

5. Line 40: replace

   ```ts
   	let clock = 0;
   ```

   with

   ```ts
   	// The scene's own time: it starts where the still simulation ends and only runs while the hero is live.
   	let clock = STILL_STEPS / 60;
   ```

6. Lines 122-139: replace the `frame()` method with

   ```ts
   		frame(_time, delta, input) {
   			const { config } = current();
   			if (COUNT[config.detail] !== count) {
   				allocate();
   				reseed();
   				// A freshly seeded swarm is the swarm at time 0.
   				clock = 0;
   			}
   			const target = config.pointer && input.inside ? 1 : 0;
   			const ease = 1 - Math.exp(-delta * 4);
   			pointer.strength += (target - pointer.strength) * ease;
   			if (input.inside) {
   				pointer.x = input.x;
   				pointer.y = input.y;
   			}
   			writeSim(clock, delta, idleAttractor(clock));
   			dispatch(simulate, groups!.simulate);
   			clock += delta;
   			render();
   		},
   ```

   (The line `clock = time;` is removed; `clock += delta;` comes *after* the
   dispatch.)

7. Lines 140-150: replace the `still()` method with

   ```ts
   		still() {
   			if (COUNT[current().config.detail] !== count) allocate();
   			reseed();
   			pointer.strength = 0;
   			const delta = 1 / 60;
   			for (let i = 0; i < STILL_STEPS; i++) {
   				writeSim(i * delta, delta, idleAttractor(i * delta));
   				dispatch(simulate, groups!.simulate);
   			}
   			// Live frames carry on from the step after the last one simulated here.
   			clock = STILL_STEPS * delta;
   			render();
   		},
   ```

### ink-flow (`registry/heroes/ink-flow/engine.ts`)

8. Line 118: replace

   ```ts
   	let colorIndex = 0;
   ```

   with

   ```ts
   	let colorIndex = 0;
   	// The scene's own time: it starts where the still simulation ends and only runs while the hero is live.
   	let clock = STILL_STEPS / 60;
   ```

9. Lines 267-280 (after step 8, two lines lower): replace the `frame()` and
   `still()` methods with

   ```ts
   		frame(_time, delta, pointer) {
   			const resolved = current();
   			const splats = [...(resolved.config.ambient ? ambientSplats(clock, delta, resolved, grid) : []), ...pointerSplats(pointer, clock, delta)];
   			step(delta, splats);
   			clock += delta;
   			draw();
   		},
   		still() {
   			// Start from clean fields and play the same few seconds every time.
   			allocate();
   			const resolved = current();
   			const delta = 1 / 60;
   			for (let i = 0; i < STILL_STEPS; i++) step(delta, ambientSplats(i * delta, delta, resolved, grid));
   			// Live frames carry on from the step after the last one simulated here.
   			clock = STILL_STEPS * delta;
   			draw();
   		},
   ```

   Do not change `pointerSplats` itself: it now simply receives the scene
   clock instead of the page time (its colour cycle keeps working the same).

## Boundaries

- Do NOT touch `packages/core/src/loop.ts` or `packages/core/src/webgpu/mount.ts`:
  the page-wide `time` stays as it is for every other hero.
- Do NOT touch the other WebGPU heroes (particle-type, reaction-diffusion) or
  any shader (`shaders.ts`). Do NOT change `STILL_TIME`, `STILL_STEPS`, or
  how many steps a still runs.
- Do NOT change easing of the pointer, `idleDrops`, `idleAttractor`,
  `ambientSplats`, or what `draw()`/`render()`/`step()` do.
- Do NOT add a speed setting to heroes that do not have one.
- If any quoted "current" block does not match the file (drift since
  `617c2fa`), STOP and report instead of improvising.

## Verification

- **Mechanical**:
  - `pnpm typecheck` from the repo root passes with no new errors.
  - `grep -n "clock = time" registry/heroes/gravity-field/engine.ts` prints nothing.
  - `grep -n "draw(time)" registry/heroes/liquid-glass/engine.ts` prints nothing.
  - `grep -n "ambientSplats(time\|pointerSplats(pointer, time" registry/heroes/ink-flow/engine.ts` prints nothing.
  - `grep -n "let clock" registry/heroes/{aurora-mesh,liquid-glass,gravity-field,ink-flow}/engine.ts` prints exactly four lines.
- **Feel check**: run `pnpm dev` and open each of
  `http://localhost:3100/heroes/aurora-mesh`, `/heroes/liquid-glass`,
  `/heroes/gravity-field`, `/heroes/ink-flow`.
  - Reload each page and watch the hero for the first second: the picture
    that appears first must start drifting smoothly. There must be **no single
    frame where it changes all at once** (bands re-arranging in aurora, drops
    teleporting in liquid glass, the swarm swerving in gravity field, ink
    trails breaking off in ink flow).
  - Slow-motion check: DevTools > Performance, tick "Screenshots", click
    "Start profiling and reload page", stop after ~2 s. In the filmstrip, the
    first frame with the hero drawn and the next few frames must look nearly
    identical, changing gradually.
  - Open the same hero with `?motion=final` in a second tab and compare: the
    live page right after load starts from that same picture.
  - Scroll the hero fully out of view, wait 10 s, scroll back: the picture
    resumes from where it was when it left, with no jump forward.
  - Toggle `prefers-reduced-motion: reduce` (DevTools > Rendering) while the
    page is open, then turn it off again: the still appears, and when motion
    returns it continues from that still without a jump.
  - `?motion=final` and `?motion=off` still show exactly the same frame as
    before this change (the still frames are untouched).
- **Done when**: for all four heroes the first live frame continues the warm
  still frame, returning on screen never skips ahead, typecheck passes, and
  the grep checks above are clean.
