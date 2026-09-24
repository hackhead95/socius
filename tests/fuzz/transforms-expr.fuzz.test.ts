// Grammar-based fuzzing of the COMPUTE expression language and the Compute Variable transform.
// - Random well-typed expressions (functions, operators, missing values, strings, dates) are rendered
//   with minimal and with full parentheses; both must compile and agree with an independent reference
//   evaluator implementing SPSS missing-value rules (tests/fuzz/lib/gen-expr.ts).
// - Random token soup must either compile or throw ExprError with a readable message and a valid position.
// - computeVariable: only ComputeError on bad input; on success the column matches the expression
//   (IF condition respected), the input dataset is untouched, and undo restores it exactly.
// Reproduce: FUZZ_SEED=<seed> npx vitest run tests/fuzz/transforms-expr.fuzz.test.ts
import { describe, expect, it } from 'vitest';
import { compileExpression, computeVariable, ComputeError, ExprError } from '../../src/lib/transform';
import { useStore } from '../../src/core/store';
import { makeRng, suiteSeed, fuzzScale } from './lib/rng';
import { cloneDataset, datasetToCode, deepDiff, genDataset, keepVariables } from './lib/gen-data';
import { exprGenerator, refEval, render, tokenSoup, UNKNOWN, type X } from './lib/gen-expr';
import { Collector, type Failure } from './lib/findings';
import { badWords, errorProblems } from './lib/invariants';
import type { Dataset } from '../../src/core/types';

const SEED = suiteSeed(424242);
const col = new Collector('transforms-expr');
const out = (s: string) => process.stdout.write(s + '\n');

function fail(subject: string, check: string, detail: string, seed: number, repro?: string) {
  const f: Failure = { area: 'transforms', subject, check, detail, seed, repro };
  col.add(f);
}

function usedVars(x: X, acc = new Set<string>()): Set<string> {
  if (x.k === 'var' || x.k === 'svar') acc.add(x.v.id);
  for (const k of ['a', 'b'] as const) if (k in x) usedVars((x as any)[k], acc);
  if (x.k === 'call') x.args.forEach((a) => usedVars(a, acc));
  return acc;
}

function exprRepro(ds: Dataset, x: X, src: string, row?: number): string {
  const small = keepVariables({ ...ds, weightVarId: null, filterVarId: null }, usedVars(x));
  const rows = row === undefined ? small : { ...small, nCases: 1, columns: Object.fromEntries(Object.entries(small.columns).map(([k, c]) => [k, c instanceof Float64Array ? Float64Array.of(c[row]) : [c[row]]])) };
  return `${datasetToCode(rows as Dataset)}\nconst c = compileExpression(ds, ${JSON.stringify(src)});\nc.evaluate(0);`;
}

function sameNum(a: number, b: number): boolean {
  if (Number.isNaN(a) || Number.isNaN(b)) return Number.isNaN(a) && Number.isNaN(b);
  return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
}

