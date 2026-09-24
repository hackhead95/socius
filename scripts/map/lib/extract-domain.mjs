// Domain extractors: procedures, transforms, AI (providers, features, error codes, assistant tools,
// prompts), browser storage keys, the output model (block kinds, chart types, renderers, exporters),
// keyboard shortcuts (documented vs bound) and tests.

import { ancestors, is, isFunctionLike, kindName, nameText, unwrap, walk } from './ast.mjs';
import { Fn, UNKNOWN, str } from './evaluate.mjs';
import { modId, symId } from './graph.mjs';
import { storeKeyId } from './extract-store.mjs';
import { unionLiterals } from './extract-ui.mjs';

// ---------- shared helpers ----------

/** symId -> [{ to, how }] from the code index (value references only). */
export function buildAdjacency(index) {
  const adj = new Map();
  for (const f of index.files.values()) {
    for (const r of f.refs) {
      if (r.to.external || r.typeOnly) continue;
      const from = r.from === '<module>' ? modId(f.rel) : symId(f.rel, r.from);
      if (!adj.has(from)) adj.set(from, []);
      adj.get(from).push({ to: symId(r.to.file, r.to.name), how: r.how });
    }
  }
  return adj;
}

/** Breadth-first reach from `start` while `follow(symId)` is true. Returns { inside:Set, frontier:Set }. */
export function reach(adj, start, follow) {
  const inside = new Set();
  const frontier = new Set();
  const queue = [...start];
  while (queue.length) {
    const s = queue.shift();
    if (inside.has(s)) continue;
    inside.add(s);
    for (const e of adj.get(s) ?? []) {
      if (inside.has(e.to)) continue;
      if (follow(e.to)) queue.push(e.to);
      else frontier.add(e.to);
    }
  }
  return { inside, frontier };
}

export const fileOfSym = (id) => id.slice(4).split('#')[0];
export const nameOfSym = (id) => id.slice(4).split('#')[1];

function declNode(index, id) {
  const d = index.decl(fileOfSym(id), nameOfSym(id));
  return d ? { d, f: index.files.get(d.file) } : null;
}

/** All string texts inside a node (literals and template pieces). */
export function literalsOf(node) {
  const out = [];
  walk(node, (n) => {
    const k = kindName(n);
    if (k === 'StringLiteral' || k === 'NoSubstitutionTemplateLiteral' || k === 'TemplateHead' || k === 'TemplateMiddle' || k === 'TemplateTail') out.push(n.text);
  });
  return out;
}

const SYNTAX_CONTEXT = /syntax|^syn$|^syns?$|cmds?$|commands?$|^lines?$|spss/i;

/** Name of the nearest thing a literal is assigned to (property, variable, push target, += target, function). */
function contextName(n) {
  let cur = n;
  while (cur.parent) {
    const p = cur.parent;
    if (is.PropertyAssignment(p) && p.initializer === cur) return nameText(p.name) ?? '';
    if (is.VariableDeclaration(p) && p.initializer === cur && is.Identifier(p.name)) return p.name.text;
    if (is.BinaryExpression(p) && /EqualsToken$/.test(kindName(p.operatorToken)) && p.right === cur) {
      const l = unwrap(p.left);
      return is.Identifier(l) ? l.text : is.PropertyAccessExpression(l) ? l.name.text : '';
    }
    if (is.CallExpression(p) && p.arguments.includes(cur)) {
      const c = unwrap(p.expression);
      if (is.PropertyAccessExpression(c) && c.name.text === 'push') {
        const r = unwrap(c.expression);
        return is.Identifier(r) ? r.text : is.PropertyAccessExpression(r) ? r.name.text : '';
      }
      if (is.Identifier(c) && SYNTAX_CONTEXT.test(c.text)) return c.text;
    }
    if (isFunctionLike(p)) {
      const nm = p.name && is.Identifier(p.name) ? p.name.text : p.parent && is.VariableDeclaration(p.parent) && is.Identifier(p.parent.name) ? p.parent.name.text : '';
      return nm;
    }
    cur = p;
  }
  return '';
}

/** Literal texts inside a node that are assigned to something named like syntax (syntax, cmds, lines...). */
export function syntaxLiteralsOf(node) {
  const out = [];
  walk(node, (n) => {
    const k = kindName(n);
    if (k === 'StringLiteral' || k === 'NoSubstitutionTemplateLiteral') {
      if (SYNTAX_CONTEXT.test(contextName(n))) out.push(n.text);
    } else if (k === 'TemplateExpression') {
      if (SYNTAX_CONTEXT.test(contextName(n))) out.push(n.head.text, ...n.templateSpans.map((sp) => sp.literal.text));
      return undefined;
    }
    return undefined;
  });
  return out;
}

const SYNTAX_STOP = new Set(['APA', 'NOTE', 'CSV', 'SPSS', 'ID', 'OK', 'AI', 'N', 'NA', 'PDF', 'URL', 'HTML', 'UTF', 'JSON', 'SD', 'SE', 'CI', 'DF', 'NB', 'TODO', 'XLSX', 'DOCX', 'ASCII', 'GET', 'POST', 'AND', 'OR', 'NOT', 'TRUE', 'FALSE', 'NULL', 'BY', 'TO', 'WITH', 'INTO', 'THRU', 'ELSE', 'LO', 'HI', 'LOWEST', 'HIGHEST', 'MISSING', 'SYSMIS', 'SYS', 'ALL', 'IF', 'OFF', 'ON', 'THE', 'A', 'FILE', 'OUTFILE', 'MODE', 'BREAK', 'VARIABLES', 'TABLES', 'STATISTICS', 'CELLS', 'MEAN', 'SUM', 'RESET', 'LGT', 'LOG', 'MAX', 'MIN', 'LG', 'CHISQ', 'ALPHA', 'EQ', 'NE', 'LT', 'GT', 'LE', 'GE', 'KEY']);
/** SPSS commands that may appear alone on a line (their subcommands follow on the next lines). */
const KNOWN_COMMANDS = new Set(['FREQUENCIES', 'DESCRIPTIVES', 'EXAMINE', 'CROSSTABS', 'MEANS', 'T-TEST', 'ONEWAY', 'CORRELATIONS', 'NONPAR CORR', 'PARTIAL CORR', 'NPAR TESTS', 'REGRESSION', 'LOGISTIC', 'NOMREG', 'PLUM', 'RELIABILITY', 'FACTOR', 'GRAPH', 'GGRAPH', 'COMPUTE', 'RECODE', 'AUTORECODE', 'COUNT', 'RANK', 'AGGREGATE', 'EXECUTE', 'DATASET', 'SAVE', 'GET', 'STRING', 'NUMERIC', 'BEGIN', 'END']);
const TWO_WORD = new Set(['NONPAR', 'SORT', 'SELECT', 'ADD', 'MATCH', 'VALUE', 'VARIABLE', 'MISSING', 'SPLIT', 'DELETE', 'NPAR', 'USE', 'FILTER', 'WEIGHT', 'PARTIAL', 'DATA', 'SAVE', 'GET', 'FORMATS', 'APPLY', 'DO', 'END', 'COMPUTE', 'RECODE']);
const TWO_WORD_SECOND = new Set(['GPL', 'CASES', 'IF', 'FILES', 'LABELS', 'LEVEL', 'VALUES', 'FILE', 'TESTS', 'ALL', 'OFF', 'BY', 'CORR', 'ROLE', 'WIDTH', 'ALIGNMENT', 'DICTIONARY', 'REPEAT']);

