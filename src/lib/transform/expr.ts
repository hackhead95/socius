// SPSS COMPUTE-compatible expression language: lexer + parser producing an AST.
// Evaluation (with SPSS missing-value semantics) lives in evaluate.ts.

export class ExprError extends Error {
  /** 0-based character offset where the problem starts, and where it ends (exclusive). */
  pos: number;
  end: number;
  constructor(message: string, pos: number, end: number = pos + 1) {
    super(message);
    this.pos = pos;
    this.end = Math.max(end, pos + 1);
  }
}

export type TokKind = 'num' | 'str' | 'ident' | 'op' | 'lparen' | 'rparen' | 'comma' | 'eof';

export interface Token {
  kind: TokKind;
  /** Operator text (normalised: EQ -> '=', & -> 'AND' ...), identifier text, or string value. */
  text: string;
  num?: number;
  pos: number;
  end: number;
}

const WORD_OPS: Record<string, string> = {
  EQ: '=', NE: '~=', LT: '<', LE: '<=', GT: '>', GE: '>=', AND: 'AND', OR: 'OR', NOT: 'NOT',
};

const IDENT_START = /[A-Za-z@#$À-￿]/;
const IDENT_CHAR = /[A-Za-z0-9_.@#$À-￿]/;

export function tokenize(src: string): Token[] {
  const toks: Token[] = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      i++;
      continue;
    }
    const start = i;
    // Numbers: 12, 1.5, .5, 1e3, 1.5E-2
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      while (i < n && /[0-9]/.test(src[i])) i++;
      if (src[i] === '.' && /[0-9]/.test(src[i + 1] ?? '')) {
        i++;
        while (i < n && /[0-9]/.test(src[i])) i++;
      } else if (src[i] === '.' && !IDENT_CHAR.test(src[i + 1] ?? '')) {
        // "1." is a valid number in SPSS
        i++;
      }
      if ((src[i] === 'e' || src[i] === 'E') && /[-+0-9]/.test(src[i + 1] ?? '')) {
        let j = i + 1;
        if (src[j] === '+' || src[j] === '-') j++;
        if (/[0-9]/.test(src[j] ?? '')) {
          i = j;
          while (i < n && /[0-9]/.test(src[i])) i++;
        }
      }
      const text = src.slice(start, i);
      toks.push({ kind: 'num', text, num: Number(text), pos: start, end: i });
      continue;
    }
    if (c === "'" || c === '"') {
      i++;
      let val = '';
      for (;;) {
        if (i >= n) throw new ExprError('This text is missing its closing quote.', start, n);
        if (src[i] === c) {
          if (src[i + 1] === c) {
            val += c;
            i += 2;
            continue;
          }
          i++;
          break;
        }
        val += src[i++];
      }
      toks.push({ kind: 'str', text: val, pos: start, end: i });
      continue;
    }
    if (IDENT_START.test(c)) {
      while (i < n && IDENT_CHAR.test(src[i])) i++;
      // A trailing period ends a command in SPSS; it is not part of the name.
      let end = i;
      while (end > start + 1 && src[end - 1] === '.') end--;
      const text = src.slice(start, end);
      i = end;
      const up = text.toUpperCase();
      if (WORD_OPS[up]) toks.push({ kind: 'op', text: WORD_OPS[up], pos: start, end });
      else toks.push({ kind: 'ident', text, pos: start, end });
      continue;
    }
    const two = src.slice(i, i + 2);
    if (two === '**' || two === '<=' || two === '>=' || two === '<>' || two === '~=' || two === '!=' || two === '==') {
      const text = two === '<>' || two === '!=' ? '~=' : two === '==' ? '=' : two;
      toks.push({ kind: 'op', text, pos: start, end: i + 2 });
      i += 2;
      continue;
    }
    if ('+-*/=<>'.includes(c)) {
      toks.push({ kind: 'op', text: c, pos: start, end: i + 1 });
      i++;
      continue;
    }
    if (c === '&') { toks.push({ kind: 'op', text: 'AND', pos: start, end: i + 1 }); i++; continue; }
    if (c === '|') { toks.push({ kind: 'op', text: 'OR', pos: start, end: i + 1 }); i++; continue; }
    if (c === '~' || c === '!') { toks.push({ kind: 'op', text: 'NOT', pos: start, end: i + 1 }); i++; continue; }
    if (c === '(') { toks.push({ kind: 'lparen', text: '(', pos: start, end: i + 1 }); i++; continue; }
    if (c === ')') { toks.push({ kind: 'rparen', text: ')', pos: start, end: i + 1 }); i++; continue; }
    if (c === ',') { toks.push({ kind: 'comma', text: ',', pos: start, end: i + 1 }); i++; continue; }
    if (c === '.' && src.slice(i + 1).trim() === '') {
      // Command terminator at the very end ("x + 1.") is allowed.
      i = n;
      continue;
    }
    throw new ExprError(`Unexpected character "${c}".`, start, start + 1);
  }
  toks.push({ kind: 'eof', text: '', pos: n, end: n });
  return toks;
}

