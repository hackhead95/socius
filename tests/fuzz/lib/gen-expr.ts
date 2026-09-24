// Grammar-based generator for SPSS COMPUTE expressions, a renderer (minimal or full parentheses) and an
// independent reference evaluator with SPSS missing-value semantics:
//   arithmetic with a missing operand -> missing, except 0*missing = 0, 0/missing = 0, MOD(0, missing) = 0;
//   user-missing values of variables are missing (VALUE() sees the stored value; MISSING() both; SYSMIS() only sysmis);
//   MEAN/SUM/... skip missing arguments (.n = minimum valid); relations with a missing operand -> missing;
//   AND/OR three-valued (missing AND false = false, missing OR true = true); non-finite results -> missing.
// Operator precedence (PSPP/SPSS): ** > unary - > * / > + - > relations > NOT > AND > OR, all left-associative.
import type { Dataset, Variable } from '../../../src/core/types';
import { isUserMissing, valueLabelFor } from '../../../src/core/data';
import type { Rng } from './rng';

export type X =
  | { t: 'n'; k: 'lit'; v: number }
  | { t: 'n'; k: 'var'; v: Variable }
  | { t: 'n'; k: 'sysmis' }
  | { t: 'n'; k: 'casenum' }
  | { t: 'n'; k: 'neg'; a: X }
  | { t: 'n'; k: 'bin'; op: '+' | '-' | '*' | '/' | '**'; a: X; b: X }
  | { t: 'n'; k: 'rel'; op: '=' | '~=' | '<' | '<=' | '>' | '>='; a: X; b: X }
  | { t: 'n'; k: 'and' | 'or'; a: X; b: X }
  | { t: 'n'; k: 'not'; a: X }
  | { t: 'n' | 's'; k: 'call'; fn: string; args: X[]; suffix?: number }
  | { t: 's'; k: 'slit'; v: string }
  | { t: 's'; k: 'svar'; v: Variable };

const NUM_LITS = [0, 1, 2, 3, -3, 0.5, 2.5, -2.5, 10, 100, 1e300, 1e-300, 7, 1.5];
const STR_LITS = ['', 'a', 'NA', 'North', 'পুরুষ', 'शहरी', "it's", ' x ', 'AB'];

export interface ExprGen {
  num(d: number): X;
  str(d: number): X;
}

