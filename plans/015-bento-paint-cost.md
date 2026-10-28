# 015 — Cut bento-tiles' continuous and per-frame repaints

- **Status**: TODO
- **Commit**: 617c2fa
- **Severity**: MEDIUM
- **Category**: Performance
- **Estimated scope**: 2 files (bento-tiles `styles.ts` + `engine.ts`), ~40 lines

## Problem

Three paint costs in bento-tiles, none of which the user sees as motion they asked for.

### (a) The portrait scan band repaints forever, even off screen

```css
/* registry/heroes/bento-tiles/styles.ts:193-207 — current */
.sg-bt-marks-scan {
	-webkit-mask-image: ${PLUS}, linear-gradient(transparent, #000 45%, #000 55%, transparent);
	mask-image: ${PLUS}, linear-gradient(transparent, #000 45%, #000 55%, transparent);
	-webkit-mask-size: var(--sg-bt-cross, 22px) var(--sg-bt-cross, 22px), 100% 22%;
	mask-size: var(--sg-bt-cross, 22px) var(--sg-bt-cross, 22px), 100% 22%;
	-webkit-mask-position: 0 0, 0 -40%;
	mask-position: 0 0, 0 -40%;
	filter: brightness(1.25) drop-shadow(0 0 4px var(--sg-bt-marks));
	animation: sg-bt-scan 5.5s cubic-bezier(.45, 0, .55, 1) infinite;
	transition: opacity .3s;
}
@keyframes sg-bt-scan {
	0% { -webkit-mask-position: 0 0, 0 -40%; mask-position: 0 0, 0 -40%; }
	60%, 100% { -webkit-mask-position: 0 0, 0 140%; mask-position: 0 0, 0 140%; }
}
```

`mask-position` is not compositable, and the layer also carries a `drop-shadow` filter, so every frame repaints and re-filters the band, forever — including when the hero has been scrolled away. The engine already tracks visibility:

```ts
// registry/heroes/bento-tiles/engine.ts:396-399 — current
	const visibility = trackVisibility(host, (ratio) => {
		if (host.dataset.intro === "pending" && ratio >= 0.2) play();
		if (!host.dataset.intro) pressSoon();
	});
```

(`trackVisibility` in `packages/core/src/dom.ts:45-56` is an IntersectionObserver with thresholds `[0, 0.25, 0.5, 0.75, 1]`; it calls back with the ratio on every crossing, including the initial one, so `ratio === 0` is reported when the hero leaves the viewport.)

### (b) Tile shadows are recomputed and repainted every frame while the pointer moves

Each tile's third shadow is built from `--lift`, so its offset, blur, spread and alpha change continuously:

```css
/* registry/heroes/bento-tiles/styles.ts:93-104 — current */
.sg-bt-tile {
	--lift: 0;
	position: absolute;
	width: var(--sg-bt-tile); height: var(--sg-bt-tile);
	border-radius: calc(var(--sg-bt-tile) * .12);
	background: linear-gradient(150deg, color-mix(in oklab, var(--background, #fff) 55%, var(--sg-bt-paper)), var(--sg-bt-paper) 60%);
	box-shadow:
		inset 0 1px 0 color-mix(in oklab, var(--background, #fff) 90%, transparent),
		0 0 0 1px color-mix(in oklab, var(--sg-bt-ink) 4%, transparent),
		0 calc(4px + var(--lift) * 10px) calc(10px + var(--lift) * 18px) calc(-6px - var(--lift) * 4px) color-mix(in oklab, var(--sg-bt-ink) calc(10% + var(--lift) * 10%), transparent);
	transform: translateY(calc(var(--lift) * -5px)) scale(calc(1 + var(--lift) * .02));
}
```

