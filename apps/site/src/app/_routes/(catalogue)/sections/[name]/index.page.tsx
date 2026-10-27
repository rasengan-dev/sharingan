import { createElement, useEffect, useState, type ReactNode } from 'react';
import { defineStaticPaths, Link, PageComponent, useParams } from 'rasengan';
import { ConfigPanel, type Overrides } from '@/components/config-panel';
import { CataloguePager } from '@/components/catalogue/catalogue-pager';
import { PropsTable } from '@/components/props-table';
import { findSection, sections, type SectionEntry } from '@/section-list';

/** Room to scroll into a section: it animates against the scroll, so it needs a page above it. */
function ScrollLead({ title, heading = 'h1', children }: { title: string; heading?: 'h1' | 'p'; children?: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[70svh] max-w-3xl flex-col items-center justify-center gap-4 px-6 pt-24 pb-16 text-center">
      <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">Section · scroll</p>
      {createElement(heading, { className: 'text-4xl font-semibold tracking-tight text-balance sm:text-6xl' }, title)}
      {children}
      <p aria-hidden="true" className="mt-6 animate-bounce text-2xl text-muted-foreground">
        ↓
      </p>
    </div>
  );
}

function SectionDetail({ section }: { section: SectionEntry }) {
  const { meta, Section } = section;
  const [overrides, setOverrides] = useState<Overrides>({});
  const [restarts, setRestarts] = useState(0);
  const [panel, setPanel] = useState(false);

  useEffect(() => section.defineElement(), [section]);


  return (
    <main>
      <ScrollLead title={meta.title}>
        <p className="max-w-xl text-muted-foreground">{meta.summary}</p>
      </ScrollLead>

      <Section key={restarts} config={overrides} />

      {panel ? (
        <ConfigPanel
          hero={section}
          kind="section"
          overrides={overrides}
          onChange={setOverrides}
          onRestart={() => setRestarts((count) => count + 1)}
          onClose={() => setPanel(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setPanel(true)}
          className="fixed right-4 bottom-4 z-40 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background shadow-xl transition-transform hover:-translate-y-0.5"
        >
          Customize
        </button>
      )}

      <section aria-labelledby="about-title" className="mx-auto grid max-w-5xl gap-10 border-t border-border px-6 py-20 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 id="about-title" className="text-2xl font-semibold tracking-tight">
            {meta.title}
          </h2>
          <p className="text-muted-foreground">{meta.summary}</p>
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground">Use when:</span> {meta.useWhen}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            DOM and GSAP (ScrollTrigger, Flip), every browser
            {meta.scroll.pinned ? ` · pinned for about ${meta.scroll.length} screens` : ' · not pinned'}
          </p>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <code className="rounded-lg border border-border bg-muted/50 px-4 py-3 font-mono">npx shadcn@latest add @sharingan/{meta.name}</code>
          <p className="text-muted-foreground">
            First time? Add the <code className="font-mono">@sharingan</code> registry to your project:{' '}
            <Link to="/docs" className="text-foreground underline underline-offset-4">
              getting started
            </Link>
            . The CLI also installs <code className="font-mono">gsap</code>, used under GSAP’s own{' '}
            <a href="https://gsap.com/standard-license" target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-4">
              no-charge licence
            </a>
            .
          </p>
          <p className="text-muted-foreground">
            Add <code className="font-mono">?motion=final</code> or <code className="font-mono">?motion=off</code> to the address for the version without scroll
            motion; phones below 768 px get it too, with short reveals.
          </p>
        </div>
      </section>

      <section aria-labelledby="props-title" className="mx-auto flex max-w-5xl flex-col gap-6 px-6 pb-20">
        <h2 id="props-title" className="text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <div className="flex flex-col gap-3">
          <h3 className="font-medium">
            <code className="font-mono">content</code> <span className="text-sm font-normal text-muted-foreground">what the section says, real text in the DOM</span>
          </h3>
          <PropsTable schema={section.schemas.content} caption={`${meta.title} content`} />
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="font-medium">
            <code className="font-mono">config</code> <span className="text-sm font-normal text-muted-foreground">how it moves; attributes on the Web Component</span>
          </h3>
          <PropsTable schema={section.schemas.config} caption={`${meta.title} config`} />
        </div>
      </section>

      <section aria-labelledby="element-title" className="border-t border-border">
        <h2 id="element-title" className="sr-only">
          The same section as a Web Component
        </h2>
        <ScrollLead title={`<sg-${meta.name}>`} heading="p">
          <p className="max-w-xl text-muted-foreground">The same engine as a Web Component, driven by attributes, on the page’s own HTML.</p>
        </ScrollLead>
        {createElement(`sg-${meta.name}`, { ...section.elementAttributes, 'data-sg-element': '' }, section.elementChildren)}
        <div className="min-h-[50svh]" />
      </section>

      <div className="border-t border-border pt-12">
        <CataloguePager name={meta.name} />
      </div>
    </main>
  );
}

const SectionPage: PageComponent = () => {
  const { name } = useParams();
  const section = findSection(name);

  if (!section) {
    return (
      <main className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-3xl font-semibold">No section called “{name}”</h1>
        <Link to="/components" className="text-muted-foreground underline underline-offset-4">
          Back to the collection
        </Link>
      </main>
    );
  }

  // Keyed by name: moving to the next section starts from its defaults.
  return <SectionDetail key={section.meta.name} section={section} />;
};

SectionPage.generatePaths = async () => defineStaticPaths(sections.map((section) => ({ name: section.meta.name })));

SectionPage.metadata = {
  title: 'Sharingan sections',
  description: 'Open-source animated sections for below the hero, driven by the scroll.',
};

export default SectionPage;
