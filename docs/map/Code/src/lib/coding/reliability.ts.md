---
id: src/lib/coding/reliability.ts
type: module
file: src/lib/coding/reliability.ts
area: lib/coding
---

# src/lib/coding/reliability.ts

*Module* · area [[lib - coding|lib/coding]] · 230 lines

> Intercoder reliability: Cohen's kappa, percent agreement and Krippendorff's alpha (nominal). Units of analysis: - Survey responses (kind 'response'): one unit per response. A response counts as coded with a code by a coder when that coder has any segment of the code in it. - Documents: one unit per sentence (see splitSentences). A sentence counts as coded with a code by a coder when one of that...

## Imports
- [[coding-types.ts]] · type-only
- [[segments.ts]] · type-only
- [[coding/text.ts]] · value

## Tested by
- [[outputs.test.ts]] · import
- [[reliability.test.ts]] · import

## Imported by
- [[ReliabilityView.tsx]] · value
- [[outputs.ts]] · type-only, value
- [[outputs.test.ts]] · value
- [[reliability.test.ts]] · value

## Types
ReliabilityUnit (line 94) · CodeAgreement (line 100) · Disagreement (line 111) · ReliabilityResult (line 118) · CompareOptions (line 139)

## Private helpers
overlaps() (line 144)

## Symbols

### cohenKappa
*function* · line 18 · exported
> Cohen's kappa for two raters over the same units (any nominal categories). NaN when undefined.
- Used in: [[reliability.test.ts]]

### percentAgreement
*function* · line 37 · exported
- Used in: [[reliability.test.ts]]

### krippendorffAlphaNominal
*function* · line 48 · exported
> Krippendorff's alpha for nominal data. `data[coder][unit]`, null = missing. Units with fewer than two ratings are not pairable and are ignored. NaN when there is no variation at all.
- Used in: [[reliability.test.ts]]

### landisKoch
*function* · line 84 · exported
> Landis & Koch (1977) verbal bands for kappa (a rule of thumb, not a test).
- Used in: [[ReliabilityView.tsx]], [[outputs.ts]], [[reliability.test.ts]]

### compareCoders
*function* · line 149 · exported
> Compare two coders over the documents both have coded. `codeIds` = codes to compare.
- Calls: [[coding/reliability.ts#cohenKappa|cohenKappa()]], [[coding/reliability.ts#krippendorffAlphaNominal|krippendorffAlphaNominal()]], [[coding/reliability.ts#percentAgreement|percentAgreement()]], [[coding/reliability.ts]], [[coding/text.ts#splitSentences|splitSentences()]]
- Used in: [[ReliabilityView.tsx]], [[outputs.test.ts]], [[reliability.test.ts]]
