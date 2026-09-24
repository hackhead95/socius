---
id: src/procedures/core/descriptives.ts
type: module
file: src/procedures/core/descriptives.ts
area: procedures
---

# src/procedures/core/descriptives.ts

*Module* · area [[procedures]] · 459 lines

> Analyze > Descriptive Statistics > Descriptives (SPSS DESCRIPTIVES) and Explore (SPSS EXAMINE).

## Imports
- [[core/data.ts]] · value
- [[output.ts]] · type-only
- [[procedure.ts]] · type-only
- [[core/types.ts]] · type-only
- [[stats/descriptives.ts]] · value
- [[chartUtil.ts]] · value
- [[core/common.ts]] · value

## Calls
- [[core/common.ts#apaNum|apaNum()]]
- [[core/common.ts#blank|blank()]]
- [[core/common.ts#caseNote|caseNote()]]
- [[core/common.ts#caseNoteRange|caseNoteRange()]]
- [[output.ts#cell|cell()]]
- [[core/common.ts#decFmt|decFmt()]]
- [[core/common.ts#fmtN|fmtN()]]
- [[output.ts#hcell|hcell()]]
- [[core/common.ts#item|item()]]
- [[core/common.ts#listProse|listProse()]]
- [[core/common.ts#numericValues|numericValues()]]
- [[core/common.ts#optBool|optBool()]]
- [[core/common.ts#optStr|optStr()]]
- [[core/common.ts#requireNumeric|requireNumeric()]]
- [[core/data.ts#selectCases|selectCases()]]
- [[core/common.ts#selN|selN()]]
- [[stats/descriptives.ts#summarize|summarize()]]
- [[core/common.ts#tableBlock|tableBlock()]]
- [[core/common.ts#text|text()]]
- [[core/common.ts#vars|vars()]]
- [[core/common.ts#vlabel|vlabel()]]
- [[core/common.ts#vprose|vprose()]]

## Imported by
- [[core/index.ts]] · value

## Private helpers
runDescriptives() (line 43)

## Symbols

### descriptives
*const* · line 111 · exported
- Uses: [[core/descriptives.ts]]
- Used in: [[core/index.ts]]

### runExplore
*function* · line 157
- Calls: [[chartUtil.ts#histogram|histogram()]], [[core/common.ts#apaNum|apaNum()]], [[core/common.ts#apaP|apaP()]], [[core/common.ts#blank|blank()]], [[core/common.ts#caseNote|caseNote()]], [[core/common.ts#categoriesOf|categoriesOf()]], [[core/common.ts#decFmt|decFmt()]], [[core/common.ts#fmtN|fmtN()]], [[core/common.ts#item|item()]], [[core/common.ts#numericValues|numericValues()]], [[core/common.ts#optBool|optBool()]], [[core/common.ts#optNum|optNum()]], [[core/common.ts#optStr|optStr()]], [[core/common.ts#pcell|pcell()]], [[core/common.ts#requireNumeric|requireNumeric()]], [[core/common.ts#sameValue|sameValue()]], [[core/common.ts#selN|selN()]], [[core/common.ts#tableBlock|tableBlock()]], [[core/common.ts#text|text()]], [[core/common.ts#valueText|valueText()]], [[core/common.ts#vars|vars()]], [[core/common.ts#vlabel|vlabel()]], [[core/common.ts#vprose|vprose()]], [[core/data.ts#selectCases|selectCases()]], [[output.ts#cell|cell()]] … +6
- Uses: [[stats/descriptives.ts#DEFAULT_PERCENTILES|DEFAULT_PERCENTILES]]
- Output: [[Blocks/chart|chart]], [[Charts/histogram|histogram]], [[box]]

### explore
*const* · line 427 · exported
- Uses: [[core/descriptives.ts#runExplore|runExplore()]]
- Used in: [[core/index.ts]]
