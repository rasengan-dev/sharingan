# RFC-0001: Sharingan — open-source animated heroes

- Status: Draft (M1, M2, M3 and M3b implemented: `@sharingan/core`, the six WebGPU heroes of v0.1 and the eight DOM heroes of v0.2 (and those added after it, `iso-deck` the latest), in React and as Web Components, previewed in `apps/site`)
- Author: Dilane Kombou
- Created: 2026-10-23
- Repository: `rasengan-dev/sharingan` (new, MIT)

## Summary

Sharingan is an open-source collection of **animated hero sections**, built
on two engines. **WebGPU heroes** draw a background on the GPU: fluid ink,
particle headlines, auroras, gravity fields, liquid glass. **DOM heroes** are
made of HTML, SVG and CSS 3D only: an interactive object such as a game
controller, animated type, a product mockup that comes alive. They run in
every browser. Each hero is copied into a project with the shadcn CLI, ships for
**React and as a framework-free Web Component**, and keeps its text, links
and buttons in the DOM so the page stays accessible and indexable. Only the
background is drawn on the GPU.

WebGPU shaders are written with **TypeGPU**, so buffers, uniforms
and shader functions are typed end to end. Every hero reads its colours from
CSS custom properties, which lets it follow a site's theme, and falls back
to a still poster wherever WebGPU or motion is unavailable.

It is a project of its own, with its own name and release rhythm, built to
plug into Rasengan UI v2 later (see "Relation to Rasengan UI").

## Motivation

Animated heroes on the web today are mostly WebGL: three.js examples,
gradient generators, older libraries such as Vanta.js. Very little is built
for WebGPU, and almost nothing is:

| Gap | Today | Sharingan |
|---|---|---|
| Ownership | npm packages or pasted demos | copied into the project, owned and edited (shadcn registry) |
| Accessibility | text often drawn in the canvas | text, links and buttons stay in the DOM |
| Weight | three.js (~150 KB gzip) for one background | TypeGPU and the hero's own shaders only, measured per hero |
| Theming | colours hard-coded in shaders | colours read from CSS variables, live |
| Compute | WebGL has no compute shaders | fluid, particles and simulations run in compute passes |
| Resilience | blank canvas when the GPU is missing | still poster, reduced motion, pause when off screen |

WebGPU now ships in Chrome, Edge, Safari and Firefox, but not on every
machine (some Linux setups, low-end Android). The collection treats it as an
enhancement: the hero must read well without it.

## Goals

- A hero is added with one command (`npx shadcn add @sharingan/<name>`) and
  is fully owned by the project afterwards.
- The same hero works in React and in any page through a custom element
  (`<sg-ink-flow>`), from one shared engine.
- 60 fps on an integrated laptop GPU at 1440p; graceful on phones.
- Every browser gets a moving hero: DOM heroes need nothing beyond CSS
  transforms and SVG, which every current browser supports.
- Accessible by construction: content in the DOM, `prefers-reduced-motion`
  honoured, nothing essential drawn on the canvas.
- Typed shaders and typed configuration (TypeGPU, Zod), readable by people
  and by agents.

## Non-goals

- A 3D engine or scene graph. Each hero is a small, purpose-built renderer.
- A WebGL renderer for every hero. The fallback is a poster, not a port
  (see "Fallback").
- WebGL. Effects that need a shader stay WebGPU; effects a browser can
  compose stay DOM. A third engine would double the maintenance for a
  shrinking gap.
- Canvas 2D heroes. Anything drawn per pixel belongs to WebGPU.
- Full pages. Non-hero sections were a non-goal here too; they are now a
  collection of their own, with its own engine rules, in
  [RFC-0002](RFC-0002-Sections.md).

## Decisions

