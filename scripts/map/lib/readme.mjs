// README.md (how to use and regenerate the map) and Home.md (the vault's start page and indexes).

import { EDGE_LABELS } from './emit.mjs';

export const OBSIDIAN_GRAPH = {
  'collapse-filter': false,
  search: '-path:Code/tests -path:Code/e2e',
  showTags: false,
  showAttachments: false,
  hideUnresolved: true,
  showOrphans: false,
  'collapse-color-groups': false,
  colorGroups: [
    { query: 'path:Areas', color: { a: 1, rgb: 16777215 } },
    { query: 'path:Code', color: { a: 1, rgb: 8421504 } },
    { query: 'path:Components', color: { a: 1, rgb: 3900150 } },
    { query: 'path:Hooks', color: { a: 1, rgb: 6737151 } },
    { query: 'path:Store', color: { a: 1, rgb: 16750848 } },
    { query: 'path:Menus', color: { a: 1, rgb: 10233776 } },
    { query: 'path:Dialogs', color: { a: 1, rgb: 15277667 } },
    { query: 'path:Procedures', color: { a: 1, rgb: 5025616 } },
    { query: 'path:Transforms', color: { a: 1, rgb: 13434828 } },
    { query: 'path:AI', color: { a: 1, rgb: 16007990 } },
    { query: 'path:Storage', color: { a: 1, rgb: 7951688 } },
    { query: 'path:Output', color: { a: 1, rgb: 49151 } },
    { query: 'path:Shortcuts', color: { a: 1, rgb: 16761095 } },
  ],
  'collapse-display': false,
  showArrow: true,
  'collapse-forces': true,
};

export function renderReadme(facts, report) {
  const { g } = facts;
  const types = new Map();
  for (const n of g.nodes.values()) types.set(n.type, (types.get(n.type) ?? 0) + 1);
  const rels = new Map();
  for (const e of g.edges.values()) rels.set(e.type, (rels.get(e.type) ?? 0) + 1);
  const leads = report.issues.filter((i) => i.severity !== 'info').reduce((s, i) => s + i.items.length, 0);
  return `# Socius relationship map

A generated map of how everything in Socius connects: modules and their imports, React components and what
they render, every zustand store key and action and who reads, writes or calls it, menus and commands, the
dialog each command opens and the component that renders it, keyboard shortcuts, analysis procedures and the
statistics they call, transforms and the SPSS syntax they log, the AI stack (providers, features, assistant
tools, error codes, prompts), browser storage keys, the output model (block kinds, chart types, renderers,
exporters) and the tests that cover each of these.

**Do not edit files in this folder by hand.** They are regenerated from the code. Current size:
${g.nodes.size} nodes, ${g.edges.size} edges, ${leads} bug leads.

| File | What it is |
|---|---|
| [GRAPH_REPORT.md](GRAPH_REPORT.md) | Start here as an agent: entry points, the command → dialog → action table, store key ownership, procedures, transforms, AI, storage, output model, shortcuts, coupling hot spots, and the **bug leads** (orphans and inconsistencies). |
| [DIAGRAMS.md](DIAGRAMS.md) | Mermaid diagrams: app shell → tabs → features; data flow (import → store → procedures → output → export); AI flow. |
| [Home.md](Home.md) | The vault's start page with an index of every note. |
| graph.json | The whole graph for tools and scripts (node-link JSON, compatible with networkx and the Graphify CLI). |
| Areas/, Code/, Components/, Hooks/, Store/, Menus/, Dialogs/, Shortcuts/, Procedures/, Transforms/, Syntax/, AI/, Storage/, Output/, Palette/, Packages/ | One note per entity (Obsidian vault). |

## Use it in Obsidian

1. In Obsidian choose **Open folder as vault** and pick \`docs/map\`.
2. Open **Home** (the start page) or **GRAPH_REPORT**.
3. Open the **Graph view** (Ctrl/Cmd+G). Colour groups by folder are preset in \`.obsidian/graph.json\`
   (components blue, store orange, menus purple, dialogs pink, procedures green, AI red...). Test files are
   filtered out by default; clear the search box to see them.
4. On any note, open the **Local graph** to see its neighbourhood, or use the backlinks pane.
5. Filter by front matter: every note has \`id\` (the graph.json id), \`type\`, \`file\`, \`line\` and \`area\` properties
   (for example search \`[type:store-action]\`, \`[area:features/coding]\` or \`path:Store/useStore\`).

Functions, constants and types do not get their own note: they are headings inside their module's note
(\`Code/src/.../file.ts#name\`), which is what links point to.

Without Obsidian, the notes are plain Markdown (GitHub shows \`[[wikilinks]]\` as text; follow the path in the link).

## Use it from scripts or agents

\`graph.json\` has \`nodes\` (\`id\`, \`type\`, \`label\`, \`source_file\`, \`line\`, \`area\` and type-specific fields such as
\`path\`, \`shortcut\`, \`store\`, \`kind\`, \`routed\`, \`problem\`) and \`links\` (\`source\`, \`target\`, \`relation\`, optional \`via\`).
Ids are stable and readable: a module is its path (\`src/core/store.ts\`), a symbol is \`path#name\`
(\`src/core/store.ts#useStore\`); everything else has a type prefix: \`store-key:<store>.<key>\`,
\`store-action:<store>.<action>\`, \`menu:<id>\`, \`cmd:<menu>:<item>\` (the same ids the search palette uses),
\`dialog:<kind>:<id>\`, \`dialog-kind:<kind>\`, \`procedure:<id>\`, \`transform:<id>\`, \`syntax:<COMMAND>\`, \`ai-provider:<id>\`,
\`ai-feature:<id>\`, \`ai-tool:<name>\`, \`ai-error:<code>\`, \`ai-prompt:<path>#<name>\`, \`storage:<backend>:<key>\`,
\`shortcut:<keys>@<scope>\`, \`output-kind:<kind>\`, \`chart-type:<type>\`, \`package:<name>\`, \`area:<area>\`.
To keep the file small, graph.json leaves out what other fields already say: module membership (\`source_file\`),
calls inside one file, private helpers (folded into their module) and symbol-level edges from test code. The vault
notes keep all of it (the \`id\` in each note's front matter is its graph.json id).

\`\`\`sh
# who writes useStore.dataset?
node -e "const g=require('./docs/map/graph.json');console.log(g.links.filter(l=>l.target==='store-key:useStore.dataset'&&l.relation==='writes').map(l=>l.source))"
# with jq: every dialog a menu command opens
jq -r '.links[]|select(.relation=="opens" and (.source|startswith("cmd:")))|"\\(.source) -> \\(.target)"' docs/map/graph.json
\`\`\`

The Graphify CLI (\`pip install graphifyy\`) can query this file too; these commands are local and need no API key:
\`graphify path "Compute variable..." "ComputeDialog" --graph docs/map/graph.json\` (menu command → dialog → component),
\`graphify explain "useStore.dataset" --graph docs/map/graph.json\` (every reader and writer) or
\`graphify god-nodes --graph docs/map/graph.json\` (the most connected entities).

### Node types

${[...types].sort((a, b) => a[0].localeCompare(b[0])).map(([t, n]) => `\`${t}\` (${n})`).join(' · ')}

