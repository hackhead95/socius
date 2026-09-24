---
id: tests/core/format-date.test.ts
type: test
file: tests/core/format-date.test.ts
area: tests
---

# tests/core/format-date.test.ts

*Test file* · area [[tests]] · 55 lines

> UI-030: one date/time format everywhere (Output, memo list, memo footer, reports).

## Test cases
- **shared date formatter**
  - writes "24 Sep 2026, 14:55" in British English: month as a word, 24-hour clock, no seconds
  - follows the English locale order but never the ambiguous 9/24/2026 or a 12-hour clock
  - accepts a timestamp, a Date or an ISO string and returns "" for an invalid date
  - uses the browser language only when it is English (the interface is English)
  - is the only way the app formats dates (coding, output, the shell, data, files, error log, AI)

## Imports
- [[node-fs|node:fs]] · dynamic
- [[node-path|node:path]] · dynamic
- [[format-date.ts]] · value
- [[vitest]] · value

## Calls
- [[format-date.ts#dateLocale|dateLocale()]]
- [[format-date.ts#formatDate|formatDate()]]
- [[format-date.ts#formatDateTime|formatDateTime()]]
- [[format-date.ts#formatLongDate|formatLongDate()]]
- [[format-date.ts#formatTime|formatTime()]]

## Tests
- [[format-date.ts]] · import

## Private helpers
T (line 5) · utc() (line 6)
