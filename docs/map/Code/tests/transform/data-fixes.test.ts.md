---
id: tests/transform/data-fixes.test.ts
type: test
file: tests/transform/data-fixes.test.ts
area: tests
---

# tests/transform/data-fixes.test.ts

*Test file* · area [[tests]] · 320 lines

> Focused tests for the data-management fuzz findings (docs/qa/FUZZ-FINDINGS.md: FZ-01, 02, 05, 12, 13, 19), the audits that went with them (argument spreads over data-sized lists, duplicate variable names), Copy variable properties as a logged transform, and undo labels.

## Test cases
- **FZ-01: no argument spreads over data-sized lists**
  - Aggregate MIN/MAX over a group of 200,000 cases (one group, and with a break variable)
  - minOf / maxOf take any number of values
  - pasting 200,000 cells works (writeTexts)
  - Define properties hints over 200,000 distinct observed values
- **FZ-02 / FZ-13: Visual binning**
  - a first cutpoint at or above the largest value gives a clear BinError, never a TypeError
  - binLabels never reads a missing cutpoint
  - labels use "to" for every range, so negative numbers are unambiguous
  - cutpoints that lie very close together still get different labels
- **FZ-05: new variables never duplicate a name**
  - Select Cases uses the next free filter name and writes it in the syntax
  - Merge files: add variables renames names in the second file that differ only in capitals
  - pasted headings never repeat the name of a variable further right
- **FZ-12: very long or deeply nested expressions**
  - too many nested parentheses, calls or signs give an ExprError that says what to do
  - too long a chain of operators gives an ExprError suggesting SUM(a TO b)
  - expressions up to the limits still work
- **FZ-19: Aggregate functions for string variables**
  - the message for an unsupported function lists only functions that work
  - MIN, MAX, FIRST, LAST, N and NMISS of a string variable per group (weighted, like SPSS)
- **Copy variable properties (a logged transform)**
  - copies the chosen properties and writes the SPSS syntax
  - nothing to change gives the same dataset
- **undo labels**
  - applyTransform names the step, logs it to Output and Edit > Undo / Redo read the name
  - every transform and data dialog passes a label for Edit > Undo

## Imports
- [[node-fs|node:fs]] · value
- [[node-path|node:path]] · value
- [[undo.ts]] · value
- [[store.ts]] · value
- [[core/types.ts]] · value
- [[mutations.ts]] · value
- [[transform/common.tsx]] · value
- [[transform/index.ts]] · value
- [[properties.ts]] · value
- [[transform/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[merge.ts#addVariables|addVariables()]]
- [[aggregate.ts#aggregate|aggregate()]]
- [[transform/common.tsx#applyTransform|applyTransform()]]
- [[binning.ts#binLabels|binLabels()]]
- [[transform/helpers.ts#col|col()]]
- [[evaluate.ts#compileExpression|compileExpression()]]
- [[binning.ts#computeCutpoints|computeCutpoints()]]
- [[properties.ts#copyPropertiesTransform|copyPropertiesTransform()]]
- [[transform/helpers.ts#ds|ds()]]
- [[core/types.ts#makeDataset|makeDataset()]]
- [[core/types.ts#makeVariable|makeVariable()]]
- [[dsops.ts#maxOf|maxOf()]]
- [[dsops.ts#minOf|minOf()]]
- [[properties.ts#missingCodeHints|missingCodeHints()]]
- [[mutations.ts#nameVariablesFromHeader|nameVariablesFromHeader()]]
- [[binning.ts#previewBins|previewBins()]]
- [[undo.ts#redoStep|redoStep()]]
- [[cases.ts#selectCasesTransform|selectCasesTransform()]]
- [[undo.ts#undoStep|undoStep()]]
- [[transform/helpers.ts#vid|vid()]]
- [[binning.ts#visualBin|visualBin()]]
- [[mutations.ts#writeTexts|writeTexts()]]

## Uses
- [[aggregate.ts#AGG_FUNCTIONS|AGG_FUNCTIONS]]
- [[aggregate.ts#AggregateError|AggregateError]]
- [[binning.ts#BinError|BinError]]
- [[expr.ts#EXPR_LIMITS|EXPR_LIMITS]]
- [[expr.ts#ExprError|ExprError]]
- [[aggregate.ts#STRING_AGG_FUNCTIONS|STRING_AGG_FUNCTIONS]]
- [[useStore]]

## Reads
- [[outputs|useStore.outputs]] · getState

## Writes
- [[dataset|useStore.dataset]] · setState
- [[useStore/future|useStore.future]] · setState
- [[outputs|useStore.outputs]] · setState
- [[past|useStore.past]] · setState
- [[useStore/tab|useStore.tab]] · setState

## Calls store actions
- [[setDataset()|useStore.setDataset()]] · getState
- [[undo()|useStore.undo()]] · getState

## Tests
- [[Select cases|Data > Select cases...]] · menu label
- [[undo.ts]] · import
- [[store.ts]] · import
- [[core/types.ts]] · import
- [[mutations.ts]] · import
- [[transform/common.tsx]] · import
- [[transform/index.ts]] · import
- [[properties.ts]] · import

## Private helpers
names() (line 19) · unique() (line 20)
