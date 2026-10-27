/** The site's footer, on every page: who made Sharingan, and its licence. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          Sharingan is made by{' '}
          <a href="https://dilane3.dev" target="_blank" rel="noreferrer" className="font-medium text-foreground underline-offset-4 hover:underline">
            Dilane Kombou
          </a>
          .
        </p>
        <p>Open source under the MIT licence.</p>
      </div>
    </footer>
  );
}
