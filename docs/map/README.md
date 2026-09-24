# Socius relationship map

A generated map of how everything in Socius connects: modules and their imports, React components and what
they render, every zustand store key and action and who reads, writes or calls it, menus and commands, the
dialog each command opens and the component that renders it, keyboard shortcuts, analysis procedures and the
statistics they call, transforms and the SPSS syntax they log, the AI stack (providers, features, assistant
tools, error codes, prompts), browser storage keys, the output model (block kinds, chart types, renderers,
exporters) and the tests that cover each of these.

**Do not edit files in this folder by hand.** They are regenerated from the code. Current size:
2796 nodes, 13904 edges, 293 bug leads.

| File | What it is |
|---|---|
| [GRAPH_REPORT.md](GRAPH_REPORT.md) | Start here as an agent: entry points, the command → dialog → action table, store key ownership, procedures, transforms, AI, storage, output model, shortcuts, coupling hot spots, and the **bug leads** (orphans and inconsistencies). |
| [DIAGRAMS.md](DIAGRAMS.md) | Mermaid diagrams: app shell → tabs → features; data flow (import → store → procedures → output → export); AI flow. |
| [Home.md](Home.md) | The vault's start page with an index of every note. |
| graph.json | The whole graph for tools and scripts (node-link JSON, compatible with networkx and the Graphify CLI). |
| Areas/, Code/, Components/, Hooks/, Store/, Menus/, Dialogs/, Shortcuts/, Procedures/, Transforms/, Syntax/, AI/, Storage/, Output/, Palette/, Packages/ | One note per entity (Obsidian vault). |

## Use it in Obsidian

1. In Obsidian choose **Open folder as vault** and pick `docs/map`.
2. Open **Home** (the start page) or **GRAPH_REPORT**.
3. Open the **Graph view** (Ctrl/Cmd+G). Colour groups by folder are preset in `.obsidian/graph.json`
   (components blue, store orange, menus purple, dialogs pink, procedures green, AI red...). Test files are
   filtered out by default; clear the search box to see them.
4. On any note, open the **Local graph** to see its neighbourhood, or use the backlinks pane.
5. Filter by front matter: every note has `id` (the graph.json id), `type`, `file`, `line` and `area` properties
   (for example search `[type:store-action]`, `[area:features/coding]` or `path:Store/useStore`).

Functions, constants and types do not get their own note: they are headings inside their module's note
(`Code/src/.../file.ts#name`), which is what links point to.

Without Obsidian, the notes are plain Markdown (GitHub shows `[[wikilinks]]` as text; follow the path in the link).

## Use it from scripts or agents

