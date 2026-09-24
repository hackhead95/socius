---
id: "area:features/errorlog"
type: area
area: features/errorlog
---

# Area: features/errorlog

4 files, 406 lines.

## Depends on (module imports)
- [[platform]]: 8
- [[core]]: 4
- [[ui]]: 2
- [[Areas/app|app]]: 1

## Used by areas
- [[Areas/app|app]]: 8

## Files
- [[errorlog/actions.ts]]: Error log and feedback actions shared by the Help menu, the top bar, About and the error screens.
- [[ErrorLogDialog.tsx]]: Help > Error log...: what went wrong in this browser, newest first, with filters, details, copy, download and clear. Opening it clears the "…
- [[FeedbackDialog.tsx]]: Help > Send feedback or report a problem (also the top bar's Feedback button): before opening the form on GitHub, offer to copy the error re…
- [[install.ts]]: Starts the error log for the running app (called once from main.tsx): - context for every entry: main tab, dataset size, AI provider and mod…

## Components
[[EntryRow|<EntryRow>]] · [[ErrorLogDialog|<ErrorLogDialog>]] · [[FeedbackDialog|<FeedbackDialog>]]

## Hooks
[[useErrorLog|useErrorLog()]] · [[useUnseenErrors|useUnseenErrors()]]
