---
id: tests/fuzz/lib/invariants.ts
type: test-helper
file: tests/fuzz/lib/invariants.ts
area: tests
---

# tests/fuzz/lib/invariants.ts

*Test helper* · area [[tests]] · 279 lines

> Invariant checks shared by the fuzz suites. Each returns a list of problems (empty = fine).

## Imports
- [[react]] · value
- [[react-dom]] · value
- [[output.ts]] · type-only
- [[Chart.tsx]] · value
- [[exportText.ts]] · value
- [[output/format.ts]] · value

## Imported by
- [[ai-matrix.fuzz.test.ts]] · value
- [[io.fuzz.test.ts]] · value
- [[proc-harness.ts]] · value
- [[procedures.fuzz.test.ts]] · value
- [[transforms-expr.fuzz.test.ts]] · value
- [[transforms-ops.fuzz.test.ts]] · value

## Tests
- [[output.ts]] · import
- [[Chart.tsx]] · import
- [[exportText.ts]] · import
- [[output/format.ts]] · import

## Types
OutputCheckOptions (line 141)

## Private helpers
BAD_TEXT (line 27)

## Symbols

### chartProblems
*function* · line 10 · exported
> Render a chart to static SVG markup (as the Output viewer would) and look for broken values.
- Calls: [[invariants.ts#badWords|badWords()]]
- Uses: [[Components/Chart|<Chart>]]

### badWords
*function* · line 41 · exported
- Uses: [[invariants.ts]]
- Used in: [[ai-matrix.fuzz.test.ts]], [[io.fuzz.test.ts]], [[proc-harness.ts]], [[procedures.fuzz.test.ts]], [[transforms-expr.fuzz.test.ts]], [[transforms-ops.fuzz.test.ts]]

### errorProblems
*function* · line 48 · exported
> A thrown value must be an Error with a plain-English message.
- Calls: [[invariants.ts#badWords|badWords()]]
- Used in: [[io.fuzz.test.ts]], [[proc-harness.ts]], [[procedures.fuzz.test.ts]], [[transforms-expr.fuzz.test.ts]], [[transforms-ops.fuzz.test.ts]]

### jsonProblems
*function* · line 60 · exported
> Walk a value: only plain JSON (objects, arrays, strings, booleans, null, numbers). NaN only allowed at Cell.v.

### tableShapeProblems
*function* · line 101 · exported
> Row widths (with col/row spans) of header and body must all match.
- Calls: [[output/format.ts#layoutRows|layoutRows()]]

### allStrings
*function* · line 126 · exported
> Every string in the item: titles, cells, text, footnotes, chart labels, syntax, caseNote.

### tables
*function* · line 133 · exported

### hasSignificance
*function* · line 137 · exported
- Calls: [[invariants.ts#tables|tables()]]

### outputProblems
*function* · line 147 · exported
> All invariants on a produced OutputItem.
- Calls: [[exportText.ts#itemToText|itemToText()]], [[invariants.ts#allStrings|allStrings()]], [[invariants.ts#badWords|badWords()]], [[invariants.ts#chartProblems|chartProblems()]], [[invariants.ts#hasSignificance|hasSignificance()]], [[invariants.ts#jsonProblems|jsonProblems()]], [[invariants.ts#percentProblems|percentProblems()]], [[invariants.ts#tableShapeProblems|tableShapeProblems()]], [[invariants.ts#tables|tables()]]
- Used in: [[proc-harness.ts]]

### tableNumbers
*function* · line 199 · exported
> Numeric content of all tables, as a flat list (for metamorphic comparisons).
- Calls: [[invariants.ts#tables|tables()]]

### compareTables
*function* · line 209 · exported
> Compare two outputs' table cells; returns the first mismatch description or null.
- Calls: [[invariants.ts#tables|tables()]]
- Used in: [[proc-harness.ts]]

### percentProblems
*function* · line 237 · exported
> Percentages that must add up: frequency tables (Percent / Valid Percent / Cumulative) and row % in crosstabs.
- Calls: [[invariants.ts#tables|tables()]], [[output/format.ts#layoutRows|layoutRows()]]
