// Compiles an expression AST into a fast per-row evaluator with SPSS missing-value semantics:
// - arithmetic with a missing operand gives system-missing (NaN), except 0*missing = 0 and 0/missing = 0;
// - user-missing values of variables count as missing (VALUE() and MISSING() see them);
// - statistical functions (MEAN, SUM, ...) skip missing arguments; MEAN.n requires n valid ones;
// - comparisons with a missing operand are missing; "missing OR true" is true, "missing AND false" false;
// - any non-finite numeric result (overflow, division by zero, SQRT(-1)) becomes system-missing.

import type { Dataset, Variable } from '../../core/types';
import { dateToSpssSeconds, isUserMissing, spssSecondsToDate } from '../../core/data';
import { ExprError, parse, type Node } from './expr';
import { FUNCTION_DOCS } from './functions';

export type ExprType = 'num' | 'str';

interface NumC { type: 'num'; f: (i: number) => number }
interface StrC { type: 'str'; f: (i: number) => string }
type C = NumC | StrC;

export interface CompiledExpr {
  type: ExprType;
  /** Value for row i (0-based). Numbers use NaN for system-missing. */
  evaluate: (i: number) => number | string;
  /** Variable ids the expression reads. */
  varIds: string[];
  /** Longest string literal/result width hint (for new string variables). */
  widthHint: number;
}

const DAY = 86400;
const EPOCH_MS = Date.UTC(1582, 9, 14);

const fin = (x: number) => (Number.isFinite(x) ? x : NaN);
const trimR = (s: string) => s.replace(/\s+$/, '');

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...new Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  return d[m][n];
}

function closest(name: string, options: string[]): string | null {
  let best: string | null = null;
  let bestD = Infinity;
  const lower = name.toLowerCase();
  for (const o of options) {
    const d = levenshtein(lower, o.toLowerCase());
    if (d < bestD) {
      bestD = d;
      best = o;
    }
  }
  return best && bestD <= Math.max(1, Math.floor(name.length / 3)) ? best : null;
}

/** Round half away from zero with SPSS-style fuzz, so 2.4999999999 (from float error) rounds like 2.5. */
export function spssRound(x: number, mult = 1): number {
  if (Number.isNaN(x) || Number.isNaN(mult) || mult === 0) return NaN;
  const r = x / mult;
  const a = Math.abs(r);
  const fuzz = a * 2 ** -47;
  return fin(Math.sign(r) * Math.floor(a + 0.5 + fuzz) * mult);
}

export function spssTrunc(x: number, mult = 1): number {
  if (Number.isNaN(x) || Number.isNaN(mult) || mult === 0) return NaN;
  const r = x / mult;
  const a = Math.abs(r);
  const fuzz = a * 2 ** -47;
  return fin(Math.sign(r) * Math.floor(a + fuzz) * mult) || 0;
}

/** Seconds since the SPSS epoch for a calendar date; NaN if the date does not exist. */
export function spssDate(y: number, m: number, d: number, lenient = false): number {
  if (![y, m, d].every(Number.isFinite)) return NaN;
  if (!lenient && (m < 1 || m > 12 || d < 1 || d > 31 || !Number.isInteger(m) || !Number.isInteger(d))) return NaN;
  const dt = new Date(0);
  dt.setUTCFullYear(Math.trunc(y), Math.trunc(m) - 1, Math.trunc(d));
  dt.setUTCHours(0, 0, 0, 0);
  if (!lenient && (dt.getUTCMonth() !== Math.trunc(m) - 1 || dt.getUTCDate() !== Math.trunc(d))) return NaN;
  const sec = (dt.getTime() - EPOCH_MS) / 1000;
  return sec < 0 ? NaN : sec;
}

interface Fmt { kind: 'F' | 'N' | 'COMMA' | 'DOLLAR' | 'PCT' | 'E'; w: number; d: number }

function parseFormatSpec(node: Node): Fmt {
  let text = '';
  if (node.k === 'ident') text = node.name;
  else if (node.k === 'str') text = node.v;
  else if (node.k === 'num') text = String(node.v);
  const m = /^(F|N|COMMA|DOLLAR|PCT|E)?(\d+)(?:\.(\d+))?$/i.exec(text.trim());
  if (!m) throw new ExprError(`"${text}" is not a number format. Use for example F8.2 or N5.`, node.pos, node.end);
  const kind = ((m[1] ?? 'F').toUpperCase()) as Fmt['kind'];
  const w = Number(m[2]);
  const d = m[3] ? Number(m[3]) : 0;
  if (w < 1 || w > 40 || d >= w + (kind === 'F' ? 1 : 0) || d > 16)
    throw new ExprError(`The format "${text}" has an impossible width or number of decimals.`, node.pos, node.end);
  return { kind, w, d };
}

