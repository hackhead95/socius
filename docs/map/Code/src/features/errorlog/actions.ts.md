---
id: src/features/errorlog/actions.ts
type: module
file: src/features/errorlog/actions.ts
area: features/errorlog
---

# src/features/errorlog/actions.ts

*Module* · area [[features - errorlog|features/errorlog]] · 87 lines

> Error log and feedback actions shared by the Help menu, the top bar, About and the error screens.

## Imports
- [[react]] · value
- [[store.ts]] · value
- [[errorlog.ts]] · value
- [[host.ts]] · value

## Calls
- [[errorlog.ts#getLog|getLog()]]
- [[errorlog.ts#subscribe|subscribe()]]
- [[errorlog.ts#unseenErrorCount|unseenErrorCount()]]

## Tested by
- [[error-boundary.test.tsx]] · import

## Imported by
- [[ErrorBoundary.tsx]] · value
- [[HelpDialogs.tsx]] · value
- [[MenuBar.tsx]] · value
- [[menus.ts]] · value
- [[TopBar.tsx]] · value
- [[ErrorLogDialog.tsx]] · value
- [[FeedbackDialog.tsx]] · value
- [[error-boundary.test.tsx]] · value

## Private helpers
snapshot (line 15) · unseen (line 16)

## Symbols

### openErrorLog
*function* · line 7 · exported
- Uses: [[useStore]]
- Store actions: [[openDialog()|useStore.openDialog()]]
- Opens: [[error-log|custom: error-log]]
- Used in: [[ErrorBoundary.tsx]], [[HelpDialogs.tsx]], [[menus.ts]], [[FeedbackDialog.tsx]]

### openFeedback
*function* · line 11 · exported
- Uses: [[useStore]]
- Store actions: [[openDialog()|useStore.openDialog()]]
- Opens: [[feedback|custom: feedback]]
- Used in: [[HelpDialogs.tsx]], [[TopBar.tsx]], [[menus.ts]], [[ErrorLogDialog.tsx]]

### useErrorLog
*hook* · line 23 · exported · note: [[useErrorLog|useErrorLog()]]
> The log, newest first; re-renders when it changes.
- Uses: [[errorlog.ts#subscribe|subscribe()]], [[errorlog/actions.ts]]
- Used in: [[ErrorLogDialog.tsx]], [[FeedbackDialog.tsx]]

### useUnseenErrors
*hook* · line 28 · exported · note: [[useUnseenErrors|useUnseenErrors()]]
> Errors logged this session that the user has not looked at yet (the Help menu dot).
- Uses: [[errorlog.ts#subscribe|subscribe()]], [[errorlog/actions.ts]]
- Used in: [[MenuBar.tsx]], [[menus.ts]]

### copyErrorReport
*function* · line 33 · exported
> Copy the whole report. Resolves true when the clipboard accepted it.
- Calls: [[errorlog.ts#formatReport|formatReport()]], [[host.ts#copyToClipboard|copyToClipboard()]]
- Uses: [[useStore]]
- Store actions: [[toast()|useStore.toast()]]
- Used in: [[ErrorBoundary.tsx]], [[ErrorLogDialog.tsx]], [[FeedbackDialog.tsx]]

### reportFileName
*function* · line 48 · exported
- Used in: [[error-boundary.test.tsx]]

### downloadErrorReport
*function* · line 53 · exported
- Calls: [[errorlog.ts#formatReport|formatReport()]], [[errorlog/actions.ts#reportFileName|reportFileName()]], [[host.ts#saveFile|saveFile()]]
- Uses: [[useStore]]
- Store actions: [[toast()|useStore.toast()]]
- Used in: [[ErrorLogDialog.tsx]]

### MAX_FEEDBACK_URL
*const* · line 63 · exported
> Longest prefilled feedback address (GitHub and browsers cope with more, but some proxies do not).
- Used in: [[error-boundary.test.tsx]]

### feedbackFormUrl
*function* · line 69 · exported
> The "Something is not working" form on GitHub with the browser and a short diagnostic summary filled in. `feedbackUrl` is FEEDBACK_URL (…/issues/new/choose); anything else is returned as is.
- Calls: [[errorlog.ts#describeBrowser|describeBrowser()]]
- Uses: [[errorlog/actions.ts#MAX_FEEDBACK_URL|MAX_FEEDBACK_URL]]
- Used in: [[error-boundary.test.tsx]]

### prefilledFeedbackUrl
*function* · line 84 · exported
> The feedback form address with the diagnostic summary.
- Calls: [[errorlog.ts#formatSummary|formatSummary()]], [[errorlog/actions.ts#feedbackFormUrl|feedbackFormUrl()]]
- Used in: [[ErrorBoundary.tsx]], [[FeedbackDialog.tsx]]
