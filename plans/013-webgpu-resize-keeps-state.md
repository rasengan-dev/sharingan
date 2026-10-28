# 013 — After a resize, bring wiped WebGPU scenes back settled instead of restarting them

- **Status**: TODO
- **Commit**: 617c2fa
- **Severity**: MEDIUM
- **Category**: Performance / feel (Missed opportunities)
- **Estimated scope**: 4 files: `packages/core/src/webgpu/mount.ts` (~15 lines), `registry/heroes/ink-flow/engine.ts` (2 lines), `registry/heroes/reaction-diffusion/engine.ts` (2 lines), `registry/heroes/particle-type/engine.ts` (1 line)
- **Depends on**: plan 001 (must be executed first). Plan 010 and plan 012 are independent but touch the same files: if they were executed first, line numbers below have shifted; find the code by the quoted text.

## Problem

`packages/core/src/webgpu/mount.ts` resizes the scene on every canvas size
change, but in live (`ready`) mode it only draws a settled `still()` frame for
the **first** size:

```ts
// packages/core/src/webgpu/mount.ts:113-128 — current
	// Size in device pixels, capped: a 4K screen does not need a 4K fluid.
	const resizeObserver = new ResizeObserver(() => {
		const ratio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
		const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
		const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
		if (sized && width === canvas.width && height === canvas.height) return;
		canvas.width = width;
		canvas.height = height;
		const firstSize = !sized;
		scene.resize(width, height);
		sized = true;
		stillIsCurrent = false;
		if (mode !== "ready") drawStill();
		// Warm start: a live hero begins from its settled still frame instead of an empty canvas.
		else if (firstSize && !destroyed) scene.still();
	});
```

Three heroes throw their picture away in `resize()`, so any later resize
(window resize, phone rotation, browser zoom, a layout shift) is a hard
visual reset:

```ts
// registry/heroes/ink-flow/engine.ts:263-266 — current
		resize(width, height) {
			canvasSize = [width, height];
			allocate();
		},
```

`allocate()` (`ink-flow/engine.ts:145-162`) destroys and recreates every
field texture: all the ink is gone and the canvas shows the bare background;
the ambient emitters need seconds to refill it.

```ts
// registry/heroes/reaction-diffusion/engine.ts:123-127 — current
		resize(width, height) {
			canvasSize = [width, height];
			allocate();
			reseed();
		},
```

The grown pattern is replaced by the seed and starts growing from scratch
(the still shows 2400 steps of growth; live growth takes ~4 s at default
speed to get back there).

```ts
// registry/heroes/particle-type/engine.ts:186-189 — current
		resize(width, height) {
			aspect = width / height;
			rebuild(false);
		},
```

`rebuild(false)` puts every particle at a random position
(`particle-type/engine.ts:109-110`: `data[o] = settled ? hx : Math.random();`),
so the headline explodes into noise on every resize event, and during a
drag-resize it stays exploded, re-scattered on every event.

### What each WebGPU hero's `still()` does and costs (checked)

| Hero | `resize()` loses the picture? | `still()` does | Cost of `still()` | Run `still()` after resize? |
| --- | --- | --- | --- | --- |
| aurora-mesh | No (only `aspect`) | one full-screen draw at `STILL_TIME` | trivial | **No**: with plan 001, `still()` resets the scene clock to `STILL_TIME`, so it would rewind the bands: a new jump where there is none today |
| liquid-glass | No (only `aspect`) | one draw at `STILL_TIME` | trivial | **No**: same rewind as aurora (drops teleport back to t = 6) |
| gravity-field | No (`aspect` only; particles keep their positions) | reseed + 300 compute steps over 40k–240k particles, 300 submits, + draw | moderate (300 submits on the CPU side) | **No**: it would reseed and replay the swarm, replacing a continuous picture with a different one |
| ink-flow | **Yes** (`allocate()`) | `allocate()` + 150 steps (≈29 dispatches each, ≤224×~126 grid) + draw | moderate, same work as the warm start on load | **Yes** |
| reaction-diffusion | **Yes** (`allocate()` + `reseed()`) | `allocate()` + `reseed()` + 2400 steps in 12 submits (≤384×~216 grid) + draw | the heaviest: a hitch of a few to a few tens of ms on a weak GPU, same work as the warm start on load | **Yes**, debounced (see Target): acceptable once after resizing stops, far too expensive per resize event |
| particle-type | **Yes** (`rebuild(false)` scatters) | `rebuild(true)` (re-samples the headline: `getImageData` over a canvas-sized offscreen canvas, ~10–20 ms CPU) + 120 steps + draw | moderate, mostly CPU | **No**: fix `resize()` itself instead (rebuild settled). A delayed `still()` would snap particles mid-flight, and would re-sample the headline a second time |

So calling `scene.still()` after every resize for **all** scenes, as first
proposed, would regress aurora-mesh, liquid-glass and gravity-field. The
still-after-resize must be opt-in per scene.

