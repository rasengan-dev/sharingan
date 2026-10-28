# RFC-0002: Sections — the animated sections below the hero

- Status: Draft (S1, S2 and S3 implemented: `sharingan-scroll`, the six sections in React and as Web Components, `/sections/[name]` and `/demo` on the site; S4–S7, the second collection: four sections, `sky-launch` and the demos under `/demos`)
- Author: Dilane Kombou
- Created: 2026-10-27
- Amends: [RFC-0001](RFC-0001-Sharingan.md), non-goal "Full pages or non-hero sections"

## Summary

Sharingan adds a second collection beside the heroes: **sections**, the
animated blocks a page scrolls through after its hero. A card deck that
deals itself into a grid as you scroll, an image that grows to full width
under a pinned headline, a paragraph that darkens as it is read. Each
section is copied with the shadcn CLI like a hero, ships for React and as a
Web Component, and keeps its content in the DOM.

Sections are driven by scroll, so they use **GSAP** (ScrollTrigger and Flip),
the first animation library in Sharingan. It is a dependency of sections
only: heroes and `@sharingan/core` stay as they are.

There is no collection of full landing pages. The site shows one demo page
built from a hero and sections, and people copy the pieces they want.

## Motivation

A hero ends at the fold. What follows it on a landing page is where most
of the scroll motion lives, and it is harder to get right than the hero:
pinning, scrubbing, elements that travel from one layout to another,
recalculation on resize and on the phone's moving address bar.

The design reference for this RFC is an art-marketplace landing page (a
screen recording shared on Pinterest). Its hero is close to `gallery-fan`;
below it, the page pins headlines, grows an image to full width, darkens a
paragraph word by word, shuffles a card deck that then deals out into a
staircase and lands in a tabbed grid, moves two columns at different
speeds, and zooms out of one image into a mosaic. None of these are heroes,
and each stands on its own under any hero.

Full pages were considered and rejected (see "Alternatives considered"):
people who copy a page rewrite most of it and keep its sections. Sections
are the reusable unit.

## Goals

- A section is added with one command
  (`npx shadcn add @sharingan/<name>`) and is owned by the project
  afterwards, exactly like a hero.
- Each section stands alone: it works under any hero, or with no hero, and
  depends on no other section.
- The same section works in React and as a custom element
  (`<sg-card-journey>`), from one engine.
- Scroll motion that feels native: the page scrolls at its own speed; a
  section animates against that scroll, never instead of it.
- Accessible and readable at every scroll position, with reduced motion
  and without JavaScript.

## Non-goals

- Full landing-page templates. The site's demo page is a showcase, not an
  installable item.
- Scroll hijacking: no smooth-scroll library (Lenis and the like), no
  snapping that takes over the wheel, no change to scroll speed.
- WebGPU sections, for now. Sections are DOM only (HTML, SVG, CSS
  transforms); a GPU background can follow if a section needs one.