/** SPSS-style command words at the start of a literal line (FREQUENCIES, SORT CASES, SELECT IF...). */
export function syntaxCommands(texts) {
  const out = new Set();
  for (const t of texts) {
    for (const raw of t.split(/\n/)) {
      const line = raw.trim();
      const m = line.match(/^([A-Z][A-Z-]{2,})(?:\s+([A-Z][A-Z-]+))?(?=[\s/.]|$)/);
      if (!m) continue;
      const w1 = m[1];
      if (SYNTAX_STOP.has(w1) || w1.length < 3) continue;
      // a bare word ("ENTER", "FIRST") is usually a keyword value; keep it only when it is a known command
      if (line.length === m[0].length && !KNOWN_COMMANDS.has(m[2] ? `${w1} ${m[2]}` : w1) && !KNOWN_COMMANDS.has(w1)) continue;
      let cmd = w1;
      if (m[2] && TWO_WORD.has(w1) && TWO_WORD_SECOND.has(m[2])) cmd = `${w1} ${m[2]}`;
      if (cmd === 'FILTER BY' || cmd === 'WEIGHT BY') cmd = w1;
      out.add(cmd);
    }
  }
  return [...out].sort();
}

// ---------- procedures ----------

export function extractProcedures(index, ev, g, adj) {
  const defs = new Map(); // id -> { id, menu, title, description, slots, options, file, decl }
  const unresolved = [];
  const add = (v, file, declName) => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return;
    const id = str(v.id);
    if (!id) return unresolved.push(`${file}#${declName}`);
    if (defs.has(id)) return;
    // the const that holds this object literal (the registry may only reference it through spreads)
    if (v.__file && v.__node) {
      const df = index.files.get(v.__file);
      for (const d of df?.decls.values() ?? []) {
        const init = d.init && unwrap(d.init);
        if (init && init.pos === v.__node.pos && init.end === v.__node.end) {
          declName = d.name;
          file = v.__file;
        }
      }
    }
    defs.set(id, {
      id,
      menu: str(v.menu) ?? '?',
      title: str(v.title) ?? id,
      description: str(v.description),
      guidance: str(v.guidance),
      slots: Array.isArray(v.slots) ? v.slots.filter((s) => s && typeof s === 'object').map((s) => ({ key: str(s.key), label: str(s.label), min: s.min, max: s.max === Infinity ? '∞' : s.max, types: Array.isArray(s.types) ? s.types.map(str) : undefined, measures: Array.isArray(s.measures) ? s.measures.map(str) : undefined })) : [],
      options: Array.isArray(v.options) ? v.options.filter((o) => o && typeof o === 'object').map((o) => ({ key: str(o.key), label: str(o.label), type: str(o.type), group: str(o.group), default: typeof o.default === 'object' ? undefined : o.default })) : [],
      file: v.__file ?? file,
      decl: declName,
      hasValidate: v.validate instanceof Fn,
    });
  };
  for (const f of index.files.values()) {
    if (f.isTest || !f.rel.startsWith('src/')) continue;
    for (const d of f.decls.values()) {
      if (d.kind !== 'const' || !is.VariableDeclaration(d.node) || !d.node.type) continue;
      const t = f.ft.src(d.node.type).replace(/\s/g, '');
      if (t === 'ProcedureDef') add(ev.evalDecl(f.rel, d.name), f.rel, d.name);
      else if (t === 'ProcedureDef[]' || t === 'Array<ProcedureDef>' || t === 'readonlyProcedureDef[]') {
        const arr = ev.evalDecl(f.rel, d.name);
        if (Array.isArray(arr)) {
          const lit = unwrap(d.init);
          arr.forEach((v, i) => {
            // find the declaring const for each element (identifier elements)
            let declName = d.name;
            let file = f.rel;
            const el = lit && is.ArrayLiteralExpression(lit) ? lit.elements[i] : null;
            if (el && is.Identifier(el)) {
              const r = index.resolveLocal(f, el.text);
              if (r && r.file) {
                declName = r.name;
                file = r.file;
              }
            }
            add(v, file, declName);
          });
        }
      }
    }
  }
  const procs = [...defs.values()].sort((a, b) => a.id.localeCompare(b.id));
  for (const p of procs) {
    const id = `procedure:${p.id}`;
    const impl = symId(p.file, p.decl);
    g.node(id, 'procedure', p.title, { file: p.file, area: 'procedures', menu: p.menu, procedureId: p.id, description: p.description });
    g.edge(id, impl, 'implemented-by');
    g.edge(id, `dialog:procedure:${p.id}`, 'configured-in');
    const { inside, frontier } = reach(adj, [impl], (s) => s.startsWith('sym:src/procedures/'));
    for (const s of frontier) {
      if (!s.startsWith('sym:src/')) continue;
      const n = g.get(s);
      if (!n || !['function', 'class', 'const', 'hook'].includes(n.type)) continue;
      g.edge(id, s, 'calls', { via: s.startsWith('sym:src/lib/stats/') ? 'stats' : undefined });
    }
    for (const s of inside) if (s !== impl && s.startsWith('sym:src/procedures/') && fileOfSym(s) !== p.file) g.edge(id, s, 'uses', { via: 'procedure helper' });
    // syntax from the def's own file
    const texts = [];
    for (const s of inside) {
      if (fileOfSym(s) !== p.file) continue;
      const dn = declNode(index, s);
      if (dn) texts.push(...syntaxLiteralsOf(dn.d.node));
    }
    p.syntax = syntaxCommands(texts);
    p.reached = inside;
    for (const c of p.syntax) {
      g.node(`syntax:${c}`, 'syntax', c, { area: 'syntax' });
      g.edge(id, `syntax:${c}`, 'generates-syntax');
    }
  }
  return { procs, unresolved };
}

// ---------- transforms ----------

