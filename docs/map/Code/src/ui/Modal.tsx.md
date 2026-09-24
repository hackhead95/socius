---
id: src/ui/Modal.tsx
type: module
file: src/ui/Modal.tsx
area: ui
---

# src/ui/Modal.tsx

*Module* · area [[ui]] · 98 lines

## Imports
- [[react]] · value

## Imported by
- [[HelpDialogs.tsx]] · value
- [[Overlays.tsx]] · value
- [[AiFeatureDialogs.tsx]] · value
- [[AiSettingsDialog.tsx]] · value
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

## Types
ModalProps (line 3)

## Private helpers
FOCUSABLE (line 12)

## Symbols

### Modal
*component* · line 15 · exported · note: [[Modal|<Modal>]]
> Accessible modal dialog. Escape and backdrop click close it; Tab stays inside.
- Uses: [[Modal.tsx]]
- Rendered by: [[AboutDialog|<AboutDialog>]], [[AiCodebookDialog|<AiCodebookDialog>]], [[AiGate|<AiGate>]], [[AiPrereqDialog|<AiPrereqDialog>]], [[AiSettingsDialog|<AiSettingsDialog>]], [[AiSuggestDialog|<AiSuggestDialog>]], [[AutoCodeDialog|<AutoCodeDialog>]], [[CodeEditDialog|<CodeEditDialog>]], [[CodersDialog|<CodersDialog>]], [[CopyPropertiesDialog|<CopyPropertiesDialog>]], [[DefinePropertiesDialog|<DefinePropertiesDialog>]], [[DialogBody|<DialogBody>]], [[DocEditDialog|<DocEditDialog>]], [[ErrorLogDialog|<ErrorLogDialog>]], [[ExplainPickDialog|<ExplainPickDialog>]], [[ExportDialog|<ExportDialog>]], [[ExportToDatasetDialog|<ExportToDatasetDialog>]], [[FeedbackDialog|<FeedbackDialog>]], [[GettingStartedDialog|<GettingStartedDialog>]], [[ImportDialog (features-coding-dialogs-ImportDialog)|<ImportDialog>]], [[ImportDialog (features-project-FileDialogs)|<ImportDialog>]], [[MergeCodeDialog|<MergeCodeDialog>]], [[MissingDialog|<MissingDialog>]], [[ProcedureDialog|<ProcedureDialog>]], [[RecentProjectsDialog|<RecentProjectsDialog>]] … +4

### ConfirmDialog
*component* · line 72 · exported · note: [[ConfirmDialog|<ConfirmDialog>]]
> In-page confirmation (window.confirm is blocked inside the Claude artifact viewer).
- Renders: [[Modal|<Modal>]]
- Rendered by: [[CodeEditDialog|<CodeEditDialog>]], [[CodebookPanel|<CodebookPanel>]], [[CodersDialog|<CodersDialog>]], [[ConfirmHost|<ConfirmHost>]], [[MemosView|<MemosView>]], [[SourcesPanel|<SourcesPanel>]]
