// Menus, commands, dialogs (who opens which dialog id, which component renders it), the search
// palette's sources, and an "effects" analyser that says what a handler does: opens a dialog, calls an
// action or function, switches tab.

import { ancestors, is, isFunctionLike, kindName, nameText, returnedExpression, unwrap, walk } from './ast.mjs';
import { Fn, UNKNOWN, bindParams, str } from './evaluate.mjs';

/** Actions that only report progress; hidden when they come from an inlined helper. */
export const NOISE_ACTIONS = new Set(['toast', 'dismissToast', 'setBusy', 'confirm', 'settleConfirm', 'markClean']);
import { modId, symId } from './graph.mjs';
import { literalKeys, storeActionId, storeKeyId } from './extract-store.mjs';

// ---------- effects ----------

export class Effects {
  constructor(index, ev, storeInfo) {
    this.index = index;
    this.ev = ev;
    this.storeInfo = storeInfo;
  }

  empty() {
    return { dialogs: [], calls: [], actions: [], writes: [], tabs: [], views: [] };
  }

  /** What running `node` (a handler, an arrow, a call) does. */
  analyze(node, f, env = {}, depth = 0, seen = new Set(), via = null) {
    const out = this.empty();
    if (!node) return out;
    const merge = (r, v) => {
      for (const k of Object.keys(out)) for (const x of r[k]) out[k].push(v && !x.via ? { ...x, via: v } : x);
    };
    const onCall = (n) => {
      const callee = unwrap(n.expression);
      const name = is.PropertyAccessExpression(callee) ? callee.name.text : is.Identifier(callee) ? callee.text : null;
      if (!name) return;
      const acc = is.PropertyAccessExpression(callee) ? this.storeInfo.accessIndex.get(`${f.rel}:${callee.pos}:${callee.end}`) : null;
      if (name === 'openDialog') {
        const req = this.ev.eval(n.arguments[0], f, env);
        if (req && typeof req === 'object' && !Array.isArray(req)) out.dialogs.push({ kind: str(req.kind) ?? '?', id: str(req.id) ?? '*', via });
        else out.dialogs.push({ kind: '?', id: '*', via });
      }
      if (acc) {
        out.actions.push({ store: acc.store, action: acc.member, via });
        if (acc.member === 'setTab') {
          const t = str(this.ev.eval(n.arguments[0], f, env));
          if (t) out.tabs.push({ tab: t, via });
        }
        if (acc.member === 'set') {
          const v = this.ev.eval(n.arguments[0], f, env);
          if (v && typeof v === 'object') {
            for (const k of Object.keys(v)) out.writes.push({ store: acc.store, key: k, via });
            if (v.dialog && typeof v.dialog === 'object' && str(v.dialog.id)) out.dialogs.push({ kind: 'coding', id: str(v.dialog.id), local: true, via });
            if (str(v.view)) out.views.push({ view: str(v.view), tab: str(v.analyseTab), via });
          }
        }
        return;
      }
      if (name === 'setState' && is.PropertyAccessExpression(callee) && is.Identifier(unwrap(callee.expression))) {
        const r = this.index.resolveLocal(f, unwrap(callee.expression).text);
        if (r && r.decl?.kind === 'store') for (const k of literalKeys(n.arguments[0])) out.writes.push({ store: r.name, key: k, via });
        return;
      }
      if (!is.Identifier(callee)) return;
      // local helper (const openT = (id) => () => ...) inside an enclosing function
      const local = findLocalFunction(n, name);
      if (local && depth < 4 && !seen.has(local)) {
        const args = n.arguments.map((a) => this.ev.eval(a, f, env));
        const s2 = new Set(seen).add(local);
        merge(this.analyze(local.body ?? local, f, bindParams(local, args, env), depth + 1, s2, via), null);
        return;
      }
      const r = this.index.resolveLocal(f, name);
      if (!r || !r.file || !r.decl) return;
      const d = r.decl;
      if (!['function', 'hook', 'const', 'component'].includes(d.kind)) return;
      const args = n.arguments.map((a) => str(this.ev.eval(a, f, env)));
      out.calls.push({ sym: symId(r.file, r.name), args, via });
      // inline small app/feature helpers one level to see the dialog they open
      if (d.fn && depth < 2 && /^src\/(app|features)\//.test(r.file) && !seen.has(d.fn)) {
        const tf = this.index.files.get(r.file);
        const argv = n.arguments.map((a) => this.ev.eval(a, f, env));
        const s2 = new Set(seen).add(d.fn);
        const sub = this.analyze(d.fn.body ?? d.fn, tf, bindParams(d.fn, argv, {}), depth + 1, s2, via ?? r.name);
        // only keep the concrete effects of the inlined function (not its own calls)
        for (const k of ['dialogs', 'actions', 'writes', 'tabs', 'views']) for (const x of sub[k]) out[k].push(x);
      }
    };
    const visit = (n) => {
      // take only the branch that runs when the condition is known (switch (id) with id bound, if (x === 'a'))
      if (is.SwitchStatement(n)) {
        const v = this.ev.eval(n.expression, f, env);
        if (v !== UNKNOWN && (typeof v === 'string' || typeof v === 'number')) {
          visit(n.expression);
          const clauses = n.caseBlock.clauses;
          let i = clauses.findIndex((cl) => is.CaseClause(cl) && this.ev.eval(cl.expression, f, env) === v);
          if (i < 0) i = clauses.findIndex((cl) => is.DefaultClause(cl));
          // fall through consecutive clauses until a break/return
          for (let j = i; j >= 0 && j < clauses.length; j++) {
            if (visitList(clauses[j].statements)) break;
          }
          return;
        }
      }
      if (is.IfStatement(n)) {
        const v = this.ev.eval(n.expression, f, env);
        if (v === true || v === false) {
          if (v) visit(n.thenStatement);
          else if (n.elseStatement) visit(n.elseStatement);
          return;
        }
      }
      if (is.Block(n)) {
        visitList(n.statements);
        return;
      }
      if (is.CallExpression(n)) onCall(n);
      n.forEachChild(visit);
    };
    // statements in order; stop after one that certainly ends the block (return, or an if known to return)
    const terminates = (st) => {
      if (!st) return false;
      if (is.ReturnStatement(st) || is.ThrowStatement(st) || is.BreakStatement(st)) return true;
      if (is.Block(st)) return st.statements.length > 0 && terminates(st.statements[st.statements.length - 1]);
      if (is.IfStatement(st)) {
        const v = this.ev.eval(st.expression, f, env);
        if (v === true) return terminates(st.thenStatement);
        if (v === false) return terminates(st.elseStatement);
        return terminates(st.thenStatement) && terminates(st.elseStatement);
      }
      return false;
    };
    const visitList = (list) => {
      for (const st of list) {
        visit(st);
        if (terminates(st)) return true;
      }
      return false;
    };
    visit(node);
    return out;
  }
}

