// zustand stores: state keys and actions (from the create() literal and the state interface), what each
// action writes/reads, and every place in the code that reads a key or calls an action:
//   useStore((s) => s.key)            selector            -> reads key / uses action
//   useStore.getState().action()       imperative          -> calls action
//   const st = useStore.getState; st().x   aliases         -> same
//   const { a, b } = useStore.getState()   destructuring   -> reads a, b
//   useStore.setState({ key })         direct write        -> writes key
//   useStore.subscribe((s, prev) => s.key)                 -> reads key
//   useCodingUi.getState().set({ view }) generic setter    -> writes view
// Plus "settings stores" that are not zustand but behave like one (AI settings in localStorage).

import { is, isFunctionLike, kindName, nameText, returnedExpression, unwrap, walk } from './ast.mjs';
import { modId, symId } from './graph.mjs';

/** Non-zustand state objects mapped like stores. Missing names are skipped silently. */
export const SETTINGS_STORES = [
  { id: 'aiSettings', label: 'AI settings (localStorage socius.ai)', iface: 'AiSettings', getters: ['getAiSettings', 'loadAiSettings'], setters: ['saveAiSettings'], moduleAliases: ['settings'] },
];

export function storeKeyId(store, key) {
  return `store-key:${store}.${key}`;
}
export function storeActionId(store, key) {
  return `store-action:${store}.${key}`;
}

export function extractStores(index, g) {
  const stores = new Map(); // storeName -> { name, file, keys:Set, actions:Set, generic:Set }
  for (const f of index.files.values()) {
    if (f.isTest) continue;
    for (const d of f.decls.values()) {
      if (d.kind !== 'store') continue;
      const st = { name: d.name, file: f.rel, keys: new Map(), actions: new Map(), zustand: true };
      stores.set(d.name, st);
      const iface = typeArgInterface(f, d.init);
      if (iface) for (const m of iface.members) addMember(st, f, m, isFnMember(m));
      const creator = unwrap(d.init.arguments?.[0]);
      const lit = creator && isFunctionLike(creator) ? unwrap(returnedExpression(creator)) : undefined;
      if (lit && is.ObjectLiteralExpression(lit)) {
        const [setName, getName] = (creator.parameters ?? []).map((p) => (is.Identifier(p.name) ? p.name.text : null));
        for (const p of lit.properties) {
          const key = nameText(p.name);
          if (!key) continue;
          const init = is.PropertyAssignment(p) ? unwrap(p.initializer) : null;
          const isAction = is.MethodDeclaration(p) || (init && isFunctionLike(init)) || st.actions.has(key);
          addMember(st, f, p, isAction);
          if (isAction) analyseAction(st, f, key, is.MethodDeclaration(p) ? p : init, setName, getName);
        }
      }
    }
  }
  // settings stores
  for (const cfg of SETTINGS_STORES) {
    let found = null;
    for (const f of index.files.values()) {
      if (f.isTest) continue;
      const d = f.decls.get(cfg.iface);
      if (d && d.kind === 'interface') found = { f, d };
    }
    if (!found) continue;
    const st = { name: cfg.id, label: cfg.label, file: found.f.rel, keys: new Map(), actions: new Map(), zustand: false, cfg };
    for (const m of found.d.node.members) addMember(st, found.f, m, false);
    stores.set(cfg.id, st);
  }

  // nodes
  for (const st of stores.values()) {
    const sid = st.zustand ? symId(st.file, st.name) : `settings:${st.name}`;
    st.nodeId = sid;
    if (!st.zustand) g.node(sid, 'store', st.label ?? st.name, { file: st.file, area: g.get(modId(st.file))?.area });
    else g.node(sid, 'store', st.name, { file: st.file });
    for (const [k, info] of st.keys) {
      g.node(storeKeyId(st.name, k), 'store-key', `${st.name}.${k}`, { file: st.file, line: info.line, store: st.name, doc: info.doc, area: g.get(modId(st.file))?.area });
      g.edge(sid, storeKeyId(st.name, k), 'has-key');
    }
    for (const [k, info] of st.actions) {
      g.node(storeActionId(st.name, k), 'store-action', `${st.name}.${k}()`, { file: st.file, line: info.line, store: st.name, doc: info.doc, area: g.get(modId(st.file))?.area });
      g.edge(sid, storeActionId(st.name, k), 'has-action');
      for (const w of info.writes ?? []) if (st.keys.has(w)) g.edge(storeActionId(st.name, k), storeKeyId(st.name, w), 'writes');
      for (const r of info.reads ?? []) if (st.keys.has(r)) g.edge(storeActionId(st.name, k), storeKeyId(st.name, r), 'reads');
      for (const c of info.calls ?? []) if (st.actions.has(c) && c !== k) g.edge(storeActionId(st.name, k), storeActionId(st.name, c), 'calls-action');
    }
  }

  // usages
  const accesses = [];
  const accessIndex = new Map();
  for (const f of index.files.values()) scanFile(index, f, stores, accesses, accessIndex);
  for (const a of accesses) {
    const st = stores.get(a.store);
    const from = a.owner === '<module>' ? modId(a.file) : symId(a.file, a.owner);
    if (!g.has(from)) continue;
    if (a.member === '*') {
      g.edge(from, st.nodeId, 'uses', { via: 'whole-state' });
      continue;
    }
    if (st.actions.has(a.member)) {
      g.edge(from, storeActionId(st.name, a.member), 'calls-action', { via: a.via });
      for (const w of a.writes ?? []) if (st.keys.has(w)) g.edge(from, storeKeyId(st.name, w), 'writes', { via: `${a.member}()` });
    } else if (st.keys.has(a.member)) {
      g.edge(from, storeKeyId(st.name, a.member), a.mode === 'write' ? 'writes' : 'reads', { via: a.via });
    } else if (a.mode === 'write') {
      // unknown key written (not declared): record on the store for the report
      st.unknownWrites = st.unknownWrites ?? new Set();
      st.unknownWrites.add(`${a.member} (${a.file}:${a.line})`);
    }
  }
  return { stores, accesses, accessIndex };
}

