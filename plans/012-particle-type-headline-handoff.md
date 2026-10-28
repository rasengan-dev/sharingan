# 012 — Hide particle-type's DOM headline only once the particles are drawn, with a short fade

- **Status**: TODO
- **Commit**: 617c2fa
- **Severity**: MEDIUM
- **Category**: Missed opportunities
- **Estimated scope**: 1 file (`registry/heroes/particle-type/engine.ts`), ~15 changed lines

## Problem

Particle type redraws the hero's headline as particles and hides the real DOM
headline (it stays in the DOM, transparent, for selection and screen readers).
It hides it **when the scene is created**:

```ts
// registry/heroes/particle-type/engine.ts:89-91 — current
	// The canvas draws the headline now: hide the DOM copy, keep it for selection and screen readers.
	const previousColor = target?.style.color ?? "";
	if (target) target.style.color = "transparent";
```

At that point nothing is drawn yet. `packages/core/src/webgpu/mount.ts`
creates the scene (`mount.ts:75`), and only later, in the first
`ResizeObserver` callback (`mount.ts:114-128`), sizes the canvas and draws the
first still frame. Until then the canvas is empty and `rebuild()` has not run
(`count` is 0, so `render()` draws no particles):

```ts
// registry/heroes/particle-type/engine.ts:162-166 — current (inside render())
		if (count) {
			pass.setPipeline(draw);
			pass.setBindGroup(0, groups!.draw);
			pass.draw(6, count);
		}
```

Result: on load, the headline (the most-watched element of the hero) blinks
out for one or more frames before the particles appear. If sampling finds no
particle at all (`count === 0`, e.g. an empty headline), the DOM text stays
hidden forever and the hero shows no headline.

On destroy the colour is restored, but nothing else:

```ts
// registry/heroes/particle-type/engine.ts:207-214 — current
		destroy() {
			textObserver?.disconnect();
			document.fonts?.removeEventListener("loadingdone", resample);
			if (target) target.style.color = previousColor;
			particles?.destroy();
			simParams.buffer.destroy();
			drawParams.buffer.destroy();
		},
```

`render()` (`engine.ts:149-169`) is the single place that draws particles; it
is called at the end of both `frame()` (`engine.ts:199`) and `still()`
(`engine.ts:205`).

## Target

- The DOM headline stays visible until the first `render()` that actually
  drew particles (`count > 0`). That happens on the first `still()` (warm
  start in `ready` mode, the still frame in `reduced`/`final`/`off`) or
  `frame()` after a resize: the same rule for every motion mode.
- At that moment, and only once per scene, the headline fades out:
  `transition: color 200ms cubic-bezier(0.23, 1, 0.32, 1)` (the strong
  ease-out, within the 150–250 ms budget for small UI changes), then
  `color: transparent`. Both are set in the same task; the browser uses the
  new `transition` for the colour change. A colour fade is not movement, so it
  is kept under reduced motion too.
- On destroy, restore the previous inline `transition` **first**, then the
  previous inline `color`, so the restored colour does not fade in over an
  already-empty canvas.
- No other behaviour changes. Re-sampling (`resample`, fonts, text changes)
  does not show the DOM text again.

## Repo conventions to follow

- Tabs for indentation; terse comments that explain *why*.
- Inline style saved and restored in the scene itself, as the current
  `previousColor` does (`registry/heroes/particle-type/engine.ts:90`, `:210`).
- Strong ease-out curve from the audit playbook, written literally (the
  engines have no CSS tokens): `cubic-bezier(0.23, 1, 0.32, 1)`.
- Code blocks in the steps are indented three spaces only because they sit in
  a Markdown list: drop those three spaces; the code is indented with tabs.

## Steps

