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
import { BentoAssembleSection } from '@/sections/bento-assemble/bento-assemble';
import { defineBentoAssembleElement } from '@/sections/bento-assemble/bento-assemble.element';
import { meta as bentoAssembleMeta } from '@/sections/bento-assemble/meta';
import * as bentoAssembleSchema from '@/sections/bento-assemble/schema';
import { PortraitBurstSection } from '@/sections/portrait-burst/portrait-burst';
import { definePortraitBurstElement } from '@/sections/portrait-burst/portrait-burst.element';
import { meta as portraitBurstMeta } from '@/sections/portrait-burst/meta';
import * as portraitBurstSchema from '@/sections/portrait-burst/schema';
import { CaseTrackSection } from '@/sections/case-track/case-track';
import { defineCaseTrackElement } from '@/sections/case-track/case-track.element';
import { meta as caseTrackMeta } from '@/sections/case-track/meta';
import * as caseTrackSchema from '@/sections/case-track/schema';
import { SplitWordSection } from '@/sections/split-word/split-word';
import { defineSplitWordElement } from '@/sections/split-word/split-word.element';
import { meta as splitWordMeta } from '@/sections/split-word/meta';
import * as splitWordSchema from '@/sections/split-word/schema';

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
  {
    meta: bentoAssembleMeta,
    schemas: schemasOf(bentoAssembleSchema),
    Section: BentoAssembleSection,
    defineElement: () => defineBentoAssembleElement(),
    elementAttributes: { accent: 'oklch(0.72 0.12 250)', 'accent-alt': 'oklch(0.86 0.09 95)', spread: '0.9', length: '1.4' },
    elementChildren: (
      <div data-sg-stage="">
        <div data-sg-head="">
          <div>
            <h2>&lt;sg-bento-assemble&gt;</h2>
          </div>
          <div className="sg-ba-aside">
            <p>Plain HTML tiles marked with data-sg-tile, a blue and butter palette, tiles that start further out.</p>
            <a data-sg-badge="" href="#bento-assemble" aria-label="No framework needed" />
          </div>
        </div>
        <ul data-sg-grid="">
          <li data-sg-tile="" data-size="wide">
            <p data-sg-count="">2,400</p>
            <h3>Figures with commas</h3>
          </li>
          <li data-sg-tile="" data-size="tall" data-tone="photo">
            <img src="/sharingan/people/person-05.webp" alt="A young woman with blonde hair smiling" />
          </li>
          <li data-sg-tile="" data-tone="accent">
            <p data-sg-count="">64%</p>
            <p>and percentages</p>
          </li>
          <li data-sg-tile="" data-tone="accent-2">
            <p data-sg-count="">3.5x</p>
            <p>and decimals</p>
          </li>
          <li data-sg-tile="" data-size="wide" data-tone="accent">
            <h3>Attributes only</h3>
            <p>accent, accent-alt, spread, length and count.</p>
          </li>
          <li data-sg-tile="">
            <h3>No framework</h3>
            <p>The ring is drawn from the badge's label.</p>
          </li>
        </ul>
      </div>
    ),
  },
  {
    meta: portraitBurstMeta,
    schemas: schemasOf(portraitBurstSchema),
    Section: PortraitBurstSection,
    defineElement: () => definePortraitBurstElement(),
    elementAttributes: { tilt: '16', drift: '0.9', accent: 'oklch(0.75 0.12 160)' },
    elementChildren: (
      <div data-sg-stage="">
        <div data-sg-head="">
          <h2>&lt;sg-portrait-burst&gt;</h2>
          <p>Eight portraits in plain HTML, a steeper lean in the stack, a longer drift and mint pills.</p>
        </div>
        <ul>
          {['07', '12', '02', '13', '09', '05', '10', '14'].map((n) => (
            <li key={n} data-sg-person="">
              <figure>
                <img src={`/sharingan/people/person-${n}.webp`} alt="A member of the team" />
              </figure>
            </li>
          ))}
        </ul>
        <ul>
          <li data-sg-pill="">No framework</li>
          <li data-sg-pill="">Attributes only</li>
        </ul>
      </div>
    ),
  },
  {
    meta: caseTrackMeta,
    schemas: schemasOf(caseTrackSchema),
    Section: CaseTrackSection,
    defineElement: () => defineCaseTrackElement(),
    elementAttributes: { speed: '1.6', accent: 'oklch(0.72 0.12 250)', 'accent-alt': 'oklch(0.86 0.09 95)' },
    elementChildren: (
      <div data-sg-stage="">
        <div data-sg-head="">
          <h2>&lt;sg-case-track&gt;</h2>
        </div>
        <ul data-sg-track="" aria-label="Products">
          {[
            ['camera', 'Pocket camera'],
            ['teapot', 'Red tea'],
            ['jam', 'Strawberry jam'],
            ['watch', 'Watch'],
            ['iced-tea', 'Iced tea'],
          ].map(([name, title]) => (
            <li key={name} data-sg-card="">
              <h3>
                <a href={`#${name}`}>{title}</a>
              </h3>
              <figure className="sg-ct-media">
                <img src={`/sharingan/reel/${name}.webp`} alt="" />
              </figure>
            </li>
          ))}
        </ul>
        <div data-sg-foot="">
          <button type="button" data-sg-prev="" aria-label="Previous">
            ←
          </button>
          <button type="button" data-sg-next="" aria-label="Next">
            →
          </button>
          <div data-sg-progress="" aria-hidden="true">
            <span />
          </div>
        </div>
      </div>
    ),
  },
  {
    meta: splitWordMeta,
    schemas: schemasOf(splitWordSchema),
    Section: SplitWordSection,
    defineElement: () => defineSplitWordElement(),
    elementAttributes: { spread: '1.3', tilt: '6', accent: 'oklch(0.75 0.12 160)' },
    elementChildren: (
      <div data-sg-stage="">
        <h2 className="sg-sw-title">Say hello</h2>
        <div data-sg-line="">
          <span data-sg-half="" aria-hidden="true">
            Say
          </span>
          <a data-sg-card="" href="#split-word">
            <b>Plain HTML</b>
            <span>Two halves split into letters by the element itself.</span>
          </a>
          <span data-sg-half="" aria-hidden="true">
            hello
          </span>
        </div>
      </div>
    ),
  },
];

export const findSection = (name: string | undefined) => sections.find((section) => section.meta.name === name);