function isFnMember(m) {
  if (is.MethodSignature(m)) return true;
  if (is.PropertySignature(m) && m.type) {
    const t = m.type;
    return is.FunctionType(t) || (is.ParenthesizedType(t) && is.FunctionType(t.type));
  }
  return false;
}

function addMember(st, f, m, isAction) {
  const key = nameText(m.name);
  if (!key) return;
  const info = { line: f.ft.line(m), doc: jsdoc(f, m) };
  if (isAction) {
    st.keys.delete(key);
    const prev = st.actions.get(key);
    st.actions.set(key, { ...info, ...prev, line: prev?.line ?? info.line, doc: prev?.doc ?? info.doc });
  } else if (!st.actions.has(key)) {
    const prev = st.keys.get(key);
    st.keys.set(key, { line: prev?.line ?? info.line, doc: prev?.doc ?? info.doc });
  }
}

function jsdoc(f, m) {
  const chunk = f.ft.text.slice(m.pos, f.ft.start(m));
  const mm = chunk.match(/\/\*\*([\s\S]*?)\*\/\s*$/);
  if (mm) return mm[1].replace(/^\s*\*\s?/gm, '').replace(/\s+/g, ' ').trim().slice(0, 200) || undefined;
  const ls = chunk.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('//'));
  return ls.length ? ls.map((l) => l.replace(/^\/\/\s?/, '')).join(' ').slice(0, 200) : undefined;
}

function typeArgInterface(f, init) {
  let c = init;
  while (c && is.CallExpression(c)) {
    const ta = c.typeArguments?.[0];
    if (ta && is.TypeReference(ta) && is.Identifier(ta.typeName)) {
      const d = f.decls.get(ta.typeName.text);
      if (d && d.kind === 'interface') return d.node;
      if (d && d.kind === 'type' && d.node.type && is.TypeLiteral(d.node.type)) return d.node.type;
    }
    c = unwrap(c.expression);
  }
  return null;
}

function analyseAction(st, f, key, fn, setName, getName) {
  const info = st.actions.get(key);
  info.writes = new Set();
  info.reads = new Set();
  info.calls = new Set();
  if (!fn) return;
  walk(fn, (n) => {
    if (is.CallExpression(n)) {
      const callee = unwrap(n.expression);
      if (is.Identifier(callee) && callee.text === setName) {
        for (const k of literalKeys(n.arguments[0])) info.writes.add(k);
      }
      if (is.PropertyAccessExpression(callee)) {
        const recv = unwrap(callee.expression);
        if (is.CallExpression(recv) && is.Identifier(unwrap(recv.expression)) && unwrap(recv.expression).text === getName) info.calls.add(callee.name.text);
      }
    }
    if (is.PropertyAccessExpression(n)) {
      const recv = unwrap(n.expression);
      if (is.CallExpression(recv) && is.Identifier(unwrap(recv.expression)) && unwrap(recv.expression).text === getName) {
        const p = n.parent;
        if (!(is.CallExpression(p) && p.expression === n)) info.reads.add(n.name.text);
      }
    }
    // const { a, b } = get()
    if (is.VariableDeclaration(n) && n.initializer && is.ObjectBindingPattern(n.name)) {
      const init = unwrap(n.initializer);
      if (is.CallExpression(init) && is.Identifier(unwrap(init.expression)) && unwrap(init.expression).text === getName) {
        for (const el of n.name.elements) {
          const k = el.propertyName ? nameText(el.propertyName) : nameText(el.name);
          if (k) info.reads.add(k);
        }
      }
    }
  });
  for (const c of info.calls) info.reads.delete(c);
}