export function extractTransforms(index, g, adj, routes, loggers) {
  const out = [];
  const tRoutes = routes.filter((r) => r.kind === 'transform' && !r.prefix);
  const byId = new Map();
  for (const r of tRoutes) {
    if (!byId.has(r.id)) byId.set(r.id, []);
    byId.get(r.id).push(r.component);
  }
  for (const [tid, comps] of [...byId.entries()].sort()) {
    const id = `transform:${tid}`;
    const first = comps[0];
    g.node(id, 'transform', tid, { file: fileOfSym(first), area: 'transforms' });
    g.edge(id, `dialog:transform:${tid}`, 'configured-in');
    const libCalls = new Set();
    const helpers = new Set();
    const texts = [];
    let logged = new Set();
    for (const c of comps) {
      const cf = fileOfSym(c);
      const { inside, frontier } = reach(adj, [c], (s) => fileOfSym(s) === cf);
      const lib = [...frontier].filter((s) => s.startsWith('sym:src/lib/'));
      const help = [...frontier].filter((s) => /^sym:src\/features\//.test(s) && !s.startsWith(`sym:${cf}#`));
      help.forEach((h) => helpers.add(h));
      // lib/transform functions: reach within lib/transform
      const deep = reach(adj, lib, (s) => s.startsWith('sym:src/lib/transform/'));
      for (const s of lib) libCalls.add(s);
      for (const s of [...inside, ...deep.inside]) {
        const dn = declNode(index, s);
        if (dn && (s.startsWith('sym:src/lib/transform/') || fileOfSym(s) === cf)) texts.push(...syntaxLiteralsOf(dn.d.node));
      }
      // logged by: reached symbols (or directly used helpers) that append to Output
      for (const s of [...inside, ...help, ...deep.inside]) if (loggers.has(s)) logged.add(s);
      for (const h of help) for (const e of adj.get(h) ?? []) if (loggers.has(e.to)) logged.add(h);
    }
    for (const s of libCalls) g.edge(id, s, 'calls');
    for (const s of helpers) g.edge(id, s, 'uses', { via: 'dialog helper' });
    for (const s of logged) g.edge(id, s, 'logged-by');
    const syntax = syntaxCommands(texts);
    for (const c of syntax) {
      g.node(`syntax:${c}`, 'syntax', c, { area: 'syntax' });
      g.edge(id, `syntax:${c}`, 'generates-syntax');
    }
    out.push({ id: tid, comps, libCalls: [...libCalls].sort(), syntax, logged: [...logged].sort() });
  }
  return out;
}

// ---------- AI ----------

/** Files that belong to the AI stack (providers, assistant, AI features): error codes are collected only here. */
const AI_FILES = /^src\/(platform\/(ai[^/]*|claude)\.ts$|lib\/assistant\/|lib\/coding\/ai|features\/(ai|assistant)\/)/;

export function extractAi(index, ev, effects, g, adj, storeInfo) {
  const res = { providers: [], features: [], errors: { defined: new Map(), thrown: new Map(), checked: new Map() }, tools: [], prompts: [], compactIssues: [] };
  // providers: a union type alias named *ProviderId
  for (const f of index.files.values()) {
    if (f.isTest || !f.rel.startsWith('src/platform/')) continue;
    for (const d of f.decls.values()) {
      if (d.kind !== 'type' || !/ProviderId$/.test(d.name)) continue;
      for (const p of unionLiterals(index, f, d.name)) res.providers.push({ id: p, file: f.rel, type: d.name });
    }
  }
  for (const p of res.providers) {
    g.node(`ai-provider:${p.id}`, 'ai-provider', p.id, { file: p.file, area: 'platform' });
    for (const f of index.files.values()) {
      if (f.isTest || !f.rel.startsWith('src/platform/')) continue;
      const hit = [...f.decls.values()].some((d) => d.name.toLowerCase().includes(p.id.toLowerCase())) || f.rel.toLowerCase().includes(p.id.toLowerCase());
      if (hit) g.edge(`ai-provider:${p.id}`, modId(f.rel), 'implemented-in');
    }
  }
  // features: const array with { id, label, menuLabel, does }
  for (const f of index.files.values()) {
    if (f.isTest || !f.rel.startsWith('src/features/')) continue;
    for (const d of f.decls.values()) {
      if (d.kind !== 'const') continue;
      const v = ev.evalDecl(f.rel, d.name);
      if (!Array.isArray(v) || !v.length || !v.every((x) => x && typeof x === 'object' && 'menuLabel' in x && 'id' in x)) continue;
      for (const x of v) res.features.push({ id: str(x.id), label: str(x.label), menuLabel: str(x.menuLabel), does: str(x.does), file: f.rel, decl: d.name });
    }
  }
  const featureIds = new Set(res.features.map((x) => x.id));
  for (const x of res.features) {
    const id = `ai-feature:${x.id}`;
    g.node(id, 'ai-feature', x.label ?? x.id, { file: x.file, area: 'features/ai', does: x.does, menuLabel: x.menuLabel });
  }
  // effects per feature: switch clauses `case '<featureId>':` in the features' file
  const featFiles = new Set(res.features.map((x) => x.file));
  for (const file of featFiles) {
    const f = index.files.get(file);
    for (const d of f.decls.values()) {
      if (!d.fn || !/^(run|start|open|launch)/.test(d.name)) continue;
      walk(d.fn, (n) => {
        let lit;
        let body;
        if (is.CaseClause(n)) {
          lit = str(ev.eval(n.expression, f, {}));
          body = n;
        } else if (is.IfStatement(n)) {
          const m = f.ft.src(n.expression).match(/^\s*\w+\s*===\s*'([^']+)'\s*$/);
          if (m) {
            lit = m[1];
            body = n.thenStatement;
          }
        }
        if (!lit || !featureIds.has(lit)) return;
        const fx = effects.analyze(body, f, {});
        const fid = `ai-feature:${lit}`;
        g.edge(fid, symId(file, d.name), 'started-by');
        for (const dd of fx.dialogs) if (dd.id !== '*' && dd.kind !== '?') g.edge(fid, `dialog:${dd.kind}:${dd.id}`, 'opens');
        for (const c of fx.calls) g.edge(fid, c.sym, 'calls');
        for (const a of fx.actions) g.edge(fid, `store-action:${a.store}.${a.action}`, 'calls-action');
        for (const w of fx.writes) g.edge(fid, storeKeyId(w.store, w.key), 'writes');
      });
    }
  }
  // error codes
  const addCode = (map, code, where) => {
    if (!code || !/^[a-z][a-z0-9_]*$/.test(code)) return;
    if (!map.has(code)) map.set(code, new Set());
    map.get(code).add(where);
  };
  for (const f of index.files.values()) {
    if (f.isTest || !AI_FILES.test(f.rel)) continue;
    for (const d of f.decls.values()) {
      if (d.fn && /ErrorMessage$/.test(d.name)) {
        walk(d.fn, (n) => {
          if (is.CaseClause(n)) addCode(res.errors.defined, str(ev.eval(n.expression, f, {})), symId(f.rel, d.name));
        });
      }
      if (d.fn && /errorCode$/i.test(d.name)) {
        walk(d.fn, (n) => {
          if (is.ReturnStatement(n) && n.expression) for (const lit of condLiterals(n.expression)) addCode(res.errors.thrown, lit, symId(f.rel, d.name));
        });
      }
    }
    walk(f.sf, (n) => {
      if (is.NewExpression(n) && is.Identifier(unwrap(n.expression)) && /(Ai|Unavailable)\w*Error$/.test(unwrap(n.expression).text) && n.arguments?.[0]) {
        const owner = index.ownerOf(f, n);
        for (const lit of condLiterals(n.arguments[0])) addCode(res.errors.thrown, lit, owner === '<module>' ? modId(f.rel) : symId(f.rel, owner));
      }
      if (is.BinaryExpression(n) && /^(EqualsEqualsEqualsToken|ExclamationEqualsEqualsToken)$/.test(kindName(n.operatorToken))) {
        const l = f.ft.src(n.left);
        if (/(\.|^)code$/.test(l) && (is.StringLiteral(n.right) || is.NoSubstitutionTemplateLiteral(n.right))) {
          const owner = index.ownerOf(f, n);
          addCode(res.errors.checked, n.right.text, owner === '<module>' ? modId(f.rel) : symId(f.rel, owner));
        }
      }
    });
    // ['a', 'b'].includes(code)
    walk(f.sf, (n) => {
      if (!is.CallExpression(n)) return;
      const c = unwrap(n.expression);
      if (!is.PropertyAccessExpression(c) || c.name.text !== 'includes' || !n.arguments[0] || !/(^|\.)code$/.test(f.ft.src(n.arguments[0]))) return;
      const arr = unwrap(c.expression);
      if (!is.ArrayLiteralExpression(arr)) return;
      const owner = index.ownerOf(f, n);
      for (const el of arr.elements) if (is.StringLiteral(el)) addCode(res.errors.checked, el.text, owner === '<module>' ? modId(f.rel) : symId(f.rel, owner));
    });
  }
  // produced: code literals passed to *Error(...) helpers, returned by classifiers, assigned to `code`
  const definedFns = new Set([...res.errors.defined.values()].flatMap((x) => [...x]));
  for (const f of index.files.values()) {
    if (f.isTest || !AI_FILES.test(f.rel)) continue;
    walk(f.sf, (n) => {
      if (!(is.StringLiteral(n) || is.NoSubstitutionTemplateLiteral(n)) || !/^[a-z][a-z0-9]*(_[a-z0-9]+)*$/.test(n.text)) return;
      const owner = index.ownerOf(f, n);
      const from = owner === '<module>' ? modId(f.rel) : symId(f.rel, owner);
      if (definedFns.has(from)) return;
      let cur = n;
      while (cur.parent && (is.ConditionalExpression(cur.parent) || is.ParenthesizedExpression(cur.parent) || (is.BinaryExpression(cur.parent) && /QuestionQuestion|BarBar/.test(kindName(cur.parent.operatorToken))))) cur = cur.parent;
      const p = cur.parent;
      let produced = false;
      if (p && (is.CallExpression(p) || is.NewExpression(p)) && p.arguments?.[0] === cur) {
        const cn = f.ft.src(p.expression);
        produced = /(Ai|Http|Unavailable)\w*Error$/.test(cn); // aiHttpError(code), new AiUnavailableError(code); not logError('ai', ...)
      } else if (p && is.ReturnStatement(p)) {
        const fn = ancestors(p).find(isFunctionLike);
        const fname = fn?.name?.text ?? (fn?.parent && is.VariableDeclaration(fn.parent) ? fn.parent.name.text : '');
        produced = /code|classify|reason/i.test(fname ?? '');
      } else if (p && is.PropertyAssignment(p) && nameText(p.name) === 'code') produced = true;
      else if (p && is.BinaryExpression(p) && kindName(p.operatorToken) === 'EqualsToken' && /(^|\.)code$/.test(f.ft.src(p.left))) produced = true;
      else if (p && is.VariableDeclaration(p) && is.Identifier(p.name) && /code$/i.test(p.name.text)) produced = true;
      if (produced) addCode(res.errors.thrown, n.text, from);
    });
  }
  const codes = new Set([...res.errors.defined.keys(), ...res.errors.thrown.keys()]);
  for (const c of [...codes].sort()) {
    g.node(`ai-error:${c}`, 'ai-error', c, { area: 'platform', hasMessage: res.errors.defined.has(c) ? true : undefined });
    for (const s of res.errors.defined.get(c) ?? []) g.edge(s, `ai-error:${c}`, 'explains');
    for (const s of res.errors.thrown.get(c) ?? []) g.edge(s, `ai-error:${c}`, 'throws');
    for (const s of res.errors.checked.get(c) ?? []) g.edge(s, `ai-error:${c}`, 'checks');
  }
  // assistant tools: object literals { name, description, parameters, run }
  const toolNames = new Set();
  for (const f of index.files.values()) {
    if (f.isTest || !f.rel.startsWith('src/')) continue;
    walk(f.sf, (n) => {
      if (!is.ObjectLiteralExpression(n)) return;
      const prop = (k) => n.properties.find((p) => nameText(p.name) === k);
      const np = prop('name');
      const rp = prop('run');
      if (!np || !rp || !prop('parameters') || !prop('description')) return;
      const name = is.PropertyAssignment(np) ? str(ev.eval(np.initializer, f, {})) : undefined;
      if (!name) return;
      const kind = prop('kind') && is.PropertyAssignment(prop('kind')) ? str(ev.eval(prop('kind').initializer, f, {})) : undefined;
      const compact = prop('compact') && is.PropertyAssignment(prop('compact')) ? ev.eval(prop('compact').initializer, f, {}) === true : false;
      const owner = index.ownerOf(f, n);
      let impl = null;
      const rv = is.PropertyAssignment(rp) ? unwrap(rp.initializer) : is.ShorthandPropertyAssignment(rp) ? rp.name : null;
      let runNode = rv;
      if (rv && is.Identifier(rv)) {
        const r = index.resolveLocal(f, rv.text);
        if (r && r.file) {
          impl = symId(r.file, r.name);
          runNode = r.decl?.fn ?? runNode;
        } else {
          // local function inside a factory (analysisTools())
          const fnDecl = findNamedFunction(f, rv.text, n);
          if (fnDecl) runNode = fnDecl;
        }
      } else if (is.MethodDeclaration(rp)) runNode = rp;
      toolNames.add(name);
      const t = { name, kind, compact, file: f.rel, owner, impl, line: f.ft.line(n) };
      res.tools.push(t);
      const id = `ai-tool:${name}`;
      g.node(id, 'ai-tool', name, { file: f.rel, line: t.line, area: f.area, toolKind: kind, compact: compact || undefined, description: str(ev.eval(prop('description').initializer, f, {})) });
      g.edge(id, impl ?? (owner === '<module>' ? modId(f.rel) : symId(f.rel, owner)), 'implemented-by');
      // what the tool reads: ctx.state().X, const { a } = ctx.state(), ctx.permissions.X, within run + helpers in the same area
      const reads = new Set();
      const perms = new Set();
      const scan = (node) => {
        walk(node, (m) => {
          if (is.CallExpression(m) && is.PropertyAccessExpression(unwrap(m.expression)) && unwrap(m.expression).name.text === 'state' && m.arguments.length === 0) {
            let cur = m;
            while (cur.parent && is.ParenthesizedExpression(cur.parent)) cur = cur.parent;
            const p = cur.parent;
            if (is.PropertyAccessExpression(p) && p.expression === cur) reads.add(p.name.text);
            else if (is.VariableDeclaration(p) && is.ObjectBindingPattern(p.name)) for (const el of p.name.elements) reads.add(el.propertyName ? nameText(el.propertyName) : nameText(el.name));
            else if (is.VariableDeclaration(p) && is.Identifier(p.name)) {
              const alias = p.name.text;
              const fn = ancestors(p).find(isFunctionLike) ?? p.parent;
              walk(fn, (q) => {
                if (is.PropertyAccessExpression(q) && is.Identifier(unwrap(q.expression)) && unwrap(q.expression).text === alias) reads.add(q.name.text);
              });
            }
          }
          if (is.PropertyAccessExpression(m) && is.PropertyAccessExpression(unwrap(m.expression)) && unwrap(m.expression).name.text === 'permissions') perms.add(m.name.text);
        });
      };
      if (runNode) scan(runNode);
      // helpers called by the run function in the same file
      const startSyms = impl ? [impl] : [];
      if (runNode) walk(runNode, (m) => {
        if (is.CallExpression(m) && is.Identifier(unwrap(m.expression))) {
          const r = index.resolveLocal(f, unwrap(m.expression).text);
          if (r && r.file) startSyms.push(symId(r.file, r.name));
        }
      });
      const { inside } = reach(adj, startSyms, (s) => s.startsWith('sym:src/lib/assistant/'));
      for (const s of inside) {
        const dn = declNode(index, s);
        if (dn) scan(dn.d.node);
        if (s !== impl && s.startsWith('sym:src/')) g.edge(id, s, 'calls');
      }
      t.reads = [...reads].filter(Boolean).sort();
      t.perms = [...perms].sort();
      for (const k of t.reads) {
        const target = storeKeyId('useStore', k);
        g.edge(id, g.has(target) ? target : `snapshot:${k}`, 'reads');
      }
      for (const p of t.perms) g.edge(id, `permission:${p}`, 'requires-permission');
    });
  }
  // compact tool lists: new Set(['a', 'b'...]) in a function named *compact*Tools / tool lists by name
  for (const f of index.files.values()) {
    if (f.isTest || !f.rel.startsWith('src/lib/assistant/')) continue;
    for (const d of f.decls.values()) {
      if (!d.fn || !/tools/i.test(d.name) || /\bparameters\s*:/.test(f.ft.src(d.fn))) continue; // tool lists, not tool definitions
      walk(d.fn, (n) => {
        if (!is.StringLiteral(n) || !/^[a-z]+(_[a-z]+)+$/.test(n.text)) return;
        if (!toolNames.has(n.text)) res.compactIssues.push(`\`${n.text}\` is listed in ${d.name}() (${f.rel}:${f.ft.line(n)}) but no assistant tool has that name`);
        else g.edge(symId(f.rel, d.name), `ai-tool:${n.text}`, 'lists');
      });
    }
  }
  // prompts: functions/consts whose name mentions "prompt" (builders and system prompts)
  for (const f of index.files.values()) {
    if (f.isTest || !f.rel.startsWith('src/')) continue;
    for (const d of f.decls.values()) {
      if (!/prompt/i.test(d.name) || !['function', 'const'].includes(d.kind)) continue;
      if (/^(use|is|has|set|strip)|Budget|Bytes|Props$|Label|Option/i.test(d.name)) continue;
      if (d.kind === 'const' && !(d.init && (is.StringLiteral(unwrap(d.init)) || is.TemplateExpression(unwrap(d.init)) || is.NoSubstitutionTemplateLiteral(unwrap(d.init)) || is.ArrayLiteralExpression(unwrap(d.init)) || isFunctionLike(unwrap(d.init))))) continue;
      const id = `ai-prompt:${f.rel}#${d.name}`;
      res.prompts.push({ id, file: f.rel, name: d.name });
      g.node(id, 'ai-prompt', d.name, { file: f.rel, line: d.line, area: f.area });
      g.edge(id, symId(f.rel, d.name), 'implemented-by');
    }
  }
  void storeInfo;
  return res;
}