```css
/* registry/heroes/bento-tiles/styles.ts:122-128 — current */
.dark .sg-bt-tile, .sg-bt[data-tone="dark"] .sg-bt-tile {
	background: linear-gradient(150deg, color-mix(in oklab, var(--sg-bt-ink) 9%, var(--sg-bt-paper)), var(--sg-bt-paper) 70%);
	box-shadow:
		inset 0 1px 0 color-mix(in oklab, var(--sg-bt-ink) 10%, transparent),
		0 0 0 1px color-mix(in oklab, var(--sg-bt-ink) 6%, transparent),
		0 calc(4px + var(--lift) * 10px) calc(12px + var(--lift) * 18px) -6px rgb(0 0 0 / calc(.45 + var(--lift) * .25));
}
```

The engine writes `--lift` on every tile near the pointer, every frame:

```ts
// registry/heroes/bento-tiles/engine.ts:334 — current
			if (Math.abs(lift - tile.lift) > 0.001) tile.element.style.setProperty("--lift", lift.toFixed(3));
```

A blurred shadow whose geometry changes must be re-rasterised each frame, for every lifted tile.

### (c) The map "ping" keyframes on 557 circles restart from zero on every re-hover

```css
/* registry/heroes/bento-tiles/styles.ts:238-244 — current */
.sg-bt-map { position: absolute; inset: 14% 4% auto; width: 92%; height: auto; overflow: visible; }
.sg-bt-map circle { fill: #fff; opacity: .42; transform-box: fill-box; transform-origin: center; }
.sg-bt-card[data-sg-card="folder"]:hover .sg-bt-map circle { animation: sg-bt-ping 1.4s ease-out calc(var(--d, 0) * 22ms) both; }
@keyframes sg-bt-ping {
	30% { opacity: 1; fill: var(--sg-bt-accent); transform: scale(1.7); }
	100% { opacity: .42; fill: #fff; transform: none; }
}
```

The map is built in `engine.ts:163-184`: 557 `<circle>` elements (counted from the `WORLD` bitmap at 617c2fa), each with `--d` = its distance from the folder (0–36). On hover, all 557 run a keyframe animating `opacity`, `fill` and an SVG `transform` (each a repaint). Because it is a keyframe, leaving and re-entering mid-wave restarts every circle from zero: the dots that were lit snap back to white, a visible jump.

## Target

- **(a)** The engine sets `data-offscreen` on the host while the visibility ratio is `0`, and removes it otherwise and on destroy. CSS: `.sg-bt[data-offscreen] .sg-bt-marks-scan { animation-play-state: paused; }`.
- **(b)** The tile keeps a **static** resting shadow (the lift-0 values of today's formula). The lifted shadow (today's lift-1 values) lives on a `.sg-bt-tile::after` with the same border radius, `inset: 0`, `z-index: -1`, and `opacity: var(--lift)`. The tile's `transform` stays driven by `--lift`. Values:
  - light resting: `0 4px 10px -6px color-mix(in oklab, var(--sg-bt-ink) 10%, transparent)`
  - light lifted (`::after`): `0 14px 28px -10px color-mix(in oklab, var(--sg-bt-ink) 20%, transparent)`
  - dark resting: `0 4px 12px -6px rgb(0 0 0 / .45)`
  - dark lifted (`::after`): `0 14px 30px -6px rgb(0 0 0 / .7)`

  Stacking: `.sg-bt-tile` always has a non-`none` `transform` (`translateY(calc(var(--lift) * -5px)) scale(…)` computes to a matrix even at lift 0), so each tile is already a stacking context: the `::after` with `z-index: -1` stays inside its tile, painted above the tile's own background. That is harmless because an outer `box-shadow` is never drawn inside its own border box, and the pseudo-element has no background. No `isolation` is needed. The pseudo-element's shadow geometry never changes; only its opacity does.
- **(c)** No keyframes. Circles carry `transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1), fill 300ms cubic-bezier(0.23, 1, 0.32, 1);`. On folder-card hover: `opacity: 1; fill: var(--sg-bt-accent); transition-delay: calc(var(--d, 0) * 22ms);` — the delay only in the hover rule, so leaving fades every dot back at once, and re-entering mid-wave continues from the current colour instead of restarting. The scale is dropped (and with it `transform-box` / `transform-origin`, which only served it). The `sg-bt-ping` keyframes are deleted. Behaviour change, intended: the dots stay lit while the card is hovered instead of flashing and returning to white.

