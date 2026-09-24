---
id: src/features/project/FileDialogs.tsx
type: module
file: src/features/project/FileDialogs.tsx
area: features/project
---

# src/features/project/FileDialogs.tsx

*Module* · area [[features - project|features/project]] · 298 lines

> File dialogs: text/Excel import options with a live preview, and recent projects.

## Imports
- [[react]] · value
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only
- [[fileActions.ts]] · value
- [[persistence.ts]] · value
- [[io/index.ts]] · value
- [[Icon.tsx]] · value
- [[MeasureIcon.tsx]] · value
- [[Modal.tsx]] · value

## Imported by
- [[DialogHost.tsx]] · value

## Private helpers
PREVIEW_BYTES (line 12) · SAV_ENCODINGS (line 15) · NON_ASCII (line 32) · textSamples() (line 35)

## Symbols

### ImportDialog
*component* · line 48 · exported · note: [[ImportDialog (features-project-FileDialogs)|<ImportDialog>]]
- Renders: [[Modal|<Modal>]], [[VarMeasureIcon|<VarMeasureIcon>]]
- Calls: [[FileDialogs.tsx]], [[core/data.ts#formatCell|formatCell()]], [[fileActions.ts#confirmReplace|confirmReplace()]], [[fileActions.ts#importBytes|importBytes()]], [[io/index.ts#importFile|importFile()]]
- Uses: [[FileDialogs.tsx]]
- Rendered by: [[DialogHost|<DialogHost>]]

### RecentProjectsDialog
*component* · line 254 · exported · note: [[RecentProjectsDialog|<RecentProjectsDialog>]]
- Renders: [[Icon|<Icon>]], [[Modal|<Modal>]]
- Calls: [[fileActions.ts#openRecentProject|openRecentProject()]], [[persistence.ts#listRecent|listRecent()]], [[persistence.ts#removeRecent|removeRecent()]]
- Rendered by: [[DialogHost|<DialogHost>]]
