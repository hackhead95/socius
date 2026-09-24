---
id: src/app/DialogHost.tsx
type: module
file: src/app/DialogHost.tsx
area: app
---

# src/app/DialogHost.tsx

*Module* · area [[Areas/app|app]] · 45 lines

> Renders the dialog requested in the store (procedure, transform, file, coding, help).

## Imports
- [[HelpDialogs.tsx]] · value
- [[store.ts]] · value
- [[AiFeatureDialogs.tsx]] · value
- [[ProcedureDialog.tsx]] · value
- [[CodingDialog.tsx]] · value
- [[DefineProperties.tsx]] · value
- [[VarDialogs.tsx]] · value
- [[ErrorLogDialog.tsx]] · value
- [[FeedbackDialog.tsx]] · value
- [[FileDialogs.tsx]] · value
- [[TransformDialogs.tsx]] · value

## Imported by
- [[App.tsx]] · value

## Symbols

### DialogHost
*component* · line 14 · exported · note: [[DialogHost|<DialogHost>]]
- Renders: [[AboutDialog|<AboutDialog>]], [[AiPrereqDialog|<AiPrereqDialog>]], [[CodingDialog|<CodingDialog>]], [[CopyPropertiesDialog|<CopyPropertiesDialog>]], [[DefinePropertiesDialog|<DefinePropertiesDialog>]], [[ErrorLogDialog|<ErrorLogDialog>]], [[ExplainPickDialog|<ExplainPickDialog>]], [[FeedbackDialog|<FeedbackDialog>]], [[GettingStartedDialog|<GettingStartedDialog>]], [[ImportDialog (features-project-FileDialogs)|<ImportDialog>]], [[ProcedureDialog|<ProcedureDialog>]], [[RecentProjectsDialog|<RecentProjectsDialog>]], [[ShortcutsDialog|<ShortcutsDialog>]], [[TransformDialog|<TransformDialog>]]
- Calls: [[useStore]]
- Reads: [[dataset|useStore.dataset]], [[useStore/dialog|useStore.dialog]]
- Store actions: [[closeDialog()|useStore.closeDialog()]]
- Rendered by: [[Components/App|<App>]]
