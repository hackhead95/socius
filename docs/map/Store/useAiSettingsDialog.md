---
id: "src/features/ai/hooks.ts#useAiSettingsDialog"
type: store
file: src/features/ai/hooks.ts
line: 26
area: features/ai
---

# useAiSettingsDialog

*Store* · defined in [[ai/hooks.ts]] (line 26) · area [[features - ai|features/ai]]

> The AI assistant settings dialog, rendered once by the app shell above every other dialog.

- **Exported:** yes

## Keys and who touches them
| key | written by | read by |
|---|---|---|
| [[intent]] | 7 ([[Suggest a codebook\|AI > Suggest a codebook...]], [[Explain a result\|AI > Explain a result...]], [[Suggest codes for open-ended answers\|AI > Suggest codes for open-ended answers...]], [[Summarise a code\|AI > Summarise a code...]], …) | 1 |
| [[useAiSettingsDialog/open\|open]] | 7 ([[Suggest a codebook\|AI > Suggest a codebook...]], [[Explain a result\|AI > Explain a result...]], [[Suggest codes for open-ended answers\|AI > Suggest codes for open-ended answers...]], [[Summarise a code\|AI > Summarise a code...]], …) | 2 |

## Actions
| action | writes | callers |
|---|---|---|
| [[useAiSettingsDialog/set()\|set()]] | [[intent]], [[useAiSettingsDialog/open\|open]] | 1 |

## State keys
- [[intent|useAiSettingsDialog.intent]]
- [[useAiSettingsDialog/open|useAiSettingsDialog.open]]

## Actions
- [[useAiSettingsDialog/set()|useAiSettingsDialog.set()]]

## Called by
- [[AiSettingsHost|<AiSettingsHost>]]

## Used by
- [[ai/hooks.ts#openAiSettings|openAiSettings()]]
- [[features.test.ts]] · whole-state
