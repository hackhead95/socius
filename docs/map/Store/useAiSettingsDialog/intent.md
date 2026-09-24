---
id: "store-key:useAiSettingsDialog.intent"
type: store-key
file: src/features/ai/hooks.ts
line: 21
area: features/ai
---

# useAiSettingsDialog.intent

*Store state key* · defined in [[ai/hooks.ts]] (line 21) · area [[features - ai|features/ai]]

> The AI feature the user tried to use before AI was set up (explained at the top of the dialog).

- **Store:** useAiSettingsDialog

## Read by
- [[AiSettingsHost|<AiSettingsHost>]] · selector

## Written by
- [[Explain a result|AI > Explain a result...]] · runAiFeature
- [[Suggest a codebook|AI > Suggest a codebook...]] · runAiFeature
- [[Suggest codes for open-ended answers|AI > Suggest codes for open-ended answers...]] · runAiFeature
- [[Summarise a code|AI > Summarise a code...]] · runAiFeature
- [[ai/hooks.ts#openAiSettings|openAiSettings()]] · setState
- [[features.test.ts]] · setState
- [[useAiSettingsDialog/set()|useAiSettingsDialog.set()]]

## Store
- [[useAiSettingsDialog]]
