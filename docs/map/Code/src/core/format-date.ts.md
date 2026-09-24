---
id: src/core/format-date.ts
type: module
file: src/core/format-date.ts
area: core
---

# src/core/format-date.ts

*Module* · area [[core]] · 92 lines

> One way to show dates and times everywhere in the app (Output, memos, exports, recent files). Locale-aware for English: the month is always a word (never "9/24" vs "24/9" ambiguity) and the clock is always 24-hour, but the order follows the reader's English locale ("24 Sep 2026, 14:55" in en-GB/en-IN/en-AU, "Sep 24, 2026, 14:55" in en-US). The interface is English, so a non-English browser loca...

## Tested by
- [[ui-fixes.test.tsx]] · import
- [[format-date.test.ts]] · import
- [[figures.test.tsx]] · import

## Imported by
- [[CommandPalette.tsx]] · value
- [[Overlays.tsx]] · value
- [[Welcome.tsx]] · value
- [[StorageManager.tsx]] · value
- [[MemosView.tsx]] · value
- [[ErrorLogDialog.tsx]] · value
- [[exportDocx.ts]] · value
- [[exportText.ts]] · value
- [[OutputViewer.tsx]] · value
- [[reportHtml.ts]] · value
- [[FileDialogs.tsx]] · value
- [[exports.ts]] · value
- [[ui-fixes.test.tsx]] · value
- [[format-date.test.ts]] · value
- [[figures.test.tsx]] · dynamic

## Types
DateInput (line 11) · DateFormatOptions (line 13)

## Private helpers
FALLBACK_LOCALE (line 20) · toDate() (line 38) · cache (line 43) · fmt() (line 44) · tidy() (line 60) · DATE (line 62) · TIME (line 63)

## Symbols

### dateLocale
*function* · line 23 · exported
> The locale used for dates: the browser's language when it is an English variant, else en-GB.
- Uses: [[format-date.ts]]
- Used in: [[format-date.test.ts]]

### formatDateTime
*function* · line 66 · exported
> "24 Sep 2026, 14:55": the standard date and time for anything the user saved or ran.
- Calls: [[format-date.ts]]
- Uses: [[format-date.ts]]
- Used in: [[Overlays.tsx]], [[MemosView.tsx]], [[ErrorLogDialog.tsx]], [[OutputViewer.tsx]], [[reportHtml.ts]], [[FileDialogs.tsx]], [[ui-fixes.test.tsx]], [[format-date.test.ts]]

### formatDate
*function* · line 73 · exported
> "24 Sep 2026": a date on its own (lists where the time would be noise).
- Calls: [[format-date.ts]]
- Uses: [[format-date.ts]]
- Used in: [[Welcome.tsx]], [[format-date.test.ts]]

### formatLongDate
*function* · line 80 · exported
> "24 September 2026": the long date used on report title pages.
- Calls: [[format-date.ts]]
- Used in: [[exportDocx.ts]], [[exportText.ts]], [[reportHtml.ts]], [[exports.ts]], [[format-date.test.ts]]

### formatTime
*function* · line 87 · exported
> "14:55": the time on its own (the Output outline, items from today).
- Calls: [[format-date.ts]]
- Uses: [[format-date.ts]]
- Used in: [[CommandPalette.tsx]], [[StorageManager.tsx]], [[ErrorLogDialog.tsx]], [[OutputViewer.tsx]], [[format-date.test.ts]]
