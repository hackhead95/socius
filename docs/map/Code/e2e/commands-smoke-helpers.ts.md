---
id: e2e/commands-smoke-helpers.ts
type: test-helper
file: e2e/commands-smoke-helpers.ts
area: e2e
---

# e2e/commands-smoke-helpers.ts

*Test helper* · area [[e2e]] · 105 lines

> Shared by the command smoke specs (e2e/commands-smoke*.spec.ts): walk the real menus, invoke a command by its menu path, and watch for page errors and error-log errors.

## Imports
- [[@playwright-test|@playwright/test]] · value

## Imported by
- [[commands-smoke-analyze.spec.ts]] · value
- [[commands-smoke-app.spec.ts]] · value

## Tests
- [[socius.errorlog]] · storage key

## Types
MenuNode (line 5)

## Private helpers
openTop() (line 45) · readItems() (line 51)

## Symbols

### watchErrors
*function* · line 14 · exported
> Collect uncaught page errors and console errors (fonts blocked by the sandbox are not app errors).
- Used in: [[commands-smoke-analyze.spec.ts]], [[commands-smoke-app.spec.ts]]

### errorLogErrors
*function* · line 24 · exported
> Error-level entries in the error log (this browser context is fresh, so every entry is from this run).
- Used in: [[commands-smoke-analyze.spec.ts]], [[commands-smoke-app.spec.ts]]

### settle
*function* · line 36 · exported
> Close menus, dialogs and popups until the page is back to its normal state.
- Used in: [[commands-smoke-analyze.spec.ts]], [[commands-smoke-app.spec.ts]]

### menuTree
*function* · line 64 · exported
> Every command in the given top-level menus, read from the live menubar (so new commands are included).
- Calls: [[commands-smoke-helpers.ts#settle|settle()]], [[commands-smoke-helpers.ts]]
- Used in: [[commands-smoke-analyze.spec.ts]], [[commands-smoke-app.spec.ts]]

### invoke
*function* · line 90 · exported
> Choose a command by its menu path, clicking through the menubar like a user.
- Calls: [[commands-smoke-helpers.ts]]
- Used in: [[commands-smoke-analyze.spec.ts]], [[commands-smoke-app.spec.ts]]

### escapeRe
*function* · line 99 · exported

### BAD_OUTPUT
*const* · line 104 · exported
> Text that must never appear in a result: numbers that failed to compute or leaked placeholders.
- Used in: [[commands-smoke-analyze.spec.ts]]