## Target

1. `Scene` (in `mount.ts`) gets one optional flag:
   `stillAfterResize?: boolean`. A scene sets it when its `resize()` wipes its
   picture.
2. In `ready` mode, after a non-first resize of a scene with
   `stillAfterResize`, mount calls `scene.still()` once resizing has settled:
   a **trailing debounce of 150 ms** (one timer per mounted scene; every new
   resize restarts it; it is cleared in `destroy()`). When the timer fires it
   does nothing if the scene was destroyed or the mode is no longer `ready`
   (still modes already redraw their still through `drawStill()`).
3. ink-flow and reaction-diffusion set `stillAfterResize: true`.
4. particle-type's `resize()` rebuilds settled (`rebuild(true)`): the
   headline stays formed at its new layout on every resize event, no flag.
5. aurora-mesh, liquid-glass and gravity-field are untouched.

Expected feel: during a continuous drag-resize, ink-flow shows fresh, thin
ink and reaction-diffusion a fresh seed (as today); 150 ms after the last size
change, the settled picture appears in one step and live frames continue from
it. A single rotation/zoom therefore shows the reset for ~150 ms instead of
for seconds. (A cross-fade between the two would need extra textures: out of
scope.)

Why the dependency on plan 001: after plan 001, ink-flow's `still()` sets its
scene clock to `STILL_STEPS / 60`, so the live ambient emitters continue the
settled still exactly. Without plan 001, live frames would read the page-wide
`time` and the emitters would jump right after every settle. reaction-diffusion
has no clock; if plan 010 is applied, its `reseed()` (called by `still()`)
also resets the step budget, which is what we want.

## Repo conventions to follow

- Tabs for indentation; terse comments that explain *why*.
- Module-level constants in `SCREAMING_CASE` near the top of the file
  (e.g. `const MAX_DELTA = 1 / 30;` with a why-comment in
  `packages/core/src/loop.ts:9-10`).
- Optional members of `Scene` are documented with a `/** … */` comment, like
  the existing members (`packages/core/src/webgpu/mount.ts:8-16`).
- Teardown lives in `destroy()` in `mount.ts:147-159`; every resource created
  in `mountScene` is released there.
- Code blocks in the steps are indented three spaces only because they sit in
  a Markdown list: drop those three spaces; the code is indented with tabs.

## Steps

### packages/core/src/webgpu/mount.ts

1. Lines 7-16: replace the `Scene` interface

   ```ts
   /** What a hero's renderer gives the runtime. Everything else is shared. */
   export interface Scene {
   	/** The canvas changed size, in device pixels. */
   	resize(width: number, height: number): void;
   	/** Advance by `delta` seconds and draw. */
   	frame(time: number, delta: number, pointer: PointerState): void;
   	/** Draw one repeatable still frame (reduced motion, screenshots, posters). */
   	still(): void;
   	destroy(): void;
   }
   ```

   with

   ```ts
   /** What a hero's renderer gives the runtime. Everything else is shared. */
   export interface Scene {
   	/** The canvas changed size, in device pixels. */
   	resize(width: number, height: number): void;
   	/** Advance by `delta` seconds and draw. */
   	frame(time: number, delta: number, pointer: PointerState): void;
   	/** Draw one repeatable still frame (reduced motion, screenshots, posters). */
   	still(): void;
   	destroy(): void;
   	/**
   	 * `resize()` wipes this scene's picture (its simulation restarts): once
   	 * resizing settles, a live hero redraws its still and continues from it.
   	 */
   	stillAfterResize?: boolean;
   }
   ```

2. Below the imports (after line 5,
   `import { trackPointer, type PointerState } from "../pointer";`), add a
   blank line and

   ```ts
   // A drag-resize fires on every frame: replaying a still on each would stall the page.
   const RESIZE_SETTLE_MS = 150;
   ```

3. Lines 95-101 (the `stillIsCurrent` / `drawStill` block): directly after

   ```ts
   	const drawStill = () => {
   		if (destroyed || !sized || stillIsCurrent) return;
   		scene.still();
   		stillIsCurrent = true;
   	};
   ```

   add

   ```ts
   	// Scenes that lose their picture on resize settle again once the size stops changing.
   	let settleTimer = 0;
   	const settle = () => {
   		if (!destroyed && mode === "ready") scene.still();
   	};
   ```

4. In the `ResizeObserver` callback (lines 125-127), replace

   ```ts
   		if (mode !== "ready") drawStill();
   		// Warm start: a live hero begins from its settled still frame instead of an empty canvas.
   		else if (firstSize && !destroyed) scene.still();
   	});
   ```

   with

   ```ts
   		if (mode !== "ready") drawStill();
   		// Warm start: a live hero begins from its settled still frame instead of an empty canvas.
   		else if (firstSize && !destroyed) scene.still();
   		else if (scene.stillAfterResize) {
   			clearTimeout(settleTimer);
   			settleTimer = window.setTimeout(settle, RESIZE_SETTLE_MS);
   		}
   	});
   ```