export type Node =
  | { k: 'num'; v: number; pos: number; end: number }
  | { k: 'str'; v: string; pos: number; end: number }
  | { k: 'ident'; name: string; pos: number; end: number }
  | { k: 'range'; from: string; to: string; pos: number; end: number } // "a TO d" inside function args
  | { k: 'un'; op: '-' | '+' | 'NOT'; a: Node; pos: number; end: number }
  | { k: 'bin'; op: string; a: Node; b: Node; pos: number; end: number; opPos: number }
  | { k: 'call'; name: string; args: Node[]; pos: number; end: number; nameEnd: number };

const REL = new Set(['=', '~=', '<', '<=', '>', '>=']);

/**
 * Limits that keep the recursive parser, the compiler and the evaluator well inside the browser's
 * call stack. Hand-written or generated SPSS syntax stays far below them; beyond them the user gets
 * an ExprError that says what to do instead of a raw "Maximum call stack size exceeded".
 */
export const EXPR_LIMITS = {
  /** Parentheses, function calls and signs (-, +, NOT) inside one another. */
  nesting: 100,
  /** Operators applied one after another in one chain (a + b + c ... has one level per +). */
  depth: 500,
  /** Characters in one expression. */
  length: 100_000,
} as const;

const TOO_DEEP = `This expression is nested too deeply (more than ${EXPR_LIMITS.nesting} parentheses, functions or signs inside one another). Remove extra parentheses or signs, or split the calculation into several Compute steps.`;

