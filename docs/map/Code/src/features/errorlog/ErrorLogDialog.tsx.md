---
id: src/features/errorlog/ErrorLogDialog.tsx
type: module
file: src/features/errorlog/ErrorLogDialog.tsx
area: features/errorlog
---

# src/features/errorlog/ErrorLogDialog.tsx

*Module* · area [[features - errorlog|features/errorlog]] · 139 lines

> Help > Error log...: what went wrong in this browser, newest first, with filters, details, copy, download and clear. Opening it clears the "new errors" dot on the Help menu.

## Imports
- [[react]] · value
- [[format-date.ts]] · value
- [[errorlog/actions.ts]] · value
- `src/features/errorlog/errorlog.css` · side-effect
- [[errorlog.ts]] · value
- [[Modal.tsx]] · value

## Calls
- [[format-date.ts#formatDateTime|formatDateTime()]]
- [[format-date.ts#formatTime|formatTime()]]

## Tested by
- [[error-boundary.test.tsx]] · import

## Imported by
- [[DialogHost.tsx]] · value
- [[error-boundary.test.tsx]] · value

## Private helpers
LEVEL_LABEL (line 10) · AREA_LABEL (line 11) · when() (line 16)

## Symbols

### EntryRow
*component* · line 26 · note: [[EntryRow|<EntryRow>]]
- Calls: [[ErrorLogDialog.tsx]], [[errorlog.ts#formatEntry|formatEntry()]]
- Uses: [[ErrorLogDialog.tsx]]

### ErrorLogDialog
*component* · line 45 · exported · note: [[ErrorLogDialog|<ErrorLogDialog>]]
- Renders: [[EntryRow|<EntryRow>]], [[Modal|<Modal>]]
- Calls: [[errorlog.ts#clearLog|clearLog()]], [[errorlog.ts#logIsMemoryOnly|logIsMemoryOnly()]], [[errorlog.ts#markLogSeen|markLogSeen()]], [[errorlog/actions.ts#copyErrorReport|copyErrorReport()]], [[errorlog/actions.ts#downloadErrorReport|downloadErrorReport()]], [[useErrorLog|useErrorLog()]]
- Uses: [[ErrorLogDialog.tsx]], [[errorlog.ts#LOG_AREAS|LOG_AREAS]], [[errorlog.ts#SESSION_ID|SESSION_ID]], [[errorlog/actions.ts#openFeedback|openFeedback()]]
- Rendered by: [[DialogHost|<DialogHost>]], [[error-boundary.test.tsx]]
