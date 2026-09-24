#!/usr/bin/env node
// Socius relationship map generator: `npm run map`.
//
// Reads the TypeScript sources with the TypeScript compiler API (local, deterministic: nothing is sent
// anywhere) and writes docs/map/: an Obsidian vault (one note per module, component, store key/action,
// menu command, dialog, shortcut, procedure, transform, AI tool, storage key, test...), graph.json for
// tools and agents, GRAPH_REPORT.md (facts + inconsistencies) and DIAGRAMS.md (Mermaid).
//
// Options:
//   --out <dir>     output directory (default docs/map)
//   --check         build in memory and exit 1 if docs/map would change (for CI)
//   --debug         print extraction details

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProject, tsVersion } from './lib/ast.mjs';
import { CodeIndex } from './lib/index.mjs';
import { Evaluator } from './lib/evaluate.mjs';
import { Graph } from './lib/graph.mjs';
import { extractCode } from './lib/extract-code.mjs';
import { extractStores } from './lib/extract-store.mjs';
import { Effects, extractDialogRequests, extractDialogRoutes, extractMenus, extractPalette } from './lib/extract-ui.mjs';
import { buildAdjacency, extractAi, extractOutputModel, extractProcedures, extractShortcuts, extractStorage, extractTests, extractTransforms } from './lib/extract-domain.mjs';
import { analyse } from './lib/analyse.mjs';
import { emitAll } from './lib/emit.mjs';
import { ancestors, is, walk } from './lib/ast.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const args = process.argv.slice(2);
const outDir = path.resolve(root, args.includes('--out') ? args[args.indexOf('--out') + 1] : 'docs/map');
const debug = args.includes('--debug');
const check = args.includes('--check');

const t0 = Date.now();
const project = await loadProject(root);
let result;
try {
  const index = new CodeIndex(root, project).build(['src', 'tests', 'e2e']);
  const ev = new Evaluator(index, { fallback: { mod: 'Mod', 'modKey()': 'Mod', 'isMac()': false } });
  const g = new Graph();

  // Each extractor is isolated: if the code it reads is mid-refactor and it throws, the map is still
  // written (without that part) and the failure is listed in GRAPH_REPORT.md.
  const warnings = [];
  const safe = (name, fn, fallback) => {
    try {
      return fn();
    } catch (e) {
      warnings.push(`${name}: ${String(e?.stack ?? e).split('\n').slice(0, 3).join(' | ')}`);
      if (debug) console.error(e);
      return fallback;
    }
  };
  safe('code', () => extractCode(index, g));
  const adj = buildAdjacency(index);
  const storeInfo = safe('stores', () => extractStores(index, g), { stores: new Map(), accesses: [], accessIndex: new Map() });
  const effects = new Effects(index, ev, storeInfo);
  const { procs } = safe('procedures', () => extractProcedures(index, ev, g, adj), { procs: [] });
  const menuInfo = safe('menus', () => extractMenus(index, ev, effects, g, procs), { menus: [], commands: [] });
  const requestInfo = safe('dialog requests', () => extractDialogRequests(index, ev, effects, g), { requests: [], wrappers: new Map() });
  const routeInfo = safe('dialog routes', () => extractDialogRoutes(index, ev, g, procs), { routes: [], prefixTargets: new Map(), hosts: [] });
  const palette = safe('palette', () => extractPalette(index, ev, g, menuInfo.commands, procs), { sources: [], issues: [] });
  const loggers = new Set();
  for (const a of storeInfo.accesses) if (a.member === 'addOutput' && a.owner !== '<module>') loggers.add(`sym:${a.file}#${a.owner}`);
  const transforms = safe('transforms', () => extractTransforms(index, g, adj, routeInfo.routes, loggers), []);
  const ai = safe('ai', () => extractAi(index, ev, effects, g, adj, storeInfo), { providers: [], features: [], errors: { defined: new Map(), thrown: new Map(), checked: new Map() }, tools: [], prompts: [], compactIssues: [] });
  const storage = safe('storage', () => extractStorage(index, ev, g), { uses: [], wrappers: new Map() });
  const output = safe('output model', () => extractOutputModel(index, ev, g), { blockKinds: [], chartTypes: [], creators: new Map(), handlers: new Map(), procedureTags: new Map() });
  const shortcuts = safe('shortcuts', () => extractShortcuts(index, ev, g, menuInfo.commands, adj), { bound: [], documented: [], combos: new Map() });
  const tests = safe('tests', () => extractTests(index, g, { procs, commands: menuInfo.commands, tools: ai.tools, storage, transforms }), []);

  const tabViews = safe('tab views', () => findTabViews(index), new Set());
  const facts = { tabViews, index, ev, g, adj, storeInfo, procs, menuInfo, requestInfo, routeInfo, palette, transforms, ai, storage, output, shortcuts, tests, loggers, tsVersion: tsVersion() };
  const report = analyse(facts);
  for (const w of warnings) console.warn(`warning: extractor ${w}`);
  if (debug) debugDump(facts, report);
  result = emitAll(facts, report, outDir, { check });
} finally {
  project.close();
}
const secs = ((Date.now() - t0) / 1000).toFixed(1);
if (check) {
  if (result.changed.length) {
    console.error(`docs/map is out of date (${result.changed.length} files differ). Run: npm run map`);
    process.exit(1);
  }
  console.log(`docs/map is up to date (${secs}s)`);
} else {
  console.log(`Wrote ${path.relative(root, outDir)}: ${result.files} files, ${(result.bytes / 1024).toFixed(0)} KB, ${result.nodes} nodes, ${result.edges} edges (${result.changed.length} changed, ${result.removed} removed) in ${secs}s`);
}

