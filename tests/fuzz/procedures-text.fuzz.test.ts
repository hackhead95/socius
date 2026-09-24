// Every procedure over the fuzz generators (the pairwise rows of procedures.fuzz, with other seeds),
// scanning ALL user-facing text: text blocks of every style, table titles, subtitles, header and stub
// labels, footnotes, chart titles and labels, the case note, dialog messages and error messages.
// Nothing may read "NaN", "undefined", "Infinity", "[object Object]", "n/a", a negative zero
// ("-0.00"), an empty name ("For , the mean", 'compared with ""', "()") or be an empty text block.
//
// Reproduce: FUZZ_SEED=<seed> FUZZ_ONLY=<procedure id>[:row] npx vitest run tests/fuzz/procedures-text.fuzz.test.ts
import { describe, expect, it } from 'vitest';
import { procedures } from '../../src/procedures';
import type { OutputItem } from '../../src/core/output';
import { suiteSeed } from './lib/rng';
import { buildCase, buildRows } from './lib/proc-cases';
import { runChecked } from './lib/proc-harness';
import { tableShapeProblems, tables } from './lib/invariants';
import type { OptionValues } from '../../src/core/procedure';

const SEEDS = [suiteSeed(7301), 7302, 7303, 7304];
const ONLY = process.env.FUZZ_ONLY ?? '';

const BAD: Array<[RegExp, string]> = [
  [/\bNaN\b/, 'NaN'],
  [/\bundefined\b/, 'undefined'],
  [/(?<![∞-])\bInfinity\b/, 'Infinity'],
  [/\[object Object\]/, '[object Object]'],
  [/\bn\/a\b/i, 'n/a'],
];
/**
 * A computed statistic that rounds to zero printed with a minus sign ("M = -0.00", "α = -.00").
 * Category labels are data (a value of -1e-9 shown with two decimals), so only statistics are checked.
 */
const NEG_ZERO = /(?:[=≈]\s?|\b(?:is|was|from|to|by|of|at)\s)-0?\.0+(?![\d.])/;
/** Empty names in prose. */
const EMPTY_NAME: Array<[RegExp, string]> = [
  [/(?:^|[.;:!?] )(?:For|In|Among|Between) ,/, 'empty name after For/In'],
  [/\b(?:for|in|between|and|with|of|by) ,/, 'empty name before a comma'],
  [/""|''|“”/, 'empty quoted name'],
  [/\(\s*\)/, 'empty parentheses'],
  [/^\s*[,.;:]/, 'text starts with punctuation'],
];

interface Hit {
  where: string;
  what: string;
  text: string;
}

function scan(where: string, s: string, prose: boolean, out: Hit[]) {
  for (const [re, what] of BAD) if (re.test(s)) out.push({ where, what, text: s });
  if (prose && NEG_ZERO.test(s)) out.push({ where, what: 'negative zero', text: s });
  if (prose) for (const [re, what] of EMPTY_NAME) if (re.test(s)) out.push({ where, what, text: s });
}

/** Every piece of user-facing text in an item. */
function scanItem(item: OutputItem, out: Hit[]) {
  scan('caseNote', item.caseNote ?? '', true, out);
  for (const b of item.blocks) {
    if (b.kind === 'text') {
      if (!b.text.trim()) out.push({ where: `${b.style} block`, what: 'empty text block', text: '' });
      scan(`${b.style} text`, b.text, true, out);
    } else if (b.kind === 'heading') {
      if (!b.text.trim()) out.push({ where: 'heading', what: 'empty heading', text: '' });
      scan('heading', b.text, false, out);
    } else if (b.kind === 'table') {
      const t = b.table;
      scan('table title', t.title, false, out);
      if (t.subtitle) scan('table subtitle', t.subtitle, false, out);
      for (const f of t.footnotes ?? []) scan('footnote', f, true, out);
      for (const row of [...t.header, ...t.rows]) for (const c of row) if (typeof c.v === 'string') scan('table label', c.v, false, out);
    } else if (b.kind === 'chart') {
      const c = b.chart as unknown as Record<string, unknown>;
      for (const k of ['title', 'xLabel', 'yLabel']) if (typeof c[k] === 'string') scan(`chart ${k}`, c[k] as string, false, out);
    }
  }
}

describe('all procedure text is clean (every procedure x generated data x options)', () => {
  for (const def of procedures) {
    it(def.id, () => {
      const hits: string[] = [];
      let ran = 0;
      for (const seed of SEEDS) {
        const rows = buildRows(seed, def);
        rows.forEach((row, i) => {
          if (ONLY && ONLY !== def.id && ONLY !== `${def.id}:${i}`) return;
          const { c } = buildCase(seed, def, row, i);
          const r = runChecked(def, c.ds, c.slots, c.opts);
          const found: Hit[] = [];
          if (r.kind === 'blocked') for (const p of r.problems) scan('dialog message', p, true, found);
          else if (r.kind === 'threw') scan('error message', (r.error as Error)?.message ?? String(r.error), true, found);
          else if (r.item) {
            ran++;
            scanItem(r.item, found);
          }
          for (const h of found) hits.push(`[seed ${seed} row ${i}] ${h.where}: ${h.what}: "${h.text.slice(0, Number(process.env.FUZZ_TEXT_LEN ?? 220))}"`);
        });
      }
      if (hits.length) process.stdout.write(`[text] ${def.id}:\n  ${[...new Set(hits)].slice(0, 40).join('\n  ')}\n`);
      expect(hits.slice(0, 12), `${hits.length} problem(s) in ${def.id} (${ran} runs produced output)`).toEqual([]);
    }, 120_000);
  }
});

// Header/body alignment (FZ-03) over option combinations beyond the pairwise rows: every checkbox
// flipped on its own, every select choice, all checkboxes on and all off, on each seed's typical case.
describe('tables stay rectangular (header as wide as the body) for every option combination', () => {
  for (const def of procedures) {
    it(def.id, () => {
      const probs: string[] = [];
      for (const seed of SEEDS) {
        const base = buildCase(seed, def, buildRows(seed, def)[0], 0).c;
        const variants: OptionValues[] = [base.opts];
        const boxes = def.options.filter((o) => o.type === 'checkbox');
        for (const o of boxes) variants.push({ ...base.opts, [o.key]: !base.opts[o.key] });
        for (const o of def.options) if (o.type === 'select') for (const ch of o.choices) variants.push({ ...base.opts, [o.key]: ch.value });
        variants.push({ ...base.opts, ...Object.fromEntries(boxes.map((o) => [o.key, true])) });
        variants.push({ ...base.opts, ...Object.fromEntries(boxes.map((o) => [o.key, false])) });
        for (const opts of variants) {
          const r = runChecked(def, base.ds, base.slots, opts);
          if (r.item) for (const t of tables(r.item)) for (const p of tableShapeProblems(t)) probs.push(`[seed ${seed}] ${p} with ${JSON.stringify(opts).slice(0, 200)}`);
        }
      }
      expect(probs.slice(0, 5)).toEqual([]);
    }, 120_000);
  }
});
