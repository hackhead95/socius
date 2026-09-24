---
id: "cmd:help:h-feedback"
type: command
file: src/app/menus.ts
area: app
---

# Help > Send feedback or report a problem

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** Help > Send feedback or report a problem
- **Tooltip:** Offers to include the error report, then opens a form on GitHub in a new tab
- **Menu:** Help

## Calls
- [[errorlog/actions.ts#openFeedback|openFeedback()]]

## Part of
- [[Menus/Help|Help]]

## Tested by
- [[ai.spec.ts]] · menu label
- [[errorlog.spec.ts]] · menu label
