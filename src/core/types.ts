// Core data model. Mirrors the SPSS dictionary closely so .sav files round-trip without loss.
//
// Storage rules (every module relies on these):
// - Numeric columns are Float64Array. NaN means SYSTEM-missing (SPSS "sysmis", shown as ".").
// - String columns are string[]. '' is an empty string (never system-missing in SPSS semantics).
// - USER-missing values stay in the column as real values; `Variable.missing` says which values
//   are treated as missing. Use helpers in core/data.ts (isMissingValue etc.) instead of
//   re-implementing the rules.
// - Columns are keyed by Variable.id (stable), not Variable.name (user-editable).
// - Dates/times are numeric: seconds since 1582-10-14 00:00:00 (SPSS epoch). The `format`
//   field (e.g. "DATE11", "DATETIME20") says how to display them.

export type VarType = 'numeric' | 'string';
export type MeasureLevel = 'nominal' | 'ordinal' | 'scale';
export type VarRole = 'input' | 'target' | 'both' | 'none' | 'partition' | 'split';
export type Alignment = 'left' | 'right' | 'center';

export interface ValueLabel {
  /** number for numeric variables, string for string variables */
  value: number | string;
  label: string;
}

export interface MissingSpec {
  /** Up to 3 discrete user-missing values (SPSS limit; we allow more but .sav export keeps 3). */
  discrete: Array<number | string>;
  /** Optional inclusive range (numeric only). lo may be -Infinity ("LO"), hi may be Infinity ("HI"). */
  range?: { lo: number; hi: number };
}

export interface Variable {
  id: string;
  /** SPSS-valid name: starts with letter/@/#/$, letters/digits/._$#@, max 64 bytes, unique case-insensitively. */
  name: string;
  /** Variable label (the question wording in surveys). May be ''. */
  label: string;
  type: VarType;
  /** Display width in characters. For strings this is also the storage width in bytes (A-width). */
  width: number;
  /** Decimal places shown for numeric variables. */
  decimals: number;
  /** SPSS print/write format, e.g. "F8.2", "A40", "DATE11", "DOLLAR10.2". */
  format: string;
  measure: MeasureLevel;
  role: VarRole;
  align: Alignment;
  /** Column width in the Data View grid (SPSS "Columns"). */
  columns: number;
  valueLabels: ValueLabel[];
  missing: MissingSpec;
  /** Free-form attributes (SPSS custom variable attributes); optional. */
  attributes?: Record<string, string>;
}

export type Column = Float64Array | string[];

export interface Dataset {
  id: string;
  /** Display name (usually the file name without extension). */
  name: string;
  /** SPSS file label (up to 64 chars). */
  fileLabel: string;
  variables: Variable[];
  /** Keyed by Variable.id. Every column has exactly nCases entries. */
  columns: Record<string, Column>;
  nCases: number;
  /** Variable id used as case weight (numeric, non-negative), or null. Like SPSS WEIGHT BY. */
  weightVarId: string | null;
  /** Variable id of a numeric filter variable; cases where it is 0 or missing are excluded. Like SPSS FILTER BY. */
  filterVarId: string | null;
  /** SPSS document lines (DOCUMENT command). */
  documents: string[];
  /** Where it came from, for display. */
  source?: { kind: 'sav' | 'zsav' | 'csv' | 'xlsx' | 'sample' | 'new' | 'project'; fileName?: string; encoding?: string };
  /** Increment on every mutation so React selectors can cheaply detect change. */
  version: number;
}

let idCounter = 0;
/** Short unique id (not cryptographic). */
export function newId(prefix = 'id'): string {
  idCounter = (idCounter + 1) % 1_000_000;
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}${idCounter.toString(36)}`;
}

/** Build a Variable with sensible SPSS defaults. */
export function makeVariable(partial: Partial<Variable> & { name: string; type?: VarType }): Variable {
  const type = partial.type ?? 'numeric';
  const width = partial.width ?? (type === 'string' ? 8 : 8);
  const decimals = partial.decimals ?? (type === 'string' ? 0 : 2);
  return {
    id: partial.id ?? newId('v'),
    name: partial.name,
    label: partial.label ?? '',
    type,
    width,
    decimals,
    format: partial.format ?? (type === 'string' ? `A${width}` : `F${width}.${decimals}`),
    measure: partial.measure ?? (type === 'string' ? 'nominal' : 'scale'),
    role: partial.role ?? 'input',
    align: partial.align ?? (type === 'string' ? 'left' : 'right'),
    columns: partial.columns ?? Math.max(8, Math.min(20, width)),
    valueLabels: partial.valueLabels ?? [],
    missing: partial.missing ?? { discrete: [] },
    attributes: partial.attributes,
  };
}

export function emptyColumn(type: VarType, n: number): Column {
  if (type === 'numeric') {
    const a = new Float64Array(n);
    a.fill(NaN);
    return a;
  }
  return new Array<string>(n).fill('');
}

export function makeDataset(partial: Partial<Dataset> & { name: string }): Dataset {
  return {
    id: partial.id ?? newId('ds'),
    name: partial.name,
    fileLabel: partial.fileLabel ?? '',
    variables: partial.variables ?? [],
    columns: partial.columns ?? {},
    nCases: partial.nCases ?? 0,
    weightVarId: partial.weightVarId ?? null,
    filterVarId: partial.filterVarId ?? null,
    documents: partial.documents ?? [],
    source: partial.source,
    version: partial.version ?? 0,
  };
}