function findNamedFunction(f, name, near) {
  for (const anc of ancestors(near)) {
    if (!isFunctionLike(anc) || !anc.body || !is.Block(anc.body)) continue;
    for (const st of anc.body.statements) {
      if (is.FunctionDeclaration(st) && st.name?.text === name) return st;
      if (is.VariableStatement(st)) for (const d of st.declarationList.declarations) if (is.Identifier(d.name) && d.name.text === name && d.initializer) return d.initializer;
    }
  }
  return null;
}

function condLiterals(expr) {
  const e = unwrap(expr);
  if (!e) return [];
  if (is.StringLiteral(e) || is.NoSubstitutionTemplateLiteral(e)) return [e.text];
  if (is.ConditionalExpression(e)) return [...condLiterals(e.whenTrue), ...condLiterals(e.whenFalse)];
  if (is.BinaryExpression(e) && /QuestionQuestion|BarBar/.test(kindName(e.operatorToken))) return [...condLiterals(e.left), ...condLiterals(e.right)];
  return [];
}

// ---------- browser storage ----------

export function extractStorage(index, ev, g) {
  const uses = []; // { backend, key, op, from, file, line }
  const wrappers = new Map(); // symId -> { backend, op, param, prefix, suffix }
  const keyOf = (arg, f, env = {}) => {
    const v = ev.eval(arg, f, env);
    return typeof v === 'string' ? v : v && typeof v === 'object' && 's' in v ? v.s : undefined;
  };
  const opOf = (m) => (m === 'getItem' ? 'reads' : m === 'setItem' ? 'writes' : m === 'removeItem' ? 'removes' : null);
  for (const f of index.files.values()) {
    if (f.isTest || !f.rel.startsWith('src/')) continue;
    walk(f.sf, (n) => {
      if (!is.CallExpression(n)) return;
      const c = unwrap(n.expression);
      if (!is.PropertyAccessExpression(c)) return;
      const op = opOf(c.name.text);
      if (!op || !n.arguments[0]) return;
      const recv = f.ft.src(c.expression);
      const backend = /session/i.test(recv) ? 'sessionStorage' : 'localStorage';
      const owner = index.ownerOf(f, n);
      const from = owner === '<module>' ? modId(f.rel) : symId(f.rel, owner);
      const arg = unwrap(n.arguments[0]);
      // wrapper: key built from a parameter of the owning function
      const d = owner !== '<module>' ? index.decl(f.rel, owner) : null;
      const params = d?.fn ? (d.fn.parameters ?? []).map((p) => (is.Identifier(p.name) ? p.name.text : null)) : [];
      if (is.TemplateExpression(arg) && arg.templateSpans.length === 1 && is.Identifier(arg.templateSpans[0].expression) && params.includes(arg.templateSpans[0].expression.text)) {
        wrappers.set(from, { backend, op, param: params.indexOf(arg.templateSpans[0].expression.text), prefix: arg.head.text, suffix: arg.templateSpans[0].literal.text });
        return;
      }
      if (is.Identifier(arg) && params.includes(arg.text)) {
        wrappers.set(from, { backend, op, param: params.indexOf(arg.text), prefix: '', suffix: '' });
        return;
      }
      const key = keyOf(arg, f);
      uses.push({ backend, key: key ?? `?${f.ft.src(arg)}`, op, from, file: f.rel, line: f.ft.line(n) });
    });
    // storage events: e.key === SOME_KEY
    walk(f.sf, (n) => {
      if (!is.BinaryExpression(n) || kindName(n.operatorToken) !== 'EqualsEqualsEqualsToken') return;
      if (!/(^|\.)key$/.test(f.ft.src(n.left))) return;
      const k = keyOf(n.right, f);
      if (!k || !k.includes('.')) return;
      const owner = index.ownerOf(f, n);
      uses.push({ backend: 'localStorage', key: k, op: 'listens', from: owner === '<module>' ? modId(f.rel) : symId(f.rel, owner), file: f.rel, line: f.ft.line(n) });
    });
  }
  // calls to wrappers
  for (const f of index.files.values()) {
    if (f.isTest || !f.rel.startsWith('src/') || !wrappers.size) continue;
    walk(f.sf, (n) => {
      if (!is.CallExpression(n) || !is.Identifier(unwrap(n.expression))) return;
      const r = index.resolveLocal(f, unwrap(n.expression).text);
      if (!r || !r.file) return;
      const w = wrappers.get(symId(r.file, r.name));
      if (!w) return;
      const k = keyOf(n.arguments[w.param], f);
      const owner = index.ownerOf(f, n);
      uses.push({ backend: w.backend, key: k !== undefined ? `${w.prefix}${k}${w.suffix}` : `${w.prefix}{…}${w.suffix}`, op: w.op, from: owner === '<module>' ? modId(f.rel) : symId(f.rel, owner), file: f.rel, line: f.ft.line(n), via: r.name });
    });
  }
  // IndexedDB: indexedDB.open(NAME), createObjectStore(STORE), tx(STORE, 'readwrite'|'readonly')
  const idb = [];
  for (const f of index.files.values()) {
    if (f.isTest || !f.rel.startsWith('src/')) continue;
    let dbName = null;
    const stores = new Set();
    walk(f.sf, (n) => {
      if (!is.CallExpression(n)) return;
      const c = unwrap(n.expression);
      const src = f.ft.src(c);
      if (/indexedDB\.open$/.test(src)) dbName = str(ev.eval(n.arguments[0], f, {})) ?? '?';
      if (/createObjectStore$/.test(src)) {
        const s = str(ev.eval(n.arguments[0], f, {}));
        if (s) stores.add(s);
      }
    });
    if (!dbName) continue;
    walk(f.sf, (n) => {
      if (!is.CallExpression(n) || n.arguments.length < 2) return;
      const s = str(ev.eval(n.arguments[0], f, {}));
      const mode = str(ev.eval(n.arguments[1], f, {}));
      if (!s || !stores.has(s) || !/^read(write|only)$/.test(mode ?? '')) return;
      const owner = index.ownerOf(f, n);
      if (owner === '<module>') return;
      const d = index.decl(f.rel, owner);
      // skip the generic transaction helper itself (its store is a parameter)
      if (d?.fn && (d.fn.parameters ?? []).some((p) => is.Identifier(p.name) && p.name.text === f.ft.src(n.arguments[0]))) return;
      idb.push({ backend: 'indexedDB', key: `${dbName}/${s}`, op: mode === 'readwrite' ? 'writes' : 'reads', from: symId(f.rel, owner), file: f.rel, line: f.ft.line(n) });
    });
  }
  const all = [...uses, ...idb];
  for (const u of all) {
    const id = `storage:${u.backend}:${u.key}`;
    g.node(id, 'storage-key', u.key, { backend: u.backend, area: 'storage' });
    g.edge(u.from, id, u.op, { via: u.via });
  }
  return { uses: all, wrappers };
}

