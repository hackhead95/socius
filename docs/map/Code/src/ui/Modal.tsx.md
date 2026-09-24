---
id: src/ui/Modal.tsx
type: module
file: src/ui/Modal.tsx
area: ui
---

# src/ui/Modal.tsx

*Module* · area [[ui]] · 248 lines

## Imports
- [[react]] · value

## Tested by
- [[ui-overlays.test.tsx]] · import

## Imported by
- [[HelpDialogs.tsx]] · value
- [[MenuBar.tsx]] · value
- [[Overlays.tsx]] · value
- [[AiFeatureDialogs.tsx]] · value
- [[AiSettingsDialog.tsx]] · value
- [[StorageManager.tsx]] · value
- [[ProcedureDialog.tsx]] · value
- [[CodebookPanel.tsx]] · value
- [[CodingDialog.tsx]] · value
- [[AiDialogs.tsx]] · value
- [[AutoCodeDialog.tsx]] · value
- [[ExportDialogs.tsx]] · value
- [[ImportDialog.tsx]] · value
- [[SmallDialogs.tsx]] · value
- [[MemosView.tsx]] · value
- [[SourcesPanel.tsx]] · value
- [[DefineProperties.tsx]] · value
- [[VarDialogs.tsx]] · value
- [[ErrorLogDialog.tsx]] · value
- [[FeedbackDialog.tsx]] · value
- [[OutputViewer.tsx]] · value
- [[FileDialogs.tsx]] · value
- [[transform/common.tsx]] · value
- [[ui-overlays.test.tsx]] · value

## Types
ModalProps (line 3)

## Private helpers
FOCUSABLE (line 18) · INPUTS (line 20) · OVERLAY (line 33) · lastPageFocus (line 34) · pending (line 35) · usable() (line 55) · returnTarget() (line 59) · fallbackTarget() (line 68) · stack (line 78) · modalListeners (line 79) · notify() (line 80) · initialFocus() (line 94)

## Symbols

### setDialogReturnFocus
*function* · line 51 · exported
> A dialog about to open (from a menu) should give focus back to `el` when it closes.
- Uses: [[Modal.tsx]]
- Used in: [[MenuBar.tsx]]

### subscribeModals
*function* · line 83 · exported
> Subscribe to dialogs opening and closing (toasts move out of the way of the top dialog).
- Uses: [[Modal.tsx]]
- Used in: [[Overlays.tsx]]

### topModal
*function* · line 89 · exported
> The top-most open dialog, or null.
- Uses: [[Modal.tsx]]
- Used in: [[Overlays.tsx]]

### Modal
*component* · line 113 · exported · note: [[Modal|<Modal>]]
> Accessible modal dialog. Escape closes it; Tab stays inside; focus goes back where it came from.
- Calls: [[Modal.tsx]]
- Uses: [[Modal.tsx]]
- Rendered by: [[AboutDialog|<AboutDialog>]], [[AiCodebookDialog|<AiCodebookDialog>]], [[AiGate|<AiGate>]], [[AiPrereqDialog|<AiPrereqDialog>]], [[AiSettingsDialog|<AiSettingsDialog>]], [[AiSuggestDialog|<AiSuggestDialog>]], [[AutoCodeDialog|<AutoCodeDialog>]], [[CodeEditDialog|<CodeEditDialog>]], [[CodersDialog|<CodersDialog>]], [[CopyPropertiesDialog|<CopyPropertiesDialog>]], [[DefinePropertiesDialog|<DefinePropertiesDialog>]], [[DialogBody|<DialogBody>]], [[DocEditDialog|<DocEditDialog>]], [[ErrorLogDialog|<ErrorLogDialog>]], [[ExplainPickDialog|<ExplainPickDialog>]], [[ExportDialog|<ExportDialog>]], [[ExportToDatasetDialog|<ExportToDatasetDialog>]], [[FeedbackDialog|<FeedbackDialog>]], [[GettingStartedDialog|<GettingStartedDialog>]], [[ImportDialog (features-coding-dialogs-ImportDialog)|<ImportDialog>]], [[ImportDialog (features-project-FileDialogs)|<ImportDialog>]], [[MergeCodeDialog|<MergeCodeDialog>]], [[MissingDialog|<MissingDialog>]], [[ProcedureDialog|<ProcedureDialog>]], [[RecentProjectsDialog|<RecentProjectsDialog>]] … +6

### ConfirmDialog
*component* · line 222 · exported · note: [[ConfirmDialog|<ConfirmDialog>]]
> In-page confirmation (window.confirm is blocked inside the Claude artifact viewer).
- Renders: [[Modal|<Modal>]]
- Rendered by: [[CodeEditDialog|<CodeEditDialog>]], [[CodebookPanel|<CodebookPanel>]], [[CodersDialog|<CodersDialog>]], [[ConfirmHost|<ConfirmHost>]], [[MemosView|<MemosView>]], [[SourcesPanel|<SourcesPanel>]]
