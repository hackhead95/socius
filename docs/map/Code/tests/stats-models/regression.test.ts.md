---
id: tests/stats-models/regression.test.ts
type: test
file: tests/stats-models/regression.test.ts
area: tests
---

# tests/stats-models/regression.test.ts

*Test file* · area [[tests]] · 110 lines

## Test cases
- **linear regression (vs statsmodels / pingouin)**
  - OLS coefficients, SEs, t, p, CI, Beta, R², F (model 1)
  - zero-order, partial and part correlations
  - hierarchical block with dummies and R² change
  - excluded-variable statistics (Beta In, t, partial, tolerance)
  - integer frequency weights equal case replication (SPSS WEIGHT BY)
  - non-integer frequency weights match GLM freq_weights
  - collinear predictor is excluded, others unchanged
  - stepwise selection follows SPSS PIN/POUT rules
  - errors clearly on a constant outcome or too few cases

## Imports
- [[regression.ts]] · value
- `tests/stats-models/fixtures/regression.json` · value
- [[stats-models/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[stats-models/helpers.ts#close|close()]]
- [[stats-models/helpers.ts#closeAll|closeAll()]]
- [[stats-models/helpers.ts#col|col()]]
- [[stats-models/helpers.ts#dummyCols|dummyCols()]]
- [[regression.ts#durbinWatson|durbinWatson()]]
- [[regression.ts#excludedStats|excludedStats()]]
- [[regression.ts#fitLinear|fitLinear()]]
- [[stats-models/helpers.ts#ones|ones()]]
- [[regression.ts#r2Change|r2Change()]]
- [[regression.ts#stepwiseSelect|stepwiseSelect()]]

## Uses
- [[stats-models/helpers.ts#col|col()]]

## Tests
- [[regression.ts]] · import

## Private helpers
y (line 6) · age (line 7) · educ (line 7) · female (line 7) · income (line 7) · n (line 8) · checkFit() (line 12)
