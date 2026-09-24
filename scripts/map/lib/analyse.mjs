// Cross-checks over the extracted graph: things that are declared but never used, used but never
// declared, and structural hot spots. Every finding is a lead for a human to confirm, not a verdict.

import { is, unwrap, walk } from './ast.mjs';
import { modId, symId } from './graph.mjs';
import { fileOfSym, nameOfSym } from './extract-domain.mjs';

/** Layer rank per area: imports should point to the same or a lower rank. */
export function layerRank(area) {
  if (area === 'core' || area === 'samples' || area === 'styles') return 0;
  if (area === 'platform' || area.startsWith('lib')) return 1;
  if (area === 'procedures' || area === 'ui') return 2;
  if (area.startsWith('features')) return 3;
  if (area === 'app') return 4;
  return 9; // tests, e2e
}

export function analyse(facts) {
  const { index, g, storeInfo, routeInfo, requestInfo, menuInfo, shortcuts, storage, palette, ai, procs, transforms } = facts;
  g.freeze();
  const issues = [];
  const add = (category, title, severity, items, note) => {
    if (items.length) issues.push({ category, title, severity, items: [...new Set(items)].sort(), note });
  };
  const link = (id) => `[[${id}]]`; // resolved by the emitter

  // ---------- dialogs ----------
  const routes = routeInfo.routes;
  const exact = new Map();
  for (const r of routes) if (!r.prefix) exact.set(`${r.kind}:${r.id}`, r);
  const prefixes = routes.filter((r) => r.prefix);
  const kindsWithRoutes = new Set(routes.map((r) => r.kind));
  const routed = (kind, id) => {
    if (exact.has(`${kind}:${id}`)) return { ok: true };
    for (const p of prefixes) {
      if (p.kind !== kind || !id.startsWith(p.id)) continue;
      const targets = routeInfo.prefixTargets.get(`${p.kind}|${p.id}`) ?? [];
      const rest = id.slice(p.id.length);
      if (!targets.length || targets.includes(rest)) return { ok: true, prefix: p };
      return { ok: false, why: `"${rest}" is not one of the targets ${p.component.split('#')[1]} knows (${targets.join(', ')})` };
    }
    return { ok: false, why: kindsWithRoutes.has(kind) ? `no renderer handles id "${id}" for kind "${kind}"` : `no renderer handles dialog kind "${kind}"` };
  };
  const requested = new Map(); // key -> [openers]
  for (const e of g.edges.values()) {
    if (e.type !== 'opens' || !e.target.startsWith('dialog:')) continue;
    const key = e.target.slice('dialog:'.length);
    if (!requested.has(key)) requested.set(key, []);
    requested.get(key).push(e.source);
  }
  // dialog nodes + rendered-by edges
  const dialogKeys = new Set([...requested.keys(), ...routes.filter((r) => !r.prefix).map((r) => `${r.kind}:${r.id}`)]);
  for (const key of dialogKeys) {
    const [kind, ...rest] = key.split(':');
    const id = rest.join(':');
    const n = g.node(`dialog:${key}`, 'dialog', `${kind}: ${id}`, { area: 'dialogs', kind, dialogId: id });
    const r = routed(kind, id);
    n.routed = r.ok;
    const comps = r.ok ? (r.prefix ? [r.prefix] : routes.filter((x) => !x.prefix && x.kind === kind && x.id === id)) : [];
    for (const c of comps) {
      g.edge(`dialog:${key}`, c.component, 'rendered-by', { via: c.registry ? `registry ${c.registry.split('#').pop()}` : c.prefix ? `prefix ${c.id}` : undefined });
      g.edge(`dialog:${key}`, `dialog-kind:${kind}`, 'part-of');
    }
    if (!r.ok) n.problem = r.why;
  }
  g.freeze();
  const noRenderer = [];
  for (const [key, openers] of requested) {
    const [kind, ...rest] = key.split(':');
    const r = routed(kind, rest.join(':'));
    if (!r.ok) noRenderer.push(`${link('dialog:' + key)} opened by ${[...new Set(openers)].sort().map(link).join(', ')}: ${r.why}`);
  }
  add('dialogs', 'Dialog requests with no renderer (opening them shows nothing)', 'high', noRenderer);
  const neverOpened = [];
  for (const r of routes) {
    if (r.registry === 'procedures' || r.prefix) continue;
    const key = `${r.kind}:${r.id}`;
    if (!requested.has(key)) neverOpened.push(`${link('dialog:' + key)} rendered by ${link(r.component)} is never opened by any menu, button or code path the map can see`);
  }
  add('dialogs', 'Dialog renderers that nothing opens', 'medium', neverOpened, 'Dynamic ids (openDialog({ id: someVariable })) are invisible to the map; check the "dynamic dialog requests" list below before deleting anything.');
  const dyn = requestInfo.requests.filter((r) => r.dynamic).map((r) => `\`${r.kind}:${r.id}\` in ${link(r.owner === '<module>' ? modId(r.file) : symId(r.file, r.owner))} (${r.file}:${r.line}) \`${(r.expr ?? '').replace(/\s+/g, ' ').slice(0, 70)}\``);
  add('dialogs', 'Dynamic dialog requests (id computed at run time; not verifiable statically)', 'info', dyn);

  // ---------- dead exports / orphans ----------
  const importers = new Map(); // symId -> Set(file)
  const note = (id, file) => {
    if (!importers.has(id)) importers.set(id, new Set());
    importers.get(id).add(file);
  };
  const dynTargets = new Set();
  for (const f of index.files.values()) {
    for (const imp of f.imports) {
      if (!imp.target.file) continue;
      if (imp.dynamic) dynTargets.add(imp.target.file);
      if (imp.reexport) continue;
      for (const n of imp.names) {
        const r = index.resolveExport(imp.target.file, n.imported);
        if (r) note(symId(r.file, r.name), f.rel);
      }
    }
    for (const r of f.refs) if (r.to.file && r.to.file !== f.rel) note(symId(r.to.file, r.to.name), f.rel);
  }
  const deadAll = [];
  const deadLocal = [];
  const testOnly = [];
  let deadTypes = 0;
  for (const f of index.files.values()) {
    if (f.isTest || !f.rel.startsWith('src/') || f.rel === 'src/main.tsx' || dynTargets.has(f.rel)) continue;
    for (const d of f.decls.values()) {
      if (!d.exported) continue;
      const id = symId(f.rel, d.name);
      const imps = [...(importers.get(id) ?? [])];
      const fromSrc = imps.filter((x) => x.startsWith('src/'));
      if (d.kind === 'interface' || d.kind === 'type') {
        if (!imps.length) deadTypes++;
        continue;
      }
      if (fromSrc.length) continue;
      const localUse = (facts.adj.get(modId(f.rel)) ?? []).some((e) => e.to === id) || [...f.decls.keys()].some((k) => k !== d.name && (facts.adj.get(symId(f.rel, k)) ?? []).some((e) => e.to === id));
      if (imps.length) testOnly.push(`${link(id)} (${f.rel}) is imported only by tests: ${imps.sort().map((x) => link(modId(x))).join(', ')}`);
      else if (localUse) deadLocal.push(`${link(id)} (${f.rel}) is exported but only used inside its own file`);
      else deadAll.push(`${link(id)} (${d.kind}, ${f.rel}:${d.line}) is exported and never used anywhere`);
    }
  }
  add('dead-code', 'Dead exports: exported and never used anywhere (not even in their own file)', 'medium', deadAll);
  add('dead-code', 'Exports used only by tests (production code never imports them)', 'low', testOnly);
  add('dead-code', 'Needless exports: only used inside their own file', 'info', deadLocal);

  const unrendered = [];
  const unreferenced = [];
  for (const n of g.nodes.values()) {
    if (n.type !== 'component' || !n.file?.startsWith('src/')) continue;
    const inc = g.in(n.id);
    if (inc.some((e) => e.type === 'renders')) continue;
    const other = inc.filter((e) => ['uses', 'calls', 'rendered-by'].includes(e.type));
    if (other.length) unrendered.push(`${link(n.id)} (${n.file}) is never rendered as <${n.label}>; it is referenced by ${[...new Set(other.map((e) => e.source))].sort().map(link).join(', ')}`);
    else unreferenced.push(`${link(n.id)} (${n.file}:${n.line}) is never rendered or referenced`);
  }
  add('dead-code', 'Components never rendered or referenced (dead UI)', 'medium', unreferenced);
  add('dead-code', 'Components never rendered through JSX (used through a registry, a prop or a function call)', 'info', unrendered);

  const orphanModules = [];
  const testOnlyModules = [];
  for (const n of g.nodes.values()) {
    if (n.type !== 'module' || !n.file.startsWith('src/') || n.file === 'src/main.tsx') continue;
    const inc = g.in(n.id, 'imports');
    if (!inc.length && !g.in(n.id, 'references').length) orphanModules.push(`${link(n.id)} is not imported by any file`);
    else if (inc.every((e) => g.get(e.source)?.type !== 'module') && !g.in(n.id, 'references').length) testOnlyModules.push(`${link(n.id)} is imported only by tests`);
  }
  add('dead-code', 'Source files nothing imports', 'medium', orphanModules);
  add('dead-code', 'Source files imported only by tests', 'low', testOnlyModules);

  // ---------- stores ----------
  const neverCalled = [];
  const neverRead = [];
  const neverWritten = [];
  for (const st of storeInfo.stores.values()) {
    for (const k of st.actions.keys()) {
      const id = `store-action:${st.name}.${k}`;
      if (!g.in(id, 'calls-action').length) neverCalled.push(`${link(id)} (${st.file}) is defined but never called or selected`);
    }
    for (const k of st.keys.keys()) {
      const id = `store-key:${st.name}.${k}`;
      if (!g.in(id, 'reads').length) neverRead.push(`${link(id)} (${st.file}) is never read`);
      if (!g.in(id, 'writes').length) neverWritten.push(`${link(id)} (${st.file}) is never written after its initial value`);
    }
    for (const w of st.unknownWrites ?? []) neverRead.push(`${st.name}: writes undeclared key ${w}`);
  }
  add('stores', 'Store actions never called', 'medium', neverCalled);
  add('stores', 'Store keys never read (write-only state)', 'medium', neverRead);
  add('stores', 'Store keys never written after initialisation (constant state)', 'info', neverWritten);

  // ---------- menus ----------
  const noEffect = [];
  for (const c of menuInfo.commands) {
    const n = g.get(c.id);
    if (!n || n.type !== 'command') continue;
    const outs = g.out(c.id).filter((e) => ['opens', 'calls', 'calls-action', 'writes', 'switches-to'].includes(e.type));
    if (!outs.length && !/-none$/.test(c.item.id ?? '')) noEffect.push(`${link(c.id)} (${c.path.join(' > ')}) has no effect the map can see`);
  }
  add('menus', 'Menu commands with no detectable effect', 'medium', noEffect);
  const unresolvedItems = [];
  for (const c of menuInfo.commands) if (!c.item.id || !c.item.label) unresolvedItems.push(`${c.path.join(' > ')}: ${c.item.unresolved ?? 'id/label not static'}`);
  add('menus', 'Menu items the map could not resolve statically', 'info', unresolvedItems);
  add('palette', 'Search palette ids and synonyms that point nowhere', 'medium', palette.issues.map((x) => x.text));

  // ---------- shortcuts ----------
  const boundCombos = new Map();
  for (const b of shortcuts.bound) {
    if (!boundCombos.has(b.combo)) boundCombos.set(b.combo, []);
    boundCombos.get(b.combo).push(b);
  }
  const docNotBound = [];
  const seenDoc = new Set();
  for (const d of shortcuts.documented) {
    const k = `${d.combo}|${d.group}`;
    if (seenDoc.has(k)) continue;
    seenDoc.add(k);
    if (!boundCombos.has(d.combo)) docNotBound.push(`\`${d.combo}\` (${d.group}: ${d.description}) is documented in ${link(d.where)} but no key handler compares e.key to it`);
    else if (d.group === 'Menu labels' || /everywhere/i.test(d.group)) {
      if (!boundCombos.get(d.combo).some((b) => b.scope === 'global')) docNotBound.push(`\`${d.combo}\` (${d.group}: ${d.description}) is documented as a global shortcut but is only handled inside ${[...new Set(boundCombos.get(d.combo).map((b) => b.from))].map(link).join(', ')}`);
    }
  }
  add('shortcuts', 'Shortcuts documented but not bound (or bound only locally)', 'medium', docNotBound, 'Keys matched with a regular expression or a lookup table are invisible to the map.');
  const twice = [];
  for (const [combo, list] of boundCombos) {
    const globals = [...new Set(list.filter((b) => b.scope === 'global').map((b) => b.from))];
    if (globals.length > 1 && !/^(Escape|Arrow|Enter|Tab)/.test(combo)) twice.push(`\`${combo}\` has global handlers in ${globals.sort().map(link).join(', ')}`);
    const locals = [...new Set(list.filter((b) => b.scope !== 'global').map((b) => b.from))];
    if (globals.length && locals.length && /^Mod\+|^\/$/.test(combo)) twice.push(`\`${combo}\` is handled globally in ${globals.map(link).join(', ')} and also locally in ${locals.sort().map(link).join(', ')} (check which one wins)`);
  }
  add('shortcuts', 'Shortcuts bound more than once', 'medium', twice);
  const escGlobal = [...new Set((boundCombos.get('Escape') ?? []).filter((b) => b.scope === 'global').map((b) => b.from))];
  if (escGlobal.length > 1) add('shortcuts', 'Global Escape listeners (each closes its own popup; check they do not fight)', 'info', escGlobal.sort().map(link));
  const docCombos = new Set(shortcuts.documented.map((d) => d.combo));
  const undocumented = [];
  for (const [combo, list] of boundCombos) {
    if (docCombos.has(combo)) continue;
    const globals = list.filter((b) => b.scope === 'global');
    if (globals.length && /^(Mod|Alt)\+|^\/$/.test(combo)) undocumented.push(`\`${combo}\` is bound globally in ${[...new Set(globals.map((b) => b.from))].map(link).join(', ')} but not documented in Help > Keyboard shortcuts or a menu`);
  }
  add('shortcuts', 'Global shortcuts that are not documented', 'low', undocumented);

  // ---------- storage ----------
  const byKey = new Map();
  for (const u of storage.uses) {
    const k = `${u.backend}:${u.key}`;
    if (!byKey.has(k)) byKey.set(k, new Set());
    byKey.get(k).add(u.op);
  }
  const wNotR = [];
  const rNotW = [];
  for (const [k, ops] of byKey) {
    if (ops.has('writes') && !ops.has('reads') && !ops.has('listens')) wNotR.push(`${link('storage:' + k)} is written but never read`);
    if ((ops.has('reads') || ops.has('listens')) && !ops.has('writes')) rNotW.push(`${link('storage:' + k)} is read but never written`);
    if (k.includes('{…}') || k.includes(':?')) rNotW.push(`${link('storage:' + k)} has a key the map could not compute`);
  }
  add('storage', 'Storage keys written but never read', 'medium', wNotR);
  add('storage', 'Storage keys read but never written (or not computable)', 'medium', rNotW);

  // ---------- AI ----------
  const { defined, thrown, checked } = ai.errors;
  const notExplained = [...thrown.keys()].filter((c) => !defined.has(c) && c !== 'unavailable').map((c) => `${link('ai-error:' + c)} is produced by ${[...thrown.get(c)].sort().map(link).join(', ')} but aiErrorMessage has no case for it (users get the generic "not available" text)`);
  add('ai', 'AI error codes produced but not explained to the user', 'high', notExplained);
  const neverProduced = [...defined.keys()].filter((c) => !thrown.has(c) && !checked.has(c)).map((c) => `${link('ai-error:' + c)} has a message but nothing produces it`);
  add('ai', 'AI error messages for codes nothing produces', 'low', neverProduced);
  add('ai', 'Assistant tool lists that name missing tools', 'high', ai.compactIssues);
  const featNoEntry = ai.features.filter((f) => !g.in(`ai-feature:${f.id}`).length && !g.out(`ai-feature:${f.id}`).length).map((f) => `${link('ai-feature:' + f.id)} has no start path the map can see`);
  add('ai', 'AI features with no start path', 'medium', featNoEntry);

  // ---------- tests ----------
  const untestedProcs = procs.filter((p) => !g.out(`procedure:${p.id}`, 'tested-by').length).map((p) => `${link('procedure:' + p.id)} (${p.menu} > ${p.title})`);
  add('tests', 'Procedures no test mentions by id or menu label', 'low', untestedProcs, 'A procedure can still be covered indirectly (for example through a loop over the registry).');
  const untestedTransforms = transforms.filter((t) => !g.out(`transform:${t.id}`, 'tested-by').length && !g.in(`dialog:transform:${t.id}`, 'opens').some((e) => g.out(e.source, 'tested-by').length)).map((t) => `${link('transform:' + t.id)}`);
  add('tests', 'Transform dialogs with no test mentioning them (id, menu label or their lib functions)', 'low', untestedTransforms.filter((x) => {
    const tid = x.slice('[[transform:'.length, -2);
    const t = transforms.find((y) => y.id === tid);
    return !(t?.libCalls ?? []).some((s) => g.in(modId(fileOfSym(s)), 'tested-by').length || g.out(modId(fileOfSym(s)), 'tested-by').length);
  }));
  const untestedCmds = menuInfo.commands
    .filter((c) => g.get(c.id)?.type === 'command' && !/-none$/.test(c.item.id ?? '') && !g.out(c.id, 'tested-by').length)
    .map((c) => link(c.id));
  add('tests', 'Menu commands no test or e2e spec mentions by label', 'low', untestedCmds, 'Matched by exact menu label text in test files; a command can also be covered through the function it calls.');
  const untestedTools = ai.tools.filter((t) => !g.out(`ai-tool:${t.name}`, 'tested-by').length).map((t) => link(`ai-tool:${t.name}`));
  add('tests', 'Assistant tools no test names', 'low', untestedTools);
  const notLogged = transforms.filter((t) => !t.logged.length).map((t) => `${link('transform:' + t.id)} rendered by ${t.comps.map(link).join(', ')}: no path to addOutput found (the change may not appear in the Output log)`);
  add('transforms', 'Transforms that do not reach the Output log', 'medium', notLogged);

  // ---------- structure ----------
  const unresolved = [];
  for (const f of index.files.values()) for (const imp of f.imports) if (imp.target.unresolved) unresolved.push(`${link(modId(f.rel))} imports \`${imp.spec}\`, which does not exist`);
  add('structure', 'Imports that do not resolve', 'high', unresolved);
  const layering = [];
  const areaEdges = new Map();
  for (const e of g.edges.values()) {
    if (e.type !== 'imports') continue;
    const a = g.get(e.source);
    const b = g.get(e.target);
    if (!a || !b || b.type !== 'module' || a.type !== 'module') continue;
    if (a.area !== b.area) {
      const k = `${a.area} -> ${b.area}`;
      areaEdges.set(k, (areaEdges.get(k) ?? 0) + 1);
    }
    if (layerRank(a.area) < layerRank(b.area) && layerRank(a.area) < 9) layering.push(`${link(e.source)} (${a.area}) imports ${link(e.target)} (${b.area})${e.via?.includes('type-only') ? ' [types only]' : ''}`);
  }
  add('structure', 'Layering: lower layers importing higher ones (core < lib/platform < procedures/ui < features < app)', 'low', layering, 'Mostly shared UI state (app/ui-store.ts) and helpers living in a higher layer than their users; moving them down removes the coupling.');
  const cycles = findCycles(g);
  add('structure', 'Import cycles between modules (value imports)', 'low', cycles.map((c) => c.map(link).join(' -> ')));

  // hubs
  const fanIn = [];
  const fanOut = [];
  for (const n of g.nodes.values()) {
    if (n.type !== 'module' || !n.file.startsWith('src/')) continue;
    fanIn.push([n.id, g.in(n.id, 'imports').length]);
    fanOut.push([n.id, g.out(n.id, 'imports').filter((e) => g.get(e.target)?.type === 'module').length]);
  }
  fanIn.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  fanOut.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const symFanIn = [];
  for (const n of g.nodes.values()) {
    if (!n.file?.startsWith('src/') || !['function', 'component', 'hook', 'store', 'const', 'class'].includes(n.type)) continue;
    const users = new Set(g.in(n.id).filter((e) => ['calls', 'renders', 'uses'].includes(e.type)).map((e) => g.get(e.source)?.file).filter((x) => x && x !== n.file));
    symFanIn.push([n.id, users.size]);
  }
  symFanIn.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  return {
    issues,
    coupling: [...areaEdges.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    fanIn: fanIn.slice(0, 20),
    fanOut: fanOut.slice(0, 20),
    symFanIn: symFanIn.slice(0, 25),
    deadTypes,
    requested,
    routed,
  };
}

/** Strongly connected components (size > 1) of the value-import graph between src modules. */
function findCycles(g) {
  const adj = new Map();
  for (const e of g.edges.values()) {
    if (e.type !== 'imports' || !e.source.startsWith('module:src/') || !e.target.startsWith('module:src/')) continue;
    if (e.via?.length && e.via.every((v) => v === 'type-only')) continue;
    if (!adj.has(e.source)) adj.set(e.source, []);
    adj.get(e.source).push(e.target);
  }
  let idx = 0;
  const stack = [];
  const on = new Set();
  const index = new Map();
  const low = new Map();
  const out = [];
  const strong = (v) => {
    index.set(v, idx);
    low.set(v, idx);
    idx++;
    stack.push(v);
    on.add(v);
    for (const w of adj.get(v) ?? []) {
      if (!index.has(w)) {
        strong(w);
        low.set(v, Math.min(low.get(v), low.get(w)));
      } else if (on.has(w)) low.set(v, Math.min(low.get(v), index.get(w)));
    }
    if (low.get(v) === index.get(v)) {
      const comp = [];
      let w;
      do {
        w = stack.pop();
        on.delete(w);
        comp.push(w);
      } while (w !== v);
      if (comp.length > 1) out.push(comp.sort());
    }
  };
  for (const v of [...adj.keys()].sort()) if (!index.has(v)) strong(v);
  return out.sort((a, b) => a[0].localeCompare(b[0]));
}

export { is, unwrap, walk, nameOfSym };
