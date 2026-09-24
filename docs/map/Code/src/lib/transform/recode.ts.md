---
id: src/lib/transform/recode.ts
type: module
file: src/lib/transform/recode.ts
area: lib/transform
---

# src/lib/transform/recode.ts

*Module* · area [[lib - transform|lib/transform]] · 355 lines

> RECODE (into same / different variables) and AUTORECODE.

## Imports
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only
- [[dsops.ts]] · value
- [[evaluate.ts]] · value
- [[expr.ts]] · value
- [[syntax.ts]] · value

## Calls
- [[evaluate.ts#compileExpression|compileExpression()]]
- [[syntax.ts#sv|sv()]]

## Uses
- [[expr.ts#ExprError|ExprError]]

## Imported by
- [[derive.ts]] · value
- [[transform/index.ts]] · re-export

## Types
RecodeFrom (line 10) · RecodeTo (line 19) · RecodeRule (line 21) · RecodeSameSpec (line 142) · RecodeTarget (line 199) · RecodeDifferentSpec (line 205) · AutoRecodeSpec (line 284)

## Private helpers
fromSyntax() (line 46) · toSyntax() (line 58) · validateRules() (line 113) · conditionFn() (line 126)

## Symbols

### describeFrom
*function* · line 26 · exported
- Used in: [[DeriveDialogs.tsx]], [[RecodeDialog.tsx]]

### describeTo
*function* · line 38 · exported
- Used in: [[RecodeDialog.tsx]]

### rulesSyntax
*function* · line 62 · exported
- Calls: [[recode.ts]]
- Used in: [[transforms-ops.fuzz.test.ts]]

### matchesFrom
*function* · line 67 · exported
> Does old value x of variable v match the rule's "from" spec?
- Calls: [[core/data.ts#isUserMissing|isUserMissing()]]
- Used in: [[derive.ts]]

### recodeValue
*function* · line 92 · exported
> Recode one value. Returns `undefined` when no rule matched (caller keeps the old value for "into same", or sets missing for "into different").
- Calls: [[recode.ts#matchesFrom|matchesFrom()]]
- Used in: [[transforms.test.ts]]

### RecodeError
*class* · line 111 · exported
- Used in: [[transforms-ops.fuzz.test.ts]]

### recodeSame
*function* · line 148 · exported
- Calls: [[dsops.ts#bump|bump()]], [[dsops.ts#plural|plural()]], [[recode.ts#RecodeError|RecodeError]], [[recode.ts#recodeValue|recodeValue()]], [[recode.ts#rulesSyntax|rulesSyntax()]], [[recode.ts]], [[syntax.ts#lines|lines()]], [[syntax.ts#varList|varList()]]
- Used in: [[RecodeDialog.tsx]], [[transforms-ops.fuzz.test.ts]], [[transforms.test.ts]]

### recodeDifferent
*function* · line 216 · exported
- Calls: [[core/data.ts#validateVarName|validateVarName()]], [[dsops.ts#addVariable|addVariable()]], [[dsops.ts#newNumericVar|newNumericVar()]], [[dsops.ts#newStringVar|newStringVar()]], [[dsops.ts#suggestDecimals|suggestDecimals()]], [[recode.ts#RecodeError|RecodeError]], [[recode.ts#recodeValue|recodeValue()]], [[recode.ts#rulesSyntax|rulesSyntax()]], [[recode.ts]], [[syntax.ts#lines|lines()]], [[syntax.ts#valueLabelsSyntax|valueLabelsSyntax()]], [[syntax.ts#variableLabelSyntax|variableLabelSyntax()]]
- Used in: [[RecodeDialog.tsx]], [[transform.ts]], [[transforms-ops.fuzz.test.ts]], [[sample-oracle.test.ts]], [[transforms.test.ts]]

### autoRecode
*function* · line 289 · exported
- Calls: [[core/data.ts#isUserMissing|isUserMissing()]], [[core/data.ts#validateVarName|validateVarName()]], [[core/data.ts#valueLabelFor|valueLabelFor()]], [[dsops.ts#addVariable|addVariable()]], [[dsops.ts#newNumericVar|newNumericVar()]], [[dsops.ts#plural|plural()]], [[recode.ts#RecodeError|RecodeError]]
- Used in: [[DeriveDialogs.tsx]], [[transforms-ops.fuzz.test.ts]], [[sample-oracle.test.ts]], [[transforms.test.ts]]

### parseValueFor
*function* · line 347 · exported
> Parse a user-typed old value for a variable (number, or text for string variables).
