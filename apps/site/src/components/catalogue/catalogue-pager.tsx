import { Link } from 'rasengan';
import { catalogue } from '@/catalogue';

/** Previous and next in the catalogue's order: WebGPU heroes, DOM heroes, then sections. */
export function CataloguePager({ name }: { name: string }) {
  const index = catalogue.findIndex((item) => item.name === name);
  if (index < 0) return null;
  const previous = catalogue[index - 1];
  const next = catalogue[index + 1];
  const kind = (item: (typeof catalogue)[number]) => (item.kind === 'hero' ? `Hero · ${item.tag}` : 'Section');

  return (
    <nav aria-label="More components" className="mx-auto grid max-w-5xl gap-3 px-6 pb-16 sm:grid-cols-2">
      {previous ? (
        <Link to={previous.href} className="flex flex-col gap-1 rounded-xl border border-border px-5 py-4 transition-colors hover:border-foreground/30">
          <span className="text-xs text-muted-foreground">← Previous · {kind(previous)}</span>
          <span className="font-medium">{previous.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link to={next.href} className="flex flex-col gap-1 rounded-xl border border-border px-5 py-4 text-right transition-colors hover:border-foreground/30">
          <span className="text-xs text-muted-foreground">Next · {kind(next)} →</span>
          <span className="font-medium">{next.title}</span>
        </Link>
      )}
    </nav>
  );
}
