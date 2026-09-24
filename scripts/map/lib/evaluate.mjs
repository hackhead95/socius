// A tiny static evaluator for literal-ish TypeScript expressions: strings, numbers, arrays, object
// literals, template strings, identifiers bound to top-level consts (across files, through imports),
// spreads, `.map(cb)` / `.filter(cb)` over static arrays, `a === b`, `a ? b : c`, `??`, `||`, `&&`.
// Anything else evaluates to UNKNOWN. Functions evaluate to a Fn marker that keeps the AST node.
//
// Objects and arrays produced from literals carry hidden `__node` / `__file` so extractors can go back
// to the source (for example from a ProcedureDef object to its `run` function).

import { is, kindName, nameText, returnedExpression, unwrap } from './ast.mjs';

export const UNKNOWN = Symbol('unknown');

export class Fn {
  constructor(node, file, env) {
    this.node = node;
    this.file = file;
    this.env = env;
  }
}

function hide(obj, node, file) {
  Object.defineProperty(obj, '__node', { value: node, enumerable: false });
  Object.defineProperty(obj, '__file', { value: file, enumerable: false });
  return obj;
}

export class Evaluator {
  constructor(index, opts = {}) {
    this.index = index;
    this.cache = new Map();
    this.stack = new Set();
    /** identifier name -> value used when an identifier cannot be resolved (e.g. mod -> 'Mod'). */
    this.fallback = opts.fallback ?? {};
  }

  /** Evaluate top-level declaration `name` of file `rel`. */
  evalDecl(rel, name) {
    const key = `${rel}#${name}`;
    if (this.cache.has(key)) return this.cache.get(key);
    if (this.stack.has(key)) return UNKNOWN;
    const f = this.index.files.get(rel);
    const d = f?.decls.get(name);
    let v = UNKNOWN;
    this.stack.add(key);
    try {
      if (d) {
        if (d.kind === 'function' || d.kind === 'component' || d.kind === 'hook') v = new Fn(d.fn ?? d.node, rel, {});
        else if (d.init && !d.mutable) v = this.eval(d.init, f, {});
      } else if (f) {
        const r = this.index.resolveExport(rel, name);
        if (r && !(r.file === rel && r.name === name)) v = this.evalDecl(r.file, r.name);
      }
    } finally {
      this.stack.delete(key);
    }
    this.cache.set(key, v);
    return v;
  }

  evalIdent(name, f, env) {
    if (Object.prototype.hasOwnProperty.call(env, name)) return env[name];
    if (name === 'undefined') return undefined;
    if (name === 'Infinity') return Infinity;
    if (name === 'NaN') return NaN;
    const r = this.index.resolveLocal(f, name);
    if (r && r.file && r.name !== '*') return this.evalDecl(r.file, r.name);
    if (Object.prototype.hasOwnProperty.call(this.fallback, name)) return this.fallback[name];
    return UNKNOWN;
  }

