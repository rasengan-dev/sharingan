import { useState } from 'react';
import { Link, PageComponent } from 'rasengan';
import { heroes, type HeroEntry } from '@/hero-list';
import { InkFlowHero } from '@/heroes/ink-flow/ink-flow';

type Filter = 'all' | HeroEntry['meta']['engine'];

const FILTERS: { value: Filter; label: string; hint: string }[] = [
  { value: 'all', label: 'All', hint: 'Every hero' },
  { value: 'webgpu', label: 'WebGPU', hint: 'Shaders and simulations; a CSS fallback where WebGPU is missing' },
  { value: 'dom', label: 'DOM', hint: 'HTML, SVG and CSS 3D; every browser' },
];

function EngineBadge({ meta }: { meta: HeroEntry['meta'] }) {
  if (meta.engine === 'dom') return <span className="font-mono text-xs text-muted-foreground">DOM · every browser</span>;
  const cost = meta.gpu?.cost ?? 1;
  return (
    <span className="font-mono text-xs text-muted-foreground" title={`GPU cost ${cost} of 3`}>
      WebGPU {'●'.repeat(cost)}
      {'○'.repeat(3 - cost)}
    </span>
  );
}

// The site wears its own first hero.
const Home: PageComponent = () => {
  const [filter, setFilter] = useState<Filter>('all');
  const shown = heroes.filter(({ meta }) => filter === 'all' || meta.engine === filter);

  return (
    <main>
      <InkFlowHero
        className="min-h-svh"
        content={{
          eyebrow: 'Sharingan · animated heroes',
          headline: 'Hero sections that move like ink',
          subheadline:
            'Open-source animated heroes, on WebGPU or plain DOM. Copy one into your project with the shadcn CLI, in React or as a Web Component.',
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
              browser.
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
                <span className="ml-1.5 font-mono text-xs opacity-60">{value === 'all' ? heroes.length : heroes.filter(({ meta }) => meta.engine === value).length}</span>
              </button>
            ))}
          </div>
        </div>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
          {shown.map(({ meta }) => (
            <li key={meta.name}>
              <Link
                to={`/heroes/${meta.name}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border transition-colors hover:border-foreground/30"
              >
                <span className="relative block aspect-[16/9] overflow-hidden bg-muted">
                  {/* Still frames from `pnpm posters`, one per theme */}
                  <img src={`/thumbs/${meta.name}.webp`} alt="" loading="lazy" className="size-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] dark:hidden" />
                  <img src={`/thumbs/${meta.name}-dark.webp`} alt="" loading="lazy" className="hidden size-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] dark:block" />
                </span>
                <span className="flex flex-1 flex-col gap-2 p-5">
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-lg font-semibold">{meta.title}</span>
                    <EngineBadge meta={meta} />
                  </span>
                  <span className="text-sm text-muted-foreground">{meta.summary}</span>
                </span>
              </Link>
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
