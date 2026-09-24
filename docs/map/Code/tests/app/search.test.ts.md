---
id: tests/app/search.test.ts
type: test
file: tests/app/search.test.ts
area: tests
---

# tests/app/search.test.ts

*Test file* · area [[tests]] · 166 lines

> @vitest-environment jsdom Search palette matching and ranking, against the real menu model (useMenus).

## Test cases
- **text helpers**
  - normalises punctuation, case, accents and chi symbols
  - measures typos with adjacent swaps as one edit
  - scores exact, prefix, inner and misspelt words
- **commands from the menus**
  - lists every menu item with its menu path, including Analyze procedures, Transform, Text coding, AI and Help
  - keeps disabled items, with the reason
  - runs exactly what the menu runs
- **ranking: words sociologists type**
  - finds every t-test and every regression
  - finds codebook exports and the AI codebook
  - needs every query word to match (no noise from unrelated words)
- **grouping**
  - puts the best group first and caps each group
  - matches value labels with less weight than names

## Imports
- [[@testing-library-react|@testing-library/react]] · value
- [[menus.ts]] · value
- [[search.ts]] · value
- [[store.ts]] · value
- [[core/types.ts]] · value
- [[procedures/index.ts]] · value
- [[vitest]] · value

## Calls
- [[search.ts#cleanLabel|cleanLabel()]]
- [[search.ts#commandsFromMenus|commandsFromMenus()]]
- [[search.ts#editDistance|editDistance()]]
- [[core/types.ts#makeDataset|makeDataset()]]
- [[core/types.ts#makeVariable|makeVariable()]]
- [[search.ts#normalise|normalise()]]
- [[search.ts#queryWords|queryWords()]]
- [[search.ts#scoreEntry|scoreEntry()]]
- [[search.ts#searchEntries|searchEntries()]]
- [[useMenus|useMenus()]]
- [[search.ts#wordScore|wordScore()]]

## Uses
- [[procedures/index.ts#procedures|procedures]]
- [[useStore]]

## Reads
- [[useStore/dialog|useStore.dialog]] · getState

## Writes
- [[dataset|useStore.dataset]] · setState
- [[outputs|useStore.outputs]] · setState

## Calls store actions
- [[closeDialog()|useStore.closeDialog()]] · getState

## Tests
- [[Ask the Socius assistant|AI > Ask the Socius assistant...]] · menu label
- [[Explain a result|AI > Explain a result...]] · menu label
- [[Suggest a codebook|AI > Suggest a codebook...]] · menu label
- [[Independent-Samples T Test|Analyze > Compare Means > Independent-Samples T Test...]] · menu label
- [[One-Sample T Test|Analyze > Compare Means > One-Sample T Test...]] · menu label
- [[One-Way ANOVA|Analyze > Compare Means > One-Way ANOVA...]] · menu label
- [[Paired-Samples T Test|Analyze > Compare Means > Paired-Samples T Test...]] · menu label
- [[Bivariate Correlations|Analyze > Correlate > Bivariate Correlations...]] · menu label
- [[Descriptive Statistics/Crosstabs|Analyze > Descriptive Statistics > Crosstabs...]] · menu label
- [[Descriptive Statistics/Frequencies|Analyze > Descriptive Statistics > Frequencies...]] · menu label
- [[Chi-Square (goodness of fit)|Analyze > Nonparametric Tests > Chi-Square (goodness of fit)...]] · menu label
- [[Binary Logistic Regression|Analyze > Regression > Binary Logistic Regression...]] · menu label
- [[Linear Regression|Analyze > Regression > Linear Regression...]] · menu label
- [[Multinomial Logistic Regression|Analyze > Regression > Multinomial Logistic Regression...]] · menu label
- [[Ordinal Regression|Analyze > Regression > Ordinal Regression...]] · menu label
- [[Reliability Analysis|Analyze > Scale > Reliability Analysis...]] · menu label
- [[Procedures/graph-bar|Bar Chart]] · menu label
- [[Procedures/models.logistic|Binary Logistic Regression]] · menu label
- [[Procedures/correlations|Bivariate Correlations]] · menu label
- [[Procedures/chisquare-gof|Chi-Square (goodness of fit)]] · menu label
- [[Procedures/crosstabs|Crosstabs]] · menu label, procedure id
- [[Select cases|Data > Select cases...]] · menu label
- [[Weight cases|Data > Weight cases...]] · menu label
- [[Undo|Edit > Undo]] · menu label
- [[Open data file|File > Open data file...]] · menu label
- [[Procedures/frequencies|Frequencies]] · menu label, procedure id
- [[Bar Chart|Graphs > Bar Chart...]] · menu label
- [[Keyboard shortcuts|Help > Keyboard shortcuts]] · menu label
- [[User guide|Help > User guide]] · menu label
- [[Procedures/ttest-independent|Independent-Samples T Test]] · menu label
- [[Procedures/models.linear|Linear Regression]] · menu label
- [[Procedures/models.multinomial|Multinomial Logistic Regression]] · menu label
- [[Procedures/ttest-one-sample|One-Sample T Test]] · menu label
- [[Procedures/oneway-anova|One-Way ANOVA]] · menu label
- [[Procedures/models.ordinal|Ordinal Regression]] · menu label
- [[Procedures/ttest-paired|Paired-Samples T Test]] · menu label
- [[Procedures/models.reliability|Reliability Analysis]] · menu label
- [[menus.ts]] · import
- [[search.ts]] · import
- [[store.ts]] · import
- [[core/types.ts]] · import
- [[procedures/index.ts]] · import
- [[Codebook export and import|Text coding > Codebook export and import...]] · menu label
- [[Import documents|Text coding > Import documents...]] · menu label
- [[Intercoder reliability|Text coding > Intercoder reliability]] · menu label
- [[Compute variable|Transform > Compute variable...]] · menu label
- [[Recode into different variables|Transform > Recode into different variables...]] · menu label
- [[View/Text coding|View > Text coding]] · menu label

## Private helpers
sampleDataset() (line 13) · commands() (line 19) · titles() (line 25) · first() (line 26)
