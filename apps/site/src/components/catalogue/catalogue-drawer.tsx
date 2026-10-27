import { useEffect } from 'react';
import { X } from 'lucide-react';
import { CatalogueNav } from '@/components/catalogue/catalogue-nav';
import { SearchButton } from '@/components/catalogue/command-menu';

/**
 * The catalogue's tree on screens without the sidebar (below 1024 px): a panel
 * from the right edge, opened from the header's menu button.
 */
export function CatalogueDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    // The page behind stays where it is.
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Browse components"
        className="absolute inset-y-0 right-0 flex w-80 max-w-[86vw] flex-col border-l border-border bg-background shadow-2xl"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Browse</p>
          <button type="button" onClick={onClose} aria-label="Close" autoFocus className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
          <SearchButton className="w-full" />
          <CatalogueNav onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
}
