import type { ReactNode } from 'react';
import { Link } from 'rasengan';
import { catalogue } from '@/catalogue';
import type { DemoEntry } from '@/demo-list';

/** A demo page's footer: its sign-off, and a link to every piece it is built from, in page order. */
export function DemoFooter({ demo, title, children }: { demo: DemoEntry; title: string; children: ReactNode }) {
  const pieces = [demo.hero, ...demo.sections].map((name) => catalogue.find((item) => item.name === name)).filter((item) => item !== undefined);
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-4">
          <p className="text-3xl font-semibold tracking-tight">{title}</p>
          <p className="max-w-md text-muted-foreground">
            {children} Each piece is copied on its own with the shadcn CLI.{' '}
            <Link to="/demos" className="text-foreground underline underline-offset-4">
              More demos
            </Link>
            .
          </p>
        </div>
        <nav aria-label="The pieces of this page" className="flex flex-col gap-2 text-sm">
          {pieces.map((item) => (
            <Link key={item.name} to={item.href} className="text-muted-foreground hover:text-foreground">
              {item.title}
              {item.kind === 'hero' && ' (hero)'}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
