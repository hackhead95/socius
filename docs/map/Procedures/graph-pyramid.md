---
id: "procedure:graph-pyramid"
type: procedure
file: src/procedures/graphs/index.ts
area: procedures
---

# Population Pyramid

*Analysis procedure (ProcedureDef)* · defined in [[graphs/index.ts]] · area [[procedures]]

- **Menu:** Graphs
- **Description:** Show the age structure of your sample by sex (or any two-category variable), in 5- or 10-year age groups.

> A population pyramid puts one group on each side of a shared age axis, youngest at the bottom. Compare its shape with census figures to see whether your sample over- or under-represents some age groups; that is a common reason to weight survey data.

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| age | Age variable | 1 | 1 | numeric | scale, ordinal |
| sex | Split by | 1 | 1 |  | nominal, ordinal |

## Options
| key | type | label | group | default |
|---|---|---|---|---|
| sides | groupPair | Left and right side | Chart |  |
| width | select | Age groups | Chart | "5" |
| top | number | Open-ended top group from age (0 = none) | Chart | 85 |
| display | select | Bars show | Chart | "count" |

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

## Generates SPSS syntax
- [[BEGIN]]
- [[END GPL]]
- [[EXECUTE]]
- [[GGRAPH]]
- [[RECODE]]
- [[VALUE LABELS]]

## Implemented by
- [[graphs/index.ts#pyramid|pyramid]]

## Configured in dialog
- [[procedure/graph-pyramid|procedure: graph-pyramid]]
