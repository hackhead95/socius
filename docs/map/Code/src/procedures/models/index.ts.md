---
id: src/procedures/models/index.ts
type: module
file: src/procedures/models/index.ts
area: procedures
---

# src/procedures/models/index.ts

*Module* · area [[procedures]] · 11 lines

## Imports
- [[procedure.ts]] · type-only
- [[binary.ts]] · value
- [[models/factor.ts]] · value
- [[linear.ts]] · value
- [[nomreg.ts]] · value
- [[plum.ts]] · value
- [[models/reliability.ts]] · value

## Tested by
- [[stats-models/procedures.test.ts]] · import

## Imported by
- [[procedures/index.ts]] · value
- [[stats-models/procedures.test.ts]] · value

## Symbols

### modelProcedures
*const* · line 10 · exported
> Statistical-model procedures: Regression, Scale and Dimension Reduction menus.
- Uses: [[binary.ts#binaryLogistic|binaryLogistic]], [[linear.ts#linearRegression|linearRegression]], [[models/factor.ts#factorAnalysis|factorAnalysis]], [[models/reliability.ts#reliability|reliability]], [[nomreg.ts#multinomialLogistic|multinomialLogistic]], [[plum.ts#ordinalRegression|ordinalRegression]]
- Used in: [[procedures/index.ts]], [[stats-models/procedures.test.ts]]
