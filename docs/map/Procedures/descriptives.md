---
id: "procedure:descriptives"
type: procedure
file: src/procedures/core/descriptives.ts
area: procedures
---

# Descriptives

*Analysis procedure (ProcedureDef)* · defined in [[core/descriptives.ts]] · area [[procedures]]

- **Menu:** Descriptive Statistics
- **Description:** Mean, standard deviation, minimum and maximum for numeric variables, side by side.

> Use for scale variables (age, income, index scores). Each variable uses all of its valid cases; the last row shows how many cases are complete on every variable.

## Variable slots
| key | label | min | max | types | measures |
|---|---|---|---|---|---|
| variables | Variable(s) | 1 | ∞ | numeric | scale, ordinal |

## Options
| key | type | label | group | default |
|---|---|---|---|---|
| mean | checkbox | Mean | Statistics | true |
| sum | checkbox | Sum | Statistics | false |
| sd | checkbox | Std. deviation | Statistics | true |
| variance | checkbox | Variance | Statistics | false |
| range | checkbox | Range | Statistics | false |
| min | checkbox | Minimum | Statistics | true |
| max | checkbox | Maximum | Statistics | true |
| seMean | checkbox | S.E. mean | Statistics | false |
| skewness | checkbox | Skewness | Distribution | false |
| kurtosis | checkbox | Kurtosis | Distribution | false |
| order | select | Display order | Display | "variables" |

## Calls
- [[core/data.ts#activeCaseMask|activeCaseMask()]]
- [[core/data.ts#caseWeights|caseWeights()]]
- [[output.ts#cell|cell()]]
- [[output.ts#hcell|hcell()]]
- [[core/types.ts#newId|newId()]]
- [[core/data.ts#requireVariable|requireVariable()]]
- [[core/data.ts#selectCases|selectCases()]]
- [[stats/descriptives.ts#summarize|summarize()]] · stats
- [[core/data.ts#varDisplayName|varDisplayName()]]

## Uses
- [[procedures/text.ts#allFinite|allFinite()]] · procedure helper
- [[core/common.ts#apaNum|apaNum()]] · procedure helper
- [[core/common.ts#blank|blank()]] · procedure helper
- [[core/common.ts#caseNote|caseNote()]] · procedure helper
- [[core/common.ts#caseNoteRange|caseNoteRange()]] · procedure helper
- [[core/common.ts#caseNoteTail|caseNoteTail()]] · procedure helper
- [[procedures/text.ts#cleanBlocks|cleanBlocks()]] · procedure helper
- [[procedures/text.ts#countText|countText()]] · procedure helper
- [[core/common.ts#decFmt|decFmt()]] · procedure helper
- [[core/common.ts#filterCounts|filterCounts()]] · procedure helper
- [[core/common.ts#filterVar|filterVar()]] · procedure helper
- [[core/common.ts#fmtCount|fmtCount()]] · procedure helper
- [[core/common.ts#fmtN|fmtN()]] · procedure helper
- [[core/common.ts#item|item()]] · procedure helper
- [[core/common.ts#listProse|listProse()]] · procedure helper
- [[core/common.ts#numericValues|numericValues()]] · procedure helper
- [[procedures/text.ts#numText|numText()]] · procedure helper
- [[core/common.ts#optBool|optBool()]] · procedure helper
- [[core/common.ts#optStr|optStr()]] · procedure helper
- [[core/common.ts#requireNumeric|requireNumeric()]] · procedure helper
- [[core/common.ts#selMissing|selMissing()]] · procedure helper
- [[core/common.ts#selN|selN()]] · procedure helper
- [[core/common.ts#syntaxPrefix|syntaxPrefix()]] · procedure helper
- [[core/common.ts#tableBlock|tableBlock()]] · procedure helper
- [[core/common.ts#text|text()]] · procedure helper
- [[core/common.ts#vars|vars()]] · procedure helper
- [[core/common.ts#vlabel|vlabel()]] · procedure helper
- [[core/common.ts#vprose|vprose()]] · procedure helper
- [[core/common.ts#weightVar|weightVar()]] · procedure helper

## Tested by
- [[scenarios.test.ts]] · procedure id
- [[findings-repro.test.ts]] · procedure id
- [[procedures-oracle.fuzz.test.ts]] · procedure id
- [[fuzz-fixes.test.ts]] · procedure id
- [[stats-core/procedures.test.ts]] · menu label, procedure id
- [[sample-survey.test.ts]] · procedure id

## Generates SPSS syntax
- [[Syntax/DESCRIPTIVES|DESCRIPTIVES]]

## Implemented by
- [[core/descriptives.ts#descriptives|descriptives]]

## Configured in dialog
- [[procedure/descriptives|procedure: descriptives]]
