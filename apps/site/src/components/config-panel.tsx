import { useEffect, useMemo, useState } from 'react';
import type { HeroEntry } from '@/hero-list';
import { highlight } from '@/lib/highlight';
import { fieldsOf, type Field } from '@/lib/schema-fields';

export type Overrides = Record<string, unknown>;

const pascal = (name: string) => name.replace(/(^|-)(\w)/g, (_, __, letter: string) => letter.toUpperCase());
const kebab = (name: string) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
const literal = (value: unknown): string =>
  Array.isArray(value) ? `[${value.map(literal).join(', ')}]` : typeof value === 'string' ? JSON.stringify(value) : String(value);

/** The code that reproduces the current settings, in React and as a Web Component. */
export function codeFor(name: string, overrides: Overrides) {
  const component = `${pascal(name)}Hero`;
  const entries = Object.entries(overrides);
  const config = entries.length ? ` config={{ ${entries.map(([key, value]) => `${key}: ${literal(value)}`).join(', ')} }}` : '';
  const react = `import { ${component} } from "@/components/heroes/${name}/${name}";\n\n<${component}${config} />`;
  const attributes = entries.map(([key, value]) => ` ${kebab(key)}="${Array.isArray(value) ? value.join(', ') : String(value)}"`).join('');
  const element = `<script type="module">\n  import { define${pascal(name)}Element } from "@/components/heroes/${name}/${name}.element";\n  define${pascal(name)}Element();\n</script>\n\n<sg-${name}${attributes}>\n  <!-- your content -->\n</sg-${name}>`;
  return { react, element };
}

// What the panel can drive; `poster` is the site's own, chosen per theme.
const controllable = (field: Field) => field.depth === 0 && field.name !== 'poster' && ['boolean', 'enum', 'number', 'integer', 'strings', 'string'].includes(field.kind);

function Control({ field, value, onChange }: { field: Field; value: unknown; onChange: (next: unknown) => void }) {
  const id = `config-${field.name}`;
  const label = (
    <label htmlFor={id} className="font-mono text-xs">
      {field.name}
    </label>
  );

  if (field.kind === 'boolean') {
    return (
      <div className="flex items-center justify-between gap-3">
        {label}
        <input id={id} type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-[var(--brand)]" />
      </div>
    );
  }
  if (field.kind === 'enum') {
    return (
      <div className="flex items-center justify-between gap-3">
        {label}
        <select id={id} value={String(value)} onChange={(event) => onChange(event.target.value)} className="rounded-md border border-border bg-background px-2 py-1 text-sm">
          {field.options?.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </div>
    );
  }
  if ((field.kind === 'number' || field.kind === 'integer') && field.min !== undefined && field.max !== undefined) {
    const step = field.kind === 'integer' ? 1 : Number(((field.max - field.min) / 100).toPrecision(1));
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          {label}
          <output htmlFor={id} className="font-mono text-xs text-muted-foreground">
            {String(value)}
          </output>
        </div>
        <input id={id} type="range" min={field.min} max={field.max} step={step} value={Number(value)} onChange={(event) => onChange(Number(event.target.value))} className="accent-[var(--brand)]" />
      </div>
    );
  }
  if (field.kind === 'strings') {
    const list = Array.isArray(value) ? (value as string[]) : [];
    return (
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 font-mono text-xs">{field.name}</legend>
        {list.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span aria-hidden="true" className="size-5 flex-none rounded border border-border" style={{ background: item }} />
            <input
              aria-label={`${field.name} ${index + 1}`}
              value={item}
              onChange={(event) => onChange(list.map((entry, position) => (position === index ? event.target.value : entry)))}
              className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1 font-mono text-xs"
            />
          </div>
        ))}
      </fieldset>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      {label}
      <input id={id} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} className="rounded-md border border-border bg-background px-2 py-1 font-mono text-xs" />
    </div>
  );
}

type ConfigPanelProps = {
  hero: HeroEntry;
  overrides: Overrides;
  onChange: (next: Overrides) => void;
  /** Some settings (sizes, counts) only apply when the hero starts again. */
  onRestart: () => void;
  onClose: () => void;
};

/** A drawer of controls generated from the hero's config schema, with the matching code. */
export function ConfigPanel({ hero, overrides, onChange, onRestart, onClose }: ConfigPanelProps) {
  const fields = useMemo(() => fieldsOf(hero.schemas.config).filter(controllable), [hero]);
  const [tab, setTab] = useState<'react' | 'element'>('react');
  const [copied, setCopied] = useState(false);
  const code = codeFor(hero.meta.name, overrides)[tab];
  // Highlighted by shiki once it has loaded; plain text until then, or if it fails.
  const [html, setHtml] = useState<{ code: string; html: string } | null>(null);
  useEffect(() => {
    let current = true;
    highlight(code, tab === 'react' ? 'tsx' : 'html')
      .then((result) => current && setHtml({ code, html: result }))
      .catch(() => {});
    return () => {
      current = false;
    };
  }, [code, tab]);

  const set = (field: Field, next: unknown) => {
    const rest = { ...overrides };
    // Back to the default: no need to write it in the code.
    if (JSON.stringify(next) === JSON.stringify(field.default)) delete rest[field.name];
    else rest[field.name] = next;
    onChange(rest);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <aside
      aria-label={`Customize ${hero.meta.title}`}
      className="fixed inset-x-2 bottom-2 z-40 flex max-h-[62vh] flex-col overflow-hidden rounded-2xl border border-border bg-background/95 shadow-2xl backdrop-blur sm:inset-x-auto sm:top-20 sm:right-4 sm:bottom-4 sm:max-h-none sm:w-[340px]"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Customize</h2>
        <div className="flex gap-1">
          <button type="button" onClick={() => onChange({})} className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
            Reset
          </button>
          <button type="button" onClick={onRestart} className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground" title="Some settings apply when the hero starts again">
            Restart
          </button>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
            ✕
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        {fields.map((field) => (
          <div key={field.name} title={field.description}>
            <Control field={field} value={overrides[field.name] ?? field.default} onChange={(next) => set(field, next)} />
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div role="tablist" aria-label="Code" className="flex gap-1 px-3 pt-2">
          {(['react', 'element'] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className="rounded-md px-2 py-1 text-xs text-muted-foreground aria-selected:bg-muted aria-selected:text-foreground"
            >
              {value === 'react' ? 'React' : 'Web Component'}
            </button>
          ))}
          <button type="button" onClick={copy} className="ml-auto rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        {html?.code === code ? (
          <div className="max-h-44 overflow-auto px-4 py-3 font-mono text-[11px] leading-relaxed [&_pre]:m-0 [&_pre]:whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: html.html }} />
        ) : (
          <pre className="max-h-44 overflow-auto px-4 py-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
            <code>{code}</code>
          </pre>
        )}
      </div>
    </aside>
  );
}
