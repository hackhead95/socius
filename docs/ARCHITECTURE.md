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
Gemini goes through Google's Interactions API (`POST /v1beta/interactions`, `store: false`, key only in
`x-goog-api-key`), with generateContent as a fallback for non-key failures; models are chosen from the
key's model list (Flash-Lite first), with up to three fallbacks on 404/403/zero-quota 429 (see
`docs/research/gemini-auth-keys-and-interactions-api.md`). Settings > Test connection runs the
step-by-step check in `ai-diagnose.ts` (`runConnectionCheck`, `connectionReport`, `aiErrorReport`;
reports never contain keys).
A program on this computer (Ollama, LM Studio) gets a guided step-by-step check in `ai-local.ts` (running?
allows this website / OLLAMA_ORIGINS? browser "Local network access" permission? model installed? answered?),
shown by `src/features/ai/LocalSetup.tsx`; `scripts/diagnostics/fake-ollama.mjs` is a dev-only fake Ollama
used by `e2e/ai-local.spec.ts`. The on-device section is `src/features/ai/WebLlmSetup.tsx`.
Settings and keys live in localStorage only. The settings dialog is `src/features/ai/`. App-wide AI entry points (AI menu, top-bar AI chip, "AI is ready. Try it") start features through `runAiFeature` in `src/features/ai/features.ts`; "Explain with AI" on Output items builds its prompt in `explainPrompt.ts` (aggregate tables only, never case-level values).

Every command has exactly one menu home; toolbars, the top bar and set-up prompts are contextual shortcuts with the menu's wording (`docs/NAVIGATION.md`, checked by `tests/app/navigation-audit.test.tsx`). The search palette (`src/app/CommandPalette.tsx`, Ctrl+K) searches the menu model from `menus.ts` (so a command is defined once), variables, Output results, guide sections (`helpTopics.ts`, checked against `public/guide/index.html` by a test) and coded text; matching and ranking are in `src/app/search.ts`.

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
| `src/platform/errorlog.ts` | The error log: `logError`, `logFailure`, `logWarn`, `logInfo`, `logSlow`, `getLog`, `clearLog`, `formatReport`, `subscribe` (see "Error log" below) |
| `src/platform/buildInfo.ts` | `BUILD_INFO` (version from package.json, short git commit, build date; injected by `define` in `vite.config.ts`) |
| `src/lib/io/index.ts` | `importFile`, `exportSav`, `exportCsv`, `exportXlsx`, `codebookRows` |
| `src/samples/index.ts` | Bundled sample survey + interview transcripts |
| `src/styles/tokens.css`, `src/styles/base.css`, `src/ui/Modal.tsx` | Design tokens and shared primitives |

## Error log

There is no server, so problems are logged in the user's browser and sent by the user with their
feedback (Help > Error log > Copy report; Help > Send feedback also fills a short summary into the
GitHub form). `src/platform/errorlog.ts` keeps a ring buffer (300 entries, 200 KB) in localStorage
(`socius.errorlog`), in memory only when storage is blocked or full. `src/features/errorlog/install.ts`
(called from `main.tsx`) adds context to each entry and logs `window` errors and unhandled rejections;
`src/app/ErrorBoundary.tsx` catches render errors (whole app: "Something went wrong" screen; each main
tab; dialogs, which close; the assistant panel). Already logged: AI errors where `askAI`/`askAIJson`
convert them, assistant turns, file import/export, analysis `run()` (and runs over 5 s as info),
transform failures, coding import/export, IndexedDB and localStorage failures.

How to log, in a `catch` that already handles the error for the user (one line, never changes behaviour;
logging never throws):

```ts
import { logError, logFailure, logSlow } from '../../platform/errorlog';
} catch (e) {
  logFailure('import', e, { file: name, op: 'open data file' }); // TypeError etc. -> error, app messages -> warning
  ...
}
throw logError('ai', wrapError(e)); // logError returns its argument
logSlow('analysis', def.id, performance.now() - t0); // info entry only when over 5 s
```

Areas: `ai`, `import`, `export`, `analysis`, `transform`, `coding`, `assistant`, `ui`, `storage`,
`network`. Context is added for you (tab, "N cases x M variables", AI provider and model, version, the
open dialog's id); pass `op` (a code identifier) and `file` (the file name: only the extension is stored).
Cancelled requests (`code: 'cancelled'`, `AbortError`) are skipped; the same error object is logged once.

Redaction rules (in `redact`, applied to every message, detail and context value; tested in
`tests/platform/errorlog.test.ts`):

- Never log data values, variable names or labels, value labels, file names, text excerpts, keys or
  tokens. Do not build messages from them yourself either: pass the error, not a description of the data.
- Removed automatically: Google keys (`AIza...`, `AQ....`), `sk-...`, `gsk_...` and similar tokens, JWTs,
  `Bearer`/`Basic` credentials, `key=`/`token=`-style parameters and headers, long random-looking strings,
  e-mail addresses, `data:` URLs, quoted text, file names, and every name and label of the open dataset
  and coding project (`setSensitiveTermsProvider`). URLs keep host and path only (no query or fragment).
- Unknown objects are never serialised: only an Error's name, message, `code`, HTTP status, the service's
  `detail` and a stack trimmed to 8 frames. Strings are truncated (300 characters for messages).

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