function debugDump(f, report) {
  const log = (...a) => console.log(...a);
  log('stores', [...f.storeInfo.stores.values()].map((s) => `${s.name}: ${s.keys.size} keys, ${s.actions.size} actions`));
  log('procedures', f.procs.length, f.procs.slice(0, 3).map((p) => [p.id, p.syntax]));
  log('menus', f.menuInfo.commands.length);
  for (const c of f.menuInfo.commands.slice(0, 200)) {
    const fx = c.item.effects;
    log(' ', c.id, '|', c.path.join(' > '), c.item.shortcut ?? '', fx ? `dialogs=${fx.dialogs.map((d) => d.kind + ':' + d.id).join(',')} actions=${fx.actions.map((a) => a.store + '.' + a.action).join(',')} calls=${fx.calls.map((x) => x.sym.split('#')[1]).join(',')} tabs=${fx.tabs.map((t) => t.tab).join(',')}` : '');
  }
  log('requests', f.requestInfo.requests.map((r) => `${r.kind}:${r.id}${r.dynamic ? '(dyn)' : ''} <- ${r.file}#${r.owner}`));
  log('routes', f.routeInfo.routes.filter((r) => r.kind !== 'procedure').map((r) => `${r.kind}:${r.id}${r.prefix ? '*' : ''} -> ${r.component.split('#')[1]}`));
  log('prefixTargets', [...f.routeInfo.prefixTargets]);
  log('transforms', f.transforms.map((t) => `${t.id}: ${t.syntax.join('/')} lib=${t.libCalls.map((s) => s.split('#')[1]).join(',')} logged=${t.logged.map((s) => s.split('#')[1])}`));
  log('ai providers', f.ai.providers.map((p) => p.id), 'features', f.ai.features.map((x) => x.id));
  log('ai tools', f.ai.tools.map((t) => `${t.name}(${t.kind}) reads=${t.reads} perms=${t.perms}`));
  log('ai errors defined', [...f.ai.errors.defined.keys()], 'thrown', [...f.ai.errors.thrown.keys()]);
  log('prompts', f.ai.prompts.map((p) => p.name));
  log('storage', f.storage.uses.map((u) => `${u.backend}:${u.key} ${u.op} ${u.from}`));
  log('output kinds', f.output.blockKinds, f.output.chartTypes);
  log('shortcuts bound', f.shortcuts.bound.map((b) => `${b.combo}@${b.scope} ${b.from}`));
  log('shortcuts documented', f.shortcuts.documented.map((d) => `${d.combo} [${d.group}]`));
  log('palette', f.palette.sources.map((s) => s.group + ':' + s.prefix), f.palette.issues);
  log('issues', report.issues.length);
}

/** Components the app shell renders only for some values of the main tab (tab === 'x' ? <View/> : ...). */
function findTabViews(index) {
  const out = new Set();
  const f = index.files.get('src/app/App.tsx');
  const d = f?.decls.get('App');
  if (!d?.fn) return out;
  walk(d.fn, (n) => {
    if (!(is.JsxSelfClosingElement(n) || is.JsxOpeningElement(n)) || !is.Identifier(n.tagName)) return;
    const cond = ancestors(n).some((a) => (is.ConditionalExpression(a) && /\btab\b/.test(f.ft.src(a.condition))) || (is.BinaryExpression(a) && /\btab\b/.test(f.ft.src(a.left))));
    if (cond) out.add(n.tagName.text);
  });
  return out;
}
