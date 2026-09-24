---
id: src/app/ErrorBoundary.tsx
type: module
file: src/app/ErrorBoundary.tsx
area: app
---

# src/app/ErrorBoundary.tsx

*Module* · area [[Areas/app|app]] · 161 lines

> Error boundaries: a render error shows a friendly screen instead of a white page, and is written to the error log (Help > Error log). - AppErrorBoundary (main.tsx): the whole app; "Something went wrong" with Reload and Copy error report. - PanelBoundary (App.tsx): one main view; the other tabs keep working. - GuardedDialogs (App.tsx): a failing dialog closes with a message instead of taking the...

## Imports
- [[react]] · value
- [[links.ts]] · value
- [[store.ts]] · value
- [[errorlog/actions.ts]] · value
- `src/features/errorlog/errorlog.css` · side-effect
- [[errorlog.ts]] · value
- [[host.ts]] · value

## Calls
- [[errorlog.ts#componentStackText|componentStackText()]]

## Uses
- [[useStore]]

## Calls store actions
- [[toast()|useStore.toast()]] · getState

## Tested by
- [[error-boundary.test.tsx]] · import
- [[errorlog-install.test.tsx]] · import

## Imported by
- [[App.tsx]] · value
- [[main.tsx]] · value
- [[error-boundary.test.tsx]] · value
- [[errorlog-install.test.tsx]] · value

## Private helpers
componentStack() (line 16) · VIEW_NAMES (line 101) · tell() (line 127)

## Symbols

### ErrorBoundary
*class* · line 35 · exported
- Calls: [[ErrorBoundary.tsx]], [[errorlog.ts#logError|logError()]]
- Rendered by: [[errorlog-install.test.tsx]]

### CrashScreen
*component* · line 69 · exported · note: [[CrashScreen|<CrashScreen>]]
> ---------- the whole app ----------
- Calls: [[errorlog.ts#formatReport|formatReport()]], [[errorlog/actions.ts#prefilledFeedbackUrl|prefilledFeedbackUrl()]], [[host.ts#copyToClipboard|copyToClipboard()]]
- Uses: [[links.ts#FEEDBACK_URL|FEEDBACK_URL]]

### AppErrorBoundary
*component* · line 95 · exported · note: [[AppErrorBoundary|<AppErrorBoundary>]]
- Renders: [[CrashScreen|<CrashScreen>]], [[ErrorBoundary.tsx#ErrorBoundary|ErrorBoundary]]
- Rendered by: [[error-boundary.test.tsx]], [[main.tsx]]

### PanelBoundary
*component* · line 103 · exported · note: [[PanelBoundary|<PanelBoundary>]]
- Renders: [[ErrorBoundary.tsx#ErrorBoundary|ErrorBoundary]]
- Calls: [[errorlog/actions.ts#copyErrorReport|copyErrorReport()]]
- Uses: [[ErrorBoundary.tsx]], [[errorlog/actions.ts#openErrorLog|openErrorLog()]]
- Rendered by: [[Components/App|<App>]], [[error-boundary.test.tsx]]

### GuardedDialogs
*component* · line 136 · exported · note: [[GuardedDialogs|<GuardedDialogs>]]
> A dialog that fails to render is closed with a message; the next dialog opens normally.
- Renders: [[ErrorBoundary.tsx#ErrorBoundary|ErrorBoundary]]
- Calls: [[ErrorBoundary.tsx]], [[useStore]]
- Uses: [[useStore]]
- Reads: [[useStore/dialog|useStore.dialog]]
- Store actions: [[closeDialog()|useStore.closeDialog()]]
- Rendered by: [[Components/App|<App>]], [[error-boundary.test.tsx]]

### QuietBoundary
*component* · line 154 · exported · note: [[QuietBoundary|<QuietBoundary>]]
> Hide a failing extra part of the page (until reload) and say so.
- Renders: [[ErrorBoundary.tsx#ErrorBoundary|ErrorBoundary]]
- Calls: [[ErrorBoundary.tsx]]
- Rendered by: [[Components/App|<App>]]
