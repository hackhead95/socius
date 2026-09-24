// Helpers for writing equivalent SPSS syntax in the output log.

import type { MissingSpec, ValueLabel, Variable } from '../../core/types';

/** SPSS string literal: single quotes, embedded quotes doubled. */
export function q(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

/** A value as it appears in syntax: numbers bare, strings quoted. */
export function sv(v: number | string): string {
  if (typeof v === 'string') return q(v);
  if (Number.isNaN(v)) return 'SYSMIS';
  if (v === -Infinity) return 'LOWEST';
  if (v === Infinity) return 'HIGHEST';
  return String(v);
}

export function valueLabelsSyntax(name: string, labels: ValueLabel[]): string {
  if (!labels.length) return '';
  const body = labels.map((l) => `  ${sv(l.value)} ${q(l.label)}`).join('\n');
  return `VALUE LABELS ${name}\n${body}.`;
}

export function variableLabelSyntax(name: string, label: string): string {
  return label ? `VARIABLE LABELS ${name} ${q(label)}.` : '';
}

export function missingSyntax(name: string, m: MissingSpec): string {
  const parts: string[] = [];
  if (m.range) parts.push(`${m.range.lo === -Infinity ? 'LO' : m.range.lo} THRU ${m.range.hi === Infinity ? 'HI' : m.range.hi}`);
  for (const d of m.discrete) parts.push(sv(d));
  return `MISSING VALUES ${name} (${parts.join(', ')}).`;
}

export function formatsSyntax(v: Variable): string {
  return `FORMATS ${v.name} (${v.format}).`;
}

/** Join non-empty syntax lines. */
export function lines(...ls: Array<string | false | null | undefined>): string {
  return ls.filter((l): l is string => !!l).join('\n');
}

/** Variable list with SPSS line wrapping. */
export function varList(names: string[]): string {
  const out: string[] = [];
  let line = '';
  for (const n of names) {
    if (line.length + n.length > 70) {
      out.push(line.trimEnd());
      line = '  ';
    }
    line += n + ' ';
  }
  out.push(line.trimEnd());
  return out.join('\n');
}
