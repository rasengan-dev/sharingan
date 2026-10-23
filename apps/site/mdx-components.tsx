import type React from 'react';
import type { ComponentProps, ElementType } from 'react';
import { Link } from 'rasengan';
import { defineMDXConfig } from '@rasenganjs/mdx';
import { Callout } from '@/components/mdx/callout';
import { CodeFigure, CodePre, CodeTitle, InlineCode } from '@/components/mdx/code-block';
import { Step, Steps } from '@/components/mdx/steps';
import { Toc } from '@/components/mdx/toc';
import { InstallByUrl, RegistryConfig } from '@/components/docs/registry-snippet';
import { cn } from '@/lib/utils';

/** Gives an element fixed classes, merged with any the MDX passes. */
function styled(Tag: keyof React.JSX.IntrinsicElements, base: string) {
  const Component = ({ className, ...props }: { className?: string; [prop: string]: unknown }) => <Tag className={cn(base, className)} {...props} />;
  Component.displayName = Tag;
  return Component;
}

/**
 * How every `.page.mdx` renders, after Hiraiship's docs (apps/docs). Custom
 * components (`<Note>`, `<Callout>`, `<Steps>`, `<Link>`, `<RegistryConfig>`…)
 * are usable in MDX without an import.
 */
export default defineMDXConfig({
  components: {
    h1: styled('h1', 'mt-0 mb-4 text-[34px] leading-[1.1] font-semibold tracking-[-1px] text-foreground md:text-[40px]'),
    h2: styled('h2', 'mt-12 mb-3 border-b border-border pb-2 text-[24px] font-semibold tracking-[-0.5px] text-foreground'),
    h3: styled('h3', 'mt-8 mb-2 text-[19px] font-semibold text-foreground'),
    h4: styled('h4', 'mt-6 mb-2 text-base font-semibold text-foreground'),
    p: styled('p', 'my-4 text-[15.5px] leading-[1.7] text-muted-foreground'),
    a: styled('a', 'font-medium text-foreground underline decoration-[color:var(--brand)]/40 underline-offset-4 hover:decoration-[color:var(--brand)]'),
    strong: styled('strong', 'font-semibold text-foreground'),
    ul: styled('ul', 'my-4 list-disc pl-6 text-[15.5px] text-muted-foreground marker:text-muted-foreground/60'),
    ol: styled('ol', 'my-4 list-decimal pl-6 text-[15.5px] text-muted-foreground marker:text-muted-foreground/60'),
    li: styled('li', 'my-1.5 leading-[1.7]'),
    blockquote: styled('blockquote', 'my-6 border-l-2 border-[color:var(--brand)] pl-4 text-muted-foreground italic'),
    hr: styled('hr', 'my-10 border-border'),
    figure: CodeFigure,
    figcaption: CodeTitle,
    pre: CodePre,
    code: InlineCode,
    table: ({ className, ...props }: ComponentProps<'table'>) => (
      <div className="my-6 w-full overflow-x-auto rounded-xl border border-border">
        <table className={cn('w-full border-collapse text-sm', className)} {...props} />
      </div>
    ),
    /* A floor on each column: on a phone a wide table scrolls instead of squeezing every column to a word per line. */
    th: styled('th', 'min-w-28 border-b border-border bg-muted/50 px-4 py-2.5 text-left font-semibold text-foreground'),
    td: styled('td', 'min-w-28 border-b align-top border-border px-4 py-2.5 text-muted-foreground'),
    Note: Callout,
    Callout,
    Steps,
    Step,
    RegistryConfig,
    InstallByUrl,
    Link: ({ className, ...props }: ComponentProps<typeof Link>) => (
      <Link className={cn('font-medium text-foreground underline decoration-[color:var(--brand)]/40 underline-offset-4', className)} {...props} />
    ),
    /* defineMDXConfig types `components` as intrinsic elements only, while MDX also accepts custom ones. */
  } as Record<string, ElementType>,

  toc: (items) => <Toc items={items} />,

  layout: ({ children, toc }) => (
    <main className="mx-auto flex max-w-6xl gap-12 px-4 pt-[calc(var(--header-height)+40px)] pb-24 md:px-10">
      <article className="mx-auto w-full max-w-[720px] min-w-0">{children}</article>
      {toc}
    </main>
  ),
});