// ---------- output model ----------

export function extractOutputModel(index, ev, g) {
  const res = { blockKinds: [], chartTypes: [], creators: new Map(), handlers: new Map(), procedureTags: new Map() };
  // discover unions in the file that declares OutputBlock / ChartSpec
  for (const f of index.files.values()) {
    if (f.isTest) continue;
    const ob = f.decls.get('OutputBlock');
    const cs = f.decls.get('ChartSpec');
    if (ob?.kind === 'type') res.blockKinds = discriminants(ob.node.type, 'kind');
    if (cs?.kind === 'type') res.chartTypes = discriminants(cs.node.type, 'type');
    if (ob?.kind === 'type' || cs?.kind === 'type') res.file = f.rel;
  }
  const kinds = new Set(res.blockKinds);
  const types = new Set(res.chartTypes);
  for (const k of res.blockKinds) g.node(`output-kind:${k}`, 'output-kind', k, { file: res.file, area: 'core' });
  for (const t of res.chartTypes) {
    g.node(`chart-type:${t}`, 'chart-type', t, { file: res.file, area: 'core' });
    g.edge(`output-kind:chart`, `chart-type:${t}`, 'has-variant');
  }
  const add = (map, key, from) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(from);
  };
  // only files that know the output model (import it) create or branch on its kinds
  const outFile = res.file;
  for (const f of index.files.values()) {
    if (f.isTest || !f.rel.startsWith('src/')) continue;
    if (f.rel !== outFile && !f.imports.some((i) => i.target.file === outFile)) continue;
    walk(f.sf, (n) => {
      const owner = () => {
        const o = index.ownerOf(f, n);
        return o === '<module>' ? modId(f.rel) : symId(f.rel, o);
      };
      if (is.ObjectLiteralExpression(n)) {
        const props = new Map(n.properties.filter((p) => is.PropertyAssignment(p)).map((p) => [nameText(p.name), p.initializer]));
        const lit = (k) => {
          const v = props.get(k);
          return v && (is.StringLiteral(unwrap(v)) || is.NoSubstitutionTemplateLiteral(unwrap(v))) ? unwrap(v).text : undefined;
        };
        const kind = lit('kind');
        if (kind && kinds.has(kind) && [...props.keys()].some((k) => ['table', 'chart', 'style', 'text'].includes(k))) add(res.creators, `output-kind:${kind}`, owner());
        const type = lit('type');
        if (type && types.has(type) && props.has('title') && !props.has('kind')) add(res.creators, `chart-type:${type}`, owner());
        const proc = lit('procedure');
        if (proc && props.has('blocks')) add(res.procedureTags, proc, owner());
      }
      // handlers: case 'x': / x.type === 'x' / b.kind === 'x'
      if (is.CaseClause(n)) {
        const sw = n.parent?.parent;
        const disc = sw && is.SwitchStatement(sw) ? f.ft.src(sw.expression) : '';
        const v = n.expression && (is.StringLiteral(n.expression) || is.NoSubstitutionTemplateLiteral(n.expression)) ? n.expression.text : null;
        if (v && /(^|\.)type$/.test(disc) && types.has(v)) add(res.handlers, `chart-type:${v}`, owner());
        if (v && /(^|\.)kind$/.test(disc) && kinds.has(v)) add(res.handlers, `output-kind:${v}`, owner());
      }
      if (is.BinaryExpression(n) && /EqualsEqualsEqualsToken|ExclamationEqualsEqualsToken/.test(kindName(n.operatorToken)) && (is.StringLiteral(n.right) || is.NoSubstitutionTemplateLiteral(n.right))) {
        const l = f.ft.src(n.left);
        const v = n.right.text;
        if (/(^|\.)type$/.test(l) && types.has(v)) add(res.handlers, `chart-type:${v}`, owner());
        if (/(^|\.)kind$/.test(l) && kinds.has(v)) add(res.handlers, `output-kind:${v}`, owner());
      }
    });
  }
  for (const [target, froms] of res.creators) for (const s of froms) g.edge(s, target, 'creates');
  const role = (id) => {
    const file = id.replace(/^(sym|module):/, '').split('#')[0];
    if (/(export|report)[^/]*$/i.test(file)) return 'exporter';
    if (/^src\/features\/(output|charts)\//.test(file) || file.endsWith('.tsx')) return 'renderer';
    return 'consumer';
  };
  for (const [target, froms] of res.handlers) for (const s of froms) g.edge(s, target, 'handles', { via: role(s) });
  for (const [tag, froms] of res.procedureTags) {
    g.node(`output-source:${tag}`, 'output-source', `OutputItem.procedure = '${tag}'`, { area: 'core' });
    for (const s of froms) g.edge(s, `output-source:${tag}`, 'creates');
  }
  return res;
}

