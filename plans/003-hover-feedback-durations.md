# 003 — Make hover and pointer feedback answer within 250 ms

- **Status**: TODO
- **Commit**: 617c2fa
- **Severity**: HIGH
- **Category**: Easing & duration
- **Estimated scope**: 3 files (gallery-fan `styles.ts` + `engine.ts`, bento-tiles `styles.ts`), ~15 changed lines

## Problem

Feedback that follows the pointer is far over the 300 ms UI budget, so the heroes feel like they lag behind the hand.

### gallery-fan: 700 ms lag on every raise

The card transition serves two jobs: the one-time entrance (cards fly out of a stack with a stagger) and the raise that follows the pointer on every `pointermove`. Both use the same 700 ms curve, so in steady state the raised card trails the pointer by most of a second.

```css
/* registry/heroes/gallery-fan/styles.ts:58-71 — current */
.sg-gf-card {
	--x: 0px; --y: 0px; --z: 0px; --ry: 0deg; --rz: 0deg; --s: 1;
	position: absolute; left: 50%; top: 50%;
	width: var(--card-w); aspect-ratio: 4 / 5;
	margin: calc(var(--card-w) * -0.625) 0 0 calc(var(--card-w) / -2);
	border-radius: calc(var(--card-w) * .07);
	text-decoration: none; color: #fff;
	transform: translate3d(var(--x), var(--y), var(--z)) rotateY(var(--ry)) rotateZ(var(--rz)) scale(var(--s));
	transition: transform .7s cubic-bezier(.2, .8, .2, 1), box-shadow .4s, opacity .5s;
	transition-delay: var(--delay, 0ms);
	box-shadow: 0 1.2em 2.4em -1.2em rgb(0 0 0 / .45), 0 .3em .6em -.3em rgb(0 0 0 / .25);
	font-size: calc(var(--card-w) / 15);
	will-change: transform;
}
```

The raise is written on every pointer move:

```ts
// registry/heroes/gallery-fan/engine.ts:107-111 — current
	const setActive = (next: number | null) => {
		if (next === active) return;
		active = next;
		update();
	};
```

```ts
// registry/heroes/gallery-fan/engine.ts:167-174 — current
	fan.addEventListener(
		"pointermove",
		(event) => {
			if (!settings.pointer || (event.pointerType === "touch" && !touching)) return;
			setActive(nearest(event.clientX));
		},
		{ signal },
	);
```

The entrance is driven by `play()`. Note: **`data-intro` is deleted at the moment the entrance starts** (line 223), so today there is no attribute that marks "the entrance is playing". This plan adds one (`data-intro="playing"`).

```ts
// registry/heroes/gallery-fan/engine.ts:212-228 — current
	// Entrance: stacked in the middle, then opened from the centre outward.
	let played = false;
	const stack = () => {
		cards.forEach((_, index) => paint(index, { x: 0, y: cardWidth * 0.12, z: -160, ry: 0, rz: (index - center) * 2, s: 0.9, order: restPose(index).order }));
	};
	const play = () => {
		played = true;
		requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				if (signal.aborted) return;
				cards.forEach((card, index) => card.style.setProperty("--delay", `${Math.round(Math.abs(index - center) * 90)}ms`));
				delete host.dataset.intro;
				update();
				later(Math.round(center * 90) + 800, () => cards.forEach((card) => card.style.removeProperty("--delay")));
			}),
		);
	};
```

```css
/* registry/heroes/gallery-fan/styles.ts:89-90 — current */
/* Entrance: stacked in the middle, then opened card after card */
.sg-gf[data-intro="pending"] .sg-gf-card { opacity: 0; }
```

### bento-tiles: hover transitions of 450–800 ms, and a stagger that also delays hover-out

```css
/* registry/heroes/bento-tiles/styles.ts:148 — current (card lift) */
	transition: transform .45s var(--sg-bt-ease), box-shadow .45s var(--sg-bt-ease);
```

