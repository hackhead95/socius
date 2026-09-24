// Thin adapter over the TypeScript compiler API that ships with the installed `typescript` package.
//
// TypeScript 7 (the native Go compiler) exposes its API as `typescript/unstable/sync`: it spawns the
// bundled tsgo binary, loads tsconfig.json and hands back lazily decoded AST nodes with the familiar
// property names (moduleSpecifier, importClause, statements...). Everything else in scripts/map talks to
// the AST only through this file, so an API change in a future TypeScript release is fixed here.
//
// Parsing is purely local and deterministic: no network, no LLM, nothing leaves the machine.

import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);

let api;
let K; // SyntaxKind enum
let NAMES; // kind number -> canonical name (enum aliases such as FirstStatement are skipped)
let computeLineStarts;
let skipTrivia;

async function loadTs() {
  if (K) return;
  const ast = await import('typescript/unstable/ast');
  K = ast.SyntaxKind;
  NAMES = [];
  for (const [name, v] of Object.entries(K)) {
    if (typeof v !== 'number' || /^(First|Last)/.test(name) || name === 'Count') continue;
    if (NAMES[v] === undefined) NAMES[v] = name;
  }
  computeLineStarts = ast.computeLineStarts;
  skipTrivia = ast.skipTrivia;
  const sync = await import('typescript/unstable/sync');
  api = sync.API;
}

export function tsVersion() {
  try {
    return require('typescript/package.json').version;
  } catch {
    return 'unknown';
  }
}

/** Load the project described by <root>/tsconfig.json. Returns { files, sourceFile(abs), close }. */
export async function loadProject(root) {
  await loadTs();
  const client = new api({ cwd: root });
  const snap = client.updateSnapshot({ openProject: path.join(root, 'tsconfig.json') });
  const project = snap.getProjects()[0];
  if (!project) throw new Error('TypeScript did not load a project from tsconfig.json');
  const names = project.program.getSourceFileNames().filter((f) => f.startsWith(root + path.sep) && !f.includes(`${path.sep}node_modules${path.sep}`));
  return {
    files: names.sort(),
    sourceFile: (abs) => (existsSync(abs) ? project.program.getSourceFile(abs) : undefined),
    close: () => client.close(),
  };
}

export function SK() {
  return K;
}

export const kindName = (n) => NAMES[n.kind];

/** Recursively visit nodes; return false from cb to skip a node's children. */
export function walk(node, cb) {
  const visit = (n) => {
    if (cb(n) === false) return;
    n.forEachChild(visit);
  };
  visit(node);
}

export function children(node) {
  const out = [];
  node.forEachChild((c) => {
    out.push(c);
  });
  return out;
}

/** Per-file helpers bound to the source text. */
export class FileText {
  constructor(sf) {
    this.sf = sf;
    this.text = sf.text;
    this.lines = computeLineStarts(this.text);
  }
  start(n) {
    return skipTrivia(this.text, n.pos);
  }
  src(n) {
    return this.text.slice(this.start(n), n.end);
  }
  line(n) {
    const pos = typeof n === 'number' ? n : this.start(n);
    let lo = 0;
    let hi = this.lines.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.lines[mid] <= pos) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  }
}

// ---------- small node predicates ----------

export const is = new Proxy(
  {},
  {
    get(_, name) {
      return (n) => !!n && NAMES[n.kind] === name;
    },
  },
);

/** Name of a declaration / property name node as a string (identifier, string literal, private name). */
export function nameText(n) {
  if (!n) return undefined;
  const k = NAMES[n.kind];
  if (k === 'Identifier' || k === 'PrivateIdentifier' || k === 'StringLiteral' || k === 'NumericLiteral' || k === 'NoSubstitutionTemplateLiteral') return n.text;
  if (k === 'ComputedPropertyName') {
    const e = n.expression;
    if (e && (NAMES[e.kind] === 'StringLiteral' || NAMES[e.kind] === 'NoSubstitutionTemplateLiteral')) return e.text;
  }
  return undefined;
}

export function hasModifier(n, mod) {
  const mods = n.modifiers;
  if (!mods) return false;
  for (const m of mods) if (NAMES[m.kind] === mod) return true;
  return false;
}

/** Strip parentheses, `as`, `satisfies`, `!` and type assertions. */
export function unwrap(n) {
  let cur = n;
  for (;;) {
    if (!cur) return cur;
    const k = NAMES[cur.kind];
    if (k === 'ParenthesizedExpression' || k === 'AsExpression' || k === 'SatisfiesExpression' || k === 'NonNullExpression' || k === 'TypeAssertionExpression' || k === 'PartiallyEmittedExpression') cur = cur.expression;
    else return cur;
  }
}

export const FUNCTION_KINDS = new Set(['ArrowFunction', 'FunctionExpression', 'FunctionDeclaration', 'MethodDeclaration', 'GetAccessor', 'SetAccessor', 'Constructor']);

export function isFunctionLike(n) {
  return !!n && FUNCTION_KINDS.has(NAMES[n.kind]);
}

/** Node kinds that only carry types; walking skips them when collecting value references. */
export const TYPE_ONLY_KINDS = new Set([
  'TypeReference', 'TypeLiteral', 'UnionType', 'IntersectionType', 'FunctionType', 'ConstructorType', 'ArrayType', 'TupleType', 'TypeQuery',
  'TypeOperator', 'IndexedAccessType', 'MappedType', 'LiteralType', 'TypeParameter', 'ConditionalType', 'ParenthesizedType', 'ImportType',
  'TypePredicate', 'InferType', 'TemplateLiteralType', 'TypeAliasDeclaration', 'InterfaceDeclaration', 'ExpressionWithTypeArguments',
  'OptionalType', 'RestType', 'NamedTupleMember', 'ThisType',
]);

export function enclosingFunction(n) {
  let cur = n.parent;
  while (cur) {
    if (isFunctionLike(cur)) return cur;
    cur = cur.parent;
  }
  return undefined;
}

export function ancestors(n) {
  const out = [];
  let cur = n.parent;
  while (cur) {
    out.push(cur);
    cur = cur.parent;
  }
  return out;
}

/** The function body's returned expression for `x => expr`, `x => { return expr }`. */
export function returnedExpression(fn) {
  if (!fn) return undefined;
  const body = fn.body;
  if (!body) return undefined;
  if (NAMES[body.kind] !== 'Block') return body;
  for (const st of body.statements) if (NAMES[st.kind] === 'ReturnStatement') return st.expression;
  return undefined;
}

export function paramNames(fn) {
  const out = [];
  if (!fn?.parameters) return out;
  for (const p of fn.parameters) out.push(p.name);
  return out;
}