function discriminants(typeNode, prop) {
  const out = [];
  const visit = (t) => {
    if (!t) return;
    if (is.UnionType(t)) t.types.forEach(visit);
    else if (is.ParenthesizedType(t)) visit(t.type);
    else if (is.TypeLiteral(t)) {
      for (const m of t.members) {
        if (nameText(m.name) === prop && m.type && is.LiteralType(m.type) && is.StringLiteral(m.type.literal)) out.push(m.type.literal.text);
      }
    }
  };
  visit(typeNode);
  return out;
}

// ---------- shortcuts ----------

const KEY_NAMES = new Set(['Enter', 'Escape', 'Esc', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 'Delete', 'Backspace', ' ', 'Spacebar', 'Space', 'Insert', 'ContextMenu']);
const isKeyLiteral = (s) => s.length === 1 || KEY_NAMES.has(s) || /^(Key[A-Z]|Digit\d|F\d{1,2}|Numpad\w+)$/.test(s);

export function normCombo(raw) {
  const parts = raw.split('+').map((p) => p.trim()).filter(Boolean);
  if (raw.endsWith('++')) parts.push('+');
  const mods = new Set();
  let key = parts.pop() ?? '';
  for (const p of parts) {
    const l = p.toLowerCase();
    if (['ctrl', 'cmd', 'mod', 'meta', 'control'].includes(l)) mods.add('Mod');
    else if (l === 'shift') mods.add('Shift');
    else if (l === 'alt' || l === 'option') mods.add('Alt');
  }
  const map = { Esc: 'Escape', '↑': 'ArrowUp', '↓': 'ArrowDown', '←': 'ArrowLeft', '→': 'ArrowRight', ' ': 'Space', Spacebar: 'Space', 'Page Up': 'PageUp', 'Page Down': 'PageDown', Del: 'Delete', Return: 'Enter' };
  key = map[key] ?? key;
  if (/^Key[A-Z]$/.test(key)) key = key.slice(3);
  if (/^Digit\d$/.test(key)) key = key.slice(5);
  if (key.length === 1) key = key.toUpperCase();
  return [...['Mod', 'Alt', 'Shift'].filter((m) => mods.has(m)), key].join('+');
}

