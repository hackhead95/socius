---
id: "procedure:wilcoxon"
type: procedure
file: src/procedures/core/nonparametric.ts
area: procedures
---

# Wilcoxon Signed-Rank (2 related samples)

*Analysis procedure (ProcedureDef)* · defined in [[core/nonparametric.ts]] · area [[procedures]]

- **Menu:** Nonparametric Tests
- **Description:** Compare two related measurements (before and after, two ratings by the same person) without assuming normality.

> The i-th variable of the first list is paired with the i-th of the second. Differences are computed as second minus first, as in SPSS.

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| first | Variable 1 | 1 | ∞ | numeric | ordinal, scale |
| second | Variable 2 | 1 | ∞ | numeric | ordinal, scale |

## Calls
- [[core/data.ts#activeCaseMask|activeCaseMask()]]
- [[core/data.ts#caseWeights|caseWeights()]]
- [[output.ts#cell|cell()]]
- [[output.ts#hcell|hcell()]]
- [[core/types.ts#newId|newId()]]
- [[core/data.ts#requireVariable|requireVariable()]]
- [[core/data.ts#selectCases|selectCases()]]
- [[stats/nonparametric.ts#wilcoxonSignedRank|wilcoxonSignedRank()]] · stats

## Uses
- [[core/common.ts#apaNum|apaNum()]] · procedure helper
- [[core/common.ts#apaP|apaP()]] · procedure helper
- [[core/common.ts#blank|blank()]] · procedure helper
- [[core/common.ts#caseNote|caseNote()]] · procedure helper
- [[core/common.ts#caseNoteTail|caseNoteTail()]] · procedure helper
- [[core/common.ts#COHEN_NOTE|COHEN_NOTE]] · procedure helper
- [[core/common.ts#filterCounts|filterCounts()]] · procedure helper
- [[core/common.ts#filterVar|filterVar()]] · procedure helper
- [[core/common.ts#fmtCount|fmtCount()]] · procedure helper
- [[core/common.ts#fmtN|fmtN()]] · procedure helper
- [[core/common.ts#item|item()]] · procedure helper
- [[core/common.ts#labelR|labelR()]] · procedure helper
- [[core/common.ts#numericValues|numericValues()]] · procedure helper
- [[core/common.ts#pcell|pcell()]] · procedure helper
- [[core/common.ts#requireNumeric|requireNumeric()]] · procedure helper
- [[core/common.ts#selN|selN()]] · procedure helper
- [[core/common.ts#syntaxPrefix|syntaxPrefix()]] · procedure helper
- [[core/common.ts#tableBlock|tableBlock()]] · procedure helper
- [[core/common.ts#text|text()]] · procedure helper
- [[core/common.ts#vars|vars()]] · procedure helper
- [[core/common.ts#vprose|vprose()]] · procedure helper
- [[core/common.ts#weightVar|weightVar()]] · procedure helper

## Tested by
- [[procedures-oracle.fuzz.test.ts]] · procedure id
- [[stats-core/procedures.test.ts]] · procedure id
- [[sample-survey.test.ts]] · procedure id

## Generates SPSS syntax
- [[NPAR TESTS]]

## Implemented by
- [[core/nonparametric.ts#wilcoxonProc|wilcoxonProc]]

## Configured in dialog
- [[procedure/wilcoxon|procedure: wilcoxon]]
