// Focused tests for the data-management fuzz findings (docs/qa/FUZZ-FINDINGS.md: FZ-01, 02, 05, 12,
// 13, 19), the audits that went with them (argument spreads over data-sized lists, duplicate
// variable names), Copy variable properties as a logged transform, and undo labels.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  addVariables, aggregate, AggregateError, AGG_FUNCTIONS, BinError, binLabels, compileExpression, computeCutpoints, EXPR_LIMITS, ExprError,
  maxOf, minOf, previewBins, selectCasesTransform, STRING_AGG_FUNCTIONS, visualBin,
} from '../../src/lib/transform';
import { copyPropertiesTransform, missingCodeHints } from '../../src/lib/transform/properties';
import { nameVariablesFromHeader, writeTexts, type CellWrite } from '../../src/features/data/mutations';
import { applyTransform } from '../../src/features/transform/common';
import { useStore } from '../../src/core/store';
import { undoStep, redoStep } from '../../src/app/undo';
import { makeDataset, makeVariable } from '../../src/core/types';
import { col, ds, vid } from './helpers';

const names = (d: { variables: Array<{ name: string }> }) => d.variables.map((v) => v.name.toLowerCase());
const unique = (d: { variables: Array<{ name: string }> }) => new Set(names(d)).size === d.variables.length;

describe('FZ-01: no argument spreads over data-sized lists', () => {
  const N = 200_000;
  const bigDs = () => {
    const x = makeVariable({ name: 'x' });
    const g = makeVariable({ name: 'g', decimals: 0 });
    return makeDataset({
      name: 'big', variables: [x, g], nCases: N,
      columns: { [x.id]: Float64Array.from({ length: N }, (_, i) => (i * 7919) % 100_003 - 50), [g.id]: Float64Array.from({ length: N }, (_, i) => (i < N - 3 ? 1 : 2)) },
    });
  };
  it('Aggregate MIN/MAX over a group of 200,000 cases (one group, and with a break variable)', () => {
    const d = bigDs();
    const x = d.variables[0].id;
    const r = aggregate(d, { breakIds: [d.variables[1].id], items: [{ fn: 'min', sourceId: x, name: 'xmin' }, { fn: 'max', sourceId: x, name: 'xmax' }], output: 'new' });
    const nd = r.newDataset!;
    expect(nd.nCases).toBe(2);
    const src = d.columns[x] as Float64Array;
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < N - 3; i++) { lo = Math.min(lo, src[i]); hi = Math.max(hi, src[i]); }
    expect(col(nd, 'xmin')[0]).toBe(lo);
    expect(col(nd, 'xmax')[0]).toBe(hi);
  });
  it('minOf / maxOf take any number of values', () => {
    const big = Float64Array.from({ length: 300_000 }, (_, i) => i - 7);
    expect(minOf(big)).toBe(-7);
    expect(maxOf(new Set([3, 9, 1]))).toBe(9);
    expect(minOf([])).toBe(Infinity);
  });
  it('pasting 200,000 cells works (writeTexts)', () => {
    const d = ds([{ name: 'a', values: [1] }]);
    const writes: CellWrite[] = Array.from({ length: N }, (_, i) => ({ row: i, col: i % 2, text: i % 2 ? 'word' : String(i) }));
    const r = writeTexts(d, writes);
    expect(r.dataset.nCases).toBe(N);
    expect(r.addedVars).toBe(1);
  });
  it('Define properties hints over 200,000 distinct observed values', () => {
    const vals = Array.from({ length: N }, (_, i) => i + 0.5).concat([99]);
    expect(() => missingCodeHints('numeric', vals, [])).not.toThrow();
  });
});

