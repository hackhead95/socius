---
id: tests/output/scale.test.ts
type: test
file: tests/output/scale.test.ts
area: tests
---

# tests/output/scale.test.ts

*Test file* · area [[tests]] · 106 lines

## Test cases
- **nice ticks**
  - niceStep picks 1/2/2.5/5 x 10^k
  - covers the data with whole steps
  - handles decimals without float noise
  - handles negative and degenerate ranges
  - formats ticks by step
- **scales**
  - linear maps and inverts direction
  - band divides the range
  - extent ignores non-finite values
  - normal curve integrates to about n
  - pie angles sum to a full circle
  - bar paths are empty for zero size and closed otherwise
- **labels**
  - truncates with an ellipsis
  - thins labels that would overlap
  - wraps legend items
  - finds the nearest point

## Imports
- [[scale.ts]] · value
- [[vitest]] · value

## Calls
- [[scale.ts#arcPath|arcPath()]]
- [[scale.ts#band|band()]]
- [[scale.ts#barPath|barPath()]]
- [[scale.ts#extent|extent()]]
- [[scale.ts#formatTick|formatTick()]]
- [[scale.ts#labelStride|labelStride()]]
- [[scale.ts#legendLayout|legendLayout()]]
- [[scale.ts#linear|linear()]]
- [[scale.ts#niceStep|niceStep()]]
- [[scale.ts#niceTicks|niceTicks()]]
- [[scale.ts#normalCurvePoints|normalCurvePoints()]]
- [[scale.ts#pieAngles|pieAngles()]]
- [[scale.ts#PointIndex|PointIndex]]
- [[scale.ts#stepDecimals|stepDecimals()]]
- [[scale.ts#truncateLabel|truncateLabel()]]

## Tests
- [[scale.ts]] · import
