---
id: "procedure:kruskal-wallis"
type: procedure
file: src/procedures/core/nonparametric.ts
area: procedures
---

# Kruskal-Wallis H (k independent samples)

*Analysis procedure (ProcedureDef)* · defined in [[core/nonparametric.ts]] · area [[procedures]]

- **Menu:** Nonparametric Tests
- **Description:** Compare three or more groups on an ordinal or skewed scale variable without assuming normality.

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| variables | Test Variable List | 1 | ∞ | numeric | ordinal, scale |
| group | Grouping Variable | 1 | 1 |  | nominal, ordinal |

## Options
| key | type | label | group | default |
|---|---|---|---|---|
| dunn | checkbox | Pairwise comparisons (Dunn's test, Bonferroni-adjusted) |  | false |

## Calls
- [[core/data.ts#activeCaseMask|activeCaseMask()]]
- [[core/data.ts#caseWeights|caseWeights()]]
- [[core/data.ts#categoryLabel|categoryLabel()]]
- [[output.ts#cell|cell()]]
- [[stats/nonparametric.ts#dunnTest|dunnTest()]] · stats
- [[output.ts#hcell|hcell()]]
- [[stats/nonparametric.ts#kruskalWallis|kruskalWallis()]] · stats
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
- [[core/common.ts#categoriesOf|categoriesOf()]] · procedure helper
- [[core/common.ts#filterCounts|filterCounts()]] · procedure helper
- [[core/common.ts#filterVar|filterVar()]] · procedure helper
- [[core/common.ts#fmtCount|fmtCount()]] · procedure helper
- [[core/common.ts#item|item()]] · procedure helper
- [[core/common.ts#labelEta2|labelEta2()]] · procedure helper
- [[core/common.ts#listProse|listProse()]] · procedure helper
- [[core/common.ts#numericValues|numericValues()]] · procedure helper
- [[core/common.ts#one|one()]] · procedure helper
- [[core/common.ts#optBool|optBool()]] · procedure helper
- [[core/common.ts#pcell|pcell()]] · procedure helper
- [[core/common.ts#requireNumeric|requireNumeric()]] · procedure helper
- [[core/common.ts#sameValue|sameValue()]] · procedure helper
- [[core/common.ts#syntaxPrefix|syntaxPrefix()]] · procedure helper
- [[core/common.ts#syntaxValue|syntaxValue()]] · procedure helper
- [[core/common.ts#tableBlock|tableBlock()]] · procedure helper
- [[core/common.ts#text|text()]] · procedure helper
- [[core/common.ts#valueKey|valueKey()]] · procedure helper
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
- [[core/nonparametric.ts#kruskalProc|kruskalProc]]

## Configured in dialog
- [[procedure/kruskal-wallis|procedure: kruskal-wallis]]
