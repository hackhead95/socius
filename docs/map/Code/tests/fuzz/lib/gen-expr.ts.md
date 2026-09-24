---
id: tests/fuzz/lib/gen-expr.ts
type: test-helper
file: tests/fuzz/lib/gen-expr.ts
area: tests
---

# tests/fuzz/lib/gen-expr.ts

*Test helper* · area [[tests]] · 406 lines

> Grammar-based generator for SPSS COMPUTE expressions, a renderer (minimal or full parentheses) and an independent reference evaluator with SPSS missing-value semantics: arithmetic with a missing operand -> missing, except 0*missing = 0, 0/missing = 0, MOD(0, missing) = 0; user-missing values of variables are missing (VALUE() sees the stored value; MISSING() both; SYSMIS() only sysmis); MEAN/SUM...

## Imports
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only
- [[rng.ts]] · type-only

## Calls
- [[core/data.ts#isUserMissing|isUserMissing()]]
- [[core/data.ts#valueLabelFor|valueLabelFor()]]

## Imported by
- [[transforms-expr.fuzz.test.ts]] · value
- [[transforms-ops.fuzz.test.ts]] · value

## Tests
- [[core/data.ts]] · import
- [[core/types.ts]] · import

## Types
X (line 12) · ExprGen (line 29)

## Private helpers
NUM_LITS (line 26) · STR_LITS (line 27) · PREC (line 123) · prec() (line 125) · numText() (line 133) · strText() (line 139) · fin() (line 188) · trimR() (line 189) · round() (line 191) · refCall() (line 275)

## Symbols

### exprGenerator
*function* · line 34 · exported
- Uses: [[gen-expr.ts]]
- Used in: [[transforms-expr.fuzz.test.ts]], [[transforms-ops.fuzz.test.ts]]

### render
*function* · line 145 · exported
> Render to source. `full` wraps every sub-expression in parentheses.
- Calls: [[gen-expr.ts]]
- Uses: [[gen-expr.ts]]
- Used in: [[transforms-expr.fuzz.test.ts]], [[transforms-ops.fuzz.test.ts]]

### UNKNOWN
*const* · line 185 · exported
> ---------- reference evaluation ----------
- Used in: [[transforms-expr.fuzz.test.ts]]

### refEval
*function* · line 199 · exported
- Calls: [[core/data.ts#isUserMissing|isUserMissing()]], [[gen-expr.ts]]
- Uses: [[gen-expr.ts#UNKNOWN|UNKNOWN]]
- Used in: [[transforms-expr.fuzz.test.ts]]

### tokenSoup
*function* · line 395 · exported
> Random token soup for parser robustness (may or may not be valid).
- Used in: [[transforms-expr.fuzz.test.ts]]
