---
id: tests/stats-core/fuzz-fixes.test.ts
type: test
file: tests/stats-core/fuzz-fixes.test.ts
area: tests
---

# tests/stats-core/fuzz-fixes.test.ts

*Test file* · area [[tests]] · 339 lines

> Focused tests for the statistics and procedure fixes from the combinatorial test suite (docs/qa/FUZZ-FINDINGS.md FZ-03 ... FZ-16, the weighted multinomial metamorphic failure, UI-010) and the shared text helpers (src/procedures/text.ts).

## Test cases
- **shared text helpers**
  - numText never prints a negative zero and drops the leading zero for bounded statistics
  - countText shows tiny fractional weights instead of "0"
  - allFinite and cleanBlocks
- **FZ-03 header/body alignment**
  - Descriptives: every combination of the statistics checkboxes gives a header as wide as the body
  - S.E. mean without Mean sits under its own heading, next to the right values
- **FZ-04 case processing summaries are weighted throughout**
  - Crosstabs: Valid 6 (66.7%), Missing 3 (33.3%), Total 9, and the case note says 3
  - the weighted missing count equals the replicated data
  - Multinomial: Missing and Total in the Case Processing Summary are weighted
- **FZ-06 / FZ-07 / FZ-14: statistics that cannot be computed are explained, never printed as n/a**
  - One-way ANOVA with a one-case group: no Welch F(2, NaN) sentence; the reason is given
  - Correlations: fewer than 3 cases gives no r(-2) and says a test needs 3 cases
  - Scatter plot with a total weight below 3 gives a plain note instead of r(-2)
  - Descriptives and Explore with a single case omit the SD and say why
  - Means with fractional weights leaving no within-group df: no negative df and no p = n/a
- **FZ-08 confidence level: the dialog and run() apply the same 1 to 99.99 rule**
  - every CI option uses min 1 and max 99.99
  - the boundaries run, and an out-of-range value gives the dialog message from run()
  - levels read naturally in headings
- **FZ-09 post hoc speed**
  - Games-Howell and Tukey on 3,000 cases, 7 groups, 3 dependents finish in well under a second each
- **FZ-11 exact tests: fast Monte Carlo with a time budget**
  - the Monte Carlo sampler agrees with complete enumeration
  - a 10 x 2 table with 6,000 cases goes straight to Monte Carlo and takes milliseconds
- **FZ-15 / FZ-16 messages and names**
  - Chi-square expected values: a negative value says "greater than 0", never "Infinity"
  - a blank string category is "(blank)" in chart, model and box-plot text; no empty blocks
- **weighted models equal replicated cases**
  - multinomial: integer weights give the same estimates as replicated cases, bit for bit, even under separation
  - multinomial and frequencies cope with huge or numerous category codes (no spread over the data)
  - population pyramid with ages in the billions is refused quickly instead of running out of memory
- **UI-010 one naming convention per analysis**
  - labels only when every variable has a short statement label, otherwise names throughout
  - linear regression prose does not mix names and labels
- **background runs (runProcedure)**
  - the worker handler returns the item, or the procedure's own message
  - without Worker support (Node, old browsers) runs directly

## Imports
- [[output.ts]] · type-only
- [[procedure.ts]] · value
- [[core/types.ts]] · value
- [[runProcedure.ts]] · value
- [[varUtils.ts]] · value
- [[output/format.ts]] · value
- [[stats/crosstabs.ts]] · value
- [[logistic.ts]] · value
- [[procedures/index.ts]] · value
- [[models/common.ts]] · value
- [[procedures/text.ts]] · value
- [[vitest]] · value

## Calls
- [[procedures/text.ts#allFinite|allFinite()]]
- [[stats/crosstabs.ts#chiSquareTests|chiSquareTests()]]
- [[procedures/text.ts#cleanBlocks|cleanBlocks()]]
- [[procedures/text.ts#confLevel|confLevel()]]
- [[procedures/text.ts#countText|countText()]]
- [[procedure.ts#defaultOptions|defaultOptions()]]
- [[stats/crosstabs.ts#fisherMonteCarlo|fisherMonteCarlo()]]
- [[stats/crosstabs.ts#fisherRxC|fisherRxC()]]
- [[logistic.ts#fitMultinomial|fitMultinomial()]]
- [[procedures/index.ts#getProcedure|getProcedure()]]
- [[runProcedure.ts#handleRunRequest|handleRunRequest()]]
- [[output/format.ts#layoutRows|layoutRows()]]
- [[procedures/text.ts#levelText|levelText()]]
- [[core/types.ts#makeDataset|makeDataset()]]
- [[core/types.ts#makeVariable|makeVariable()]]
- [[procedures/text.ts#numText|numText()]]
- [[models/common.ts#proseNamer|proseNamer()]]
- [[runProcedure.ts#runsInBackground|runsInBackground()]]
- [[runProcedure.ts#startProcedureRun|startProcedureRun()]]
- [[varUtils.ts#validate|validate()]]

## Uses
- [[procedures/text.ts#CI_MAX|CI_MAX]]
- [[procedures/text.ts#CI_MIN|CI_MIN]]
- [[procedures/index.ts#procedures|procedures]]

## Tests
- [[Procedures/correlations|Bivariate Correlations]] · procedure id
- [[Procedures/graph-box|Box Plot]] · procedure id
- [[Procedures/chisquare-gof|Chi-Square (goodness of fit)]] · procedure id
- [[Procedures/crosstabs|Crosstabs]] · procedure id
- [[Procedures/descriptives|Descriptives]] · procedure id
- [[Procedures/explore|Explore]] · procedure id
- [[Procedures/frequencies|Frequencies]] · procedure id
- [[Procedures/graph-line|Line Chart]] · procedure id
- [[Procedures/models.linear|Linear Regression]] · procedure id
- [[Procedures/means|Means]] · procedure id
- [[Procedures/models.multinomial|Multinomial Logistic Regression]] · procedure id
- [[Procedures/ttest-one-sample|One-Sample T Test]] · procedure id
- [[Procedures/oneway-anova|One-Way ANOVA]] · procedure id
- [[Procedures/ttest-paired|Paired-Samples T Test]] · procedure id
- [[Procedures/graph-pyramid|Population Pyramid]] · procedure id
- [[Procedures/graph-scatter|Scatter Plot]] · procedure id
- [[output.ts]] · import
- [[procedure.ts]] · import
- [[core/types.ts]] · import
- [[runProcedure.ts]] · import
- [[varUtils.ts]] · import
- [[output/format.ts]] · import
- [[stats/crosstabs.ts]] · import
- [[logistic.ts]] · import
- [[procedures/index.ts]] · import
- [[models/common.ts]] · import
- [[procedures/text.ts]] · import

## Private helpers
ds() (line 17) · run() (line 22) · texts() (line 26) · table() (line 27) · widths() (line 28)
