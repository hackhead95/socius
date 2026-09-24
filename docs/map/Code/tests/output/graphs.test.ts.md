---
id: tests/output/graphs.test.ts
type: test
file: tests/output/graphs.test.ts
area: tests
---

# tests/output/graphs.test.ts

*Test file* · area [[tests]] · 226 lines

## Test cases
- **graph stats**
  - t quantiles match tables
  - mean CI
  - Tukey hinges and weighted percentiles
  - box stats flag outliers and extremes
  - bins cover the data and counts sum to the weight
  - linear fit
- **graph procedures**
  - all are in the Graphs menu with unique ids
  - bar chart counts with value labels, excluding user-missing
  - bar chart respects weights and filter
  - clustered percentages within cluster sum to 100
  - mean bars have 95% CI error bars
  - validation asks for a variable when showing means
  - histogram with normal curve and stats table
  - box plot by group lists outliers with case numbers
  - scatter with fit line and APA sentence
  - line chart of means by ordered category and group
  - pie chart of a string variable
  - population pyramid in 10-year groups with open top group
  - pyramid asks for two categories when the split variable has more

## Imports
- [[output.ts]] · type-only
- [[procedure.ts]] · value
- [[core/types.ts]] · value
- [[graphs/index.ts]] · value
- [[stats.ts]] · value
- [[vitest]] · value

## Calls
- [[stats.ts#binCounts|binCounts()]]
- [[stats.ts#boxStats|boxStats()]]
- [[procedure.ts#defaultOptions|defaultOptions()]]
- [[stats.ts#histogramEdges|histogramEdges()]]
- [[stats.ts#linearFit|linearFit()]]
- [[core/types.ts#makeDataset|makeDataset()]]
- [[core/types.ts#makeVariable|makeVariable()]]
- [[stats.ts#meanCI|meanCI()]]
- [[stats.ts#tQuantile|tQuantile()]]
- [[stats.ts#tukeyHinges|tukeyHinges()]]
- [[stats.ts#wPercentile|wPercentile()]]

## Uses
- [[graphs/index.ts#graphProcedures|graphProcedures]]

## Tests
- [[Procedures/graph-bar|Bar Chart]] · procedure id
- [[Procedures/graph-box|Box Plot]] · procedure id
- [[Procedures/graph-histogram|Histogram]] · procedure id
- [[Procedures/graph-line|Line Chart]] · procedure id
- [[Procedures/graph-pie|Pie Chart]] · procedure id
- [[Procedures/graph-pyramid|Population Pyramid]] · procedure id
- [[Procedures/graph-scatter|Scatter Plot]] · procedure id
- [[output.ts]] · import
- [[procedure.ts]] · import
- [[core/types.ts]] · import
- [[graphs/index.ts]] · import
- [[stats.ts]] · import

## Private helpers
proc() (line 8) · run() (line 14) · chartOf() (line 22) · survey() (line 29)
