import type { ComponentType, ReactNode } from 'react';
import type { z } from 'zod';
import { CardJourneySection } from '@/sections/card-journey/card-journey';
import { defineCardJourneyElement } from '@/sections/card-journey/card-journey.element';
import { meta as cardJourneyMeta } from '@/sections/card-journey/meta';
import * as cardJourneySchema from '@/sections/card-journey/schema';
import { PinnedRevealSection } from '@/sections/pinned-reveal/pinned-reveal';
import { definePinnedRevealElement } from '@/sections/pinned-reveal/pinned-reveal.element';
import { meta as pinnedRevealMeta } from '@/sections/pinned-reveal/meta';
import * as pinnedRevealSchema from '@/sections/pinned-reveal/schema';
import { ScrollReadSection } from '@/sections/scroll-read/scroll-read';
import { defineScrollReadElement } from '@/sections/scroll-read/scroll-read.element';
import { meta as scrollReadMeta } from '@/sections/scroll-read/meta';
import * as scrollReadSchema from '@/sections/scroll-read/schema';
import { ParallaxColumnsSection } from '@/sections/parallax-columns/parallax-columns';
import { defineParallaxColumnsElement } from '@/sections/parallax-columns/parallax-columns.element';
import { meta as parallaxColumnsMeta } from '@/sections/parallax-columns/meta';
import * as parallaxColumnsSchema from '@/sections/parallax-columns/schema';
import { MosaicZoomSection } from '@/sections/mosaic-zoom/mosaic-zoom';
import { defineMosaicZoomElement } from '@/sections/mosaic-zoom/mosaic-zoom.element';
import { meta as mosaicZoomMeta } from '@/sections/mosaic-zoom/meta';
import * as mosaicZoomSchema from '@/sections/mosaic-zoom/schema';
import { ImageMarqueeSection } from '@/sections/image-marquee/image-marquee';
import { defineImageMarqueeElement } from '@/sections/image-marquee/image-marquee.element';
import { meta as imageMarqueeMeta } from '@/sections/image-marquee/meta';
import * as imageMarqueeSchema from '@/sections/image-marquee/schema';

type Schema = z.ZodObject<z.ZodRawShape>;

/** A section's two schemas, found by name in its schema module (`…ContentSchema`, `…ConfigSchema`). */
function schemasOf(module: Record<string, unknown>) {
  const find = (suffix: string) => Object.entries(module).find(([key]) => key.endsWith(suffix))?.[1] as Schema;
  return { content: find('ContentSchema'), config: find('ConfigSchema') };
}

export type SectionEntry = {
  meta: { name: string; title: string; summary: string; useWhen: string; scroll: { pinned: boolean; length: number } };
  /** For the props tables and the config panel. */
  schemas: { content: Schema; config: Schema };
  // Each section takes its own config type; the site drives them all from their schemas.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Section: ComponentType<{ className?: string; config?: any }>;
  /** Registers the Web Component; its tag is `sg-<name>`. */
  defineElement: () => void;
  /** Attributes for the Web Component demo: a different look than the React one. */
  elementAttributes: Record<string, string>;
  /** The Web Component's children: the section's own markup, in plain HTML. */
  elementChildren: ReactNode;
};

