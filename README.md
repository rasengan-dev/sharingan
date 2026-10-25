# Sharingan

Open-source animated hero sections, for React and as Web Components, copied into your project with the shadcn CLI.
Two engines: **WebGPU** heroes draw their background on the GPU with TypeGPU; **DOM** heroes are made of HTML, SVG and CSS 3D and run in every browser.

Text, links and buttons always stay in the DOM. Colours come from your CSS variables; a WebGPU hero shows a still poster when WebGPU or motion is unavailable.

> **Status: v0.2 in progress.** The sixteen heroes (six WebGPU, ten DOM) run locally (`pnpm dev`); nothing is published to the registry yet. The design is in [RFC-0001](proposals/RFC-0001-Sharingan.md).

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
| **Holo card** | A foil card that leans toward the pointer or the phone's tilt, and turns over | Draft |
| **Split headline** | The headline assembles letter by letter; letters near the pointer thicken and take your accent | Draft |
| **Marquee type** | Oversized words sliding in opposite rows; a row slows under the pointer, scrolling pushes them | Draft |
| **Terminal boot** | A terminal types your install command, prints its output, and your product rises from it | Draft |
| **App window** | Your product screen in HTML builds itself panel by panel, then leans toward the pointer | Draft |
| **Beam grid** | Beams of light running along a fine grid; it brightens around the pointer, a click sends beams | Draft |
| **Conic rays** | Slow rays of coloured light turning behind the title, the universal counterpart of Aurora mesh | Draft |
| **Gallery fan** | A full-screen fan of artwork cards; the nearest rises, collaborator cursors drift between them | Draft |
| **Trail map** | A route draws itself up a mountain photo in a shaped frame, a walker climbs it, clouds drift; routes scroll below | Draft |

Later (WebGPU): **Black hole** (gravitational lensing on the headline), **Metaballs**.

## Use a hero

In a project set up for shadcn, add the `@sharingan` registry to `components.json`, with the address the website is served from:

```json
{
  "registries": {
    "@sharingan": "https://<sharingan-site>/r/{name}.json"
  }
}
```

Then:

```bash
npx shadcn@latest add @sharingan/ink-flow
```

The hero lands in `components/heroes/ink-flow/`, the shared runtime in `lib/sharingan/`. No Tailwind or tsconfig change is needed: each hero brings its own stylesheet, and WebGPU heroes load their types themselves.

In React (19):

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

Each hero ships its engine, the React component, the Web Component and a typed content and config schema. The website's getting-started page (`/docs`) and each hero's page (props tables, a Customize panel that writes the code) cover the rest.

## Run locally

Requires **Node.js 20.18+**, **pnpm** and a browser with WebGPU (recent Chrome, Edge, Safari or Firefox). From the repository root:

```bash
pnpm install
pnpm dev
```

This starts the website on [http://localhost:3100](http://localhost:3100) with every hero previewed. Add `?motion=final` to a preview URL to freeze it on its poster frame, or `?motion=off` to see the fallback.

| Command | What it does |
| --- | --- |
| `pnpm registry` | Writes `registry.json` from the sources and builds it into `apps/site/public/r` with the shadcn CLI. Set `SHARINGAN_URL` to the site's public address (default `http://localhost:3100`). |
| `pnpm posters` | With `pnpm dev` running: renders every hero's still frame, light and dark, into `public/thumbs` (cards) and `public/posters` (WebGPU fallbacks). `HEADLESS=0` uses the real GPU. |
| `pnpm build` | `pnpm registry`, then the website. |
| `pnpm typecheck` | Every package. |

## Website

`apps/site` is the collection website: a getting-started guide, live previews with props tables and a config panel, and the registry files (`/r/*.json`, built by `pnpm registry`).
It is a **[Rasengan.js](https://rasengan.dev)** 2 app, created with:

```bash
npx create-rasengan@latest
```

## Deploy

On Vercel, one project:

| Site | Root Directory | Build |
| --- | --- | --- |
| Website and registry | `apps/site` | Rasengan.js with the `@rasenganjs/vercel` adapter, as Rasengan UI's sites |

## Roadmap

1. **M1** · Core and Ink flow, in React and as a Web Component, previewed in the Rasengan.js site.
2. **M2** · The rest of the v0.1 collection.
3. **M3** · Website, registry and posters (local script; CI runs typecheck and build).
4. **M3b** · DOM heroes: the second engine, eight heroes for every browser.
5. **M4** · Bridge with [Rasengan UI](https://github.com/rasengan-dev/rasengan-ui) v2: Sharingan backgrounds under its art directions.

## Contributing

Bug reports, fixes and new heroes are welcome: [CONTRIBUTING.md](CONTRIBUTING.md) covers the setup, the anatomy of a hero and the checks to run. Please follow the [code of conduct](CODE_OF_CONDUCT.md), and report security issues as described in [SECURITY.md](SECURITY.md).

## Support

Created by **[Dilane Kombou](https://github.com/dilane3)**, author of Rasengan.js ecosystem.
[Support this project and my other open-source work →](https://buymeacoffee.com/dilane3)

## License

Code is licensed under [MIT](LICENSE).
Fonts and third-party images keep their own licences; see each hero's credits.