## Repo conventions to follow

- Tabs; terse why-comments; CSS in the `bentoTilesStyles` template string in `registry/heroes/bento-tiles/styles.ts`.
- Host state as attributes toggled by the engine and removed in `destroy`, exactly like `data-pointer`: `engine.ts:353` (`host.toggleAttribute("data-pointer", pointer.inside);`) and `engine.ts:453` (`host.removeAttribute("data-pointer");`), styled at `styles.ts:121` (`.sg-bt[data-pointer] .sg-bt-glow { opacity: 1; }`).
- No shared easing token exists: write `cubic-bezier(0.23, 1, 0.32, 1)` inline.
- Line numbers are for commit `617c2fa`. If plans 003, 004 or 011 ran first, lines in these files have shifted: find code by the quoted text. Only a content mismatch is a reason to stop.

## Steps

### (a) Pause the scan off screen

1. `registry/heroes/bento-tiles/engine.ts:396-399` — replace the visibility callback with:

   ```ts
   	const visibility = trackVisibility(host, (ratio) => {
   		// Off screen, the scan band (a repainting mask animation) stops.
   		host.toggleAttribute("data-offscreen", ratio === 0);
   		if (host.dataset.intro === "pending" && ratio >= 0.2) play();
   		if (!host.dataset.intro) pressSoon();
   	});
   ```

2. `registry/heroes/bento-tiles/engine.ts` `destroy()` — after `host.removeAttribute("data-pointer");` (line 453), add:

   ```ts
   			host.removeAttribute("data-offscreen");
   ```

3. `registry/heroes/bento-tiles/styles.ts` — directly after the `@keyframes sg-bt-scan { … }` block (ends at line 207), add:

   ```css
   /* Off screen, the band stops: it repaints every frame otherwise */
   .sg-bt[data-offscreen] .sg-bt-marks-scan { animation-play-state: paused; }
   ```

### (b) Static tile shadow, lifted shadow faded in on a pseudo-element

4. `registry/heroes/bento-tiles/styles.ts:93-104` — replace the `.sg-bt-tile` rule with the rule below, and add the `::after` rule right after it (before `.sg-bt-tile[data-press]` at line 105):

   ```css
   .sg-bt-tile {
   	--lift: 0;
   	position: absolute;
   	width: var(--sg-bt-tile); height: var(--sg-bt-tile);
   	border-radius: calc(var(--sg-bt-tile) * .12);
   	background: linear-gradient(150deg, color-mix(in oklab, var(--background, #fff) 55%, var(--sg-bt-paper)), var(--sg-bt-paper) 60%);
   	/* Resting shadow, fixed: the lift only fades in ::after, so no blurred shadow is redrawn per frame */
   	box-shadow:
   		inset 0 1px 0 color-mix(in oklab, var(--background, #fff) 90%, transparent),
   		0 0 0 1px color-mix(in oklab, var(--sg-bt-ink) 4%, transparent),
   		0 4px 10px -6px color-mix(in oklab, var(--sg-bt-ink) 10%, transparent);
   	transform: translateY(calc(var(--lift) * -5px)) scale(calc(1 + var(--lift) * .02));
   }
   /* The lifted shadow. The tile's transform makes it a stacking context, so z-index: -1 stays inside it */
   .sg-bt-tile::after {
   	content: ""; position: absolute; inset: 0; z-index: -1;
   	border-radius: inherit;
   	box-shadow: 0 14px 28px -10px color-mix(in oklab, var(--sg-bt-ink) 20%, transparent);
   	opacity: var(--lift);
   	pointer-events: none;
   }
   ```

