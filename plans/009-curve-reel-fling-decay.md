# 009 — Curve reel: a drag that pauses before release must not fling

- **Status**: TODO
- **Commit**: 617c2fa
- **Severity**: MEDIUM
- **Category**: Interruptibility
- **Estimated scope**: 1 file, ~3 lines in one function

## Problem

The curve reel can be dragged, and on release it keeps the drag's momentum
(`velocity`, which the frame loop then decays back to the cruise speed). The
release velocity comes from `fling`, a smoothed speed that is only updated
*inside* `pointermove`. If the visitor drags fast, then holds the pointer still
(no more `pointermove` events), and releases, `fling` still holds the old fast
speed and the reel shoots off — even though the hand had stopped. On a real
surface, a held-then-released object stays put.

Current code, verbatim:

```ts
// registry/heroes/curve-reel/engine.ts:302-348 — current
	// Drag: the reel follows the pointer, then keeps its momentum. A press that does not move stays a click.
	let press: { id: number; x: number; time: number; moved: boolean } | null = null;
	let fling = 0;
	let swallowClick = false;
	reel.addEventListener(
		"pointerdown",
		(event) => {
			if (!settings.drag || mode !== "ready" || event.button !== 0) return;
			press = { id: event.pointerId, x: event.clientX, time: event.timeStamp, moved: false };
			fling = 0;
		},
		{ signal },
	);
	reel.addEventListener(
		"pointermove",
		(event) => {
			if (!press || event.pointerId !== press.id) return;
			const dx = event.clientX - press.x;
			if (!press.moved) {
				if (Math.abs(dx) < DRAG_SLOP) return;
				press.moved = true;
				dragging = true;
				target = null;
				reel.setPointerCapture(event.pointerId);
				reel.dataset.dragging = "";
			}
			const moved = -dx / geo.spacing;
			const elapsed = Math.max(1, event.timeStamp - press.time) / 1000;
			fling += (moved / elapsed - fling) * 0.5;
			offset += moved;
			press.x = event.clientX;
			press.time = event.timeStamp;
			if (!stopLoop) paint();
		},
		{ signal },
	);
	const release = (event: PointerEvent) => {
		if (!press || event.pointerId !== press.id) return;
		if (press.moved) {
			swallowClick = true;
			later(0, () => (swallowClick = false));
			velocity = Math.max(-MAX_FLING, Math.min(MAX_FLING, fling));
			delete reel.dataset.dragging;
		}
		dragging = false;
		press = null;
	};
```

Confirmed in the code: `press.time` is set on `pointerdown` (line 310) and then
updated to `event.timeStamp` on every drag `pointermove` (line 333). So at
release, `event.timeStamp - press.time` is exactly how long the pointer has
been still since its last movement. `MAX_FLING` is `8` cards per second
(`engine.ts:25`). The frame loop (`engine.ts:255-258`) eases `velocity` toward
the cruise speed after release; that stays as is.

## Target

In `release`, scale the fling down linearly with the time the pointer was still
before release: full momentum when released mid-motion, none once the pointer
has been still for 120ms or more.

```ts
// registry/heroes/curve-reel/engine.ts:338-348 — target
	const release = (event: PointerEvent) => {
		if (!press || event.pointerId !== press.id) return;
		if (press.moved) {
			swallowClick = true;
			later(0, () => (swallowClick = false));
			// A hand that stopped before letting go keeps no momentum: fade it out over 120ms of stillness.
			const still = Math.max(0, event.timeStamp - press.time) / 1000;
			const decayed = fling * Math.max(0, 1 - still / 0.12);
			velocity = Math.max(-MAX_FLING, Math.min(MAX_FLING, decayed));
			delete reel.dataset.dragging;
		}
		dragging = false;
		press = null;
	};
```

- `still` is in seconds; `0.12` = 120ms.
- `decayed` replaces `fling` inside the clamp; the clamp itself is unchanged.
- `pointercancel` uses the same `release` (line 350), so it gets the same rule.

## Repo conventions to follow

- Tabs; terse one-line "why" comments above the code they explain (see the
  comment on `engine.ts:302`).
- Times from `event.timeStamp` are in milliseconds and converted to seconds by
  `/ 1000`, as `engine.ts:329` already does — imitate that.
- Constants for tunables live at the top of the file (`DRAG_SLOP`, `MAX_FLING`,
  lines 24-25). Inline `0.12` is acceptable per this plan; do not introduce a
  new constant unless you also keep the value exactly 0.12 and comment it.

## Steps

1. Open `registry/heroes/curve-reel/engine.ts`. Locate `const release = (event: PointerEvent) => {` (line 338).
2. Replace line 343,
   `			velocity = Math.max(-MAX_FLING, Math.min(MAX_FLING, fling));`
   with these four lines (three tabs of indentation each):
   ```ts
   			// A hand that stopped before letting go keeps no momentum: fade it out over 120ms of stillness.
   			const still = Math.max(0, event.timeStamp - press.time) / 1000;
   			const decayed = fling * Math.max(0, 1 - still / 0.12);
   			velocity = Math.max(-MAX_FLING, Math.min(MAX_FLING, decayed));
   ```
3. Change nothing else in the file.

## Boundaries

- Do NOT change the `pointermove` handler (fling smoothing, `press.time` update),
  `pointerdown`, `MAX_FLING`, `DRAG_SLOP`, or the frame loop.
- Do NOT touch any other hero or `packages/core/src/`.
- Do NOT add dependencies.
- If the `release` function doesn't match the "current" code above (drift since 617c2fa), STOP and report.

## Verification

- **Mechanical**: from the repo root, `pnpm typecheck` passes.
  `grep -n "decayed" registry/heroes/curve-reel/engine.ts` shows two lines inside `release`.
- **Feel check**: `pnpm dev`, open http://localhost:3100/heroes/curve-reel.
  - Quick flick: drag the reel fast and let go while still moving — it coasts
    and slows down to its cruise speed, as before.
  - Drag fast, stop and hold still for about half a second, then release: the
    reel does not shoot off; it stays where you left it and resumes its normal
    slow cruise.
  - Drag fast, pause very briefly (~50ms) and release: a reduced coast (roughly
    half the speed) — momentum fades with the pause, there is no hard cutoff.
  - A simple click on a card (no drag) still works as a click.
  - Repeat with touch emulation (DevTools device mode): same three behaviours.
  - http://localhost:3100/heroes/curve-reel?motion=final and `?motion=off`:
    dragging is disabled as before (the `pointerdown` handler returns when
    mode is not "ready"); nothing changes there.
- **Done when**: the target code is in place, typecheck passes, and a
  held-then-released drag produces no fling while a released-in-motion drag still does.