/** SPSS NUMBER(s, Fw.d): implied decimals apply when the text has no decimal point. */
export function numberFromString(s: string, fmt: Fmt): number {
  let t = s.slice(0, fmt.w).trim();
  if (fmt.kind === 'COMMA' || fmt.kind === 'DOLLAR') t = t.replace(/[,$]/g, '');
  if (fmt.kind === 'PCT') t = t.replace(/%$/, '');
  if (t === '' || t === '.') return NaN;
  if (!/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(t)) return NaN;
  let x = Number(t);
  if (!t.includes('.') && !/[eE]/.test(t) && fmt.d > 0) x = x / 10 ** fmt.d;
  return fin(x);
}

/** SPSS STRING(x, fmt): right-aligned in the format width; N pads with zeros; overflow gives asterisks. */
export function stringFromNumber(x: number, fmt: Fmt): string {
  if (Number.isNaN(x)) return '.'.padStart(fmt.w);
  let s: string;
  switch (fmt.kind) {
    case 'N':
      s = x < 0 ? '' : String(Math.round(x)).padStart(fmt.w, '0');
      break;
    case 'COMMA':
      s = x.toLocaleString('en-US', { minimumFractionDigits: fmt.d, maximumFractionDigits: fmt.d });
      break;
    case 'DOLLAR':
      s = '$' + x.toLocaleString('en-US', { minimumFractionDigits: fmt.d, maximumFractionDigits: fmt.d });
      break;
    case 'PCT':
      s = x.toFixed(fmt.d) + '%';
      break;
    case 'E':
      s = x.toExponential(Math.max(0, fmt.d)).toUpperCase();
      break;
    default:
      s = spssRound(x, 10 ** -fmt.d).toFixed(fmt.d);
  }
  if (s.length > fmt.w || s === '') return '*'.repeat(fmt.w);
  return s.padStart(fmt.w);
}

const STAT_FUNCS: Record<string, number> = { MEAN: 1, SUM: 1, SD: 2, VARIANCE: 2, CFVAR: 2, MIN: 1, MAX: 1 };
const KNOWN = new Set(FUNCTION_DOCS.map((f) => f.name));

export interface CompileOptions {
  /** Row count used for $CASENUM etc. Defaults to ds.nCases. */
  now?: Date;
}

