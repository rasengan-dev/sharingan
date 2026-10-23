import { useActiveTocItem, type TOCItem } from '@rasenganjs/mdx';
import { cn } from '@/lib/utils';

/* Module-level: the hook rebuilds its observer whenever this object changes identity. */
const observerOptions: IntersectionObserverInit = { threshold: 0.5, rootMargin: '0px 0px -80% 0px' };

/** The page's h2/h3 outline, with the section in view highlighted. */
export function Toc({ items }: { items: TOCItem[] }) {
  const [activeId] = useActiveTocItem(items, observerOptions);
  if (items.length === 0) return null;

  const link = (id: string) =>
    cn('block py-1 text-[13px] transition-colors', activeId === id ? 'font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground');

  return (
    <aside className="sticky top-[calc(var(--header-height)+40px)] hidden max-h-[calc(100svh-var(--header-height)-80px)] w-[200px] shrink-0 self-start overflow-y-auto hide-scrollbar lg:block">
      <h2 className="m-0 mb-3 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">On this page</h2>
      <ul className="m-0 list-none border-l border-border p-0 pl-4">
        {items.map((item) => (
          <li key={item.anchor.id}>
            <a href={`#${item.anchor.id}`} className={link(item.anchor.id)}>
              {item.anchor.text}
            </a>
            {item.children.length > 0 && (
              <ul className="m-0 list-none p-0 pl-3">
                {item.children.map((child) => (
                  <li key={child.anchor.id}>
                    <a href={`#${child.anchor.id}`} className={link(child.anchor.id)}>
                      {child.anchor.text}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
