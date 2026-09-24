---
id: "procedure:graph-bar"
type: procedure
file: src/procedures/graphs/index.ts
area: procedures
---

# Bar Chart

*Analysis procedure (ProcedureDef)* · defined in [[graphs/index.ts]] · area [[procedures]]

- **Menu:** Graphs
- **Description:** Show how often each category occurs, or compare the mean of a scale variable across categories.

> Use a bar chart for categorical variables (education, region, party). Choose "Percent" to compare groups of different sizes. Add a cluster variable to compare categories across groups (for example education by sex); "Percentages within" controls which percentages add up to 100. For a scale variable such as income, choose "Mean" to get one bar per category with 95% confidence intervals.

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| category | Category axis | 1 | 1 |  | nominal, ordinal |
| cluster | Cluster by (optional) | 0 | 1 |  | nominal, ordinal |
| variable | Variable for means (optional) | 0 | 1 | numeric | scale |

## Options
| key | type | label | group | default |
|---|---|---|---|---|
| stat | select | Bars show | Chart | "count" |
| pctBase | select | Percentages within | Chart | "cluster" |
| layout | select | Clustered bars | Chart | "clustered" |
| orientation | select | Orientation | Chart | "vertical" |
| errorBars | checkbox | Show 95% confidence intervals (means) | Chart | true |

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
- [[stats.ts#betacf|betacf()]] · procedure helper
- [[procedures/text.ts#cleanBlocks|cleanBlocks()]] · procedure helper
- [[procedures/text.ts#countText|countText()]] · procedure helper
- [[stats.ts#ibeta|ibeta()]] · procedure helper
- [[procedures/text.ts#labelOf|labelOf()]] · procedure helper
- [[stats.ts#lgamma|lgamma()]] · procedure helper
- [[stats.ts#meanCI|meanCI()]] · procedure helper
- [[procedures/text.ts#nonEmpty|nonEmpty()]] · procedure helper
- [[procedures/text.ts#numText|numText()]] · procedure helper
- [[stats.ts#tQuantile|tQuantile()]] · procedure helper
- [[stats.ts#tTwoSidedP|tTwoSidedP()]] · procedure helper
- [[core/common.ts#vprose|vprose()]] · procedure helper
- [[stats.ts#wMoments|wMoments()]] · procedure helper

## Tested by
- [[coding-output-fixes.spec.ts]] · menu label
- [[search.test.ts]] · menu label
- [[graphs.test.ts]] · procedure id

## Generates SPSS syntax
- [[Syntax/COUNT|COUNT]]
- [[GRAPH]]

## Implemented by
- [[graphs/index.ts#barChart|barChart]]

## Configured in dialog
- [[procedure/graph-bar|procedure: graph-bar]]