describe('FZ-02 / FZ-13: Visual binning', () => {
  const d = ds([{ name: 'income', values: [10.5, 20.25, 30, -28.36, -11.52] }]);
  const v = d.variables[0];
  it('a first cutpoint at or above the largest value gives a clear BinError, never a TypeError', () => {
    for (const first of [30, 1000]) {
      expect(() => visualBin(d, { sourceId: v.id, name: 'b', method: { kind: 'widthFrom', first, width: 5 } })).toThrow(BinError);
      expect(() => previewBins(d, { sourceId: v.id, method: { kind: 'widthFrom', first, width: 5 } })).toThrow(/not below the largest value of income \(30\).*Choose a first cutpoint below 30/);
    }
    expect(() => computeCutpoints(d, v, { kind: 'widthFrom', first: NaN, width: 5 })).toThrow(/first cutpoint as a number/);
    expect(() => computeCutpoints(d, v, { kind: 'widthFrom', first: 0, width: -1 })).toThrow(/greater than zero/);
    expect(() => computeCutpoints(d, v, { kind: 'custom', cuts: [1, NaN] })).toThrow(BinError);
    expect(computeCutpoints(d, v, { kind: 'widthFrom', first: 29.9, width: 5 })).toEqual([29.9]);
  });
  it('binLabels never reads a missing cutpoint', () => {
    expect(binLabels([], 3.5, false)).toEqual(['3.5+']);
    expect(binLabels([], NaN, false)).toEqual(['All values']);
  });
  it('labels use "to" for every range, so negative numbers are unambiguous', () => {
    expect(binLabels([-20, -10], -30, true)).toEqual(['-30 to -20', '-19 to -10', '-9+']);
    expect(binLabels([-11.52], -28.36, false)).toEqual(['<= -11.52', '> -11.52']);
    expect(binLabels([-20.5, -11.52, 3], -28.36, false)).toEqual(['<= -20.5', '-20.5 to -11.52', '-11.52 to 3', '> 3']);
    expect(binLabels([-20.5, -11.52], -28.36, false, false)).toEqual(['< -20.5', '-20.5 to -11.52', '>= -11.52']);
    for (const l of binLabels([-20, -10, 0, 10], -30, true)) expect(l).not.toMatch(/\d-{1,2}\d/);
  });
  it('cutpoints that lie very close together still get different labels', () => {
    const labels = binLabels([-20.0000001, -20.0000002, -20.0000003].sort((a, b) => a - b), -30, false, false);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe('FZ-05: new variables never duplicate a name', () => {
  it('Select Cases uses the next free filter name and writes it in the syntax', () => {
    const d = ds([
      { name: 'filter_$', values: ['a', 'b', 'c'] },
      { name: 'filter_$1', values: [1, 2, 3] },
      { name: 'age', values: [20, 40, 60] },
    ]);
    const r = selectCasesTransform(d, { kind: 'if', condition: 'age > 30' }, 'filter');
    expect(unique(r.dataset)).toBe(true);
    const fv = r.dataset.variables.find((x) => x.id === r.dataset.filterVarId)!;
    expect(fv.name).toBe('filter_$_1');
    expect(col(r.dataset, 'filter_$_1')).toEqual([0, 1, 1]);
    expect(r.syntax).toContain('COMPUTE filter_$_1=(age > 30).');
    expect(r.syntax).toContain('FILTER BY filter_$_1.');
    expect(r.syntax).not.toMatch(/filter_\$[ =.]/);
    // A numeric filter_$ is reused, as in SPSS.
    const d2 = ds([{ name: 'filter_$', values: [5, 5, 5] }, { name: 'age', values: [20, 40, 60] }]);
    const r2 = selectCasesTransform(d2, { kind: 'if', condition: 'age > 30' }, 'filter');
    expect(names(r2.dataset)).toEqual(['filter_$', 'age']);
    expect(r2.syntax).toContain('FILTER BY filter_$.');
  });
  it('Merge files: add variables renames names in the second file that differ only in capitals', () => {
    const a = ds([{ name: 'id', values: [1, 2] }]);
    const b = ds([{ name: 'AGE', values: [30, 40] }, { name: 'age', values: [31, 41] }]);
    const r = addVariables(a, b, { mode: 'order', otherName: 'b.sav' });
    expect(names(r.dataset)).toEqual(['id', 'age', 'age_1']);
    expect(r.warnings.join(' ')).toMatch(/differ only in capitals.*age as age_1/);
  });
  it('pasted headings never repeat the name of a variable further right', () => {
    const d = ds([{ name: 'VAR00001', values: [1] }, { name: 'VAR00002', values: [2] }, { name: 'income', values: [3] }]);
    const r = nameVariablesFromHeader(d, 0, ['income', 'age']);
    expect(unique(r)).toBe(true);
    expect(names(r)).toEqual(['income_1', 'age', 'income']);
  });
});

describe('FZ-12: very long or deeply nested expressions', () => {
  const d = ds([{ name: 'x', values: [1, 2] }]);
  const err = (src: string) => {
    try {
      compileExpression(d, src).evaluate(0);
      return null;
    } catch (e) {
      return e;
    }
  };
  it('too many nested parentheses, calls or signs give an ExprError that says what to do', () => {
    for (const src of ['('.repeat(2000) + '1' + ')'.repeat(2000), 'ABS('.repeat(500) + 'x' + ')'.repeat(500), '-'.repeat(20_000) + '1', 'NOT '.repeat(500) + 'x > 1']) {
      const e = err(src) as ExprError;
      expect(e).toBeInstanceOf(ExprError);
      expect(e.message).toMatch(/nested too deeply .*split the calculation into several Compute steps/);
      expect(e.pos).toBeGreaterThanOrEqual(0);
      expect(e.end).toBeLessThanOrEqual(src.length + 1);
    }
  });
  it('too long a chain of operators gives an ExprError suggesting SUM(a TO b)', () => {
    const e = err(Array(5000).fill('x').join(' + ')) as ExprError;
    expect(e).toBeInstanceOf(ExprError);
    expect(e.message).toMatch(/too long to calculate in one step.*SUM\(q1 TO q500\)/);
    expect(err('1+'.repeat(60_000) + '1')).toBeInstanceOf(ExprError);
  });
  it('expressions up to the limits still work', () => {
    expect(compileExpression(d, '('.repeat(EXPR_LIMITS.nesting - 1) + 'x' + ')'.repeat(EXPR_LIMITS.nesting - 1)).evaluate(1)).toBe(2);
    expect(compileExpression(d, Array(EXPR_LIMITS.depth).fill('x').join(' + ')).evaluate(1)).toBe(2 * EXPR_LIMITS.depth);
    expect(compileExpression(d, Array(EXPR_LIMITS.depth - 1).fill('x > 0').join(' AND ')).evaluate(0)).toBe(1);
  });
});

describe('FZ-19: Aggregate functions for string variables', () => {
  const d = ds([
    { name: 'g', values: [1, 1, 1, 2, 2] },
    { name: 'region', values: ['South', 'North', '', 'East', 'DK'], opts: { type: 'string', missing: { discrete: ['DK'] } } },
    { name: 'w', values: [1, 2, 3, 1, 1] },
  ]);
  it('the message for an unsupported function lists only functions that work', () => {
    let msg = '';
    try {
      aggregate(d, { breakIds: [], items: [{ fn: 'sd', sourceId: vid(d, 'region'), name: 'r_sd' }], output: 'add' });
    } catch (e) {
      expect(e).toBeInstanceOf(AggregateError);
      msg = (e as Error).message;
    }
    expect(msg).toMatch(/region is a string \(text\) variable, so its standard deviation cannot be computed\. For text, use First value, Last value, Minimum, Maximum, Number of valid values or Number of missing values\./);
    for (const f of AGG_FUNCTIONS) {
      const works = (() => {
        try {
          aggregate(d, { breakIds: [], items: [{ fn: f.id, sourceId: f.id === 'n' || f.id === 'nu' ? undefined : vid(d, 'region'), name: `r_${f.id}` }], output: 'add' });
          return true;
        } catch {
          return false;
        }
      })();
      if (msg.includes(f.label)) expect(works, f.label).toBe(true);
      expect(works, f.id).toBe(STRING_AGG_FUNCTIONS.includes(f.id) || f.id === 'n' || f.id === 'nu');
    }
  });
  it('MIN, MAX, FIRST, LAST, N and NMISS of a string variable per group (weighted, like SPSS)', () => {
    const r = aggregate({ ...d, weightVarId: vid(d, 'w') }, {
      breakIds: [vid(d, 'g')],
      items: (['min', 'max', 'first', 'last', 'nvalid', 'nmiss'] as const).map((fn) => ({ fn, sourceId: vid(d, 'region'), name: `r_${fn}` })),
      output: 'new',
    });
    const nd = r.newDataset!;
    // Group 1: South, North, '' (a blank string is a valid value in SPSS). Group 2: East, DK (user-missing).
    expect(col(nd, 'r_min')).toEqual(['', 'East']);
    expect(col(nd, 'r_max')).toEqual(['South', 'East']);
    expect(col(nd, 'r_first')).toEqual(['South', 'East']);
    expect(col(nd, 'r_last')).toEqual(['', 'East']);
    expect(col(nd, 'r_nvalid')).toEqual([6, 1]);
    expect(col(nd, 'r_nmiss')).toEqual([0, 1]);
    expect(nd.variables.find((v) => v.name === 'r_nmiss')!.type).toBe('numeric');
    expect(r.syntax).toContain('/r_nvalid=N(region)');
    expect(r.syntax).toContain('/r_nmiss=NMISS(region)');
  });
});

describe('Copy variable properties (a logged transform)', () => {
  const labels = [{ value: 1, label: 'Disagree' }, { value: 5, label: "Agree, it's true" }];
  const d = ds([
    { name: 'q1', values: [1], opts: { valueLabels: labels, missing: { discrete: [9], range: { lo: 90, hi: Infinity } }, measure: 'ordinal', label: 'Item 1', columns: 5, align: 'center', role: 'target' } },
    { name: 'q2', values: [2] },
    { name: 'q3', values: [3] },
    { name: 'txt', values: ['a'] },
  ]);
  it('copies the chosen properties and writes the SPSS syntax', () => {
    const r = copyPropertiesTransform(d, vid(d, 'q1'), [vid(d, 'q2'), vid(d, 'q3'), vid(d, 'txt')], ['valueLabels', 'missing', 'measure', 'display', 'role', 'label']);
    const q3 = r.dataset.variables[2];
    expect(q3.valueLabels).toEqual(labels);
    expect(q3.missing).toEqual({ discrete: [9], range: { lo: 90, hi: Infinity } });
    expect([q3.measure, q3.columns, q3.align, q3.role, q3.label]).toEqual(['ordinal', 5, 'center', 'target', 'Item 1']);
    expect(r.dataset.variables[3].valueLabels).toEqual([]); // other type: left alone
    expect(r.warnings).toEqual(['txt is not the same type as q1 and was left unchanged.']);
    expect(r.title).toBe('Copy Variable Properties');
    expect(r.syntax).toBe([
      '* Properties copied from q1.',
      "VARIABLE LABELS q2 'Item 1'\n  /q3 'Item 1'.",
      "VALUE LABELS q2 q3\n  1 'Disagree'\n  5 'Agree, it''s true'.",
      'MISSING VALUES q2 q3 (90 THRU HI, 9).',
      'VARIABLE LEVEL q2 q3 (ORDINAL).',
      'VARIABLE WIDTH q2 q3 (5).',
      'VARIABLE ALIGNMENT q2 q3 (CENTER).',
      'VARIABLE ROLE /TARGET q2 q3.',
    ].join('\n'));
    expect(r.summary).toBe('Copied value labels, missing values, measure, columns and alignment, role, variable label from q1 to 2 variables (q2, q3).');
    expect(d.variables[1].valueLabels).toEqual([]); // input untouched
  });
  it('nothing to change gives the same dataset', () => {
    const r = copyPropertiesTransform(d, vid(d, 'q1'), [vid(d, 'txt')], ['measure']);
    expect(r.dataset).toBe(d);
  });
});

describe('undo labels', () => {
  beforeEach(() => useStore.setState({ dataset: null, past: [], future: [], outputs: [], tab: 'data' }));
  it('applyTransform names the step, logs it to Output and Edit > Undo / Redo read the name', () => {
    const d = ds([{ name: 'age', values: [30, 20] }]);
    useStore.getState().setDataset(d);
    applyTransform(selectCasesTransform(d, { kind: 'if', condition: 'age > 25' }, 'filter'), 'Select cases');
    expect(undoStep('data')?.label).toBe('Undo Select cases');
    const out = useStore.getState().outputs;
    expect(out[out.length - 1].syntax).toContain('FILTER BY filter_$.');
    useStore.getState().undo();
    expect(redoStep('data')?.label).toBe('Redo Select cases');
  });

  /** Source files of the transform and data dialogs. */
  const dialogFiles = [
    ...readdirSync(join(__dirname, '../../src/features/transform')).filter((f) => f.endsWith('.tsx')).map((f) => join('src/features/transform', f)),
    'src/features/data/VarDialogs.tsx',
    'src/features/data/DefineProperties.tsx',
  ];
  /** The argument text of every call `name(...)` in `src` (balanced parentheses). */
  function calls(src: string, name: RegExp): string[] {
    const out: string[] = [];
    for (const m of src.matchAll(name)) {
      let depth = 0;
      const start = m.index! + m[0].length;
      for (let i = start - 1; i < src.length; i++) {
        if (src[i] === '(') depth++;
        else if (src[i] === ')' && --depth === 0) {
          out.push(src.slice(start, i));
          break;
        }
      }
    }
    return out;
  }
  /** Top-level arguments of a call's argument text. */
  function args(text: string): string[] {
    const parts: string[] = [];
    let depth = 0, cur = '', quote = '';
    for (const ch of text) {
      if (quote) {
        cur += ch;
        if (ch === quote) quote = '';
        continue;
      }
      if (ch === "'" || ch === '"' || ch === '`') quote = ch;
      if ('([{'.includes(ch)) depth++;
      if (')]}'.includes(ch)) depth--;
      if (ch === ',' && depth === 0) {
        parts.push(cur.trim());
        cur = '';
      } else cur += ch;
    }
    if (cur.trim()) parts.push(cur.trim());
    return parts;
  }
  it('every transform and data dialog passes a label for Edit > Undo', () => {
    let nApply = 0, nMutate = 0;
    for (const f of dialogFiles) {
      const src = readFileSync(join(__dirname, '../..', f), 'utf-8');
      for (const a of calls(src, /(?<![\w.])applyTransform\(/g)) {
        if (/^res: TransformResult/.test(a)) continue; // the definition
        nApply++;
        const label = args(a)[1];
        expect(label, `${f}: applyTransform(${a.slice(0, 60)}...) has no label`).toMatch(/^(['`]|on \?)/);
      }
      for (const a of calls(src, /(?<![\w])(?:mutate|mutateDataset)\(/g)) {
        nMutate++;
        expect(args(a)[1] ?? '', `${f}: mutate(${a.slice(0, 60)}...) has no label`).toMatch(/\blabel\b/);
      }
    }
    expect(nApply).toBeGreaterThanOrEqual(20);
    expect(nMutate).toBeGreaterThanOrEqual(4);
  });
});