5. `registry/heroes/bento-tiles/styles.ts:122-128` — replace the dark tile rule with the rule below plus its `::after` counterpart:

   ```css
   .dark .sg-bt-tile, .sg-bt[data-tone="dark"] .sg-bt-tile {
   	background: linear-gradient(150deg, color-mix(in oklab, var(--sg-bt-ink) 9%, var(--sg-bt-paper)), var(--sg-bt-paper) 70%);
   	box-shadow:
   		inset 0 1px 0 color-mix(in oklab, var(--sg-bt-ink) 10%, transparent),
   		0 0 0 1px color-mix(in oklab, var(--sg-bt-ink) 6%, transparent),
   		0 4px 12px -6px rgb(0 0 0 / .45);
   }
   .dark .sg-bt-tile::after, .sg-bt[data-tone="dark"] .sg-bt-tile::after { box-shadow: 0 14px 30px -6px rgb(0 0 0 / .7); }
   ```

   Leave the `.sg-bt-tile[data-press]` rule and `@keyframes sg-bt-press` (lines 105-111) unchanged; they animate the tile's own `box-shadow` on a rare idle press, which is fine.

   No engine change: `engine.ts:334` keeps writing `--lift` on the tile; the `::after` inherits it.

### (c) Map: transitions instead of the ping keyframes

6. `registry/heroes/bento-tiles/styles.ts:239-244` — replace these lines (the `circle` rule, the hover rule and the whole `@keyframes sg-bt-ping` block) with:

   ```css
   .sg-bt-map circle {
   	fill: #fff; opacity: .42;
   	transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1), fill 300ms cubic-bezier(0.23, 1, 0.32, 1);
   }
   /* A wave from the folder on the way in (delay by distance); leaving, every dot fades back at once.
      Transitions, not keyframes: a re-hover picks up from where the dots are. */
   .sg-bt-card[data-sg-card="folder"]:hover .sg-bt-map circle { opacity: 1; fill: var(--sg-bt-accent); transition-delay: calc(var(--d, 0) * 22ms); }
   ```

   Keep line 238 (`.sg-bt-map { … }`) unchanged. After this step, `grep -n "sg-bt-ping" registry/heroes/bento-tiles/` must return nothing.

## Boundaries

- Do NOT change the scan band's look, duration or curve; only pause it off screen.
- Do NOT change the tile `transform` formula, the tile-wall engine loop (`tileFrame`), the press animation, or the glow.
- Do NOT change the map's markup generation in `engine.ts:163-184`, the `--d` values, or the folder flap.
- Do NOT touch other heroes or `packages/core`. No dependencies, no formatters.
- If the quoted code does not match (beyond line drift), STOP and report.

## Verification

- **Mechanical**: `pnpm typecheck` from the repo root passes. `grep -n "sg-bt-ping\|var(--lift) \* 10px" registry/heroes/bento-tiles/styles.ts` returns nothing.
- **Feel check**: run `pnpm dev` and open http://localhost:3100/heroes/bento-tiles (check in light and dark theme).
  - Tiles: sweep the pointer over the tile wall behind the headline. Tiles near the pointer still rise and their shadow deepens and drops smoothly; tiles at rest look the same as before (soft shadow, 1px ring, top highlight). No tile shows a dark square or shadow *on its face*; the lifted shadow is only visible below/around the tile. The look at rest and fully lifted should match the previous version; in between, the shadow cross-fades rather than growing, which is the intended trade.
  - DevTools → Rendering → Paint flashing: while moving the pointer over the wall, the flashing should be far less than before (before: every lifted tile flashed every frame).
  - Portrait: the red scan band still sweeps the face every 5.5 s. Scroll the hero fully out of view and back; in the Elements panel, `data-offscreen` is on the host while it is out of view and gone when it is back. Performance panel recording while scrolled away: no recurring paint for the bento.
  - Folder card: hover it — the dots light up accent-green in a wave spreading out from the folder and stay lit while hovered. Leave: all dots fade back to dim white together in ~0.3 s. Leave and re-enter mid-wave: no dot snaps back to white; the wave continues from where it was.
  - In the Animations panel at 10% playback, hover-out of the folder card: every dot starts fading in the same frame.
  - `?motion=final` and `?motion=off`: no scan band (still hidden by the existing rule), tiles flat (no lift, `::after` at opacity 0), the map static, nothing moves on hover.
- **Done when**: the scan pauses off screen, tile shadows no longer change geometry per frame, the map uses transitions with no `sg-bt-ping` keyframes, and the hero looks the same at rest.
