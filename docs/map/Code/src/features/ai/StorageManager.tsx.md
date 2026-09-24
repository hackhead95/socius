---
id: src/features/ai/StorageManager.tsx
type: module
file: src/features/ai/StorageManager.tsx
area: features/ai
---

# src/features/ai/StorageManager.tsx

*Module* · area [[features - ai|features/ai]] · 205 lines

> Browser storage: what Socius keeps in this browser (downloaded on-device AI models, projects and autosave, the error log and settings), how much room is left, deleting downloaded models, and asking the browser to keep the data. Shown in AI settings (On this computer), in Help > About and in the "Browser storage" dialog that the "storage is full" banner opens. All GitHub Pages sites on hackhead9...

## Imports
- [[react]] · value
- [[format-date.ts]] · value
- `src/features/ai/ai.css` · side-effect
- [[persistence.ts]] · value
- [[ai-storage.ts]] · value
- [[ai-webllm.ts]] · value
- [[platform/ai.ts]] · value
- [[Modal.tsx]] · value
- [[zustand]] · value

## Calls
- [[ai-storage.ts#estimateStorage|estimateStorage()]]
- [[ai-storage.ts#listWebLlmStorage|listWebLlmStorage()]]
- [[ai-storage.ts#localStorageBytes|localStorageBytes()]]
- [[ai-storage.ts#storagePersisted|storagePersisted()]]

## Imported by
- [[HelpDialogs.tsx]] · value
- [[AiSettingsDialog.tsx]] · value
- [[StorageBanner.tsx]] · value
- [[WebLlmSetup.tsx]] · value

## Private helpers
snapshot() (line 28)

## Symbols

### useAutosaveState
*hook* · line 34 · exported · note: [[useAutosaveState|useAutosaveState()]]
> Autosave state (paused because storage is full?), for React.
- Uses: [[persistence.ts#getAutosaveState|getAutosaveState()]], [[persistence.ts#subscribeAutosave|subscribeAutosave()]]
- Used in: [[StorageBanner.tsx]]

### StorageManager
*component* · line 38 · exported · note: [[StorageManager|<StorageManager>]]
- Calls: [[StorageManager.tsx]], [[ai-storage.ts#deleteAllStoredModels|deleteAllStoredModels()]], [[ai-storage.ts#deleteStoredModel|deleteStoredModel()]], [[ai-storage.ts#formatBytes|formatBytes()]], [[ai-storage.ts#freeBytes|freeBytes()]], [[ai-storage.ts#requestPersist|requestPersist()]], [[ai-webllm.ts#deleteWebLlmModelId|deleteWebLlmModelId()]], [[format-date.ts#formatTime|formatTime()]], [[persistence.ts#retryAutosaveNow|retryAutosaveNow()]], [[platform/ai.ts#refreshAiStatus|refreshAiStatus()]], [[useAutosaveState|useAutosaveState()]]
- Rendered by: [[AboutDialog|<AboutDialog>]], [[WebLlmSetup|<WebLlmSetup>]]

### useStorageDialog
*store* · line 179 · exported · note: [[useStorageDialog]]
> ---------- the "Browser storage" dialog ----------

### openStorageManager
*function* · line 181 · exported
- Uses: [[useStorageDialog]]
- Writes: [[useStorageDialog/open|useStorageDialog.open]]
- Used in: [[StorageBanner.tsx]]

### StorageDialogHost
*component* · line 185 · exported · note: [[StorageDialogHost|<StorageDialogHost>]]
- Renders: [[Modal|<Modal>]], [[StorageManager|<StorageManager>]]
- Calls: [[useStorageDialog]]
- Reads: [[useStorageDialog/open|useStorageDialog.open]]
- Store actions: [[useStorageDialog/set()|useStorageDialog.set()]]
- Rendered by: [[AiSettingsHost|<AiSettingsHost>]]
