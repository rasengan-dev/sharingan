import type { PageComponent } from 'rasengan';
import { DemoFooter } from '@/components/demo-footer';
import { demos } from '@/demo-list';
import { skyLaunchExample } from '@/heroes/sky-launch/example';
import { SkyLaunchHero } from '@/heroes/sky-launch/sky-launch';
import { BentoAssembleSection } from '@/sections/bento-assemble/bento-assemble';
import { CaseTrackSection } from '@/sections/case-track/case-track';
import { PortraitBurstSection } from '@/sections/portrait-burst/portrait-burst';
import { ScrollReadSection } from '@/sections/scroll-read/scroll-read';
import type { ScrollReadContent } from '@/sections/scroll-read/schema';
import { SplitWordSection } from '@/sections/split-word/split-word';

const demo = demos.find((entry) => entry.slug === 'upwind')!;

const hero = { ...skyLaunchExample, primaryCta: { label: 'Start growing', href: '#contact' }, secondaryCta: { label: 'See how we work', href: '#why' } };

/** A first-collection section with Upwind's words: it sits beside the new ones. */
const promise: ScrollReadContent = {
  eyebrow: 'How we work',
  text: 'Every week we pick one number {0} with you, run the smallest test that could move it {1}, and keep only what works {2}. No decks, no retainers for ideas: experiments, and what they taught us.',
  images: [
    { src: '/sharingan/people/person-13.webp', alt: 'Priya, product analytics' },
    { src: '/sharingan/people/person-10.webp', alt: 'Tom, experiments' },
    { src: '/sharingan/people/person-01.webp', alt: 'Maya, lifecycle lead' },
  ],
  cta: { label: 'Our method', href: '#cases' },
};

/**
 * Upwind, the made-up growth studio: the sky launch hero, then the second
 * collection of sections and one from the first, each in its sage and coral
 * example. A showcase, not a registry item: people copy the pieces.
 */
const Upwind: PageComponent = () => (
  <main>
    <SkyLaunchHero content={hero} />
    <BentoAssembleSection id="why" />
    <ScrollReadSection id="method" content={promise} />
    <PortraitBurstSection id="team" />
    <CaseTrackSection id="cases" />
    <SplitWordSection id="contact" />

    <DemoFooter demo={demo} title="Take your startup further.">
      This page is a demo: the sky launch hero, then four sections from the second collection and the scroll read from the first, with their example content.
    </DemoFooter>
  </main>
);

Upwind.metadata = {
  title: 'Upwind · Sharingan demo',
  description: 'A landing page for a made-up growth studio, built from the sky launch hero and the scroll-driven sections of the second collection.',
};

export default Upwind;