/** Keys of an object literal argument, or of the literal returned by an updater function. */
export function literalKeys(arg) {
  let a = unwrap(arg);
  if (a && isFunctionLike(a)) a = unwrap(returnedExpression(a));
  if (a && is.ConditionalExpression(a)) return [...literalKeys(a.whenTrue), ...literalKeys(a.whenFalse)];
  if (!a || !is.ObjectLiteralExpression(a)) return [];
  const out = [];
  for (const p of a.properties) {
    const k = nameText(p.name);
    if (k) out.push(k);
  }
  return out;
}

// ---------- usage scanning ----------

function scanFile(index, f, stores, accesses, accessIndex) {
  // local names bound to each store
  const locals = new Map(); // local name -> store name
  const getterFns = new Map(); // local fn name (getAiSettings) -> store
  const setterFns = new Map();
  for (const st of stores.values()) {
    if (st.zustand) {
      for (const [local, b] of f.bindings) {
        if (b.kind === 'decl' && f.rel === st.file && local === st.name) locals.set(local, st.name);
        if (b.kind === 'import') {
          const r = index.resolveLocal(f, local);
          if (r && r.file === st.file && r.name === st.name) locals.set(local, st.name);
        }
      }
    } else {
      for (const [local] of f.bindings) {
        const r = index.resolveLocal(f, local);
        if (!r || !r.file) continue;
        if (st.cfg.getters.includes(r.name)) getterFns.set(local, st.name);
        if (st.cfg.setters.includes(r.name)) setterFns.set(local, st.name);
      }
    }
  }
  const settingsAliases = new Map();
  for (const st of stores.values()) if (!st.zustand && st.file === f.rel) for (const a of st.cfg.moduleAliases ?? []) settingsAliases.set(a, st.name);
  if (!locals.size && !getterFns.size && !setterFns.size && !settingsAliases.size) return;

  const stateAliases = new Map(); // name -> store
  const getterAliases = new Map(); // name -> store  (const st = useStore.getState)
  const setAliases = new Map(); // name -> store (const { set } = useCodingUi())
  const record = (node, store, member, mode, via, extra = {}) => {
    const st = stores.get(store);
    const isAction = st.actions.has(member);
    const a = { file: f.rel, line: f.ft.line(node), owner: index.ownerOf(f, node), store, member, mode: isAction ? 'call' : mode, via, ...extra };
    accesses.push(a);
    accessIndex.set(`${f.rel}:${node.pos}:${node.end}`, a);
    return a;
  };

  /** e evaluates to the store state; classify what the surrounding code does with it. */
  const handleState = (e, store, via) => {
    let cur = e;
    while (cur.parent && (is.ParenthesizedExpression(cur.parent) || is.NonNullExpression(cur.parent))) cur = cur.parent;
    const p = cur.parent;
    if (!p) return;
    if (is.PropertyAccessExpression(p) && p.expression === cur) {
      const member = p.name.text;
      const gp = p.parent;
      const called = gp && is.CallExpression(gp) && gp.expression === p;
      const extra = {};
      if (called && member === 'set') extra.writes = literalKeys(gp.arguments[0]);
      if (called && member === 'set' && extra.writes.length) {
        record(p, store, member, 'call', via, extra);
        for (const w of extra.writes) record(gp.arguments[0], store, w, 'write', `${via}.set`);
        return;
      }
      record(p, store, member, called ? 'call' : 'read', via, extra);
    } else if (is.VariableDeclaration(p) && p.initializer && unwrap(p.initializer) === unwrap(cur)) {
      if (is.Identifier(p.name)) stateAliases.set(p.name.text, store);
      else if (is.ObjectBindingPattern(p.name))
        for (const el of p.name.elements) {
          const k = el.propertyName ? nameText(el.propertyName) : nameText(el.name);
          if (k) record(el, store, k, 'read', `${via} (destructured)`);
          if (k === 'set' && is.Identifier(el.name) && stores.get(store).actions.has('set')) setAliases.set(el.name.text, store);
        }
    } else if (is.CallExpression(p) && p.expression === cur) {
      // useStore.getState()() never happens
    } else {
      record(cur, store, '*', 'read', via);
    }
  };

  const selectorAccesses = (fn, store, via, mode = 'read') => {
    const p0 = fn.parameters?.[0]?.name;
    const p1 = fn.parameters?.[1]?.name;
    for (const pn of [p0, p1]) {
      if (!pn) continue;
      if (is.ObjectBindingPattern(pn)) {
        for (const el of pn.elements) {
          const k = el.propertyName ? nameText(el.propertyName) : nameText(el.name);
          if (k) record(el, store, k, mode, via);
        }
        continue;
      }
      if (!is.Identifier(pn)) continue;
      const name = pn.text;
      walk(fn.body, (n) => {
        if (is.PropertyAccessExpression(n) && is.Identifier(unwrap(n.expression)) && unwrap(n.expression).text === name) {
          record(n, store, n.name.text, mode, via);
        }
      });
    }
  };

  const K = index.K;
  walk(f.sf, (n) => {
    if (!is.Identifier(n)) return;
    if (index.isDeclarationName(n) || index.isPropertyName(n)) return;
    const p = n.parent;
    if (p && (is.ImportSpecifier(p) || is.ImportClause(p) || is.ExportSpecifier(p))) return;
    const name = n.text;
    const store = locals.get(name);
    if (store) {
      if (is.CallExpression(p) && p.expression === n) {
        const sel = unwrap(p.arguments[0]);
        if (sel && isFunctionLike(sel)) selectorAccesses(sel, store, 'selector');
        else if (!sel) handleState(p, store, 'hook');
        else record(p, store, '*', 'read', 'selector');
        return;
      }
      if (is.PropertyAccessExpression(p) && p.expression === n) {
        const m = p.name.text;
        const gp = p.parent;
        if (m === 'getState') {
          if (gp && is.CallExpression(gp) && gp.expression === p) handleState(gp, store, 'getState');
          else if (gp && is.VariableDeclaration(gp) && is.Identifier(gp.name)) getterAliases.set(gp.name.text, store);
        } else if (m === 'setState' && gp && is.CallExpression(gp)) {
          for (const k of literalKeys(gp.arguments[0])) record(gp, store, k, 'write', 'setState');
          const a0 = unwrap(gp.arguments[0]);
          if (a0 && isFunctionLike(a0)) selectorAccesses(a0, store, 'setState updater');
        } else if (m === 'subscribe' && gp && is.CallExpression(gp)) {
          const cb = unwrap(gp.arguments[0]);
          if (cb && isFunctionLike(cb)) selectorAccesses(cb, store, 'subscribe');
        }
      }
      return;
    }
    const gs = getterFns.get(name);
    if (gs && is.CallExpression(p) && p.expression === n) {
      handleState(p, gs, 'getter');
      return;
    }
    const ss = setterFns.get(name);
    if (ss && is.CallExpression(p) && p.expression === n) {
      for (const k of literalKeys(p.arguments[0])) record(p, ss, k, 'write', 'setter');
      return;
    }
    const sa = settingsAliases.get(name);
    if (sa && is.PropertyAccessExpression(p) && p.expression === n) {
      const gp = p.parent;
      const assigned = gp && is.BinaryExpression(gp) && gp.left === p && kindName(gp.operatorToken) === 'EqualsToken';
      record(p, sa, p.name.text, assigned ? 'write' : 'read', 'module state');
    }
  });
  // alias passes
  if (stateAliases.size || getterAliases.size || setAliases.size)
    walk(f.sf, (n) => {
      if (!is.Identifier(n) || index.isDeclarationName(n) || index.isPropertyName(n)) return;
      const p = n.parent;
      const sa = stateAliases.get(n.text);
      if (sa && is.PropertyAccessExpression(p) && p.expression === n) handleState(n, sa, 'alias');
      const ga = getterAliases.get(n.text);
      if (ga && is.CallExpression(p) && p.expression === n) handleState(p, ga, 'getState alias');
      const sa2 = setAliases.get(n.text);
      if (sa2 && is.CallExpression(p) && p.expression === n) for (const k of literalKeys(p.arguments[0])) record(p, sa2, k, 'write', 'set alias');
    });
  void K;
}
