# 014 — Stop writing per-frame CSS variables on parent elements

- **Status**: TODO
- **Commit**: 617c2fa
- **Severity**: MEDIUM
- **Category**: Performance
- **Estimated scope**: 5 engines (`holo-card`, `app-window`, `gamepad`, `trail-map`, `beam-grid`) plus comment-only edits in 3 stylesheets. About 20–40 lines per engine.

## Problem

Custom properties inherit. Writing one on an element makes the browser recalculate style for that element **and its whole subtree**, even when only one descendant reads the variable. Five heroes do this every animation frame, or on every raw `pointermove`, which can fire faster than the display refreshes. Some also read layout (`getBoundingClientRect`) on every event, right after a style write, which forces a synchronous layout each time. On a busy page this shows up as dropped frames while the pointer moves.

### holo-card: six variables on the card, every frame, forever while visible

```ts
// registry/heroes/holo-card/engine.ts:115-126 — current
	// Pose: what the card is now, what it moves toward
	const current: Pose = { ...AT_REST };
	const target: Pose = { ...AT_REST };
	const paint = (pose: Pose) => {
		card.style.setProperty("--rx", pose.rx.toFixed(2));
		card.style.setProperty("--ry", pose.ry.toFixed(2));
		card.style.setProperty("--px", pose.px.toFixed(1));
		card.style.setProperty("--py", pose.py.toFixed(1));
		card.style.setProperty("--glow", pose.glow.toFixed(3));
		card.style.setProperty("--flip", pose.flip.toFixed(4));
	};
```

`frame` (`:181-199`) calls `paint(current)` every frame while the card is on screen. The idle drift (`:188-190`) never settles, which is by design. So both faces and everything printed on them are restyled every frame. Who reads what (`registry/heroes/holo-card/styles.ts`):

| Variable | Read by | Line |
| --- | --- | --- |
| `--rx`, `--ry`, `--flip` | `.sg-hc-card` `transform` only (the card itself) | `:68` |
| `--px`, `--py` | `.sg-hc-sheen, .sg-hc-etch` `background-position`; `.sg-hc-glare` `background` | `:109`, `:128` |
| `--glow` | `.sg-hc-face` `box-shadow`; `.sg-hc-sheen` / `.sg-hc-etch` / `.sg-hc-glare` `opacity` | `:81`, `:112`, `:115`, `:125`, `:130` |

`--glow` is also read by the **faces** (their shadow), not only by the foil layers. It keeps being written on the faces.

### app-window: four variables on the window, every frame, and the loop never stops while the mouse rests inside

```ts
// registry/heroes/app-window/engine.ts:151-212 — current
	// Pointer: the window leans, its panels shift at their depth
	const depths = panels.map((panel) => Number(panel.dataset.depth ?? 0));
	const target = { rx: 0, ry: 0, x: 0.5, y: 0.5, gx: 50, gy: 0 };
	const current = { ...target };
	let inside = false;
	host.addEventListener(
		"pointermove",
		(event) => {
			if (event.pointerType !== "mouse") return;
			const box = win.getBoundingClientRect();
			const x = Math.min(1.2, Math.max(-0.2, (event.clientX - box.left) / box.width));
			const y = Math.min(1.2, Math.max(-0.2, (event.clientY - box.top) / box.height));
			inside = true;
			Object.assign(target, { rx: (0.5 - y) * 7, ry: (x - 0.5) * 9, x, y, gx: x * 100, gy: y * 100 });
		},
		{ signal },
	);
	host.addEventListener(
		"pointerleave",
		() => {
			inside = false;
			Object.assign(target, { rx: 0, ry: 0, x: 0.5, y: 0.5, gx: 50, gy: 0 });
		},
		{ signal },
	);

	const paint = () => {
		win.style.setProperty("--rx", current.rx.toFixed(2));
		win.style.setProperty("--ry", current.ry.toFixed(2));
		win.style.setProperty("--gx", current.gx.toFixed(1));
		win.style.setProperty("--gy", current.gy.toFixed(1));
		panels.forEach((panel, index) => {
			const depth = depths[index];
			if (!depth) return;
			panel.style.translate = `${((current.x - 0.5) * depth * 7).toFixed(2)}px ${((current.y - 0.5) * depth * 5).toFixed(2)}px`;
		});
	};

	const frame = (_time: number, delta: number) => {
		const ease = 1 - Math.exp(-delta * 7);
		let moving = false;
		for (const key of Object.keys(target) as (keyof typeof target)[]) {
			const gap = target[key] - current[key];
			current[key] += gap * ease;
			if (Math.abs(gap) > 0.01) moving = true;
		}
		paint();
		if (!moving && !inside) stop();
	};

	let stopFrame: (() => void) | null = null;
	const stop = () => {
		stopFrame?.();
		stopFrame = null;
	};
	const sync = () => {
		const run = settings.tilt && mode === "ready" && built && visibility.state.ratio > 0;
		if (run && !stopFrame && inside) stopFrame = addFrame(frame);
		if (!run) stop();
	};
	host.addEventListener("pointerenter", () => sync(), { signal });
	host.addEventListener("pointermove", () => !stopFrame && sync(), { signal });
```

