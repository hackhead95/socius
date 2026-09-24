---
id: "procedure:binomial"
type: procedure
file: src/procedures/core/nonparametric.ts
area: procedures
---

# Binomial

*Analysis procedure (ProcedureDef)* · defined in [[core/nonparametric.ts]] · area [[procedures]]

- **Menu:** Nonparametric Tests
- **Description:** Test whether the share of cases in one of two categories differs from a given proportion.

> Group 1 is the category of the first valid case in the file (as in SPSS). With a test proportion other than .50 the significance is one-tailed.

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| variables | Test Variable List | 1 | ∞ |  |  |

## Options
| key | type | label | group | default |
|---|---|---|---|---|
| testProp | number | Test proportion |  | 0.5 |
| dichotomy | select | Define dichotomy |  | "data" |
| cutPoint | number | Cut point |  | 0 |

## Calls
- [[core/data.ts#activeCaseMask|activeCaseMask()]]
- [[stats/nonparametric.ts#binomialTest|binomialTest()]] · stats
- [[core/data.ts#caseWeights|caseWeights()]]
- [[core/data.ts#categoryLabel|categoryLabel()]]
- [[output.ts#cell|cell()]]
- [[output.ts#hcell|hcell()]]
- [[core/types.ts#newId|newId()]]
- [[core/data.ts#requireVariable|requireVariable()]]
- [[core/data.ts#selectCases|selectCases()]]
- [[core/data.ts#varDisplayName|varDisplayName()]]

## Uses
- [[core/common.ts#apaP|apaP()]] · procedure helper
- [[core/common.ts#blank|blank()]] · procedure helper
- [[core/common.ts#caseNote|caseNote()]] · procedure helper
- [[core/common.ts#caseNoteTail|caseNoteTail()]] · procedure helper
- [[core/common.ts#categoriesOf|categoriesOf()]] · procedure helper
- [[procedures/text.ts#cleanBlocks|cleanBlocks()]] · procedure helper
- [[procedures/text.ts#countText|countText()]] · procedure helper
- [[core/common.ts#filterCounts|filterCounts()]] · procedure helper
- [[core/common.ts#filterVar|filterVar()]] · procedure helper
- [[core/common.ts#fmtCount|fmtCount()]] · procedure helper
- [[core/common.ts#fmtN|fmtN()]] · procedure helper
- [[core/common.ts#item|item()]] · procedure helper
- [[core/common.ts#optNum|optNum()]] · procedure helper
- [[core/common.ts#optStr|optStr()]] · procedure helper
- [[core/common.ts#sameValue|sameValue()]] · procedure helper
- [[core/common.ts#selMissing|selMissing()]] · procedure helper
- [[core/common.ts#selN|selN()]] · procedure helper
- [[core/common.ts#syntaxPrefix|syntaxPrefix()]] · procedure helper
- [[core/common.ts#tableBlock|tableBlock()]] · procedure helper
- [[core/common.ts#text|text()]] · procedure helper
- [[core/common.ts#valueKey|valueKey()]] · procedure helper
- [[core/common.ts#valueText|valueText()]] · procedure helper
- [[core/common.ts#vars|vars()]] · procedure helper
- [[core/common.ts#vlabel|vlabel()]] · procedure helper
- [[core/common.ts#vprose|vprose()]] · procedure helper
- [[core/common.ts#weightVar|weightVar()]] · procedure helper

## Tested by
- [[commands-smoke-analyze.spec.ts]] · procedure id
- [[dialog.test.ts]] · procedure id
- [[stats-core/procedures.test.ts]] · procedure id
- [[sample-survey.test.ts]] · procedure id

## Generates SPSS syntax
- [[NPAR TESTS]]

## Implemented by
- [[core/nonparametric.ts#binomialProc|binomialProc]]

## Configured in dialog
- [[procedure/binomial|procedure: binomial]]