```css
/* registry/heroes/bento-tiles/styles.ts:159-169 — current (integration logos) */
.sg-bt-app {
	display: grid; place-items: center; width: 40px; height: 40px; border-radius: 10px;
	background: #fff; box-shadow: 0 0 0 1px rgb(0 0 0 / .04), 0 6px 14px -8px rgb(0 0 0 / .3);
	transition: transform .5s var(--sg-bt-ease), box-shadow .5s var(--sg-bt-ease);
	transition-delay: calc(var(--i, 0) * 60ms);
}
.sg-bt-app img { width: 20px; height: 20px; object-fit: contain; }
.sg-bt-card[data-sg-card="integrations"]:hover .sg-bt-app {
	transform: translate(calc(var(--i, 0) * 8px), -6px) rotate(calc((var(--i, 0) - 1) * 5deg));
	box-shadow: 0 0 0 1px rgb(0 0 0 / .04), 0 14px 22px -10px rgb(0 0 0 / .35);
}
```

The `transition-delay` sits on the base rule, so it applies in both directions: when the pointer leaves, the last logo waits `i * 60ms` before even starting to return.

```css
/* registry/heroes/bento-tiles/styles.ts:175 — current (portrait zoom) */
.sg-bt-card[data-sg-card="portrait"] > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: grayscale(1) contrast(1.08); transition: transform .8s var(--sg-bt-ease); }
```

```css
/* registry/heroes/bento-tiles/styles.ts:259-264 — current (folder flap) */
.sg-bt-folder::after {
	position: absolute; top: 6px; height: 28px;
	background: linear-gradient(oklch(0.8 0.12 235), oklch(0.7 0.14 242));
	box-shadow: 0 -1px 0 rgb(255 255 255 / .35) inset;
	transform-origin: bottom; transition: transform .5s var(--sg-bt-ease);
}
```

## Target

All hover / pointer feedback uses the strong ease-out `cubic-bezier(0.23, 1, 0.32, 1)` at 200–300 ms. Entrances keep their long curves.

| Element | Property | Duration | Curve |
| --- | --- | --- | --- |
| gallery-fan card (steady state) | transform | 240ms | `cubic-bezier(0.23, 1, 0.32, 1)` |
| gallery-fan card (steady state) | box-shadow | 240ms | `cubic-bezier(0.23, 1, 0.32, 1)` |
| gallery-fan card (steady state) | opacity | 200ms | `cubic-bezier(0.23, 1, 0.32, 1)` |
| gallery-fan card (while `data-intro="playing"`) | unchanged: `transform .7s cubic-bezier(.2, .8, .2, 1), box-shadow .4s, opacity .5s`, delay `var(--delay, 0ms)` | | |
| bento card lift | transform, box-shadow | 220ms | `cubic-bezier(0.23, 1, 0.32, 1)` |
| bento integration logos | transform, box-shadow | 240ms, `calc(var(--i, 0) * 60ms)` delay **on hover-in only** | `cubic-bezier(0.23, 1, 0.32, 1)` |
| bento portrait zoom | transform | 300ms | `cubic-bezier(0.23, 1, 0.32, 1)` |
| bento folder flap | transform | 220ms | `cubic-bezier(0.23, 1, 0.32, 1)` |

There is no shared easing token in this repo yet: write `cubic-bezier(0.23, 1, 0.32, 1)` inline. Keep bento's `--sg-bt-ease` (`cubic-bezier(.2, .8, .2, 1)`) for its entrances and other rules; do not delete or change it.

## Repo conventions to follow