function findLocalFunction(call, name) {
  for (const anc of ancestors(call)) {
    const body = isFunctionLike(anc) ? anc.body : is.SourceFile(anc) ? null : null;
    if (!body || !is.Block(body)) continue;
    for (const st of body.statements) {
      if (is.VariableStatement(st)) {
        for (const d of st.declarationList.declarations) {
          if (is.Identifier(d.name) && d.name.text === name && d.initializer && isFunctionLike(unwrap(d.initializer))) return unwrap(d.initializer);
        }
      } else if (is.FunctionDeclaration(st) && st.name?.text === name) return st;
    }
  }
  return null;
}

// ---------- menus ----------

function findLocalConst(scopeFn, name) {
  let found = null;
  walk(scopeFn, (n) => {
    if (found) return false;
    if (is.VariableDeclaration(n) && is.Identifier(n.name) && n.name.text === name && n.initializer) found = n.initializer;
    return undefined;
  });
  return found;
}

export function extractMenus(index, ev, effects, g, procs) {
  // Find the menubar model: a function returning [{ id, label, items }, ...].
  const menus = [];
  for (const f of index.files.values()) {
    if (f.isTest || !f.rel.startsWith('src/')) continue;
    for (const d of f.decls.values()) {
      if (!d.fn) continue;
      walk(d.fn, (n) => {
        if (!is.ReturnStatement(n) || !n.expression) return;
        const arr = unwrap(n.expression);
        if (!is.ArrayLiteralExpression(arr) || !arr.elements.length) return;
        const objs = arr.elements.map(unwrap);
        if (!objs.every((o) => is.ObjectLiteralExpression(o) && o.properties.some((p) => nameText(p.name) === 'items') && o.properties.some((p) => nameText(p.name) === 'label'))) return;
        menus.push({ f, d, arr: objs });
      });
    }
  }
  const commands = [];
  for (const m of menus) {
    const scopeFn = m.d.fn;
    for (const o of m.arr) {
      const get = (k) => o.properties.find((p) => nameText(p.name) === k);
      const id = str(ev.eval(get('id')?.initializer ?? get('id')?.name, m.f, {}));
      const label = str(ev.eval(get('label')?.initializer, m.f, {}));
      const itemsProp = get('items');
      const itemsExpr = is.ShorthandPropertyAssignment(itemsProp) ? itemsProp.name : itemsProp.initializer;
      let items = walkItems(itemsExpr, m.f, {}, scopeFn, ev, effects);
      const bad = items.filter((it) => !it.id || it.id.includes('{…}') || !it.label);
      if (bad.length && /\bprocedures\b/.test(itemsSourceText(itemsExpr, scopeFn, m.f))) {
        items = items.filter((it) => !bad.includes(it));
        items.push(...procedureMenuItems(procs, id, m.f, ev));
      }
      const menuId = `menu:${id}`;
      g.node(menuId, 'menu', label, { file: m.f.rel, area: m.f.area, order: m.arr.indexOf(o) });
      g.edge(symId(m.f.rel, m.d.name), menuId, 'defines');
      const emit = (it, parentId, path) => {
        const cid = `cmd:${id}:${it.id}`;
        const labelPath = [...path, it.label];
        const node = g.node(cid, it.children ? 'submenu' : 'command', it.label, {
          file: m.f.rel, area: m.f.area, menu: label, path: labelPath.join(' > '), shortcut: it.shortcut, requiresData: it.wrapper === 'needData' ? true : undefined,
          conditional: it.conditional || undefined, generated: it.generated, danger: it.danger || undefined, hint: it.title, order: commands.length,
        });
        g.edge(cid, parentId, 'part-of');
        commands.push({ id: cid, menu: id, item: it, path: labelPath });
        if (it.children) for (const c of it.children) emit(c, cid, labelPath);
        const fx = it.effects;
        if (fx) applyEffects(g, cid, fx);
        return node;
      };
      for (const it of items) emit(it, menuId, [label]);
    }
  }
  return { menus, commands };
}

