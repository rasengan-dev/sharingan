import { Link, Outlet, LayoutComponent } from 'rasengan';
import ThemeToggle from '@/components/theme-toggle';

const AppLayout: LayoutComponent = () => {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span aria-hidden="true" className="size-3 rounded-full bg-[var(--brand)] ring-4 ring-[var(--brand)]/25" />
          Sharingan
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm">
          <Link to="/heroes/ink-flow" className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground">
            Ink flow
          </Link>
          <ThemeToggle />
        </nav>
      </header>
      <Outlet />
    </div>
  );
};

export default AppLayout;
