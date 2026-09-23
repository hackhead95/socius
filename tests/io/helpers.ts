// Shared helpers for the IO tests: compare a Socius Dataset with pyreadstat's reading of a file
// (the JSON written by scripts/fixtures/dump_sav.py), and run the Python oracle when available.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { expect } from 'vitest';
import type { Dataset, Variable } from '../../src/core/types';

export const PYTHON = '/opt/oracle/bin/python';
/** The Python oracle is optional (absent in CI). SOCIUS_NO_ORACLE=1 simulates its absence. */
export const HAS_ORACLE = existsSync(PYTHON) && !process.env.SOCIUS_NO_ORACLE;
export const ROOT = resolve(__dirname, '..', '..');
export const FIXTURES = join(ROOT, 'tests', 'io', 'fixtures');
const DUMP = join(ROOT, 'scripts', 'fixtures', 'dump_sav.py');

export interface OracleVar {
  name: string;
  label: string;
  format: string;
  type: 'double' | 'string';
  measure: 'nominal' | 'ordinal' | 'scale' | 'unknown';
  display_width: number;
  alignment: string;
  storage_width: number;
  value_labels: Array<[number | string, string]>;
  missing: Array<{ lo: number | string; hi: number | string }>;
}

export interface OracleDump {
  file_label: string;
  notes: string[];
  number_rows: number;
  file_encoding: string;
  variables: OracleVar[];
  data: Record<string, Array<number | string | null>>;
  weight_var?: string;
}

let tmp: string | null = null;
export function tempPath(name: string): string {
  if (!tmp) tmp = mkdtempSync(join(tmpdir(), 'socius-io-'));
  return join(tmp, name);
}

/** Read a .sav file with pyreadstat (through dump_sav.py). */
export function pyreadstatRead(bytes: Uint8Array, name = 'out.sav'): OracleDump {
  const p = tempPath(`${Math.random().toString(36).slice(2)}_${name}`);
  writeFileSync(p, bytes);
  const out = execFileSync(PYTHON, [DUMP, p], { encoding: 'utf-8', maxBuffer: 256 * 1024 * 1024 });
  return JSON.parse(out) as OracleDump;
}

export function num(x: number | string | null): number {
  if (x === null) return NaN;
  if (x === 'Infinity') return Infinity;
  if (x === '-Infinity') return -Infinity;
  return x as number;
}

/** SPSS LOWEST/HIGHEST (the extreme finite doubles) mean LO/HI in missing-value ranges. */
function bound(x: number | string | null): number {
  const n = num(x);
  if (n <= -1.797693134862315e308) return -Infinity;
  if (n >= 1.797693134862315e308) return Infinity;
  return n;
}

function missingPairs(v: Variable): string[] {
  const out: string[] = [];
  if (v.missing.range) out.push(`${v.missing.range.lo}|${v.missing.range.hi}`);
  for (const d of v.missing.discrete) out.push(`${d}|${d}`);
  return out.sort();
}

function oracleMissingPairs(ov: OracleVar): string[] {
  return ov.missing
    .map((m) => (ov.type === 'string' ? `${m.lo}|${m.hi}` : `${bound(m.lo)}|${bound(m.hi)}`))
    .sort();
}

function labelPairs(v: Variable): string[] {
  return v.valueLabels.map((l) => `${l.value}=>${l.label}`).sort();
}

function oracleLabelPairs(ov: OracleVar): string[] {
  return ov.value_labels.map(([k, l]) => `${ov.type === 'string' ? k : num(k)}=>${l}`).sort();
}

export interface CompareOptions {
  /** Compare measure levels (skip when the writer under test is pyreadstat's defaults). */
  measure?: boolean;
  /** Compare the display widths (SPSS "Columns"). */
  columns?: boolean;
}

