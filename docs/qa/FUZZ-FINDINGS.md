# Fuzz findings (combinatorial testing)

Date: 24 Sep 2026. Suites: `tests/fuzz/**` (vitest), `scripts/fuzz/ui-permutations.mjs` (Playwright),
`scripts/fuzz/oracle.py` (scipy / statsmodels / pingouin oracle).

**19 open findings: 4 P0, 6 P1, 9 P2.** Three more AI-layer problems were found and then fixed by the
concurrent Gemini/Interactions rework during this run (see "Resolved during the run").

| Area | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| Procedures | 2 | 4 | 4 | 10 |
| Transforms | 2 | 1 | 3 | 6 |
| IO | 0 | 1 | 2 | 3 |
| AI provider matrix | 0 | 0 | 0 | 0 (3 resolved) |
| UI permutations | 0 | 0 | 0 | 0 |

Severity: **P0** means a crash or wrong numbers. **P1** means an unclear error, misleading text, or a
UI freeze of several seconds. **P2** means cosmetic or a rare edge case.

## How to run

```bash
npx vitest run tests/fuzz                         # every suite (about 55 s in parallel; each file < 60 s)
FUZZ_SEED=123 npx vitest run tests/fuzz/io.fuzz.test.ts   # another seed
FUZZ_SCALE=5 npx vitest run tests/fuzz            # 5x more random cases
FUZZ_ONLY=crosstabs:2 npx vitest run tests/fuzz/procedures.fuzz.test.ts   # one procedure, one row
FUZZ_REPLAY=crosstabs:2 FUZZ_VARIANT=weight npx vitest run tests/fuzz/replay.test.ts  # print the output
npx vite build --outDir /tmp/fuzz/dist --emptyOutDir && node scripts/fuzz/ui-permutations.mjs [--full]
```

Every failure is printed with its seed and a minimal reproduction. The full report of the last run
is written to `$FUZZ_OUT` (default `/tmp/socius-fuzz/<suite>.json`). Timing thresholds can be raised
on slow machines with `FUZZ_SLOW_MS`.

**Keeping CI green.** `tests/fuzz/known-issues.ts` maps each open finding id to its failure
signature. A matching failure is reported but does not fail the suite. `tests/fuzz/findings-repro.test.ts`
holds one minimal reproduction per id. The test asserts the *correct* behaviour and runs as `it.fails`
while the id is listed. **To close a finding, delete its id from `known-issues.ts`.** The repro then
becomes a normal test that must pass, and the fuzz suites fail again if the problem comes back. If a
repro reports "expected to fail but passed", the bug is fixed: delete the id.

## What was exercised