| Question | Decision |
|---|---|
| GPU API | WebGPU in the browser, through **TypeGPU**. No Rust/wgpu: a wasm module per hero would be heavy and hard to copy and edit |
| Shader language | Data shared by CPU and GPU is declared once with TypeGPU schemas (`typegpu/data`); `tgpu.resolve` writes the matching WGSL structs into each shader. Passes are WGSL. Validated in M1: no build plugin is needed, so a copied hero works without configuring Vite. TypeScript shader functions (`"use gpu"` + `unplugin-typegpu`) stay possible once TypeGPU's texture and pipeline APIs leave `~unstable` |
| Targets | React component **and** Web Component, both thin layers over one engine |
| Distribution | **shadcn registry**: `registry:lib` for the core, `registry:block` per hero |
| Website | a **Rasengan.js** app, created with `npx create-rasengan@beta` (create-rasengan 1.5.0-beta.5, Rasengan.js 2.0.0-beta.5 at the time of writing). It hosts the docs, the live previews and the registry files |
| Content | typed `content` prop (Zod), like Rasengan UI v2 |
| Look | typed `config` (Zod): colours from CSS variables, speed, density, interaction |
| Fallback | still poster (pre-rendered frame) plus a CSS gradient; content always visible |
| Motion preferences | `prefers-reduced-motion`: render one still frame, no loop |
| Engines | Two: `webgpu` (TypeGPU, a canvas behind the content) and `dom` (HTML, SVG, CSS 3D, small scripts). Declared in `meta.engine`, shown as a badge and a filter on the site |
| Licence | MIT for code; TypeGPU is MIT |

## Detailed design

### Repository layout

```
sharingan/
  packages/
    core/                         @sharingan/core: device, loop, resize, fallback, theme bridge
  registry/
    heroes/
      ink-flow/
        engine.ts                 framework-free renderer: createInkFlow(canvas, config)
        shaders.ts                TypeGPU functions, buffers and layouts
        ink-flow.tsx              React: <InkFlowHero content config />
        ink-flow.element.ts       Web Component: <sg-ink-flow>
        schema.ts                 content and config schemas (Zod)
        example.ts                realistic default content and config
        meta.ts                   what it is, cost, interactions (for docs and agents)
        poster.webp               generated still frame
  apps/
    site/                         Rasengan.js app (npx create-rasengan@beta): docs, live previews, registry host (registry.json, /r/*.json)
  proposals/
```

### The core (`@sharingan/core`)

Shared by every hero, published as `registry:lib` (copied like the heroes):

- **Device**: `tgpu.init()` once per page, shared by every hero on it; a
  clear result when WebGPU is missing or the adapter is lost.
- **Canvas**: resize observer, device-pixel ratio capped (1.5 by default,
  1 on low-power devices), context configuration with the preferred format.
- **Loop**: one `requestAnimationFrame` loop for all heroes on the page;
  pauses when the canvas leaves the viewport (`IntersectionObserver`) or the
  tab is hidden; a frame budget that lowers resolution before dropping frames.
- **Motion modes**: `ready`, `reduced` (one frame, no loop), `final` (a fixed
  time `t`, for screenshots and visual tests), `off`. Same idea as Rasengan
  UI's `data-motion`, and readable from `?motion=final|off`.