/** Assert that `ds` holds exactly what pyreadstat read (`o`). */
export function expectMatchesOracle(ds: Dataset, o: OracleDump, opts: CompareOptions = {}): void {
  expect(ds.nCases).toBe(o.number_rows);
  expect(ds.variables.map((v) => v.name)).toEqual(o.variables.map((v) => v.name));
  expect(ds.fileLabel).toBe(o.file_label);
  expect(ds.documents).toEqual(o.notes);
  o.variables.forEach((ov, k) => {
    const v = ds.variables[k];
    const ctx = `variable ${ov.name}`;
    expect(v.label, ctx).toBe(ov.label);
    expect(v.type, ctx).toBe(ov.type === 'double' ? 'numeric' : 'string');
    if (v.type === 'numeric') {
      expect(v.format, ctx).toBe(ov.format);
    } else {
      expect(v.format, ctx).toBe(`A${v.width}`);
      // readstat reports storage rounded up to 8 bytes for short strings.
      if (v.width <= 255) expect(Math.ceil(v.width / 8) * 8, ctx).toBe(ov.storage_width);
      else expect(v.width, ctx).toBe(ov.storage_width);
    }
    if (opts.measure !== false) {
      if (ov.measure === 'unknown') {
        expect(v.measure, ctx).toBe(v.type === 'string' || v.valueLabels.length ? 'nominal' : 'scale');
      } else expect(v.measure, ctx).toBe(ov.measure);
    }
    if (opts.columns) expect(v.columns, ctx).toBe(ov.display_width);
    expect(labelPairs(v), ctx).toEqual(oracleLabelPairs(ov));
    expect(missingPairs(v), ctx).toEqual(oracleMissingPairs(ov));
    const col = ds.columns[v.id];
    const exp = o.data[ov.name];
    expect(col.length, ctx).toBe(exp.length);
    if (v.type === 'numeric') {
      const actual = Array.from(col as Float64Array, (x) => (Number.isNaN(x) ? null : x));
      expect(actual, ctx).toEqual(exp);
    } else {
      // SPSS pads strings with spaces, so trailing spaces never survive a .sav file.
      expect((col as string[]).map((s) => s.replace(/ +$/, '')), ctx).toEqual(exp);
    }
  });
}

// ---- IBM SPSS I/O library readings (scripts/fixtures/spssio_dump.py)

export interface SpssioVar {
  name: string;
  width: number;
  label: string;
  format: string;
  measure: string;
  columns: number;
  alignment: string;
  role: string;
  attributes: Record<string, string>;
  missing: { values?: Array<number | string>; lower?: number | string; upper?: number | string; value?: number };
  value_labels: Array<[number | string, string]>;
}
export interface SpssioDump {
  file_label: string;
  weight_var: string | null;
  variables: SpssioVar[];
  rows: Array<Array<number | string | null>>;
}

const spssBound = (x: number | string | undefined) => {
  const n = typeof x === 'string' ? Number(x) : (x as number);
  if (n <= -1.797693134862315e308) return -Infinity;
  if (n >= 1.797693134862315e308) return Infinity;
  return n;
};

/** SPSS shows F4.0 as "F4"; Socius always writes the decimals for plain numeric formats. */
const normFormat = (f: string) => f.replace(/^(F|COMMA|DOLLAR|PCT|DOT|E)(\d+)$/, '$1$2.0');

export function expectSpssioMatches(ds: Dataset, o: SpssioDump) {
  expect(o.file_label).toBe(ds.fileLabel);
  expect(o.weight_var).toBe(ds.variables.find((v) => v.id === ds.weightVarId)?.name ?? null);
  expect(o.variables.map((v) => v.name)).toEqual(ds.variables.map((v) => v.name));
  expect(o.rows.length).toBe(ds.nCases);
  ds.variables.forEach((v: Variable, k) => {
    const ov = o.variables[k];
    const ctx = `variable ${v.name}`;
    expect(ov.label, ctx).toBe(v.label);
    expect(ov.width, ctx).toBe(v.type === 'string' ? v.width : 0);
    expect(normFormat(ov.format), ctx).toBe(v.format);
    expect(ov.measure === 'ratio' ? 'scale' : ov.measure, ctx).toBe(v.measure);
    expect(ov.columns, ctx).toBe(v.columns);
    expect(ov.alignment, ctx).toBe(v.align);
    expect(ov.role, ctx).toBe(v.role);
    expect(ov.attributes, ctx).toEqual(v.attributes ?? {});
    const labels = ov.value_labels.map(([val, l]) => `${val}=>${l}`).sort();
    expect(labels, ctx).toEqual(v.valueLabels.map((l) => `${l.value}=>${l.label}`).sort());
    if (v.type === 'numeric') {
      const m = ov.missing;
      if (v.missing.range) {
        expect([spssBound(m.lower), spssBound(m.upper)], ctx).toEqual([v.missing.range.lo, v.missing.range.hi]);
        expect(m.value === undefined ? [] : [m.value], ctx).toEqual(v.missing.discrete);
      } else {
        expect(m.values ?? [], ctx).toEqual(v.missing.discrete);
      }
    } else {
      expect(ov.missing.values ?? [], ctx).toEqual(v.missing.discrete);
    }
    const col = ds.columns[v.id];
    const got = o.rows.map((r) => r[k]);
    if (col instanceof Float64Array) expect(got, ctx).toEqual(Array.from(col, (x) => (Number.isNaN(x) ? null : x)));
    else expect(got, ctx).toEqual(col.map((s) => s.replace(/ +$/, '')));
  });
}

