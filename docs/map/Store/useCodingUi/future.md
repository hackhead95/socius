---
id: "store-key:useCodingUi.future"
type: store-key
file: src/features/coding/uiStore.ts
line: 41
area: features/coding
---

# useCodingUi.future

*Store state key* · defined in [[uiStore.ts]] (line 41) · area [[features - coding|features/coding]]

> Coding changes undone, newest last, for Redo.

- **Store:** useCodingUi

## Read by
- [[coding/actions.ts#redoCoding|redoCoding()]] · alias
- [[coding/actions.ts#redoLabel|redoLabel()]] · getState (destructured)
- [[coding/actions.ts#setActiveCoder|setActiveCoder()]] · alias
- [[coding/actions.ts#undoCoding|undoCoding()]] · alias
- [[useUndoRedo|useUndoRedo()]] · selector

## Written by
- [[coding/actions.ts#commit|commit()]] · alias.set, set()
- [[Redo|Edit > Redo]] · runRedo
- [[Undo|Edit > Undo]] · runUndo
- [[coding/actions.ts#redoCoding|redoCoding()]] · alias.set, set()
- [[coding/actions.ts#setActiveCoder|setActiveCoder()]] · alias.set, set()
- [[navigation-audit.test.tsx]] · setState
- [[shell-fixes.test.ts]] · setState
- [[coding/actions.ts#undoCoding|undoCoding()]] · alias.set, set()

## Store
- [[useCodingUi]]
