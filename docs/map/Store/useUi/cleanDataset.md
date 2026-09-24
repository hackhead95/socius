---
id: "store-key:useUi.cleanDataset"
type: store-key
file: src/app/ui-store.ts
line: 34
area: app
---

# useUi.cleanDataset

*Store state key* · defined in [[ui-store.ts]] (line 34) · area [[Areas/app|app]]

> Dataset object as last opened/saved; anything else counts as modified.

- **Store:** useUi

## Read by
- [[TopBar|<TopBar>]] · selector
- [[fileActions.ts#isModified|isModified()]] · getState
- [[useAutosave|useAutosave()]] · subscribe

## Written by
- [[markClean()|useUi.markClean()]]

## Store
- [[useUi]]
