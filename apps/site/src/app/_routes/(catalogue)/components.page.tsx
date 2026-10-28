import { useState } from 'react';
import { Link, PageComponent } from 'rasengan';
import { catalogue, catalogueGroups, type CatalogueItem } from '@/catalogue';
import { ComponentCard } from '@/components/catalogue/component-card';

type Filter = 'all' | 'WebGPU' | 'DOM' | 'section';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'WebGPU', label: 'WebGPU heroes' },
  { value: 'DOM', label: 'DOM heroes' },
  { value: 'section', label: 'Sections' },
];

const matches = (item: CatalogueItem, filter: Filter, words: string[]) =>
  (filter === 'all' || (filter === 'section' ? item.kind === 'section' : item.kind === 'hero' && item.tag === filter)) &&
  words.every((word) => `${item.title} ${item.summary} ${item.badge}`.toLowerCase().includes(word));

/** Every hero and section on one page, by group: browse with the filters, or type a name to find one. */
const Components: PageComponent = () => {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const groups = catalogueGroups.map((group) => ({ ...group, items: group.items.filter((item) => matches(item, filter, words)) })).filter((group) => group.items.length > 0);
  const count = groups.reduce((total, group) => total + group.items.length, 0);

  return (
    <main className="mx-auto max-w-6xl px-6 pt-28 pb-24">
      <header className="flex flex-col gap-4">
        <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">Catalogue</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Components</h1>
        <p className="max-w-2xl text-muted-foreground">
          {catalogue.filter((item) => item.kind === 'hero').length} heroes for the top of a page and {catalogue.filter((item) => item.kind === 'section').length} sections
          for what follows it. Each one is copied into your project with the shadcn CLI, in React or as a Web Component.{' '}
          <Link to="/demos" className="text-foreground underline underline-offset-4">
            See them together on landing pages
          </Link>
          .
        </p>
      </header>

      <div className="sticky top-16 z-30 -mx-6 mt-10 flex flex-wrap items-center gap-3 border-b border-border bg-background/85 px-6 py-3 backdrop-blur-md">
        <div role="group" aria-label="Filter by kind" className="flex flex-wrap rounded-full border border-border p-1">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className="rounded-full px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground aria-pressed:bg-foreground aria-pressed:text-background"
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by name or effect"
          aria-label="Filter by name or effect"
          className="h-9 min-w-0 flex-1 rounded-full border border-border bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground/40 sm:max-w-xs"
        />
        <p className="ml-auto font-mono text-xs text-muted-foreground" aria-live="polite">
          {count} shown
        </p>
      </div>

      {groups.length === 0 && (
        <p className="py-24 text-center text-muted-foreground">
          Nothing matches “{query}”.{' '}
          <button type="button" onClick={() => (setQuery(''), setFilter('all'))} className="text-foreground underline underline-offset-4">
            Show everything
          </button>
        </p>
      )}

      {groups.map((group) => (
        <section key={group.title} aria-labelledby={`group-${group.title}`} className="mt-12 scroll-mt-32">
          <h2 id={`group-${group.title}`} className="flex items-baseline gap-3 text-xl font-semibold tracking-tight">
            {group.title}
            <span className="font-mono text-xs font-normal text-muted-foreground">{group.items.length}</span>
          </h2>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {group.items.map((item) => (
              <li key={item.name}>
                <ComponentCard item={item} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
};

Components.metadata = {
  title: 'Components · Sharingan',
  description: 'Every Sharingan hero and section, by group, with live previews one click away.',
};

export default Components;
