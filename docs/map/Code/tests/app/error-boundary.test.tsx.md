---
id: tests/app/error-boundary.test.tsx
type: test
file: tests/app/error-boundary.test.tsx
area: tests
---

# tests/app/error-boundary.test.tsx

*Test file* · area [[tests]] · 135 lines

> @vitest-environment jsdom Error boundaries and the error log UI: a render error shows a friendly screen (not a white page) and is logged; one broken view does not take down the others; a broken dialog closes; the Error log dialog lists entries; the feedback form address carries a short summary.

## Test cases
- **error boundaries**
  - the app boundary shows "Something went wrong" with Reload and Copy error report, and logs the error
  - a broken view shows its own message; the rest of the app keeps working and Try again re-renders
  - a dialog that fails to render is closed with a message, and the next dialog opens
- **Error log dialog**
  - lists entries newest first with filters and details, and opening it clears the new-errors count
- **feedback form address**
  - uses the bug report form with the browser and the summary filled in
  - stays under the length limit
  - leaves other addresses alone and names report files by date

## Imports
- [[@testing-library-react|@testing-library/react]] · value
- [[react]] · value
- [[ErrorBoundary.tsx]] · value
- [[links.ts]] · value
- [[store.ts]] · value
- [[errorlog/actions.ts]] · value
- [[ErrorLogDialog.tsx]] · value
- [[errorlog.ts]] · value
- [[vitest]] · value

## Calls
- [[errorlog.ts#__resetErrorLogForTests|__resetErrorLogForTests()]]
- [[errorlog/actions.ts#feedbackFormUrl|feedbackFormUrl()]]
- [[errorlog.ts#getLog|getLog()]]
- [[errorlog.ts#logError|logError()]]
- [[errorlog/actions.ts#reportFileName|reportFileName()]]
- [[errorlog.ts#unseenErrorCount|unseenErrorCount()]]
- [[useStore]]

## Renders
- [[AppErrorBoundary|<AppErrorBoundary>]]
- [[ErrorLogDialog|<ErrorLogDialog>]]
- [[GuardedDialogs|<GuardedDialogs>]]
- [[PanelBoundary|<PanelBoundary>]]

## Uses
- [[links.ts#FALLBACK_FEEDBACK_URL|FALLBACK_FEEDBACK_URL]]
- [[errorlog/actions.ts#MAX_FEEDBACK_URL|MAX_FEEDBACK_URL]]
- [[useStore]]

## Reads
- [[useStore/dialog|useStore.dialog]] · getState, selector
- [[useStore/toasts|useStore.toasts]] · getState

## Writes
- [[useStore/dialog|useStore.dialog]] · setState
- [[useStore/toasts|useStore.toasts]] · setState

## Calls store actions
- [[openDialog()|useStore.openDialog()]] · getState

## Tests
- [[ErrorBoundary.tsx]] · import
- [[links.ts]] · import
- [[store.ts]] · import
- [[errorlog/actions.ts]] · import
- [[ErrorLogDialog.tsx]] · import
- [[errorlog.ts]] · import

## Private helpers
Boom() (line 15) · consoleSpy (line 19)