- Moving heroes to GSAP. Heroes keep their own engines (see "Open
  questions" for `gallery-fan`).

## Decisions

| Question | Decision |
|---|---|
| Collection | `registry/sections/<name>/`, beside `registry/heroes/` |
| Engine | DOM only: HTML, inline SVG, CSS transforms and opacity |
| Animation library | **GSAP 3.15** with **ScrollTrigger** (pinning, scrubbing) and **Flip** (elements moving between layouts), pinned to one version per release |
| Where GSAP lives | sections and a new `sharingan-scroll` lib only; `sharingan-core` and every hero stay free of it |
| Distribution | `registry:block` per section, `categories: ["section"]`, with `gsap` as an npm dependency installed by the shadcn CLI |
| Content and config | typed `content` and `config` (Zod), as for heroes |
| Motion modes | the core's `ready`, `reduced`, `final`, `off`, mapped to GSAP below |
| Demo page | one page on the site combining a hero with several sections; not in the registry |
| Licence | MIT for Sharingan's code. GSAP keeps its own licence (see "GSAP") and is never copied into the repository or the registry |

## Detailed design

### Repository layout

```
sharingan/
  packages/
    core/
      src/
        scroll/                   sharingan-scroll: GSAP setup shared by sections
  registry/
    heroes/                       unchanged
    sections/
      card-journey/
        engine.ts                 createCardJourney(root, config): SectionEngine
        card-journey.tsx          React: <CardJourneySection content config />
        card-journey.element.ts   Web Component: <sg-card-journey>
        schema.ts                 content and config schemas (Zod)
        styles.ts                 the section's stylesheet (sg-cj- classes)
        example.ts                realistic default content and config
        meta.ts                   what it is, scroll length, interactions
  apps/
    site/                         /sections/[name] previews, the demo page
```

`scripts/registry.mjs` reads `registry/sections` the same way it reads
`registry/heroes`, and adds a `sharingan-scroll` lib item that depends on
`sharingan-core`.

### The scroll lib (`sharingan-scroll`)

A small layer between the core and GSAP, copied to `lib/sharingan/scroll`
like the WebGPU engine is copied to `lib/sharingan/webgpu`. A hero imports
none of it.

- **Registration**: registers ScrollTrigger and Flip once per page.
- **Context**: `createScrollScope(root, build)` runs `build` inside a
  `gsap.context` scoped to the section's root, so `destroy()` kills every
  tween and trigger it made, and remounting never leaves pin spacing behind.
- **Motion modes**: reads the core's `readMotionMode()` and rebuilds when
  the preference changes, through `gsap.matchMedia()`:

  | Mode | Behaviour |
  |---|---|
  | `ready` | the full section: pins, scrubbed timelines, Flip moves |
  | `reduced` / `off` | no pin, no scrub: the final layout, with at most a short opacity fade as the section enters |
  | `final` | the final layout, no fade: for posters, thumbnails and visual tests |

- **Breakpoints**: the same `matchMedia` call gives each section a narrow
  layout (below 768 px by default), where long pins become shorter or are
  replaced by reveals (see "Open questions").
- **Refresh**: `ScrollTrigger.refresh()` whenever the page's height changes
  (images and fonts loading late, a hero's intro), watched once per page. A
  rebuild keeps the scroll position: reverting a pin removes its spacer for a
  moment, and scroll anchoring would otherwise carry the page up with it.
- **Helpers**: `scrubs(context)` (motion on and a wide screen),
  `revealOnEnter` (the quiet version), `splitWords` / `wordsOf` (text read on
  scroll) and `boxWithin` (where an element sits in the stage, before any
  transform).

### Anatomy of a section

**`engine.ts`**, framework-free:

```ts
export interface SectionEngine {
  setConfig(config: Partial<CardJourneyConfig>): void;
  refresh(): void;
  destroy(): void;
}
export function createCardJourney(root: HTMLElement, config: CardJourneyConfig): SectionEngine;
```

The engine receives the section's rendered DOM and only animates it. It
never creates content.

**`card-journey.tsx`** renders a `<section>` with its content and calls the
engine in an effect. **`card-journey.element.ts`** does the same for
`<sg-card-journey>` with no shadow root, as DOM heroes do (the content is
the page's content). **`schema.ts`**, **`styles.ts`** and **`example.ts`**
follow the hero conventions.

**`meta.ts`**:

```ts
export const meta = {
  name: "card-journey",
  title: "Card journey",
  kind: "section",
  engine: "dom",
  summary: "A paragraph darkens word by word while a deck of cards shuffles beside it; …",
  useWhen: "…",
  avoidWhen: "…",
  scroll: { pinned: true, length: 3 },     // screen heights the section takes while pinned
  interaction: ["scroll", "pointer", "keyboard"],
  weight: { jsKb: 0 },                     // the section's own code; GSAP is reported once
  status: "draft",
} as const;
```

### Rules for sections

- **The page scrolls normally.** Pinned sections add scroll length
  (ScrollTrigger pin spacing) and say how much in `meta.scroll.length`.
  No section changes scroll speed or captures the wheel.
- **Self-contained.** A section animates only its own elements. An element
  that "travels" across stages (the deck that becomes a grid) does so inside
  one section, never from one section into another.
- **Content first, motion second.** The DOM order is the reading order, and
  the section's final layout is what renders without JavaScript and under
  reduced motion. Scroll only changes transforms and opacity.
- **Readable at every scroll position.** Text that darkens as it is read
  starts at a colour that still meets 3:1 contrast, never invisible.
- **Focus.** Tabbing into a pinned section scrolls to the point where the
  focused element is visible and in its final place.
- **Transforms and opacity only** while scrubbing; no layout per frame.
  Layouts are measured once per build, from element offsets (which ignore
  transforms), then only transforms are scrubbed.

### GSAP

GSAP is free to use, including ScrollTrigger and Flip, under its Standard
"no charge" licence (gsap.com/standard-license). It is not an open-source
licence: it excludes products that compete with Webflow's visual
animation tools. Sharingan never bundles GSAP: the shadcn CLI installs it
from npm into the user's project, and the user's use falls under GSAP's
licence directly. The docs page for every section says so.

Why GSAP rather than CSS scroll-driven animations or hand-written code:

- **Flip** reflows a grid when its content changes (the card journey's
  tabs). The journey itself, cards moving between three layouts while
  scrubbed, is a ScrollTrigger timeline over poses measured once per build:
  Flip's own measurements would read the transforms the scrub has applied.
- **ScrollTrigger** handles pinning, pin spacing, resize, and the mobile
  address bar, and behaves the same in every browser.
- **`gsap.matchMedia()`** swaps whole setups for reduced motion and narrow
  screens, which the motion modes need anyway.

### Performance budget

| Item | Budget |
|---|---|
| Section code (gzip, its own files) | ≤ 12 KB |
| GSAP, ScrollTrigger and Flip | loaded once per page: 52.7 KB gzip, minified (GSAP 3.15.0, measured in S1) |
| Scroll frame | no long task; transforms and opacity only |
| Images | lazy-loaded below the fold, with sizes, so pins do not shift when they arrive |

### Site

- `/sections/[name]`: a preview with enough page above and below to scroll
  through it, the props tables and the Customize panel, as for heroes.
- The home page lists both collections, with a filter.
- A demo page, `/demo`, combines `gallery-fan` with all six sections, in the
  spirit of the design reference. (The second collection groups the demos
  under `/demos`; see "Demo pages".)
- `pnpm posters` renders each section's top (4:3, `?motion=final`) for its
  card, light and dark.

### Initial collection

| Section | Idea |
|---|---|
| `card-journey` | a pinned paragraph darkens word by word while a card deck shuffles beside it; the deck deals out into a diagonal staircase, then lands in a tabbed grid (Flip) |
| `pinned-reveal` | a headline stays pinned while a rounded image rises under it and grows to full width |
| `scroll-read` | a large paragraph that darkens word by word as it is scrolled, with small inline images |
| `parallax-columns` | a staggered two-column card grid whose columns move at different speeds |
| `mosaic-zoom` | one large image shrinks back into its place in a grid of tiles that spread around it |
| `image-marquee` | a band of oversized text sliding sideways with images inline, pushed by scroll |

`card-journey` comes first: it is the hardest and proves the scroll lib.

### Second collection

A second design reference (a growth-consultancy landing page by Qclay,
also shared on Pinterest as a screen recording) adds four moments the first
collection does not cover. Each part of that page starts from a clean white
stage and has one assembly moment, timed to the scroll: tiles that lock
into a bento, portraits that burst into a constellation, a row of cases
moving sideways, a giant word that a card splits open. They are taken here
as four sections, plus one hero, under the rules above.

| Section | Idea | Pinned |
|---|---|---|
| `bento-assemble` | bento tiles start spread out from the grid's centre, small and transparent, and lock into place in a stagger; figures marked `data-count` count up on the same timeline; a play badge ringed by circular text turns with the scroll | yes, about 2 screens |
| `portrait-burst` | a stack of portrait cards rises behind a centred headline, then bursts out to its slots around it, with small stat pills set between the cards; on exit each card drifts up at its own speed | yes, about 1.5 screens |
| `case-track` | a row of case cards, the first wider and holding the story, moves sideways as the page scrolls, with a progress bar and arrow buttons | yes, as long as the row overflows |
| `split-word` | a giant word, its letters pulled together from wide spacing, parts at a set letter; a card rises into the gap, then the content below (a form, links) fades in | yes, about 1.5 screens |

The hero, `sky-launch`, is listed in RFC-0001's DOM collection: a sun
behind three layers of SVG clouds, a headline that arrives word by word, a
rocket that takes off and leaves a trail through the sun, and clouds that
rise to cover the hero as it scrolls out. It stays on the core's loop, with
a passive scroll listener for the exit (as `marquee-type` does), not GSAP.

The reference also has a services part (two large frosted cards with a
figure each). It is left out: it is `bento-assemble` with two tiles.

**How each one meets the rules:**

- **`bento-assemble`.** The final layout is a CSS grid; tiles are any
  children with a size (`wide`, `tall`, `small`), so it is not tied to one
  bento. Unlike the `bento-tiles` hero, whose bento is still and whose tiles
  answer the pointer, the motion here is the assembly, driven by the scroll.
  Start poses are measured once per build from each tile's offset to the
  grid's centre.
- **`portrait-burst`.** Slots are set in CSS (positions in percent of the
  stage), so the constellation is the no-JavaScript layout. The stack is the
  same cards translated to the centre. Pills fade in after the burst. Below
  768 px: a grid of portraits under the headline, revealed once.
- **`case-track`.** The track scrolls sideways by `translateX` only; the pin
  lasts the track's overflow, measured once per build. Tabbing to a card, or
  pressing an arrow, scrolls the page to the point where that card is in
  view. Below 768 px: no pin, a native horizontal row with scroll snap.
- **`split-word`.** No `letter-spacing` is animated: each letter is its own
  span and moves by `translateX`. The final layout is the two halves of the
  word with the card between them (stacked below 768 px). `content.split`
  sets the letter where the word parts.
- **Counters** are the one exception to "transforms and opacity only": a
  figure's text changes while scrubbed. It uses tabular figures and reserves
  the final value's width, so nothing reflows, and the animated digits are
  `aria-hidden` beside the real value for screen readers. Under `reduced`,
  `off` and `final`, figures show their final value.
- **No blur.** The reference fades things in with blur; these sections use
  opacity and scale, which stay within the scroll-frame budget.

**Colour.** Like the first six, each section takes the page's tokens
(`--foreground`, `--muted-foreground`, `--background`) for ink and paper,
so it fits any site. It adds two accents, `--sg-<prefix>-accent` (coral,
`#ee8a7b`) and `--sg-<prefix>-accent-2` (sage, `#b9ccb1`), which colour the
tiles, pills and the split card in the example. They follow the dark tone
like the heroes do (`.dark .sg-…` and `[data-tone="dark"]`), with a deeper
coral and a dark sage. Changing two variables restyles a section to a
brand; nothing in the engines depends on them.

**Settled while building S4–S7:**

- The second accent is `accentAlt` in the config (`accent-alt` on the
  element), since attribute names map to camelCase keys and `accent-2` has
  no camelCase form. The CSS variable stays `--sg-<prefix>-accent-2`.
- `portrait-burst` places its slots under the page's header
  (`--header-height`), so the top row is never hidden behind it while
  pinned. Its exit drift is a second trigger on the pinned stage, which
  ScrollTrigger places after the pin, whatever the refresh order.
- `case-track`'s arrows read the page's scroll, not the trigger's progress,
  which only updates on its next frame.
- `split-word` sizes the word to its stage (`cqi`), then fits it exactly on
  each build, so any word fills the line without overflowing it.
- `sky-launch` writes one variable, `--exit`, on the layers it moves, once
  per frame while the page scrolls; its intro is CSS animations.

**Images.** People are new to the collection: `portrait-burst` needs about
ten portraits, `bento-assemble` a portrait and four avatars, `case-track`
two or three. They are Unsplash photos (Unsplash License), cropped to WebP
under `public/sharingan/people`, with a `CREDITS.md` like the other folders.
`case-track` also reuses images from `reel`.

### Demo pages

The site gets more than one demo, grouped under `/demos`:

- `/demos`: a list of the demo pages, each with its poster and the pieces
  it uses.
- `/demos/atelier-nine`: the existing page, moved from `/demo`, which now
  redirects there.
- `/demos/upwind`: Upwind, a made-up growth studio for startups, in the
  reference's spirit but with its own name and copy: `sky-launch`, then
  `bento-assemble`, `scroll-read`, `portrait-burst`, `case-track` and
  `split-word` as its contact block. It shows that a first-collection
  section sits well beside the new ones.

The catalogue nav's "Landing page demo" link becomes a "Demos" group with
one entry per page. Demo pages stay out of the registry.

## Milestones

1. **S1 — Scroll lib and first section.** Done: `sharingan-scroll`,
   `card-journey` in React and as a Web Component, `/sections/[name]` on the
   site, the registry script reading `registry/sections`. Validated by
   installing all six sections with the shadcn CLI into a blank Vite project
   (React 19, TypeScript 7, `erasableSyntaxOnly`, `verbatimModuleSyntax`),
   which type-checks and builds. Each section's own files weigh 3.8–8.1 KB
   gzip (source), under the 12 KB budget.
2. **S2 — The rest of the initial collection.** Done.
3. **S3 — Demo page** combining `gallery-fan` and the sections. Done, at `/demo`.
4. **S4 — `bento-assemble` and the counters.** Done. The counters are
   `createCounter` in the scroll lib, so any section can use them. Adds the
   fourteen `people` portraits.
5. **S5 — `portrait-burst`, `case-track` and `split-word`.** Done.
6. **S6 — `sky-launch`**, as a hero (RFC-0001). Done.
7. **S7 — Demo pages**: `/demos`, the move of Atelier Nine with the
   redirect from `/demo` (a `redirects` entry in the site's Rasengan
   config), and Upwind. Done. The four sections and the hero weigh
   6.5–7.5 KB gzip each (source), under the 12 KB budget.

## Alternatives considered

- **A collection of full landing pages.** One command for a whole page,
  but people rewrite most of a copied page, each page costs seven sections
  of work plus its images, and full templates are a crowded field. Sections
  are what gets reused.
- **CSS scroll-driven animations** (`animation-timeline: view()`). No
  dependency and off the main thread, but no pinning, no layout-to-layout
  moves, and uneven support, so a JavaScript fallback would be written
  anyway.
- **Hand-written scroll code in the core.** Keeps zero dependencies, but
  re-implements pin spacing, refresh and Flip-style measurement, which is
  where scroll bugs live.
- **Motion (motion.dev).** MIT, with `scroll()` and layout animations, but
  its layout animations are built around React, while sections also ship
  as framework-free Web Components.

## Open questions

1. Does the site's Customize panel, which writes a section's code from
   visual controls, fall within GSAP's licence exclusion? To confirm with
   GSAP before sections are published.

Settled while building S1–S3:

- **Phones.** Below 768 px pinned sections become plain reveals: no pin,
  the final layout, elements fading in once. Parallax columns become one
  still column; scroll read and image marquee, which are not pinned, still
  follow the scroll there.
- **Heroes stay on their engines.** `gallery-fan` keeps the core's loop;
  on the demo page it runs beside GSAP's ticker without conflict.
- **The demo** is Atelier Nine, the art marketplace of `gallery-fan`'s
  example, so the sections read as its page.
- **Images** are the ones already credited in `public/sharingan`
  (`gallery`, `reel`, `trail`, `bento`); no new image was added.
