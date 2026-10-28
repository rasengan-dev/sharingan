/**
 * The demo landing pages, by name: what each is and which pieces it is built
 * from. Read by the sidebar and the /demos page, so it imports no component.
 */
export type DemoEntry = {
  slug: string;
  title: string;
  summary: string;
  /** The hero on top, then the sections in page order: their names in the catalogue. */
  hero: string;
  sections: string[];
};

export const demos: DemoEntry[] = [
  {
    slug: 'atelier-nine',
    title: 'Atelier Nine',
    summary: 'A made-up art marketplace: the gallery fan hero, then the first six sections, dark and editorial.',
    hero: 'gallery-fan',
    sections: ['card-journey', 'pinned-reveal', 'scroll-read', 'parallax-columns', 'image-marquee', 'mosaic-zoom'],
  },
  {
    slug: 'upwind',
    title: 'Upwind',
    summary: 'A made-up growth studio for startups: the sky launch hero and the second collection, in sage and coral.',
    hero: 'sky-launch',
    sections: ['bento-assemble', 'scroll-read', 'portrait-burst', 'case-track', 'split-word'],
  },
  {
    slug: 'tapwire',
    title: 'Tapwire',
    summary: 'A made-up wallet connection service: the iso deck hero, then sections from both collections, in mint and violet.',
    hero: 'iso-deck',
    sections: ['bento-assemble', 'scroll-read', 'case-track', 'split-word'],
  },
];
