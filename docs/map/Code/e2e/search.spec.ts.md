---
id: e2e/search.spec.ts
type: e2e-spec
file: e2e/search.spec.ts
area: e2e
---

# e2e/search.spec.ts

*End-to-end spec* · area [[e2e]] · 166 lines

> Search palette end to end: Ctrl+K, the top-bar field and "/", commands (same as the menus), variables, results, help topics, coded text, and the phone layout.

## Test cases
  - Ctrl+K: "chi square" opens Crosstabs; arrows, Escape and suggestions work
  - the top-bar field and "/" open the same palette; typos and synonyms work
  - a variable: Enter selects its column in Data View; Frequencies of it; Variable View
  - results, help topics and coded text
  - disabled commands show why; phone width opens full screen from the search button

## Imports
- [[@playwright-test|@playwright/test]] · value
- [[e2e/helpers.ts]] · value

## Calls
- [[e2e/helpers.ts#openWithSample|openWithSample()]]

## Tests
- [[Independent-Samples T Test|Analyze > Compare Means > Independent-Samples T Test...]] · menu label
- [[One-Way ANOVA|Analyze > Compare Means > One-Way ANOVA...]] · menu label
- [[Descriptive Statistics/Crosstabs|Analyze > Descriptive Statistics > Crosstabs...]] · menu label
- [[Descriptive Statistics/Frequencies|Analyze > Descriptive Statistics > Frequencies...]] · menu label
- [[Linear Regression|Analyze > Regression > Linear Regression...]] · menu label
- [[Reliability Analysis|Analyze > Scale > Reliability Analysis...]] · menu label
- [[Procedures/crosstabs|Crosstabs]] · menu label
- [[Select cases|Data > Select cases...]] · menu label
- [[Procedures/frequencies|Frequencies]] · menu label
- [[Procedures/ttest-independent|Independent-Samples T Test]] · menu label
- [[Procedures/models.linear|Linear Regression]] · menu label
- [[Procedures/oneway-anova|One-Way ANOVA]] · menu label
- [[Procedures/models.reliability|Reliability Analysis]] · menu label
- [[Intercoder reliability|Text coding > Intercoder reliability]] · menu label
- [[Load sample interviews|Text coding > Load sample interviews...]] · menu label
- [[Data View|View > Data View]] · menu label
- [[Output|View > Output]] · menu label
- [[View/Text coding|View > Text coding]] · menu label
- [[Variable View|View > Variable View]] · menu label

## Private helpers
palette() (line 6) · input() (line 7) · watchErrors() (line 9)
