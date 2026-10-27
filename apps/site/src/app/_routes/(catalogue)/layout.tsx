import { Outlet, type LayoutComponent } from 'rasengan';
import { CatalogueNav } from '@/components/catalogue/catalogue-nav';

/**
 * The catalogue's shell (heroes, sections and their overview): the tree of
 * every component in a sidebar, the page beside it. The previews scroll with
 * the page. Below 1024 px the tree moves to the header's menu.
 */
const CatalogueLayout: LayoutComponent = () => (
  <div className="lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
    {/* Opaque and above the page: a pinned section's moving parts never show through the tree. */}
    <div className="relative z-20 hidden border-r border-border bg-background lg:block">
      <aside className="sticky top-16 mt-16 h-[calc(100svh-4rem)] overflow-y-auto overscroll-contain px-3 py-6">
        <CatalogueNav />
      </aside>
    </div>
    <div className="min-w-0">
      <Outlet />
    </div>
  </div>
);

export default CatalogueLayout;
