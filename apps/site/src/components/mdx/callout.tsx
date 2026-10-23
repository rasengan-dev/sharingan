import type { ReactNode } from 'react';
import { Info, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const variants = {
  note: { Icon: Info, className: 'border-border bg-muted/40', icon: 'text-muted-foreground' },
  warning: { Icon: TriangleAlert, className: 'border-[color:var(--brand)]/40 bg-[color:var(--brand)]/8', icon: 'text-[color:var(--brand)]' },
};

type Props = {
  title?: string;
  variant?: keyof typeof variants;
  children: ReactNode;
};

/** A side note. Usable in MDX as `<Note>` or `<Callout variant="warning">`. */
export function Callout({ title, variant = 'note', children }: Props) {
  const { Icon, className, icon } = variants[variant];
  return (
    <div role="note" className={cn('my-6 flex gap-3 rounded-xl border px-4 py-3.5 text-[15px]', className)}>
      <Icon className={cn('mt-[3px] size-4 shrink-0', icon)} aria-hidden="true" />
      <div className="min-w-0 [&>p]:m-0 [&>p+p]:mt-2">
        {title && <p className="m-0 mb-1 font-semibold text-foreground">{title}</p>}
        <div className="text-muted-foreground [&_p]:m-0">{children}</div>
      </div>
    </div>
  );
}
