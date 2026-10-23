import { PageComponent } from 'rasengan';
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
            'Open-source heroes rendered with WebGPU and TypeGPU. Copy one into your project with the shadcn CLI, in React or as a Web Component.',
          primaryCta: { label: 'See Ink flow', href: '/heroes/ink-flow' },
          secondaryCta: { label: 'Read the RFC', href: 'https://github.com/rasengan-dev/sharingan/blob/main/proposals/RFC-0001-Sharingan.md' },
        }}
      />
    </main>
  );
};

Home.metadata = {
  title: 'Sharingan · WebGPU hero sections',
  description: 'Open-source hero sections rendered with WebGPU, for React and as Web Components.',
};

export default Home;
