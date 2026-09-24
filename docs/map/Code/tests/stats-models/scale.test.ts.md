---
id: tests/stats-models/scale.test.ts
type: test
file: tests/stats-models/scale.test.ts
area: tests
---

# tests/stats-models/scale.test.ts

*Test file* · area [[tests]] · 128 lines

## Test cases
- **reliability (vs pingouin / pandas)**
  - alpha, standardized alpha, item-total statistics, omega (with a reverse-worded item)
  - all-positive scale
  - frequency weights equal replication
  - rejects zero-variance items and single items
- **factor analysis (vs numpy / factor_analyzer)**
  - correlation matrix, KMO/MSA, Bartlett, determinant
  - principal components: eigenvalues, loadings (sum of each column positive)
  - principal axis factoring with the SPSS stopping rule (algorithm oracle)
  - varimax keeps communalities; sort-by-size ordering
  - weighted correlation / Bartlett equal replication
  - fixed number of factors and clear errors

## Imports
- [[stats/factor.ts]] · value
- [[stats/reliability.ts]] · value
- `tests/stats-models/fixtures/factor.json` · value
- `tests/stats-models/fixtures/reliability.json` · value
- [[stats-models/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[stats-models/helpers.ts#close|close()]]
- [[stats-models/helpers.ts#closeAll|closeAll()]]
- [[stats-models/helpers.ts#closeLoadings|closeLoadings()]]
- [[stats-models/helpers.ts#col|col()]]
- [[stats/factor.ts#correlationMatrix|correlationMatrix()]]
- [[stats/factor.ts#extractFactors|extractFactors()]]
- [[stats/factor.ts#kmoBartlett|kmoBartlett()]]
- [[stats/reliability.ts#oneFactorML|oneFactorML()]]
- [[stats-models/helpers.ts#ones|ones()]]
- [[stats/reliability.ts#reliabilityAnalysis|reliabilityAnalysis()]]
- [[stats/factor.ts#rotate|rotate()]]
- [[stats/factor.ts#sortOrder|sortOrder()]]

## Uses
- [[stats-models/helpers.ts#col|col()]]

## Tests
- [[stats/factor.ts]] · import
- [[stats/reliability.ts]] · import

## Private helpers
n (line 8)
