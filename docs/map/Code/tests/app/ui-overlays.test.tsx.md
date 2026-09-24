---
id: tests/app/ui-overlays.test.tsx
type: test
file: tests/app/ui-overlays.test.tsx
area: tests
---

# tests/app/ui-overlays.test.tsx

*Test file* · area [[tests]] · 105 lines

> Unit tests for the shell side of the QA crawl fixes (docs/qa/UI-BUGS.md): menubar hover intent (UI-011), toasts with an action that do not stack (UI-001, UI-027), the tokens' contrast (UI-014) and the dialog backdrop rule (UI-022). Focus and layout behaviour needs a real browser: see e2e/ui-overlays-focus.spec.ts. @vitest-environment jsdom

## Test cases
- **menubar hover intent (UI-011)**
  - a pointer heading down into the open menu is aiming at it
  - moving along the bar, up, or away from the menu is not
- **toasts**
  - the same message replaces the old one instead of stacking, and can carry an action
- **theme tokens (UI-014)**
  - the dark tokens for "match my system" equal the explicit dark theme
- **dialog backdrop (UI-022)**
  - a click on the dimmed area closes an information dialog but not one with fields

## Imports
- [[@testing-library-react|@testing-library/react]] · value
- [[node-fs|node:fs]] · value
- [[node-path|node:path]] · value
- [[MenuBar.tsx]] · value
- [[store.ts]] · value
- [[Modal.tsx]] · value
- [[vitest]] · value

## Calls
- [[MenuBar.tsx#aimsAtDropdown|aimsAtDropdown()]]

## Renders
- [[Modal|<Modal>]]

## Uses
- [[useStore]]

## Reads
- [[useStore/toasts|useStore.toasts]] · getState

## Writes
- [[useStore/toasts|useStore.toasts]] · setState

## Calls store actions
- [[toast()|useStore.toast()]] · alias

## Tests
- [[Descriptive Statistics/Frequencies|Analyze > Descriptive Statistics > Frequencies...]] · menu label
- [[Undo|Edit > Undo]] · menu label
- [[Procedures/frequencies|Frequencies]] · menu label
- [[MenuBar.tsx]] · import
- [[store.ts]] · import
- [[Modal.tsx]] · import