| Suite | Space covered | Result |
|---|---|---|
| `procedures.fuzz` | All 30 ProcedureDefs. For each: a pairwise (all-pairs) covering set of every option value (each checkbox on/off, each select choice, number min/max/mid/default, odd text) crossed with the dataset state (n in {1,2,3,8,40,150}, weight none/integer/fractional/bad (0, negative, missing, 1e-9), filter on/off, slot assignment min/more/re-used variable), plus 12 random rows. That is about 1,250 runs. Datasets mix numeric/string/date, measurement levels, value labels, discrete and range user-missing codes, system-missing, constant and all-missing columns, 1e13 and 1e-9 scales, ties, 64-byte names, Bengali/Hindi names and labels, 300-char labels. Every run goes through the dialog's own `validate` (the UI gate), then `run`. Invalid number options and dialog-boundary values are also tried. | 10 findings |
| — metamorphic | Integer weights compared with replicated cases; filter compared with physically deleting the cases; declared user-missing codes compared with system-missing. | FZ-04 |
| — invariants | No internal errors, and messages in plain English. JSON-serialisable output. Rectangular tables (colSpan/rowSpan). No NaN, undefined, [object Object] or Infinity in any text, rendered cell or chart SVG (charts rendered with `renderToStaticMarkup`). Frequency and row percentages add up to 100. APA or interpretation text wherever p-values are shown. Syntax present. `run()` never mutates the dataset. | several |
| `procedures-oracle.fuzz` | 150 random datasets (unweighted or integer-weighted, with filter, user-missing, ties) give 1,562 procedure runs. **4,898 statistics** were compared with scipy/statsmodels/pingouin: descriptives (mean, SD, skewness, kurtosis), one-sample, independent (pooled/Welch/Levene) and paired t, one-way ANOVA (F, Levene, Welch F/df/p), Pearson/Spearman/Kendall, Mann-Whitney, Kruskal-Wallis, Wilcoxon, Friedman, chi-square/LR, OLS (B, SE, R², F), Cronbach's alpha. | **0 mismatches** (tolerance 1e-6) |
| `procedures-perf.fuzz` | Every procedure on 3,000 weighted cases with every checkbox on and each select choice. | FZ-09, FZ-11 |
| `transforms-expr.fuzz` | 3,000 grammar-generated COMPUTE expressions (operators, all numeric/text functions, `.n` suffixes, missing values, Unicode names, dates). Each is rendered with minimal and with full parentheses. **26,856 values** were checked against an independent reference evaluator of the SPSS missing-value rules. about 50 precedence/missing/date/format/string probes. 3,000 token-soup inputs. 1,500 Compute Variable runs (odd targets, IF conditions, types, widths) with value, purity and undo/redo checks. | FZ-12 only |
| `transforms-ops.fuzz` | 2,000 recodes (same/different/automatic, reference first-match semantics, conditions), 1,500 visual binnings (all methods, odd parameters), 1,500 select cases (all methods, filter/delete), 800 sort and weight runs, 1,200 aggregates (reference group-by, both outputs), 600 merges (add cases/add variables by order and key, type conflicts), 1,000 derive rounds (reverse, scale checked against MEAN.n, z-scores, count, rank). Each also has structural validity, purity and undo/redo checks via the zustand store. | 6 findings |
| `io.fuzz` | 120 random datasets (long strings over 255-byte segments with multi-byte characters at the boundary, extreme doubles, LO/HI missing ranges, long/Unicode labels, file labels, documents), each exported with none/bytecode/zsav compression and both byte orders, re-imported, and compared (dictionary and data), with pyreadstat cross-checks. CSV (`,` `;` tab, BOM) and XLSX round trips. 1,500 corrupted .sav files (truncation, bit flips, mangled header and dictionary integers, insertions, random bytes after `$FL2`). 300 garbage CSV/XLSX/zip files. | .sav: **no findings** (pyreadstat agrees). CSV/XLSX: FZ-10, FZ-17, FZ-18. Corrupted input: always `SavFormatError` or a plain message, never a hang. |
| `ai-matrix.fuzz` | 288 combinations: 4 providers (Gemini AIza key, Gemini AQ. key, OpenAI-compatible Groq, local Ollama) x 18 responses (200 text, thought parts, empty MAX_TOKENS, 400 invalid key, 401 ACCESS_TOKEN_TYPE_UNSUPPORTED on every endpoint, 403 referrer blocked, 403 service disabled, 404 model, 429 per minute, 429 per day with limit 0, 500, 503, network TypeError, abort, malformed JSON, SSE split into 3 to 7-byte chunks, mid-stream error event, Interactions 404 with generateContent still working) x 4 modes (test connection, askAI, askAIJson, streaming). Interactions error bodies are JSON arrays (also for stream:true). Interactions SSE uses event_type step.start/step.delta/step.stop/interaction.completed/error, then `[DONE]`. Fake timers drive retries and backoff. | 0 open (3 resolved during the run) |
| `ui-permutations.mjs` | {no data, sample, +weight, +filter, +weight+filter} x value labels on/off x light/dark x 1440/768/400 px: the full product of 60 states (15 with the default pairwise set). Actions in each state: open every menu (or the phone menu sheet), open Frequencies, Crosstabs, Independent T and Linear Regression, run with the defaults (inline problems expected) and with a variable combination (an Output item is expected), switch every tab, undo/redo, open the assistant (Ctrl+J), open search (Ctrl+K). | **0 problems.** No page or console errors, no horizontal overflow, menus/dialogs/palette/assistant fit, all results appeared. |

