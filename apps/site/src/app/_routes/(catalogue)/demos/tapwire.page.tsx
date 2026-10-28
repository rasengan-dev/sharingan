import type { PageComponent } from 'rasengan';
import { DemoFooter } from '@/components/demo-footer';
import { demos } from '@/demo-list';
import { isoDeckExample } from '@/heroes/iso-deck/example';
import { IsoDeckHero } from '@/heroes/iso-deck/iso-deck';
import { BentoAssembleSection } from '@/sections/bento-assemble/bento-assemble';
import type { BentoAssembleContent } from '@/sections/bento-assemble/schema';
import { CaseTrackSection } from '@/sections/case-track/case-track';
import type { CaseTrackContent } from '@/sections/case-track/schema';
import { ScrollReadSection } from '@/sections/scroll-read/scroll-read';
import type { ScrollReadContent } from '@/sections/scroll-read/schema';
import { SplitWordSection } from '@/sections/split-word/split-word';
import type { SplitWordContent } from '@/sections/split-word/schema';

const demo = demos.find((entry) => entry.slug === 'tapwire')!;

/** Tapwire's mint, and a soft violet beside it (the iso deck derives the same pair from the accent). */
const MINT = 'oklch(0.84 0.17 145)';
const VIOLET = 'oklch(0.8 0.1 295)';

const hero = { ...isoDeckExample, primaryCta: { label: 'Connect a wallet', href: '#contact' }, secondaryCta: { label: 'Watch the demo', href: '#why' }, keyCta: { label: 'Learn more', href: '#how' } };

const why: BentoAssembleContent = {
  eyebrow: 'Why Tapwire',
  headline: 'Built for the first tap',
  text: 'One SDK for every wallet, a status page that tells the truth, and people who answer when a release goes wrong.',
  badge: { label: 'Read the docs', href: '#how' },
  tiles: [
    {
      size: 'wide',
      figure: '320',
      title: 'wallets supported',
      text: 'Browser, mobile and hardware wallets, behind one connect call.',
      avatars: [
        { src: '/sharingan/people/person-05.webp', alt: 'Lena, SDK lead' },
        { src: '/sharingan/people/person-08.webp', alt: 'Kofi, developer relations' },
        { src: '/sharingan/people/person-13.webp', alt: 'Priya, reliability' },
        { src: '/sharingan/people/person-02.webp', alt: 'Sam, support' },
      ],
    },
    {
      size: 'tall',
      tone: 'photo',
      label: 'On call, every day',
      image: { src: '/sharingan/people/person-11.webp', alt: 'A smiling man in a white t-shirt resting his chin on his hand' },
    },
    { size: 'small', tone: 'accent', figure: '180', text: 'ms to connect, median' },
    { size: 'small', tone: 'accent-2', figure: '99.99%', text: 'uptime last year' },
    { size: 'tall', tone: 'accent', title: 'One call, every wallet', text: 'connect() picks the right flow for the device, then hands you a session.' },
    { size: 'small', tone: 'photo', image: { src: '/sharingan/people/person-03.webp', alt: 'A smiling woman with long brown hair, her hand at her chin' } },
    { size: 'wide', title: 'Live status for every session', text: 'Who connected, from where, and what failed, as it happens.', label: 'Live' },
    { size: 'small', figure: '42M', text: 'sessions a month' },
  ],
};

const how: ScrollReadContent = {
  eyebrow: 'How it works',
  text: 'Drop in the SDK {0}, call connect when someone taps {1}, and watch every session arrive on your dashboard {2}. No wallet lists to keep, no popups to style, no surprises in production.',
  images: [
    { src: '/sharingan/people/person-05.webp', alt: 'Lena, SDK lead' },
    { src: '/sharingan/people/person-13.webp', alt: 'Priya, reliability' },
    { src: '/sharingan/people/person-08.webp', alt: 'Kofi, developer relations' },
  ],
  cta: { label: 'Read the quick start', href: '#cases' },
};

const cases: CaseTrackContent = {
  eyebrow: 'Customers',
  headline: 'Teams that ship on Tapwire',
  text: 'Games, marketplaces and payment apps: the first tap is the same, what they build after it is not.',
  cta: { label: 'All stories', href: '#cases' },
  cases: [
    {
      title: 'A marketplace that halved drop-off',
      text: 'Kiln moved its checkout to one connect call. Half as many buyers left at the wallet step, in the first month.',
      tag: 'Marketplace',
      figure: '−51% drop-off',
      image: { src: '/sharingan/people/person-03.webp', alt: 'A smiling woman with long brown hair, her hand at her chin' },
      href: '#kiln',
    },
    { title: 'Tickets in one tap', tag: 'Events', image: { src: '/sharingan/people/person-10.webp', alt: 'A young man in a peach polo shirt smiling' }, href: '#gate' },
    { title: 'A game that plays first', tag: 'Gaming', image: { src: '/sharingan/reel/headphones.webp', alt: 'Mint earphones on a mint and pink background' }, href: '#pixelrun' },
    { title: 'Tips for every creator', tag: 'Creators', image: { src: '/sharingan/people/person-07.webp', alt: 'A smiling woman with a short dark bob' }, href: '#tipjar' },
    { title: 'Payroll across borders', tag: 'Fintech', image: { src: '/sharingan/people/person-12.webp', alt: 'A person with shoulder-length brown hair laughing' }, href: '#paystream' },
    { title: 'Loyalty points you can keep', tag: 'Retail', image: { src: '/sharingan/reel/watch.webp', alt: "A black wristwatch on a man's wrist" }, href: '#keep' },
  ],
};

const contact: SplitWordContent = {
  eyebrow: 'Get started',
  word: 'Connect',
  split: 3,
  card: { title: 'Tapwire', lines: ['Free up to 10,000 sessions', 'hello@tapwire.example', 'Docs, SDKs and status'], href: 'mailto:hello@tapwire.example' },
  form: { action: '#contact', submit: 'Get a key' },
};

/**
 * Tapwire, the made-up wallet connection service: the iso deck hero, then
 * sections of both collections with Tapwire's words, in mint and violet.
 * A showcase, not a registry item: people copy the pieces.
 */
const Tapwire: PageComponent = () => (
  <main>
    <IsoDeckHero content={hero} config={{ accent: MINT }} />
    <BentoAssembleSection id="why" content={why} config={{ accent: MINT, accentAlt: VIOLET }} />
    <ScrollReadSection id="how" content={how} />
    <CaseTrackSection id="cases" content={cases} config={{ accent: MINT, accentAlt: VIOLET }} />
    <SplitWordSection id="contact" content={contact} config={{ accent: MINT }} />

    <DemoFooter demo={demo} title="One tap. Zero friction.">
      This page is a demo: the iso deck hero, then the bento, case and contact sections of the second collection and the scroll read from the first, with Tapwire&apos;s words.
    </DemoFooter>
  </main>
);

Tapwire.metadata = {
  title: 'Tapwire · Sharingan demo',
  description: 'A landing page for a made-up wallet connection service, built from the iso deck hero and scroll-driven sections of both collections.',
};

export default Tapwire;
