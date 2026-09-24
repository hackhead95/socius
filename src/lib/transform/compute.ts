// COMPUTE / IF: create or overwrite a variable from an expression.

import type { Column, Dataset, Variable } from '../../core/types';
import { formatRawValue, getVariable, validateVarName } from '../../core/data';
import { compileExpression, type CompiledExpr } from './evaluate';
import { ExprError } from './expr';
import { addVariable, countSysmis, fmtN, newNumericVar, newStringVar, replaceVariable, suggestDecimals, type TransformResult } from './dsops';
import { lines, variableLabelSyntax } from './syntax';

export interface ComputeSpec {
  target: string;
  label?: string;
  /** For a NEW variable: force a type; default is the expression's type. */
  type?: 'numeric' | 'string';
  /** For a new string variable: width (default: longest result, at least 8). */
  width?: number;
  expression: string;
  /** Optional IF condition: only cases where it is true are computed. */
  condition?: string;
}

export class ComputeError extends Error {
  field: 'target' | 'expression' | 'condition';
  pos?: number;
  end?: number;
  constructor(field: ComputeError['field'], message: string, pos?: number, end?: number) {
    super(message);
    this.field = field;
    this.pos = pos;
    this.end = end;
  }
}

interface Prepared {
  expr: CompiledExpr;
  cond: CompiledExpr | null;
  existing: Variable | undefined;
  outType: 'numeric' | 'string';
}

function prepare(ds: Dataset, spec: ComputeSpec): Prepared {
  const target = spec.target.trim();
  const existing = getVariable(ds, target);
  if (!existing || existing.name.toLowerCase() !== target.toLowerCase()) {
    const err = validateVarName(ds, target);
    if (err) throw new ComputeError('target', err);
  }
  let expr: CompiledExpr;
  try {
    expr = compileExpression(ds, spec.expression);
  } catch (e) {
    if (e instanceof ExprError) throw new ComputeError('expression', e.message, e.pos, e.end);
    throw e;
  }
  let cond: CompiledExpr | null = null;
  if (spec.condition && spec.condition.trim()) {
    try {
      cond = compileExpression(ds, spec.condition);
    } catch (e) {
      if (e instanceof ExprError) throw new ComputeError('condition', e.message, e.pos, e.end);
      throw e;
    }
    if (cond.type !== 'num') throw new ComputeError('condition', 'The condition must be a comparison such as age >= 18, not text.', 0, spec.condition.length);
  }
  const outType: 'numeric' | 'string' = existing ? existing.type : spec.type ?? (expr.type === 'str' ? 'string' : 'numeric');
  if (outType === 'numeric' && expr.type === 'str')
    throw new ComputeError('expression', existing
      ? `${existing.name} is a numeric variable, but the expression gives text. Use NUMBER(text, F8.0) to convert.`
      : 'The expression gives text, but the target type is numeric. Use NUMBER(text, F8.0) to convert, or set the type to String.', 0, spec.expression.length);
  if (outType === 'string' && expr.type === 'num')
    throw new ComputeError('expression', existing
      ? `${existing.name} is a string variable, but the expression gives a number. Use STRING(x, F8.2) to convert.`
      : 'The expression gives a number, but the target type is String. Use STRING(x, F8.2) to convert, or set the type to Numeric.', 0, spec.expression.length);
  return { expr, cond, existing, outType };
}

function condTrue(cond: CompiledExpr | null, i: number): boolean {
  if (!cond) return true;
  const x = cond.evaluate(i) as number;
  return !Number.isNaN(x) && x !== 0;
}

export interface ComputePreviewRow {
  row: number;
  /** Current value (formatted) if the variable exists. */
  before: string | null;
  after: string;
  applied: boolean;
}

/** Preview the result for the first `n` cases. Throws ComputeError. */
export function previewCompute(ds: Dataset, spec: ComputeSpec, n = 8): ComputePreviewRow[] {
  const { expr, cond, existing, outType } = prepare(ds, spec);
  const out: ComputePreviewRow[] = [];
  const fakeVar = existing ?? (outType === 'string' ? newStringVar('x', 255) : newNumericVar('x', { decimals: 2 }));
  for (let i = 0; i < Math.min(n, ds.nCases); i++) {
    const applied = condTrue(cond, i);
    const before = existing ? ds.columns[existing.id][i] : null;
    const val = applied ? expr.evaluate(i) : before ?? (outType === 'string' ? '' : NaN);
    const fmt = (x: number | string) => (typeof x === 'number' && !Number.isNaN(x) && !existing ? String(+x.toFixed(6)) : formatRawValue(fakeVar, x));
    out.push({ row: i, before: before === null ? null : formatRawValue(fakeVar, before), after: fmt(val), applied });
  }
  return out;
}

export function computeVariable(ds: Dataset, spec: ComputeSpec): TransformResult {
  const { expr, cond, existing, outType } = prepare(ds, spec);
  const n = ds.nCases;
  const target = existing?.name ?? spec.target.trim();
  let col: Column;
  let applied = 0;
  if (outType === 'numeric') {
    const old = existing ? (ds.columns[existing.id] as Float64Array) : null;
    const c = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      if (condTrue(cond, i)) {
        c[i] = expr.evaluate(i) as number;
        applied++;
      } else c[i] = old ? old[i] : NaN;
    }
    col = c;
  } else {
    const old = existing ? (ds.columns[existing.id] as string[]) : null;
    const width = existing?.width ?? 32767;
    const c = new Array<string>(n);
    for (let i = 0; i < n; i++) {
      if (condTrue(cond, i)) {
        c[i] = (expr.evaluate(i) as string).slice(0, width);
        applied++;
      } else c[i] = old ? old[i] : '';
    }
    col = c;
  }

  let next: Dataset;
  let stringDecl = '';
  if (existing) {
    const v: Variable = { ...existing, label: spec.label !== undefined && spec.label !== '' ? spec.label : existing.label };
    next = replaceVariable(ds, v, col);
  } else if (outType === 'numeric') {
    const dec = suggestDecimals(col as Float64Array);
    next = addVariable(ds, newNumericVar(target, { label: spec.label ?? '', decimals: dec }), col);
  } else {
    let maxLen = 1;
    for (const s of col as string[]) if (s.length > maxLen) maxLen = s.length;
    const width = spec.width && spec.width > 0 ? spec.width : Math.max(8, maxLen, Math.min(expr.widthHint, 255));
    if (spec.width) col = (col as string[]).map((s) => s.slice(0, width));
    next = addVariable(ds, newStringVar(target, width, { label: spec.label ?? '' }), col);
    stringDecl = `STRING ${target} (A${width}).`;
  }

  const exprText = spec.expression.trim().replace(/\.\s*$/, '');
  const syntax = lines(
    stringDecl,
    cond ? `IF (${spec.condition!.trim()}) ${target}=${exprText}.` : `COMPUTE ${target}=${exprText}.`,
    spec.label ? variableLabelSyntax(target, spec.label) : '',
    'EXECUTE.',
  );
  const miss = countSysmis(col);
  const summary =
    `${existing ? 'Updated' : 'Created'} ${target}` +
    (cond ? ` for ${fmtN(applied)} of ${fmtN(n)} cases where ${spec.condition!.trim()}` : ` for ${fmtN(n)} cases`) +
    (outType === 'numeric' && miss ? ` (${fmtN(miss)} system-missing).` : '.');
  return { dataset: next, title: 'Compute Variable', syntax, summary, warnings: [] };
}

