---
id: tests/transform/expr.test.ts
type: test
file: tests/transform/expr.test.ts
area: tests
---

# tests/transform/expr.test.ts

*Test file* · area [[tests]] · 271 lines

## Test cases
- **lexer**
  - normalises word operators and symbols
  - keeps dots inside names and function names
  - allows a trailing command period
  - reports an unclosed string with its position
- **precedence**
  - multiplication before addition, left-to-right division
  - power binds tighter than unary minus and is left associative
  - relations below arithmetic, NOT below relations, AND before OR
- **missing values**
  - arithmetic with sysmis gives sysmis
  - 0 * missing and 0 / missing are 0
  - division by zero is sysmis
  - user-missing values are treated as missing
  - comparisons with missing are missing; logic follows SPSS
  - $SYSMIS and $CASENUM
- **statistical functions**
  - MEAN skips missing and .n requires valid count
  - SUM, SD, VARIANCE, MIN, MAX, CFVAR
  - NVALID and NMISS count user-missing as missing
  - rejects impossible .n suffixes
- **arithmetic functions**
  - RND rounds half away from zero, with multiples and fuzz
  - MOD keeps the sign of the dividend
  - ANY and RANGE
- **string functions**
  - CONCAT, SUBSTR, case, LENGTH, trims
  - REPLACE and CHAR.INDEX
  - NUMBER and STRING with formats
  - string comparison ignores trailing blanks
- **date functions**
  - extracts parts
  - builds dates and handles invalid ones
  - DATEDIFF counts whole units
- **errors point at the problem**
  - unknown variable with suggestion
  - unknown function
  - type errors
  - syntax errors
- **catalogue**
  - every documented function compiles
  - conditionMask treats missing as false

## Imports
- [[transform/index.ts]] · value
- [[transform/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[evaluate.ts#compileExpression|compileExpression()]]
- [[evaluate.ts#conditionMask|conditionMask()]]
- [[transform/helpers.ts#ds|ds()]]
- [[expr.ts#parse|parse()]]
- [[evaluate.ts#spssDate|spssDate()]]
- [[evaluate.ts#spssRound|spssRound()]]
- [[expr.ts#tokenize|tokenize()]]

## Uses
- [[expr.ts#ExprError|ExprError]]
- [[functions.ts#FUNCTION_DOCS|FUNCTION_DOCS]]

## Tests
- [[transform/index.ts]] · import

## Private helpers
d (line 5) · evalAll() (line 15) · ev() (line 19)