export function extractShortcuts(index, ev, g, commands, adj) {
  const bound = []; // { combo, scope:'global'|'local', from, file, line }
  const documented = []; // { combo, where, group, description }
  // 1. global handler regions: functions registered with window/document.addEventListener('keydown', h)
  const globalFns = new Map(); // function node -> file info
  const globalSyms = new Set();
  for (const f of index.files.values()) {
    if (f.isTest || !f.rel.startsWith('src/')) continue;
    walk(f.sf, (n) => {
      if (!is.CallExpression(n)) return;
      const c = unwrap(n.expression);
      if (!is.PropertyAccessExpression(c) || c.name.text !== 'addEventListener') return;
      const target = f.ft.src(c.expression);
      if (!/^(window|document|globalThis)$/.test(target)) return;
      const ev0 = n.arguments[0];
      if (!ev0 || !is.StringLiteral(ev0) || !/^key(down|up|press)$/.test(ev0.text)) return;
      const h = unwrap(n.arguments[1]);
      if (!h) return;
      if (isFunctionLike(h)) globalFns.set(h, f);
      else if (is.Identifier(h)) {
        // local const in an enclosing function, or a top-level / imported function
        let found = null;
        for (const anc of ancestors(n)) {
          if (!isFunctionLike(anc) || !anc.body || !is.Block(anc.body)) continue;
          walk(anc.body, (m) => {
            if (!found && is.VariableDeclaration(m) && is.Identifier(m.name) && m.name.text === h.text && m.initializer && isFunctionLike(unwrap(m.initializer))) found = unwrap(m.initializer);
          });
          if (found) break;
        }
        if (found) globalFns.set(found, f);
        else {
          const r = index.resolveLocal(f, h.text);
          if (r && r.file && r.decl?.fn) {
            globalFns.set(r.decl.fn, index.files.get(r.file));
            globalSyms.add(symId(r.file, r.name));
          }
        }
      }
    });
  }
  // functions called from global handlers count as global too (predicates like isAssistantShortcut)
  for (const [fnNode, f] of [...globalFns]) {
    walk(fnNode, (m) => {
      if (!is.CallExpression(m) || !is.Identifier(unwrap(m.expression))) return;
      const r = index.resolveLocal(f, unwrap(m.expression).text);
      if (r && r.file && r.decl?.fn && /^src\//.test(r.file) && !globalFns.has(r.decl.fn)) globalFns.set(r.decl.fn, index.files.get(r.file));
    });
  }
  const inGlobal = (n) => ancestors(n).some((a) => globalFns.has(a));

  const KEYEXPR = /(^|\.)(key|code)(\.toLowerCase\(\)|\.toUpperCase\(\))?$|^key$/;
  for (const f of index.files.values()) {
    if (f.isTest || !f.rel.startsWith('src/')) continue;
    const hits = [];
    walk(f.sf, (n) => {
      if (is.BinaryExpression(n) && /^(EqualsEqualsEqualsToken|EqualsEqualsToken)$/.test(kindName(n.operatorToken))) {
        const [side, lit] = is.StringLiteral(n.right) ? [n.left, n.right] : is.StringLiteral(n.left) ? [n.right, n.left] : [null, null];
        if (side && KEYEXPR.test(f.ft.src(side)) && isKeyLiteral(lit.text)) hits.push({ node: n, key: lit.text });
      }
      if (is.CaseClause(n) && n.expression && is.StringLiteral(n.expression)) {
        const sw = n.parent?.parent;
        if (sw && is.SwitchStatement(sw) && KEYEXPR.test(f.ft.src(sw.expression)) && isKeyLiteral(n.expression.text)) hits.push({ node: n, key: n.expression.text });
      }
      // clipboard shortcuts are handled as copy/cut/paste events, not key comparisons
      if (is.JsxAttribute(n) && /^on(Copy|Cut|Paste)$/.test(nameText(n.name) ?? '')) hits.push({ node: n, key: { onCopy: 'c', onCut: 'x', onPaste: 'v' }[nameText(n.name)], mods: ['Mod'] });
      if (is.CallExpression(n)) {
        const c = unwrap(n.expression);
        // /^[1-9]$/.test(e.key)
        if (is.PropertyAccessExpression(c) && c.name.text === 'test' && n.arguments[0] && KEYEXPR.test(f.ft.src(n.arguments[0])) && is.RegularExpressionLiteral(unwrap(c.expression))) {
          const re = unwrap(c.expression).text;
          const cls = re.match(/\[(\d)-(\d)\]/);
          if (cls) for (let d = Number(cls[1]); d <= Number(cls[2]); d++) hits.push({ node: n, key: String(d) });
        }
        if (is.PropertyAccessExpression(c) && c.name.text === 'includes' && n.arguments[0] && KEYEXPR.test(f.ft.src(n.arguments[0])) && is.ArrayLiteralExpression(unwrap(c.expression))) {
          for (const el of unwrap(c.expression).elements) if (is.StringLiteral(el) && isKeyLiteral(el.text)) hits.push({ node: n, key: el.text });
        }
      }
    });
    for (const h of hits) {
      if (h.key === ' ' || h.key === 'Spacebar') h.key = 'Space';
      const mods = h.mods ?? inferModifiers(f, h.node);
      const combo = normCombo([...mods, h.key === '+' ? '+' : h.key].join('+').replace(/\+\+$/, '++'));
      const owner = index.ownerOf(f, h.node);
      const from = owner === '<module>' ? modId(f.rel) : symId(f.rel, owner);
      const scope = inGlobal(h.node) || globalSyms.has(from) ? 'global' : 'local';
      bound.push({ combo, scope, from, file: f.rel, line: f.ft.line(h.node) });
    }
  }
  // 2. documented: menu item shortcuts
  for (const c of commands) if (c.item.shortcut) documented.push({ combo: normCombo(c.item.shortcut), where: c.id, group: 'Menu labels', description: c.path.join(' > ') });
  // 3. documented: help tables — arrays of [keys, description] tuples with [bracketed] keys
  for (const f of index.files.values()) {
    if (f.isTest || !f.rel.startsWith('src/')) continue;
    walk(f.sf, (n) => {
      if (!is.ArrayLiteralExpression(n) || n.elements.length < 1) return;
      const rows = n.elements.map(unwrap);
      if (!rows.every((r) => is.ArrayLiteralExpression(r) && r.elements.length === 2)) return;
      const vals = rows.map((r) => [str(ev.eval(r.elements[0], f, {})), str(ev.eval(r.elements[1], f, {}))]);
      if (!vals.some(([k]) => k && /\[[^\]]+\]/.test(k))) return;
      // group title: enclosing object literal's `title`
      const obj = ancestors(n).find((a) => is.ObjectLiteralExpression(a));
      const tp = obj?.properties.find((p) => nameText(p.name) === 'title' && is.PropertyAssignment(p));
      const group = tp ? str(ev.eval(tp.initializer, f, {})) ?? '?' : '?';
      const owner = index.ownerOf(f, n);
      for (const [keys, desc] of vals) {
        if (!keys) continue;
        const combos = [...keys.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]);
        for (const c of combos) {
          if (/^(Shift|Ctrl|Cmd|Mod|Alt)$/i.test(c)) continue; // "[Shift] + arrow" style
          documented.push({ combo: normCombo(c), where: owner === '<module>' ? modId(f.rel) : symId(f.rel, owner), group, description: desc ?? '' });
        }
      }
    });
  }
  // nodes
  const combos = new Map();
  const key = (combo, scope) => `shortcut:${combo}${scope ? `@${scope}` : ''}`;
  for (const d of documented) {
    const scope = /^(Everywhere|Menu labels|Global|Anywhere)$/i.test(d.group) ? 'global' : d.group;
    const id = key(d.combo, scope === 'global' ? 'global' : slug(scope));
    g.node(id, 'shortcut', `${d.combo}${scope === 'global' ? '' : ` (${scope})`}`, { area: 'shortcuts', combo: d.combo, scope: scope === 'global' ? 'global' : scope });
    g.edge(id, d.where, 'documented-in', { via: d.description?.slice(0, 80) });
    if (!combos.has(id)) combos.set(id, { documented: [], bound: [] });
    combos.get(id).documented.push(d);
  }
  for (const b of bound) {
    const id = b.scope === 'global' ? key(b.combo, 'global') : `shortcut:${b.combo}@${slug(fileOfSym(b.from.startsWith('sym:') ? b.from : 'sym:' + b.from.slice(7) + '#x'))}`;
    g.node(id, 'shortcut', b.scope === 'global' ? b.combo : `${b.combo} (${b.from.startsWith('sym:') ? nameOfSym(b.from) : b.file})`, { area: 'shortcuts', combo: b.combo, scope: b.scope === 'global' ? 'global' : 'local' });
    g.edge(id, b.from, 'bound-in');
    if (!combos.has(id)) combos.set(id, { documented: [], bound: [] });
    combos.get(id).bound.push(b);
  }
  void adj;
  return { bound, documented, combos };
}

