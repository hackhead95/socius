---
id: src/procedures/text.ts
type: module
file: src/procedures/text.ts
area: procedures
---

# src/procedures/text.ts

*Module* · area [[procedures]] · 91 lines

> Shared, safe building blocks for the words procedures write (interpretations, APA sentences, notes) and for the confidence-level option. Every number that goes into prose passes through `numText`, so negative zero never appears ("-0.00" becomes "0.00"); prose builders check `allFinite` before writing a statistic and explain in plain words when it cannot be computed, instead of printing NaN, Inf...

## Imports
- [[core/data.ts]] · value
- [[output.ts]] · type-only
- [[procedure.ts]] · type-only
- [[core/types.ts]] · type-only

## Tested by
- [[fuzz-fixes.test.ts]] · import

## Imported by
- [[core/common.ts]] · re-export, value
- [[core/descriptives.ts]] · value
- [[oneway.ts]] · value
- [[ttests.ts]] · value
- [[graphs/index.ts]] · value
- [[binary.ts]] · value
- [[models/common.ts]] · value
- [[linear.ts]] · value
- [[nomreg.ts]] · value
- [[plum.ts]] · value
- [[fuzz-fixes.test.ts]] · value

## Symbols

### allFinite
*function* · line 14 · exported
> True when every value is a finite number (write the statistic into prose only then).
- Used in: [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[oneway.ts]], [[ttests.ts]], [[graphs/index.ts]], [[fuzz-fixes.test.ts]]

### numText
*function* · line 24 · exported
> Fixed-decimal text for prose: thousands separators from 1,000, no negative zero, and (for bounded statistics such as r, alpha or p) no leading zero. Non-finite values give "." (the SPSS blank); prose should not reach that branch (check `...
- Used in: [[core/common.ts]], [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]], [[graphs/index.ts]], [[binary.ts]], [[models/common.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]], [[fuzz-fixes.test.ts]]

### countText
*function* · line 36 · exported
> A (possibly weighted) number of cases for prose: whole numbers with separators, otherwise one decimal, and two significant digits when that would read "0" (tiny fractional weights).
- Used in: [[core/common.ts]], [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]], [[graphs/index.ts]], [[fuzz-fixes.test.ts]]

### cleanBlocks
*function* · line 44 · exported
> Drop empty text blocks and headings: an interpretation that has nothing to say is left out.
- Output: [[heading]], [[text]]
- Used in: [[core/common.ts]], [[correlations.ts]], [[core/crosstabs.ts]], [[core/descriptives.ts]], [[core/frequencies.ts]], [[core/nonparametric.ts]], [[oneway.ts]], [[ttests.ts]], [[graphs/index.ts]], [[binary.ts]], [[models/common.ts]], [[models/factor.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[models/reliability.ts]], [[fuzz-fixes.test.ts]]

### labelOf
*function* · line 49 · exported
> Label of a category for tables and prose; a blank string answer reads "(blank)", never "".
- Calls: [[core/data.ts#categoryLabel|categoryLabel()]], [[procedures/text.ts#nonEmpty|nonEmpty()]]
- Used in: [[graphs/index.ts]], [[binary.ts]], [[models/common.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### nonEmpty
*function* · line 54 · exported
> A name for prose that is never empty (a blank string category reads "(blank)").
- Used in: [[graphs/index.ts]], [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### CI_MIN
*const* · line 62 · exported
> --------------------------------------------------------------------------------------------- Confidence level (%): one rule for the dialog and for run(), as SPSS (CILEVEL / CIN 1 to 99.99) -----------------------------------------------...
- Used in: [[core/descriptives.ts]], [[oneway.ts]], [[ttests.ts]], [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[fuzz-fixes.test.ts]]

### CI_MAX
*const* · line 63 · exported
- Used in: [[core/descriptives.ts]], [[oneway.ts]], [[ttests.ts]], [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[fuzz-fixes.test.ts]]

### ciOption
*function* · line 66 · exported
> The confidence-level option: the dialog validates against the same min and max that run() uses.
- Uses: [[procedures/text.ts#CI_MAX|CI_MAX]], [[procedures/text.ts#CI_MIN|CI_MIN]]
- Used in: [[core/descriptives.ts]], [[oneway.ts]], [[ttests.ts]], [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### rangeMessage
*function* · line 71 · exported
> The dialog's own message for a number outside its range (see features/analysis/varUtils validate).
- Used in: [[core/descriptives.ts]], [[oneway.ts]], [[ttests.ts]], [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]]

### confLevel
*function* · line 79 · exported
> The confidence level as a fraction (0.95). Missing or non-numeric values fall back to the default; a value outside 1 to 99.99 is refused with exactly the message the dialog shows.
- Calls: [[procedures/text.ts#rangeMessage|rangeMessage()]]
- Uses: [[procedures/text.ts#CI_MAX|CI_MAX]], [[procedures/text.ts#CI_MIN|CI_MIN]]
- Used in: [[core/descriptives.ts]], [[oneway.ts]], [[ttests.ts]], [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[fuzz-fixes.test.ts]]

### levelText
*function* · line 88 · exported
> "95", "99.9", "99.99": the level as it should read in a heading or sentence.
- Used in: [[core/descriptives.ts]], [[oneway.ts]], [[ttests.ts]], [[binary.ts]], [[linear.ts]], [[nomreg.ts]], [[plum.ts]], [[fuzz-fixes.test.ts]]
