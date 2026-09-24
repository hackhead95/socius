---
id: "src/core/store.ts#useStore"
type: store
file: src/core/store.ts
line: 149
area: core
---

# useStore

*Store* · defined in [[store.ts]] (line 149) · area [[core]]

- **Exported:** yes

## Keys and who touches them
| key | written by | read by |
|---|---|---|
| [[useStore/coding\|coding]] | 7 ([[features.test.ts]], [[navigation-audit.test.tsx]], [[palette.test.tsx]], [[shell-fixes.test.ts]], …) | 61 |
| [[dataset]] | 16 ([[Close data and start fresh\|File > Close data and start fresh...]], [[features.test.ts]], [[navigation-audit.test.tsx]], [[palette.test.tsx]], …) | 64 |
| [[useStore/dialog\|dialog]] | 10 ([[Close data and start fresh\|File > Close data and start fresh...]], [[features.test.ts]], [[error-boundary.test.tsx]], [[navigation-audit.test.tsx]], …) | 7 |
| [[useStore/focusOutputId\|focusOutputId]] | 5 ([[Close data and start fresh\|File > Close data and start fresh...]], [[addOutput()\|useStore.addOutput()]], [[restoreOutput()\|useStore.restoreOutput()]], [[fileActions.ts#applyProject\|applyProject()]], …) | 1 |
| [[useStore/future\|future]] | 10 ([[Close data and start fresh\|File > Close data and start fresh...]], [[navigation-audit.test.tsx]], [[shell-fixes.test.ts]], [[data-fixes.test.ts]], …) | 4 |
| [[outputRedo]] | 7 ([[store.ts]], [[navigation-audit.test.tsx]], [[shell-fixes.test.ts]], [[clearOutputs()\|useStore.clearOutputs()]], …) | 5 |
| [[outputUndo]] | 7 ([[store.ts]], [[navigation-audit.test.tsx]], [[shell-fixes.test.ts]], [[clearOutputs()\|useStore.clearOutputs()]], …) | 7 |
| [[outputs]] | 19 ([[Close data and start fresh\|File > Close data and start fresh...]], [[features.test.ts]], [[navigation-audit.test.tsx]], [[palette.test.tsx]], …) | 33 |
| [[past]] | 10 ([[Close data and start fresh\|File > Close data and start fresh...]], [[navigation-audit.test.tsx]], [[shell-fixes.test.ts]], [[data-fixes.test.ts]], …) | 9 |
| [[showValueLabels]] | 2 ([[setShowValueLabels()\|useStore.setShowValueLabels()]], [[fileActions.ts#applyProject\|applyProject()]]) | 4 |
| [[useStore/tab\|tab]] | 12 ([[Close data and start fresh\|File > Close data and start fresh...]], [[features.test.ts]], [[navigation-audit.test.tsx]], [[palette.test.tsx]], …) | 19 |
| [[useStore/toasts\|toasts]] | 5 ([[error-boundary.test.tsx]], [[ui-overlays.test.tsx]], [[ui-fixes.test.tsx]], [[dismissToast()\|useStore.dismissToast()]], …) | 6 |

## Actions
| action | writes | callers |
|---|---|---|
| [[addOutput()]] | [[useStore/focusOutputId\|focusOutputId]], [[outputs]], [[useStore/tab\|tab]] | 6 |
| [[addVariable()]] |  | 2 |
| [[clearOutputs()]] | [[outputRedo]], [[outputs]], [[outputUndo]] | 4 |
| [[closeDialog()]] | [[useStore/dialog\|dialog]] | 4 |
| [[deleteCases()]] |  | 1 |
| [[deleteVariables()]] |  | 2 |
| [[dismissToast()]] | [[useStore/toasts\|toasts]] | 2 |
| [[insertCases()]] |  | 1 |
| [[moveOutput()]] | [[outputs]] | 1 |
| [[moveVariable()]] |  | 1 |
| [[mutateDataset()]] | [[dataset]], [[useStore/future\|future]], [[past]] | 21 |
| [[openDialog()]] | [[useStore/dialog\|dialog]] | 92 |
| [[redeleteOutput()]] | [[outputRedo]], [[outputs]], [[outputUndo]] | 3 |
| [[redo()]] | [[dataset]], [[useStore/future\|future]], [[past]] | 5 |
| [[removeOutput()]] | [[outputRedo]], [[outputs]], [[outputUndo]] | 3 |
| [[restoreOutput()]] | [[useStore/focusOutputId\|focusOutputId]], [[outputRedo]], [[outputs]], [[outputUndo]] | 4 |
| [[setCell()]] |  | 1 |
| [[setCoding()]] | [[useStore/coding\|coding]] | 10 |
| [[setDataset()]] | [[dataset]], [[useStore/future\|future]], [[past]] | 10 |
| [[setShowValueLabels()]] | [[showValueLabels]] | 4 |
| [[setTab()]] | [[useStore/tab\|tab]] | 50 |
| [[toast()]] | [[useStore/toasts\|toasts]] | 32 |
| [[undo()]] | [[dataset]], [[useStore/future\|future]], [[past]] | 8 |
| [[updateVariable()]] |  | 2 |

## Calls
- [[coding-types.ts#emptyCodingProject|emptyCodingProject()]]
- [[core/types.ts#emptyColumn|emptyColumn()]]
- [[store.ts#trimHistory|trimHistory()]]

## State keys
- [[useStore/coding|useStore.coding]]
- [[dataset|useStore.dataset]]
- [[useStore/dialog|useStore.dialog]]
- [[useStore/focusOutputId|useStore.focusOutputId]]
- [[useStore/future|useStore.future]]
- [[outputRedo|useStore.outputRedo]]
- [[outputs|useStore.outputs]]
- [[outputUndo|useStore.outputUndo]]
- [[past|useStore.past]]
- [[showValueLabels|useStore.showValueLabels]]
- [[useStore/tab|useStore.tab]]
- [[useStore/toasts|useStore.toasts]]

## Actions
- [[addOutput()|useStore.addOutput()]]
- [[addVariable()|useStore.addVariable()]]
- [[clearOutputs()|useStore.clearOutputs()]]
- [[closeDialog()|useStore.closeDialog()]]
- [[deleteCases()|useStore.deleteCases()]]
- [[deleteVariables()|useStore.deleteVariables()]]
- [[dismissToast()|useStore.dismissToast()]]
- [[insertCases()|useStore.insertCases()]]
- [[moveOutput()|useStore.moveOutput()]]
- [[moveVariable()|useStore.moveVariable()]]
- [[mutateDataset()|useStore.mutateDataset()]]
- [[openDialog()|useStore.openDialog()]]
- [[redeleteOutput()|useStore.redeleteOutput()]]
- [[redo()|useStore.redo()]]
- [[removeOutput()|useStore.removeOutput()]]
- [[restoreOutput()|useStore.restoreOutput()]]
- [[setCell()|useStore.setCell()]]
- [[setCoding()|useStore.setCoding()]]
- [[setDataset()|useStore.setDataset()]]
- [[setShowValueLabels()|useStore.setShowValueLabels()]]
- [[setTab()|useStore.setTab()]]
- [[toast()|useStore.toast()]]
- [[undo()|useStore.undo()]]
- [[updateVariable()|useStore.updateVariable()]]

## Called by
- [[AiCodebookDialog|<AiCodebookDialog>]]
- [[AiPrereqDialog|<AiPrereqDialog>]]
- [[AiSuggestDialog|<AiSuggestDialog>]]
- [[AnalyseView|<AnalyseView>]]
- [[Components/App|<App>]]
- [[AutoCodeDialog|<AutoCodeDialog>]]
- [[ByAttribute|<ByAttribute>]]
- [[CodebookPanel|<CodebookPanel>]]
- [[CodeEditDialog|<CodeEditDialog>]]
- [[CodersDialog|<CodersDialog>]]
- [[CodingWorkspace|<CodingWorkspace>]]
- [[CommandPalette|<CommandPalette>]]
- [[Composer|<Composer>]]
- [[Cooccurrence|<Cooccurrence>]]
- [[DatasetName|<DatasetName>]]
- [[DataView|<DataView>]]
- [[DataViewInner|<DataViewInner>]]
- [[DialogBody|<DialogBody>]]
- [[DialogHost|<DialogHost>]]
- [[DocEditDialog|<DocEditDialog>]]
- [[Components/Empty|<Empty>]]
- [[EmptyState|<EmptyState>]]
- [[ExplainPickDialog|<ExplainPickDialog>]]
- [[ExportDialog|<ExportDialog>]]
- [[ExportToDatasetDialog|<ExportToDatasetDialog>]]
- [[Components/Frequencies|<Frequencies>]]
- [[GuardedDialogs|<GuardedDialogs>]]
- [[ImportDialog (features-coding-dialogs-ImportDialog)|<ImportDialog>]]
- [[MemosView|<MemosView>]]
- [[MenuBar|<MenuBar>]]
- [[MergeCodeDialog|<MergeCodeDialog>]]
- [[MissingDialog|<MissingDialog>]]
- [[OutputViewer|<OutputViewer>]]
- [[ProcedureDialog|<ProcedureDialog>]]
- [[QuickCode|<QuickCode>]]
- [[Reader|<Reader>]]
- [[ReliabilityView|<ReliabilityView>]]
- [[ResponsesView|<ResponsesView>]]
- [[RetrievalView|<RetrievalView>]]
- [[Components/SampleBanner|<SampleBanner>]]
- [[SamplesTab|<SamplesTab>]]
- [[SendButton|<SendButton>]]
- [[Sidebar|<Sidebar>]]
- [[SourcesPanel|<SourcesPanel>]]
- [[SurveyTab|<SurveyTab>]]
- [[Components/Toasts|<Toasts>]]
- [[TopBar|<TopBar>]]
- [[TransformDialog|<TransformDialog>]]
- [[TypeDialog|<TypeDialog>]]
- [[ValueLabelsDialog|<ValueLabelsDialog>]]
- [[VariableDrawer|<VariableDrawer>]]
- [[VariableList|<VariableList>]]
- [[VariableView|<VariableView>]]
- [[VariableViewInner|<VariableViewInner>]]
- [[Welcome (app-Welcome)|<Welcome>]]
- [[Words|<Words>]]
- [[error-boundary.test.tsx]]
- [[useCodeMap|useCodeMap()]]
- [[useEntries|useEntries()]]
- [[useMenus|useMenus()]]
- [[useOrderedCodes|useOrderedCodes()]]
- [[useToastPlacement|useToastPlacement()]]
- [[useUndoRedo|useUndoRedo()]]
- [[useVisibleSegments|useVisibleSegments()]]

## Used by
- [[AggregateDialog|<AggregateDialog>]]
- [[Components/App|<App>]]
- [[CommandPalette|<CommandPalette>]]
- [[CopyPropertiesDialog|<CopyPropertiesDialog>]]
- [[DataViewInner|<DataViewInner>]]
- [[DefinePropertiesDialog|<DefinePropertiesDialog>]]
- [[DialogBody|<DialogBody>]]
- [[ExplainPanel|<ExplainPanel>]]
- [[GuardedDialogs|<GuardedDialogs>]]
- [[OutputViewer|<OutputViewer>]]
- [[SamplesTab|<SamplesTab>]]
- [[TypeDialog|<TypeDialog>]]
- [[VariableViewInner|<VariableViewInner>]]
- [[fileActions.ts#activateDataset|activateDataset()]]
- [[coding/actions.ts#addCoder|addCoder()]]
- [[coding/actions.ts#applyCode|applyCode()]]
- [[fileActions.ts#applyProject|applyProject()]]
- [[transform/common.tsx#applyTransform|applyTransform()]]
- [[controller.ts#appSnapshot|appSnapshot()]]
- [[menus.ts#buildMenus|buildMenus()]]
- [[coding/actions.ts#commit|commit()]]
- [[output/actions.ts#confirmAndClearOutputs|confirmAndClearOutputs()]]
- [[fileActions.ts#confirmReplace|confirmReplace()]]
- [[errorlog/actions.ts#copyErrorReport|copyErrorReport()]]
- [[coding/actions.ts#createCode|createCode()]]
- [[features.ts#currentAiContext|currentAiContext()]]
- [[fileActions.ts#currentProjectState|currentProjectState()]]
- [[AiFeatureDialogs.tsx#doAction|doAction()]]
- [[errorlog/actions.ts#downloadErrorReport|downloadErrorReport()]]
- [[output/actions.ts#exportAllOutput|exportAllOutput()]]
- [[fileActions.ts#exportCodebook|exportCodebook()]]
- [[fileActions.ts#exportCsvFile|exportCsvFile()]]
- [[fileActions.ts#exportSavFile|exportSavFile()]]
- [[fileActions.ts#exportXlsxFile|exportXlsxFile()]]
- [[shortcuts.ts#handleGlobalKey|handleGlobalKey()]]
- [[fileActions.ts#importBytes|importBytes()]]
- [[install.ts#installErrorLog|installErrorLog()]]
- [[fileActions.ts#isModified|isModified()]]
- [[fileActions.ts#loadSample|loadSample()]]
- [[coding/actions.ts#loadWorkedExample|loadWorkedExample()]]
- [[coding/actions.ts#moveCode|moveCode()]]
- [[undo.ts#nothingTo|nothingTo()]]
- [[fileActions.ts#openDataFile|openDataFile()]]
- [[fileActions.ts#openDroppedFile|openDroppedFile()]]
- [[errorlog/actions.ts#openErrorLog|openErrorLog()]]
- [[errorlog/actions.ts#openFeedback|openFeedback()]]
- [[fileActions.ts#openProjectFile|openProjectFile()]]
- [[fileActions.ts#openRecentProject|openRecentProject()]]
- [[coding/actions.ts#redoCoding|redoCoding()]]
- [[coding/actions.ts#redoLabel|redoLabel()]]
- [[undo.ts#redoStep|redoStep()]]
- [[coding/actions.ts#renameCoder|renameCoder()]]
- [[features.ts#runAiFeature|runAiFeature()]]
- [[controller.ts#runArtifact|runArtifact()]] · whole-state
- [[undo.ts#runRedo|runRedo()]]
- [[undo.ts#runUndo|runUndo()]]
- [[fileActions.ts#saveProject|saveProject()]]
- [[controller.ts#sendMessage|sendMessage()]]
- [[coding/actions.ts#setActiveCoder|setActiveCoder()]]
- [[ErrorBoundary.tsx]]
- [[undo.ts]]
- [[coding/actions.ts]]
- [[install.ts]]
- [[output/actions.ts]]
- [[fileActions.ts]]
- [[features.ts#startExplain|startExplain()]]
- [[fileActions.ts#startFresh|startFresh()]]
- [[features.test.ts]]
- [[error-boundary.test.tsx]]
- [[navigation-audit.test.tsx]] · whole-state
- [[palette.test.tsx]]
- [[search.test.ts]]
- [[shell-fixes.test.ts]]
- [[shortcut-precedence.test.tsx]]
- [[ui-overlays.test.tsx]]
- [[scenarios.test.ts]]
- [[actions.test.ts]]
- [[dataset.test.ts]]
- [[ui-fixes.test.tsx]]
- [[transforms-expr.fuzz.test.ts]]
- [[transforms-ops.fuzz.test.ts]]
- [[dialog-ui.test.tsx]]
- [[data-fixes.test.ts]]
- [[history.test.ts]]
- [[coding/hooks.ts#toast|toast()]]
- [[transform/common.tsx#turnFilterOff|turnFilterOff()]]
- [[transform/common.tsx#turnWeightOff|turnWeightOff()]]
- [[coding/actions.ts#undoCoding|undoCoding()]]
- [[coding/actions.ts#undoLabel|undoLabel()]]
- [[undo.ts#undoStep|undoStep()]]
- [[useAutosave|useAutosave()]]
- [[useEntries|useEntries()]]
- [[useExplain]]
- [[CodingDialog.tsx#ViewSwitch|ViewSwitch()]]
