---
id: "procedure:partial-correlations"
type: procedure
file: src/procedures/core/correlations.ts
area: procedures
---

# Partial Correlations

*Analysis procedure (ProcedureDef)* · defined in [[correlations.ts]] · area [[procedures]]

- **Menu:** Correlate
- **Description:** Correlate two or more variables while holding one or more control variables constant (is the association spurious?).

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| variables | Variables | 2 | ∞ | numeric | scale, ordinal |
| controls | Controlling for | 1 | ∞ | numeric |  |

## Options
| key | type | label | group | default |
|---|---|---|---|---|
| tails | select | Test of significance |  | "two" |
| zeroOrder | checkbox | Zero-order correlations |  | false |

## Calls
- [[core/data.ts#activeCaseMask|activeCaseMask()]]
- [[core/data.ts#caseWeights|caseWeights()]]
- [[output.ts#cell|cell()]]
- [[output.ts#hcell|hcell()]]
- [[core/types.ts#newId|newId()]]
- [[correlation.ts#partialCorrelations|partialCorrelations()]] · stats
- [[core/data.ts#requireVariable|requireVariable()]]
- [[core/data.ts#selectCases|selectCases()]]
- [[core/data.ts#varDisplayName|varDisplayName()]]

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
- [[core/common.ts#listProse|listProse()]] · procedure helper
- [[core/common.ts#numericValues|numericValues()]] · procedure helper
- [[core/common.ts#optBool|optBool()]] · procedure helper
- [[core/common.ts#optStr|optStr()]] · procedure helper
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
- [[stats-core/procedures.test.ts]] · procedure id
- [[sample-survey.test.ts]] · procedure id

## Generates SPSS syntax
- [[PARTIAL CORR]]

## Implemented by
- [[correlations.ts#partialCorrelationsProc|partialCorrelationsProc]]

## Configured in dialog
- [[procedure/partial-correlations|procedure: partial-correlations]]