export function applyEffects(g, from, fx) {
  for (const d of fx.dialogs) if (d.id !== '*' && d.kind !== '?') g.edge(from, `dialog:${d.kind}:${d.id}`, 'opens', { via: d.via ?? undefined });
  for (const a of fx.actions) if (!(a.via && NOISE_ACTIONS.has(a.action))) g.edge(from, storeActionId(a.store, a.action), 'calls-action', { via: a.via ?? undefined });
  for (const w of fx.writes) g.edge(from, storeKeyId(w.store, w.key), 'writes', { via: w.via ?? undefined });
  for (const c of fx.calls) g.edge(from, c.sym, 'calls', { via: c.args.filter(Boolean).length ? `(${c.args.map((a) => (a === undefined ? '…' : JSON.stringify(a))).join(', ')})` : undefined });
  for (const t of fx.tabs) g.edge(from, `tab:${t.tab}`, 'switches-to', { via: t.via ?? undefined });
  for (const v of fx.views) g.edge(from, `coding-view:${v.view}${v.tab ? '/' + v.tab : ''}`, 'switches-to', { via: v.via ?? undefined });
}

/** Source text that builds a menu's item list: its initializer through the last `.push()` onto it. */
function itemsSourceText(expr, scopeFn, f) {
  const e = unwrap(expr);
  if (!is.Identifier(e)) return f.ft.src(e);
  let start = Infinity;
  let end = -1;
  walk(scopeFn, (n) => {
    if (is.VariableDeclaration(n) && is.Identifier(n.name) && n.name.text === e.text) {
      start = Math.min(start, n.pos);
      end = Math.max(end, n.end);
    }
    if (is.CallExpression(n)) {
      const c = unwrap(n.expression);
      if (is.PropertyAccessExpression(c) && c.name.text === 'push' && is.Identifier(unwrap(c.expression)) && unwrap(c.expression).text === e.text) end = Math.max(end, n.end);
    }
  });
  return start < end ? f.ft.text.slice(start, end) : '';
}