## Findings

Format: **ID [severity] area: title**, the suspected source, the seed, then the minimal repro. Each repro
is also a test in `tests/fuzz/findings-repro.test.ts` under the same ID.

### P0: crash or wrong numbers

**FZ-01 [P0] Transforms: Aggregate MIN/MAX crashes on large groups**
- Source: `src/lib/transform/aggregate.ts:85-86` (`Math.min(...valid.map(...))` spreads every value of a group as function arguments).
- Symptom: `RangeError: Maximum call stack size exceeded` when a group has about 120k or more valid cases. The raw message reaches the dialog. Survey files of 100k+ cases are common.
- Seed: transforms-ops 777001 (deterministic probe).
- Repro:
  ```ts
  const x = makeVariable({ name: 'x' });
  const ds = makeDataset({ name: 'd', variables: [x], columns: { [x.id]: Float64Array.from({ length: 200_000 }, (_, i) => i % 1000) }, nCases: 200_000 });
  aggregate(ds, { breakIds: [], items: [{ fn: 'max', sourceId: x.id, name: 'xmax' }], output: 'add' }); // RangeError
  ```

**FZ-02 [P0] Transforms: Visual Binning crashes when no cutpoint falls inside the data**
- Source: `src/lib/transform/binning.ts` (`binLabels` reads `cuts[0]` when `cuts` is empty; `computeCutpoints` 'widthFrom' makes no cuts when `first >= max`).
- Symptom: `TypeError: Cannot read properties of undefined (reading 'toPrecision')` for non-integer data when "equal widths starting at" begins at or above the maximum. 29 hits.
- Seed: transforms-ops 214568386 (FUZZ_SEED=777001, `bin#` rows).
- Repro:
  ```ts
  const x = makeVariable({ name: 'income' });
  const ds = makeDataset({ name: 'd', variables: [x], columns: { [x.id]: Float64Array.of(10.5, 20.25, 30) }, nCases: 3 });
  visualBin(ds, { sourceId: x.id, name: 'income_b', method: { kind: 'widthFrom', first: 1000, width: 5 } }); // TypeError
  ```

**FZ-03 [P0] Procedures: Descriptives puts the S.E. mean under the "Std. Deviation" header**
- Source: `src/procedures/core/descriptives.ts` (the header adds the "Std. Error" sub-column of Mean only when Mean is ticked, but the body always writes the S.E. value).
- Symptom: with *S.E. mean* on and *Mean* off, the header has 5 columns and the body 6. Every value to the right shifts one column: the S.E. (7.81) appears under "Std. Deviation", and the real SD (17.46) sits in an unlabelled column. 12 hits.
- Seed: procedures 20260924, `FUZZ_ONLY=descriptives:2`.
- Repro:
  ```ts
  const v = makeVariable({ name: 'income' });
  const ds = makeDataset({ name: 'd', variables: [v], columns: { [v.id]: Float64Array.of(10, 20, 30, 40, 55) }, nCases: 5 });
  const def = getProcedure('descriptives')!;
  def.run(ds, { variables: [v.id] }, { ...defaultOptions(def), mean: false, seMean: true });
  // header: N | Minimum | Maximum | Std. Deviation   body: 5 | 10.00 | 55.00 | 7.8102 | 17.4642
  ```

**FZ-04 [P0] Procedures: Crosstabs Case Processing Summary mixes weighted and unweighted counts**
- Source: `src/procedures/core/crosstabs.ts:118-119` (`nMissing: sel.nMissing` is the unweighted case count from `selectCases`, while `N` is weighted; `nTotal = N + nMissing` and both percentages mix the two bases). The case note ("25 cases excluded") has the same problem.
- Symptom: with WEIGHT on, "Missing N" and "Total N" differ from the same data with cases replicated (for example 25 vs 51), and Valid/Missing percentages are wrong. SPSS shows weighted counts here.
- Seed: procedures 20260924, `FUZZ_ONLY=crosstabs:2` (`FUZZ_REPLAY=crosstabs:2 FUZZ_VARIANT=weight` prints both).
- Repro:
  ```ts
  // a = [1,1,2,NaN], b = [1,2,1,1], weights [2,2,2,3]
  // Case Processing Summary: Valid N 6 (85.7%), Missing N 1 (14.3%), Total 7.
  // Weighted it should be 6 (66.7%), 3 (33.3%), 9.
  ```

