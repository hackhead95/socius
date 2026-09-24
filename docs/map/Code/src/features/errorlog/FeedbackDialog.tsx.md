---
id: src/features/errorlog/FeedbackDialog.tsx
type: module
file: src/features/errorlog/FeedbackDialog.tsx
area: features/errorlog
---

# src/features/errorlog/FeedbackDialog.tsx

*Module* · area [[features - errorlog|features/errorlog]] · 70 lines

> Help > Send feedback or report a problem (also the top bar's Feedback button): before opening the form on GitHub, offer to copy the error report, and fill a short diagnostic summary into the form.

## Imports
- [[react]] · value
- [[links.ts]] · value
- [[errorlog/actions.ts]] · value
- `src/features/errorlog/errorlog.css` · side-effect
- [[errorlog.ts]] · value
- [[Modal.tsx]] · value

## Imported by
- [[DialogHost.tsx]] · value

## Symbols

### FeedbackDialog
*component* · line 10 · exported · note: [[FeedbackDialog|<FeedbackDialog>]]
- Renders: [[Modal|<Modal>]]
- Calls: [[errorlog.ts#formatSummary|formatSummary()]], [[errorlog/actions.ts#copyErrorReport|copyErrorReport()]], [[errorlog/actions.ts#prefilledFeedbackUrl|prefilledFeedbackUrl()]], [[links.ts#openExternal|openExternal()]], [[useErrorLog|useErrorLog()]]
- Uses: [[errorlog.ts#SESSION_ID|SESSION_ID]], [[errorlog/actions.ts#openErrorLog|openErrorLog()]], [[links.ts#FEEDBACK_URL|FEEDBACK_URL]]
- Rendered by: [[DialogHost|<DialogHost>]]
