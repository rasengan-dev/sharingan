import { Link } from 'rasengan';
import type { CatalogueItem } from '@/catalogue';

/** A hero's or section's card: its still frame in the current theme, its name and what it does. */
export function ComponentCard({ item }: { item: CatalogueItem }) {
  return (
    <Link
      to={item.href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border transition-colors hover:border-foreground/30"
    >
      <span className="relative block aspect-[16/9] overflow-hidden bg-muted">
        {/* Still frames from `pnpm posters`, one per theme */}
        <img src={`/thumbs/${item.name}.webp`} alt="" loading="lazy" className="size-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] dark:hidden" />
        <img src={`/thumbs/${item.name}-dark.webp`} alt="" loading="lazy" className="hidden size-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] dark:block" />
      </span>
      <span className="flex flex-1 flex-col gap-2 p-5">
        <span className="flex items-center justify-between gap-3">
          <span className="text-lg font-semibold">{item.title}</span>
          <span className="font-mono text-xs whitespace-nowrap text-muted-foreground">{item.badge}</span>
        </span>
        <span className="text-sm text-muted-foreground">{item.summary}</span>
      </span>
    </Link>
  );
}