### Relations (edge types)

| relation | read as | count |
|---|---|---|
${[...rels].sort((a, b) => a[0].localeCompare(b[0])).map(([t, n]) => `| \`${t}\` | ${EDGE_LABELS[t] ? `${EDGE_LABELS[t][0]} / ${EDGE_LABELS[t][1]}` : t} | ${n} |`).join('\n')}

## Regenerate

\`\`\`sh
npm run map                               # rewrite docs/map (about 15 s)
node scripts/map/build-map.mjs --check    # exit 1 if docs/map is out of date (for CI or a pre-commit hook)
node scripts/map/build-map.mjs --debug    # also print what each extractor found
\`\`\`

The generator needs only Node and the installed dev dependencies. It parses \`src/\`, \`tests/\` and \`e2e/\`
with the TypeScript compiler API of the installed \`typescript\` package (TypeScript ${facts.tsVersion}: \`typescript/unstable/sync\`,
which runs the bundled native compiler locally). Nothing is sent over the network and no AI model is involved,
so the output is deterministic: the same code always gives the same files (sorted, no timestamps), and diffs
stay small. Files are discovered, not listed: new modules, components, stores, menu items, dialogs, procedures,
tools and storage keys appear on the next run.

## How it works (and what it cannot see)

The code in \`scripts/map/lib/\`:

| file | job |
|---|---|
| ast.mjs | loads the TypeScript project; the only file that touches the compiler API |
| index.mjs | per-file imports, exports, top-level declarations, value references; resolves names across files and re-exports |
| evaluate.mjs | a small static evaluator for literal data (menu items, ProcedureDefs, feature lists, ids built with templates, \`.map\`/\`.filter\` over static arrays) |
| extract-code.mjs | module, symbol, import, call, render and use edges |
| extract-store.mjs | zustand stores (keys, actions, what actions write) and every selector / getState / setState / subscribe use; AI settings as a pseudo-store |
| extract-ui.mjs | menus (from the \`useMenus\` model), handler effects (dialogs opened, actions, tab switches), dialog requests, dialog routing (host switch, sub-router switches, registries), search palette |
| extract-domain.mjs | procedures, transforms, AI, storage, output model, shortcuts, tests |
| analyse.mjs | cross-checks that produce the bug leads |
| emit.mjs, report.mjs, diagrams.mjs, readme.mjs | the files in this folder |

Limits: it is static analysis. Values computed at run time (a dialog id held in a variable, a key matched by a
regular expression, a component chosen from a map built at run time) are reported as dynamic or not seen.
Shortcut modifiers are inferred from the surrounding condition. SPSS syntax commands are read from string
literals assigned to something named like \`syntax\`/\`cmds\`/\`lines\`. Treat every bug lead as a lead.

## Why not Graphify

The owner suggested Graphify (PyPI \`graphifyy\`). It was tried (version 0.9.67, in a throwaway virtualenv, on a
copy of \`src/\`). Its \`graphify update\` command does build a code graph locally with tree-sitter and no LLM
(2,689 nodes and 9,973 edges for this code), but for this TypeScript/React app the graph is generic: files,
functions, \`imports\` and \`calls\`. It has no notion of JSX rendering (\`<MenuBar/>\` is an import, not a render),
zustand selectors and actions, menu items, dialog ids, ProcedureDefs, storage keys or shortcuts, which are the
relationships that matter here. Its richer modes (semantic extraction, community naming, the Obsidian export
driven by the assistant skill) call an LLM backend chosen from API keys in the environment, which would send code
to a third party. So the map is built by this generator instead, and \`graph.json\` is written in the node-link
format Graphify reads, so its local query commands (\`query\`, \`path\`, \`explain\`, \`god-nodes\`) still work on it.
`;
}

