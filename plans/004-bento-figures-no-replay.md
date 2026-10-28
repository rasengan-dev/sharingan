# 004 — Count the bento figures once, at the entrance only

- **Status**: TODO
- **Commit**: 617c2fa
- **Severity**: HIGH
- **Category**: Purpose & frequency
- **Estimated scope**: 1 file (`registry/heroes/bento-tiles/engine.ts`), ~15 lines removed, 1 comment line changed

## Problem

In bento-tiles, every time the pointer enters the "stat" or "highlight" card, its figure is reset to `0` and recounts for 1.4 s, and the highlight's progress bar empties and refills from 0. Hover is a tens-of-times-per-visit interaction: replaying a 1.4 s count on it turns the value the user is trying to read into a flicker, and moving the pointer across the bento triggers it by accident. The count-up has a purpose once (the entrance); on hover it has none.

```ts
// registry/heroes/bento-tiles/engine.ts:251-264 — current
	const replay = (element: HTMLElement | null) => {
		if (!element) return;
		element.addEventListener(
			"pointerenter",
			(event) => {
				if (event.pointerType === "touch" || mode !== "ready" || host.dataset.intro) return;
				counters.filter((counter) => element.contains(counter.element)).forEach((counter) => count(counter));
				if (progress && element.contains(progress)) fillProgress(0);
			},
			{ signal },
		);
	};
	replay(card("stat"));
	replay(card("highlight"));
```

The comment above the counters still describes this behaviour:

```ts
// registry/heroes/bento-tiles/engine.ts:199 — current
	// Figures: they count up from zero at the entrance, and again when their card is pointed at.
```

## Target

- Figures count up and the bar fills **once**, during the entrance (already done by `play()` at `engine.ts:387-395`, which calls `count(counter, 1300)` and `later(1300, () => fillProgress(0))`).
- On hover, the stat and highlight cards only get the shared card lift (`.sg-bt-card:hover`, CSS) — no JS on `pointerenter`.
- The `replay` helper and its two calls are deleted. Nothing else is removed, because everything else is still used:
  - `count` (`:210-230`) — used by `play()` (`:389`) and by the motion-preference handler (`:421`, `count(counter)` with the default `delay = 0`). Keep it, including its `delay = 0` default.
  - `fillProgress` (`:238-249`) — used by `play()` (`fillProgress(0)`, `:390`), the initial setup (`fillProgress(null)`, `:413`) and the motion handler (`fillProgress(null)`, `:422`). Keep it with its `from: number | null` signature.
  - `card` (`:82`) — still used for portrait, folder, orbit and highlight (`:135`, `:164`, `:187`, `:234`).
  - `progress`, `counters`, `signal` — all still used elsewhere.

## Repo conventions to follow

- Tabs; terse comments that describe what the code does and why, e.g. `registry/heroes/bento-tiles/engine.ts:386` (`// Entrance: everything waits until the hero is on screen, then plays once.`).
- Line numbers are for commit `617c2fa`. If plan 003, 011 or 015 ran first, lines in this file may have shifted: locate the code by the quoted text. Only a content mismatch is a reason to stop.

## Steps

1. `registry/heroes/bento-tiles/engine.ts:251-264` — delete these 14 lines entirely (the `replay` constant and the two calls `replay(card("stat"));` / `replay(card("highlight"));`), together with the blank line that follows them at `:265`, so the file goes straight from the end of `fillProgress` to the tile-wall section. Result around the cut:

   ```ts
   		requestAnimationFrame(() => progress.style.setProperty("--sg-bt-progress", String(percent)));
   	};

   	// The wall of tiles: built for the hero's width, lifted around the pointer.
   ```

2. `registry/heroes/bento-tiles/engine.ts:199` — update the comment. Replace:

   ```ts
   	// Figures: they count up from zero at the entrance, and again when their card is pointed at.
   ```

   with:

   ```ts
   	// Figures: they count up from zero once, at the entrance.
   ```

3. Confirm nothing else referenced the removed code: `grep -n "replay" registry/heroes/bento-tiles/` must return no matches.

## Boundaries

- Do NOT touch `count`, `fillProgress`, `play()`, the motion-preference handler, `destroy()` or any CSS.
- Do NOT add a new hover effect to the stat or highlight cards; the shared `.sg-bt-card:hover` lift is the hover.
- Do NOT change `schema.ts`, `meta.ts` or the `.tsx` markup (their descriptions already say "counts up", which stays true).
- No new dependencies, no formatters.
- If the quoted code does not match (beyond line drift), STOP and report.

## Verification

- **Mechanical**: from the repo root, `pnpm typecheck` passes (an unused-variable error here would mean something only `replay` used is still declared — re-check the list in Target). `grep -rn "replay" registry/heroes/bento-tiles/` returns nothing.
- **Feel check**: run `pnpm dev` and open http://localhost:3100/heroes/bento-tiles.
  - On load (scroll into view), the two figures still count up from 0 to their value and the highlight's bar fills, starting about 1.3 s into the entrance.
  - After the entrance has finished (~3 s), move the pointer in and out of the stat card and the accent (highlight) card several times, quickly and slowly: the figures stay at their final value, the bar stays full. Only the card lift happens.
  - Sweep the pointer across the whole bento row: no number ever flickers.
  - `?motion=final` and `?motion=off`: figures show their final text immediately and the bar is full (unchanged).
  - In DevTools, Rendering → toggle `prefers-reduced-motion: reduce` while the page is open: figures snap to their final values (unchanged path via the motion handler).
- **Done when**: the `replay` helper and its calls are gone, typecheck passes, and hovering the figure cards never changes the figure or the bar.