function procedureMenuItems(procs, menuId, f, ev) {
  // Analyze menu: grouped by ProcedureDef.menu (ordered like a const array of menu names if one exists)
  const list = procs.filter((p) => p.menu !== 'Graphs');
  let order = [];
  for (const d of f.decls.values()) {
    const v = d.kind === 'const' ? ev.evalDecl(f.rel, d.name) : null;
    if (Array.isArray(v) && v.length && v.every((x) => typeof x === 'string') && v.some((x) => list.some((p) => p.menu === x))) order = v;
  }
  const groups = [...new Set(list.map((p) => p.menu))].sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99) || a.localeCompare(b));
  return groups.map((m) => ({
    id: `a-${m}`,
    label: m,
    generated: 'from ProcedureDef.menu',
    wrapper: 'needData',
    children: list
      .filter((p) => p.menu === m)
      .map((p) => ({ id: p.id, label: `${p.title}...`, wrapper: 'needData', generated: 'from procedures registry', effects: { dialogs: [{ kind: 'procedure', id: p.id }], calls: [], actions: [{ store: 'useStore', action: 'openDialog' }], writes: [], tabs: [], views: [] } })),
  }));
  void menuId;
}

function walkItems(expr, f, env, scopeFn, ev, effects) {
  const e = unwrap(expr);
  if (!e) return [];
  if (is.Identifier(e)) {
    const init = findLocalConst(scopeFn, e.text);
    const out = init ? walkItems(init, f, env, scopeFn, ev, effects) : [];
    // items pushed later: x.push(item)
    walk(scopeFn, (n) => {
      if (!is.CallExpression(n)) return;
      const c = unwrap(n.expression);
      if (!is.PropertyAccessExpression(c) || c.name.text !== 'push' || !is.Identifier(unwrap(c.expression)) || unwrap(c.expression).text !== e.text) return;
      // inside for-of over a static array?
      const loop = ancestors(n).find((a) => is.ForOfStatement(a));
      if (loop) {
        const arr = ev.eval(loop.expression, f, env);
        const decl = loop.initializer?.declarations?.[0];
        if (Array.isArray(arr) && decl) {
          for (const el of arr) {
            const env2 = { ...env };
            if (is.Identifier(decl.name)) env2[decl.name.text] = el;
            for (const a of n.arguments) out.push(...walkItemExpr(a, f, env2, scopeFn, ev, effects));
          }
          return;
        }
      }
      const inIf = ancestors(n).some((a) => is.IfStatement(a) && a.pos >= scopeFn.pos && a.end <= scopeFn.end);
      for (const a of n.arguments) out.push(...walkItemExpr(a, f, env, scopeFn, ev, effects, inIf ? { conditional: true } : {}));
    });
    return out;
  }
  if (is.CallExpression(e)) {
    const c = unwrap(e.expression);
    if (is.PropertyAccessExpression(c) && (c.name.text === 'filter' || c.name.text === 'slice')) return walkItems(c.expression, f, env, scopeFn, ev, effects);
    if (is.PropertyAccessExpression(c) && c.name.text === 'map') {
      const arr = ev.eval(c.expression, f, env);
      const cb = unwrap(e.arguments[0]);
      if (!Array.isArray(arr) || !cb || !isFunctionLike(cb)) return [{ id: undefined, label: undefined, unresolved: f.ft.src(e).slice(0, 80) }];
      const out = [];
      arr.forEach((el, i) => {
        const env2 = bindParams(cb, [el, i], env);
        out.push(...walkItemExpr(returnedExpression(cb), f, env2, scopeFn, ev, effects));
      });
      return out;
    }
    const a0 = unwrap(e.arguments[0]);
    if (is.Identifier(c) && a0 && is.ObjectLiteralExpression(a0)) return walkItemExpr(e, f, env, scopeFn, ev, effects);
    return [{ id: undefined, label: undefined, unresolved: f.ft.src(e).slice(0, 80) }];
  }
  if (is.ArrayLiteralExpression(e)) return e.elements.flatMap((el) => walkItemExpr(el, f, env, scopeFn, ev, effects));
  return [];
}