### P1: unclear error, misleading text, or freeze

**FZ-05 [P1] Transforms: Select Cases can create two variables with the same name**
- Source: `src/lib/transform/cases.ts:216` (when `filter_$` exists but is a string variable, it creates `filter_$1` without checking that the name is free; the syntax still says `filter_$`).
- Symptom: with a string `filter_$` and a numeric `filter_$1` already in the file (possible after import or a merge), "Cases that meet a condition, filtered out" adds a second `filter_$1`. The dataset then has duplicate names, which breaks lookups by name and .sav export.
- Seed: transforms-ops 777001 (deterministic probe).
- Repro: variables `filter_$` (string), `filter_$1`, `age`; `selectCasesTransform(ds, { kind: 'if', condition: 'age > 30' }, 'filter')`.

**FZ-06 [P1] Procedures: One-way ANOVA's APA sentence prints "F(2, NaN) = n/a, p = n/a"**
- Source: `src/procedures/core/oneway.ts` (Welch APA/interpretation built when Welch is not computable) and `src/procedures/core/common.ts:256-265` (`n/a` formatting).
- Symptom: when a group has one case (or zero variance), the Welch statistic cannot be computed, but the text still reads "A Welch one-way ANOVA showed that ... F(2, NaN) = n/a, p = n/a, ω² = .98". This reaches the rendered output and the copied APA text. 3 hits.
- Seed: procedures 20260924, `FUZZ_ONLY=oneway-anova:12`.
- Repro: `income = [41.55, 41.36, 61.89]`, `trust = [1, 1, 3]`, One-Way ANOVA with default options.

**FZ-07 [P1] Procedures: Correlations and scatter APA sentences report negative df**
- Source: `src/procedures/core/correlations.ts` (APA sentence), `src/procedures/graphs/index.ts` (scatter fit text), `common.ts` n/a formatting.
- Symptom: "Monthly income was not significantly correlated with Not asked, r(-2) = n/a, p = n/a." This happens when a pair has 0 valid cases, and in the scatter plot when the total weight is below 3 (tiny positive weights), which gives "r(-2) = 1.00, p = ..". 14 hits.
- Seed: procedures 20260924, `FUZZ_ONLY=correlations:0` and `graph-scatter:18`.
- Repro: correlations of `income = [1,2,3,4]` with an all-missing variable.