export function renderHome(facts, report, notes) {
  const { g } = facts;
  const nodes = g.sortedNodes();
  const of = (type, sort) => nodes.filter((n) => n.type === type && notes.paths.has(n.id)).sort(sort ?? ((a, b) => a.label.localeCompare(b.label)));
  const list = (arr, sep = ' · ') => arr.map((n) => notes.link(n.id)).join(sep);
  const out = ['---', 'type: index', 'tags: [map/index]', '---', '', '# Socius map: start here', ''];
  out.push('Generated by `npm run map`. Read [[README]] for how to use and regenerate the map, [[GRAPH_REPORT]] for facts and bug leads, [[DIAGRAMS]] for the big picture.', '');
  const rank = { high: 0, medium: 1 };
  const leads = report.issues.filter((i) => i.severity === 'high' || i.severity === 'medium').sort((a, b) => rank[a.severity] - rank[b.severity] || a.title.localeCompare(b.title));
  if (leads.length) out.push('## Top bug leads', ...leads.map((i) => `- ${i.severity}: ${i.title} (${i.items.length})`), '', 'Details: [[GRAPH_REPORT#Bug leads: inconsistencies and orphans]].', '');
  out.push('## Areas', list(of('area')), '');
  out.push('## Menus', '');
  for (const m of of('menu', (a, b) => (a.order ?? 0) - (b.order ?? 0))) {
    const items = nodes.filter((n) => (n.type === 'command' || n.type === 'submenu') && n.id.startsWith(`cmd:${m.id.slice(5)}:`)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    out.push(`- ${notes.link(m.id)}: ${items.map((n) => notes.link(n.id, n.label)).join(' · ')}`);
  }
  out.push('');
  out.push('## Dialogs', '');
  const kinds = of('dialog-kind');
  for (const k of kinds) {
    const ds = nodes.filter((n) => n.type === 'dialog' && `dialog-kind:${n.kind}` === k.id && notes.paths.has(n.id));
    out.push(`- ${notes.link(k.id)}: ${ds.map((n) => notes.link(n.id, n.dialogId)).join(' · ')}`);
  }
  const orphanDialogs = nodes.filter((n) => n.type === 'dialog' && !kinds.some((k) => k.id === `dialog-kind:${n.kind}`));
  if (orphanDialogs.length) out.push(`- other: ${list(orphanDialogs)}`);
  out.push('');
  out.push('## Stores', '');
  for (const s of of('store')) out.push(`- ${notes.link(s.id)}`);
  out.push('');
  out.push('## Analysis', '', `**Procedures:** ${list(of('procedure'))}`, '', `**Transforms:** ${list(of('transform'))}`, '', `**SPSS syntax commands:** ${list(of('syntax'))}`, '');
  out.push('## AI', '', `**Providers:** ${list(of('ai-provider'))}`, '', `**Features:** ${list(of('ai-feature'))}`, '', `**Assistant tools:** ${list(of('ai-tool'))}`, '', `**Prompt builders:** ${list(of('ai-prompt'))}`, '', `**Error codes:** ${list(of('ai-error'))}`, '');
  out.push('## Output model', '', `**Blocks:** ${list(of('output-kind'))}`, '', `**Charts:** ${list(of('chart-type'))}`, '', `**Sources:** ${list(of('output-source'))}`, '');
  out.push('## Browser storage', list(of('storage-key')), '');
  out.push('## Keyboard shortcuts', list(of('shortcut')), '');
  out.push('## Search palette sources', list(of('palette-source')), '');
  out.push('## Components', list(of('component')), '');
  out.push('## Hooks', list(of('hook')), '');
  out.push('## Packages', list(of('package')), '');
  out.push('## Tests', list([...of('test'), ...of('e2e-spec')].sort((a, b) => a.id.localeCompare(b.id))), '');
  return out.join('\n');
}