function walkItemExpr(el, f, env, scopeFn, ev, effects, flags = {}) {
  const e = unwrap(el);
  if (!e) return [];
  const k = kindName(e);
  if (k === 'NullKeyword' || (k === 'Identifier' && e.text === 'undefined')) return [];
  if (k === 'ObjectLiteralExpression') return [makeItem(e, f, env, scopeFn, ev, effects, flags)];
  if (k === 'ConditionalExpression') {
    const c = ev.eval(e.condition, f, env);
    if (c !== UNKNOWN) return walkItemExpr(c ? e.whenTrue : e.whenFalse, f, env, scopeFn, ev, effects, flags);
    const items = [...walkItemExpr(e.whenTrue, f, env, scopeFn, ev, effects, { ...flags, conditional: true }), ...walkItemExpr(e.whenFalse, f, env, scopeFn, ev, effects, { ...flags, conditional: true })];
    // same id in both branches: merge (keep the enabled one's effects)
    const byId = new Map();
    for (const it of items) {
      const prev = byId.get(it.id);
      if (!prev) byId.set(it.id, it);
      else if (!prev.effects && it.effects) byId.set(it.id, { ...it, conditional: true });
    }
    return [...byId.values()];
  }
  if (k === 'SpreadElement') return walkItems(e.expression, f, env, scopeFn, ev, effects);
  if (k === 'CallExpression') {
    const c = unwrap(e.expression);
    const a0 = unwrap(e.arguments[0]);
    if (is.Identifier(c) && a0 && is.ObjectLiteralExpression(a0)) return [makeItem(a0, f, env, scopeFn, ev, effects, { ...flags, wrapper: c.text })];
    if (is.PropertyAccessExpression(c) && ['map', 'filter', 'slice'].includes(c.name.text)) return walkItems(e, f, env, scopeFn, ev, effects);
    if (is.Identifier(c)) {
      const helper = findLocalFunction(e, c.text);
      const ret = helper && unwrap(returnedExpression(helper));
      if (ret && is.ObjectLiteralExpression(ret)) {
        const env2 = bindParams(helper, e.arguments.map((a) => ev.eval(a, f, env)), env);
        return [makeItem(ret, f, env2, scopeFn, ev, effects, { ...flags, helper: c.text })];
      }
    }
    return [{ id: undefined, label: undefined, unresolved: f.ft.src(e).slice(0, 80) }];
  }
  if (k === 'Identifier') {
    const init = findLocalConst(scopeFn, e.text);
    if (init) return walkItemExpr(init, f, env, scopeFn, ev, effects, flags);
  }
  return [];
}

function makeItem(obj, f, env, scopeFn, ev, effects, flags) {
  const get = (key) => obj.properties.find((p) => nameText(p.name) === key);
  const val = (key) => {
    const p = get(key);
    if (!p) return undefined;
    if (is.ShorthandPropertyAssignment(p)) return ev.eval(p.name, f, env);
    if (is.PropertyAssignment(p)) return ev.eval(p.initializer, f, env);
    return undefined;
  };
  const it = { id: str(val('id')), label: str(val('label')), shortcut: str(val('shortcut')), title: str(val('title')), danger: val('danger') === true, ...flags };
  const kids = get('children');
  if (kids) it.children = walkItems(is.ShorthandPropertyAssignment(kids) ? kids.name : kids.initializer, f, env, scopeFn, ev, effects);
  const on = get('onSelect');
  if (on) {
    const node = is.ShorthandPropertyAssignment(on) ? on.name : is.MethodDeclaration(on) ? on : on.initializer;
    it.effects = effects.analyze(node, f, env);
    // onSelect: someImportedFunction (a reference, not a call)
    const u = unwrap(node);
    if (is.Identifier(u)) {
      const r = ev.index.resolveLocal(f, u.text);
      if (r && r.file && r.decl) it.effects.calls.push({ sym: symId(r.file, r.name), args: [] });
    }
  }
  return it;
}

// ---------- dialog requests (who opens what) ----------