/** Parse an expression. Throws ExprError with the position of the problem. */
export function parse(src: string): Node {
  if (!src.trim()) throw new ExprError('Type an expression.', 0, 1);
  if (src.length > EXPR_LIMITS.length)
    throw new ExprError(`This expression is ${src.length.toLocaleString('en-US')} characters long; the limit is ${EXPR_LIMITS.length.toLocaleString('en-US')}. Split it into several Compute steps.`, EXPR_LIMITS.length, src.length);
  const toks = tokenize(src);
  let p = 0;
  /** Current nesting of parentheses, calls and signs (see EXPR_LIMITS.nesting). */
  let nest = 0;
  const enter = (t: Token) => {
    if (++nest > EXPR_LIMITS.nesting) throw new ExprError(TOO_DEEP, t.pos, t.end);
  };
  const peek = () => toks[p];
  const next = () => toks[p++];

  const describe = (t: Token) =>
    t.kind === 'eof' ? 'the end of the expression' : t.kind === 'str' ? `the text '${t.text}'` : `"${src.slice(t.pos, t.end)}"`;

  function expectRparen(open: Token) {
    const t = peek();
    if (t.kind !== 'rparen') {
      if (t.kind === 'eof') throw new ExprError('A closing parenthesis ")" is missing.', open.pos, src.length);
      throw new ExprError(`Expected ")" but found ${describe(t)}.`, t.pos, t.end);
    }
    return next();
  }

  function parseOr(): Node {
    let a = parseAnd();
    while (peek().kind === 'op' && peek().text === 'OR') {
      const op = next();
      const b = parseAnd();
      a = { k: 'bin', op: 'OR', a, b, pos: a.pos, end: b.end, opPos: op.pos };
    }
    return a;
  }
  function parseAnd(): Node {
    let a = parseNot();
    while (peek().kind === 'op' && peek().text === 'AND') {
      const op = next();
      const b = parseNot();
      a = { k: 'bin', op: 'AND', a, b, pos: a.pos, end: b.end, opPos: op.pos };
    }
    return a;
  }
  function parseNot(): Node {
    if (peek().kind === 'op' && peek().text === 'NOT') {
      const op = next();
      enter(op);
      const a = parseNot();
      nest--;
      return { k: 'un', op: 'NOT', a, pos: op.pos, end: a.end };
    }
    return parseRel();
  }
  function parseRel(): Node {
    let a = parseAdd();
    while (peek().kind === 'op' && REL.has(peek().text)) {
      const op = next();
      const b = parseAdd();
      a = { k: 'bin', op: op.text, a, b, pos: a.pos, end: b.end, opPos: op.pos };
    }
    return a;
  }
  function parseAdd(): Node {
    let a = parseMul();
    while (peek().kind === 'op' && (peek().text === '+' || peek().text === '-')) {
      const op = next();
      const b = parseMul();
      a = { k: 'bin', op: op.text, a, b, pos: a.pos, end: b.end, opPos: op.pos };
    }
    return a;
  }
  function parseMul(): Node {
    let a = parseUnary();
    while (peek().kind === 'op' && (peek().text === '*' || peek().text === '/')) {
      const op = next();
      const b = parseUnary();
      a = { k: 'bin', op: op.text, a, b, pos: a.pos, end: b.end, opPos: op.pos };
    }
    return a;
  }
  function parseUnary(): Node {
    const t = peek();
    if (t.kind === 'op' && (t.text === '-' || t.text === '+')) {
      next();
      enter(t);
      const a = parseUnary();
      nest--;
      return { k: 'un', op: t.text as '-' | '+', a, pos: t.pos, end: a.end };
    }
    return parsePow();
  }
  // Exponentiation binds tighter than unary minus (-2**2 = -4) and is evaluated left to right,
  // as in SPSS. The exponent itself may carry a sign (2**-1).
  function parsePow(): Node {
    let a = parsePrimary();
    while (peek().kind === 'op' && peek().text === '**') {
      const op = next();
      let b: Node;
      const t = peek();
      if (t.kind === 'op' && (t.text === '-' || t.text === '+')) {
        next();
        const inner = parsePrimary();
        b = { k: 'un', op: t.text as '-' | '+', a: inner, pos: t.pos, end: inner.end };
      } else b = parsePrimary();
      a = { k: 'bin', op: '**', a, b, pos: a.pos, end: b.end, opPos: op.pos };
    }
    return a;
  }
  function parsePrimary(): Node {
    const t = next();
    switch (t.kind) {
      case 'num':
        return { k: 'num', v: t.num!, pos: t.pos, end: t.end };
      case 'str':
        return { k: 'str', v: t.text, pos: t.pos, end: t.end };
      case 'lparen': {
        enter(t);
        const e = parseOr();
        expectRparen(t);
        nest--;
        return e;
      }
      case 'ident': {
        if (peek().kind === 'lparen') {
          const open = next();
          enter(open);
          const args: Node[] = [];
          if (peek().kind !== 'rparen') {
            for (;;) {
              args.push(parseArg());
              if (peek().kind === 'comma') {
                next();
                continue;
              }
              break;
            }
          }
          const close = expectRparen(open);
          nest--;
          return { k: 'call', name: t.text.toUpperCase(), args, pos: t.pos, end: close.end, nameEnd: t.end };
        }
        return { k: 'ident', name: t.text, pos: t.pos, end: t.end };
      }
      case 'eof':
        throw new ExprError('The expression ends too early. Something is missing here.', Math.max(0, src.length - 1), src.length);
      case 'rparen':
        throw new ExprError('There is a ")" without a matching "(" or a value is missing before it.', t.pos, t.end);
      case 'comma':
        throw new ExprError('Unexpected comma. Commas only separate function arguments.', t.pos, t.end);
      default:
        throw new ExprError(`A value or variable was expected, but found ${describe(t)}.`, t.pos, t.end);
    }
  }
  // Function argument: expression, or "var1 TO var2" (a list of adjacent variables).
  function parseArg(): Node {
    const t = peek();
    const t2 = toks[p + 1];
    const t3 = toks[p + 2];
    if (t.kind === 'ident' && t2?.kind === 'ident' && t2.text.toUpperCase() === 'TO' && t3?.kind === 'ident') {
      p += 3;
      return { k: 'range', from: t.text, to: t3.text, pos: t.pos, end: t3.end };
    }
    return parseOr();
  }

  const root = parseOr();
  const t = peek();
  if (t.kind !== 'eof') {
    if (t.kind === 'rparen') throw new ExprError('There is a ")" without a matching "(".', t.pos, t.end);
    if (t.kind === 'ident' || t.kind === 'num' || t.kind === 'str')
      throw new ExprError(`An operator (such as + or AND) is missing before ${describe(t)}.`, t.pos, t.end);
    throw new ExprError(`Unexpected ${describe(t)}.`, t.pos, t.end);
  }
  checkDepth(root);
  return root;
}

/** Children of a node (for the iterative depth check). */
function children(n: Node): Node[] {
  return n.k === 'un' ? [n.a] : n.k === 'bin' ? [n.a, n.b] : n.k === 'call' ? n.args : [];
}

/**
 * Reject trees too deep for the recursive compiler and evaluator (a sum of thousands of terms is a
 * chain thousands of levels deep). Iterative, so the check itself cannot overflow.
 */
function checkDepth(root: Node): void {
  const stack: Array<[Node, number]> = [[root, 1]];
  while (stack.length) {
    const [n, d] = stack.pop()!;
    if (d > EXPR_LIMITS.depth) {
      throw new ExprError(
        `This expression is too long to calculate in one step (more than ${EXPR_LIMITS.depth} operations in a chain). For long lists of variables use SUM(q1 TO q500) or MEAN(q1 TO q500), or split the calculation into several Compute steps.`,
        n.pos,
        n.end,
      );
    }
    for (const c of children(n)) stack.push([c, d + 1]);
  }
}
