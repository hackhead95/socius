---
id: "store-key:useCodingUi.history"
type: store-key
file: src/features/coding/uiStore.ts
line: 39
area: features/coding
---

# useCodingUi.history

*Store state key* · defined in [[uiStore.ts]] (line 39) · area [[features - coding|features/coding]]

- **Store:** useCodingUi

## Read by
- [[CodingWorkspace|<CodingWorkspace>]] · hook (destructured)
- [[coding/actions.ts#commit|commit()]] · alias
- [[coding/actions.ts#redoCoding|redoCoding()]] · alias
- [[coding/actions.ts#setActiveCoder|setActiveCoder()]] · alias
- [[coding/actions.ts#undoCoding|undoCoding()]] · alias
- [[coding/actions.ts#undoLabel|undoLabel()]] · getState (destructured)
- [[useUndoRedo|useUndoRedo()]] · selector

## Written by
- [[coding/actions.ts#commit|commit()]] · alias.set, set()
- [[Redo|Edit > Redo]] · runRedo
- [[Undo|Edit > Undo]] · runUndo
- [[coding/actions.ts#redoCoding|redoCoding()]] · alias.set, set()
- [[coding/actions.ts#setActiveCoder|setActiveCoder()]] · alias.set, set()
- [[navigation-audit.test.tsx]] · setState
- [[shell-fixes.test.ts]] · setState
- [[actions.test.ts]] · getState.set, set()
- [[coding/actions.ts#undoCoding|undoCoding()]] · alias.set, set()

## Store
- [[useCodingUi]]
