import { useCallback, useEffect, useState } from 'react';
import { Menu, Search } from 'lucide-react';
import { Link, Outlet, LayoutComponent, ScrollRestoration, useLocation } from 'rasengan';
import { CatalogueDrawer } from '@/components/catalogue/catalogue-drawer';
import { CommandMenu, SearchButton, openSearch } from '@/components/catalogue/command-menu';
import { SiteFooter } from '@/components/site-footer';
import ThemeToggle from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';

/** The GitHub mark (lucide's brand icons are deprecated). */
function GitHubIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
    </svg>
  );
}

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
  const [drawer, setDrawer] = useState(false);
  const closeDrawer = useCallback(() => setDrawer(false), []);
  const { pathname } = useLocation();
  useEffect(() => setDrawer(false), [pathname]);

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
          <Link to="/components" className="hidden rounded-md px-3 py-2 text-muted-foreground hover:text-foreground sm:block">
            Components
          </Link>
          <Link to="/demos" className="hidden rounded-md px-3 py-2 text-muted-foreground hover:text-foreground md:block">
            Demos
          </Link>
          <Link to="/docs" className="hidden rounded-md px-3 py-2 text-muted-foreground hover:text-foreground sm:block">
            Docs
          </Link>
          <SearchButton className="mx-2 hidden w-60 lg:flex" />
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={openSearch} aria-label="Search components">
            <Search />
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a href="https://github.com/rasengan-dev/sharingan" target="_blank" rel="noreferrer" aria-label="Sharingan on GitHub">
              <GitHubIcon />
            </a>
          </Button>
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setDrawer(true)} aria-label="Browse components" aria-expanded={drawer}>
            <Menu />
          </Button>
        </nav>
      </header>
      <Outlet />
      <SiteFooter />
      <CatalogueDrawer open={drawer} onClose={closeDrawer} />
      <CommandMenu />
    </div>
  );
};

export default AppLayout;
