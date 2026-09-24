---
id: tests/coding/reliability.test.ts
type: test
file: tests/coding/reliability.test.ts
area: tests
---

# tests/coding/reliability.test.ts

*Test file* · area [[tests]] · 116 lines

## Test cases
- **Cohen's kappa**
  - matches sklearn for binary ratings
  - matches sklearn for three categories
  - matches sklearn for a rare code with no joint use (negative kappa)
  - is NaN when both raters use one category throughout
  - percent agreement
- **Krippendorff's alpha (nominal)**
  - matches the krippendorff package for two coders
  - matches the krippendorff package with three coders and missing data
- **Landis & Koch bands**
  - labels
- **compareCoders**
  - uses responses as units and gives the same kappa as the raw ratings
  - splits documents into sentence units and skips documents only one coder coded
  - reports sources only one coder coded, and can include them (values from sklearn and krippendorff)

## Imports
- [[coding-types.ts]] · type-only
- [[coding/reliability.ts]] · value
- [[vitest]] · value

## Calls
- [[coding/reliability.ts#cohenKappa|cohenKappa()]]
- [[coding/reliability.ts#compareCoders|compareCoders()]]
- [[coding/reliability.ts#krippendorffAlphaNominal|krippendorffAlphaNominal()]]
- [[coding/reliability.ts#landisKoch|landisKoch()]]
- [[coding/reliability.ts#percentAgreement|percentAgreement()]]

## Tests
- [[coding-types.ts]] · import
- [[coding/reliability.ts]] · import

## Private helpers
A (line 7) · B (line 8)