```ts
// registry/heroes/app-window/engine.ts:260 — current (in destroy)
			for (const name of ["--rx", "--ry", "--gx", "--gy"]) win.style.removeProperty(name);
```

Who reads what (`registry/heroes/app-window/styles.ts`): `--rx` / `--ry` only feed `.sg-aw-window`'s own `transform` (`:50`). `--gx` / `--gy` only feed `.sg-aw-glare`'s `background` (`:54`). The window holds the whole fake app (sidebar, stats, chart, table), so every frame restyles all of it.

### gamepad: four variables plus a layout read on every raw pointermove

```ts
// registry/heroes/gamepad/engine.ts:368-391 — current
	// Tilt and light follow the mouse
	host.addEventListener(
		"pointermove",
		(event) => {
			if (event.pointerType !== "mouse" || !settings.tilt || mode !== "ready") return;
			const box = stage.getBoundingClientRect();
			const x = (event.clientX - box.left) / box.width;
			const y = (event.clientY - box.top) / box.height;
			pad.classList.add("is-tracking");
			pad.style.setProperty("--ry", `${(x - 0.5) * 12}deg`);
			pad.style.setProperty("--rx", `${(0.5 - y) * 10}deg`);
			pad.style.setProperty("--gx", `${Math.min(90, Math.max(10, x * 100))}%`);
			pad.style.setProperty("--gy", `${Math.min(70, Math.max(5, y * 60))}%`);
		},
		{ signal },
	);
	host.addEventListener(
		"pointerleave",
		() => {
			pad.classList.remove("is-tracking");
			for (const name of ["--rx", "--ry", "--gx", "--gy"]) pad.style.removeProperty(name);
		},
		{ signal },
	);
```

Who reads what (`registry/heroes/gamepad/styles.ts`): `--rx` / `--ry` only feed `.sg-gp-pad`'s own `transform: rotateX(var(--rx)) rotateY(var(--ry));` (`:81`). `--gx` / `--gy` feed the pad's own `background` (`:84`, and the translucent shell at `:179`). The pad is the only consumer of all four, but it contains the whole controller (about 40 elements).

### trail-map: two variables on the hero root, on every raw pointermove, read by three children

```ts
// registry/heroes/trail-map/engine.ts:272-292 — current
	// Parallax: the photo and the route together, the clouds further
	host.addEventListener(
		"pointermove",
		(event) => {
			if (event.pointerType !== "mouse" || !settings.parallax || mode !== "ready") return;
			const box = visual.getBoundingClientRect();
			const x = ((event.clientX - box.left) / box.width) * 2 - 1;
			const y = ((event.clientY - box.top) / box.height) * 2 - 1;
			host.style.setProperty("--px", Math.max(-1, Math.min(1, x)).toFixed(3));
			host.style.setProperty("--py", Math.max(-1, Math.min(1, y)).toFixed(3));
		},
		{ signal },
	);
	host.addEventListener(
		"pointerleave",
		() => {
			host.style.setProperty("--px", "0");
			host.style.setProperty("--py", "0");
		},
		{ signal },
	);
```