export function extractDialogRequests(index, ev, effects, g) {
  const requests = []; // { kind, id, from, file, line, dynamic }
  for (const f of index.files.values()) {
    if (f.isTest || !f.rel.startsWith('src/')) continue;
    walk(f.sf, (n) => {
      if (!is.CallExpression(n)) return;
      const callee = unwrap(n.expression);
      const name = is.PropertyAccessExpression(callee) ? callee.name.text : is.Identifier(callee) ? callee.text : null;
      if (name !== 'openDialog' && name !== 'set' && name !== 'setState') return;
      const owner = index.ownerOf(f, n);
      if (name === 'openDialog') {
        const arg = unwrap(n.arguments[0]);
        if (!arg) return; // store definition (openDialog: (d) => ...)
        const req = ev.eval(arg, f, {});
        const kind = req && typeof req === 'object' ? str(req.kind) : undefined;
        const id = req && typeof req === 'object' ? str(req.id) : undefined;
        requests.push({ kind: kind ?? '?', id: id ?? '*', owner, file: f.rel, line: f.ft.line(n), dynamic: !id || id.includes('{…}'), expr: f.ft.src(arg).slice(0, 120) });
        return;
      }
      // coding workspace local dialogs: useCodingUi...set({ dialog: { id } })
      const acc = is.PropertyAccessExpression(callee) ? effects.storeInfo.accessIndex.get(`${f.rel}:${callee.pos}:${callee.end}`) : null;
      if (name === 'set' && !acc) return;
      const v = ev.eval(n.arguments[0], f, {});
      if (v && typeof v === 'object' && v.dialog && typeof v.dialog === 'object') {
        const id = str(v.dialog.id);
        requests.push({ kind: 'coding', id: id ?? '*', owner, file: f.rel, line: f.ft.line(n), dynamic: !id, local: true, expr: f.ft.src(n.arguments[0]).slice(0, 120) });
      }
    });
  }
  // Wrappers: top-level functions that open a dialog whose id is one of their parameters
  // (openLocalDialog(id) ...). Calls to them with a literal id become requests too.
  const wrappers = new Map(); // symId -> { kind, param }
  for (const r of requests) {
    if (!r.dynamic || r.owner === '<module>') continue;
    const d = index.decl(r.file, r.owner);
    if (!d?.fn) continue;
    const params = (d.fn.parameters ?? []).map((p) => (is.Identifier(p.name) ? p.name.text : null));
    const m = r.expr.match(/\bid\b\s*(?::\s*([A-Za-z_$][\w$]*))?/);
    const idName = m ? m[1] ?? 'id' : null;
    const pi = params.indexOf(idName);
    if (pi >= 0) wrappers.set(symId(r.file, r.owner), { kind: r.kind, param: pi, local: r.local });
  }
  for (const f of index.files.values()) {
    if (f.isTest || !f.rel.startsWith('src/') || !wrappers.size) continue;
    walk(f.sf, (n) => {
      if (!is.CallExpression(n) || !is.Identifier(unwrap(n.expression))) return;
      const r = index.resolveLocal(f, unwrap(n.expression).text);
      if (!r || !r.file) return;
      const w = wrappers.get(symId(r.file, r.name));
      if (!w) return;
      const id = str(ev.eval(n.arguments[w.param], f, {}));
      requests.push({ kind: w.kind, id: id ?? '*', owner: index.ownerOf(f, n), file: f.rel, line: f.ft.line(n), dynamic: !id, local: w.local, via: r.name });
    });
  }
  for (const r of requests) {
    if (r.dynamic || r.kind === '?') continue;
    const from = r.owner === '<module>' ? modId(r.file) : symId(r.file, r.owner);
    g.edge(from, `dialog:${r.kind}:${r.id}`, 'opens', { via: r.via });
  }
  return { requests, wrappers };
}

// ---------- dialog routes (which component renders which dialog id) ----------

