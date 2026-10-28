# 011 — Entrances must never block interaction

- **Status**: TODO
- **Commit**: 617c2fa
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens (stagger must never block interaction)
- **Estimated scope**: 4 files (split-headline `styles.ts` + `engine.ts`, bento-tiles `styles.ts` + `engine.ts`), ~20 lines

## Problem

Staggered entrances are decoration; they must never hold back what the user can do. Two heroes do.

### split-headline: the CTAs are invisible but clickable for up to ~2.1 s

The subheadline and the CTA row (`[data-sg-after]`, markup in `registry/heroes/split-headline/split-headline.tsx:52` and `:57`) wait at `opacity: 0` while the letters assemble, then fade in after a delay of up to 1400 ms over another 700 ms. During that time the buttons are already in place and clickable, but not visible.

```css
/* registry/heroes/split-headline/styles.ts:73-75 — current */
/* The rest of the hero follows the headline in */
.sg-sh[data-intro="pending"] .sg-sh-after { opacity: 0; transform: translateY(12px); }
.sg-sh[data-intro="play"] .sg-sh-after { transition: opacity .7s ease-out var(--sg-sh-after-delay), transform .7s cubic-bezier(.2, .8, .2, 1) var(--sg-sh-after-delay); }
```

```ts
// registry/heroes/split-headline/engine.ts:174-177 — current
	const play = () => {
		played = true;
		const total = settings.stagger * letters.length * (settings.intro === "type" ? 2.2 : 1) + ENTRANCE_MS;
		host.style.setProperty("--sg-sh-after-delay", `${Math.min(total * 0.6, 1400)}ms`);
```

### bento-tiles: card hover is dead until 2.6 s after the entrance starts

Each card enters with a keyframe animation whose fill mode is `both`. A filling animation overrides the card's `:hover` `transform`/`box-shadow`, so the hover lift does nothing until the `data-intro` attribute is removed from the host — which only happens on a fixed 2.6 s timer, long after most cards have landed (the first card lands at 950 ms + 1 s).

```css
/* registry/heroes/bento-tiles/styles.ts:310 — current */
.sg-bt[data-intro] .sg-bt-card { animation: sg-bt-card-in 1s var(--sg-bt-ease) calc(950ms + var(--i, 0) * 90ms) both; }
```

```css
/* registry/heroes/bento-tiles/styles.ts:317 — current */
@keyframes sg-bt-card-in { from { opacity: 0; transform: translateY(28px) scale(.96); } }
```

```ts
// registry/heroes/bento-tiles/engine.ts:386-395 — current
	// Entrance: everything waits until the hero is on screen, then plays once.
	const play = () => {
		host.dataset.intro = "playing";
		counters.forEach((counter) => count(counter, 1300));
		later(1300, () => fillProgress(0));
		later(2600, () => {
			delete host.dataset.intro;
			pressSoon();
		});
	};
```

The cards are collected and ordered here:

```ts
// registry/heroes/bento-tiles/engine.ts:122-128 — current
	// Cards in reading order for the entrance, and their parts.
	const bento = host.querySelector<HTMLElement>("[data-sg-bento]");
	bento?.classList.add("sg-bt-bento");
	const cards = bento ? [...bento.querySelectorAll<HTMLElement>("[data-sg-card]")] : [];
	cards.forEach((element) => element.classList.add("sg-bt-card"));
	const order = ["integrations", "portrait", "highlight", "folder", "stat", "orbit"];
	cards.forEach((element) => element.style.setProperty("--i", String(Math.max(0, order.indexOf(element.dataset.sgCard ?? "")))));
```

And cleaned up here:

```ts
// registry/heroes/bento-tiles/engine.ts:434-454 — current
		destroy() {
			cancel.abort();
			stopTiles?.();
			counters.forEach((counter) => {
				counter.stop?.();
				counter.element.textContent = counter.text;
			});
			stopMotion();
			visibility.dispose();
			resize.disconnect();
			window.clearTimeout(pressTimer);
			timers.forEach((timer) => window.clearTimeout(timer));
			wall?.remove();
			added.forEach((element) => element.remove());
			if (headline && headlineNodes.length > 0) headline.replaceChildren(...headlineNodes);
			for (const name of ["--sg-bt-accent", "--sg-bt-marks", "--sg-bt-g1", "--sg-bt-g2", "--sg-bt-g3", "--sg-bt-tile"]) host.style.removeProperty(name);
			delete host.dataset.intro;
			delete host.dataset.nav;
			delete host.dataset.ready;
			host.removeAttribute("data-pointer");
		},
```

## Target

- **split-headline**: the after-delay is `Math.min(total * 0.6, 400)` ms, and the after transition is 400 ms on both properties with the strong ease-out: `transition: opacity 400ms cubic-bezier(0.23, 1, 0.32, 1) var(--sg-sh-after-delay), transform 400ms cubic-bezier(0.23, 1, 0.32, 1) var(--sg-sh-after-delay);`. Worst case from the moment the entrance starts: CTAs mostly visible within ~0.5 s, fully settled by 0.8 s.
- **bento-tiles**: each card releases its entrance animation as soon as *it* has landed. The engine listens for `animationend` on each card (only when the event target is the card itself and `animationName === "sg-bt-card-in"`, because `animationend` bubbles up from the logos and avatars inside) and sets `data-arrived` on it. CSS removes the animation from arrived cards: `.sg-bt[data-intro] .sg-bt-card[data-arrived] { animation: none; }`. Because `sg-bt-card-in` only has a `from` keyframe, its end state equals the card's own style, so dropping the animation causes no jump. `destroy()` removes `data-arrived` from every card.

