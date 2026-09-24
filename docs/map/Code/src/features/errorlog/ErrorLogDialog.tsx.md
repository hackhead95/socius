---
id: src/features/errorlog/ErrorLogDialog.tsx
type: module
file: src/features/errorlog/ErrorLogDialog.tsx
area: features/errorlog
---

# src/features/errorlog/ErrorLogDialog.tsx

*Module* · area [[features - errorlog|features/errorlog]] · 138 lines

> Help > Error log...: what went wrong in this browser, newest first, with filters, details, copy, download and clear. Opening it clears the "new errors" dot on the Help menu.

## Imports
- [[react]] · value
- [[errorlog/actions.ts]] · value
- `src/features/errorlog/errorlog.css` · side-effect
- [[errorlog.ts]] · value
- [[Modal.tsx]] · value

## Tested by
- [[error-boundary.test.tsx]] · import

## Imported by
- [[DialogHost.tsx]] · value
- [[error-boundary.test.tsx]] · value

## Private helpers
LEVEL_LABEL (line 9) · AREA_LABEL (line 10) · when() (line 15)

## Symbols

### EntryRow
*component* · line 25 · note: [[EntryRow|<EntryRow>]]
- Calls: [[ErrorLogDialog.tsx]], [[errorlog.ts#formatEntry|formatEntry()]]
- Uses: [[ErrorLogDialog.tsx]]

### ErrorLogDialog
*component* · line 44 · exported · note: [[ErrorLogDialog|<ErrorLogDialog>]]
- Renders: [[EntryRow|<EntryRow>]], [[Modal|<Modal>]]
- Calls: [[errorlog.ts#clearLog|clearLog()]], [[errorlog.ts#logIsMemoryOnly|logIsMemoryOnly()]], [[errorlog.ts#markLogSeen|markLogSeen()]], [[errorlog/actions.ts#copyErrorReport|copyErrorReport()]], [[errorlog/actions.ts#downloadErrorReport|downloadErrorReport()]], [[useErrorLog|useErrorLog()]]
- Uses: [[ErrorLogDialog.tsx]], [[errorlog.ts#LOG_AREAS|LOG_AREAS]], [[errorlog.ts#SESSION_ID|SESSION_ID]], [[errorlog/actions.ts#openFeedback|openFeedback()]]
- Rendered by: [[DialogHost|<DialogHost>]], [[error-boundary.test.tsx]]
