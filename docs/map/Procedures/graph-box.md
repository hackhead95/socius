---
id: "procedure:graph-box"
type: procedure
file: src/procedures/graphs/index.ts
area: procedures
---

# Box Plot

*Analysis procedure (ProcedureDef)* · defined in [[graphs/index.ts]] · area [[procedures]]

- **Menu:** Graphs
- **Description:** Compare medians and spread of scale variables, overall or across groups, and spot outliers.

> The box covers the middle half of the cases (from the 25th to the 75th percentile), the line inside is the median, and the whiskers reach the most extreme values that are not outliers. Circles are outliers (more than 1.5 box-lengths from the box) and stars are extreme values (more than 3 box-lengths). Point at them to see case numbers, then check those cases in Data View.

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| variables | Variables | 1 | ∞ | numeric | scale |
| group | Group by (optional) | 0 | 1 |  | nominal, ordinal |

## Options
| key | type | label | group | default |
|---|---|---|---|---|
| showMean | checkbox | Mark the mean (+) | Chart | true |
| missing | select | Missing values | Options | "listwise" |

## Calls
- [[core/data.ts#categoryLabel|categoryLabel()]]
- [[output.ts#cell|cell()]]
- [[core/data.ts#distinctValues|distinctValues()]]
- [[output.ts#hcell|hcell()]]
- [[core/types.ts#newId|newId()]]
- [[core/data.ts#requireVariable|requireVariable()]]
- [[core/data.ts#selectCases|selectCases()]]
- [[core/data.ts#varDisplayName|varDisplayName()]]

## Uses
- [[procedures/text.ts#allFinite|allFinite()]] · procedure helper
- [[stats.ts#boxStats|boxStats()]] · procedure helper
- [[procedures/text.ts#cleanBlocks|cleanBlocks()]] · procedure helper
- [[procedures/text.ts#countText|countText()]] · procedure helper
- [[procedures/text.ts#labelOf|labelOf()]] · procedure helper
- [[procedures/text.ts#nonEmpty|nonEmpty()]] · procedure helper
- [[procedures/text.ts#numText|numText()]] · procedure helper
- [[stats.ts#tukeyHinges|tukeyHinges()]] · procedure helper
- [[core/common.ts#vprose|vprose()]] · procedure helper
- [[stats.ts#wMoments|wMoments()]] · procedure helper
- [[stats.ts#wPercentile|wPercentile()]] · procedure helper

## Tested by
- [[graphs.test.ts]] · procedure id
- [[fuzz-fixes.test.ts]] · procedure id
- [[sample-survey.test.ts]] · procedure id

## Generates SPSS syntax
- [[EXAMINE]]

## Implemented by
- [[graphs/index.ts#boxPlot|boxPlot]]

## Configured in dialog
- [[procedure/graph-box|procedure: graph-box]]