  /** Evaluate an expression node in file info `f` with local environment `env`. */
  eval(node, f, env = {}) {
    const n = unwrap(node);
    if (!n) return UNKNOWN;
    const k = kindName(n);
    switch (k) {
      case 'StringLiteral':
      case 'NoSubstitutionTemplateLiteral':
        return n.text;
      case 'NumericLiteral':
        return Number(n.text);
      case 'TrueKeyword':
        return true;
      case 'FalseKeyword':
        return false;
      case 'NullKeyword':
        return null;
      case 'Identifier':
        return this.evalIdent(n.text, f, env);
      case 'TemplateExpression': {
        let s = n.head.text;
        let partial = false;
        for (const span of n.templateSpans) {
          const v = this.eval(span.expression, f, env);
          if (v === UNKNOWN || (typeof v === 'object' && v !== null)) {
            s += '{…}';
            partial = true;
          } else s += String(v);
          s += span.literal.text;
        }
        return partial ? new PartialString(s) : s;
      }
      case 'PrefixUnaryExpression': {
        const v = this.eval(n.operand, f, env);
        if (v === UNKNOWN) return UNKNOWN;
        const op = kindName({ kind: n.operator });
        if (op === 'MinusToken' && typeof v === 'number') return -v;
        if (op === 'ExclamationToken') return !truthy(v);
        return UNKNOWN;
      }
      case 'ArrayLiteralExpression': {
        const out = [];
        for (const el of n.elements) {
          if (is.SpreadElement(el)) {
            const v = this.eval(el.expression, f, env);
            if (Array.isArray(v)) out.push(...v);
            else out.push(UNKNOWN);
          } else if (is.OmittedExpression(el)) out.push(undefined);
          else out.push(this.eval(el, f, env));
        }
        return hide(out, n, f.rel);
      }
      case 'ObjectLiteralExpression': {
        const out = {};
        for (const p of n.properties) {
          const pk = kindName(p);
          if (pk === 'PropertyAssignment') {
            const key = nameText(p.name);
            if (key !== undefined) out[key] = this.eval(p.initializer, f, env);
          } else if (pk === 'ShorthandPropertyAssignment') {
            out[p.name.text] = this.evalIdent(p.name.text, f, env);
          } else if (pk === 'SpreadAssignment') {
            const v = this.eval(p.expression, f, env);
            if (v && typeof v === 'object' && !(v instanceof Fn)) Object.assign(out, v);
          } else if (pk === 'MethodDeclaration' || pk === 'GetAccessor') {
            const key = nameText(p.name);
            if (key !== undefined) out[key] = new Fn(p, f.rel, env);
          }
        }
        return hide(out, n, f.rel);
      }
      case 'ArrowFunction':
      case 'FunctionExpression':
        return new Fn(n, f.rel, env);
      case 'PropertyAccessExpression': {
        const obj = this.eval(n.expression, f, env);
        const name = n.name.text;
        if (Array.isArray(obj) && name === 'length') return obj.length;
        if (obj && typeof obj === 'object' && !(obj instanceof Fn) && !(obj instanceof PartialString) && name in obj) return obj[name];
        if (typeof obj === 'string' && name === 'length') return obj.length;
        return UNKNOWN;
      }
      case 'ElementAccessExpression': {
        const obj = this.eval(n.expression, f, env);
        const key = this.eval(n.argumentExpression, f, env);
        if (obj && typeof obj === 'object' && (typeof key === 'string' || typeof key === 'number') && key in obj) return obj[key];
        return UNKNOWN;
      }
      case 'ConditionalExpression': {
        const c = this.eval(n.condition, f, env);
        if (c === UNKNOWN) return UNKNOWN;
        return truthy(c) ? this.eval(n.whenTrue, f, env) : this.eval(n.whenFalse, f, env);
      }
      case 'BinaryExpression': {
        const op = kindName(n.operatorToken);
        const a = this.eval(n.left, f, env);
        // unknown left side: fall back to the static default on the right (labels like `undo?.label ?? 'Undo'`)
        if (op === 'QuestionQuestionToken') return a === UNKNOWN ? this.eval(n.right, f, env) : a ?? this.eval(n.right, f, env);
        if (op === 'BarBarToken') return a === UNKNOWN ? (this.staticFallback ? this.eval(n.right, f, env) : UNKNOWN) : truthy(a) ? a : this.eval(n.right, f, env);
        if (op === 'AmpersandAmpersandToken') return a === UNKNOWN ? UNKNOWN : !truthy(a) ? a : this.eval(n.right, f, env);
        const b = this.eval(n.right, f, env);
        if (a === UNKNOWN || b === UNKNOWN) return UNKNOWN;
        switch (op) {
          case 'PlusToken':
            if (a instanceof PartialString || b instanceof PartialString) return new PartialString(String(a) + String(b));
            if (typeof a === 'object' || typeof b === 'object') return UNKNOWN;
            return a + b;
          case 'EqualsEqualsEqualsToken':
          case 'EqualsEqualsToken':
            return a === b;
          case 'ExclamationEqualsEqualsToken':
          case 'ExclamationEqualsToken':
            return a !== b;
          case 'MinusToken':
            return typeof a === 'number' && typeof b === 'number' ? a - b : UNKNOWN;
          case 'AsteriskToken':
            return typeof a === 'number' && typeof b === 'number' ? a * b : UNKNOWN;
          default:
            return UNKNOWN;
        }
      }
      case 'CallExpression':
        return this.evalCall(n, f, env);
      default:
        return UNKNOWN;
    }
  }

