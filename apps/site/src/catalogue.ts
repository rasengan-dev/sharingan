import { meta as auroraMeshMeta } from '@/heroes/aurora-mesh/meta';
import { meta as inkFlowMeta } from '@/heroes/ink-flow/meta';
import { meta as gravityFieldMeta } from '@/heroes/gravity-field/meta';
import { meta as reactionDiffusionMeta } from '@/heroes/reaction-diffusion/meta';
import { meta as particleTypeMeta } from '@/heroes/particle-type/meta';
import { meta as liquidGlassMeta } from '@/heroes/liquid-glass/meta';
import { meta as gamepadMeta } from '@/heroes/gamepad/meta';
import { meta as holoCardMeta } from '@/heroes/holo-card/meta';
import { meta as splitHeadlineMeta } from '@/heroes/split-headline/meta';
import { meta as marqueeTypeMeta } from '@/heroes/marquee-type/meta';
import { meta as terminalBootMeta } from '@/heroes/terminal-boot/meta';
import { meta as appWindowMeta } from '@/heroes/app-window/meta';
import { meta as beamGridMeta } from '@/heroes/beam-grid/meta';
import { meta as conicRaysMeta } from '@/heroes/conic-rays/meta';
import { meta as galleryFanMeta } from '@/heroes/gallery-fan/meta';
import { meta as trailMapMeta } from '@/heroes/trail-map/meta';
import { meta as curveReelMeta } from '@/heroes/curve-reel/meta';
import { meta as bentoTilesMeta } from '@/heroes/bento-tiles/meta';
import { meta as isoDeckMeta } from '@/heroes/iso-deck/meta';
import { meta as cardJourneyMeta } from '@/sections/card-journey/meta';
import { meta as pinnedRevealMeta } from '@/sections/pinned-reveal/meta';
import { meta as scrollReadMeta } from '@/sections/scroll-read/meta';
import { meta as parallaxColumnsMeta } from '@/sections/parallax-columns/meta';
import { meta as mosaicZoomMeta } from '@/sections/mosaic-zoom/meta';
import { meta as imageMarqueeMeta } from '@/sections/image-marquee/meta';

/**
 * Every hero and section by name, from their `meta.ts` only: the sidebar and the
 * search menu use it on every page, so it must not pull in the components themselves.
 */
export type CatalogueItem = {
  name: string;
  title: string;
  summary: string;
  kind: 'hero' | 'section';
  /** WebGPU or DOM for heroes; Pinned or Scroll for sections. */
  tag: string;
  /** The line shown on its card: engine and GPU cost, or how it scrolls. */
  badge: string;
  href: string;
};

export const catalogue: CatalogueItem[] = [
  ...[auroraMeshMeta, inkFlowMeta, gravityFieldMeta, reactionDiffusionMeta, particleTypeMeta, liquidGlassMeta, gamepadMeta, holoCardMeta, splitHeadlineMeta, marqueeTypeMeta, terminalBootMeta, appWindowMeta, beamGridMeta, conicRaysMeta, galleryFanMeta, trailMapMeta, curveReelMeta, bentoTilesMeta, isoDeckMeta].map(
    (meta): CatalogueItem => ({
      name: meta.name,
      title: meta.title,
      summary: meta.summary,
      kind: 'hero',
      tag: meta.engine === 'webgpu' ? 'WebGPU' : 'DOM',
      badge: 'gpu' in meta ? `WebGPU ${'●'.repeat(meta.gpu.cost)}${'○'.repeat(3 - meta.gpu.cost)}` : 'DOM · every browser',
      href: `/heroes/${meta.name}`,
    }),
  ),
  ...[cardJourneyMeta, pinnedRevealMeta, scrollReadMeta, parallaxColumnsMeta, mosaicZoomMeta, imageMarqueeMeta].map(
    (meta): CatalogueItem => ({
      name: meta.name,
      title: meta.title,
      summary: meta.summary,
      kind: 'section',
      tag: meta.scroll.pinned ? 'Pinned' : 'Scroll',
      badge: `${meta.scroll.pinned ? 'Pinned' : 'Scroll'} · GSAP`,
      href: `/sections/${meta.name}`,
    }),
  ),
];

/** The sidebar's groups, in reading order. */
export const catalogueGroups: { title: string; items: CatalogueItem[] }[] = [
  { title: 'Heroes · WebGPU', items: catalogue.filter((item) => item.kind === 'hero' && item.tag === 'WebGPU') },
  { title: 'Heroes · DOM', items: catalogue.filter((item) => item.kind === 'hero' && item.tag === 'DOM') },
  { title: 'Sections', items: catalogue.filter((item) => item.kind === 'section') },
];
