// Codebook: one row per variable with the dictionary information researchers document.

import { isDateFormat } from '../../core/data';
import type { Dataset, Variable } from '../../core/types';

function typeName(v: Variable): string {
  if (v.type === 'string') return 'String';
  const f = v.format.toUpperCase();
  if (isDateFormat(f)) return 'Date';
  if (f.startsWith('DOLLAR')) return 'Dollar';
  if (f.startsWith('COMMA')) return 'Comma';
  if (f.startsWith('DOT')) return 'Dot';
  if (f.startsWith('PCT')) return 'Percent';
  if (/^E\d/.test(f)) return 'Scientific notation';
  if (/^CC[A-E]/.test(f)) return 'Custom currency';
  if (/^N\d/.test(f)) return 'Restricted numeric';
  return 'Numeric';
}

function valueText(x: number | string): string {
  if (typeof x === 'string') return x.replace(/ +$/, '');
  if (x === Infinity) return 'HI';
  if (x === -Infinity) return 'LO';
  return String(x);
}

export function missingText(v: Variable): string {
  const parts: string[] = [];
  if (v.missing.range) {
    const { lo, hi } = v.missing.range;
    parts.push(`${lo === -Infinity ? 'LO' : valueText(lo)} THRU ${hi === Infinity ? 'HI' : valueText(hi)}`);
  }
  for (const d of v.missing.discrete) parts.push(valueText(d));
  return parts.join(', ');
}

export function valueLabelsText(v: Variable): string {
  return v.valueLabels.map((l) => `${valueText(l.value)} = ${l.label}`).join('; ');
}

const MEASURE_NAMES = { nominal: 'Nominal', ordinal: 'Ordinal', scale: 'Scale' } as const;

export function codebookRows(ds: Dataset): Array<Record<string, string>> {
  return ds.variables.map((v, i) => ({
    Position: String(i + 1),
    Name: v.name,
    Label: v.label,
    Type: typeName(v),
    Width: String(v.width),
    Decimals: String(v.decimals),
    Measure: MEASURE_NAMES[v.measure] ?? v.measure,
    'Value labels': valueLabelsText(v),
    'Missing values': missingText(v),
    Format: v.format,
  }));
}