`graph.json` has `nodes` (`id`, `type`, `label`, `source_file`, `line`, `area` and type-specific fields such as
`path`, `shortcut`, `store`, `kind`, `routed`, `problem`) and `links` (`source`, `target`, `relation`, optional `via`).
Ids are stable and readable: a module is its path (`src/core/store.ts`), a symbol is `path#name`
(`src/core/store.ts#useStore`); everything else has a type prefix: `store-key:<store>.<key>`,
`store-action:<store>.<action>`, `menu:<id>`, `cmd:<menu>:<item>` (the same ids the search palette uses),
`dialog:<kind>:<id>`, `dialog-kind:<kind>`, `procedure:<id>`, `transform:<id>`, `syntax:<COMMAND>`, `ai-provider:<id>`,
`ai-feature:<id>`, `ai-tool:<name>`, `ai-error:<code>`, `ai-prompt:<path>#<name>`, `storage:<backend>:<key>`,
`shortcut:<keys>@<scope>`, `output-kind:<kind>`, `chart-type:<type>`, `package:<name>`, `area:<area>`.
To keep the file small, graph.json leaves out what other fields already say: module membership (`source_file`),
calls inside one file, private helpers (folded into their module) and symbol-level edges from test code. The vault
notes keep all of it (the `id` in each note's front matter is its graph.json id).

```sh
# who writes useStore.dataset?
node -e "const g=require('./docs/map/graph.json');console.log(g.links.filter(l=>l.target==='store-key:useStore.dataset'&&l.relation==='writes').map(l=>l.source))"
# with jq: every dialog a menu command opens
jq -r '.links[]|select(.relation=="opens" and (.source|startswith("cmd:")))|"\(.source) -> \(.target)"' docs/map/graph.json
```

The Graphify CLI (`pip install graphifyy`) can query this file too; these commands are local and need no API key:
`graphify path "Compute variable..." "ComputeDialog" --graph docs/map/graph.json` (menu command → dialog → component),
`graphify explain "useStore.dataset" --graph docs/map/graph.json` (every reader and writer) or
`graphify god-nodes --graph docs/map/graph.json` (the most connected entities).

### Node types

`ai-error` (40) · `ai-feature` (5) · `ai-prompt` (10) · `ai-provider` (4) · `ai-tool` (14) · `area` (23) · `asset` (34) · `chart-type` (8) · `class` (25) · `command` (115) · `component` (212) · `config` (2) · `const` (178) · `dialog` (80) · `dialog-kind` (5) · `e2e-spec` (14) · `function` (1223) · `hook` (23) · `menu` (10) · `module` (225) · `output-kind` (4) · `output-source` (1) · `package` (18) · `palette-source` (6) · `procedure` (30) · `shortcut` (177) · `storage-key` (11) · `store` (9) · `store-action` (60) · `store-key` (67) · `submenu` (12) · `syntax` (42) · `test` (71) · `test-helper` (20) · `transform` (18)

### Relations (edge types)

| relation | read as | count |
|---|---|---|
| `bound-in` | Bound in / Binds shortcut | 149 |
| `calls` | Calls / Called by | 5042 |
| `calls-action` | Calls store actions / Called by | 393 |
| `checks` | Checks error code / Checked by | 66 |
| `configured-in` | Configured in dialog / Configures | 48 |
| `contains` | Defines / Defined in | 1669 |
| `creates` | Creates / Created by | 67 |
| `defines` | Defines / Defined by | 17 |
| `documented-in` | Documented in / Documents shortcut | 52 |
| `explains` | Explains error code / Explained by | 38 |
| `generates-syntax` | Generates SPSS syntax / Generated by | 80 |
| `handles` | Handles / Handled by | 58 |
| `has-action` | Actions / Store | 60 |
| `has-key` | State keys / Store | 67 |
| `has-variant` | Variants / Variant of | 8 |
| `implemented-by` | Implemented by / Implements | 54 |
| `implemented-in` | Implemented in / Implements provider | 13 |
| `imports` | Imports / Imported by | 1742 |
| `in-area` | Area / Modules | 330 |
| `listens` | Listens to changes of / Change listeners | 1 |
| `lists` | Lists / Listed by | 17 |
| `logged-by` | Logged to Output by / Logs | 17 |
| `opens` | Opens / Opened by | 124 |
| `part-of` | Part of / Items | 207 |
| `reads` | Reads / Read by | 377 |
| `references` | References / Referenced by (build config) | 2 |
| `removes` | Removes / Removed by | 1 |
| `rendered-by` | Rendered by / Renders | 85 |
| `renders` | Renders / Rendered by | 419 |
| `routes` | Routes dialog kind / Routed by | 5 |
| `started-by` | Started by / Starts | 5 |
| `suggests` | Suggests / Suggested by | 6 |
| `tested-by` | Tested by / Tests | 635 |
| `throws` | Produces error code / Produced by | 93 |
| `uses` | Uses / Used by | 1687 |
| `writes` | Writes / Written by | 270 |

## Regenerate

```sh
npm run map                               # rewrite docs/map (about 15 s)
node scripts/map/build-map.mjs --check    # exit 1 if docs/map is out of date (for CI or a pre-commit hook)
node scripts/map/build-map.mjs --debug    # also print what each extractor found
```

The generator needs only Node and the installed dev dependencies. It parses `src/`, `tests/` and `e2e/`
with the TypeScript compiler API of the installed `typescript` package (TypeScript 7.0.2: `typescript/unstable/sync`,
which runs the bundled native compiler locally). Nothing is sent over the network and no AI model is involved,
so the output is deterministic: the same code always gives the same files (sorted, no timestamps), and diffs
stay small. Files are discovered, not listed: new modules, components, stores, menu items, dialogs, procedures,
tools and storage keys appear on the next run.

## How it works (and what it cannot see)

The code in `scripts/map/lib/`:

| file | job |
|---|---|
| ast.mjs | loads the TypeScript project; the only file that touches the compiler API |
| index.mjs | per-file imports, exports, top-level declarations, value references; resolves names across files and re-exports |
| evaluate.mjs | a small static evaluator for literal data (menu items, ProcedureDefs, feature lists, ids built with templates, `.map`/`.filter` over static arrays) |
| extract-code.mjs | module, symbol, import, call, render and use edges |
| extract-store.mjs | zustand stores (keys, actions, what actions write) and every selector / getState / setState / subscribe use; AI settings as a pseudo-store |
| extract-ui.mjs | menus (from the `useMenus` model), handler effects (dialogs opened, actions, tab switches), dialog requests, dialog routing (host switch, sub-router switches, registries), search palette |
| extract-domain.mjs | procedures, transforms, AI, storage, output model, shortcuts, tests |
| analyse.mjs | cross-checks that produce the bug leads |
| emit.mjs, report.mjs, diagrams.mjs, readme.mjs | the files in this folder |

Limits: it is static analysis. Values computed at run time (a dialog id held in a variable, a key matched by a
regular expression, a component chosen from a map built at run time) are reported as dynamic or not seen.
Shortcut modifiers are inferred from the surrounding condition. SPSS syntax commands are read from string
literals assigned to something named like `syntax`/`cmds`/`lines`. Treat every bug lead as a lead.

## Why not Graphify

The owner suggested Graphify (PyPI `graphifyy`). It was tried (version 0.9.67, in a throwaway virtualenv, on a
copy of `src/`). Its `graphify update` command does build a code graph locally with tree-sitter and no LLM
(2,689 nodes and 9,973 edges for this code), but for this TypeScript/React app the graph is generic: files,
functions, `imports` and `calls`. It has no notion of JSX rendering (`<MenuBar/>` is an import, not a render),
zustand selectors and actions, menu items, dialog ids, ProcedureDefs, storage keys or shortcuts, which are the
relationships that matter here. Its richer modes (semantic extraction, community naming, the Obsidian export
driven by the assistant skill) call an LLM backend chosen from API keys in the environment, which would send code
to a third party. So the map is built by this generator instead, and `graph.json` is written in the node-link
format Graphify reads, so its local query commands (`query`, `path`, `explain`, `god-nodes`) still work on it.
