# Sharingan

Open-source animated hero sections, for React and as Web Components, copied into your project with the shadcn CLI.
Two engines: **WebGPU** heroes draw their background on the GPU with TypeGPU; **DOM** heroes are made of HTML, SVG and CSS 3D and run in every browser.

Text, links and buttons always stay in the DOM. Colours come from your CSS variables; a WebGPU hero shows a still poster when WebGPU or motion is unavailable.

> **Status: v0.1 in progress.** The six heroes run locally (`pnpm dev`); nothing is published to the registry yet. The design is in [RFC-0001](proposals/RFC-0001-Sharingan.md).

## Heroes

### WebGPU

| Hero | Concept | GPU cost | Status |
| --- | --- | --- | --- |
| **Aurora mesh** | Slow bands of light drifting behind the headline, the quiet one | Light | Draft |
| **Ink flow** | Brand-coloured ink that swirls and follows the cursor, a fluid simulation in compute passes | Medium | Draft |
| **Particle type** | The headline breaks into particles on hover, then reforms | Medium | Draft |
| **Gravity field** | 200,000 particles pulled toward the pointer | Medium | Draft |
| **Reaction-diffusion** | A living pattern that grows behind the title | Medium | Draft |
| **Liquid glass** | Refraction and caustics over your product shot | Heavy | Draft |

### DOM

| Hero | Concept | Status |
| --- | --- | --- |
| **Gamepad** | A game controller whose D-pad and buttons navigate the page, also from a real gamepad | Draft |
| **Holo card** | A card that tilts toward the pointer with a holographic sheen | Planned |
| **Split headline** | The headline assembles letter by letter and reacts to the pointer | Planned |
| **Marquee type** | Oversized words sliding in opposite rows | Planned |
| **Terminal boot** | A terminal types the install command and the product appears | Planned |
| **App window** | An app screen that builds itself panel by panel | Planned |
| **Beam grid** | Beams of light running along an SVG grid | Planned |
| **Conic rays** | Slow rays of light behind the title | Planned |

Later (WebGPU): **Black hole** (gravitational lensing on the headline), **Metaballs**.

## Use a hero

Add the `@sharingan` registry to your `components.json`, then:

```bash
npx shadcn@latest add @sharingan/ink-flow
```

In React:

```tsx
<InkFlowHero
  content={{ headline: "Ship invoices before coffee", primaryCta: { label: "Start free", href: "/signup" } }}
  config={{ colors: ["var(--brand)", "var(--glow)"] }}
/>
```

In any page, as a Web Component:

```html
<sg-ink-flow colors="var(--brand), var(--glow)">
  <h1>Ship invoices before coffee</h1>
  <a href="/signup">Start free</a>
</sg-ink-flow>
```

Each hero ships its engine (TypeGPU shaders), the React component, the Web Component, a typed content and config schema, and its poster.

## Run locally

Requires **Node.js 20.18+**, **pnpm** and a browser with WebGPU (recent Chrome, Edge, Safari or Firefox). From the repository root:

```bash
pnpm install
pnpm dev
```

This starts the website with every hero previewed. Add `?motion=final` to a preview URL to freeze it on its poster frame, or `?motion=off` to see the fallback.

## Website

`apps/site` is the collection website: docs, live previews with a config panel, and the registry files (`registry.json`, `/r/*.json`).
It is a **[Rasengan.js](https://rasengan.dev)** app, created with:

```bash
npx create-rasengan@beta
```

## Deploy

On Vercel, one project:

| Site | Root Directory | Build |
| --- | --- | --- |
| Website and registry | `apps/site` | Rasengan.js with the `@rasenganjs/vercel` adapter, as Rasengan UI's sites |

## Roadmap

1. **M1** · Core and Ink flow, in React and as a Web Component, previewed in the Rasengan.js site.
2. **M2** · The rest of the v0.1 collection.
3. **M3** · Website, registry and posters generated in CI.
4. **M4** · Bridge with [Rasengan UI](https://github.com/rasengan-dev/rasengan-ui) v2: Sharingan backgrounds under its art directions.

## Support

Created by **[Dilane Kombou](https://github.com/dilane3)**, author of Rasengan.js ecosystem.
[Support this project and my other open-source work →](https://buymeacoffee.com/dilane3)

## License

Code is licensed under [MIT](LICENSE).
Fonts and third-party images keep their own licences; see each hero's credits.