1. `registry/heroes/particle-type/engine.ts:89-91`: replace

   ```ts
   	// The canvas draws the headline now: hide the DOM copy, keep it for selection and screen readers.
   	const previousColor = target?.style.color ?? "";
   	if (target) target.style.color = "transparent";
   ```

   with

   ```ts
   	// The canvas takes over the headline once it has drawn it: hiding the DOM copy sooner leaves a blank frame.
   	// The DOM copy stays for selection and screen readers.
   	const previousColor = target?.style.color ?? "";
   	const previousTransition = target?.style.transition ?? "";
   	let handedOff = false;
   	function handOff() {
   		if (handedOff || !target) return;
   		handedOff = true;
   		// A short fade masks the swap between the DOM text and the particles drawn over it.
   		target.style.transition = "color 200ms cubic-bezier(0.23, 1, 0.32, 1)";
   		target.style.color = "transparent";
   	}
   ```

2. In `render()` (current `engine.ts:149-169`), the last line of the function
   is

   ```ts
   		device.queue.submit([encoder.finish()]);
   	}
   ```

   Replace it with

   ```ts
   		device.queue.submit([encoder.finish()]);
   		if (count) handOff();
   	}
   ```

   Make sure this is the `submit` inside `render()` (the one after the render
   pass that calls `pass.draw(6, count)`), not the one inside `step()`.

3. In `destroy()` (current `engine.ts:210`), replace

   ```ts
   			if (target) target.style.color = previousColor;
   ```

   with

   ```ts
   			if (target) {
   				// Transition first: the restored colour must not fade in over an empty canvas.
   				target.style.transition = previousTransition;
   				target.style.color = previousColor;
   			}
   ```

## Boundaries

- Do NOT touch `packages/core` (mount.ts, react.tsx, the `.sg-hero-title`
  CSS) or any other hero.
- Do NOT change `rebuild()`, `step()`, the shaders, `STILL_STEPS`, or the
  `resize()` method (plan 013 changes `resize()` separately).
- Do NOT remove the headline from the DOM or change `aria`/markup.
- If any quoted "current" block does not match the file (drift since
  `617c2fa`), STOP and report instead of improvising.

## Verification

- **Mechanical**:
  - `pnpm typecheck` from the repo root passes.
  - `grep -n 'style.color = "transparent"' registry/heroes/particle-type/engine.ts`
    prints exactly one line, inside `handOff()`.
  - `grep -n "handOff()" registry/heroes/particle-type/engine.ts` prints the
    declaration and the call in `render()`.
- **Feel check**: run `pnpm dev`, open
  `http://localhost:3100/heroes/particle-type`.
  - Reload several times (also with DevTools > Network > "Disable cache"):
    the headline is never missing. The DOM text is visible, then the
    particles appear and the DOM text fades out under them over ~200 ms.
  - Slow-motion: DevTools > Performance, tick "Screenshots", "Start profiling
    and reload page". In the filmstrip there is no frame where the hero shows
    neither the DOM headline nor the particles.
  - DevTools > Animations panel at 10% playback, reload: one `color`
    transition on the `h1`, 200 ms, fast at the start and gentle at the end.
  - Select the headline text with the mouse: it is still selectable.
  - `?motion=final` and `?motion=off`: the still frame shows the particle
    headline and the DOM text is transparent after load (screenshots via
    `pnpm posters` wait 1.5 s, well after the 200 ms fade).
  - DevTools > Rendering > `prefers-reduced-motion: reduce`, reload: same
    hand-off and fade (a colour fade is allowed under reduced motion).
  - Navigate away from the hero page (client-side) and back: the headline is
    shown, hidden and faded correctly again; inspect the `h1` and confirm no
    leftover inline `transition` from a previous mount.
  - In a browser without WebGPU (or `chrome://flags` WebGPU disabled), the
    DOM headline stays visible (the scene is never created).
- **Done when**: the DOM headline disappears only after particles have been
  drawn, it fades in 200 ms with `cubic-bezier(0.23, 1, 0.32, 1)`, destroy
  restores both the previous inline `transition` and `color`, and typecheck
  passes.
