---
id: "procedure:graph-line"
type: procedure
file: src/procedures/graphs/index.ts
area: procedures
---

# Line Chart

*Analysis procedure (ProcedureDef)* · defined in [[graphs/index.ts]] · area [[procedures]]

- **Menu:** Graphs
- **Description:** Show how the mean (or count) of a variable changes across ordered categories such as age groups or survey years.

> Line charts suit ordered categories (years, age groups, education levels). For unordered categories such as region, use a bar chart instead. Add "Separate lines for" to compare groups, for example men and women.

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| x | Category axis (ordered) | 1 | 1 |  | ordinal, scale |
| y | Variable (for means) | 0 | 1 | numeric | scale |
| group | Separate lines for (optional) | 0 | 1 |  | nominal, ordinal |

## Options
| key | type | label | group | default |
|---|---|---|---|---|
| stat | select | Lines show | Chart | "mean" |

## Calls
- [[core/data.ts#categoryLabel|categoryLabel()]]
- [[output.ts#cell|cell()]]
- [[core/data.ts#distinctValues|distinctValues()]]
- [[output.ts#hcell|hcell()]]
- [[core/types.ts#newId|newId()]]
- [[core/data.ts#requireVariable|requireVariable()]]
- [[core/data.ts#selectCases|selectCases()]]
- [[core/data.ts#varDisplayName|varDisplayName()]]

## Tested by
- [[graphs.test.ts]] · procedure id
- [[sample-survey.test.ts]] · procedure id

## Generates SPSS syntax
- [[GRAPH]]

## Implemented by
- [[graphs/index.ts#lineChart|lineChart]]

## Configured in dialog
- [[procedure/graph-line|procedure: graph-line]]
