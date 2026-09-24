---
id: "src/app/ErrorBoundary.tsx#GuardedDialogs"
type: component
file: src/app/ErrorBoundary.tsx
line: 136
area: app
---

# <GuardedDialogs>

*React component* · defined in [[ErrorBoundary.tsx]] (line 136) · area [[Areas/app|app]]

> A dialog that fails to render is closed with a message; the next dialog opens normally.

- **Exported:** yes

## Calls
- [[useStore]]

## Renders
- [[ErrorBoundary.tsx#ErrorBoundary|ErrorBoundary]]

## Uses
- [[useStore]]

## Reads
- [[useStore/dialog|useStore.dialog]] · selector

## Calls store actions
- [[closeDialog()|useStore.closeDialog()]] · getState

## Rendered by
- [[Components/App|<App>]]
- [[error-boundary.test.tsx]]
