---
id: "store-key:useStore.dialog"
type: store-key
file: src/core/store.ts
line: 91
area: core
---

# useStore.dialog

*Store state key* · defined in [[store.ts]] (line 91) · area [[core]]

- **Store:** useStore

## Read by
- [[DialogHost|<DialogHost>]] · selector
- [[GuardedDialogs|<GuardedDialogs>]] · selector
- [[install.ts#installErrorLog|installErrorLog()]] · alias
- [[features.test.ts]] · getState
- [[error-boundary.test.tsx]] · getState, selector
- [[palette.test.tsx]] · getState
- [[search.test.ts]] · getState

## Written by
- [[fileActions.ts#applyProject|applyProject()]] · setState
- [[Close data and start fresh|File > Close data and start fresh...]] · startFresh
- [[fileActions.ts#startFresh|startFresh()]] · setState
- [[features.test.ts]] · setState
- [[error-boundary.test.tsx]] · setState
- [[navigation-audit.test.tsx]] · setState
- [[palette.test.tsx]] · setState
- [[shortcut-precedence.test.tsx]] · setState
- [[closeDialog()|useStore.closeDialog()]]
- [[openDialog()|useStore.openDialog()]]

## Store
- [[useStore]]
