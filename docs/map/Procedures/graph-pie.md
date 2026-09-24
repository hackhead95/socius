---
id: "procedure:graph-pie"
type: procedure
file: src/procedures/graphs/index.ts
area: procedures
---

# Pie Chart

*Analysis procedure (ProcedureDef)* · defined in [[graphs/index.ts]] · area [[procedures]]

- **Menu:** Graphs
- **Description:** Show the parts of a whole for a variable with a few categories.

> Pie charts work only for a handful of categories that add up to a meaningful whole. People compare bar lengths much more accurately than angles, so a bar chart of percentages is usually the better choice in a paper. More than 8 categories are combined: the 7 largest are shown and the rest become "Other".

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| category | Slices by | 1 | 1 |  | nominal, ordinal |

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

## Implemented by
- [[graphs/index.ts#pieChart|pieChart]]

## Configured in dialog
- [[procedure/graph-pie|procedure: graph-pie]]