export function exprGenerator(rng: Rng, ds: Dataset): ExprGen {
  const nums = ds.variables.filter((v) => v.type === 'numeric');
  const strs = ds.variables.filter((v) => v.type === 'string');
  const numVar = (): X => (nums.length ? { t: 'n', k: 'var', v: rng.pick(nums) } : { t: 'n', k: 'lit', v: rng.pick(NUM_LITS) });
  const strVar = (): X => (strs.length ? { t: 's', k: 'svar', v: rng.pick(strs) } : { t: 's', k: 'slit', v: rng.pick(STR_LITS) });
  const g: ExprGen = {
    num(d) {
      if (d <= 0 || rng.bool(0.25)) {
        const r = rng.next();
        if (r < 0.45) return numVar();
        if (r < 0.85) return { t: 'n', k: 'lit', v: rng.pick(NUM_LITS) };
        if (r < 0.93) return { t: 'n', k: 'sysmis' };
        return { t: 'n', k: 'casenum' };
      }
      const r = rng.int(0, 15);
      switch (r) {
        case 0:
          return { t: 'n', k: 'neg', a: g.num(d - 1) };
        case 1:
        case 2:
        case 3:
          return { t: 'n', k: 'bin', op: rng.pick(['+', '-', '*', '/', '**'] as const), a: g.num(d - 1), b: g.num(d - 1) };
        case 4:
          return rng.bool(0.8)
            ? { t: 'n', k: 'rel', op: rng.pick(['=', '~=', '<', '<=', '>', '>='] as const), a: g.num(d - 1), b: g.num(d - 1) }
            : { t: 'n', k: 'rel', op: rng.pick(['=', '~=', '<', '<=', '>', '>='] as const), a: g.str(d - 1), b: g.str(d - 1) };
        case 5:
          return { t: 'n', k: rng.pick(['and', 'or'] as const), a: g.num(d - 1), b: g.num(d - 1) };
        case 6:
          return { t: 'n', k: 'not', a: g.num(d - 1) };
        case 7:
          return { t: 'n', k: 'call', fn: rng.pick(['ABS', 'SQRT', 'EXP', 'LN', 'LG10', 'SIN', 'COS', 'ARTAN', 'ARSIN', 'ARCOS']), args: [g.num(d - 1)] };
        case 8: {
          const fn = rng.pick(['RND', 'TRUNC', 'MOD']);
          return { t: 'n', k: 'call', fn, args: fn === 'MOD' || rng.bool(0.4) ? [g.num(d - 1), g.num(d - 1)] : [g.num(d - 1)] };
        }
        case 9:
        case 10: {
          const fn = rng.pick(['MEAN', 'SUM', 'SD', 'VARIANCE', 'CFVAR', 'MIN', 'MAX', 'NVALID', 'NMISS']);
          const k = rng.int(1, 4);
          const args = Array.from({ length: k }, () => (rng.bool(0.6) ? numVar() : g.num(d - 1)));
          const min = fn === 'SD' || fn === 'VARIANCE' || fn === 'CFVAR' ? 2 : 1;
          if (!['NVALID', 'NMISS'].includes(fn) && k < min) args.push(numVar());
          const suffix = !['NVALID', 'NMISS'].includes(fn) && rng.bool(0.3) ? rng.int(min, args.length) : undefined;
          return { t: 'n', k: 'call', fn, args, suffix };
        }
        case 11: {
          const fn = rng.pick(['MISSING', 'SYSMIS', 'VALUE']);
          return { t: 'n', k: 'call', fn, args: [fn === 'VALUE' || rng.bool(0.8) ? numVar() : g.num(d - 1)] };
        }
        case 12: {
          const x = g.num(d - 1);
          if (rng.bool()) return { t: 'n', k: 'call', fn: 'ANY', args: [x, ...Array.from({ length: rng.int(1, 3) }, () => g.num(d - 1))] };
          return { t: 'n', k: 'call', fn: 'RANGE', args: [x, ...Array.from({ length: 2 * rng.int(1, 2) }, () => g.num(d - 1))] };
        }
        case 13:
          return { t: 'n', k: 'call', fn: 'LENGTH', args: [g.str(d - 1)] };
        case 14:
          return { t: 'n', k: 'call', fn: 'CHAR.INDEX', args: [g.str(d - 1), g.str(d - 1)] };
        default:
          return { t: 'n', k: 'call', fn: rng.pick(['XDATE.YEAR', 'XDATE.MONTH', 'XDATE.MDAY', 'XDATE.WKDAY', 'XDATE.JDAY', 'CTIME.DAYS', 'TIME.DAYS']), args: [g.num(d - 1)] };
      }
    },
    str(d) {
      if (d <= 0 || rng.bool(0.3)) return rng.bool(0.5) ? strVar() : { t: 's', k: 'slit', v: rng.pick(STR_LITS) };
      const r = rng.int(0, 6);
      switch (r) {
        case 0:
          return { t: 's', k: 'call', fn: 'CONCAT', args: Array.from({ length: rng.int(1, 3) }, () => g.str(d - 1)) };
        case 1:
          return { t: 's', k: 'call', fn: rng.pick(['UPCASE', 'LOWER', 'LTRIM', 'RTRIM']), args: [g.str(d - 1)] };
        case 2:
          return { t: 's', k: 'call', fn: 'SUBSTR', args: rng.bool() ? [g.str(d - 1), g.num(d - 1)] : [g.str(d - 1), g.num(d - 1), g.num(d - 1)] };
        case 3:
          return { t: 's', k: 'call', fn: 'REPLACE', args: [g.str(d - 1), { t: 's', k: 'slit', v: rng.pick(['a', 'x', 'পু']) }, { t: 's', k: 'slit', v: rng.pick(['', 'b', 'yy']) }] };
        case 4:
          return { t: 's', k: 'call', fn: 'STRING', args: [g.num(d - 1), { t: 's', k: 'slit', v: rng.pick(['F8.2', 'N3', 'F3.0', 'COMMA10.1', 'E10.3']) }] };
        case 5:
          return { t: 's', k: 'call', fn: 'VALUELABEL', args: [rng.bool() ? numVar() : strVar()] };
        default:
          return { t: 's', k: 'call', fn: rng.pick(['MIN', 'MAX']), args: [strVar(), strVar()] };
      }
    },
  };
  return g;
}

// ---------- rendering ----------

const PREC: Record<string, number> = { or: 1, and: 2, not: 3, rel: 4, '+': 5, '-': 5, '*': 6, '/': 6, neg: 7, '**': 8 };

function prec(x: X): number {
  if (x.k === 'bin') return PREC[x.op];
  if (x.k === 'rel') return PREC.rel;
  if (x.k === 'and' || x.k === 'or' || x.k === 'not' || x.k === 'neg') return PREC[x.k];
  if (x.k === 'lit' && (x.v < 0 || Object.is(x.v, -0))) return PREC.neg;
  return 9;
}

