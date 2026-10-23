import { useEffect, useState } from 'react';
import { Link, Outlet, LayoutComponent, ScrollRestoration } from 'rasengan';
import ThemeToggle from '@/components/theme-toggle';

/** Whether the page has scrolled at all: the fixed header shows its edge then. */
function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const read = () => setScrolled(window.scrollY > 8);
    read();
    window.addEventListener('scroll', read, { passive: true });
    return () => window.removeEventListener('scroll', read);
  }, []);
  return scrolled;
}

const AppLayout: LayoutComponent = () => {
  const scrolled = useScrolled();

  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* Every navigation starts at the top of the new page */}
      <ScrollRestoration alwaysToTop />
      <header
        data-scrolled={scrolled || undefined}
        className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-transparent px-6 transition-colors duration-300 data-[scrolled]:border-border/60 data-[scrolled]:bg-background/75 data-[scrolled]:backdrop-blur-md"
      >
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span aria-hidden="true" className="size-3 rounded-full bg-[var(--brand)] ring-4 ring-[var(--brand)]/25" />
          Sharingan
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm">
          <a href="/#collection" className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground">
            Heroes
          </a>
          <Link to="/docs" className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground">
            Docs
          </Link>
          <ThemeToggle />
        </nav>
      </header>
      <Outlet />
    </div>
  );
};

export default AppLayout;
