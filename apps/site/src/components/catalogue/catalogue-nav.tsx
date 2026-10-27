import type { ReactNode } from 'react';
import { Link, useLocation } from 'rasengan';
import { catalogueGroups } from '@/catalogue';

/** Pages that are not components but belong in the catalogue's tree. */
export const startLinks = [
  { href: '/components', title: 'Overview' },
  { href: '/docs', title: 'Installation' },
  { href: '/demo', title: 'Landing page demo' },
];

function NavItem({ href, title, tag, onNavigate }: { href: string; title: string; tag?: string; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const current = pathname.replace(/\/$/, '') === href;
  return (
    <li>
      <Link
        to={href}
        onClick={onNavigate}
        aria-current={current ? 'page' : undefined}
        className="flex items-center justify-between gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground"
      >
        <span className="truncate">{title}</span>
        {tag && <span className="flex-none font-mono text-[11px] text-muted-foreground/80">{tag}</span>}
      </Link>
    </li>
  );
}

function NavGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="px-3 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">{title}</p>
      <ul className="flex flex-col">{children}</ul>
    </div>
  );
}

/**
 * The catalogue's tree: getting started, then every hero by engine and every
 * section. Rendered in the desktop sidebar and in the mobile drawer.
 */
export function CatalogueNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Components" className="flex flex-col gap-6">
      <NavGroup title="Get started">
        {startLinks.map((link) => (
          <NavItem key={link.href} {...link} onNavigate={onNavigate} />
        ))}
      </NavGroup>
      {catalogueGroups.map((group) => (
        <NavGroup key={group.title} title={`${group.title} · ${group.items.length}`}>
          {group.items.map((item) => (
            <NavItem key={item.name} href={item.href} title={item.title} tag={item.kind === 'section' ? item.tag : undefined} onNavigate={onNavigate} />
          ))}
        </NavGroup>
      ))}
    </nav>
  );
}
