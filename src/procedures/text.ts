// Shared, safe building blocks for the words procedures write (interpretations, APA sentences, notes)
// and for the confidence-level option. Every number that goes into prose passes through `numText`, so
// negative zero never appears ("-0.00" becomes "0.00"); prose builders check `allFinite` before
// writing a statistic and explain in plain words when it cannot be computed, instead of printing
// NaN, Infinity or "n/a". `cleanBlocks` is the last line of defence: output never carries an empty
// text block or heading.

import type { OptionDef, OptionValues } from '../core/procedure';
import type { OutputBlock } from '../core/output';
import type { Variable } from '../core/types';
import { categoryLabel } from '../core/data';

/** True when every value is a finite number (write the statistic into prose only then). */
export function allFinite(...xs: number[]): boolean {
  for (const x of xs) if (typeof x !== 'number' || !Number.isFinite(x)) return false;
  return true;
}

/**
 * Fixed-decimal text for prose: thousands separators from 1,000, no negative zero, and (for bounded
 * statistics such as r, alpha or p) no leading zero. Non-finite values give "." (the SPSS blank);
 * prose should not reach that branch (check `allFinite` first).
 */
export function numText(x: number, decimals = 2, bounded = false): string {
  if (!Number.isFinite(x)) return '.';
  let s = Math.abs(x) >= 1000 ? x.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : x.toFixed(decimals);
  if (/^-[0.,]*$/.test(s)) s = s.slice(1); // rounds to zero: drop the sign
  if (bounded) s = s.replace(/^(-?)0\./, '$1.');
  return s;
}

/**
 * A (possibly weighted) number of cases for prose: whole numbers with separators, otherwise one
 * decimal, and two significant digits when that would read "0" (tiny fractional weights).
 */
export function countText(n: number): string {
  if (!Number.isFinite(n)) return '0';
  if (Number.isInteger(n)) return n.toLocaleString('en-US');
  const one = n.toLocaleString('en-US', { maximumFractionDigits: 1 });
  return one === '0' || one === '-0' ? String(Number(n.toPrecision(2))) : one;
}

/** Drop empty text blocks and headings: an interpretation that has nothing to say is left out. */
export function cleanBlocks(blocks: OutputBlock[]): OutputBlock[] {
  return blocks.filter((b) => !((b.kind === 'text' || b.kind === 'heading') && !b.text.trim()));
}

/** Label of a category for tables and prose; a blank string answer reads "(blank)", never "". */
export function labelOf(v: Variable, x: number | string): string {
  return nonEmpty(categoryLabel(v, typeof x === 'string' ? x.trimEnd() : x));
}

/** A name for prose that is never empty (a blank string category reads "(blank)"). */
export function nonEmpty(name: string, fallback = '(blank)'): string {
  return name.trim() ? name : fallback;
}

// ---------------------------------------------------------------------------------------------
// Confidence level (%): one rule for the dialog and for run(), as SPSS (CILEVEL / CIN 1 to 99.99)
// ---------------------------------------------------------------------------------------------

export const CI_MIN = 1;
export const CI_MAX = 99.99;

/** The confidence-level option: the dialog validates against the same min and max that run() uses. */
export function ciOption(key: string, label: string, group: string, dflt = 95): OptionDef {
  return { key, label, type: 'number', default: dflt, min: CI_MIN, max: CI_MAX, group };
}

/** The dialog's own message for a number outside its range (see features/analysis/varUtils validate). */
export function rangeMessage(label: string, min: number, max: number): string {
  return `"${label}" must be between ${min} and ${max}.`;
}

/**
 * The confidence level as a fraction (0.95). Missing or non-numeric values fall back to the default;
 * a value outside 1 to 99.99 is refused with exactly the message the dialog shows.
 */
export function confLevel(opts: OptionValues, key: string, label: string, dflt = 95): number {
  const v = opts[key];
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  const pctv = Number.isNaN(n) ? dflt : n;
  if (!(pctv >= CI_MIN && pctv <= CI_MAX)) throw new Error(rangeMessage(label, CI_MIN, CI_MAX));
  return pctv / 100;
}

/** "95", "99.9", "99.99": the level as it should read in a heading or sentence. */
export function levelText(conf: number): string {
  return String(Math.round(conf * 10000) / 100);
}
