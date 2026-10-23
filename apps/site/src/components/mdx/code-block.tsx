import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Check, Copy } from 'lucide-react';
import { getIconForLanguageExtension } from '@rasenganjs/mdx';
import { cn } from '@/lib/utils';

/** rehype-pretty-code's wrapper: holds the optional title and the `<pre>`. */
export function CodeFigure({ className, ...props }: ComponentProps<'figure'>) {
  return <figure className={cn('my-6 overflow-hidden rounded-xl border border-code-border bg-code-bg text-code-fg', className)} {...props} />;
}

/** A block's ```lang title="…" ``` caption: the block's header. */
export function CodeTitle({ className, children, ...props }: ComponentProps<'figcaption'>) {
  const language = (props as { 'data-language'?: string })['data-language'];
  return (
    <figcaption
      className={cn(
        'flex items-center gap-2 border-b border-code-border bg-code-header px-5 py-2.5 font-mono text-[13px] text-code-faint [&_svg]:size-4 [&_svg]:opacity-70',
        className,
      )}
      {...props}
    >
      {language ? getIconForLanguageExtension(language) : null}
      {children}
    </figcaption>
  );
}

export function CodePre({ className, children, ...props }: ComponentProps<'pre'>) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    // Line numbers are CSS counters, so the text is the code alone.
    const text = ref.current?.textContent ?? '';
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      /* Clipboard refused (insecure context, permissions): nothing to show. */
    }
  }

  return (
    <div className="group relative">
      <pre ref={ref} className={cn('m-0 overflow-x-auto py-4 font-mono text-[13px] leading-[1.7] hide-scrollbar', className)} {...props}>
        {children}
      </pre>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Copied' : 'Copy code'}
        className="absolute top-2.5 right-2.5 inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-code-border bg-code-bg text-code-faint opacity-0 transition-opacity group-hover:opacity-100 hover:text-code-fg focus-visible:opacity-100"
      >
        {copied ? <Check className="size-3.5 text-code-accent" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}

/** Inline `code` gets a chip; a block's `code` (it has `data-language`) is left to the theme. */
export function InlineCode({ className, ...props }: ComponentProps<'code'>) {
  if ('data-language' in props) return <code className={className} {...props} />;
  return <code className={cn('rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground', className)} {...props} />;
}
