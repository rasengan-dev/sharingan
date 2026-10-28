import { Link, type PageComponent } from 'rasengan';
import { catalogue } from '@/catalogue';
import { demos } from '@/demo-list';

const titleOf = (name: string) => catalogue.find((item) => item.name === name)?.title ?? name;

/** Every demo landing page: what it is, and the hero and sections it is built from. */
const Demos: PageComponent = () => (
  <main className="mx-auto max-w-6xl px-6 pt-28 pb-24">
    <header className="flex flex-col gap-4">
      <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">Demos</p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Landing pages</h1>
      <p className="max-w-2xl text-muted-foreground">
        Whole pages built from one hero and a handful of sections, each with its example content. They are showcases, not templates: copy the pieces you want.
      </p>
    </header>

    <ul className="mt-12 grid gap-6 md:grid-cols-2">
      {demos.map((demo) => (
        <li key={demo.slug}>
          <Link
            to={`/demos/${demo.slug}`}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border transition-colors hover:border-foreground/30"
          >
            <span className="relative block aspect-[16/9] overflow-hidden bg-muted">
              {/* The hero's still frames from `pnpm posters`, one per theme */}
              <img src={`/thumbs/${demo.hero}.webp`} alt="" loading="lazy" className="size-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] dark:hidden" />
              <img src={`/thumbs/${demo.hero}-dark.webp`} alt="" loading="lazy" className="hidden size-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] dark:block" />
            </span>
            <span className="flex flex-1 flex-col gap-3 p-6">
              <span className="text-xl font-semibold">{demo.title}</span>
              <span className="text-sm text-muted-foreground">{demo.summary}</span>
              <span className="mt-auto flex flex-wrap gap-1.5 pt-2">
                {[demo.hero, ...demo.sections].map((name) => (
                  <span key={name} className="rounded-full bg-muted px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                    {titleOf(name)}
                  </span>
                ))}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  </main>
);

Demos.metadata = {
  title: 'Demos · Sharingan',
  description: 'Landing pages built from one Sharingan hero and a handful of scroll-driven sections.',
};

export default Demos;