- Tabs for indentation; CSS lives in the template string exported from each hero's `styles.ts`.
- Comments are terse and explain *why*, in the voice already used (e.g. `/* Entrance: stacked in the middle, then opened card after card */`).
- Entrance states are expressed as a `data-intro` attribute on the host (`.sg-gf[data-intro="pending"] …`, `.sg-bt[data-intro] …`). Imitate `registry/heroes/gallery-fan/styles.ts:90`.
- Line numbers below are for commit `617c2fa`. If other plans in this series (004, 011, 015) were executed first, line numbers in bento-tiles files will have drifted: find the code by the quoted text. Only a *content* mismatch is a reason to stop.

## Steps

### gallery-fan

1. `registry/heroes/gallery-fan/styles.ts:66` — replace the steady-state transition. Change exactly this line:

   ```css
   	transition: transform .7s cubic-bezier(.2, .8, .2, 1), box-shadow .4s, opacity .5s;
   ```

   to these two lines (comment first):

   ```css
   	/* Steady state: the raise follows the pointer, so it answers at once */
   	transition: transform 240ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 240ms cubic-bezier(0.23, 1, 0.32, 1), opacity 200ms cubic-bezier(0.23, 1, 0.32, 1);
   ```

   Leave line 67 (`transition-delay: var(--delay, 0ms);`) as it is.

2. `registry/heroes/gallery-fan/styles.ts:89-90` — after the existing pending rule, add the entrance transition. Result:

   ```css
   /* Entrance: stacked in the middle, then opened card after card */
   .sg-gf[data-intro="pending"] .sg-gf-card { opacity: 0; }
   /* While the fan opens: the long, staggered move (the shorthand resets the delay, so it is restated) */
   .sg-gf[data-intro="playing"] .sg-gf-card { transition: transform .7s cubic-bezier(.2, .8, .2, 1), box-shadow .4s, opacity .5s; transition-delay: var(--delay, 0ms); }
   ```

3. `registry/heroes/gallery-fan/engine.ts:217-228` — mark the entrance as playing instead of clearing the attribute, and clear it when the last card has landed. Replace the whole `play` function with:

   ```ts
   	const play = () => {
   		played = true;
   		requestAnimationFrame(() =>
   			requestAnimationFrame(() => {
   				if (signal.aborted) return;
   				cards.forEach((card, index) => card.style.setProperty("--delay", `${Math.round(Math.abs(index - center) * 90)}ms`));
   				// "playing" keeps the long entrance transition until the last card has landed.
   				host.dataset.intro = "playing";
   				update();
   				later(Math.round(center * 90) + 800, () => {
   					cards.forEach((card) => card.style.removeProperty("--delay"));
   					if (host.dataset.intro === "playing") delete host.dataset.intro;
   				});
   			}),
   		);
   	};
   ```

   No other engine edits are needed. The other readers of `host.dataset.intro` already behave correctly with the new `"playing"` value (verified at 617c2fa):
   - `:230` visibility callback checks `=== "pending"` and `!played`.
   - `:234` resize checks `=== "pending"`.
   - `:253-256` motion change deletes any `intro` and repaints.
   - `:263` `setConfig` checks `!== "pending"`.
   - `:280` `destroy` deletes it.
   - CSS only targets `[data-intro="pending"]` (cards, cursors) and the new `[data-intro="playing"]` rule.

### bento-tiles

4. `registry/heroes/bento-tiles/styles.ts:148` — card lift. Replace:

   ```css
   	transition: transform .45s var(--sg-bt-ease), box-shadow .45s var(--sg-bt-ease);
   ```

   with:

   ```css
   	transition: transform 220ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 220ms cubic-bezier(0.23, 1, 0.32, 1);
   ```