## Repo conventions to follow

- Tabs; terse why-comments; CSS in the `styles.ts` template string; state as `data-*` attributes on elements (e.g. `data-press` on tiles: `registry/heroes/bento-tiles/styles.ts:105` and `engine.ts:379-380`).
- Listeners are registered with `{ signal }` from the hero's `AbortController` so `cancel.abort()` in `destroy` removes them — imitate `registry/heroes/bento-tiles/engine.ts:152-160`.
- No shared easing token exists: write `cubic-bezier(0.23, 1, 0.32, 1)` inline. Keep bento's `--sg-bt-ease` for its entrances.
- Line numbers are for commit `617c2fa`. If plans 003, 004 or 015 ran first, bento-tiles lines may have shifted: find the code by the quoted text. Only a content mismatch is a reason to stop.

## Steps

### split-headline

1. `registry/heroes/split-headline/engine.ts:177` — replace:

   ```ts
   	host.style.setProperty("--sg-sh-after-delay", `${Math.min(total * 0.6, 1400)}ms`);
   ```

   with:

   ```ts
   	// Short cap: the buttons are clickable from the start, so they must not stay invisible for long.
   	host.style.setProperty("--sg-sh-after-delay", `${Math.min(total * 0.6, 400)}ms`);
   ```

2. `registry/heroes/split-headline/styles.ts:75` — replace:

   ```css
   .sg-sh[data-intro="play"] .sg-sh-after { transition: opacity .7s ease-out var(--sg-sh-after-delay), transform .7s cubic-bezier(.2, .8, .2, 1) var(--sg-sh-after-delay); }
   ```

   with:

   ```css
   .sg-sh[data-intro="play"] .sg-sh-after { transition: opacity 400ms cubic-bezier(0.23, 1, 0.32, 1) var(--sg-sh-after-delay), transform 400ms cubic-bezier(0.23, 1, 0.32, 1) var(--sg-sh-after-delay); }
   ```

   Leave line 74 (the pending state, `opacity: 0; transform: translateY(12px);`) unchanged.

### bento-tiles

3. `registry/heroes/bento-tiles/engine.ts` — directly after line 128 (the `cards.forEach(... "--i" ...)` line quoted above), insert:

   ```ts
   	// Each card lets go of its entrance once it has landed, so its hover lift works while the others still arrive.
   	cards.forEach((element) =>
   		element.addEventListener(
   			"animationend",
   			(event) => {
   				if (event.target === element && event.animationName === "sg-bt-card-in") element.setAttribute("data-arrived", "");
   			},
   			{ signal },
   		),
   	);
   ```

   `signal` is declared at `engine.ts:73`, before this point, so it is in scope.

4. `registry/heroes/bento-tiles/styles.ts:310` — directly after the card entrance rule, add the release rule. Result:

   ```css
   .sg-bt[data-intro] .sg-bt-card { animation: sg-bt-card-in 1s var(--sg-bt-ease) calc(950ms + var(--i, 0) * 90ms) both; }
   /* A landed card drops its filling animation, which would otherwise override its hover lift */
   .sg-bt[data-intro] .sg-bt-card[data-arrived] { animation: none; }
   ```

   (Specificity 0,4,0 beats the 0,3,0 entrance rule; no `!important` needed.)

5. `registry/heroes/bento-tiles/engine.ts` `destroy()` — after `host.removeAttribute("data-pointer");` (line 453), add:

   ```ts
   			cards.forEach((element) => element.removeAttribute("data-arrived"));
   ```

## Boundaries

- Do NOT change the letter entrance in split-headline (`.sg-sh-char` rules, `ENTRANCE_MS`, `total`, the `later(total + 200, …)` timer).
- Do NOT change the bento 2600 ms timer, the other `[data-intro]` entrance rules (tiles, nav, words, sub, button, avatars, logos), or the `sg-bt-card-in` keyframes.
- Do NOT add `pointer-events` toggling or other new mechanisms beyond the steps.
- Do NOT touch other heroes. No dependencies, no formatters.
- If the quoted code does not match (beyond line drift), STOP and report.

## Verification

- **Mechanical**: `pnpm typecheck` from the repo root passes (`event` in an `"animationend"` listener is typed `AnimationEvent`, so `event.animationName` type-checks). `grep -n "1400" registry/heroes/split-headline/engine.ts` returns nothing.
- **Feel check**: run `pnpm dev`.
  - http://localhost:3100/heroes/split-headline — reload and watch: the letters assemble as before; the subheadline and buttons now arrive while the last letters are still settling (well under a second after the entrance starts), not after a noticeable pause. Reload and immediately move the pointer to where the primary button will be: within ~0.5 s it is visible under the cursor.
  - In DevTools set animation playback to 10%: the after-block fades and rises with a fast start and a long soft settle (strong ease-out), with no slow start.
  - http://localhost:3100/heroes/bento-tiles — reload, scroll into view, and keep the pointer over the first card (integrations, top-left). As soon as it has landed (~2 s after the entrance starts), it lifts; it no longer waits for the whole bento. Hover a card that has landed while later cards (stat, orbit) are still rising: it lifts; the others keep entering undisturbed.
  - In the Elements panel, after the entrance each `[data-sg-card]` carries `data-arrived`; no card visibly jumps or flashes at the moment it gets the attribute (watch at 10% playback).
  - `?motion=final` and `?motion=off` on both heroes: everything is at rest and visible at once; no `data-arrived` is set on bento cards (no animation ran), which is fine.
- **Done when**: split-headline's after-delay is capped at 400 ms with a 400 ms strong ease-out; every bento card can be hovered as soon as it has landed; typecheck passes.
