// Check and gently coerce tool arguments against the tool's JSON schema before running it, so a
// model's small slips (a number sent as text, one name instead of a list) do not become errors and
// real mistakes come back as clear messages the model can fix.
import type { JsonSchema } from '../../platform/ai-tools';

export interface ArgCheck {
  args: Record<string, unknown>;
  errors: string[];
}

function coerce(value: unknown, s: JsonSchema, path: string, errors: string[]): unknown {
  if (value === null || value === undefined) return value;
  switch (s.type) {
    case 'string':
      if (typeof value === 'number' || typeof value === 'boolean') value = String(value);
      if (typeof value !== 'string') {
        errors.push(`${path} should be text.`);
        return value;
      }
      if (s.enum && !s.enum.includes(value)) {
        const ci = s.enum.find((e) => e.toLowerCase() === (value as string).toLowerCase());
        if (ci) return ci;
        errors.push(`${path} must be one of: ${s.enum.join(', ')}.`);
      }
      return value;
    case 'number':
    case 'integer': {
      const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
      if (!Number.isFinite(n)) {
        errors.push(`${path} should be a number.`);
        return value;
      }
      return s.type === 'integer' ? Math.round(n) : n;
    }
    case 'boolean':
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string' && /^(true|false|yes|no|1|0)$/i.test(value.trim())) return /^(true|yes|1)$/i.test(value.trim());
      errors.push(`${path} should be true or false.`);
      return value;
    case 'array': {
      let arr: unknown[];
      if (Array.isArray(value)) arr = value;
      else if (typeof value === 'string') {
        const t = value.trim();
        if (t.startsWith('[')) {
          try {
            const parsed = JSON.parse(t);
            arr = Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            arr = t.split(/\s*,\s*/).filter(Boolean);
          }
        } else arr = s.items?.type === 'string' ? t.split(/\s*,\s*/).filter(Boolean) : [value];
      } else arr = [value];
      return s.items ? arr.map((x, i) => coerce(x, s.items!, `${path}[${i}]`, errors)) : arr;
    }
    case 'object': {
      let obj = value;
      if (typeof obj === 'string') {
        try {
          obj = JSON.parse(obj);
        } catch {
          /* reported below */
        }
      }
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        errors.push(`${path} should be an object.`);
        return value;
      }
      const out: Record<string, unknown> = { ...(obj as Record<string, unknown>) };
      for (const [k, sub] of Object.entries(s.properties ?? {})) if (k in out) out[k] = coerce(out[k], sub, `${path}.${k}`, errors);
      for (const r of s.required ?? []) if (out[r] === undefined || out[r] === null || out[r] === '') errors.push(`${path}.${r} is required.`);
      return out;
    }
  }
}

/** Validate and coerce arguments for a tool. Unknown extra arguments are kept (tools ignore them). */
export function checkArgs(schema: JsonSchema, raw: unknown): ArgCheck {
  const errors: string[] = [];
  const base = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const out = coerce(base, schema, 'args', errors) as Record<string, unknown>;
  return { args: out && typeof out === 'object' ? out : {}, errors: errors.map((e) => e.replace(/^args\./, '')) };
}