```ts
// registry/heroes/trail-map/engine.ts:358 — current (in destroy)
			for (const name of ["--px", "--py", "--sg-tm-accent"]) host.style.removeProperty(name);
```

The variables are written on `host`, the whole hero (copy, frame, routes strip, every route card), and only three things read them, all through their own `transform` (`registry/heroes/trail-map/styles.ts`):

```css
/* :67 */ .sg-tm-scene   { transform: translate3d(calc(var(--px) * -10px), calc(var(--py) * -8px), 0); }
/* :91 */ .sg-tm-summit  { transform: translate(var(--bx), var(--by)) translate(calc(var(--px) * -10px), calc(var(--py) * -8px)); }
/* :121 */ .sg-tm-cloud  { transform: translate3d(calc(var(--px) * var(--depth, 22px)), calc(var(--py) * var(--depth, 22px) * .6), 0); }
```

(`--depth` is set per cloud at `:125-126`: 26px left, 18px right.)

### beam-grid: two variables on the hero root plus a layout read on every raw pointermove

```ts
// registry/heroes/beam-grid/engine.ts:170-182 — current
	// Pointer: brighter grid around it; a click sends four beams from the nearest crossing
	host.addEventListener(
		"pointermove",
		(event) => {
			if (!settings.pointer) return;
			const box = host.getBoundingClientRect();
			host.style.setProperty("--mx", `${event.clientX - box.left}px`);
			host.style.setProperty("--my", `${event.clientY - box.top}px`);
			host.toggleAttribute("data-pointer-in", true);
		},
		{ signal },
	);
	host.addEventListener("pointerleave", () => host.removeAttribute("data-pointer-in"), { signal });
```

The only reader is the `.sg-bm-spot` mask (`registry/heroes/beam-grid/styles.ts:61-62`): `radial-gradient(circle 190px at var(--mx, 50%) var(--my, 50%), …)`. The spot fills the layer, which fills the host (`inset: 0` both), so host-relative pixels are spot-relative pixels.

## Target

Per hero, keep the exact same visual formulas and change only **where** and **how often** they are written:

