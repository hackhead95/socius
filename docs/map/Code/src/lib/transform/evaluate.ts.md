---
id: src/lib/transform/evaluate.ts
type: module
file: src/lib/transform/evaluate.ts
area: lib/transform
---

# src/lib/transform/evaluate.ts

*Module* · area [[lib - transform|lib/transform]] · 798 lines

> Compiles an expression AST into a fast per-row evaluator with SPSS missing-value semantics: - arithmetic with a missing operand gives system-missing (NaN), except 0*missing = 0 and 0/missing = 0; - user-missing values of variables count as missing (VALUE() and MISSING() see them); - statistical functions (MEAN, SUM, ...) skip missing arguments; MEAN.n requires n valid ones; - comparisons with a...

## Imports
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only
- [[expr.ts]] · value
- [[functions.ts]] · value

## Calls
- [[expr.ts#ExprError|ExprError]]
- [[core/data.ts#spssSecondsToDate|spssSecondsToDate()]]

## Uses
- [[functions.ts#FUNCTION_DOCS|FUNCTION_DOCS]]

## Imported by
- [[cases.ts]] · value
- [[compute.ts]] · value
- [[transform/index.ts]] · re-export
- [[recode.ts]] · value

## Types
ExprType (line 13) · CompiledExpr (line 19) · CompileOptions (line 149)

## Private helpers
DAY (line 29) · EPOCH_MS (line 30) · fin() (line 32) · trimR() (line 33) · levenshtein() (line 35) · closest() (line 47) · parseFormatSpec() (line 92) · STAT_FUNCS (line 146) · KNOWN (line 147) · dateDiff() (line 759)

## Symbols

### spssRound
*function* · line 62 · exported
> Round half away from zero with SPSS-style fuzz, so 2.4999999999 (from float error) rounds like 2.5.
- Calls: [[evaluate.ts]]
- Used in: [[expr.test.ts]]

### spssTrunc
*function* · line 70 · exported
- Calls: [[evaluate.ts]]

### spssDate
*function* · line 79 · exported
> Seconds since the SPSS epoch for a calendar date; NaN if the date does not exist.
- Uses: [[evaluate.ts]]
- Used in: [[expr.test.ts]]

### numberFromString
*function* · line 108 · exported
> SPSS NUMBER(s, Fw.d): implied decimals apply when the text has no decimal point.
- Calls: [[evaluate.ts]]

### stringFromNumber
*function* · line 120 · exported
> SPSS STRING(x, fmt): right-aligned in the format width; N pads with zeros; overflow gives asterisks.
- Calls: [[evaluate.ts#spssRound|spssRound()]]

### compileExpression
*function* · line 155 · exported
> Compile `src` against the dataset's dictionary. Throws ExprError (with position) on any problem.
- Calls: [[core/data.ts#dateToSpssSeconds|dateToSpssSeconds()]], [[core/data.ts#isUserMissing|isUserMissing()]], [[core/data.ts#spssSecondsToDate|spssSecondsToDate()]], [[core/data.ts#valueLabelFor|valueLabelFor()]], [[evaluate.ts#numberFromString|numberFromString()]], [[evaluate.ts#spssDate|spssDate()]], [[evaluate.ts#stringFromNumber|stringFromNumber()]], [[evaluate.ts]], [[expr.ts#ExprError|ExprError]], [[expr.ts#parse|parse()]]
- Uses: [[evaluate.ts#spssRound|spssRound()]], [[evaluate.ts#spssTrunc|spssTrunc()]], [[evaluate.ts]]
- Used in: [[cases.ts]], [[compute.ts]], [[recode.ts]], [[findings-repro.test.ts]], [[transforms-expr.fuzz.test.ts]], [[transforms-ops.fuzz.test.ts]], [[data-fixes.test.ts]], [[expr.test.ts]]

### evaluateAll
*function* · line 776 · exported
> Evaluate a compiled expression for every case into a new column.

### conditionMask
*function* · line 788 · exported
> Convenience: true where a logical expression is true (1/non-zero and not missing).
- Calls: [[evaluate.ts#compileExpression|compileExpression()]], [[expr.ts#ExprError|ExprError]]
- Used in: [[transforms-ops.fuzz.test.ts]], [[expr.test.ts]]
