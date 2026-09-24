// Modules, symbols (functions, components, hooks, stores, consts, types), imports and the
// symbol-level call / render / use graph.

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { modId, symId } from './graph.mjs';

/** Build and test configuration files outside src/ that point at source files (entry, aliases). */
const CONFIG_FILES = ['index.html', 'vite.config.ts', 'vite.config.js', 'playwright.config.ts', 'vitest.config.ts', 'package.json'];

const VALUE_KINDS = new Set(['function', 'component', 'hook', 'const', 'class', 'store', 'enum']);

export function moduleType(f) {
  if (f.rel.startsWith('e2e/')) return f.rel.endsWith('.spec.ts') ? 'e2e-spec' : 'test-helper';
  if (f.isTest) return /\.(test|spec)\.[cm]?[jt]sx?$/.test(f.rel) ? 'test' : 'test-helper';
  return 'module';
}

export function extractCode(index, g) {
  const areas = new Set();
  for (const f of index.files.values()) {
    const loc = f.ft.lines.length;
    const type = moduleType(f);
    const header = leadingComment(f.ft.text);
    g.node(modId(f.rel), type, f.rel, { file: f.rel, area: f.area, loc, summary: header });
    areas.add(f.area);
    g.edge(modId(f.rel), `area:${f.area}`, 'in-area');
    for (const d of f.decls.values()) {
      if (!VALUE_KINDS.has(d.kind) && !d.exported) continue;
      g.node(symId(f.rel, d.name), d.kind, d.name, { file: f.rel, line: d.line, area: f.area, exported: d.exported || undefined, doc: docComment(f, d) });
      g.edge(modId(f.rel), symId(f.rel, d.name), 'contains');
    }
  }
  for (const a of areas) g.node(`area:${a}`, 'area', a, { area: a });
  for (const cf of CONFIG_FILES) {
    const abs = path.join(index.root, cf);
    if (!existsSync(abs)) continue;
    const text = readFileSync(abs, 'utf8');
    for (const m of text.matchAll(/['"`(=]\.?\/?(src\/[\w./-]+\.[cm]?[jt]sx?)/g)) {
      if (!index.files.has(m[1])) continue;
      g.node(`config:${cf}`, 'config', cf, { file: cf, area: 'config' });
      g.edge(`config:${cf}`, modId(m[1]), 'references');
    }
  }

  for (const f of index.files.values()) {
    for (const imp of f.imports) {
      const props = { via: [imp.dynamic ? 'dynamic' : imp.reexport ? 're-export' : imp.typeOnly || (imp.names.length && imp.names.every((n) => n.typeOnly)) ? 'type-only' : imp.sideEffect ? 'side-effect' : 'value'] };
      if (imp.target.file) {
        if (index.files.has(imp.target.file)) g.edge(modId(f.rel), modId(imp.target.file), 'imports', props);
        else {
          g.node(`asset:${imp.target.file}`, 'asset', imp.target.file, { file: imp.target.file });
          g.edge(modId(f.rel), `asset:${imp.target.file}`, 'imports', props);
        }
      } else if (imp.target.external) {
        g.node(`package:${imp.target.external}`, 'package', imp.target.external);
        g.edge(modId(f.rel), `package:${imp.target.external}`, 'imports', props);
      } else if (imp.target.unresolved) {
        g.node(`unresolved:${imp.target.unresolved}`, 'unresolved', imp.target.unresolved);
        g.edge(modId(f.rel), `unresolved:${imp.target.unresolved}`, 'imports', props);
      }
    }
    for (const r of f.refs) {
      if (r.to.external || r.typeOnly) continue;
      const from = r.from === '<module>' ? modId(f.rel) : symId(f.rel, r.from);
      const toId = symId(r.to.file, r.to.name);
      if (!g.has(toId)) continue;
      if (!g.has(from)) continue;
      g.edge(from, toId, r.how);
    }
  }
}

function leadingComment(text) {
  const lines = [];
  for (const raw of text.split('\n')) {
    const l = raw.trim();
    if (l.startsWith('//')) lines.push(l.replace(/^\/\/\s?/, ''));
    else if (!l && !lines.length) continue;
    else break;
  }
  const s = lines.join(' ').replace(/\s+/g, ' ').trim();
  return s.length > 400 ? s.slice(0, 397) + '...' : s || undefined;
}

function docComment(f, d) {
  const text = f.ft.text;
  let start = d.node.pos;
  // For `const x = ...` the comment sits before the VariableStatement.
  const stmt = d.node.parent?.parent && d.node.parent.parent.parent === f.sf ? d.node.parent.parent : d.node;
  start = stmt.pos;
  const chunk = text.slice(start, f.ft.start(stmt));
  const m = chunk.match(/\/\*\*([\s\S]*?)\*\/\s*$/);
  let s;
  if (m) s = m[1].replace(/^\s*\*\s?/gm, '').replace(/\s+/g, ' ').trim();
  else {
    const ls = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
    const tail = [];
    for (let i = ls.length - 1; i >= 0 && ls[i].startsWith('//'); i--) tail.unshift(ls[i].replace(/^\/\/\s?/, ''));
    s = tail.join(' ').trim();
  }
  if (!s) return undefined;
  return s.length > 240 ? s.slice(0, 237) + '...' : s;
}

export { VALUE_KINDS };
