# RFC-0002: Sections — the animated sections below the hero

- Status: Draft
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
- **Refresh**: one `ScrollTrigger.refresh()` after fonts and images above
  the section have loaded, and after a hero's intro changes its height.

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
  summary: "A deck of cards shuffles under a paragraph, deals out into a staircase, then lands in a tabbed grid.",
  scroll: { pinned: true, length: 2.5 },   // viewport heights the section takes while pinned
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
  Flip measures layouts once per stage, then animates transforms.

### GSAP

GSAP is free to use, including ScrollTrigger and Flip, under its Standard
"no charge" licence (gsap.com/standard-license). It is not an open-source
licence: it excludes products that compete with Webflow's visual
animation tools. Sharingan never bundles GSAP: the shadcn CLI installs it
from npm into the user's project, and the user's use falls under GSAP's
licence directly. The docs page for every section says so.

Why GSAP rather than CSS scroll-driven animations or hand-written code:

- **Flip** solves the hardest part of the design reference, a set of
  elements moving between three layouts while scrubbed.
- **ScrollTrigger** handles pinning, pin spacing, resize, and the mobile
  address bar, and behaves the same in every browser.
- **`gsap.matchMedia()`** swaps whole setups for reduced motion and narrow
  screens, which the motion modes need anyway.

### Performance budget

| Item | Budget |
|---|---|
| Section code (gzip, its own files) | ≤ 12 KB |
| GSAP, ScrollTrigger and Flip | loaded once per page, measured and reported (roughly 45–50 KB gzip, to confirm in S1) |
| Scroll frame | no long task; transforms and opacity only |
| Images | lazy-loaded below the fold, with sizes, so pins do not shift when they arrive |

### Site

- `/sections/[name]`: a preview with enough page above and below to scroll
  through it, the props tables and the Customize panel, as for heroes.
- The home page lists both collections, with a filter.
- A demo page (`/demo`, name open) combines `gallery-fan` with the first
  sections, in the spirit of the design reference.

### Initial collection

| Section | Idea |
|---|---|
| `card-journey` | a pinned paragraph darkens word by word while a card deck shuffles over it; the deck deals out into a diagonal staircase, then lands in a tabbed grid (Flip) |
| `pinned-reveal` | a headline stays pinned while a rounded image rises under it and grows to full width |
| `scroll-read` | a large paragraph that darkens word by word as it is scrolled, with small inline images |
| `parallax-columns` | a staggered two-column card grid whose columns move at different speeds |
| `mosaic-zoom` | one large image shrinks back into its place in a grid of tiles that spread around it |
| `image-marquee` | a band of oversized text sliding sideways with images inline, pushed by scroll |

`card-journey` comes first: it is the hardest and proves the scroll lib.

## Milestones

1. **S1 — Scroll lib and first section.** `sharingan-scroll`,
   `card-journey` in React and as a Web Component, `/sections/[name]` on the
   site, the registry script reading `registry/sections`. Validated by
   installing the section into a blank Vite project, as heroes were.
2. **S2 — The rest of the initial collection.**
3. **S3 — Demo page** combining `gallery-fan` and the sections.

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
   GSAP before S1 ships.
2. Phones: should pinned sections keep a shorter pin, or become plain
   reveals below the breakpoint?
3. Should `gallery-fan` move to GSAP so the demo page runs one engine, or
   do the core's frame loop and GSAP's ticker run side by side?
4. The demo page: an art marketplace like the reference, or another
   subject so it does not read as a longer `gallery-fan`?
5. Images: reuse `public/sharingan/gallery` and `reel`, plus new openly
   licensed images with credits, as for the heroes?
