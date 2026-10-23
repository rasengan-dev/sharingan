import { useEffect, useState } from 'react';
import { PageComponent } from 'rasengan';
import { InkFlowHero } from '@/heroes/ink-flow/ink-flow';
import { defineInkFlowElement } from '@/heroes/ink-flow/ink-flow.element';
import { meta } from '@/heroes/ink-flow/meta';

/** Reads what each hero ended up doing: live WebGPU, or which fallback. */
function useRenderStates() {
  const [states, setStates] = useState<string[]>([]);
  useEffect(() => {
    const read = () =>
      setStates([...document.querySelectorAll<HTMLElement>('[data-sharingan], sg-ink-flow')].map((el) => el.dataset.state ?? 'live'));
    read();
    const timer = window.setInterval(read, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return states;
}

const InkFlowPage: PageComponent = () => {
  useEffect(() => defineInkFlowElement(), []);
  const states = useRenderStates();

  return (
    <main>
      <InkFlowHero />

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
          <code className="rounded-lg border border-border bg-muted/50 px-4 py-3 font-mono">npx shadcn@latest add @sharingan/ink-flow</code>
          <p className="text-muted-foreground">
            Add <code className="font-mono">?motion=final</code> to the address for the repeatable still frame, or{' '}
            <code className="font-mono">?motion=off</code> for the reduced-motion version.
          </p>
        </div>
      </section>

      <section aria-labelledby="element-title" className="border-t border-border">
        <h2 id="element-title" className="sr-only">
          The same hero as a Web Component
        </h2>
        <sg-ink-flow colors="oklch(0.78 0.17 75), oklch(0.68 0.22 25), oklch(0.6 0.2 300)" swirl="32" calm="0.4">
          <div className="mx-auto flex min-h-[520px] max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
            <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">Web Component · no framework</p>
            <p className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">&lt;sg-ink-flow&gt;, warm palette</p>
            <p className="mt-5 max-w-lg text-muted-foreground">
              The same engine, driven by attributes. Its text is the page’s own DOM, slotted over the ink.
            </p>
          </div>
        </sg-ink-flow>
      </section>
    </main>
  );
};

InkFlowPage.metadata = {
  title: 'Ink flow · Sharingan',
  description: meta.summary,
};

export default InkFlowPage;
