---
id: "procedure:mann-whitney"
type: procedure
file: src/procedures/core/nonparametric.ts
area: procedures
---

# Mann-Whitney U (2 independent samples)

*Analysis procedure (ProcedureDef)* · defined in [[core/nonparametric.ts]] · area [[procedures]]

- **Menu:** Nonparametric Tests
- **Description:** Compare two groups on an ordinal or skewed scale variable without assuming normal distributions.

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| variables | Test Variable List | 1 | ∞ | numeric | ordinal, scale |
| group | Grouping Variable | 1 | 1 |  |  |

## Options
| key | type | label | group | default |
|---|---|---|---|---|
| groups | groupPair | Groups |  |  |

## Calls
- [[core/data.ts#activeCaseMask|activeCaseMask()]]
- [[core/data.ts#caseWeights|caseWeights()]]
- [[core/data.ts#categoryLabel|categoryLabel()]]
- [[output.ts#cell|cell()]]
- [[output.ts#hcell|hcell()]]
- [[stats/nonparametric.ts#mannWhitney|mannWhitney()]] · stats
- [[core/types.ts#newId|newId()]]
- [[core/data.ts#requireVariable|requireVariable()]]
- [[core/data.ts#selectCases|selectCases()]]
- [[core/data.ts#varDisplayName|varDisplayName()]]

## Uses
- [[core/common.ts#apaNum|apaNum()]] · procedure helper
- [[core/common.ts#apaP|apaP()]] · procedure helper
- [[core/common.ts#blank|blank()]] · procedure helper
- [[core/common.ts#caseNote|caseNote()]] · procedure helper
- [[core/common.ts#caseNoteTail|caseNoteTail()]] · procedure helper
- [[procedures/text.ts#cleanBlocks|cleanBlocks()]] · procedure helper
- [[core/common.ts#coerceValue|coerceValue()]] · procedure helper
- [[core/common.ts#COHEN_NOTE|COHEN_NOTE]] · procedure helper
- [[procedures/text.ts#countText|countText()]] · procedure helper
- [[core/common.ts#filterCounts|filterCounts()]] · procedure helper
- [[core/common.ts#filterVar|filterVar()]] · procedure helper
- [[core/common.ts#fmtCount|fmtCount()]] · procedure helper
- [[core/common.ts#item|item()]] · procedure helper
- [[core/common.ts#labelR|labelR()]] · procedure helper
- [[core/common.ts#numericValues|numericValues()]] · procedure helper
- [[procedures/text.ts#numText|numText()]] · procedure helper
- [[core/common.ts#one|one()]] · procedure helper
- [[core/common.ts#pcell|pcell()]] · procedure helper
- [[core/common.ts#requireNumeric|requireNumeric()]] · procedure helper
- [[core/common.ts#sameValue|sameValue()]] · procedure helper
- [[core/common.ts#selMissing|selMissing()]] · procedure helper
- [[core/common.ts#syntaxPrefix|syntaxPrefix()]] · procedure helper
- [[core/common.ts#syntaxValue|syntaxValue()]] · procedure helper
- [[core/common.ts#tableBlock|tableBlock()]] · procedure helper
- [[core/common.ts#text|text()]] · procedure helper
- [[core/common.ts#twoGroups|twoGroups()]] · procedure helper
- [[core/common.ts#valueText|valueText()]] · procedure helper
- [[core/common.ts#vars|vars()]] · procedure helper
- [[core/common.ts#vlabel|vlabel()]] · procedure helper
- [[core/common.ts#vprose|vprose()]] · procedure helper
- [[core/common.ts#weightVar|weightVar()]] · procedure helper

## Tested by
- [[procedures-oracle.fuzz.test.ts]] · procedure id
- [[stats-core/procedures.test.ts]] · procedure id
- [[sample-survey.test.ts]] · procedure id

## Generates SPSS syntax
- [[NPAR TESTS]]

## Implemented by
- [[core/nonparametric.ts#mannWhitneyProc|mannWhitneyProc]]

## Configured in dialog
- [[procedure/mann-whitney|procedure: mann-whitney]]