export function extractDialogRoutes(index, ev, g, procs) {
  const routes = []; // { kind, id, component: symId, via: symId, prefix?: true }
  const tagsIn = (node, f) => {
    const out = [];
    walk(node, (n) => {
      if (is.JsxSelfClosingElement(n) || is.JsxOpeningElement(n)) {
        const t = n.tagName;
        if (is.Identifier(t) && /^[A-Z]/.test(t.text)) {
          const r = index.resolveLocal(f, t.text);
          if (r && r.file) out.push(symId(r.file, r.name));
        }
      }
    });
    return [...new Set(out)];
  };
  const idCompare = (cond) => {
    const txt = cond;
    const m = txt.match(/(?:^|[^\w.])(?:[\w$]+\.)?id\s*===\s*['"]([^'"]+)['"]/);
    return m ? m[1] : null;
  };
  const hosts = [];
  for (const f of index.files.values()) {
    if (f.isTest || !f.rel.startsWith('src/')) continue;
    for (const d of f.decls.values()) {
      if (d.kind !== 'component' || !d.fn) continue;
      walk(d.fn, (n) => {
        // the dialog host: switch (dialog.kind) where `dialog` is the store's dialog request
        if (!is.SwitchStatement(n) || !/(^|\.)dialog\w*\.kind$/i.test(f.ft.src(n.expression))) return;
        hosts.push({ f, d, sw: n });
      });
    }
  }
  const subRouted = new Set();
  const subRouter = (compId, kind, viaHost) => {
    if (subRouted.has(`${compId}|${kind}`)) return;
    subRouted.add(`${compId}|${kind}`);
    const [file, name] = compId.slice(4).split('#');
    const f = index.files.get(file);
    const d = f?.decls.get(name);
    if (!d?.fn) return;
    walk(d.fn, (n) => {
      if (is.SwitchStatement(n)) {
        const disc = f.ft.src(n.expression);
        if (!/(^|\.)id$/.test(disc)) return;
        for (const cl of n.caseBlock.clauses) {
          if (!is.CaseClause(cl)) continue;
          const lit = str(ev.eval(cl.expression, f, {}));
          if (!lit) continue;
          for (const c of tagsIn(cl, f)) routes.push({ kind, id: lit, component: c, via: compId });
        }
      }
      if (is.IfStatement(n)) {
        const cond = f.ft.src(n.expression);
        const pm = cond.match(/\bid\.startsWith\(\s*['"]([^'"]+)['"]\s*\)/);
        if (pm) for (const c of tagsIn(n.thenStatement, f)) routes.push({ kind, id: pm[1], prefix: true, component: c, via: compId });
        const id = idCompare(cond);
        if (id) for (const c of tagsIn(n.thenStatement, f)) routes.push({ kind, id, component: c, via: compId });
      }
      if (is.ElementAccessExpression(n) && is.Identifier(unwrap(n.expression)) && /(^|\.)id$/.test(f.ft.src(n.argumentExpression))) {
        const regName = unwrap(n.expression).text;
        const rd = f.decls.get(regName);
        const lit = rd?.init && unwrap(rd.init);
        if (lit && is.ObjectLiteralExpression(lit)) {
          for (const p of lit.properties) {
            const key = nameText(p.name);
            if (!key) continue;
            const v = is.PropertyAssignment(p) ? unwrap(p.initializer) : is.ShorthandPropertyAssignment(p) ? p.name : null;
            let comps = [];
            if (v && is.Identifier(v)) {
              const r = index.resolveLocal(f, v.text);
              if (r && r.file) comps = [symId(r.file, r.name)];
            } else if (v) comps = tagsIn(v, f);
            for (const c of comps) routes.push({ kind, id: key, component: c, via: compId, registry: `${file}#${regName}` });
          }
        }
      }
    });
    // procedure registry
    const text = f.ft.src(d.fn);
    if (/\bgetProcedure\(|\bprocedures\b/.test(text) && kind === 'procedure') for (const p of procs) routes.push({ kind, id: p.id, component: compId, via: compId, registry: 'procedures' });
    void viaHost;
  };
  for (const h of hosts) {
    const { f, d, sw } = h;
    for (const cl of sw.caseBlock.clauses) {
      if (!is.CaseClause(cl)) continue;
      const kind = str(ev.eval(cl.expression, f, {}));
      if (!kind) continue;
      const ifRanges = [];
      walk(cl, (n) => {
        if (!is.IfStatement(n)) return;
        const id = idCompare(f.ft.src(n.expression));
        if (!id) return;
        ifRanges.push([n.thenStatement.pos, n.thenStatement.end]);
        for (const c of tagsIn(n.thenStatement, f)) routes.push({ kind, id, component: c, via: symId(f.rel, d.name) });
      });
      // default renderers of this kind (outside the id ifs)
      const defaults = [];
      walk(cl, (n) => {
        if ((is.JsxSelfClosingElement(n) || is.JsxOpeningElement(n)) && !ifRanges.some(([a, b]) => n.pos >= a && n.end <= b)) {
          const t = n.tagName;
          if (is.Identifier(t) && /^[A-Z]/.test(t.text)) {
            const r = index.resolveLocal(f, t.text);
            if (r && r.file) defaults.push(symId(r.file, r.name));
          }
        }
      });
      for (const c of new Set(defaults)) {
        g.edge(`dialog-kind:${kind}`, c, 'rendered-by');
        subRouter(c, kind, symId(f.rel, d.name));
      }
      g.node(`dialog-kind:${kind}`, 'dialog-kind', `${kind} dialogs`, { file: f.rel, area: f.area });
      g.edge(symId(f.rel, d.name), `dialog-kind:${kind}`, 'routes');
    }
  }
  // Prefix routes (view:*): valid suffixes are the keys of registries and union literals used in the router.
  const prefixTargets = new Map();
  for (const r of routes.filter((x) => x.prefix)) {
    const [file, name] = r.component.slice(4).split('#');
    const f = index.files.get(file);
    const d = f?.decls.get(name);
    const vals = new Set();
    if (d?.fn) {
      walk(d.fn, (n) => {
        if (is.ElementAccessExpression(n) && is.Identifier(unwrap(n.expression))) {
          const v = ev.evalDecl(file, unwrap(n.expression).text);
          if (v && typeof v === 'object' && !Array.isArray(v)) for (const k of Object.keys(v)) vals.add(k);
        }
        if (is.AsExpression(n) && is.TypeReference(n.type) && is.Identifier(n.type.typeName)) {
          for (const lit of unionLiterals(index, f, n.type.typeName.text)) vals.add(lit);
        }
      });
    }
    prefixTargets.set(`${r.kind}|${r.id}`, [...vals].sort());
  }
  return { routes, prefixTargets, hosts };
}

export function unionLiterals(index, f, typeName, seen = new Set()) {
  const r = index.resolveLocal(f, typeName);
  if (!r || !r.file || seen.has(`${r.file}#${r.name}`)) return [];
  seen.add(`${r.file}#${r.name}`);
  const d = index.decl(r.file, r.name);
  if (!d || d.kind !== 'type') return [];
  const tf = index.files.get(r.file);
  const out = [];
  const visit = (t) => {
    if (!t) return;
    if (is.UnionType(t)) t.types.forEach(visit);
    else if (is.LiteralType(t) && (is.StringLiteral(t.literal) || is.NoSubstitutionTemplateLiteral(t.literal))) out.push(t.literal.text);
    else if (is.TypeReference(t) && is.Identifier(t.typeName)) out.push(...unionLiterals(index, tf, t.typeName.text, seen));
    else if (is.ParenthesizedType(t)) visit(t.type);
  };
  visit(d.node.type);
  return out;
}

// ---------- search palette ----------

export function extractPalette(index, ev, g, commands, procs) {
  const sources = [];
  const cmdIds = new Set(commands.map((c) => c.id));
  const leafIds = new Set(commands.map((c) => c.item.id));
  const issues = [];
  for (const f of index.files.values()) {
    if (f.isTest || !f.rel.startsWith('src/app/')) continue;
    walk(f.sf, (n) => {
      if (is.ObjectLiteralExpression(n)) {
        const gp = n.properties.find((p) => nameText(p.name) === 'group' && is.PropertyAssignment(p));
        const idp = n.properties.find((p) => nameText(p.name) === 'id' && is.PropertyAssignment(p));
        if (gp && idp && is.StringLiteral(unwrap(gp.initializer))) {
          const group = unwrap(gp.initializer).text;
          const idInit = unwrap(idp.initializer);
          const prefix = is.TemplateExpression(idInit) ? idInit.head.text : is.StringLiteral(idInit) ? idInit.text : f.ft.src(idInit);
          sources.push({ group, prefix, file: f.rel, owner: index.ownerOf(f, n) });
        }
      }
      if ((is.StringLiteral(n) || is.NoSubstitutionTemplateLiteral(n)) && /^cmd:[\w-]+:[\w-]+$/.test(n.text)) {
        if (!cmdIds.has(n.text)) issues.push({ kind: 'palette-id', text: `\`${n.text}\` (${f.rel}:${f.ft.line(n)}) is not the id of any menu command`, file: f.rel });
        else g.edge(symId(f.rel, index.ownerOf(f, n)), n.text, 'suggests');
      }
    });
    for (const d of f.decls.values()) {
      if (!/SYNONYMS/i.test(d.name) || d.kind !== 'const') continue;
      const v = ev.evalDecl(f.rel, d.name);
      if (!v || typeof v !== 'object') continue;
      const procIds = new Set(procs.map((p) => p.id));
      for (const k of Object.keys(v).sort()) {
        if (!leafIds.has(k) && !procIds.has(k)) issues.push({ kind: 'synonym-id', text: `\`${d.name}['${k}']\` (${f.rel}) matches no menu item id, so its search words are never used`, file: f.rel });
      }
    }
  }
  const seen = new Set();
  for (const s of sources) {
    const key = `${s.group}|${s.prefix}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const id = `palette:${s.group}`;
    g.node(id, 'palette-source', `Search palette: ${s.group}`, { file: s.file, area: 'app', idPrefix: s.prefix });
    g.edge(symId(s.file, s.owner), id, 'defines');
  }
  if (commands.length) {
    g.node('palette:commands', 'palette-source', 'Search palette: commands', { area: 'app', idPrefix: 'cmd:' });
    for (const m of new Set(commands.map((c) => c.menu))) g.edge('palette:commands', `menu:${m}`, 'lists');
  }
  return { sources, issues };
}

export { Fn };