/** Every section of the collection (RFC-0002). */
export const sections: SectionEntry[] = [
  {
    meta: cardJourneyMeta,
    schemas: schemasOf(cardJourneySchema),
    Section: CardJourneySection,
    defineElement: () => defineCardJourneyElement(),
    elementAttributes: { length: '2.5', tilt: '11', accent: 'oklch(0.66 0.19 40)' },
    elementChildren: (
      <div data-sg-stage="">
        <p data-sg-statement="">
          The same engine as a Web Component: plain HTML in the page, five cards marked with data-sg-card, a wider deck and a warmer tab.
        </p>
        <div data-sg-aside="">
          <h3>No framework</h3>
          <p>&lt;sg-card-journey&gt; splits the paragraph into words itself.</p>
        </div>
        <div data-sg-grid="">
          <div data-sg-copy="">
            <p className="sg-cj-eyebrow">Web Component · no framework</p>
            <h2>&lt;sg-card-journey&gt;</h2>
            <p>Configured with attributes: length, tilt, shuffle and accent.</p>
          </div>
          <div data-sg-panel="">
            <div role="tablist" aria-label="Filter the photos">
              <button type="button" role="tab" data-sg-tab="" aria-selected="true">
                All
              </button>
              <button type="button" role="tab" data-sg-tab="" data-cards="0,2,4" aria-selected="false">
                Drinks
              </button>
            </div>
            <ul>
              <li data-sg-card="">
                <div>
                  <img src="/sharingan/reel/teapot.webp" alt="A turquoise teapot pouring a twisted red candy rope into a white cup" />
                  <span className="sg-cj-caption"><b>Red tea</b><span>Filip Mroz</span></span>
                </div>
              </li>
              <li data-sg-card="">
                <div>
                  <img src="/sharingan/reel/headphones.webp" alt="Mint earphones on a mint and pink background" />
                  <span className="sg-cj-caption"><b>Earphones</b><span>Icons8 team</span></span>
                </div>
              </li>
              <li data-sg-card="">
                <div>
                  <img src="/sharingan/reel/purple-soda.webp" alt="A silhouette holding a bottle against purple and pink light" />
                  <span className="sg-cj-caption"><b>Night soda</b><span>Ilya Mazurkevich</span></span>
                </div>
              </li>
              <li data-sg-card="">
                <div>
                  <img src="/sharingan/reel/camera.webp" alt="A hand holding a small black camera against a pink wall" />
                  <span className="sg-cj-caption"><b>Pocket camera</b><span>Daria Shevtsova</span></span>
                </div>
              </li>
              <li data-sg-card="">
                <div>
                  <img src="/sharingan/reel/iced-tea.webp" alt="A glass of iced tea with mint leaves" />
                  <span className="sg-cj-caption"><b>Iced tea</b><span>Sajjad Ghanavati</span></span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    meta: pinnedRevealMeta,
    schemas: schemasOf(pinnedRevealSchema),
    Section: PinnedRevealSection,
    defineElement: () => definePinnedRevealElement(),
    elementAttributes: { start: '0.4', radius: '8', length: '1.6' },
    elementChildren: (
      <div data-sg-stage="">
        <div data-sg-head="">
          <h2 data-sg-headline="">&lt;sg-pinned-reveal&gt; on plain HTML</h2>
        </div>
        <figure data-sg-frame="">
          <img src="/sharingan/hiraiship.png" alt="A product screen of the Hiraiship dashboard" />
          <figcaption data-sg-caption="">
            <b>Attributes only</b>
            <span>A smaller start, square corners, a longer pin.</span>
          </figcaption>
        </figure>
      </div>
    ),
  },
  {
    meta: scrollReadMeta,
    schemas: schemasOf(scrollReadSchema),
    Section: ScrollReadSection,
    defineElement: () => defineScrollReadElement(),
    elementAttributes: { from: '0.6', pop: 'false' },
    elementChildren: (
      <div className="sg-sr-inner">
        <p className="sg-sr-eyebrow">Web Component · no framework</p>
        <p data-sg-read="">
          This paragraph is plain text in the page. &lt;sg-scroll-read&gt; splits it into words itself, keeps the image <img src="/sharingan/reel/soda.webp" alt="" /> where it was set, and reads it with lighter grey words.
        </p>
      </div>
    ),
  },
  {
    meta: parallaxColumnsMeta,
    schemas: schemasOf(parallaxColumnsSchema),
    Section: ParallaxColumnsSection,
    defineElement: () => defineParallaxColumnsElement(),
    elementAttributes: { speed: '0.9', depth: 'false' },
    elementChildren: (
      <div className="sg-pc-inner">
        <div className="sg-pc-head">
          <h2>&lt;sg-parallax-columns&gt;</h2>
          <p>The same engine on plain HTML: columns that drift further apart, photos that stay still in their cards.</p>
        </div>
        <div data-sg-grid="">
          <div data-sg-column="">
            <article data-sg-card="">
              <div data-sg-media=""><img src="/sharingan/reel/jam.webp" alt="Jars of strawberry jam beside fresh strawberries" /></div>
              <h3>Strawberry jam</h3>
            </article>
            <article data-sg-card="">
              <div data-sg-media=""><img src="/sharingan/reel/watch.webp" alt="A black wristwatch on a man's wrist" /></div>
              <h3>Watch</h3>
            </article>
          </div>
          <div data-sg-column="">
            <article data-sg-card="">
              <div data-sg-media=""><img src="/sharingan/reel/soda.webp" alt="A glass of sparkling soda with a striped straw beside a green bottle" /></div>
              <h3>Soda</h3>
            </article>
            <article data-sg-card="">
              <div data-sg-media=""><img src="/sharingan/reel/iced-tea.webp" alt="A glass of iced tea with mint leaves" /></div>
              <h3>Iced tea</h3>
            </article>
          </div>
        </div>
      </div>
    ),
  },
  {
    meta: mosaicZoomMeta,
    schemas: schemasOf(mosaicZoomSchema),
    Section: MosaicZoomSection,
    defineElement: () => defineMosaicZoomElement(),
    elementAttributes: { spread: '1.3', length: '1.2' },
    elementChildren: (
      <>
        <div data-sg-head="">
          <h2>&lt;sg-mosaic-zoom&gt;</h2>
          <p>Plain HTML, tiles that start further out, a shorter pin.</p>
        </div>
        <div data-sg-stage="">
          <ul data-sg-mosaic="" aria-label="Photos">
            <li data-sg-feature="">
              <img src="/sharingan/reel/camera.webp" alt="A hand holding a small black camera against a pink wall" />
            </li>
            {['teapot', 'headphones', 'purple-soda', 'jam', 'iced-tea', 'watch', 'soda', 'flatlay', 'shapes', 'bird', 'rooster', 'stripes'].map((name) => (
              <li key={name} data-sg-tile="">
                <img src={['shapes', 'bird', 'rooster', 'stripes'].includes(name) ? `/sharingan/gallery/${name}.webp` : `/sharingan/reel/${name}.webp`} alt="" />
              </li>
            ))}
          </ul>
        </div>
      </>
    ),
  },
  {
    meta: imageMarqueeMeta,
    schemas: schemasOf(imageMarqueeSchema),
    Section: ImageMarqueeSection,
    defineElement: () => defineImageMarqueeElement(),
    elementAttributes: { background: 'oklch(0.3 0.08 280)', ink: 'oklch(0.97 0.02 280)', rows: '1', distance: '45' },
    elementChildren: (
      <div>
        <div data-sg-row="">
          <ul data-sg-track="" aria-label="Web Component">
            <li>sg-image-marquee</li>
            <li className="sg-im-pic"><img src="/sharingan/reel/purple-soda.webp" alt="" /></li>
            <li>One row, further</li>
            <li className="sg-im-pic"><img src="/sharingan/reel/headphones.webp" alt="" /></li>
          </ul>
        </div>
      </div>
    ),
  },
];

export const findSection = (name: string | undefined) => sections.find((section) => section.meta.name === name);
