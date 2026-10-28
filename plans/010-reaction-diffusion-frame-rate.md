# 010 — Make reaction-diffusion grow per second, not per frame

- **Status**: TODO
- **Commit**: 617c2fa
- **Severity**: MEDIUM
- **Category**: Easing & duration
- **Estimated scope**: 2 files (`registry/heroes/reaction-diffusion/engine.ts`, `registry/heroes/reaction-diffusion/schema.ts`), ~10 changed lines

## Problem

The live loop of reaction-diffusion runs a fixed number of simulation steps on
every animation frame, whatever the time between frames:

```ts
// registry/heroes/reaction-diffusion/engine.ts:128-139 — current
		frame(_time, delta, input) {
			const { config } = current();
			if (config.detail !== detail) {
				allocate();
				reseed();
			}
			pointer.strength = config.pointer && input.inside && (input.dx !== 0 || input.dy !== 0) ? 1 : 0;
			pointer.x = input.x;
			pointer.y = input.y;
			if (delta > 0) simulate(config.speed);
			render();
		},
```

```ts
// registry/heroes/reaction-diffusion/schema.ts:27 — current
	speed: z.number().int().min(2).max(24).default(10).describe("Simulation steps per frame."),
```

The pace of the growth therefore depends on the display: a 120 Hz screen grows
the pattern twice as fast as a 60 Hz one, a 144 Hz screen 2.4×, and a busy
page that drops to 40 fps grows it a third slower. The same hero has a
different personality on every device, and the `speed` setting cannot be tuned
once for everyone. Every other time-based hero in the repo scales its motion
by `delta` (seconds); this one ignores it (it only uses `delta > 0` as a
guard).

`simulate` takes a step count and runs that many steps in one compute pass:

```ts
// registry/heroes/reaction-diffusion/engine.ts:84-97 — current
	/** `count` steps in one pass: the parameters do not change between them. */
	function simulate(count: number) {
		writeSim();
		const encoder = device.createCommandEncoder();
		const pass = encoder.beginComputePass();
		pass.setPipeline(step);
		for (let i = 0; i < count; i++) {
			pass.setBindGroup(0, groups!.steps[latest]);
			pass.dispatchWorkgroups(Math.ceil(grid[0] / 8), Math.ceil(grid[1] / 8));
			latest = 1 - latest;
		}
		pass.end();
		device.queue.submit([encoder.finish()]);
	}
```

The field is reseeded in one function, called from `resize()`, from `frame()`
when `detail` changes, and from `still()`:

```ts
// registry/heroes/reaction-diffusion/engine.ts:72-82 — current
	function reseed() {
		writeSim();
		const encoder = device.createCommandEncoder();
		const pass = encoder.beginComputePass();
		pass.setPipeline(seed);
		pass.setBindGroup(0, groups!.seed);
		pass.dispatchWorkgroups(Math.ceil(grid[0] / 8), Math.ceil(grid[1] / 8));
		pass.end();
		device.queue.submit([encoder.finish()]);
		latest = 0;
	}
```

## Target

`speed` keeps its range and default (integer, 2–24, default 10) but now means
**steps per 60th of a second**: steps per second = `config.speed * 60`. At
60 Hz the hero behaves exactly as today (`speed` steps per frame).

Steps are counted with a fractional accumulator (`budget`) so that frame
rates that do not divide evenly still average out exactly:

```ts
// target, inside frame(), replacing `if (delta > 0) simulate(config.speed);`
			// Grow per second, not per frame: a 120 Hz screen must not grow the pattern twice as fast.
			budget += config.speed * 60 * delta;
			const steps = Math.min(Math.floor(budget), config.speed * 2);
			budget -= steps;
			if (steps > 0) simulate(steps);
```

- The cap `config.speed * 2` equals the steps owed at the loop's largest
  `delta` (1/30 s, clamped in `packages/core/src/loop.ts:10`), so it never
  drops owed steps in normal use; it only guards against a runaway budget.
  Because `delta` is already clamped, the leftover in `budget` after a frame
  is always below 1 step.
- `delta === 0` adds nothing and runs no step, which keeps the old
  `delta > 0` guard's behaviour.
- `budget` is reset to `0` wherever the field is reseeded (inside `reseed()`),
  so a fresh pattern never inherits a fraction from the old one.
- Schema description becomes `"Simulation steps per 60th of a second."`.

Side effect to accept: at very high refresh rates with a low `speed` (e.g.
240 Hz, `speed: 2` → 0.5 steps per frame), some frames run no step; that
frame's pointer seeding is skipped, and the next frame (which runs a step)
seeds at the then-current pointer. This is not visible.

