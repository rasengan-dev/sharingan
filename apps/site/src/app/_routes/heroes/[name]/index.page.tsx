import { createElement, useEffect, useState } from 'react';
import { defineStaticPaths, Link, PageComponent, useParams } from 'rasengan';
import { findHero, heroes } from '@/hero-list';

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

const HeroPage: PageComponent = () => {
  const { name } = useParams();
  const hero = findHero(name);
  const states = useRenderStates();

  useEffect(() => hero?.defineElement(), [hero]);

  if (!hero) {
    return (
      <main className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-3xl font-semibold">No hero called “{name}”</h1>
        <Link to="/" className="text-muted-foreground underline underline-offset-4">
          Back to the collection
        </Link>
      </main>
    );
  }

  const { meta, Hero } = hero;
  const index = heroes.indexOf(hero);
  const next = heroes[(index + 1) % heroes.length];

  return (
    <main>
      <Hero />

      <section aria-labelledby="about-title" className="mx-auto grid max-w-5xl gap-10 px-6 py-20 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 id="about-title" className="text-2xl font-semibold tracking-tight">
            {meta.title}
          </h2>
          <p className="text-muted-foreground">{meta.summary}</p>
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground">Use when:</span> {meta.useWhen}
          </p>
          <p className="font-mono text-xs text-muted-foreground" data-testid="render-states">
            Render: {states.join(' · ') || '…'}
          </p>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <code className="rounded-lg border border-border bg-muted/50 px-4 py-3 font-mono">npx shadcn@latest add @sharingan/{meta.name}</code>
          <p className="text-muted-foreground">
            Add <code className="font-mono">?motion=final</code> to the address for the repeatable still frame, or{' '}
            <code className="font-mono">?motion=off</code> for the reduced-motion version.
          </p>
          <Link to={`/heroes/${next.meta.name}`} className="mt-2 self-start font-medium text-foreground underline underline-offset-4">
            Next: {next.meta.title} →
          </Link>
        </div>
      </section>

      <section aria-labelledby="element-title" className="border-t border-border">
        <h2 id="element-title" className="sr-only">
          The same hero as a Web Component
        </h2>
        {createElement(
          `sg-${meta.name}`,
          { ...hero.elementAttributes, 'data-sg-element': '' },
          <div className="mx-auto flex min-h-[520px] max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
            <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">Web Component · no framework</p>
            <p data-sg-text="" className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">&lt;sg-{meta.name}&gt;</p>
            <p className="mt-5 max-w-lg text-muted-foreground">The same engine, driven by attributes. Its text is the page’s own DOM, slotted over the GPU layer.</p>
          </div>,
        )}
      </section>
    </main>
  );
};

HeroPage.generatePaths = async () => defineStaticPaths(heroes.map((hero) => ({ name: hero.meta.name })));

HeroPage.metadata = {
  title: 'Sharingan heroes',
  description: 'Open-source hero sections rendered with WebGPU.',
};

export default HeroPage;