5. `registry/heroes/bento-tiles/styles.ts:159-169` — logos: shorter transition, stagger moved into the hover rule. Result:

   ```css
   .sg-bt-app {
   	display: grid; place-items: center; width: 40px; height: 40px; border-radius: 10px;
   	background: #fff; box-shadow: 0 0 0 1px rgb(0 0 0 / .04), 0 6px 14px -8px rgb(0 0 0 / .3);
   	transition: transform 240ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 240ms cubic-bezier(0.23, 1, 0.32, 1);
   }
   .sg-bt-app img { width: 20px; height: 20px; object-fit: contain; }
   /* The stagger only on the way in: leaving, they settle at once */
   .sg-bt-card[data-sg-card="integrations"]:hover .sg-bt-app {
   	transform: translate(calc(var(--i, 0) * 8px), -6px) rotate(calc((var(--i, 0) - 1) * 5deg));
   	box-shadow: 0 0 0 1px rgb(0 0 0 / .04), 0 14px 22px -10px rgb(0 0 0 / .35);
   	transition-delay: calc(var(--i, 0) * 60ms);
   }
   ```

   (The line `transition-delay: calc(var(--i, 0) * 60ms);` is removed from `.sg-bt-app` and added to the `:hover` rule.)

6. `registry/heroes/bento-tiles/styles.ts:175` — portrait zoom. In that line, replace `transition: transform .8s var(--sg-bt-ease);` with `transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1);`. Result:

   ```css
   .sg-bt-card[data-sg-card="portrait"] > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: grayscale(1) contrast(1.08); transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1); }
   ```

7. `registry/heroes/bento-tiles/styles.ts:263` — folder flap. Replace:

   ```css
   	transform-origin: bottom; transition: transform .5s var(--sg-bt-ease);
   ```

   with:

   ```css
   	transform-origin: bottom; transition: transform 220ms cubic-bezier(0.23, 1, 0.32, 1);
   ```

## Boundaries

- Do NOT touch any other transition: the bento buttons (`.2s`, already fine), nav links, `.sg-bt-glow` (`.5s` opacity), `.sg-bt-marks-*` (`.3s`), `.sg-bt-progress::after` (1.4s, entrance only), the gallery-fan caption (`.3s`) and cursors (`1.3s`, ambient motion), and all `@keyframes` / `[data-intro]` entrance rules other than the one added in step 2.
- Do NOT change or remove `--sg-bt-ease`; do NOT introduce a new shared token file.
- Do NOT change markup, schema, or any other hero.
- Do NOT add dependencies, run formatters, or reformat untouched lines.
- If any quoted "current" code does not match what you find (other than line-number drift explained above), STOP and report instead of improvising.

## Verification

- **Mechanical**: from the repo root, `pnpm typecheck` passes with no new errors. `grep -n "\.7s" registry/heroes/gallery-fan/styles.ts` shows only the new `[data-intro="playing"]` rule. `grep -n "60ms" registry/heroes/bento-tiles/styles.ts` shows the delay only inside the `integrations"]:hover .sg-bt-app` rule.
- **Feel check**: run `pnpm dev`.
  - Open http://localhost:3100/heroes/gallery-fan, reload, scroll it into view. The cards still open out of the stack with the same slow, staggered fan (about 0.7 s each, centre first). Once settled, sweep the pointer left and right across the fan: the raised card now follows the pointer almost immediately (about a quarter of a second), with no visible trailing; neighbours make room just as fast.
  - Move the pointer over the fan *during* the entrance: nothing jumps; the cards finish opening.
  - Open http://localhost:3100/heroes/bento-tiles. Hover each card: the lift lands in about 0.2 s. On the integrations card, the logos still fan out one after another on hover-in; move the pointer out quickly and all logos return together, immediately. Hover the portrait: a small, quick zoom (0.3 s). Hover the dark folder card: the flap opens and closes crisply.
  - In DevTools, Animations panel, set playback to 10% and hover-out of the integrations card: all logos start returning in the same frame (no staggered start).
  - Load `?motion=final` and `?motion=off` on both heroes: everything is static and at rest, no transitions (unchanged behaviour, enforced by the existing `transition: none !important` rules).
- **Done when**: no hover/pointer transition in these files exceeds 300 ms; gallery-fan's entrance looks the same as before; the logo stagger only plays on hover-in.
