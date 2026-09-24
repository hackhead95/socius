# Socius architecture

Socius is a browser-only research workbench for sociologists: open SPSS `.sav` data, run the
statistics sociologists use, code qualitative text, and export results. No server; data never leaves
the user's machine. It ships two ways:

- **Static site** (`npm run build` -> `dist/`), for GitHub Pages or any static host.
- **claude.ai Artifact** (`npm run build:artifact` -> `dist-artifact/socius.html`, one self-contained
  HTML file). Inside the Artifact viewer the page is sandboxed: `<a download>`, `window.print()`,
  `alert/confirm/prompt` do not work; files are saved through `src/platform/host.ts` (`saveFile`).

AI help goes through `src/platform/ai.ts` (`askAI` / `askAIJson`, `aiAvailable`, `aiErrorMessage`,
status via `subscribeAi`). Providers: Claude (automatic inside the Artifact, `sample` capability in
`claude.ts`), an on-device model (`ai-webllm.ts`, `@mlc-ai/web-llm` loaded lazily; aliased to a stub in
the Artifact build), Google Gemini and OpenAI-compatible services (`ai-http.ts`, the user's own key).
Settings and keys live in localStorage only. The settings dialog is `src/features/ai/`. App-wide AI entry points (AI menu, top-bar AI chip, "AI is ready. Try it") start features through `runAiFeature` in `src/features/ai/features.ts`; "Explain with AI" on Output items builds its prompt in `explainPrompt.ts` (aggregate tables only, never case-level values).

The search palette (`src/app/CommandPalette.tsx`, Ctrl+K) searches the menu model from `menus.ts` (so a command is defined once), variables, Output results, guide sections (`helpTopics.ts`, checked against `public/guide/index.html` by a test) and coded text; matching and ranking are in `src/app/search.ts`.

## Stack

React 19 + TypeScript (strict) + Vite 8, zustand store, vitest, Playwright (Chromium at
`/opt/pw-browsers/chromium`). Pre-installed libraries: `fflate` (zip/zlib), `docx` (Word export),
`@tanstack/react-virtual` (virtualised grids), `read-excel-file` / `write-excel-file` (xlsx),
`@mlc-ai/web-llm` (on-device AI, lazy chunk on the static site only).
Do not add dependencies without the orchestrator's approval.

Python "oracle" environment for verifying numerics and SPSS files: `/opt/oracle/bin/python` has
`pyreadstat`, `pandas`, `scipy`, `statsmodels`, `pingouin`, `krippendorff`, `openpyxl`.

## Contracts (read these files first)

| File | What it defines |
|---|---|
| `src/core/types.ts` | `Dataset`, `Variable`, column storage rules (Float64Array + NaN sysmis; string[]), SPSS epoch dates |
| `src/core/data.ts` | Missing-value semantics, filter/weight handling, `selectCases`, value labels, display formatting, variable-name rules |
| `src/core/output.ts` | `OutputItem` / `OutputBlock` / `OutputTable` / `ChartSpec`: what procedures return and the viewer renders |
| `src/core/procedure.ts` | `ProcedureDef`: declarative dialog (slots + options) + pure `run()` |
| `src/core/store.ts` | zustand store: dataset (immutable updates, undo), outputs, coding project, UI state, dialogs, toasts |
| `src/core/coding-types.ts` | Qualitative coding project model |
| `src/platform/host.ts` | `saveFile`, `copyToClipboard` (and re-exports of the AI functions below for older imports) |
| `src/platform/ai-tools.ts`, `src/lib/assistant/**` | The Socius assistant: tool-calling adapters (Gemini, OpenAI-compatible, Claude viewer, JSON fallback for on-device), the agent loop, tools that read the live store and run real procedures, and the specialist prompt. UI in `src/features/assistant/**`; open it with `openAssistant()` |
| `src/platform/ai.ts` | AI provider layer: `askAI`, `askAIJson`, `aiAvailable`, `aiErrorMessage`, `aiPromptBudget`, settings and status |
| `src/app/links.ts` | `SITE_URL`, `GUIDE_URL`, `FEEDBACK_URL` (derived from the GitHub Pages address, with fallbacks) |
| `src/lib/io/index.ts` | `importFile`, `exportSav`, `exportCsv`, `exportXlsx`, `codebookRows` |
| `src/samples/index.ts` | Bundled sample survey + interview transcripts |
| `src/styles/tokens.css`, `src/styles/base.css`, `src/ui/Modal.tsx` | Design tokens and shared primitives |

## Folder ownership

| Area | Paths |
|---|---|
| SPSS / file IO | `src/lib/io/**`, `tests/io/**`, `scripts/fixtures/**` |
| Stats: core procedures | `src/lib/stats/{distributions,descriptives,frequencies,crosstabs,ttest,anova,nonparametric,correlation,util}.ts`, `src/procedures/core/**`, `tests/stats-core/**`, `scripts/oracle/core_*` |
| Stats: models | `src/lib/stats/{matrix,regression,logistic,reliability,factor}.ts`, `src/procedures/models/**`, `tests/stats-models/**`, `scripts/oracle/models_*` |
| App shell, data & variable views, transforms, projects | `src/app/**`, `src/features/{data,transform,project}/**`, `src/lib/transform/**`, `src/ui/**`, `src/styles/**`, `tests/transform/**` |
| Analysis dialogs, output viewer, charts, graphs menu | `src/features/{analysis,output,charts}/**`, `src/procedures/graphs/**`, `tests/output/**` |
| Text coding | `src/features/coding/**`, `src/lib/coding/**`, `tests/coding/**` |
| Sample data | `src/samples/**`, `public/samples/**`, `scripts/samples/**` |
| End-to-end tests | `e2e/**` |

`src/core/**` and `src/platform/**` belong to the orchestrator. If a contract is missing something,
make the smallest additive change (new optional field, new helper) and report it; never change
existing signatures.

## Statistical conventions

- Follow SPSS behaviour and terminology (sociologists compare against SPSS output): listwise deletion
  per analysis unless the procedure says otherwise; user-missing excluded; frequency weights
  (non-integer allowed, like SPSS WEIGHT BY) apply to all counts and moments; filter respected.
- Every procedure's `OutputItem` should contain: the SPSS-style tables; `caseNote`; equivalent SPSS
  `syntax`; an `interpretation` text block in plain language ("Women were more likely than men to...");
  an `apa` text block with an APA 7 results sentence (italic symbols are written plainly, e.g.
  "χ²(2, N = 512) = 14.20, p < .001, Cramér's V = .17"); `warning` blocks when assumptions fail
  (expected counts < 5, small n, perfect separation, non-convergence...).
- p-values: exact, computed from accurate distribution functions (regularised incomplete beta/gamma).
  Verified against scipy/statsmodels to at least 1e-6 relative error in tests.
