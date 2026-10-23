import { Link, PageComponent } from 'rasengan';
import { heroes } from '@/hero-list';
import { InkFlowHero } from '@/heroes/ink-flow/ink-flow';

// The site wears its own first hero.
const Home: PageComponent = () => {
  return (
    <main>
      <InkFlowHero
        className="min-h-svh"
        content={{
          eyebrow: 'Sharingan · WebGPU heroes',
          headline: 'Hero sections that move like ink',
          subheadline:
            'Open-source animated heroes, on WebGPU or plain DOM. Copy one into your project with the shadcn CLI, in React or as a Web Component.',
          primaryCta: { label: 'Browse the heroes', href: '#collection' },
          secondaryCta: { label: 'Read the RFC', href: 'https://github.com/rasengan-dev/sharingan/blob/main/proposals/RFC-0001-Sharingan.md' },
        }}
      />

      <section id="collection" aria-labelledby="collection-title" className="mx-auto max-w-5xl scroll-mt-16 px-6 py-24">
        <h2 id="collection-title" className="text-3xl font-semibold tracking-tight">
          The collection
        </h2>
        <p className="mt-3 max-w-xl text-muted-foreground">Each hero ships as a React component and a Web Component. WebGPU heroes fall back to CSS where the GPU is missing; DOM heroes run in every browser.</p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {heroes.map(({ meta }) => (
            <li key={meta.name}>
              <Link to={`/heroes/${meta.name}`} className="flex h-full flex-col gap-2 rounded-2xl border border-border p-6 transition-colors hover:bg-muted/50">
                <span className="flex items-center justify-between gap-3">
                  <span className="text-lg font-semibold">{meta.title}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {meta.engine === 'dom' ? 'DOM · every browser' : `WebGPU ${'●'.repeat(meta.gpu?.cost ?? 1)}${'○'.repeat(3 - (meta.gpu?.cost ?? 1))}`}
                  </span>
                </span>
                <span className="text-sm text-muted-foreground">{meta.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
};

Home.metadata = {
  title: 'Sharingan · WebGPU hero sections',
  description: 'Open-source hero sections rendered with WebGPU, for React and as Web Components.',
};

export default Home;
