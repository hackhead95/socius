---
id: "store-key:useStore.outputs"
type: store-key
file: src/core/store.ts
line: 82
area: core
---

# useStore.outputs

*Store state key* · defined in [[store.ts]] (line 82) · area [[core]]

- **Store:** useStore

## Read by
- [[AiPrereqDialog|<AiPrereqDialog>]] · selector
- [[Components/App|<App>]] · selector, subscribe
- [[Composer|<Composer>]] · selector
- [[DialogBody|<DialogBody>]] · selector
- [[Components/Empty|<Empty>]] · selector
- [[ExplainPickDialog|<ExplainPickDialog>]] · selector
- [[OutputViewer|<OutputViewer>]] · alias, selector
- [[controller.ts#appSnapshot|appSnapshot()]] · alias
- [[output/actions.ts#confirmAndClearOutputs|confirmAndClearOutputs()]] · getState
- [[features.ts#currentAiContext|currentAiContext()]] · alias
- [[fileActions.ts#currentProjectState|currentProjectState()]] · alias
- [[output/actions.ts#exportAllOutput|exportAllOutput()]] · getState
- [[get_output]]
- [[list_outputs]]
- [[features.ts#runAiFeature|runAiFeature()]] · alias
- [[controller.ts#sendMessage|sendMessage()]] · alias
- [[undo.ts]] · getState (destructured)
- [[navigation-audit.test.tsx]] · getState
- [[shell-fixes.test.ts]] · getState
- [[scenarios.test.ts]] · getState
- [[dialog-ui.test.tsx]] · getState
- [[useAutosave|useAutosave()]] · subscribe
- [[useEntries|useEntries()]] · selector
- [[useExplain]] · alias
- [[useMenus|useMenus()]] · selector
- [[addOutput()|useStore.addOutput()]]
- [[moveOutput()|useStore.moveOutput()]]
- [[redeleteOutput()|useStore.redeleteOutput()]]
- [[removeOutput()|useStore.removeOutput()]]
- [[restoreOutput()|useStore.restoreOutput()]]
- [[useUndoRedo|useUndoRedo()]] · selector

## Written by
- [[OutputViewer|<OutputViewer>]] · setState
- [[fileActions.ts#applyProject|applyProject()]] · setState
- [[Close data and start fresh|File > Close data and start fresh...]] · startFresh
- [[fileActions.ts#startFresh|startFresh()]] · setState
- [[features.test.ts]] · setState
- [[navigation-audit.test.tsx]] · setState
- [[palette.test.tsx]] · setState
- [[search.test.ts]] · setState
- [[shell-fixes.test.ts]] · setState
- [[scenarios.test.ts]] · setState
- [[dialog-ui.test.tsx]] · setState
- [[useExplain]] · setState
- [[addOutput()|useStore.addOutput()]]
- [[clearOutputs()|useStore.clearOutputs()]]
- [[moveOutput()|useStore.moveOutput()]]
- [[redeleteOutput()|useStore.redeleteOutput()]]
- [[removeOutput()|useStore.removeOutput()]]
- [[restoreOutput()|useStore.restoreOutput()]]

## Store
- [[useStore]]