## Repo conventions to follow

- Tabs for indentation; terse comments that explain *why*.
- Scene state lives as `let` variables next to the others at the top of
  `createReactionScene` (`let latest = 0;` with its one-line doc comment at
  `registry/heroes/reaction-diffusion/engine.ts:37-38` is the exemplar).
- Time-based motion scales by `delta` in seconds, e.g.
  `registry/heroes/aurora-mesh/engine.ts:60` `clock += delta * config.speed;`.
- Schema descriptions are short sentences ending in a period.

## Steps

1. `registry/heroes/reaction-diffusion/engine.ts:37-38`: replace

   ```ts
   	/** Which texture holds the latest state. */
   	let latest = 0;
   ```

   with

   ```ts
   	/** Which texture holds the latest state. */
   	let latest = 0;
   	/** Steps owed to the clock: whole steps run, the fraction carries to the next frame. */
   	let budget = 0;
   ```

2. `registry/heroes/reaction-diffusion/engine.ts:81` (inside `reseed()`, two
   lines lower after step 1): replace

   ```ts
   		latest = 0;
   	}
   ```

   (the end of `reseed()`) with

   ```ts
   		latest = 0;
   		budget = 0;
   	}
   ```

   Make sure you edit the `latest = 0;` inside `reseed()`, not the
   declaration from step 1.

3. `registry/heroes/reaction-diffusion/engine.ts:137` (two lines lower after
   step 1, three after step 2): replace

   ```ts
   			if (delta > 0) simulate(config.speed);
   ```

   with

   ```ts
   			// Grow per second, not per frame: a 120 Hz screen must not grow the pattern twice as fast.
   			budget += config.speed * 60 * delta;
   			const steps = Math.min(Math.floor(budget), config.speed * 2);
   			budget -= steps;
   			if (steps > 0) simulate(steps);
   ```

4. `registry/heroes/reaction-diffusion/schema.ts:27`: replace

   ```ts
   	speed: z.number().int().min(2).max(24).default(10).describe("Simulation steps per frame."),
   ```

   with

   ```ts
   	speed: z.number().int().min(2).max(24).default(10).describe("Simulation steps per 60th of a second."),
   ```

Code blocks in the steps are indented three spaces only because they sit in a
Markdown list: drop those three spaces; the code is indented with tabs.

## Boundaries

- Do NOT change line 134 (`pointer.strength = config.pointer && input.inside && (input.dx !== 0 || input.dy !== 0) ? 1 : 0;`):
  the on/off pointer strength is out of scope for this plan.
- Do NOT change `simulate()`, `still()` (it keeps its fixed `STILL_STEPS`
  replay), `STILL_STEPS`, the shaders, or the schema's type/min/max/default.
- Do NOT touch any other hero, `packages/core`, or the docs/site.
- If any quoted "current" block does not match the file (drift since
  `617c2fa`), STOP and report instead of improvising.

## Verification

- **Mechanical**:
  - `pnpm typecheck` from the repo root passes.
  - `grep -n "simulate(config.speed)" registry/heroes/reaction-diffusion/engine.ts` prints nothing.
  - `grep -n "budget" registry/heroes/reaction-diffusion/engine.ts` prints 5 lines (declaration, reset in `reseed()`, `+=`, `Math.floor(budget)`, `-=`).
  - `grep -n "steps per 60th of a second" registry/heroes/reaction-diffusion/schema.ts` prints one line.
- **Feel check**: run `pnpm dev`, open
  `http://localhost:3100/heroes/reaction-diffusion`.
  - On a 60 Hz screen the pattern grows at the same pace as before the change
    (compare with `git stash` or a second checkout at `617c2fa` side by side).
  - On a 120 Hz/144 Hz screen (or a laptop panel set to its high refresh
    rate) the pattern grows at that same pace too, not visibly faster.
  - DevTools > Performance > CPU: 4× slowdown. The frame rate drops, but as
    long as it stays above ~30 fps the pattern keeps growing at the same pace
    per second (motion gets choppier, not slower).
  - Moving the cursor over the hero still seeds new growth along its path.
  - Resize the window: the pattern reseeds as before and grows at the normal
    pace from the first frame (no burst of catch-up steps).
  - `?motion=final` and `?motion=off` show exactly the same still as before
    (the still is untouched).
- **Done when**: growth pace per second is independent of the display's
  refresh rate, 60 Hz behaviour is unchanged, the schema says "Simulation
  steps per 60th of a second.", and typecheck passes.