/** Compile `src` against the dataset's dictionary. Throws ExprError (with position) on any problem. */
export function compileExpression(ds: Dataset, src: string, opts: CompileOptions = {}): CompiledExpr {
  const ast = parse(src);
  const byName = new Map<string, Variable>();
  for (const v of ds.variables) byName.set(v.name.toLowerCase(), v);
  const used = new Set<string>();
  let widthHint = 1;
  const now = opts.now ?? new Date();

  function lookupVar(name: string, pos: number, end: number): Variable {
    const v = byName.get(name.toLowerCase());
    if (v) {
      used.add(v.id);
      return v;
    }
    const upper = name.toUpperCase();
    if (upper === 'TO') throw new ExprError('TO can only be used inside a function, e.g. MEAN(q1 TO q5).', pos, end);
    const sugg = closest(name, ds.variables.map((x) => x.name));
    throw new ExprError(`There is no variable named "${name}".${sugg ? ` Did you mean ${sugg}?` : ''}`, pos, end);
  }

  function varRef(v: Variable): C {
    const col = ds.columns[v.id];
    if (v.type === 'string') {
      const sc = col as string[];
      return { type: 'str', f: (i) => sc[i] ?? '' };
    }
    const nc = col as Float64Array;
    const spec = v.missing;
    if (!spec.discrete.length && !spec.range) return { type: 'num', f: (i) => nc[i] };
    return {
      type: 'num',
      f: (i) => {
        const x = nc[i];
        return isUserMissing(spec, x) ? NaN : x;
      },
    };
  }

  function expandRange(n: Extract<Node, { k: 'range' }>): Variable[] {
    const a = lookupVar(n.from, n.pos, n.pos + n.from.length);
    const b = lookupVar(n.to, n.end - n.to.length, n.end);
    const ia = ds.variables.indexOf(a);
    const ib = ds.variables.indexOf(b);
    if (ib < ia) throw new ExprError(`${b.name} comes before ${a.name} in the file, so "${a.name} TO ${b.name}" is empty.`, n.pos, n.end);
    const list = ds.variables.slice(ia, ib + 1);
    for (const v of list) used.add(v.id);
    return list;
  }

  function num(n: Node, what = 'This'): NumC {
    const c = comp(n);
    if (c.type !== 'num') throw new ExprError(`${what} needs a number, but this is text.`, n.pos, n.end);
    return c;
  }
  function str(n: Node, what = 'This'): StrC {
    const c = comp(n);
    if (c.type !== 'str') throw new ExprError(`${what} needs text, but this is a number. Put text in quotes, or convert with STRING(x, F8.0).`, n.pos, n.end);
    return c;
  }

  /** Arguments of statistical functions: expressions or "a TO d" ranges. */
  function argList(args: Node[]): Array<{ c: C; node: Node; v?: Variable }> {
    const out: Array<{ c: C; node: Node; v?: Variable }> = [];
    for (const a of args) {
      if (a.k === 'range') for (const v of expandRange(a)) out.push({ c: varRef(v), node: a, v });
      else if (a.k === 'ident' && !a.name.startsWith('$')) {
        const v = lookupVar(a.name, a.pos, a.end);
        out.push({ c: varRef(v), node: a, v });
      } else out.push({ c: comp(a), node: a });
    }
    return out;
  }

  function comp(n: Node): C {
    switch (n.k) {
      case 'num':
        return { type: 'num', f: () => n.v };
      case 'str':
        widthHint = Math.max(widthHint, n.v.length);
        return { type: 'str', f: () => n.v };
      case 'range':
        throw new ExprError('"a TO b" lists can only be used inside functions such as MEAN or SUM.', n.pos, n.end);
      case 'ident': {
        const up = n.name.toUpperCase();
        if (up === '$SYSMIS') return { type: 'num', f: () => NaN };
        if (up === '$CASENUM') return { type: 'num', f: (i) => i + 1 };
        if (up === '$TIME') {
          const t = dateToSpssSeconds(now);
          return { type: 'num', f: () => t };
        }
        const v = lookupVar(n.name, n.pos, n.end);
        const c = varRef(v);
        if (c.type === 'str') widthHint = Math.max(widthHint, v.width);
        return c;
      }
      case 'un': {
        if (n.op === 'NOT') {
          const a = num(n.a, 'NOT');
          return { type: 'num', f: (i) => { const x = a.f(i); return Number.isNaN(x) ? NaN : x === 0 ? 1 : 0; } };
        }
        const a = num(n.a, n.op === '-' ? 'A minus sign' : 'A plus sign');
        return n.op === '-' ? { type: 'num', f: (i) => -a.f(i) } : a;
      }
      case 'bin':
        return compBin(n);
      case 'call':
        return compCall(n);
    }
  }

  function compBin(n: Extract<Node, { k: 'bin' }>): C {
    const op = n.op;
    if (op === 'AND' || op === 'OR') {
      const a = num(n.a, op), b = num(n.b, op);
      if (op === 'AND')
        return {
          type: 'num',
          f: (i) => {
            const x = a.f(i), y = b.f(i);
            if (x === 0 || y === 0) return 0;
            if (Number.isNaN(x) || Number.isNaN(y)) return NaN;
            return 1;
          },
        };
      return {
        type: 'num',
        f: (i) => {
          const x = a.f(i), y = b.f(i);
          if ((!Number.isNaN(x) && x !== 0) || (!Number.isNaN(y) && y !== 0)) return 1;
          if (Number.isNaN(x) || Number.isNaN(y)) return NaN;
          return 0;
        },
      };
    }
    const a = comp(n.a), b = comp(n.b);
    if (['=', '~=', '<', '<=', '>', '>='].includes(op)) {
      if (a.type !== b.type)
        throw new ExprError(
          a.type === 'str'
            ? 'You are comparing text with a number. Put the number in quotes, or compare with a number variable.'
            : 'You are comparing a number with text. Remove the quotes, or compare with a text variable.',
          n.opPos, n.opPos + op.length,
        );
      if (a.type === 'str') {
        const fa = a.f, fb = (b as StrC).f;
        const cmp = (i: number) => {
          const x = trimR(fa(i)), y = trimR(fb(i));
          return x < y ? -1 : x > y ? 1 : 0;
        };
        const test = relTest(op);
        return { type: 'num', f: (i) => (test(cmp(i)) ? 1 : 0) };
      }
      const fa = a.f, fb = (b as NumC).f;
      const test = relTest(op);
      return {
        type: 'num',
        f: (i) => {
          const x = fa(i), y = fb(i);
          if (Number.isNaN(x) || Number.isNaN(y)) return NaN;
          return test(x < y ? -1 : x > y ? 1 : 0) ? 1 : 0;
        },
      };
    }
    // arithmetic
    const opName: Record<string, string> = { '+': 'Addition', '-': 'Subtraction', '*': 'Multiplication', '/': 'Division', '**': 'A power' };
    if (a.type !== 'num' || b.type !== 'num') {
      const bad = a.type !== 'num' ? n.a : n.b;
      throw new ExprError(
        `${opName[op]} needs numbers, but this is text.${op === '+' ? ' To join texts use CONCAT(a, b).' : ''}`,
        bad.pos, bad.end,
      );
    }
    const fa = a.f, fb = b.f;
    switch (op) {
      case '+': return { type: 'num', f: (i) => fin(fa(i) + fb(i)) };
      case '-': return { type: 'num', f: (i) => fin(fa(i) - fb(i)) };
      case '*': return { type: 'num', f: (i) => { const x = fa(i), y = fb(i); if (x === 0 || y === 0) return 0; return fin(x * y); } };
      case '/': return { type: 'num', f: (i) => { const x = fa(i); if (x === 0) { const y = fb(i); return y === 0 ? NaN : 0; } return fin(x / fb(i)); } };
      case '**': return { type: 'num', f: (i) => { const x = fa(i), y = fb(i); if (Number.isNaN(x) || Number.isNaN(y)) return NaN; if (x === 0 && y <= 0) return NaN; return fin(x ** y); } };
    }
    throw new ExprError(`Unknown operator ${op}.`, n.opPos);
  }

  function relTest(op: string): (c: number) => boolean {
    switch (op) {
      case '=': return (c) => c === 0;
      case '~=': return (c) => c !== 0;
      case '<': return (c) => c < 0;
      case '<=': return (c) => c <= 0;
      case '>': return (c) => c > 0;
      default: return (c) => c >= 0;
    }
  }

  function arity(n: Extract<Node, { k: 'call' }>, name: string, min: number, max: number) {
    const k = n.args.length;
    if (k < min || k > max) {
      const want = min === max ? `${min}` : max === Infinity ? `at least ${min}` : `${min} to ${max}`;
      throw new ExprError(`${name} takes ${want} argument${want === '1' ? '' : 's'}, but ${k} ${k === 1 ? 'was' : 'were'} given.`, n.pos, n.end);
    }
  }

  function num1(n: Extract<Node, { k: 'call' }>, name: string, fn: (x: number) => number): NumC {
    arity(n, name, 1, 1);
    const a = num(n.args[0], name);
    return { type: 'num', f: (i) => { const x = a.f(i); return Number.isNaN(x) ? NaN : fin(fn(x)); } };
  }

  function compCall(n: Extract<Node, { k: 'call' }>): C {
    let name = n.name;
    let minValid: number | null = null;
    const dm = /^(.*)\.(\d+)$/.exec(name);
    if (dm && STAT_FUNCS[dm[1]] !== undefined) {
      name = dm[1];
      minValid = Number(dm[2]);
    }
    if (!KNOWN.has(name)) {
      if (dm && KNOWN.has(dm[1]))
        throw new ExprError(`${dm[1]} does not accept a ".n" suffix. Only MEAN, SUM, SD, VARIANCE, CFVAR, MIN and MAX do.`, n.pos, n.nameEnd);
      const sugg = closest(name, [...KNOWN]);
      throw new ExprError(`Unknown function ${name}.${sugg ? ` Did you mean ${sugg}?` : ''}`, n.pos, n.nameEnd);
    }
    switch (name) {
      case 'ABS': return num1(n, name, Math.abs);
      case 'SQRT': return num1(n, name, (x) => (x < 0 ? NaN : Math.sqrt(x)));
      case 'EXP': return num1(n, name, Math.exp);
      case 'LN': return num1(n, name, (x) => (x <= 0 ? NaN : Math.log(x)));
      case 'LG10': return num1(n, name, (x) => (x <= 0 ? NaN : Math.log10(x)));
      case 'SIN': return num1(n, name, Math.sin);
      case 'COS': return num1(n, name, Math.cos);
      case 'TAN': return num1(n, name, Math.tan);
      case 'ARTAN': return num1(n, name, Math.atan);
      case 'ARSIN': return num1(n, name, (x) => (Math.abs(x) > 1 ? NaN : Math.asin(x)));
      case 'ARCOS': return num1(n, name, (x) => (Math.abs(x) > 1 ? NaN : Math.acos(x)));
      case 'RND':
      case 'TRUNC': {
        arity(n, name, 1, 3);
        const a = num(n.args[0], name);
        const m = n.args[1] ? num(n.args[1], name) : null;
        const fn = name === 'RND' ? spssRound : spssTrunc;
        return { type: 'num', f: (i) => fn(a.f(i), m ? m.f(i) : 1) };
      }
      case 'MOD': {
        arity(n, name, 2, 2);
        const a = num(n.args[0], name), b = num(n.args[1], name);
        return {
          type: 'num',
          f: (i) => {
            const x = a.f(i);
            if (x === 0) return 0;
            const y = b.f(i);
            if (Number.isNaN(x) || Number.isNaN(y) || y === 0) return NaN;
            return fin(x - y * Math.trunc(x / y));
          },
        };
      }
      case 'MEAN': case 'SUM': case 'SD': case 'VARIANCE': case 'CFVAR': case 'MIN': case 'MAX':
        return compStat(n, name, minValid);
      case 'NVALID':
      case 'NMISS': {
        arity(n, name, 1, Infinity);
        const items = argList(n.args);
        const preds = items.map(({ c, v }) => {
          if (v) {
            const col = ds.columns[v.id];
            const spec = v.missing;
            if (v.type === 'string') { const sc = col as string[]; return (i: number) => isUserMissing(spec, sc[i] ?? ''); }
            const nc = col as Float64Array;
            return (i: number) => Number.isNaN(nc[i]) || isUserMissing(spec, nc[i]);
          }
          if (c.type === 'num') return (i: number) => Number.isNaN(c.f(i));
          return () => false;
        });
        const wantValid = name === 'NVALID';
        return {
          type: 'num',
          f: (i) => {
            let k = 0;
            for (const p of preds) if (p(i) !== wantValid) k++;
            return k;
          },
        };
      }
      case 'MISSING':
      case 'SYSMIS': {
        arity(n, name, 1, 1);
        const arg = n.args[0];
        if (arg.k === 'ident' && !arg.name.startsWith('$')) {
          const v = lookupVar(arg.name, arg.pos, arg.end);
          const col = ds.columns[v.id];
          if (v.type === 'string') {
            const sc = col as string[];
            if (name === 'SYSMIS') return { type: 'num', f: () => 0 };
            return { type: 'num', f: (i) => (isUserMissing(v.missing, sc[i] ?? '') ? 1 : 0) };
          }
          const nc = col as Float64Array;
          if (name === 'SYSMIS') return { type: 'num', f: (i) => (Number.isNaN(nc[i]) ? 1 : 0) };
          return { type: 'num', f: (i) => (Number.isNaN(nc[i]) || isUserMissing(v.missing, nc[i]) ? 1 : 0) };
        }
        const c = comp(arg);
        if (c.type === 'str') return { type: 'num', f: () => 0 };
        return { type: 'num', f: (i) => (Number.isNaN(c.f(i)) ? 1 : 0) };
      }
      case 'VALUE': {
        arity(n, name, 1, 1);
        const arg = n.args[0];
        if (arg.k !== 'ident' || arg.name.startsWith('$')) throw new ExprError('VALUE needs a variable name.', arg.pos, arg.end);
        const v = lookupVar(arg.name, arg.pos, arg.end);
        const col = ds.columns[v.id];
        if (v.type === 'string') { const sc = col as string[]; return { type: 'str', f: (i) => sc[i] ?? '' }; }
        const nc = col as Float64Array;
        return { type: 'num', f: (i) => nc[i] };
      }
      case 'ANY': {
        arity(n, name, 2, Infinity);
        const x = comp(n.args[0]);
        const vals = n.args.slice(1).map((a) => {
          const c = comp(a);
          if (c.type !== x.type) throw new ExprError('All values in ANY must be the same kind (all numbers or all text) as the first argument.', a.pos, a.end);
          return c;
        });
        if (x.type === 'str')
          return { type: 'num', f: (i) => { const s = trimR(x.f(i)); return vals.some((c) => trimR((c as StrC).f(i)) === s) ? 1 : 0; } };
        return {
          type: 'num',
          f: (i) => {
            const v = x.f(i);
            if (Number.isNaN(v)) return NaN;
            for (const c of vals) if ((c as NumC).f(i) === v) return 1;
            return 0;
          },
        };
      }
      case 'RANGE': {
        arity(n, name, 3, Infinity);
        if ((n.args.length - 1) % 2 !== 0) throw new ExprError('RANGE needs pairs of low and high values after the first argument.', n.pos, n.end);
        const x = comp(n.args[0]);
        const bounds = n.args.slice(1).map((a) => {
          const c = comp(a);
          if (c.type !== x.type) throw new ExprError('The limits in RANGE must be the same kind (numbers or text) as the first argument.', a.pos, a.end);
          return c;
        });
        if (x.type === 'str')
          return {
            type: 'num',
            f: (i) => {
              const s = trimR(x.f(i));
              for (let k = 0; k < bounds.length; k += 2) if (s >= trimR((bounds[k] as StrC).f(i)) && s <= trimR((bounds[k + 1] as StrC).f(i))) return 1;
              return 0;
            },
          };
        return {
          type: 'num',
          f: (i) => {
            const v = x.f(i);
            if (Number.isNaN(v)) return NaN;
            for (let k = 0; k < bounds.length; k += 2) if (v >= (bounds[k] as NumC).f(i) && v <= (bounds[k + 1] as NumC).f(i)) return 1;
            return 0;
          },
        };
      }
      // ---- text ----
      case 'CONCAT': {
        arity(n, name, 1, Infinity);
        const parts = n.args.map((a) => str(a, 'CONCAT'));
        return { type: 'str', f: (i) => { let s = ''; for (const p of parts) s += p.f(i); return s; } };
      }
      case 'SUBSTR': {
        arity(n, name, 2, 3);
        const s = str(n.args[0], 'SUBSTR'), p = num(n.args[1], 'SUBSTR'), l = n.args[2] ? num(n.args[2], 'SUBSTR') : null;
        return {
          type: 'str',
          f: (i) => {
            const t = s.f(i);
            const pos = Math.trunc(p.f(i));
            if (!Number.isFinite(pos) || pos < 1 || pos > t.length) return '';
            if (!l) return t.slice(pos - 1);
            const len = Math.trunc(l.f(i));
            if (!Number.isFinite(len) || len < 0) return '';
            return t.slice(pos - 1, pos - 1 + len);
          },
        };
      }
      case 'UPCASE': { arity(n, name, 1, 1); const s = str(n.args[0], name); return { type: 'str', f: (i) => s.f(i).toUpperCase() }; }
      case 'LOWER': { arity(n, name, 1, 1); const s = str(n.args[0], name); return { type: 'str', f: (i) => s.f(i).toLowerCase() }; }
      case 'LENGTH': { arity(n, name, 1, 1); const s = str(n.args[0], name); return { type: 'num', f: (i) => trimR(s.f(i)).length }; }
      case 'LTRIM':
      case 'RTRIM': {
        arity(n, name, 1, 2);
        const s = str(n.args[0], name);
        const ch = n.args[1] ? str(n.args[1], name) : null;
        return {
          type: 'str',
          f: (i) => {
            const t = s.f(i);
            const c = ch ? ch.f(i).charAt(0) || ' ' : ' ';
            if (name === 'LTRIM') { let k = 0; while (k < t.length && t[k] === c) k++; return t.slice(k); }
            let k = t.length; while (k > 0 && t[k - 1] === c) k--; return t.slice(0, k);
          },
        };
      }
      case 'REPLACE': {
        arity(n, name, 3, 4);
        const s = str(n.args[0], name), a = str(n.args[1], name), b = str(n.args[2], name);
        const cnt = n.args[3] ? num(n.args[3], name) : null;
        return {
          type: 'str',
          f: (i) => {
            const t = s.f(i), from = a.f(i), to = b.f(i);
            if (!from) return t;
            let limit = cnt ? Math.trunc(cnt.f(i)) : Infinity;
            if (Number.isNaN(limit)) limit = Infinity;
            let out = '', k = 0, done = 0;
            for (;;) {
              const j = done < limit ? t.indexOf(from, k) : -1;
              if (j < 0) { out += t.slice(k); break; }
              out += t.slice(k, j) + to;
              k = j + from.length;
              done++;
            }
            return out;
          },
        };
      }
      case 'CHAR.INDEX': {
        arity(n, name, 2, 3);
        const s = str(n.args[0], name), a = str(n.args[1], name);
        const div = n.args[2] ? num(n.args[2], name) : null;
        return {
          type: 'num',
          f: (i) => {
            const t = s.f(i), needle = a.f(i);
            if (!div) return needle ? t.indexOf(needle) + 1 : 0;
            // With a divisor, the needle is split into pieces of that length; the first found piece counts.
            const d = Math.trunc(div.f(i));
            if (!(d > 0) || needle.length % d !== 0) return NaN;
            let best = 0;
            for (let k = 0; k < needle.length; k += d) {
              const j = t.indexOf(needle.slice(k, k + d));
              if (j >= 0 && (best === 0 || j + 1 < best)) best = j + 1;
            }
            return best;
          },
        };
      }
      case 'NUMBER': {
        arity(n, name, 2, 2);
        const s = str(n.args[0], name);
        const fmt = parseFormatSpec(n.args[1]);
        return { type: 'num', f: (i) => numberFromString(s.f(i), fmt) };
      }
      case 'STRING': {
        arity(n, name, 2, 2);
        const x = num(n.args[0], name);
        const fmt = parseFormatSpec(n.args[1]);
        widthHint = Math.max(widthHint, fmt.w);
        return { type: 'str', f: (i) => stringFromNumber(x.f(i), fmt) };
      }
      // ---- dates ----
      case 'XDATE.YEAR': return dateNum(n, name, (d) => d.getUTCFullYear());
      case 'XDATE.MONTH': return dateNum(n, name, (d) => d.getUTCMonth() + 1);
      case 'XDATE.MDAY': return dateNum(n, name, (d) => d.getUTCDate());
      case 'XDATE.WKDAY': return dateNum(n, name, (d) => d.getUTCDay() + 1);
      case 'XDATE.QUARTER': return dateNum(n, name, (d) => Math.floor(d.getUTCMonth() / 3) + 1);
      case 'XDATE.JDAY': return dateNum(n, name, (d) => Math.floor((d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86400000) + 1);
      case 'XDATE.HOUR': return num1(n, name, (t) => Math.floor((((t % DAY) + DAY) % DAY) / 3600));
      case 'XDATE.MINUTE': return num1(n, name, (t) => Math.floor((((t % 3600) + 3600) % 3600) / 60));
      case 'XDATE.SECOND': return num1(n, name, (t) => ((t % 60) + 60) % 60);
      case 'XDATE.DATE': return num1(n, name, (t) => Math.floor(t / DAY) * DAY);
      case 'XDATE.TDAY': return num1(n, name, (t) => Math.floor(t / DAY));
      case 'DATE.DMY': {
        arity(n, name, 3, 3);
        const [d, m, y] = n.args.map((a) => num(a, name));
        return { type: 'num', f: (i) => spssDate(y.f(i), m.f(i), d.f(i)) };
      }
      case 'DATE.MDY': {
        arity(n, name, 3, 3);
        const [m, d, y] = n.args.map((a) => num(a, name));
        return { type: 'num', f: (i) => spssDate(y.f(i), m.f(i), d.f(i)) };
      }
      case 'DATE.MOYR': {
        arity(n, name, 2, 2);
        const [m, y] = n.args.map((a) => num(a, name));
        return { type: 'num', f: (i) => spssDate(y.f(i), m.f(i), 1) };
      }
      case 'YRMODA': {
        arity(n, name, 3, 3);
        const [y, m, d] = n.args.map((a) => num(a, name));
        return {
          type: 'num',
          f: (i) => {
            let yy = y.f(i);
            const mm = m.f(i), dd = d.f(i);
            if (![yy, mm, dd].every(Number.isFinite) || mm < 1 || mm > 13 || dd < 0 || dd > 31) return NaN;
            if (yy >= 0 && yy <= 99) yy += 1900;
            const s = spssDate(yy, mm, dd, true);
            return Number.isNaN(s) ? NaN : s / DAY;
          },
        };
      }
      case 'TIME.HMS': {
        arity(n, name, 1, 3);
        const parts = n.args.map((a) => num(a, name));
        const mult = [3600, 60, 1];
        return { type: 'num', f: (i) => { let t = 0; for (let k = 0; k < parts.length; k++) t += parts[k].f(i) * mult[k]; return fin(t); } };
      }
      case 'TIME.DAYS': return num1(n, name, (x) => x * DAY);
      case 'CTIME.DAYS': return num1(n, name, (t) => t / DAY);
      case 'CTIME.HOURS': return num1(n, name, (t) => t / 3600);
      case 'CTIME.MINUTES': return num1(n, name, (t) => t / 60);
      case 'DATEDIFF': {
        arity(n, name, 3, 3);
        const a = num(n.args[0], name), b = num(n.args[1], name);
        const u = n.args[2];
        const unit = (u.k === 'str' ? u.v : u.k === 'ident' ? u.name : '').toLowerCase().replace(/s$/, '');
        if (!['year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second'].includes(unit))
          throw new ExprError("The unit must be 'years', 'quarters', 'months', 'weeks', 'days', 'hours', 'minutes' or 'seconds'.", u.pos, u.end);
        return { type: 'num', f: (i) => dateDiff(a.f(i), b.f(i), unit) };
      }
    }
    throw new ExprError(`Unknown function ${name}.`, n.pos, n.nameEnd);
  }

  function dateNum(n: Extract<Node, { k: 'call' }>, name: string, fn: (d: Date) => number): NumC {
    arity(n, name, 1, 1);
    const a = num(n.args[0], name);
    return { type: 'num', f: (i) => { const t = a.f(i); return Number.isNaN(t) ? NaN : fn(spssSecondsToDate(t)); } };
  }

  function compStat(n: Extract<Node, { k: 'call' }>, name: string, minValid: number | null): C {
    arity(n, name, 1, Infinity);
    const items = argList(n.args);
    const dflt = STAT_FUNCS[name];
    if (minValid !== null) {
      if (minValid < dflt) throw new ExprError(`${name} needs at least ${dflt} valid values, so ${name}.${minValid} is not allowed.`, n.pos, n.nameEnd);
      if (minValid > items.length)
        throw new ExprError(`${name}.${minValid} asks for ${minValid} valid values but only ${items.length} argument${items.length === 1 ? ' is' : 's are'} listed.`, n.pos, n.nameEnd);
    }
    const need = minValid ?? dflt;
    const allStr = items.every((x) => x.c.type === 'str');
    if (allStr && (name === 'MIN' || name === 'MAX')) {
      const fs = items.map((x) => ({ f: (x.c as StrC).f, v: x.v }));
      return {
        type: 'str',
        f: (i) => {
          let best: string | null = null;
          let k = 0;
          for (const { f, v } of fs) {
            const s = f(i);
            if (v && isUserMissing(v.missing, s)) continue;
            k++;
            const t = trimR(s);
            if (best === null || (name === 'MIN' ? t < best : t > best)) best = t;
          }
          return k >= need && best !== null ? best : '';
        },
      };
    }
    for (const x of items)
      if (x.c.type !== 'num') throw new ExprError(`${name} needs numbers, but this is text.`, x.node.pos, x.node.end);
    const fs = items.map((x) => (x.c as NumC).f);
    const m = fs.length;
    const buf = new Float64Array(m);
    return {
      type: 'num',
      f: (i) => {
        let k = 0;
        for (let j = 0; j < m; j++) {
          const x = fs[j](i);
          if (!Number.isNaN(x)) buf[k++] = x;
        }
        if (k < need) return NaN;
        switch (name) {
          case 'SUM': { let s = 0; for (let j = 0; j < k; j++) s += buf[j]; return fin(s); }
          case 'MEAN': { let s = 0; for (let j = 0; j < k; j++) s += buf[j]; return fin(s / k); }
          case 'MIN': { let s = Infinity; for (let j = 0; j < k; j++) if (buf[j] < s) s = buf[j]; return s; }
          case 'MAX': { let s = -Infinity; for (let j = 0; j < k; j++) if (buf[j] > s) s = buf[j]; return s; }
          default: {
            let s = 0; for (let j = 0; j < k; j++) s += buf[j];
            const mean = s / k;
            let ss = 0; for (let j = 0; j < k; j++) ss += (buf[j] - mean) ** 2;
            const variance = ss / (k - 1);
            if (name === 'VARIANCE') return fin(variance);
            if (name === 'SD') return fin(Math.sqrt(variance));
            return mean === 0 ? NaN : fin(Math.sqrt(variance) / mean);
          }
        }
      },
    };
  }

  const root = comp(ast);
  const evaluate = root.f as (i: number) => number | string;
  return { type: root.type, evaluate, varIds: [...used], widthHint };
}

function dateDiff(a: number, b: number, unit: string): number {
  if (Number.isNaN(a) || Number.isNaN(b)) return NaN;
  const diff = a - b;
  const secUnits: Record<string, number> = { week: 7 * DAY, day: DAY, hour: 3600, minute: 60, second: 1 };
  if (secUnits[unit]) return Math.trunc(diff / secUnits[unit]);
  const da = spssSecondsToDate(a), db = spssSecondsToDate(b);
  const sign = diff < 0 ? -1 : 1;
  const [late, early] = sign > 0 ? [da, db] : [db, da];
  let months = (late.getUTCFullYear() - early.getUTCFullYear()) * 12 + (late.getUTCMonth() - early.getUTCMonth());
  const lateRest = late.getUTCDate() * DAY + (late.getTime() % 86400000) / 1000;
  const earlyRest = early.getUTCDate() * DAY + (early.getTime() % 86400000) / 1000;
  if (lateRest < earlyRest) months--;
  const per = unit === 'year' ? 12 : unit === 'quarter' ? 3 : 1;
  return sign * Math.floor(months / per);
}

/** Evaluate a compiled expression for every case into a new column. */
export function evaluateAll(c: CompiledExpr, n: number): Float64Array | string[] {
  if (c.type === 'num') {
    const out = new Float64Array(n);
    for (let i = 0; i < n; i++) out[i] = c.evaluate(i) as number;
    return out;
  }
  const out = new Array<string>(n);
  for (let i = 0; i < n; i++) out[i] = c.evaluate(i) as string;
  return out;
}

/** Convenience: true where a logical expression is true (1/non-zero and not missing). */
export function conditionMask(ds: Dataset, src: string): Uint8Array {
  const c = compileExpression(ds, src);
  if (c.type !== 'num') throw new ExprError('A condition must be a comparison or logical expression, not text.', 0, src.length);
  const m = new Uint8Array(ds.nCases);
  for (let i = 0; i < ds.nCases; i++) {
    const x = c.evaluate(i) as number;
    m[i] = !Number.isNaN(x) && x !== 0 ? 1 : 0;
  }
  return m;
}
