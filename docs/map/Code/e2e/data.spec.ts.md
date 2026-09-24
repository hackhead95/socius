---
id: e2e/data.spec.ts
type: e2e-spec
file: e2e/data.spec.ts
area: e2e
---

# e2e/data.spec.ts

*End-to-end spec* · area [[e2e]] · 260 lines

> Data management end to end: opening messy real-world files, Data View editing, transforms, round trips, session restore, the Artifact sandbox and small screens.

## Test cases
  - unsupported files get a friendly message instead of opening as garbage
  - messy CSV: NA words become missing and comma numbers are explained
  - CSV import preview: Keep as text keeps a column exactly as written (FZ-18)
  - opens a .sav inside a zip (how the Artifact viewer saves SPSS files)
  - an SPSS file without an encoding record can be re-read with another encoding
  - typing long text widens a string variable instead of cutting it
  - pasting from Excel reports cells that did not fit
  - compute takes its type from the formula; alpha is logged with the scale
  - turning the filter or weight off from the chip is logged with its syntax
  - Excel round trip keeps the dictionary; the labelled export has its own file name
  - a restored session with unsaved edits still asks before it is replaced
  - inside a sandboxed Artifact iframe, files go through downloads.save and .sav is zipped
  - phone width: menu sheet keeps focus inside and no screen or dialog scrolls sideways

## Imports
- [[@playwright-test|@playwright/test]] · value
- [[e2e/helpers.ts]] · value
- [[fflate]] · value
- [[node-fs|node:fs]] · value
- [[sav-builder.ts]] · value

## Calls
- [[sav-builder.ts#buildSav|buildSav()]]
- [[e2e/helpers.ts#loadSampleFromWelcome|loadSampleFromWelcome()]]
- [[e2e/helpers.ts#openWithSample|openWithSample()]]
- [[sav-builder.ts#valueLabels|valueLabels()]]

## Tests
- [[Turn weighting off|Data > Turn weighting off]] · menu label
- [[Weight cases|Data > Weight cases...]] · menu label
- [[Save data as|File > Save data as]] · menu label
- [[CSV with codes|File > Save data as > CSV with codes]] · menu label
- [[Excel with codes|File > Save data as > Excel with codes]] · menu label
- [[Excel with value labels|File > Save data as > Excel with value labels]] · menu label
- [[SPSS data (.sav)|File > Save data as > SPSS data (.sav)]] · menu label
- [[Compute variable|Transform > Compute variable...]] · menu label
- [[Create scale - index|Transform > Create scale / index...]] · menu label
- [[Recode into different variables|Transform > Recode into different variables...]] · menu label
- [[Visual binning|Transform > Visual binning...]] · menu label
- [[Data View|View > Data View]] · menu label
- [[Output|View > Output]] · menu label
- [[View/Text coding|View > Text coding]] · menu label
- [[Variable View|View > Variable View]] · menu label

## Private helpers
FIX (line 9) · ready() (line 11) · menu() (line 15) · drop() (line 21) · toasts() (line 33)
