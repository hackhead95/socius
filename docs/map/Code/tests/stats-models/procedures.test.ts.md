---
id: tests/stats-models/procedures.test.ts
type: test
file: tests/stats-models/procedures.test.ts
area: tests
---

# tests/stats-models/procedures.test.ts

*Test file* · area [[tests]] · 375 lines

## Test cases
- **registry**
  - exports all model procedures with unique ids and the right menus
  - Linear Regression (hierarchical, dummies, all statistics)
  - Linear Regression (stepwise)
  - Binary Logistic Regression
  - Ordinal Regression
  - Multinomial Logistic Regression
  - Reliability Analysis
  - Factor Analysis (all extraction x rotation combinations)
- **procedure numerics match the oracle through the full run() path**
  - linear regression model 1 (unweighted) and weighted R² (WEIGHT BY)
  - R² change between blocks
  - binary logistic coefficients
  - event = lower value flips the coefficients
  - ordinal regression thresholds and locations
  - multinomial parameters and LR tests (reference = last)
  - reliability alpha, omega and weighted alpha
  - factor analysis KMO, Bartlett, eigenvalues
- **dummy coding names and reference categories**
  - first / last / most frequent
  - dummy coding off keeps a labelled variable as a scale predictor; strings are always categorical
- **warnings instead of crashes**
  - perfect collinearity: excluded variable, warning, Excluded Variables table
  - high VIF produces a multicollinearity warning
  - quasi-complete separation in logistic regression names the category
  - complete separation on a covariate
  - logistic rejects a dependent with three values
  - reliability flags a reverse-worded item and low alpha
  - factor analysis warns on unsuitable data (KMO < .6)
  - suppressing small loadings blanks those cells
  - stepwise that enters nothing reports it
  - clear errors: dependent also a predictor, no cases left

## Imports
- [[output.ts]] · type-only
- [[procedure.ts]] · value
- [[core/types.ts]] · type-only, value
- [[procedures/index.ts]] · value
- [[models/index.ts]] · value
- [[dataset.ts]] · value
- `tests/stats-models/fixtures/factor.json` · value
- `tests/stats-models/fixtures/logistic.json` · value
- `tests/stats-models/fixtures/multinomial.json` · value
- `tests/stats-models/fixtures/ordinal.json` · value
- `tests/stats-models/fixtures/regression.json` · value
- `tests/stats-models/fixtures/reliability.json` · value
- [[stats-models/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[dataset.ts#buildSurvey|buildSurvey()]]
- [[stats-models/helpers.ts#close|close()]]
- [[stats-models/helpers.ts#closeAll|closeAll()]]
- [[procedure.ts#defaultOptions|defaultOptions()]]
- [[core/types.ts#makeVariable|makeVariable()]]

## Uses
- [[models/index.ts#modelProcedures|modelProcedures]]
- [[procedures/index.ts#procedures|procedures]]
- [[stats-models/helpers.ts#socio|socio]]

## Tests
- [[Dimension Reduction|Analyze > Dimension Reduction]] · menu label
- [[Analyze/Regression|Analyze > Regression]] · menu label
- [[Binary Logistic Regression|Analyze > Regression > Binary Logistic Regression...]] · menu label
- [[Multinomial Logistic Regression|Analyze > Regression > Multinomial Logistic Regression...]] · menu label
- [[Ordinal Regression|Analyze > Regression > Ordinal Regression...]] · menu label
- [[Analyze/Scale|Analyze > Scale]] · menu label
- [[Reliability Analysis|Analyze > Scale > Reliability Analysis...]] · menu label
- [[Procedures/models.logistic|Binary Logistic Regression]] · menu label, procedure id
- [[Procedures/models.factor|Factor Analysis]] · procedure id
- [[Procedures/models.linear|Linear Regression]] · procedure id
- [[Procedures/models.multinomial|Multinomial Logistic Regression]] · menu label, procedure id
- [[Procedures/models.ordinal|Ordinal Regression]] · menu label, procedure id
- [[Procedures/models.reliability|Reliability Analysis]] · menu label, procedure id
- [[output.ts]] · import
- [[procedure.ts]] · import
- [[core/types.ts]] · import
- [[procedures/index.ts]] · import
- [[models/index.ts]] · import

## Private helpers
proc() (line 17) · run() (line 23) · rowWidths() (line 32) · expectWellFormed() (line 63) · table() (line 103) · tables() (line 108) · texts() (line 111) · rowNums() (line 115) · variants (line 121)
