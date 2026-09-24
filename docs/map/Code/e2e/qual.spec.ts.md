---
id: e2e/qual.spec.ts
type: e2e-spec
file: e2e/qual.spec.ts
area: e2e
---

# e2e/qual.spec.ts

*End-to-end spec* · area [[e2e]] · 452 lines

> Qualitative coding end to end: open-ended answers, codebook, keyboard coding, auto-coding, export to the dataset and crosstabs, intercoder reliability, interview coding, AI help (mocked) and persistence.

## Test cases
  - open-ended answers: import, keyboard coding, filters and undo
  - worked example: one click loads answers, a starter codebook and keyword coding; one undo removes it
  - auto-coding preview, apply, undo and apply again
  - codes exported to the dataset give a sensible crosstab by gender
  - intercoder reliability reports sources only one coder coded
  - interviews: code by selecting text, overlap, memo, retrieve, merge and delete
  - themes: co-occurrence and codes by attribute count sub-codes in their theme
  - outside the artifact, AI items lead to free set-up instead of disappearing
  - AI help with a mocked Claude: suggest a codebook, suggest codes, summarise, errors
  - coding survives a reload

## Imports
- [[@playwright-test|@playwright/test]] · value
- [[e2e/helpers.ts]] · value

## Calls
- [[e2e/helpers.ts#openWithSample|openWithSample()]]

## Tests
- [[Suggest a codebook|AI > Suggest a codebook...]] · menu label
- [[Suggest codes for open-ended answers|AI > Suggest codes for open-ended answers...]] · menu label
- [[Descriptive Statistics|Analyze > Descriptive Statistics]] · menu label
- [[Descriptive Statistics/Crosstabs|Analyze > Descriptive Statistics > Crosstabs...]] · menu label
- [[Procedures/crosstabs|Crosstabs]] · menu label
- [[Undo|Edit > Undo]] · menu label
- [[Text coding/Coders|Text coding > Coders...]] · menu label
- [[Codes by attribute|Text coding > Codes by attribute]] · menu label
- [[Export codes to dataset|Text coding > Export codes to dataset...]] · menu label
- [[Import open-ended answers from dataset|Text coding > Import open-ended answers from dataset...]] · menu label
- [[Load sample interviews|Text coding > Load sample interviews...]] · menu label
- [[Memos|Text coding > Memos]] · menu label
- [[View/Text coding|View > Text coding]] · menu label

## Private helpers
ready() (line 6) · menu() (line 10) · importChallenge() (line 16) · addCodes() (line 32) · autocode() (line 39) · phraseRect() (line 49) · dragSelect() (line 79)
