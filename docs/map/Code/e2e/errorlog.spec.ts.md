---
id: e2e/errorlog.spec.ts
type: e2e-spec
file: e2e/errorlog.spec.ts
area: e2e
---

# e2e/errorlog.spec.ts

*End-to-end spec* · area [[e2e]] · 178 lines

> Error log: problems are logged without data values, file names or keys; Help > Error log lists them; Copy report works; the feedback dialog prefills the GitHub form with a short summary. (The error screens for render errors are tested with a React render in tests/app/error-boundary.test.tsx: there is no way to force a render error in the production build.)

## Test cases
  - failed file open and an AI 500 are logged without data, file names or keys; Copy report works
  - Send feedback offers the error report and prefills the form; Search finds the error log
  - a code file missing after an update shows "Socius was updated" with Reload, not a broken feature

## Imports
- [[@playwright-test|@playwright/test]] · value
- [[e2e/helpers.ts]] · value

## Calls
- [[e2e/helpers.ts#openWithSample|openWithSample()]]

## Tests
- [[AI assistant settings|AI > AI assistant settings...]] · menu label
- [[Descriptive Statistics|Analyze > Descriptive Statistics]] · menu label
- [[Descriptive Statistics/Frequencies|Analyze > Descriptive Statistics > Frequencies...]] · menu label
- [[Export output report|File > Export output report]] · menu label
- [[Word document (.docx)|File > Export output report > Word document (.docx)]] · menu label
- [[Procedures/frequencies|Frequencies]] · menu label
- [[Error log|Help > Error log...]] · menu label
- [[Send feedback or report a problem|Help > Send feedback or report a problem]] · menu label
- [[socius.ai]] · storage key
- [[socius.errorlog]] · storage key

## Private helpers
KEY (line 8) · GEMINI (line 9) · helpDot() (line 12) · storedErrors() (line 17) · openErrorLog() (line 27)
