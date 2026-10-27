import { createElement, useEffect, useState } from 'react';
import { defineStaticPaths, Link, PageComponent, useParams } from 'rasengan';
import { ConfigPanel, type Overrides } from '@/components/config-panel';
import { CataloguePager } from '@/components/catalogue/catalogue-pager';
import { PropsTable } from '@/components/props-table';
import { findHero, heroes, type HeroEntry } from '@/hero-list';
import { useIsDark } from '@/hooks/use-is-dark';

/** Reads what each hero ended up doing: live WebGPU, or which fallback. */
function useRenderStates() {
  const [states, setStates] = useState<string[]>([]);
  useEffect(() => {
    const read = () =>
      setStates([...document.querySelectorAll<HTMLElement>('[data-sharingan], [data-sg-element]')].map((el) => el.dataset.state ?? 'live'));
    read();
    const timer = window.setInterval(read, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return states;
}

function HeroDetail({ hero }: { hero: HeroEntry }) {
  const { meta, Hero } = hero;
  const states = useRenderStates();
  const dark = useIsDark();
  const [overrides, setOverrides] = useState<Overrides>({});
  const [restarts, setRestarts] = useState(0);
  const [panel, setPanel] = useState(false);

  useEffect(() => hero.defineElement(), [hero]);

  // WebGPU heroes show a still frame of themselves, in the current theme, where WebGPU is missing.
  const poster = meta.engine === 'webgpu' && meta.poster !== false ? `/posters/${meta.name}${dark ? '-dark' : ''}.webp` : undefined;

  return (
    <main>
      <Hero key={restarts} config={{ ...overrides, ...(poster && { poster }) }} />

      {panel ? (
        <ConfigPanel hero={hero} overrides={overrides} onChange={setOverrides} onRestart={() => setRestarts((count) => count + 1)} onClose={() => setPanel(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setPanel(true)}
          className="fixed right-4 bottom-4 z-40 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background shadow-xl transition-transform hover:-translate-y-0.5"
        >
          Customize
        </button>
      )}

      <section aria-labelledby="about-title" className="mx-auto grid max-w-5xl gap-10 px-6 py-20 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 id="about-title" className="text-2xl font-semibold tracking-tight">
            {meta.title}
          </h2>
          <p className="text-muted-foreground">{meta.summary}</p>
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground">Use when:</span> {meta.useWhen}
          </p>
          <p className="font-mono text-xs text-muted-foreground">Engine: {meta.engine === 'dom' ? 'DOM (HTML, SVG, CSS 3D), every browser' : 'WebGPU, with a CSS fallback'}</p>
          <p className="font-mono text-xs text-muted-foreground" data-testid="render-states">
            Render: {states.join(' · ') || '…'}
          </p>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <code className="rounded-lg border border-border bg-muted/50 px-4 py-3 font-mono">npx shadcn@latest add @sharingan/{meta.name}</code>
          <p className="text-muted-foreground">
            First time? Add the <code className="font-mono">@sharingan</code> registry to your project:{' '}
            <Link to="/docs" className="text-foreground underline underline-offset-4">
              getting started
            </Link>
            .
          </p>
          <p className="text-muted-foreground">
            Add <code className="font-mono">?motion=final</code> to the address for the repeatable still frame, or{' '}
            <code className="font-mono">?motion=off</code> for the reduced-motion version.
          </p>
        </div>
      </section>

      <section aria-labelledby="props-title" className="mx-auto flex max-w-5xl flex-col gap-6 px-6 pb-20">
        <h2 id="props-title" className="text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <div className="flex flex-col gap-3">
          <h3 className="font-medium">
            <code className="font-mono">content</code> <span className="text-sm font-normal text-muted-foreground">what the hero says, real text in the DOM</span>
          </h3>
          <PropsTable schema={hero.schemas.content} caption={`${meta.title} content`} />
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="font-medium">
            <code className="font-mono">config</code> <span className="text-sm font-normal text-muted-foreground">how it looks and moves; attributes on the Web Component</span>
          </h3>
          <PropsTable schema={hero.schemas.config} caption={`${meta.title} config`} />
        </div>
      </section>

      <section aria-labelledby="element-title" className="border-t border-border">
        <h2 id="element-title" className="sr-only">
          The same hero as a Web Component
        </h2>
        {createElement(
          `sg-${meta.name}`,
          { ...hero.elementAttributes, ...(poster && { poster }), 'data-sg-element': '' },
          hero.elementChildren ?? (
            <div className="mx-auto flex min-h-[520px] max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
              <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">Web Component · no framework</p>
              <p data-sg-text="" className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
                &lt;sg-{meta.name}&gt;
              </p>
              <p className="mt-5 max-w-lg text-muted-foreground">The same engine, driven by attributes. Its text is the page’s own DOM, slotted over the GPU layer.</p>
            </div>
          ),
        )}
      </section>

      <div className="border-t border-border pt-12">
        <CataloguePager name={meta.name} />
      </div>
    </main>
  );
}

const HeroPage: PageComponent = () => {
  const { name } = useParams();
  const hero = findHero(name);

  if (!hero) {
    return (
      <main className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-3xl font-semibold">No hero called “{name}”</h1>
        <Link to="/components" className="text-muted-foreground underline underline-offset-4">
          Back to the collection
        </Link>
      </main>
    );
  }

  // Keyed by name: moving to the next hero starts from its defaults.
  return <HeroDetail key={hero.meta.name} hero={hero} />;
};

HeroPage.generatePaths = async () => defineStaticPaths(heroes.map((hero) => ({ name: hero.meta.name })));

HeroPage.metadata = {
  title: 'Sharingan heroes',
  description: 'Open-source animated hero sections, on WebGPU or plain DOM.',
};

export default HeroPage;
