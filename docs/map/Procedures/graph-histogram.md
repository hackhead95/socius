---
id: "procedure:graph-histogram"
type: procedure
file: src/procedures/graphs/index.ts
area: procedures
---

# Histogram

*Analysis procedure (ProcedureDef)* · defined in [[graphs/index.ts]] · area [[procedures]]

- **Menu:** Graphs
- **Description:** See the shape of a scale variable: where values cluster, how spread out they are, and whether the distribution is skewed.

> Use a histogram for scale variables such as age, income or hours worked. The normal curve helps you judge whether the variable is roughly normal, which matters for t-tests, ANOVA and regression with small samples. Strong skew (for example income) often calls for a median instead of a mean, a log transformation, or a nonparametric test.

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| variable | Variable | 1 | 1 | numeric | scale |

## Options
| key | type | label | group | default |
|---|---|---|---|---|
| normal | checkbox | Show normal curve | Chart | true |
| bins | number | Number of bars (0 = automatic) | Chart | 0 |

## Calls
- [[output.ts#cell|cell()]]
- [[output.ts#hcell|hcell()]]
- [[core/types.ts#newId|newId()]]
- [[core/data.ts#requireVariable|requireVariable()]]
- [[core/data.ts#selectCases|selectCases()]]
- [[core/data.ts#varDisplayName|varDisplayName()]]

## Uses
- [[stats.ts#binCounts|binCounts()]] · procedure helper
- [[procedures/text.ts#cleanBlocks|cleanBlocks()]] · procedure helper
- [[procedures/text.ts#countText|countText()]] · procedure helper
- [[stats.ts#histogramEdges|histogramEdges()]] · procedure helper
- [[procedures/text.ts#numText|numText()]] · procedure helper
- [[core/common.ts#vprose|vprose()]] · procedure helper
- [[stats.ts#wMoments|wMoments()]] · procedure helper
- [[stats.ts#wPercentile|wPercentile()]] · procedure helper

## Tested by
- [[quant.spec.ts]] · menu label
- [[graphs.test.ts]] · procedure id
- [[sample-survey.test.ts]] · procedure id

## Implemented by
- [[graphs/index.ts#histogram|histogram]]

## Configured in dialog
- [[procedure/graph-histogram|procedure: graph-histogram]]
