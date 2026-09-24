---
id: "procedure:friedman"
type: procedure
file: src/procedures/core/nonparametric.ts
area: procedures
---

# Friedman (k related samples)

*Analysis procedure (ProcedureDef)* · defined in [[core/nonparametric.ts]] · area [[procedures]]

- **Menu:** Nonparametric Tests
- **Description:** Compare three or more related measurements (e.g. ratings of several institutions by the same respondents), with Kendall's W.

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| variables | Test Variables | 2 | ∞ | numeric | ordinal, scale |

## Calls
- [[core/data.ts#activeCaseMask|activeCaseMask()]]
- [[core/data.ts#caseWeights|caseWeights()]]
- [[output.ts#cell|cell()]]
- [[stats/nonparametric.ts#friedman|friedman()]] · stats
- [[output.ts#hcell|hcell()]]
- [[core/types.ts#newId|newId()]]
- [[core/data.ts#requireVariable|requireVariable()]]
- [[core/data.ts#selectCases|selectCases()]]
- [[core/data.ts#varDisplayName|varDisplayName()]]

## Uses
- [[core/common.ts#apaNum|apaNum()]] · procedure helper
- [[core/common.ts#apaP|apaP()]] · procedure helper
- [[core/common.ts#caseNote|caseNote()]] · procedure helper
- [[core/common.ts#caseNoteTail|caseNoteTail()]] · procedure helper
- [[core/common.ts#filterCounts|filterCounts()]] · procedure helper
- [[core/common.ts#filterVar|filterVar()]] · procedure helper
- [[core/common.ts#fmtCount|fmtCount()]] · procedure helper
- [[core/common.ts#fmtN|fmtN()]] · procedure helper
- [[core/common.ts#item|item()]] · procedure helper
- [[core/common.ts#labelR|labelR()]] · procedure helper
- [[core/common.ts#labelW|labelW()]] · procedure helper
- [[core/common.ts#listProse|listProse()]] · procedure helper
- [[core/common.ts#numericValues|numericValues()]] · procedure helper
- [[core/common.ts#pcell|pcell()]] · procedure helper
- [[core/common.ts#requireNumeric|requireNumeric()]] · procedure helper
- [[core/common.ts#selN|selN()]] · procedure helper
- [[core/common.ts#syntaxPrefix|syntaxPrefix()]] · procedure helper
- [[core/common.ts#tableBlock|tableBlock()]] · procedure helper
- [[core/common.ts#text|text()]] · procedure helper
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
- [[core/nonparametric.ts#friedmanProc|friedmanProc]]

## Configured in dialog
- [[procedure/friedman|procedure: friedman]]