1. **Write each variable on the element that reads it, never on a shared ancestor.**
   - holo-card: `--px` / `--py` / `--glow` on each `.sg-hc-foil` layer; `--glow` also on each face.
   - app-window: `--gx` / `--gy` on `.sg-aw-glare`.
   - beam-grid: `--mx` / `--my` on `.sg-bm-spot`.
   - gamepad: `--gx` / `--gy` stay on the pad (the pad's own background is the only reader; see Steps).
2. **A variable that only feeds the element's own `transform` becomes a direct `element.style.transform`**, with the same formula computed in JS:
   - holo-card card: `rotateX(rx deg) rotateY(ry + flip × 180 deg)`.
   - app-window window: `rotateX(rx deg) rotateY(ry deg)`.
   - gamepad pad: `rotateX(rx deg) rotateY(ry deg)`.
   - trail-map scene, summit and clouds: their three formulas, with the pointer value inlined into the `calc()` and `var(--bx)`, `var(--by)` and `var(--depth, 22px)` kept as they are.
   - On pointer leave, remove the inline `transform`. The stylesheet's rule, whose variables default to the rest pose, takes over again, and the existing transitions ease back.
3. **Raw pointer events are batched to one write per frame.** The handler only stores `clientX` / `clientY` and schedules one `requestAnimationFrame` if none is pending. The frame callback reads the bounding box **once**, before any write, then writes. On `pointerleave`, cancel the pending frame first, so a late frame cannot re-apply the state after the reset.
   - Deliberate deviation from "cache the box on pointerenter/resize": the box is read once per frame inside the rAF, not cached. A cached box goes stale when the page scrolls under a still mouse (no `pointermove`, no `resize`). One read per frame, made before any write, is already a clean (non-forced) layout read.
4. **app-window**: the loop stops as soon as the pose has settled, even with the mouse resting inside. The next `pointermove` starts it again. `pointerleave` must also start it, so the window can ease back to rest.
5. **holo-card**: keep the idle drift, but skip every write whose value string has not changed since the last write to that element.

## Repo conventions to follow

- Engines import from `@/lib/sharingan`. Do not add imports for this plan: `requestAnimationFrame` and `cancelAnimationFrame` are globals, and app-window and trail-map already call `requestAnimationFrame` directly (`app-window/engine.ts:126`, `trail-map/engine.ts:225`).
- Listeners always take `{ signal }` from the hero's `AbortController`. Teardown lives in `destroy()`.
- Tabs, terse comments that say why. Number formatting stays exactly as today (`toFixed(2)` for degrees, `toFixed(1)` for light positions, `toFixed(3)` for parallax and glow).
- Exemplar of "write a transform directly" already in the repo: `gamepad/engine.ts:394`, `const place = (node: HTMLElement, x: number, y: number) => (node.style.transform = \`translate(${x}px, ${y}px)\`);`.

## Steps

Work file by file. Line numbers are at `617c2fa`. Inside one file, apply the steps from the bottom up (or locate blocks by their quoted text), so earlier edits do not shift later line numbers.

### holo-card

**H1. `registry/heroes/holo-card/engine.ts:115-126`.** Replace the block quoted in Problem with:

```ts
	// Pose: what the card is now, what it moves toward
	const current: Pose = { ...AT_REST };
	const target: Pose = { ...AT_REST };
	// Each value goes on the parts that read it, never on the card: a variable on the
	// card would restyle both faces and everything printed on them, every frame.
	const faces = [front, back].filter((face): face is HTMLElement => face !== null);
	const foils = [...card.querySelectorAll<HTMLElement>(".sg-hc-foil")];
	// The last value written, per element and property: the idle drift never settles, so skip what did not change.
	const written = new Map<HTMLElement, Map<string, string>>();
	const write = (node: HTMLElement, property: string, value: string) => {
		let last = written.get(node);
		if (!last) written.set(node, (last = new Map()));
		if (last.get(property) === value) return;
		last.set(property, value);
		if (property === "transform") node.style.transform = value;
		else node.style.setProperty(property, value);
	};
	const paint = (pose: Pose) => {
		// The tilt and the turn only move the card itself: its transform, straight (styles.ts:68's formula).
		write(card, "transform", `rotateX(${pose.rx.toFixed(2)}deg) rotateY(${(pose.ry + pose.flip * 180).toFixed(2)}deg)`);
		const px = pose.px.toFixed(1);
		const py = pose.py.toFixed(1);
		const glow = pose.glow.toFixed(3);
		for (const foil of foils) {
			write(foil, "--px", px);
			write(foil, "--py", py);
			write(foil, "--glow", glow);
		}
		// The faces' shadow deepens with the glow.
		for (const face of faces) write(face, "--glow", glow);
	};
```

`foils` is collected after the foil layers are created (`:53-62`) or brought by the markup (`holo-card.tsx:15-21`), so both cases are covered.

**H2. `registry/heroes/holo-card/engine.ts:237`** (in `destroy`). Current:

```ts
			for (const name of ["--rx", "--ry", "--px", "--py", "--glow", "--flip"]) card.style.removeProperty(name);
```

Replace with:

```ts
			card.style.removeProperty("transform");
			for (const node of [...foils, ...faces]) for (const name of ["--px", "--py", "--glow"]) node.style.removeProperty(name);
```

**H3. `registry/heroes/holo-card/styles.ts:1-10`** (comment only). Current:

```ts
/**
 * The holo card's stylesheet, added once per document (React renders it as
 * a hoisted <style>, the Web Component through `adoptStyles`). The engine
 * only writes a few custom properties on the card; everything you see is
 * computed here from them:
 * - `--rx`, `--ry`: the tilt, in degrees;
 * - `--px`, `--py`: where the light falls, 0 to 100;
 * - `--flip`: 0 for the front, 1 for the back;
 * - `--glow`: 0 at rest, 1 under the pointer.
 */
```

Replace with:

```ts
/**
 * The holo card's stylesheet, added once per document (React renders it as
 * a hoisted <style>, the Web Component through `adoptStyles`). The engine
 * writes the card's `transform` (tilt and turn) itself, and a few custom
 * properties only on the parts that read them, so a frame restyles those alone:
 * - `--px`, `--py` (foil layers): where the light falls, 0 to 100;
 * - `--glow` (foil layers and faces): 0 at rest, 1 under the pointer.
 * `--rx`, `--ry`, `--flip` on the card below are only its pose before the engine runs.
 */
```

Leave the CSS rules themselves (`:65`, `:68`) unchanged. They are the pre-engine rest pose.

### app-window

**A1. `registry/heroes/app-window/engine.ts:151-212`.** Replace the whole block quoted in Problem with:

```ts
	// Pointer: the window leans, its panels shift at their depth
	const depths = panels.map((panel) => Number(panel.dataset.depth ?? 0));
	const target = { rx: 0, ry: 0, x: 0.5, y: 0.5, gx: 50, gy: 0 };
	const current = { ...target };
	let inside = false;
	// The latest mouse position: read in the frame, so there is one layout read per frame, not per raw event.
	let pointer: { x: number; y: number } | null = null;
	host.addEventListener(
		"pointermove",
		(event) => {
			if (event.pointerType !== "mouse") return;
			inside = true;
			pointer = { x: event.clientX, y: event.clientY };
			if (!stopFrame) sync();
		},
		{ signal },
	);
	host.addEventListener(
		"pointerleave",
		() => {
			inside = false;
			pointer = null;
			Object.assign(target, { rx: 0, ry: 0, x: 0.5, y: 0.5, gx: 50, gy: 0 });
			// The loop may have stopped while the mouse rested: run it to ease back.
			sync();
		},
		{ signal },
	);

	const paint = () => {
		// The lean only turns the window: its transform, straight, no variable for its whole app to inherit.
		win.style.transform = `rotateX(${current.rx.toFixed(2)}deg) rotateY(${current.ry.toFixed(2)}deg)`;
		// The light is read by the glare alone.
		glare.style.setProperty("--gx", current.gx.toFixed(1));
		glare.style.setProperty("--gy", current.gy.toFixed(1));
		panels.forEach((panel, index) => {
			const depth = depths[index];
			if (!depth) return;
			panel.style.translate = `${((current.x - 0.5) * depth * 7).toFixed(2)}px ${((current.y - 0.5) * depth * 5).toFixed(2)}px`;
		});
	};

	const settled = () => (Object.keys(target) as (keyof typeof target)[]).every((key) => Math.abs(target[key] - current[key]) <= 0.01);
	const frame = (_time: number, delta: number) => {
		if (pointer) {
			const box = win.getBoundingClientRect();
			const x = Math.min(1.2, Math.max(-0.2, (pointer.x - box.left) / box.width));
			const y = Math.min(1.2, Math.max(-0.2, (pointer.y - box.top) / box.height));
			Object.assign(target, { rx: (0.5 - y) * 7, ry: (x - 0.5) * 9, x, y, gx: x * 100, gy: y * 100 });
			pointer = null;
		}
		const ease = 1 - Math.exp(-delta * 7);
		let moving = false;
		for (const key of Object.keys(target) as (keyof typeof target)[]) {
			const gap = target[key] - current[key];
			current[key] += gap * ease;
			if (Math.abs(gap) > 0.01) moving = true;
		}
		paint();
		// Settled: stop, even with the mouse resting inside; its next move starts the loop again.
		if (!moving) stop();
	};

	let stopFrame: (() => void) | null = null;
	const stop = () => {
		stopFrame?.();
		stopFrame = null;
	};
	const sync = () => {
		const run = settings.tilt && mode === "ready" && built && visibility.state.ratio > 0;
		if (run && !stopFrame && (inside || !settled())) stopFrame = addFrame(frame);
		if (!run) stop();
	};
	host.addEventListener("pointerenter", () => sync(), { signal });
```

What changed, so you can check the diff:

- The first `pointermove` no longer reads the box. It stores the position and starts the loop.
- The second `pointermove` listener (old `:212`) is gone; its job moved into the first.
- `pointerleave` also calls `sync()`.
- `paint` writes `transform` and the glare's variables.
- `frame` reads the box once, before writing, and stops whenever the pose is settled.
- `sync` also starts the loop when the pose is not settled.

**A2. `registry/heroes/app-window/engine.ts:260`** (in `destroy`). Replace:

```ts
			for (const name of ["--rx", "--ry", "--gx", "--gy"]) win.style.removeProperty(name);
```

with:

```ts
			win.style.removeProperty("transform");
```

The glare and its variables are removed at `:253` (`glare.remove()`).

**A3. `registry/heroes/app-window/styles.ts:1-6`** (comment only). Current lines 4-5:

```ts
 * separate property, so the two never fight. The window itself leans with
 * `--rx` / `--ry` and its light follows `--gx` / `--gy`, written by the engine.
```

Replace with:

```ts
 * separate property, so the two never fight. The engine writes the window's
 * lean as its `transform`, and the light's place (`--gx` / `--gy`) on the glare
 * alone; the variables on `.sg-aw-window` below are only the resting pose.
```

Leave the CSS rules (`:44-56`) unchanged.

### gamepad

**G1. `registry/heroes/gamepad/engine.ts:368-391`.** Replace the block quoted in Problem with:

```ts
	// Tilt and light follow the mouse, once per frame: raw pointer events can come far faster.
	let pointer: { x: number; y: number } | null = null;
	let tiltFrame = 0;
	const tilt = () => {
		tiltFrame = 0;
		if (!pointer) return;
		const box = stage.getBoundingClientRect();
		const x = (pointer.x - box.left) / box.width;
		const y = (pointer.y - box.top) / box.height;
		pointer = null;
		pad.classList.add("is-tracking");
		// The tilt only turns the pad: its transform, straight (styles.ts:81's formula).
		pad.style.transform = `rotateX(${(0.5 - y) * 10}deg) rotateY(${(x - 0.5) * 12}deg)`;
		// The light is the pad's own background, so its variables stay on the pad.
		pad.style.setProperty("--gx", `${Math.min(90, Math.max(10, x * 100))}%`);
		pad.style.setProperty("--gy", `${Math.min(70, Math.max(5, y * 60))}%`);
	};
	host.addEventListener(
		"pointermove",
		(event) => {
			if (event.pointerType !== "mouse" || !settings.tilt || mode !== "ready") return;
			pointer = { x: event.clientX, y: event.clientY };
			tiltFrame ||= requestAnimationFrame(tilt);
		},
		{ signal },
	);
	host.addEventListener(
		"pointerleave",
		() => {
			cancelAnimationFrame(tiltFrame);
			tiltFrame = 0;
			pointer = null;
			pad.classList.remove("is-tracking");
			pad.style.removeProperty("transform");
			for (const name of ["--gx", "--gy"]) pad.style.removeProperty(name);
		},
		{ signal },
	);
```

Why `--gx` / `--gy` stay on the pad: their only reader is the pad's own `background` (`styles.ts:84`, `:179`), so the pad is the consumer. They now change at most once per frame instead of once per raw event. Making them non-inheriting (an `@property` registration) would also spare the pad's children, but that changes how the stylesheet is loaded and is out of scope.

**G2. `registry/heroes/gamepad/engine.ts`, in `destroy()` (`:451-470`).** Right after `cancel.abort();` (`:452`), add:

```ts
			cancelAnimationFrame(tiltFrame);
```

Leave `styles.ts:77` and `:81` (`--rx: 0deg; --ry: 0deg`, `transform: rotateX(var(--rx)) rotateY(var(--ry));`) unchanged. They are now only the rest pose, which the inline transform overrides while tracking. The `.5s` / `.08s linear` transitions (`:82`, `:93`) keep working on the inline value.

### trail-map

**T1. `registry/heroes/trail-map/engine.ts:272-292`.** Replace the block quoted in Problem with:

```ts
	// Parallax: the photo and the route together, the clouds further. Each moving part gets its own
	// transform (the stylesheet's formula, with the pointer inlined), once per frame; removing it rests them.
	const clouds = created.filter((node): node is HTMLElement => node instanceof HTMLElement && node.classList.contains("sg-tm-cloud"));
	let pointer: { x: number; y: number } | null = null;
	let parallaxFrame = 0;
	const parallax = () => {
		parallaxFrame = 0;
		if (!pointer) return;
		const box = visual.getBoundingClientRect();
		const x = Math.max(-1, Math.min(1, ((pointer.x - box.left) / box.width) * 2 - 1)).toFixed(3);
		const y = Math.max(-1, Math.min(1, ((pointer.y - box.top) / box.height) * 2 - 1)).toFixed(3);
		pointer = null;
		scene.style.transform = `translate3d(calc(${x} * -10px), calc(${y} * -8px), 0)`;
		if (summit) summit.style.transform = `translate(var(--bx), var(--by)) translate(calc(${x} * -10px), calc(${y} * -8px))`;
		for (const cloud of clouds) cloud.style.transform = `translate3d(calc(${x} * var(--depth, 22px)), calc(${y} * var(--depth, 22px) * .6), 0)`;
	};
	host.addEventListener(
		"pointermove",
		(event) => {
			if (event.pointerType !== "mouse" || !settings.parallax || mode !== "ready") return;
			pointer = { x: event.clientX, y: event.clientY };
			parallaxFrame ||= requestAnimationFrame(parallax);
		},
		{ signal },
	);
	host.addEventListener(
		"pointerleave",
		() => {
			cancelAnimationFrame(parallaxFrame);
			parallaxFrame = 0;
			pointer = null;
			// Back to the stylesheet's rule, where --px / --py are 0: the transitions ease them home.
			for (const node of [scene, summit, ...clouds]) node?.style.removeProperty("transform");
		},
		{ signal },
	);
```

Notes for the executor:

- `scene`, `visual` and `summit` are `const`s narrowed or declared above (`:87-115`). `scene` and `visual` are non-null after the early return at `:91-94`. `summit` may be `null`, hence `if (summit)` and `node?.`.
- The clouds are created at `:134-142`, before this block, so `created` already holds them.

**T2. `registry/heroes/trail-map/engine.ts:358`** (in `destroy`). Replace:

```ts
			for (const name of ["--px", "--py", "--sg-tm-accent"]) host.style.removeProperty(name);
```

with:

```ts
			cancelAnimationFrame(parallaxFrame);
			host.style.removeProperty("--sg-tm-accent");
			scene.style.removeProperty("transform");
			summit?.style.removeProperty("transform");
```

(The clouds are removed with `created` at `:356`.)

**T3. `registry/heroes/trail-map/styles.ts:5-6`** (comment only). Current:

```ts
 * is an SVG over the photo, in the photo's own coordinates; parallax moves
 * the photo and the route together (`--px`, `--py`), and the clouds further.
```

Replace with:

```ts
 * is an SVG over the photo, in the photo's own coordinates; parallax moves
 * the photo and the route together, and the clouds further: the engine writes
 * each one's `transform` (the rules below, with `--px` / `--py` at 0, are the rest pose).
```

Leave the CSS rules (`:16`, `:67`, `:91`, `:121`) unchanged.

### beam-grid

**B1. `registry/heroes/beam-grid/engine.ts:170-182`.** Replace the block quoted in Problem with:

```ts
	// Pointer: brighter grid around it; a click sends four beams from the nearest crossing.
	// The spot alone reads the position: written on it (it fills the host), once per frame.
	let pointer: { x: number; y: number } | null = null;
	let spotFrame = 0;
	const follow = () => {
		spotFrame = 0;
		if (!pointer) return;
		const box = host.getBoundingClientRect();
		spot.style.setProperty("--mx", `${pointer.x - box.left}px`);
		spot.style.setProperty("--my", `${pointer.y - box.top}px`);
		pointer = null;
		host.toggleAttribute("data-pointer-in", true);
	};
	host.addEventListener(
		"pointermove",
		(event) => {
			if (!settings.pointer) return;
			pointer = { x: event.clientX, y: event.clientY };
			spotFrame ||= requestAnimationFrame(follow);
		},
		{ signal },
	);
	host.addEventListener(
		"pointerleave",
		() => {
			cancelAnimationFrame(spotFrame);
			spotFrame = 0;
			pointer = null;
			host.removeAttribute("data-pointer-in");
		},
		{ signal },
	);
```

The `click` listener (`:183-199`) still reads `host.getBoundingClientRect()` once per click. Leave it: it is one read per click.

**B2. `registry/heroes/beam-grid/engine.ts`, in `destroy()` (`:228-238`).** Right after `cancel.abort();` (`:229`), add:

```ts
			cancelAnimationFrame(spotFrame);
```

The spot is removed with `created` (`:235`). `styles.ts` needs no change. Its header comment already says the spot is "masked by a circle at `--mx` / `--my`".

## Boundaries

- Do not change any visual formula, easing constant (`delta * 7`, `* 8`, `* 5`), clamp, or number format. The pixels on screen must be identical. Only where and how often values are written changes.
- Do not touch bento-tiles, curve-reel, gallery-fan or split-headline. They write their variables on the consuming element already, or are out of this plan's scope. In particular, bento-tiles' `--mx` / `--my` (on `.sg-bt-glow`) and `--px` / `--py` (on the portrait) are already on their consumer.
- Do not touch holo-card's `pointermove` handler (`:130-144`). It reads the card's box per event but writes nothing to the DOM; the write path is the frame loop.
- Do not cache bounding boxes across frames (see Target 3).
- Do not change the CSS rules that read these variables. Only the comment edits in A3, H3 and T3.
- No new dependencies, no new files.
- If any quoted block differs from the file (drift since `617c2fa`), STOP and report.

## Verification

- **Mechanical**:
  - `pnpm typecheck` from the repo root passes.
  - `grep -nE 'setProperty\("--(rx|ry|flip)"' registry/heroes/*/engine.ts` prints nothing.
  - `grep -n 'host.style.setProperty("--p\|host.style.setProperty("--m' registry/heroes/trail-map/engine.ts registry/heroes/beam-grid/engine.ts` prints nothing.
  - `grep -n 'getBoundingClientRect' registry/heroes/gamepad/engine.ts registry/heroes/trail-map/engine.ts registry/heroes/beam-grid/engine.ts registry/heroes/app-window/engine.ts`: no hit inside a `pointermove` handler body. The tilt, parallax, spot and app-window reads now sit in `tilt`, `parallax`, `follow` and `frame`.
- **Feel check**: run `pnpm dev` and open each hero at `http://localhost:3100/heroes/<name>`:
  - **holo-card**: leave the mouse off the card. The idle drift looks exactly as before (slow lean, foil sheen sliding). Hover: the card leans toward the pointer, the glare follows, and the shadow deepens. Click to turn it over: the 180° turn eases as before, and the back's foil still follows the light. `?motion=final` shows the same fixed angle as before. Open `?motion=off`: the card sits flat at rest.
  - **app-window**: wait for the build to finish, move the mouse over the window and stop. The window settles, then becomes completely still. In DevTools > Rendering, turn on "Paint flashing": no repaint while the mouse rests inside. Move again: it follows immediately. Leave the hero: the window eases back flat, even if you had rested the mouse first.
  - **gamepad**: move the mouse over the hero. The pad tilts and its highlight follows exactly as before. Leave: it eases back flat over about 0.5s. The translucent easter-egg shell still shows its moving highlight.
  - **trail-map**: move the mouse over the hero. The photo and route shift together, the summit badge moves with them, and the clouds move further, the left one more than the right. Leave: all ease back to rest. Resize the window: the badge stays at the route's end during and after parallax (`--bx` / `--by` still apply).
  - **beam-grid**: the brighter grid circle follows the pointer exactly, with no offset, including after scrolling the page and moving again. Leaving the hero fades it out. A quick exit never leaves it lit.
  - **Performance panel** (DevTools > Performance, record 3s of moving the mouse over each hero, with CPU 4× slowdown): "Recalculate Style" events show far fewer affected elements than before. Holo-card: about the 6 foil layers + card, not the whole card subtree. App-window: window + glare + panels, not the whole app. There is at most one style recalculation and one layout per frame from these handlers, and no purple "Forced reflow" warnings from `pointermove`.
- **Done when**: no engine in this plan writes a pointer- or frame-driven variable on an ancestor of its readers; the window, pad, card, scene, summit and clouds get a direct `transform`; raw pointer handlers only store coordinates; app-window's loop stops once settled; holo-card skips unchanged writes; typecheck passes; and every hero looks identical to before.