describe('expressions', () => {
  it('random well-typed expressions agree with the SPSS reference semantics', () => {
    const N = Math.round(3000 * fuzzScale());
    let checked = 0, unknown = 0;
    for (let t = 0; t < N; t++) {
      const seed = makeRng(SEED).fork(`expr#${t}`).seed;
      const rng = makeRng(seed);
      const { ds } = genDataset(rng, { nCases: rng.pick([1, 3, 12]), extra: rng.int(0, 3) });
      const g = exprGenerator(rng, ds);
      const x = rng.bool(0.8) ? g.num(rng.int(1, 5)) : g.str(rng.int(1, 3));
      for (const full of [false, true]) {
        const src = render(x, full);
        let c;
        try {
          c = compileExpression(ds, src);
        } catch (e) {
          const p = errorProblems(e);
          if (!(e instanceof ExprError)) fail('expression', 'compile-throw', `non-ExprError: ${(e as Error)?.message}`, seed, exprRepro(ds, x, src));
          else fail('expression', 'compile-rejects-valid', `valid expression rejected: ${(e as Error).message}${p.length ? ' / ' + p.join(', ') : ''} — ${src.slice(0, 120)}`, seed, exprRepro(ds, x, src));
          continue;
        }
        if (c.type !== (x.t === 'n' ? 'num' : 'str')) fail('expression', 'type', `expected ${x.t === 'n' ? 'number' : 'text'} but compiled as ${c.type}: ${src}`, seed, exprRepro(ds, x, src));
        for (let i = 0; i < ds.nCases; i++) {
          let got: number | string;
          try {
            got = c.evaluate(i);
          } catch (e) {
            fail('expression', 'evaluate-throw', `evaluate threw ${(e as Error)?.name}: ${(e as Error)?.message} — ${src.slice(0, 100)}`, seed, exprRepro(ds, x, src, i));
            break;
          }
          if (typeof got === 'number' && !Number.isNaN(got) && !Number.isFinite(got)) fail('expression', 'non-finite', `result ${got} (should be system-missing): ${src.slice(0, 100)}`, seed, exprRepro(ds, x, src, i));
          if (typeof got === 'string' && /\b(undefined|NaN|null)\b|\[object/.test(got) && !/NaN|undefined|null/.test(src)) fail('expression', 'string-garbage', `string result "${got.slice(0, 60)}": ${src.slice(0, 100)}`, seed, exprRepro(ds, x, src, i));
          const want = refEval(x, ds, i);
          if (want === UNKNOWN) {
            unknown++;
            continue;
          }
          checked++;
          const ok = typeof want === 'number' ? typeof got === 'number' && sameNum(got, want) : got === want;
          if (!ok) {
            fail('expression', 'semantics', `${full ? '(full parens) ' : ''}${src.slice(0, 140)} gave ${JSON.stringify(typeof got === 'number' && Number.isNaN(got) ? 'SYSMIS' : got)} but SPSS rules give ${JSON.stringify(typeof want === 'number' && Number.isNaN(want) ? 'SYSMIS' : want)}`, seed, exprRepro(ds, x, src, i));
            break;
          }
        }
      }
    }
    out(`[fuzz:expr] ${N} expressions, ${checked} values checked against the reference, ${unknown} unchecked (dates/formats)`);
  }, 60_000);

  it('SPSS precedence and missing-value probes', () => {
    const { ds } = genDataset(makeRng(SEED), { nCases: 1 });
    const probes: Array<[string, number]> = [
      ['2**3**2', 64], // left-associative, as SPSS/PSPP
      ['-2**2', -4], // ** binds tighter than unary minus
      ['2**-1', 0.5],
      ['0 * $SYSMIS', 0],
      ['$SYSMIS * 0', 0],
      ['0 / $SYSMIS', 0],
      ['MOD(0, $SYSMIS)', 0],
      ['$SYSMIS + 1', NaN],
      ['1 / 0', NaN],
      ['$SYSMIS OR 1', 1],
      ['$SYSMIS AND 0', 0],
      ['$SYSMIS AND 1', NaN],
      ['NOT $SYSMIS', NaN],
      ['MEAN(1, $SYSMIS, 3)', 2],
      ['MEAN.3(1, $SYSMIS, 3)', NaN],
      ['SUM($SYSMIS, $SYSMIS)', NaN],
      ['NVALID(1, $SYSMIS, 2) + NMISS(1, $SYSMIS, 2)', 3],
      ['RND(2.5)', 3],
      ['RND(-2.5)', -3],
      ['RND(0.1 + 0.2 - 0.3 + 2.5)', 3],
      ['TRUNC(-2.7)', -2],
      ['MOD(-7, 3)', -1],
      ['1 < 2 = 1', 1],
      ['NOT 1 = 2', 1],
      ['1 + 2 * 3 ** 2', 19],
      ['SQRT(-1)', NaN],
      ['LN(0)', NaN],
      ['EXP(1000)', NaN],
      ['1e308 * 10', NaN],
      ['ABS(-0)', 0],
      ['LENGTH("abc   ")', 3],
      ['CHAR.INDEX("abcabc", "c")', 3],
      ['XDATE.YEAR(DATE.DMY(29, 2, 2024))', 2024],
      ['DATE.DMY(30, 2, 2024)', NaN],
      ['XDATE.WKDAY(DATE.DMY(24, 9, 2026))', 5],
      ["DATEDIFF(DATE.DMY(1, 3, 2024), DATE.DMY(29, 2, 2024), 'days')", 1],
      ["DATEDIFF(DATE.DMY(28, 2, 2025), DATE.DMY(29, 2, 2024), 'years')", 0],
      ["DATEDIFF(DATE.DMY(1, 3, 2025), DATE.DMY(29, 2, 2024), 'years')", 1],
      ["NUMBER('12', F8.2)", 0.12],
      ["NUMBER('1.5', F8.2)", 1.5],
      ["NUMBER(' ', F8.0)", NaN],
      ['YRMODA(1582, 10, 15)', 1],
      ['TIME.HMS(1, 30)', 5400],
    ];
    for (const [src, want] of probes) {
      let got: number | string = 'threw';
      try {
        got = compileExpression(ds, src).evaluate(0);
      } catch (e) {
        got = `threw ${(e as Error).message}`;
      }
      if (typeof got !== 'number' || !sameNum(got, want))
        fail('expression', 'probe', `${src} = ${JSON.stringify(typeof got === 'number' && Number.isNaN(got) ? 'SYSMIS' : got)}, expected ${Number.isNaN(want) ? 'SYSMIS' : want}`, SEED, `compileExpression(anyDataset, ${JSON.stringify(src)}).evaluate(0)`);
    }
    const sprobes: Array<[string, string]> = [
      ["STRING(1234.5, F8.2)", ' 1234.50'],
      ["STRING(5, N3)", '005'],
      ["STRING(-5, N3)", '***'],
      ["STRING(123456, F3.0)", '***'],
      ["CONCAT('a', 'b')", 'ab'],
      ["SUBSTR('পুরুষ', 2, 2)", 'ুর'],
      ["UPCASE('ß')", 'SS'],
      ["REPLACE('aaa', 'a', 'b', 2)", 'bba'],
      ["LTRIM('xxab', 'x')", 'ab'],
    ];
    for (const [src, want] of sprobes) {
      let got: number | string;
      try {
        got = compileExpression(ds, src).evaluate(0);
      } catch (e) {
        got = `threw ${(e as Error).message}`;
      }
      if (got !== want) fail('expression', 'probe', `${src} = ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`, SEED, `compileExpression(anyDataset, ${JSON.stringify(src)}).evaluate(0)`);
    }
    // Deeply nested input must give a readable error, not a stack overflow.
    for (const [label, src] of [
      ['5000 nested parentheses', '('.repeat(5000) + '1' + ')'.repeat(5000)],
      ['20000 unary minus signs', '-'.repeat(20000) + '1'],
      ['3000 NOTs', 'NOT '.repeat(3000) + '1'],
      ['long sum', Array.from({ length: 20000 }, (_, i) => String(i)).join('+')],
    ] as const) {
      try {
        compileExpression(ds, src).evaluate(0);
      } catch (e) {
        if (!(e instanceof ExprError)) fail('expression', 'deep-nesting', `${label}: ${(e as Error)?.name}: ${(e as Error)?.message}`, SEED, `compileExpression(ds, ${JSON.stringify(src.slice(0, 20))} /* ${label} */)`);
      }
    }
  });

  it('token soup never crashes the parser', () => {
    const N = Math.round(3000 * fuzzScale());
    for (let t = 0; t < N; t++) {
      const seed = makeRng(SEED).fork(`soup#${t}`).seed;
      const rng = makeRng(seed);
      const { ds } = genDataset(rng, { nCases: 2 });
      const src = tokenSoup(rng, ds);
      try {
        const c = compileExpression(ds, src);
        for (let i = 0; i < ds.nCases; i++) c.evaluate(i);
      } catch (e) {
        if (!(e instanceof ExprError)) {
          fail('expression', 'soup-throw', `${(e as Error)?.name}: ${(e as Error)?.message?.slice(0, 120)}`, seed, `compileExpression(ds, ${JSON.stringify(src)})`);
          continue;
        }
        const bad = badWords(e.message);
        if (bad.length || !e.message.trim()) fail('expression', 'soup-message', `message contains ${bad.join(',') || 'nothing'}: "${e.message}"`, seed, `compileExpression(ds, ${JSON.stringify(src)})`);
        if (!(e.pos >= 0 && e.pos <= src.length && e.end <= src.length + 1 && e.end > e.pos)) fail('expression', 'soup-position', `error position ${e.pos}..${e.end} outside the text (length ${src.length}): "${e.message}"`, seed, `compileExpression(ds, ${JSON.stringify(src)})`);
      }
    }
  }, 60_000);
});

describe('Compute Variable', () => {
  it('random targets, expressions and IF conditions', () => {
    const N = Math.round(1500 * fuzzScale());
    const targets = ['newvar', 'x.1', '1abc', '', 'ALL', 'with space', 'a'.repeat(65), 'ক্ষেত্র', 'filter_$', 'ends_', '#scratch', '$sys'];
    for (let t = 0; t < N; t++) {
      const seed = makeRng(SEED).fork(`compute#${t}`).seed;
      const rng = makeRng(seed);
      const { ds } = genDataset(rng, { nCases: rng.pick([1, 4, 20]), weight: rng.pick(['none', 'int'] as const), filter: rng.bool(0.3) });
      const g = exprGenerator(rng, ds);
      const x = rng.bool(0.75) ? g.num(rng.int(0, 3)) : g.str(rng.int(0, 2));
      const expr = rng.bool(0.05) ? rng.pick(['', '1 +', "'unclosed", 'nosuchvar + 1']) : render(x);
      const target = rng.bool(0.3) ? rng.pick(ds.variables).name : rng.pick(targets);
      const cond = rng.bool(0.35) ? render(g.num(2)) : rng.bool(0.05) ? "'text condition'" : undefined;
      const type = rng.bool(0.2) ? rng.pick(['numeric', 'string'] as const) : undefined;
      const spec = { target, expression: expr, condition: cond, type, width: rng.bool(0.2) ? rng.pick([0, 1, 3, 40]) : undefined, label: rng.bool(0.3) ? 'Label ক' : undefined };
      const before = cloneDataset(ds);
      const repro = `${datasetToCode(ds).slice(0, 2500)}\ncomputeVariable(ds, ${JSON.stringify(spec)});`;
      let res;
      try {
        res = computeVariable(ds, spec);
      } catch (e) {
        if (!(e instanceof ComputeError)) fail('compute', 'throw', `non-ComputeError ${(e as Error)?.name}: ${(e as Error)?.message?.slice(0, 140)}`, seed, repro);
        else for (const p of errorProblems(e)) fail('compute', 'message', p, seed, repro);
        continue;
      }
      const mut = deepDiff(before, ds);
      if (mut) fail('compute', 'mutates', `computeVariable changed its input: ${mut}`, seed, repro);
      const nds = res.dataset;
      const v = nds.variables.find((u) => u.name.toLowerCase() === target.trim().toLowerCase());
      if (!v) {
        fail('compute', 'result', `target ${target} not found after compute`, seed, repro);
        continue;
      }
      if (nds.variables.length !== new Set(nds.variables.map((u) => u.name.toLowerCase())).size) fail('compute', 'result', 'duplicate variable names after compute', seed, repro);
      for (const [k, c] of Object.entries(nds.columns)) if (c.length !== nds.nCases) fail('compute', 'result', `column ${k} has ${c.length} values for ${nds.nCases} cases`, seed, repro);
      for (const s of [res.summary, res.syntax]) for (const b of badWords(s).filter((w) => w !== 'null')) fail('compute', 'text', `${b} in "${s.slice(0, 120)}"`, seed, repro);
      // Values: evaluate the expression on the ORIGINAL dataset.
      const ce = compileExpression(ds, expr);
      const cc = cond ? compileExpression(ds, cond) : null;
      const colv = nds.columns[v.id];
      const old = ds.columns[v.id];
      for (let i = 0; i < ds.nCases; i++) {
        const on = !cc || (() => { const z = cc.evaluate(i) as number; return !Number.isNaN(z) && z !== 0; })();
        let want: number | string = on ? ce.evaluate(i) : old ? old[i] : v.type === 'numeric' ? NaN : '';
        if (typeof want === 'string') want = want.slice(0, v.width);
        const got = colv[i];
        const ok = typeof want === 'number' ? typeof got === 'number' && (Object.is(got, want) || (Number.isNaN(got) && Number.isNaN(want)) || got === want) : got === want;
        if (!ok) {
          fail('compute', 'value', `row ${i}: got ${JSON.stringify(got)} want ${JSON.stringify(want)} (${expr.slice(0, 80)}${cond ? ` IF ${cond.slice(0, 60)}` : ''})`, seed, repro);
          break;
        }
      }
      // Undo restores the dataset exactly (store round trip).
      const st = useStore.getState();
      st.setDataset(before);
      st.mutateDataset(() => res.dataset);
      st.undo();
      const u = deepDiff(useStore.getState().dataset, before);
      if (u) fail('compute', 'undo', `undo did not restore the dataset: ${u}`, seed, repro);
      useStore.getState().redo();
      const r = deepDiff({ ...useStore.getState().dataset!, version: 0 }, { ...res.dataset, version: 0 });
      if (r) fail('compute', 'redo', `redo did not restore the result: ${r}`, seed, repro);
    }
  }, 60_000);
});

describe('gate', () => {
  it('no new failures (known ones are listed in tests/fuzz/known-issues.ts)', () => {
    const g = col.gate();
    out(`[fuzz:transforms-expr] seed ${SEED}\n${g.summary}`);
    expect(g.unknown, g.summary).toEqual([]);
  });
});
