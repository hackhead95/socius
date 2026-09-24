---
id: "store-key:useStore.dataset"
type: store-key
file: src/core/store.ts
line: 79
area: core
---

# useStore.dataset

*Store state key* · defined in [[store.ts]] (line 79) · area [[core]]

- **Store:** useStore

## Read by
- [[AnalyseView|<AnalyseView>]] · selector
- [[Components/App|<App>]] · selector, subscribe
- [[ByAttribute|<ByAttribute>]] · selector
- [[CodingWorkspace|<CodingWorkspace>]] · selector
- [[Composer|<Composer>]] · selector
- [[CopyPropertiesDialog|<CopyPropertiesDialog>]] · getState
- [[DataView|<DataView>]] · selector
- [[DefinePropertiesDialog|<DefinePropertiesDialog>]] · alias
- [[DialogBody|<DialogBody>]] · getState
- [[DialogHost|<DialogHost>]] · selector
- [[Components/Empty|<Empty>]] · selector
- [[EmptyState|<EmptyState>]] · selector
- [[ExportToDatasetDialog|<ExportToDatasetDialog>]] · selector
- [[ImportDialog (features-coding-dialogs-ImportDialog)|<ImportDialog>]] · selector
- [[ProcedureDialog|<ProcedureDialog>]] · selector
- [[ResponsesView|<ResponsesView>]] · selector
- [[Components/SampleBanner|<SampleBanner>]] · selector
- [[SendButton|<SendButton>]] · selector
- [[Sidebar|<Sidebar>]] · selector
- [[SurveyTab|<SurveyTab>]] · selector
- [[TopBar|<TopBar>]] · selector
- [[TransformDialog|<TransformDialog>]] · selector
- [[VariableDrawer|<VariableDrawer>]] · selector
- [[VariableList|<VariableList>]] · selector
- [[VariableView|<VariableView>]] · selector
- [[Welcome (app-Welcome)|<Welcome>]] · selector
- [[transform/common.tsx#applyTransform|applyTransform()]] · alias
- [[controller.ts#appSnapshot|appSnapshot()]] · alias
- [[menus.ts#buildMenus|buildMenus()]] · getState alias
- [[fileActions.ts#confirmReplace|confirmReplace()]] · getState
- [[features.ts#currentAiContext|currentAiContext()]] · alias
- [[fileActions.ts#currentProjectState|currentProjectState()]] · alias
- [[describe_variables]]
- [[get_cases]]
- [[get_dataset_overview]]
- [[shortcuts.ts#handleGlobalKey|handleGlobalKey()]] · alias
- [[install.ts#installErrorLog|installErrorLog()]] · alias
- [[fileActions.ts#isModified|isModified()]] · getState
- [[coding/actions.ts#loadWorkedExample|loadWorkedExample()]] · alias
- [[open_analysis_dialog]]
- [[propose_transform]]
- [[undo.ts#redoStep|redoStep()]] · getState (destructured)
- [[run_analysis]]
- [[fileActions.ts#saveProject|saveProject()]] · alias
- [[controller.ts#sendMessage|sendMessage()]] · alias
- [[install.ts]] · alias
- [[fileActions.ts]] · getState
- [[navigation-audit.test.tsx]] · getState
- [[shell-fixes.test.ts]] · getState, getState (destructured)
- [[scenarios.test.ts]] · getState
- [[dataset.test.ts]] · getState
- [[transforms-expr.fuzz.test.ts]] · getState
- [[transforms-ops.fuzz.test.ts]] · getState
- [[transform/common.tsx#turnFilterOff|turnFilterOff()]] · getState
- [[transform/common.tsx#turnWeightOff|turnWeightOff()]] · getState
- [[undo.ts#undoStep|undoStep()]] · getState (destructured)
- [[useAutosave|useAutosave()]] · getState, subscribe
- [[useEntries|useEntries()]] · getState alias, selector
- [[useMenus|useMenus()]] · selector
- [[mutateDataset()|useStore.mutateDataset()]]
- [[redo()|useStore.redo()]]
- [[undo()|useStore.undo()]]
- [[useUndoRedo|useUndoRedo()]] · selector

## Written by
- [[fileActions.ts#applyProject|applyProject()]] · setState
- [[Close data and start fresh|File > Close data and start fresh...]] · startFresh
- [[fileActions.ts#startFresh|startFresh()]] · setState
- [[features.test.ts]] · setState
- [[navigation-audit.test.tsx]] · setState
- [[palette.test.tsx]] · setState
- [[search.test.ts]] · setState
- [[shell-fixes.test.ts]] · setState
- [[shortcut-precedence.test.tsx]] · setState
- [[ui-fixes.test.tsx]] · setState
- [[dialog-ui.test.tsx]] · setState
- [[data-fixes.test.ts]] · setState
- [[mutateDataset()|useStore.mutateDataset()]]
- [[redo()|useStore.redo()]]
- [[setDataset()|useStore.setDataset()]]
- [[undo()|useStore.undo()]]

## Store
- [[useStore]]
