import { useState } from 'react';
import { Link, PageComponent } from 'rasengan';
import { catalogue } from '@/catalogue';
import { ComponentCard } from '@/components/catalogue/component-card';
import { InkFlowHero } from '@/heroes/ink-flow/ink-flow';

type Filter = 'all' | 'WebGPU' | 'DOM';

const FILTERS: { value: Filter; label: string; hint: string }[] = [
  { value: 'all', label: 'All', hint: 'Every hero' },
  { value: 'WebGPU', label: 'WebGPU', hint: 'Shaders and simulations; a CSS fallback where WebGPU is missing' },
  { value: 'DOM', label: 'DOM', hint: 'HTML, SVG and CSS 3D; every browser' },
];

const heroes = catalogue.filter((item) => item.kind === 'hero');
const sections = catalogue.filter((item) => item.kind === 'section');

// The site wears its own first hero.
const Home: PageComponent = () => {
  const [filter, setFilter] = useState<Filter>('all');
  const shown = heroes.filter((item) => filter === 'all' || item.tag === filter);

  return (
    <main>
      <InkFlowHero
        className="min-h-svh"
        content={{
          eyebrow: 'Sharingan · animated heroes',
          headline: 'Hero sections that move like ink',
          subheadline:
            'Open-source animated heroes, on WebGPU or plain DOM, and the scroll-driven sections that follow them. Copy one into your project with the shadcn CLI, in React or as a Web Component.',
          primaryCta: { label: 'Browse the heroes', href: '#collection' },
          secondaryCta: { label: 'Get started', href: '/docs' },
        }}
      />

      <section id="collection" aria-labelledby="collection-title" className="mx-auto max-w-6xl scroll-mt-16 px-6 py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 id="collection-title" className="text-3xl font-semibold tracking-tight">
              The collection
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Each hero ships as a React component and a Web Component. WebGPU heroes fall back to CSS where the GPU is missing; DOM heroes run in every
              browser.{' '}
              <Link to="/components" className="text-foreground underline underline-offset-4">
                Browse them all with live previews
              </Link>
              .
            </p>
          </div>
          <div role="group" aria-label="Filter by engine" className="flex rounded-full border border-border p-1">
            {FILTERS.map(({ value, label, hint }) => (
              <button
                key={value}
                type="button"
                title={hint}
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className="rounded-full px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground aria-pressed:bg-foreground aria-pressed:text-background"
              >
                {label}
                <span className="ml-1.5 font-mono text-xs opacity-60">{value === 'all' ? heroes.length : heroes.filter((item) => item.tag === value).length}</span>
              </button>
            ))}
          </div>
        </div>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
          {shown.map((item) => (
            <li key={item.name}>
              <ComponentCard item={item} />
            </li>
          ))}
        </ul>
      </section>

      <section id="sections" aria-labelledby="sections-title" className="mx-auto max-w-6xl scroll-mt-16 px-6 pb-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 id="sections-title" className="text-3xl font-semibold tracking-tight">
              The sections
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              What comes after the hero: sections that move with the scroll, pinned or not, built with GSAP. They run in every browser and keep still under
              reduced motion.
            </p>
          </div>
          <Link to="/demo" className="rounded-full border border-border px-4 py-2 text-sm transition-colors hover:border-foreground/30">
            See them on a whole page →
          </Link>
        </div>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((item) => (
            <li key={item.name}>
              <ComponentCard item={item} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
};

Home.metadata = {
  title: 'Sharingan · animated hero sections',
  description: 'Open-source animated hero sections, on WebGPU or plain DOM, for React and as Web Components.',
};

export default Home;