function slug(s) {
  return String(s).replace(/^src\//, '').replace(/\.[jt]sx?$/, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}

/** Modifiers implied around a key comparison: the && chain it sits in, enclosing if conditions, and early-return guards. */
function inferModifiers(f, node) {
  const mods = new Set();
  const neg = new Set();
  const scanText = (t) => {
    const check = (re, m) => {
      for (const x of t.matchAll(re)) {
        const before = t.slice(Math.max(0, x.index - 2), x.index);
        if (/!\s*$/.test(before) || /!\($/.test(before)) neg.add(m);
        else mods.add(m);
      }
    };
    check(/\(?\s*(?:e|ev|event|evt)\.ctrlKey\s*\|\|\s*(?:e|ev|event|evt)\.metaKey\s*\)?|\b(?:e|ev|event|evt)\.(?:ctrlKey|metaKey)\b|\bmod\b(?!\w*\()/g, 'Mod');
    check(/\b(?:e|ev|event|evt)\.shiftKey\b/g, 'Shift');
    check(/\b(?:e|ev|event|evt)\.altKey\b/g, 'Alt');
  };
  // && chain
  let cur = node;
  const MODS = /ctrlKey|metaKey|shiftKey|altKey|\bmod\b/;
  while (
    cur.parent &&
    (is.ParenthesizedExpression(cur.parent) ||
      (is.BinaryExpression(cur.parent) && kindName(cur.parent.operatorToken) === 'AmpersandAmpersandToken') ||
      (is.BinaryExpression(cur.parent) && kindName(cur.parent.operatorToken) === 'BarBarToken' && !MODS.test(f.ft.src(cur.parent))))
  )
    cur = cur.parent;
  scanText(f.ft.src(cur));
  // enclosing if statements (when we are in the then-branch or the condition)
  for (const a of ancestors(node)) {
    if (isFunctionLike(a)) {
      // early-return guards before the node in this function
      if (a.body && is.Block(a.body)) {
        for (const st of a.body.statements) {
          if (st.end > node.pos) break;
          if (is.IfStatement(st) && isReturnOnly(st.thenStatement)) {
            const t = f.ft.src(st.expression);
            if (/^!\s*mod\b|^!\s*\(\s*e\.ctrlKey\s*\|\|\s*e\.metaKey\s*\)/.test(t.trim())) mods.add('Mod');
          }
        }
      }
      break;
    }
    if (is.IfStatement(a) && (a.thenStatement.pos <= node.pos && node.end <= a.thenStatement.end)) {
      let c = a.expression;
      c = unwrap(c);
      // only && parts of the condition
      const t = f.ft.src(c);
      if (!/\|\|/.test(t.replace(/\([^()]*\)/g, ''))) scanText(t);
    }
  }
  for (const m of neg) mods.delete(m);
  return [...mods];
}

function isReturnOnly(st) {
  if (is.ReturnStatement(st)) return true;
  if (is.Block(st) && st.statements.length === 1 && is.ReturnStatement(st.statements[0])) return true;
  return false;
}

// ---------- tests ----------

export function extractTests(index, g, ctx) {
  const { procs, commands, tools, storage, transforms } = ctx;
  const byLabel = new Map();
  const clean = (s) => (s ?? '').replace(/(\.\.\.|…)$/, '').trim();
  for (const c of commands) {
    if (!c.item.label || c.item.label.length < 4) continue;
    for (const l of new Set([c.item.label, clean(c.item.label)])) {
      if (!byLabel.has(l)) byLabel.set(l, []);
      byLabel.get(l).push(c.id);
    }
  }
  const procIds = new Map(procs.map((p) => [p.id, `procedure:${p.id}`]));
  const procTitles = new Map();
  for (const p of procs) for (const t of [p.title, `${p.title}...`]) procTitles.set(t, `procedure:${p.id}`);
  const toolNames = new Set(tools.map((t) => t.name));
  const storageKeys = new Map(storage.uses.map((u) => [u.key, `storage:${u.backend}:${u.key}`]));
  const transformIds = new Set(transforms.map((t) => t.id));
  const tests = [];
  for (const f of index.files.values()) {
    if (!f.isTest) continue;
    const mid = modId(f.rel);
    const names = [];
    const lits = new Set();
    walk(f.sf, (n) => {
      if (is.CallExpression(n)) {
        const c = f.ft.src(n.expression);
        if (/^(describe|it|test)(\.(only|skip|each|concurrent))?$/.test(c) && n.arguments[0]) {
          const a = unwrap(n.arguments[0]);
          if (is.StringLiteral(a) || is.NoSubstitutionTemplateLiteral(a)) names.push(`${c.split('.')[0] === 'describe' ? '## ' : ''}${a.text}`);
        }
      }
      if (is.StringLiteral(n) || is.NoSubstitutionTemplateLiteral(n)) lits.add(n.text);
    });
    // a test "covers" an area when it imports it directly or through a test helper
    const importsArea = (prefix) =>
      f.imports.some((i) => i.target.file && (i.target.file.startsWith(prefix) || (/^(tests|e2e)\//.test(i.target.file) && (index.files.get(i.target.file)?.imports ?? []).some((j) => j.target.file?.startsWith(prefix)))));
    const importsProcedures = importsArea('src/procedures');
    const importsTransforms = importsArea('src/lib/transform') || importsArea('src/features/transform');
    const covered = new Set();
    // direct imports
    for (const imp of f.imports) if (imp.target.file && imp.target.file.startsWith('src/')) covered.add(modId(imp.target.file));
    for (const m of covered) g.edge(m, mid, 'tested-by', { via: 'import' });
    // literal mentions
    for (const l of lits) {
      if (procIds.has(l) && importsProcedures) g.edge(procIds.get(l), mid, 'tested-by', { via: 'procedure id' });
      if (procTitles.has(l)) g.edge(procTitles.get(l), mid, 'tested-by', { via: 'menu label' });
      if (byLabel.has(l)) for (const c of byLabel.get(l)) g.edge(c, mid, 'tested-by', { via: 'menu label' });
      if (toolNames.has(l)) g.edge(`ai-tool:${l}`, mid, 'tested-by', { via: 'tool name' });
      if (storageKeys.has(l)) g.edge(storageKeys.get(l), mid, 'tested-by', { via: 'storage key' });
      if (transformIds.has(l) && importsTransforms) g.edge(`transform:${l}`, mid, 'tested-by', { via: 'transform id' });
    }
    g.get(mid).tests = names.slice(0, 60);
    g.get(mid).testCount = names.filter((x) => !x.startsWith('## ')).length;
    tests.push({ file: f.rel, names });
  }
  return tests;
}

export { UNKNOWN };
