---
id: "src/features/ai/AiSettingsDialog.tsx#AiSettingsHost"
type: component
file: src/features/ai/AiSettingsDialog.tsx
line: 50
area: features/ai
---

# <AiSettingsHost>

*React component* · defined in [[AiSettingsDialog.tsx]] (line 50) · area [[features - ai|features/ai]]

> Rendered once by the app shell: the AI settings dialog, the Browser storage dialog and the "storage is full, autosave is paused" banner (all three are about this browser's AI and storage set-up).

- **Exported:** yes

## Calls
- [[features.ts#isAiFeatureId|isAiFeatureId()]]
- [[useAiSettingsDialog]]

## Renders
- [[AiSettingsDialog|<AiSettingsDialog>]]
- [[StorageDialogHost|<StorageDialogHost>]]
- [[StorageFullBanner|<StorageFullBanner>]]

## Reads
- [[intent|useAiSettingsDialog.intent]] · selector
- [[useAiSettingsDialog/open|useAiSettingsDialog.open]] · selector

## Calls store actions
- [[useAiSettingsDialog/set()|useAiSettingsDialog.set()]] · selector

## Rendered by
- [[Components/App|<App>]]