function numText(v: number): string {
  if (v === 1e300) return '1e300';
  if (v === 1e-300) return '1E-300';
  return String(v);
}

function strText(s: string): string {
  const q = s.includes("'") ? '"' : "'";
  return q + s.split(q).join(q + q) + q;
}

/** Render to source. `full` wraps every sub-expression in parentheses. */
export function render(x: X, full = false): string {
  const wrap = (child: X, need: boolean) => {
    const s = render(child, full);
    return need || (full && prec(child) < 9) ? `(${s})` : s;
  };
  switch (x.k) {
    case 'lit':
      return numText(x.v);
    case 'var':
    case 'svar':
      return x.v.name;
    case 'sysmis':
      return '$SYSMIS';
    case 'casenum':
      return '$CASENUM';
    case 'slit':
      return strText(x.v);
    case 'neg':
      return `-${wrap(x.a, prec(x.a) < PREC.neg || (x.a.k === 'lit' && x.a.v < 0) || x.a.k === 'neg')}`;
    case 'not':
      return `NOT ${wrap(x.a, prec(x.a) < PREC.not)}`;
    case 'bin':
    case 'rel':
    case 'and':
    case 'or': {
      const p = prec(x);
      const op = x.k === 'bin' || x.k === 'rel' ? x.op : x.k === 'and' ? 'AND' : 'OR';
      // Left-associative: the right operand needs parentheses at equal precedence.
      // Unary minus cannot start the base of ** (it would bind looser).
      const leftNeed = prec(x.a) < p || (x.k === 'bin' && x.op === '**' && prec(x.a) <= PREC.neg);
      const rightNeed = prec(x.b) <= p && !(x.k === 'bin' && x.op === '**' && prec(x.b) === 9);
      return `${wrap(x.a, leftNeed)} ${op} ${wrap(x.b, rightNeed)}`;
    }
    case 'call':
      return `${x.fn}${x.suffix !== undefined ? '.' + x.suffix : ''}(${x.args.map((a) => render(a, full)).join(', ')})`;
  }
}

// ---------- reference evaluation ----------

export const UNKNOWN = Symbol('unknown');
type R = number | string | typeof UNKNOWN;

const fin = (x: number) => (Number.isFinite(x) ? x : NaN);
const trimR = (s: string) => s.replace(/\s+$/, '');

function round(x: number, mult: number, trunc: boolean): number {
  if (Number.isNaN(x) || Number.isNaN(mult) || mult === 0) return NaN;
  const r = x / mult;
  const a = Math.abs(r);
  const fuzz = a * 2 ** -47;
  return fin(Math.sign(r) * Math.floor(a + (trunc ? 0 : 0.5) + fuzz) * mult) || 0;
}

export function refEval(x: X, ds: Dataset, i: number): R {
  const ev = (y: X) => refEval(y, ds, i);
  const numOf = (y: X): number | typeof UNKNOWN => {
    const r = ev(y);
    return r === UNKNOWN ? UNKNOWN : (r as number);
  };
  switch (x.k) {
    case 'lit':
      return x.v;
    case 'var': {
      const raw = (ds.columns[x.v.id] as Float64Array)[i];
      return Number.isNaN(raw) || isUserMissing(x.v.missing, raw) ? NaN : raw;
    }
    case 'svar':
      return (ds.columns[x.v.id] as string[])[i];
    case 'slit':
      return x.v;
    case 'sysmis':
      return NaN;
    case 'casenum':
      return i + 1;
    case 'neg': {
      const a = numOf(x.a);
      return a === UNKNOWN ? UNKNOWN : -a;
    }
    case 'not': {
      const a = numOf(x.a);
      return a === UNKNOWN ? UNKNOWN : Number.isNaN(a) ? NaN : a === 0 ? 1 : 0;
    }
    case 'and':
    case 'or': {
      const a = numOf(x.a), b = numOf(x.b);
      if (a === UNKNOWN || b === UNKNOWN) return UNKNOWN;
      const ta = Number.isNaN(a) ? null : a !== 0, tb = Number.isNaN(b) ? null : b !== 0;
      if (x.k === 'and') return ta === false || tb === false ? 0 : ta === null || tb === null ? NaN : 1;
      return ta === true || tb === true ? 1 : ta === null || tb === null ? NaN : 0;
    }
    case 'rel': {
      const a = ev(x.a), b = ev(x.b);
      if (a === UNKNOWN || b === UNKNOWN) return UNKNOWN;
      let c: number;
      if (typeof a === 'string') {
        const s = trimR(a), t = trimR(b as string);
        c = s < t ? -1 : s > t ? 1 : 0;
      } else {
        if (Number.isNaN(a) || Number.isNaN(b as number)) return NaN;
        c = a < (b as number) ? -1 : a > (b as number) ? 1 : 0;
      }
      const ok = { '=': c === 0, '~=': c !== 0, '<': c < 0, '<=': c <= 0, '>': c > 0, '>=': c >= 0 }[x.op];
      return ok ? 1 : 0;
    }
    case 'bin': {
      const a = numOf(x.a), b = numOf(x.b);
      if (a === UNKNOWN || b === UNKNOWN) return UNKNOWN;
      switch (x.op) {
        case '+':
          return fin(a + b);
        case '-':
          return fin(a - b);
        case '*':
          return a === 0 || b === 0 ? 0 : fin(a * b);
        case '/':
          if (a === 0) return b === 0 ? NaN : 0;
          return fin(a / b);
        case '**':
          if (Number.isNaN(a) || Number.isNaN(b)) return NaN;
          if (a === 0 && b <= 0) return NaN;
          return fin(a ** b);
      }
    }
    // falls through (unreachable)
    case 'call':
      return refCall(x as Extract<X, { k: 'call' }>, ds, i);
  }
}

