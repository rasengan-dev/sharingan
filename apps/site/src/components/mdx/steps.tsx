import type { ReactNode } from 'react';

/** A numbered procedure: `<Steps>` around `<Step title="…">` blocks. The numbers are a CSS counter. */
export function Steps({ children }: { children: ReactNode }) {
  return <ol className="my-6 list-none p-0 [counter-reset:step]">{children}</ol>;
}

export function Step({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <li className="relative border-l border-border pb-6 pl-8 [counter-increment:step] last:border-transparent last:pb-0">
      <span
        aria-hidden="true"
        className="absolute top-0 -left-3.5 flex size-7 items-center justify-center rounded-full border border-border bg-background font-mono text-xs text-muted-foreground before:content-[counter(step)]"
      />
      <p className="m-0 pt-0.5 text-[17px] font-semibold text-foreground">{title}</p>
      <div className="[&>*:first-child]:mt-2 [&>*:last-child]:mb-0">{children}</div>
    </li>
  );
}
