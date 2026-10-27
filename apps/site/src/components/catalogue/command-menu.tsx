import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'rasengan';
import { catalogue } from '@/catalogue';
import { startLinks } from '@/components/catalogue/catalogue-nav';

const OPEN_EVENT = 'sharingan:search';

/** Opens the search menu from anywhere (a header button, the mobile bar). */
export const openSearch = () => window.dispatchEvent(new Event(OPEN_EVENT));

type Result = { href: string; title: string; detail: string; group: string };

const everything: Result[] = [
  ...catalogue.map((item) => ({
    href: item.href,
    title: item.title,
    detail: item.summary,
    group: item.kind === 'hero' ? `Heroes · ${item.tag}` : 'Sections',
  })),
  ...startLinks.map((link) => ({ href: link.href, title: link.title, detail: '', group: 'Pages' })),
];

/** Every word of the query must appear in the title, the summary or the group. */
function search(query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return everything;
  return everything.filter((result) => {
    const text = `${result.title} ${result.detail} ${result.group}`.toLowerCase();
    return words.every((word) => text.includes(word));
  });
}

/** A search button, labelled with its shortcut. */
export function SearchButton({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={openSearch}
      className={`flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground ${className}`}
    >
      <Search className="size-4" aria-hidden="true" />
      <span>Search components</span>
      <kbd className="ml-auto hidden rounded border border-border px-1.5 font-mono text-[11px] sm:inline">⌘K</kbd>
    </button>
  );
}

/**
 * ⌘K (Ctrl+K) or "/" anywhere on the site: find a hero, a section or a page
 * by name or by what it does, then go there with Enter.
 */
export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const results = useMemo(() => search(query), [query]);

  useEffect(() => {
    const show = () => setOpen(true);
    const onKey = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLElement && (event.target.isContentEditable || /^(input|textarea|select)$/i.test(event.target.tagName));
      if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !typing)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener(OPEN_EVENT, show);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, show);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  // Each opening starts fresh, with the focus in the field; closing gives it back.
  useEffect(() => {
    if (!open) return;
    const before = document.activeElement as HTMLElement | null;
    setQuery('');
    setActive(0);
    input.current?.focus();
    return () => before?.focus?.();
  }, [open]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const go = (result: Result | undefined) => {
    if (!result) return;
    setOpen(false);
    navigate(result.href);
  };

  let previousGroup = '';
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={() => setOpen(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search components"
        className="flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-4 flex-none text-muted-foreground" aria-hidden="true" />
          <input
            ref={input}
            role="combobox"
            aria-expanded="true"
            aria-controls={`${id}-list`}
            aria-activedescendant={results[active] ? `${id}-${active}` : undefined}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActive((index) => Math.min(results.length - 1, index + 1));
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActive((index) => Math.max(0, index - 1));
              } else if (event.key === 'Enter') {
                event.preventDefault();
                go(results[active]);
              } else if (event.key === 'Escape') {
                setOpen(false);
              }
            }}
            placeholder="Gallery fan, scroll, WebGPU…"
            className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border px-1.5 font-mono text-[11px] text-muted-foreground">Esc</kbd>
        </div>
        <ul ref={list} id={`${id}-list`} role="listbox" aria-label="Results" className="overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">Nothing matches “{query}”.</li>}
          {results.map((result, index) => {
            const heading = result.group !== previousGroup ? result.group : null;
            previousGroup = result.group;
            return (
              <li key={result.href} role="presentation">
                {heading && <p className="px-3 pt-3 pb-1 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">{heading}</p>}
                <div
                  id={`${id}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  data-index={index}
                  onMouseMove={() => setActive(index)}
                  onClick={() => go(result)}
                  className="flex cursor-pointer flex-col rounded-lg px-3 py-2 aria-selected:bg-muted"
                >
                  <span className="text-sm font-medium">{result.title}</span>
                  {result.detail && <span className="line-clamp-1 text-xs text-muted-foreground">{result.detail}</span>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