function refCall(x: Extract<X, { k: 'call' }>, ds: Dataset, i: number): R {
  const ev = (y: X) => refEval(y, ds, i);
  const nums = x.args.map(ev);
  if (nums.some((v) => v === UNKNOWN)) return UNKNOWN;
  const a = nums[0] as number;
  const f1 = (fn: (v: number) => number) => (Number.isNaN(a) ? NaN : fin(fn(a)));
  switch (x.fn) {
    case 'ABS': return f1(Math.abs);
    case 'SQRT': return f1((v) => (v < 0 ? NaN : Math.sqrt(v)));
    case 'EXP': return f1(Math.exp);
    case 'LN': return f1((v) => (v <= 0 ? NaN : Math.log(v)));
    case 'LG10': return f1((v) => (v <= 0 ? NaN : Math.log10(v)));
    case 'SIN': return f1(Math.sin);
    case 'COS': return f1(Math.cos);
    case 'ARTAN': return f1(Math.atan);
    case 'ARSIN': return f1((v) => (Math.abs(v) > 1 ? NaN : Math.asin(v)));
    case 'ARCOS': return f1((v) => (Math.abs(v) > 1 ? NaN : Math.acos(v)));
    case 'RND': return round(a, nums.length > 1 ? (nums[1] as number) : 1, false);
    case 'TRUNC': return round(a, nums.length > 1 ? (nums[1] as number) : 1, true);
    case 'MOD': {
      const b = nums[1] as number;
      if (a === 0) return 0;
      if (Number.isNaN(a) || Number.isNaN(b) || b === 0) return NaN;
      return fin(a - b * Math.trunc(a / b));
    }
    case 'MEAN': case 'SUM': case 'SD': case 'VARIANCE': case 'CFVAR': case 'MIN': case 'MAX': {
      if (x.t === 's') {
        const vals = x.args.map((arg, k) => ({ s: nums[k] as string, miss: arg.k === 'svar' && isUserMissing(arg.v.missing, nums[k] as string) })).filter((o) => !o.miss).map((o) => trimR(o.s));
        const need = x.suffix ?? 1;
        if (vals.length < need || !vals.length) return '';
        return vals.reduce((p, c) => (x.fn === 'MIN' ? (c < p ? c : p) : c > p ? c : p));
      }
      const vals = (nums as number[]).filter((v) => !Number.isNaN(v));
      const need = x.suffix ?? (['SD', 'VARIANCE', 'CFVAR'].includes(x.fn) ? 2 : 1);
      if (vals.length < need) return NaN;
      const sum = vals.reduce((p, c) => p + c, 0);
      if (x.fn === 'SUM') return fin(sum);
      if (x.fn === 'MEAN') return fin(sum / vals.length);
      if (x.fn === 'MIN') return Math.min(...vals);
      if (x.fn === 'MAX') return Math.max(...vals);
      const mean = sum / vals.length;
      const variance = vals.reduce((p, c) => p + (c - mean) ** 2, 0) / (vals.length - 1);
      if (x.fn === 'VARIANCE') return fin(variance);
      if (x.fn === 'SD') return fin(Math.sqrt(variance));
      return mean === 0 ? NaN : fin(Math.sqrt(variance) / mean);
    }
    case 'NVALID':
    case 'NMISS': {
      let miss = 0;
      x.args.forEach((arg, k) => {
        if (arg.k === 'var') {
          const raw = (ds.columns[arg.v.id] as Float64Array)[i];
          if (Number.isNaN(raw) || isUserMissing(arg.v.missing, raw)) miss++;
        } else if (Number.isNaN(nums[k] as number)) miss++;
      });
      return x.fn === 'NMISS' ? miss : x.args.length - miss;
    }
    case 'MISSING':
    case 'SYSMIS':
    case 'VALUE': {
      const arg = x.args[0];
      if (arg.k === 'var') {
        const raw = (ds.columns[arg.v.id] as Float64Array)[i];
        if (x.fn === 'VALUE') return raw;
        if (x.fn === 'SYSMIS') return Number.isNaN(raw) ? 1 : 0;
        return Number.isNaN(raw) || isUserMissing(arg.v.missing, raw) ? 1 : 0;
      }
      if (x.fn === 'VALUE') return UNKNOWN; // VALUE() needs a variable: the generator avoids this
      return Number.isNaN(a) ? 1 : 0;
    }
    case 'ANY': {
      if (Number.isNaN(a)) return NaN;
      return (nums.slice(1) as number[]).some((v) => v === a) ? 1 : 0;
    }
    case 'RANGE': {
      if (Number.isNaN(a)) return NaN;
      for (let k = 1; k < nums.length; k += 2) if (a >= (nums[k] as number) && a <= (nums[k + 1] as number)) return 1;
      return 0;
    }
    case 'LENGTH':
      return trimR(nums[0] as string).length;
    case 'CHAR.INDEX': {
      const needle = nums[1] as string;
      return needle ? (nums[0] as string).indexOf(needle) + 1 : 0;
    }
    case 'CONCAT':
      return (nums as string[]).join('');
    case 'UPCASE':
      return (nums[0] as string).toUpperCase();
    case 'LOWER':
      return (nums[0] as string).toLowerCase();
    case 'LTRIM':
      return (nums[0] as string).replace(/^ +/, '');
    case 'RTRIM':
      return (nums[0] as string).replace(/ +$/, '');
    case 'SUBSTR': {
      const s = nums[0] as string;
      const pos = Math.trunc(nums[1] as number);
      if (!Number.isFinite(pos) || pos < 1 || pos > s.length) return '';
      if (nums.length < 3) return s.slice(pos - 1);
      const len = Math.trunc(nums[2] as number);
      if (!Number.isFinite(len) || len < 0) return '';
      return s.slice(pos - 1, pos - 1 + len);
    }
    case 'REPLACE': {
      const [s, from, to] = nums as string[];
      return from ? s.split(from).join(to) : s;
    }
    case 'VALUELABEL': {
      const arg = x.args[0];
      if (arg.k !== 'var' && arg.k !== 'svar') return UNKNOWN;
      const raw = ds.columns[arg.v.id][i];
      return valueLabelFor(arg.v, raw) ?? '';
    }
    default:
      return UNKNOWN; // dates, STRING(): checked for type and crashes only
  }
}