**FZ-08 [P1] Procedures: confidence level 50 is accepted by the dialog, then refused by the analysis**
- Source: `src/procedures/core/ttests.ts:41` and `src/procedures/core/oneway.ts:220` (`conf > 0.5` is strict, but the option's `min` is 50).
- Symptom: typing 50 (the dialog minimum) passes validation, then Run shows "The confidence level must be between 50 and 99.9 percent." Affects the one-sample, paired and independent t tests, and One-Way ANOVA.
- Seed: procedures 20260924 boundary check (`FUZZ_ONLY=ttest-one-sample:0` with ciLevel 50).
- Repro: One-Sample T Test on any variable with `ciLevel: 50`.

**FZ-09 [P1] Procedures: One-way ANOVA post hoc tests freeze the page for seconds**
- Source: `src/lib/stats/distributions.ts:839-849` (`studentizedRangeCdf/Sf/Ppf`) as used by Games-Howell and Tukey in `src/lib/stats/anova.ts` / `src/procedures/core/oneway.ts`. The Games-Howell quantile with fractional Welch df is the slow path.
- Symptom: on 3,000 cases, 7 groups and 3 dependents, Games-Howell takes 11.2 s and Tukey 2.0 s (3.5 s / 0.5 s per dependent). On only 150 cases with a 10-group string factor and 3 dependents, the run takes 4 to 8 s. Everything runs on the main thread, so the app is frozen meanwhile.
- Seed: procedures-perf 5150 (`oneway-anova`); procedures 20260924 `FUZZ_ONLY=oneway-anova:42`.
- Repro: `y = sin(i)*10 + i%7`, `g = 1 + i%7`, n = 3000, One-Way ANOVA with Games-Howell (about 3.5 s for 1 dependent).

**FZ-10 [P1] IO: Excel round trip corrupts string missing values**
- Source: `src/lib/io/codebook.ts` `missingText` (joins values with ", " and does not quote them) and `src/lib/io/xlsx.ts` `parseMissingText` (`text.split(', ')` after the cell was trimmed).
- Symptom: a string variable with missing values `DK` and `""` (blank) is written as `DK, `, trimmed to `DK,`, and read back as `["DK,"]`. After an Excel round trip, **DK counts as a valid answer** in every analysis. A value that contains ", " breaks the same way. 7 hits.
- Seed: io 9090 (`csv#` rows, seed 1249739366).
- Repro: `answer` (A4) with `missing: { discrete: ['DK', ''] }` gives `exportXlsx`, then `importFile('x.xlsx')`, and the missing list is `['DK,']`.

### P2: cosmetic or edge case

**FZ-11 [P2] Procedures: Crosstabs exact tests block the page about 1.2 s per table**
- Source: `src/procedures/core/crosstabs.ts` / `src/lib/stats/crosstabs.ts` (exact r x c tests; no time limit or Monte Carlo fallback as in SPSS).
- Symptom: three 10x2 tables on 6,000 weighted cases take 3.6 s alone, and up to 11 s under load.
- Seed: procedures-perf 5150 (`crosstabs`, exact=exact).

**FZ-12 [P2] Transforms: very long or deeply nested expressions overflow the stack**
- Source: `src/lib/transform/expr.ts` (recursive-descent parser) and `evaluate.ts` (closure chain).
- Symptom: 1,000 or more nested parentheses, about 5,000 terms in one sum, or 20,000 unary minus signs give a raw `RangeError: Maximum call stack size exceeded` instead of an ExprError. This is unlikely by hand but possible from generated syntax.
- Repro: `compileExpression(ds, '('.repeat(2000) + '1' + ')'.repeat(2000))`.

**FZ-13 [P2] Transforms: bin labels for negative numbers read "-28.3643--11.5189"**
- Source: `src/lib/transform/binning.ts` `binLabels` (joins bounds with "-").
- Symptom: labels are ambiguous for negative data, for example "-20--10". Use " to " or an en dash. 67 hits.
- Repro: `binLabels([-11.52], -28.36, false)` or `binLabels([-20, -10], -30, true)`.

**FZ-14 [P2] Procedures: Descriptives / Explore APA text says "SD = n/a"**
- Source: `src/procedures/core/descriptives.ts` APA text and `common.ts` n/a formatting.
- Symptom: with one valid case, the text reads "scale1: M = -18.64, SD = n/a". Explore groups add "Monthly income (-23): ... SD = n/a". Omit the statistic, or say it needs 2 cases.
- Seed: procedures 20260924 `FUZZ_ONLY=descriptives:3`, `explore:2`.

**FZ-15 [P2] Procedures: Chi-square expected-values message says "0 to Infinity"**
- Source: `src/procedures/core/common.ts:47` (range message with `hi = Infinity`).
- Symptom: "Expected values: -1 is outside the allowed range 0 to Infinity." It should say "must be positive".
- Repro: Chi-square test, expected = values, `-1, 2`.

**FZ-16 [P2] Procedures: empty names and empty text blocks in chart and model interpretations**
- Source: `src/procedures/graphs/index.ts` (line and box interpretations) and `src/procedures/models/nomreg.ts`.
- Symptoms:
  - Line chart grouped by a blank string value: "For , the mean falls from -2.58 (-30) to ...".
  - Multinomial with a blank outcome as reference: 'Each outcome category is compared with "".'
  - Box plot with the same variable as variable and group, n = 1: an empty interpretation block.
- Seeds: procedures 20260924 `graph-line:1`, `models.multinomial:12`, `graph-box:3`.

**FZ-17 [P2] IO: Excel round trip drops value labels when no case has a labelled value**
- Source: `src/lib/io/xlsx.ts:155` (labels are applied only if some label's value occurs in the data, a heuristic for "labels mode" exports).
- Symptom: a new or empty variable, or one whose cases are all missing, loses its value labels, for example `sex` with 1 = Male, 2 = Female and all system-missing. 10 hits.

**FZ-18 [P2] IO: CSV/XLSX import turns numeric-looking text columns into numbers and "NA" into system-missing**
- Source: `src/lib/io/infer.ts` (type inference; "NA" treated as missing). For XLSX, the Variables sheet says the type is String but is not used.
- Symptom: a string column `['1','2','NA','3']` comes back numeric with "NA" as sysmis. String value labels become numeric labels and string user-missing codes are dropped. This may be intended for CSV (the R convention). For a Socius-written XLSX, the Variables sheet should win. Decide, then adjust or delete the repro.

**FZ-19 [P2] Transforms: Aggregate suggests Minimum/Maximum for a string variable, then refuses them**
- Source: `src/lib/transform/aggregate.ts:71-72`.
- Symptom: choosing SD for a string variable says "use First, Last, Minimum or Maximum". Choosing Minimum then says "use First or Last".

## Resolved during the run (AI provider matrix)

These three problems were found at about 13:50 and were already gone at 14:10. The concurrent
Interactions-API rework of `src/platform/ai-http.ts` / `ai.ts` fixed them, so they have no id.
The matrix keeps them from coming back.
- OpenAI-compatible and local streaming with an unparseable SSE `data:` line resolved to `""`, a silent blank answer. It now gives `AiError(unavailable)`.
- A local Ollama answering 403 (this website not in `OLLAMA_ORIGINS`) was reported as "did not accept the key". It is now `local_forbidden`.
- A Groq/OpenAI-compatible 429 daily limit said "starts again at midnight Pacific time", which is Google-specific. It now says "Try again tomorrow".

Final re-run of the matrix, after the Interactions work: all 288 combinations end in a result or an
`AiError` with a known code and a plain-English `aiErrorText`. The combinations include 401
ACCESS_TOKEN_TYPE_UNSUPPORTED on every endpoint (reported as a key problem, never "OAuth"),
array-wrapped Interactions errors, mid-stream `event_type: error`, thought steps (never shown), and
MAX_TOKENS with no text (`max_tokens`, not a blank answer), and the Interactions-to-generateContent fallback (Interactions 404, generateContent answers).

## Areas with no findings

- **.sav export/import**: 120 datasets x 3 compressions x both byte orders, with long strings split across 255-byte segments at multi-byte characters, LO/HI ranges, extreme doubles and Unicode dictionaries. The round trip is lossless (or explained by the export report), and pyreadstat reads every file identically.
- **Corrupted input**: 1,500 mangled .sav files and 300 garbage files. Always `SavFormatError` (for .sav) or a plain-English Error, and never slower than 3 s.
- **Expression semantics**: 26,856 values agree with the reference SPSS rules (0*missing, MOD(0,missing), three-valued AND/OR, MEAN.n, user-missing vs VALUE()/SYSMIS(), precedence `-2**2 = -4`, left-associative `**`).
- **Numerics**: 4,898 statistics agree with scipy/statsmodels/pingouin to 1e-6, weighted and unweighted.
- **Undo/redo**: every successful transform in the ops and compute suites (several thousand) is restored exactly by undo and re-applied by redo.
- **UI**: 60 states x all actions, with no errors, overflow or missing results.

## Notes for specialists

- The metamorphic weight check skips tables that say they show unweighted counts (logistic/PLUM/NOMREG/RELIABILITY case summaries, box-plot hinges). These match SPSS.
- Not confirmed as a bug, needs an SPSS check: in expressions, user-missing values of *string* variables are compared as ordinary text (`region = 'NA'` is true when 'NA' is declared missing). In SPSS they may count as missing in logical expressions.
- Very small regression coefficients are shown as text ("1.455E-4", 4 significant digits). Word/Excel exports then get text, not a number.
