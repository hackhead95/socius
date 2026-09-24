---
id: src/lib/transform/expr.ts
type: module
file: src/lib/transform/expr.ts
area: lib/transform
---

# src/lib/transform/expr.ts

*Module* · area [[lib - transform|lib/transform]] · 355 lines

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
WORD_OPS (line 26) · IDENT_START (line 30) · IDENT_CHAR (line 31) · REL (line 135) · TOO_DEEP (line 151) · children() (line 333) · checkDepth() (line 341)

## Symbols

### ExprError
*class* · line 4 · exported
> SPSS COMPUTE-compatible expression language: lexer + parser producing an AST. Evaluation (with SPSS missing-value semantics) lives in evaluate.ts.
- Used in: [[cases.ts]], [[compute.ts]], [[evaluate.ts]], [[recode.ts]], [[findings-repro.test.ts]], [[transforms-expr.fuzz.test.ts]], [[transforms-ops.fuzz.test.ts]], [[data-fixes.test.ts]], [[expr.test.ts]]

### tokenize
*function* · line 33 · exported
- Calls: [[expr.ts#ExprError|ExprError]]
- Uses: [[expr.ts]]
- Used in: [[expr.test.ts]]

### EXPR_LIMITS
*const* · line 142 · exported
> Limits that keep the recursive parser, the compiler and the evaluator well inside the browser's call stack. Hand-written or generated SPSS syntax stays far below them; beyond them the user gets an ExprError that says what to do instead o...
- Used in: [[data-fixes.test.ts]]

### parse
*function* · line 154 · exported
> Parse an expression. Throws ExprError with the position of the problem.
- Calls: [[expr.ts#ExprError|ExprError]], [[expr.ts#tokenize|tokenize()]], [[expr.ts]]
- Uses: [[expr.ts#EXPR_LIMITS|EXPR_LIMITS]], [[expr.ts]]
- Used in: [[evaluate.ts]], [[expr.test.ts]]
