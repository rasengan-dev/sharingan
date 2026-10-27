# Contributing to Sharingan

Thanks for helping. Bug reports, fixes, new heroes and docs are all welcome.
Before a large change (a new hero, a change to the core), open an issue first so we can agree on the idea.

## Set up

You need **Node.js 20.18+** (see `.nvmrc`), **pnpm 10** (`corepack enable` installs the version pinned in `package.json`) and a browser with WebGPU for the WebGPU heroes (recent Chrome or Edge; Safari and Firefox work on recent versions). DOM heroes run in every browser.

```bash
git clone https://github.com/rasengan-dev/sharingan.git
cd sharingan
pnpm install
pnpm dev
```

The site opens on [http://localhost:3100](http://localhost:3100) with every hero previewed.
Add `?motion=final` to a preview URL to freeze it on its poster frame, or `?motion=off` to see the fallback.

## Repository layout

| Path | What it holds |
| --- | --- |
| `packages/core` | The shared runtime: frame loop, motion modes, pointer, theme colours, DOM helpers; the WebGPU engine under `src/webgpu`, the GSAP scroll layer of sections under `src/scroll`. Copied into projects as `lib/sharingan/`. |
| `registry/heroes/<name>` | One hero, exactly as the shadcn CLI copies it into a project. |
| `registry/sections/<name>` | One section (below the hero), the same way. |
| `apps/site` | The website (a [Rasengan.js](https://rasengan.dev) app): previews, docs, and the registry files under `/r`. |
| `scripts` | `registry.mjs` (builds the shadcn registry) and `posters.mjs` (renders still frames). |
| `proposals` | RFCs. [RFC-0001](proposals/RFC-0001-Sharingan.md) describes the design every hero follows, [RFC-0002](proposals/RFC-0002-Sections.md) the sections. |

## Add a hero

Read the hero anatomy in [RFC-0001](proposals/RFC-0001-Sharingan.md) first, then copy the folder of an existing hero of the same engine (`trail-map` or `beam-grid` for DOM, `aurora-mesh` for WebGPU). A hero folder has:

| File | Role |
| --- | --- |
| `meta.ts` | Name, title, `engine` (`"webgpu"` or `"dom"`), summary, when to use it and when not to, interaction, weight, status. |
| `schema.ts` | Zod schemas for `content` and `config`. The site builds the props tables and the Customize panel from them. |
| `engine.ts` | The framework-free engine: it takes a host element and options, returns a hero with `destroy()`. |
| `<name>.tsx` | The React component. |
| `<name>.element.ts` | The Web Component (`<sg-<name>>`), defined lazily: never at import time, since the site renders on the server. |
| `styles.ts` | The hero's stylesheet. Heroes must not rely on Tailwind in the project that installs them. |
| `example.ts` | The example content shown on the site. |

Then register it in `apps/site/src/hero-list.tsx`, add it to the tables in `README.md`, and render its posters (below).

Every hero must:

- keep text, links and buttons in the DOM, readable without JavaScript;
- respect `prefers-reduced-motion` and the `?motion=` modes;
- take its colours from CSS variables, so it follows the project's theme in light and dark;
- for WebGPU heroes, show a poster when WebGPU is unavailable (no WebGL port).

## Add a section

Sections follow [RFC-0002](proposals/RFC-0002-Sections.md): the same files as a DOM hero, in `registry/sections/<name>`, with `kind: "section"` and `scroll: { pinned, length }` in `meta.ts`. The engine builds its animations inside `createScrollScope` from `@/lib/sharingan/scroll`, which rebuilds them when the motion mode, the 768 px breakpoint or the width changes, and returns a `SectionEngine` (`setConfig`, `refresh`, `destroy`). Copy `pinned-reveal` for a pinned section, `scroll-read` for one that is not.

Then register it in `apps/site/src/section-list.tsx` and add it to the sections table in `README.md`. Every section must also:

- leave the page's scroll speed alone: pins add scroll length, nothing captures the wheel;
- render its final layout without JavaScript, under reduced motion and below 768 px (pinned sections show reveals there);
- animate only its own elements, with `transform` and `opacity`.

Images and fonts must be free to use; credit them in a `CREDITS.md` next to the files, as in `apps/site/public/sharingan/trail/`.

## Posters and thumbnails

With `pnpm dev` running, in another terminal:

```bash
pnpm posters            # every hero and section, software rendering (works anywhere)
pnpm posters trail-map  # one hero (or section)
HEADLESS=0 pnpm posters # a visible Chrome, on the real GPU
REEL=1 pnpm posters     # portrait stills for the home page's reel, into apps/site/public/reel
```

It needs Google Chrome (`CHROME_BIN` to point at another binary). Commit the files it writes in `apps/site/public/thumbs`, `apps/site/public/posters` and `apps/site/public/reel`.

## Before you open a pull request

```bash
pnpm typecheck
pnpm build
```

CI runs both. Then check your hero in the browser, in light and dark themes, at phone width, and with reduced motion.

`pnpm build` runs `pnpm registry` first, which writes `registry.json` and `apps/site/public/r`. Both are generated, and ignored by git: do not commit them.

## Commits

[Conventional Commits](https://www.conventionalcommits.org), as in the history: `feat: trail-map, a route that draws itself up a mountain photo`, `fix(core): …`, `docs: …`. One hero or one fix per pull request.

## Code of conduct

By taking part you agree to follow the [code of conduct](CODE_OF_CONDUCT.md).

## License

Contributions are released under the [MIT License](LICENSE), the project's license.