/** Random token soup for parser robustness (may or may not be valid). */
export function tokenSoup(rng: Rng, ds: Dataset): string {
  const names = ds.variables.map((v) => v.name);
  const toks = [
    ...names.slice(0, 6), '(', ')', '(', ')', ',', '+', '-', '*', '/', '**', '=', '<>', '~=', '>=', '<=', '<', '>', 'AND', 'OR', 'NOT', '&', '|', '~', '!',
    '1', '2.5', '.5', '1.', '1e3', '1e', '1e+', "'txt'", '"q"', "'unterminated", 'MEAN', 'MEAN.2', 'SUM.9', 'SD.1', 'ABS', 'RND', 'CONCAT', 'SUBSTR', 'VALUE', 'MISSING', 'TO', 'q1 TO q9',
    '$SYSMIS', '$CASENUM', '$TIME', '$FOO', 'XDATE.YEAR', 'DATE.DMY', 'NUMBER', 'STRING', 'F8.2', 'Fx', 'ANY', 'RANGE', 'LAG', 'UNIFORM', '@', '#', '?', ';', ':', '[', ']', '{', '}',
    '\u0000', '\t', '\n', 'পুরুষ', '𝒳', '\uD800', '.', '..', '...', 'EQ', 'NE', 'GT', 'BY', 'WITH', 'ALL',
  ];
  const n = rng.int(1, 12);
  return Array.from({ length: n }, () => rng.pick(toks)).join(rng.bool(0.7) ? ' ' : '');
}
