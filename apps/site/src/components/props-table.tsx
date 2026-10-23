import { useMemo } from 'react';
import type { z } from 'zod';
import { fieldsOf } from '@/lib/schema-fields';

const show = (value: unknown) => (value === undefined ? '—' : JSON.stringify(value));

/** A schema's fields as a table: name, type, default, description. Generated, so it never drifts from the code. */
export function PropsTable({ schema, caption }: { schema: z.ZodType; caption: string }) {
  const fields = useMemo(() => fieldsOf(schema), [schema]);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-medium">Name</th>
            <th scope="col" className="px-4 py-2.5 font-medium">Type</th>
            <th scope="col" className="px-4 py-2.5 font-medium">Default</th>
            <th scope="col" className="px-4 py-2.5 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => (
            <tr key={field.name} className="border-t border-border align-top">
              <th scope="row" className="px-4 py-2.5 font-mono text-xs font-medium whitespace-nowrap" style={{ paddingLeft: 16 + field.depth * 16 }}>
                {field.name.split('.').pop()}
                {field.required && field.default === undefined && <span className="text-[color:var(--brand)]" title="Required"> *</span>}
              </th>
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{field.type}</td>
              <td className="max-w-[16rem] px-4 py-2.5 font-mono text-xs break-words text-muted-foreground">{show(field.default)}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{field.description ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