- **Theme bridge**: reads colours from CSS custom properties (`--sg-*`, or a
  site's own tokens such as `--brand`, `--glow`), converts them to linear
  vectors for the GPU, and re-reads them when a `data-theme` or
  `data-direction` attribute changes.
- **Pointer**: normalised pointer position and velocity in canvas space,
  touch included, for heroes that react to the cursor.
- **Fallback**: swaps the canvas for the poster when the device cannot be
  created, and reports why (`unsupported`, `lost`, `reduced`).

### Anatomy of a hero

**`engine.ts`** — framework-free:

```ts
export interface InkFlowEngine {
  setConfig(config: Partial<InkFlowConfig>): void;
  pause(): void;
  resume(): void;
  destroy(): void;
}
export function createInkFlow(canvas: HTMLCanvasElement, config: InkFlowConfig): Promise<InkFlowEngine>;
```

**`shaders.ts`** — TypeGPU. Buffers and uniforms are declared with
`typegpu/data` schemas, so the CPU side and the WGSL agree by construction.
The exact API is pinned to one TypeGPU version and validated in milestone 1
(TypeGPU is pre-1.0: 0.12 at the time of writing).

**`ink-flow.tsx`** — React:

```tsx
<InkFlowHero
  content={{ headline: "Ship invoices before coffee", subheadline: "…", primaryCta: { label: "Start free", href: "/signup" } }}
  config={{ colors: ["var(--brand)", "var(--glow)"], viscosity: 0.4 }}
/>
```

It renders a `<section>` with the content in the DOM and the canvas behind
it. A `<InkFlowBackground config />` export gives only the background layer
for people who bring their own hero layout.

**`ink-flow.element.ts`** — the same for any page:

```html
<sg-ink-flow colors="var(--brand), var(--glow)" viscosity="0.4">
  <h1>Ship invoices before coffee</h1>
  <a href="/signup">Start free</a>
</sg-ink-flow>
```

The element draws its background in its shadow root and slots the page's
own content, which stays in the light DOM (accessible, indexable).

**`schema.ts`** — two Zod schemas: `content` (text, links, image, with copy
guidance in `.describe()` as in Rasengan UI v2) and `config` (visual
parameters with ranges and defaults). The example must parse with both.

**`meta.ts`**:

```ts
export const meta = {
  name: "ink-flow",
  title: "Ink flow",
  summary: "Brand-coloured ink that swirls behind the headline and follows the cursor.",
  interaction: ["pointer"],          // pointer, scroll, idle
  gpu: { compute: true, cost: 2 },   // 1 light · 2 medium · 3 heavy
  weight: { jsKb: 0 },               // measured by the registry build
  status: "draft",
} satisfies HeroMeta;
```

### Two engines

Sharingan began as a WebGPU collection. WebGPU is still missing on many
phones (Android before 12 or on older GPUs, iOS before 26), where those heroes
show their CSS fallback. The Noa Pad demo, a playable game controller built
from SVG and CSS 3D transforms, showed that a hero can be striking without
the GPU and run everywhere. The collection now holds both kinds, under one
contract.

| | `webgpu` | `dom` |
|---|---|---|
| Made of | a canvas behind the content, WGSL passes through TypeGPU | HTML, inline SVG, CSS transforms and keyframes, a small script for input |
| For | per-pixel work: fluids, particles, simulations, refraction | objects, type, mockups, light vector backgrounds |
| Runs on | browsers with WebGPU; elsewhere the CSS fallback | every current browser |
| Fallback | gradient and poster (see "Fallback") | none needed; reduced motion shows the final state |
| Budget | GPU time per frame (see "Performance budget") | no long tasks, transforms and opacity only, no layout per frame |

**Shared by both:** the `content` schema, a typed `config`, colours read from
CSS custom properties, the motion modes (`ready`, `reduced`, `final`, `off`),
pointer tracking, pausing off screen, React and Web Component targets, the
`meta.ts` read by people and agents. `@sharingan/core` splits accordingly:
motion, pointer, theme and the element helper serve both engines; the device,
frame loop and `mountScene` serve WebGPU heroes only, so a DOM hero copies
none of the GPU code.

**DOM-specific rules:**

- Interactive parts are real controls (`<button>`, `<a>`) with focus
  styles and keyboard input, never a picture of a button. When an object
  serves as navigation (the controller's D-pad), the same links exist as
  plain DOM for assistive technology.
- Animate `transform` and `opacity` only; no layout or paint-heavy
  properties in a loop. `will-change` only while moving.
- Decorative SVG is `aria-hidden`; the object carries a label when it means
  something.
- No shadow root: the sections are the page's content and stay in its DOM,
  in React and in the Web Component alike. Styles are one stylesheet per
  hero with `sg-<prefix>-` classes, rendered by React as a hoisted
  `<style href>` and added once by the Web Component (`adoptStyles`), driven
  by the same CSS variables.
- Keyboard: inside the hero every key works; elsewhere on the page only
  letters and Esc, only while the hero is mostly on screen, never while
  typing in a field. Arrows stay with the page's scrolling.
- On touch screens, controls drawn smaller than 44 px get a full-size
  equivalent next to them (the gamepad's legend).

`meta.ts` gains `engine: "webgpu" | "dom"`; `gpu` applies to WebGPU heroes
only. In the code, the shared core is `@/lib/sharingan` (with
`defineDomElement`, `adoptStyles`, `trackVisibility`) and the WebGPU engine
`@/lib/sharingan/webgpu`; a DOM hero imports only the first.

### Fallback

A hero has three states:

1. **WebGPU and motion**: live render.
2. **Reduced motion**: one frame rendered at a fixed time, then no loop.
3. **No WebGPU**, or the device is lost: the **poster**, a still frame
   rendered at build time in a GPU-enabled browser (`?motion=final`), shown
   as an `<img>` with the CSS gradient behind it while it loads.

There is no WebGL port. A second renderer per hero would double the
maintenance for a shrinking share of visitors. This can be revisited if
real traffic shows otherwise.

### Accessibility

- Content is never drawn on the canvas. The canvas is `aria-hidden`.
- No flashing above three times per second; no full-screen strobing.
- Pointer effects never move or hide content.
- Contrast is checked against the poster in light and dark themes, since
  the poster is the worst case people actually see.

### Performance budget

| Item | Budget |
|---|---|
| Hero code (gzip, its own files) | ≤ 12 KB |
| TypeGPU runtime | loaded once per page, measured and reported |
| Frame time on an integrated GPU, 1440p | ≤ 8 ms (leaves room for the page) |
| GPU memory | ≤ 64 MB per hero |
| First frame | ≤ 300 ms after the device is ready; poster shown before |
| Off screen or hidden tab | 0 frames rendered |

**Measured in M1** (Ink flow, `detail: "medium"`, Chrome 154 on Linux,
Intel UHD Graphics P630, a Coffee Lake integrated GPU): 60 fps at 1440×900
and 1920×1080; one simulation step costs about 2.5–2.9 ms of GPU time when
steps run back to back, plus a light full-screen render pass, so about
3 ms per frame against the 8 ms budget. Software rendering (SwiftShader)
runs at about 8 fps: good for correctness checks, not for tuning, since
anything injected per frame looks several times weaker there.

**Measured in M2**, same machine, 1440×900 window, dark theme, median GPU
time per frame (submit to done, so an upper bound): gravity-field 2.3 ms,
particle-type 3.4 ms, reaction-diffusion 3.5 ms, ink-flow 5–7 ms,
aurora-mesh 8.4 ms, liquid-glass 9.8 ms, all at 60 fps. Aurora mesh first
ran at 1.5 fps (87 ms): its layered noise is costly per pixel, so it now
renders at half resolution (`maxPixelRatio: 0.5`, invisible on soft light)
with three noise octaves instead of five. Its "cost 1" label measured the
technique, not the price; costs are now taken from measurements.

### Initial collection (v0.1)

| Hero | Technique | Cost |
|---|---|---|
| `aurora-mesh` | fragment shader, slow noise bands; the quiet one | 1 |
| `ink-flow` | stable-fluids simulation in compute passes, follows the cursor | 2 |
| `particle-type` | the headline sampled into particles that scatter on hover and reform | 2 |
| `gravity-field` | 200k particles pulled by the pointer | 2 |
| `reaction-diffusion` | Gray-Scott pattern growing behind the title | 2 |
| `liquid-glass` | refraction and caustics over a product shot | 3 |

Later: `black-hole` (gravitational lensing on the headline), `gamepad-3d`
(the playable controller hero in real 3D), `metaballs`.

### DOM collection (v0.2)

| Hero | Style | Idea |
|---|---|---|
| `gamepad` | object | the Noa Pad: a controller whose D-pad and buttons navigate the page, also from a real gamepad |
| `holo-card` | object | a card that tilts toward the pointer with a moving holographic sheen |
| `split-headline` | type | the headline assembles letter by letter, then letters near the pointer thicken (a text stroke, not a font axis: no reflow, any font) and take the accent |
| `marquee-type` | type | oversized words sliding in opposite rows, slowing under the pointer |
| `terminal-boot` | mockup | a terminal types the install command and the product appears from its output |
| `app-window` | mockup | an app screen builds itself panel by panel, then follows the pointer in light 3D |
| `beam-grid` | background | a grid (two CSS gradients) with beams of light running along its lines, moved by the Web Animations API |
| `conic-rays` | background | slow conic rays behind the title, the universal counterpart of `aurora-mesh` |
| `gallery-fan` | object | a full-screen fan of artwork cards in CSS 3D; the nearest card rises, collaborator cursors drift between cards (added after v0.2, from a design reference) |
| `trail-map` | object | a route that draws itself up a photo in a shaped frame (a computed `clip-path`), a walker, clouds at their own depth, a scrolling strip of routes (added after v0.2, from a design reference) |
| `curve-reel` | object | a looping reel of project cards on the inside of a curved wall (an elliptic arc in CSS 3D, cards spaced by arc length), drag with momentum, numbered steps that light up as cards pass (added after v0.2, from a design reference) |
| `sky-launch` | object | a sun behind three layers of SVG clouds; the headline arrives word by word, a rocket takes off and leaves a trail through the sun, and the clouds rise to cover the hero as it scrolls out (proposed with RFC-0002's second collection, from a design reference) |
| `iso-deck` | object | a macro pad in isometric line art (SVG built from code); a cursor selects the floating app tile, a tooltip types the tagline and the keys spell a word. Keys press under the pointer, typing the word "connects" the deck, and the front key is a link of its own (added after v0.2, from a design reference) |

#### `iso-deck`

The reference is a still illustration with one scripted loop. The hero
keeps its look and its loop, and makes the deck something to play with.

- **Geometry from code.** An isometric helper turns boxes
  (`x, y, z, w, d, h`) into three face polygons and their outlines, in one
  SVG (`deck.ts`, which React also runs on the server). Like a product
  shot, it is larger than its panel and reaches past the panel's left edge
  into the gap, never into the copy; the cable leaves through the panel's
  right edge, or its bottom when it is on the left. The deck is laid
  out from the config: a narrow strip at the back (knob, screen), the
  letters (3–6, `"START"` by default), and with two rows a front row with
  the wide key and the front key. Every box has rounded vertical edges
  (a rounded rectangle on its plane, extruded: the wall is a band between
  the bottom and top outlines, shaded left and right of the front corner).
  Boxes are drawn back to front; each
  key's cap sits in a clip that ends at the plate, so a pressed cap sinks
  instead of growing. It is redrawn only when the layout changes, never per
  frame. The object stays a deck: other objects in the same style would
  need a scene engine, a separate proposal if ever.
- **Loop.** About eight seconds, as in the reference: from the still frame
  (cursor out, tile selected, tagline in the tooltip) the keys press one by
  one to spell the word and the meter reacts; the tooltip closes, the
  cursor clicks the empty canvas to drop the selection, then drags a
  marquee over the floating tile as in a design tool (the marquee and the
  cursor share one duration and curve, so its corner stays on the tip),
  the selection snaps on with its handles and size, and the tooltip types
  the tagline again. The cursor never leaves the picture. The dotted line
  from the tile follows the axes (down, then along the deck) to the screen.
  The loop is a few attributes on the deck and CSS transitions; the meter,
  the knob's dial and the cable share one frame callback, only while the
  hero is on screen.
- **Interaction.** A key under the pointer presses (it travels down, its
  shadow tightens, the meter jumps) and the loop waits until the pointer
  has been still for about three seconds. Typing the word on the page
  presses the keys in turn (so does pressing them in order, for touch); the
  whole word "connects" the deck: the meter fills, the tile pulses and the
  tooltip reads `connectedLabel`. The coiled cable sways on a spring when
  the pointer moves fast. The front key is a real link (`keyCta`, an HTML
  link cut to the key's shape over it, with a focus ring drawn on the
  key); the rest of the deck is `aria-hidden`. The Web Component takes it
  from an `a[data-sg-key]` child, and the tooltip's lines from
  `data-tagline` and `data-connected-label`.
- **Colour.** One brand accent, `--accent` (the front key, the top of the
  meter, the connected state). The second tone, for the tile and the low
  end of the meter, is derived from it, a split complement kept light
  enough for line art (`oklch(from var(--accent) …)` with the hue turned
  by 150°, and a `color-mix()` fallback), and can be set as `accentAlt` (`accent-alt` on the element),
  as in RFC-0002's sections. Lines and faces use the ink and surface
  tokens, so dark mode flips the faces to graphite and keeps the lines.
- **Reduced motion.** The still frame, no loop; keys still answer by
  colour, without travel.
- **Demo.** `/demos/tapwire`: Tapwire, a made-up wallet connection
  service in the reference's spirit, with its own name and copy, and
  sections of both collections below the hero (RFC-0002, Demo pages).

## Relation to Rasengan UI

Separate project, shared conventions:

- the same distribution (shadcn registry), content schemas, motion modes
  (`?motion=final|off`) and agent-readable `meta.ts`;
- the theme bridge reads Rasengan UI v2 tokens (`--brand`, `--glow`,
  `--surface`), so a Sharingan background follows a Rasengan art direction;
- RFC-0001 of Rasengan UI leaves room for an optional 3D engine. Once
  Sharingan is stable, a v2 hero can declare `motion.engine: "webgpu"` and use
  a Sharingan background, without Rasengan UI depending on it otherwise.

## Milestones

1. **M1 — Core and one hero.** `@sharingan/core` and `ink-flow`, in React
   and as a Web Component, previewed in a first `apps/site` scaffolded with
   `npx create-rasengan@beta`. Validates TypeGPU with Rasengan.js and Vite,
   the theme bridge, the fallback and the budget on real devices (a laptop
   with integrated graphics, a mid-range Android, Safari).
2. **M2 — Collection v0.1.** The five other heroes.
3. **M3 — Site and registry.** Done, but for CI and deployment:
   `pnpm registry` writes `registry.json` from the sources and builds it with
   the shadcn CLI (items point at each other through `SHARINGAN_URL`, so the
   domain is chosen at deploy time); the site has a getting-started page,
   props tables generated from the Zod schemas, a Customize panel that writes
   the React and Web Component code, and an engine filter; `pnpm posters`
   renders light and dark stills (cards, WebGPU fallbacks) from the running
   site. Installing all fourteen heroes into a blank, strict Vite project
   found three issues, now fixed: the shadcn CLI strips comments at the top
   of files (so WebGPU types load from a `.d.ts` import, not a `/// <reference>`),
   `erasableSyntaxOnly` rejects parameter properties, and the WebGPU heroes'
   layout relied on Tailwind (it is now a stylesheet of the core). Posters move
   to CI once the repository is public.
4. **M3b — DOM heroes.** Done: the core split by engine, the Noa Pad
   ported as `gamepad`, and the rest of the DOM collection (v0.2), each in
   React and as a Web Component.
5. **M3c — `iso-deck`.** Done; the Tapwire demo lands with the `/demos`
   pages (RFC-0002, S7).
6. **M4 — Bridge.** Rasengan UI v2 integration and a first hero there.

## Alternatives considered

- **Rust with wgpu, compiled to wasm.** Same code natively and on the web,
  but a wasm module per hero, harder to read and edit after copying, and a
  toolchain web developers rarely have.
- **Raw WebGPU and WGSL, no library.** Zero dependencies, but untyped
  buffers and string shaders are where most WebGPU bugs live. TypeGPU's
  types are worth its weight; raw WGSL stays allowed where needed.
- **three.js (WebGPURenderer).** Mature, with a WebGL fallback, but heavy
  for a background and built around a scene graph we do not need.
- **An npm package.** Easier updates, but no ownership: people could not
  adapt a shader, and updates would change live sites.

## Open questions

1. Name: `sharingan` is taken on npm (unscoped). The registry namespace
   `@sharingan` and the npm scope look free; the domain is to check. Keep the
   name or pick another?
2. TypeGPU is pre-1.0. Pin a version per release and accept breaking changes
   until 1.0, or wait for 1.0 before M2?
3. Web Components through the shadcn CLI: the CLI assumes a configured
   project. Do vanilla users also get a direct download (one file per hero
   with the core bundled in)?
4. Should the site offer a "make your own" panel that exports a hero's
   config as code?
5. Headless CI usually has no GPU: render posters on a GPU runner, or with
   a software adapter?
6. Can a WebGPU hero fall back to a DOM hero instead of a gradient (for
   example `aurora-mesh` to `conic-rays`), or does that blur what each one
   promises?
