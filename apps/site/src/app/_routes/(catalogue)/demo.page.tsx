import { Link, PageComponent } from 'rasengan';
import { GalleryFanHero } from '@/heroes/gallery-fan/gallery-fan';
import { sections } from '@/section-list';
import { CardJourneySection } from '@/sections/card-journey/card-journey';
import { ImageMarqueeSection } from '@/sections/image-marquee/image-marquee';
import { MosaicZoomSection } from '@/sections/mosaic-zoom/mosaic-zoom';
import { ParallaxColumnsSection } from '@/sections/parallax-columns/parallax-columns';
import { PinnedRevealSection } from '@/sections/pinned-reveal/pinned-reveal';
import { ScrollReadSection } from '@/sections/scroll-read/scroll-read';

/**
 * A whole landing page built from one hero and the sections, each with its
 * example content: Atelier Nine, the made-up art marketplace. A showcase,
 * not a registry item: people copy the pieces.
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

    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-4">
          <p className="text-3xl font-semibold tracking-tight">Our platform, your art.</p>
          <p className="max-w-md text-muted-foreground">
            This page is a demo: the gallery fan hero, then every Sharingan section with its example content. Each piece is copied on its own with the shadcn CLI.
          </p>
        </div>
        <nav aria-label="The pieces of this page" className="flex flex-col gap-2 text-sm">
          <Link to="/heroes/gallery-fan" className="text-muted-foreground hover:text-foreground">
            Gallery fan (hero)
          </Link>
          {sections.map(({ meta }) => (
            <Link key={meta.name} to={`/sections/${meta.name}`} className="text-muted-foreground hover:text-foreground">
              {meta.title}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  </main>
);

Demo.metadata = {
  title: 'Demo landing page · Sharingan',
  description: 'A landing page built from the gallery fan hero and every Sharingan section, driven by the scroll.',
};

export default Demo;
