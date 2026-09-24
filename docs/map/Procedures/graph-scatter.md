---
id: "procedure:graph-scatter"
type: procedure
file: src/procedures/graphs/index.ts
area: procedures
---

# Scatter Plot

*Analysis procedure (ProcedureDef)* · defined in [[graphs/index.ts]] · area [[procedures]]

- **Menu:** Graphs
- **Description:** Look at the relationship between two scale variables, optionally coloured by group, with a fitted line.

> Put the variable you think of as the outcome on the Y axis. Look for the direction (up or down), the strength (how tightly points follow a line), curves, and outliers. The fit line and r describe only the straight-line part of the relationship. A curve or a few extreme cases can make r misleading, which is why looking at the plot matters.

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| x | X axis | 1 | 1 | numeric | scale, ordinal |
| y | Y axis | 1 | 1 | numeric | scale, ordinal |
| group | Colour by (optional) | 0 | 1 |  | nominal, ordinal |

## Options
| key | type | label | group | default |
|---|---|---|---|---|
| fit | checkbox | Show linear fit line with r and R² | Chart | true |

## Calls
- [[core/data.ts#categoryLabel|categoryLabel()]]
- [[output.ts#cell|cell()]]
- [[core/data.ts#distinctValues|distinctValues()]]
- [[output/format.ts#formatP|formatP()]]
- [[output.ts#hcell|hcell()]]
- [[core/types.ts#newId|newId()]]
- [[core/data.ts#requireVariable|requireVariable()]]
- [[core/data.ts#selectCases|selectCases()]]
- [[core/data.ts#varDisplayName|varDisplayName()]]

## Uses
- [[stats.ts#betacf|betacf()]] · procedure helper
- [[stats.ts#ibeta|ibeta()]] · procedure helper
- [[stats.ts#lgamma|lgamma()]] · procedure helper
- [[stats.ts#linearFit|linearFit()]] · procedure helper
- [[stats.ts#tTwoSidedP|tTwoSidedP()]] · procedure helper
- [[core/common.ts#vprose|vprose()]] · procedure helper

## Tested by
- [[graphs.test.ts]] · procedure id
- [[sample-survey.test.ts]] · procedure id

## Generates SPSS syntax
- [[GRAPH]]

## Implemented by
- [[graphs/index.ts#scatter|scatter]]

## Configured in dialog
- [[procedure/graph-scatter|procedure: graph-scatter]]
