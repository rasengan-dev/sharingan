# RFC-0001: Sharingan — open-source WebGPU heroes

- Status: Draft (M1 implemented: `@sharingan/core`, `ink-flow` in React and as a Web Component, `apps/site`)
- Author: Dilane Kombou
- Created: 2026-10-23
- Repository: `rasengan-dev/sharingan` (new, MIT)

## Summary

Sharingan is an open-source collection of **hero sections rendered with
WebGPU**: fluid ink, particle headlines, auroras, gravity fields, liquid
glass. Each hero is copied into a project with the shadcn CLI, ships for
**React and as a framework-free Web Component**, and keeps its text, links
and buttons in the DOM so the page stays accessible and indexable. Only the
background is drawn on the GPU.

Shaders are written in TypeScript with **TypeGPU**, so buffers, uniforms
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
- Accessible by construction: content in the DOM, `prefers-reduced-motion`
  honoured, nothing essential drawn on the canvas.
- Typed shaders and typed configuration (TypeGPU, Zod), readable by people
  and by agents.

## Non-goals

- A 3D engine or scene graph. Each hero is a small, purpose-built renderer.
- A WebGL renderer for every hero. The fallback is a poster, not a port
  (see "Fallback").
- Full pages or non-hero sections. Heroes first; other GPU backgrounds may
  follow if the format proves itself.

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
3. **M3 — Site and registry.** The Rasengan.js site (`apps/site`, scaffolded
   with `npx create-rasengan@beta`): docs with live previews and a config
   panel, the registry, posters generated in CI. The site is also the first
   real user of the heroes, in React.
4. **M4 — Bridge.** Rasengan UI v2 integration and a first hero there.

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
