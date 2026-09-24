---
id: src/lib/transform/expr.ts
type: module
file: src/lib/transform/expr.ts
area: lib/transform
---

# src/lib/transform/expr.ts

*Module* · area [[lib - transform|lib/transform]] · 299 lines

> SPSS COMPUTE-compatible expression language: lexer + parser producing an AST. Evaluation (with SPSS missing-value semantics) lives in evaluate.ts.

## Imported by
- [[cases.ts]] · value
- [[compute.ts]] · value
- [[evaluate.ts]] · value
- [[transform/index.ts]] · re-export
- [[recode.ts]] · value

## Types
TokKind (line 15) · Token (line 17) · Node (line 126)

## Private helpers
WORD_OPS (line 26) · IDENT_START (line 30) · IDENT_CHAR (line 31) · REL (line 135)

## Symbols

### ExprError
*class* · line 4 · exported
> SPSS COMPUTE-compatible expression language: lexer + parser producing an AST. Evaluation (with SPSS missing-value semantics) lives in evaluate.ts.
- Used in: [[cases.ts]], [[compute.ts]], [[evaluate.ts]], [[recode.ts]], [[transforms-expr.fuzz.test.ts]], [[transforms-ops.fuzz.test.ts]], [[expr.test.ts]]

### tokenize
*function* · line 33 · exported
- Calls: [[expr.ts#ExprError|ExprError]]
- Uses: [[expr.ts]]
- Used in: [[expr.test.ts]]

### parse
*function* · line 138 · exported
> Parse an expression. Throws ExprError with the position of the problem.
- Calls: [[expr.ts#ExprError|ExprError]], [[expr.ts#tokenize|tokenize()]]
- Uses: [[expr.ts]]
- Used in: [[evaluate.ts]], [[expr.test.ts]]