5. In `destroy()` (lines 147-159), replace

   ```ts
   		stopLoop?.();
   		stopLoop = null;
   		resizeObserver.disconnect();
   ```

   with

   ```ts
   		stopLoop?.();
   		stopLoop = null;
   		clearTimeout(settleTimer);
   		resizeObserver.disconnect();
   ```

### registry/heroes/ink-flow/engine.ts

6. Line 262-263: replace

   ```ts
   	return {
   		resize(width, height) {
   			canvasSize = [width, height];
   			allocate();
   		},
   ```

   with

   ```ts
   	return {
   		// resize() reallocates the fields: the ink is gone until the still replays it.
   		stillAfterResize: true,
   		resize(width, height) {
   			canvasSize = [width, height];
   			allocate();
   		},
   ```

### registry/heroes/reaction-diffusion/engine.ts

7. Lines 122-127: replace

   ```ts
   	return {
   		resize(width, height) {
   			canvasSize = [width, height];
   			allocate();
   			reseed();
   		},
   ```

   with

   ```ts
   	return {
   		// resize() reseeds the pattern: the grown picture is gone until the still replays it.
   		stillAfterResize: true,
   		resize(width, height) {
   			canvasSize = [width, height];
   			allocate();
   			reseed();
   		},
   ```

### registry/heroes/particle-type/engine.ts

8. Lines 186-189 (lower if plan 012 was applied first): replace

   ```ts
   		resize(width, height) {
   			aspect = width / height;
   			rebuild(false);
   		},
   ```

   with

   ```ts
   		resize(width, height) {
   			aspect = width / height;
   			// Keep the headline formed at its new layout: scattering on every resize reads as a reset.
   			rebuild(true);
   		},
   ```

   Leave `rebuild(settled: boolean)` and its parameter as they are.

## Boundaries

- Do NOT set `stillAfterResize` on aurora-mesh, liquid-glass or
  gravity-field (see the table: it would rewind or reseed them).
- Do NOT change any hero's `still()`, `STILL_*` constants, shaders, or
  `allocate()`/`reseed()`/`rebuild()`.
- Do NOT change the first-size warm start, `drawStill()`, `invalidate()`, the
  visibility or motion-preference handling in `mount.ts`.
- Do NOT touch `packages/core/src/loop.ts`, `hero.ts`, or the React/element
  wrappers. No new dependencies.
- Execute plan 001 before this one. If any quoted "current" block does not
  match the file beyond the line shifts noted at the top, STOP and report.

## Verification

- **Mechanical**:
  - `pnpm typecheck` from the repo root passes.
  - `grep -rn "stillAfterResize" packages/core/src registry/heroes` prints
    the interface member, the check in `mount.ts`, and one line each in
    `ink-flow/engine.ts` and `reaction-diffusion/engine.ts`: nothing else.
  - `grep -n "rebuild(false)" registry/heroes/particle-type/engine.ts`
    prints nothing.
  - `grep -n "clearTimeout(settleTimer)" packages/core/src/webgpu/mount.ts`
    prints two lines (resize callback and `destroy()`).
- **Feel check**: run `pnpm dev`.
  - `http://localhost:3100/heroes/ink-flow`: wait until the ink is dense,
    then resize the window once (or toggle DevTools docked to the side). The
    canvas shows thin, fresh ink for a moment, and ~150 ms after the size
    stops changing the full settled ink appears and keeps flowing without a
    jump in where the emitters are. Drag-resize continuously for a few
    seconds: the page stays responsive during the drag; the settled picture
    appears once, after you let go.
  - `/heroes/reaction-diffusion`: same check: after a resize the fully grown
    pattern comes back ~150 ms after resizing stops, instead of regrowing
    from the seed for seconds. Note any hitch when it lands: one short pause
    right after a resize is acceptable, repeated pauses during a drag are not.
  - `/heroes/particle-type`: resize the window and zoom with Ctrl/Cmd +/−:
    the headline stays readable as particles at every size, never bursting
    into random noise. Cursor scatter still works afterwards.
  - `/heroes/aurora-mesh`, `/heroes/liquid-glass`, `/heroes/gravity-field`:
    resize the window: the picture keeps moving continuously, with no rewind
    or reseed (identical to before this change).
  - DevTools device toolbar: switch a phone preset between portrait and
    landscape on ink-flow and reaction-diffusion: settled picture after
    each rotation.
  - `?motion=final` / `?motion=off` / reduced motion: resizing redraws the
    still exactly as before (handled by `drawStill()`, not the timer).
  - Navigate away from a hero page during a drag-resize: no console errors
    (the timer is cleared in `destroy()`).
- **Done when**: after any resize, ink-flow and reaction-diffusion return to
  their settled picture 150 ms after the size stops changing, particle-type
  never scatters on resize, the other three heroes behave as before, and
  typecheck passes.
