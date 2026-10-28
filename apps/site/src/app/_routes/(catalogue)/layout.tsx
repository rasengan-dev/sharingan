import { useEffect, useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Outlet, type LayoutComponent } from 'rasengan';
import { CatalogueNav } from '@/components/catalogue/catalogue-nav';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'sharingan:sidebar-hidden';

/**
 * Whether the desktop sidebar is hidden, remembered across visits and toggled
 * with ⌘B / Ctrl+B. `ready` turns the transitions on only after the stored
 * value is read, so a page loaded with the sidebar hidden does not animate.
 */
function useSidebar() {
  const [hidden, setHidden] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(STORAGE_KEY) === '1');
    } catch {}
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, hidden ? '1' : '0');
    } catch {}
  }, [hidden, ready]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'b' || !(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
      if (!window.matchMedia('(min-width: 1024px)').matches) return;
      event.preventDefault();
      setHidden((current) => !current);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return { hidden, ready, toggle: () => setHidden((current) => !current) };
}

/**
 * The catalogue's shell (heroes, sections and their overview): the tree of
 * every component in a sidebar, the page beside it. The previews scroll with
 * the page. On large screens the sidebar can be hidden to give the previews
 * the full width; its column closes while the tree slides out, and the
 * previews rebuild for the new width once it settles. Below 1024 px the tree
 * moves to the header's menu.
 */
const CatalogueLayout: LayoutComponent = () => {
  const { hidden, ready, toggle } = useSidebar();

  return (
    <div
      data-sidebar={hidden ? 'hidden' : 'shown'}
      className={cn(
        'lg:grid lg:grid-cols-[256px_minmax(0,1fr)] lg:data-[sidebar=hidden]:grid-cols-[0px_minmax(0,1fr)]',
        ready && 'transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none',
      )}
    >
      {/* Opaque and above the page: a pinned section's moving parts never show through the tree. Clipped, not hidden, so the aside stays sticky. */}
      <div
        className={cn(
          'relative z-20 hidden overflow-clip border-r bg-background lg:block',
          hidden ? 'border-transparent' : 'border-border',
          ready && 'transition-colors duration-300',
        )}
      >
        <aside
          inert={hidden}
          className={cn(
            'sticky top-16 mt-16 h-[calc(100svh-4rem)] w-64 overflow-y-auto overscroll-contain px-3 py-6',
            hidden ? '-translate-x-6 opacity-0' : 'translate-x-0 opacity-100',
            // Out fast with the column, in a beat after it starts opening.
            ready &&
              (hidden
                ? 'transition-[opacity,translate] duration-200 ease-in motion-reduce:transition-none'
                : 'transition-[opacity,translate] delay-75 duration-300 ease-out motion-reduce:transition-none'),
          )}
        >
          <div className="mb-4 flex items-center justify-between pl-3">
            <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">Browse</p>
            <button
              type="button"
              onClick={toggle}
              aria-label="Hide sidebar"
              aria-keyshortcuts="Meta+B Control+B"
              title="Hide sidebar (⌘B / Ctrl+B)"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <PanelLeftClose className="size-4" />
            </button>
          </div>
          <CatalogueNav />
        </aside>
      </div>
      <div className="min-w-0">
        <Outlet />
      </div>
      {/* Brings the sidebar back: appears once the column has mostly closed, leaves at once when it opens. */}
      <button
        type="button"
        onClick={toggle}
        inert={!hidden}
        aria-label="Show sidebar"
        aria-keyshortcuts="Meta+B Control+B"
        title="Show sidebar (⌘B / Ctrl+B)"
        className={cn(
          'fixed top-20 left-4 z-40 hidden items-center gap-2 rounded-md border border-border bg-background/80 px-2.5 py-1.5 text-sm text-muted-foreground shadow-sm backdrop-blur-md hover:bg-muted hover:text-foreground lg:flex',
          hidden ? 'translate-x-0 scale-100 opacity-100' : 'pointer-events-none -translate-x-3 scale-95 opacity-0',
          ready &&
            (hidden
              ? 'transition-[opacity,translate,scale,background-color,color] delay-150 duration-300 ease-out motion-reduce:transition-none'
              : 'transition-[opacity,translate,scale,background-color,color] duration-150 ease-in motion-reduce:transition-none'),
        )}
      >
        <PanelLeftOpen className="size-4" />
        Browse
      </button>
    </div>
  );
};

export default CatalogueLayout;
