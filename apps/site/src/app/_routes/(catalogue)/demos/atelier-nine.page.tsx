import type { PageComponent } from 'rasengan';
import { DemoFooter } from '@/components/demo-footer';
import { demos } from '@/demo-list';
import { GalleryFanHero } from '@/heroes/gallery-fan/gallery-fan';
import { CardJourneySection } from '@/sections/card-journey/card-journey';
import { ImageMarqueeSection } from '@/sections/image-marquee/image-marquee';
import { MosaicZoomSection } from '@/sections/mosaic-zoom/mosaic-zoom';
import { ParallaxColumnsSection } from '@/sections/parallax-columns/parallax-columns';
import { PinnedRevealSection } from '@/sections/pinned-reveal/pinned-reveal';
import { ScrollReadSection } from '@/sections/scroll-read/scroll-read';

const demo = demos.find((entry) => entry.slug === 'atelier-nine')!;

/**
 * A whole landing page built from one hero and the first six sections, each
 * with its example content: Atelier Nine, the made-up art marketplace. A
 * showcase, not a registry item: people copy the pieces.
 */
const Demo: PageComponent = () => (
  <main>
    <GalleryFanHero />
    <CardJourneySection />
    <PinnedRevealSection />
    <ScrollReadSection />
    <ParallaxColumnsSection />
    <ImageMarqueeSection />
    <MosaicZoomSection />

    <DemoFooter demo={demo} title="Our platform, your art.">
      This page is a demo: the gallery fan hero, then the first six Sharingan sections with their example content.
    </DemoFooter>
  </main>
);

Demo.metadata = {
  title: 'Atelier Nine · Sharingan demo',
  description: 'A landing page built from the gallery fan hero and the first six Sharingan sections, driven by the scroll.',
};

export default Demo;
