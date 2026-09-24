---
id: src/features/ai/StorageBanner.tsx
type: module
file: src/features/ai/StorageBanner.tsx
area: features/ai
---

# src/features/ai/StorageBanner.tsx

*Module* · area [[features - ai|features/ai]] · 26 lines

> One banner when autosave is paused because browser storage is full (see persistence.ts), with the two ways out: free space (Browser storage, where downloaded AI models can be deleted) or save the project to a file. It goes away by itself when a save succeeds again.

## Imports
- [[react]] · value
- `src/features/ai/ai.css` · side-effect
- [[StorageManager.tsx]] · value
- [[fileActions.ts]] · value

## Imported by
- [[AiSettingsDialog.tsx]] · value

## Symbols

### StorageFullBanner
*component* · line 9 · exported · note: [[StorageFullBanner|<StorageFullBanner>]]
- Calls: [[fileActions.ts#saveProject|saveProject()]], [[useAutosaveState|useAutosaveState()]]
- Uses: [[StorageManager.tsx#openStorageManager|openStorageManager()]]
- Rendered by: [[AiSettingsHost|<AiSettingsHost>]]
