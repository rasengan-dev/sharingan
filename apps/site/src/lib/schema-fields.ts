import { z } from 'zod';

/** One field of a hero's schema, flattened for tables and controls. */
export type Field = {
  /** Dotted path: `card.name`, `sections[].label`. */
  name: string;
  depth: number;
  type: string;
  kind: 'string' | 'number' | 'integer' | 'boolean' | 'enum' | 'strings' | 'object' | 'array' | 'other';
  required: boolean;
  default?: unknown;
  description?: string;
  options?: string[];
  min?: number;
  max?: number;
};

type JsonSchema = {
  type?: string;
  enum?: string[];
  default?: unknown;
  description?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  items?: JsonSchema;
  properties?: Record<string, JsonSchema>;
  required?: string[];
};

const range = (min?: number, max?: number) => (min !== undefined && max !== undefined ? `${min}–${max}` : max !== undefined ? `≤ ${max}` : min !== undefined ? `≥ ${min}` : '');

function describe(schema: JsonSchema): Pick<Field, 'type' | 'kind' | 'options' | 'min' | 'max'> {
  if (schema.enum) return { kind: 'enum', type: schema.enum.map((value) => `"${value}"`).join(' | '), options: schema.enum };
  switch (schema.type) {
    case 'boolean':
      return { kind: 'boolean', type: 'boolean' };
    case 'number':
    case 'integer': {
      const span = range(schema.minimum, schema.maximum);
      return { kind: schema.type, type: `${schema.type === 'integer' ? 'integer' : 'number'}${span ? ` (${span})` : ''}`, min: schema.minimum, max: schema.maximum };
    }
    case 'string': {
      const span = range(schema.minLength, schema.maxLength);
      return { kind: 'string', type: `string${span ? ` (${span} chars)` : ''}` };
    }
    case 'array': {
      const span = range(schema.minItems, schema.maxItems);
      if (schema.items?.type === 'string' && !schema.items.enum) return { kind: 'strings', type: `string[]${span ? ` (${span})` : ''}`, min: schema.minItems, max: schema.maxItems };
      return { kind: 'array', type: `${schema.items?.type === 'object' ? 'object' : (schema.items?.type ?? 'unknown')}[]${span ? ` (${span})` : ''}` };
    }
    case 'object':
      return { kind: 'object', type: 'object' };
    default:
      return { kind: 'other', type: schema.type ?? 'unknown' };
  }
}

function walk(schema: JsonSchema, prefix: string, depth: number, out: Field[]) {
  const required = new Set(schema.required ?? []);
  for (const [key, child] of Object.entries(schema.properties ?? {})) {
    const name = prefix ? `${prefix}.${key}` : key;
    out.push({ name, depth, required: required.has(key), default: child.default, description: child.description, ...describe(child) });
    if (child.type === 'object') walk(child, name, depth + 1, out);
    if (child.type === 'array' && child.items?.type === 'object') walk(child.items, `${name}[]`, depth + 1, out);
  }
}

/** Every field of a schema, nested ones included, in declaration order. */
export function fieldsOf(schema: z.ZodType): Field[] {
  const json = z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' }) as JsonSchema;
  const out: Field[] = [];
  walk(json, '', 0, out);
  return out;
}
