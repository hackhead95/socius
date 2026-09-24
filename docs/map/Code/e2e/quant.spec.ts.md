---
id: e2e/quant.spec.ts
type: e2e-spec
file: e2e/quant.spec.ts
area: e2e
---

# e2e/quant.spec.ts

*End-to-end spec* · area [[e2e]] · 132 lines

> Statistics end-to-end checks on the bundled sample survey: dialogs, numbers (verified against scipy/statsmodels), weighting, inline errors, and the Word export.

## Test cases
  - crosstabs with column percentages: SPSS numbers and a group-wise reading
  - independent t test and weighting change the numbers
  - dialog problems are shown inline, never as a crash
  - Word export holds APA tables and chart images
  - t test groups defined by a cut point run without asking for group values

## Imports
- [[@playwright-test|@playwright/test]] · value
- [[e2e/helpers.ts]] · value
- [[fflate]] · value
- [[node-fs|node:fs]] · value

## Calls
- [[e2e/helpers.ts#openWithSample|openWithSample()]]

## Tests
- [[Compare Means|Analyze > Compare Means]] · menu label
- [[Independent-Samples T Test|Analyze > Compare Means > Independent-Samples T Test...]] · menu label
- [[One-Way ANOVA|Analyze > Compare Means > One-Way ANOVA...]] · menu label
- [[Correlate|Analyze > Correlate]] · menu label
- [[Bivariate Correlations|Analyze > Correlate > Bivariate Correlations...]] · menu label
- [[Descriptive Statistics|Analyze > Descriptive Statistics]] · menu label
- [[Descriptive Statistics/Crosstabs|Analyze > Descriptive Statistics > Crosstabs...]] · menu label
- [[Descriptive Statistics/Frequencies|Analyze > Descriptive Statistics > Frequencies...]] · menu label
- [[Procedures/correlations|Bivariate Correlations]] · menu label
- [[Procedures/crosstabs|Crosstabs]] · menu label
- [[Weight cases|Data > Weight cases...]] · menu label
- [[Procedures/frequencies|Frequencies]] · menu label
- [[Graphs/Histogram|Graphs > Histogram...]] · menu label
- [[Procedures/graph-histogram|Histogram]] · menu label
- [[Procedures/ttest-independent|Independent-Samples T Test]] · menu label
- [[Procedures/oneway-anova|One-Way ANOVA]] · menu label

## Private helpers
ready() (line 8) · menu() (line 12) · addVar() (line 18) · run() (line 26) · lastItem() (line 31) · watchErrors() (line 33)