  evalCall(n, f, env) {
    const callee = unwrap(n.expression);
    if (is.PropertyAccessExpression(callee)) {
      const method = callee.name.text;
      if (method === 'map' || method === 'filter' || method === 'flatMap' || method === 'concat' || method === 'slice' || method === 'join' || method === 'includes') {
        const arr = this.eval(callee.expression, f, env);
        if (!Array.isArray(arr)) return UNKNOWN;
        if (method === 'concat') {
          const extra = n.arguments.map((a) => this.eval(a, f, env));
          return hide(arr.concat(...extra), n, f.rel);
        }
        if (method === 'slice') {
          const a = n.arguments[0] ? this.eval(n.arguments[0], f, env) : 0;
          const b = n.arguments[1] ? this.eval(n.arguments[1], f, env) : undefined;
          return typeof a === 'number' ? arr.slice(a, typeof b === 'number' ? b : undefined) : UNKNOWN;
        }
        if (method === 'join') {
          const sep = n.arguments[0] ? this.eval(n.arguments[0], f, env) : ',';
          return arr.every((x) => typeof x === 'string' || typeof x === 'number') && typeof sep === 'string' ? arr.join(sep) : UNKNOWN;
        }
        if (method === 'includes') {
          const v = this.eval(n.arguments[0], f, env);
          return v === UNKNOWN ? UNKNOWN : arr.includes(v);
        }
        const cbNode = n.arguments[0] && unwrap(n.arguments[0]);
        if (method === 'filter' && cbNode && is.Identifier(cbNode) && cbNode.text === 'Boolean') return hide(arr.filter((x) => x !== UNKNOWN && truthy(x)), n, f.rel);
        if (!cbNode || !(is.ArrowFunction(cbNode) || is.FunctionExpression(cbNode))) return UNKNOWN;
        const out = [];
        arr.forEach((el, i) => {
          const env2 = bindParams(cbNode, [el, i], env);
          const body = returnedExpression(cbNode);
          const v = body ? this.eval(body, f, env2) : UNKNOWN;
          if (method === 'map') out.push(v);
          else if (method === 'flatMap') Array.isArray(v) ? out.push(...v) : out.push(v);
          else if (v === UNKNOWN || truthy(v)) out.push(el); // filter: keep when unknown (conservative)
        });
        return hide(out, n, f.rel);
      }
      if (method === 'toUpperCase' || method === 'toLowerCase' || method === 'trim') {
        const s = this.eval(callee.expression, f, env);
        return typeof s === 'string' ? s[method]() : UNKNOWN;
      }
      if (method === 'fromEntries' && is.Identifier(callee.expression) && callee.expression.text === 'Object') {
        const arr = this.eval(n.arguments[0], f, env);
        if (!Array.isArray(arr)) return UNKNOWN;
        const out = {};
        for (const e of arr) if (Array.isArray(e) && (typeof e[0] === 'string' || typeof e[0] === 'number')) out[e[0]] = e[1];
        return out;
      }
    }
    // Local helper like modKey() -> fallback by callee name
    if (is.Identifier(callee) && Object.prototype.hasOwnProperty.call(this.fallback, `${callee.text}()`)) return this.fallback[`${callee.text}()`];
    return UNKNOWN;
  }
}

/** A template string with parts that could not be evaluated (shown as {…}). */
export class PartialString {
  constructor(s) {
    this.s = s;
  }
  toString() {
    return this.s;
  }
}

export function truthy(v) {
  if (v instanceof PartialString) return true;
  return !!v;
}

export function str(v) {
  if (typeof v === 'string') return v;
  if (v instanceof PartialString) return v.s;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return undefined;
}

/** Bind parameters of fn to values (identifier params and simple object/array destructuring). */
export function bindParams(fn, values, env = {}) {
  const out = { ...env };
  (fn.parameters ?? []).forEach((p, i) => bindName(p.name, values[i], out));
  return out;
}

export function bindName(nameNode, value, out) {
  if (!nameNode) return;
  if (is.Identifier(nameNode)) {
    out[nameNode.text] = value === undefined ? UNKNOWN : value;
    return;
  }
  if (is.ObjectBindingPattern(nameNode)) {
    for (const el of nameNode.elements) {
      const key = el.propertyName ? nameText(el.propertyName) : is.Identifier(el.name) ? el.name.text : undefined;
      const v = value && typeof value === 'object' && key !== undefined && key in value ? value[key] : UNKNOWN;
      bindName(el.name, v, out);
    }
    return;
  }
  if (is.ArrayBindingPattern(nameNode)) {
    nameNode.elements.forEach((el, i) => {
      if (is.BindingElement(el)) bindName(el.name, Array.isArray(value) ? value[i] : UNKNOWN, out);
    });
  }
}
