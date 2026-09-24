---
id: "src/features/assistant/open.ts#useAssistantUi"
type: store
file: src/features/assistant/open.ts
line: 20
area: features/assistant
---

# useAssistantUi

*Store* · defined in [[open.ts]] (line 20) · area [[features - assistant|features/assistant]]

- **Exported:** yes

## Keys and who touches them
| key | written by | read by |
|---|---|---|
| [[useAssistantUi/open\|open]] | 8 ([[Features/assistant\|Ask the Socius assistant]], [[Ask the Socius assistant\|AI > Ask the Socius assistant...]], [[features.test.ts]], [[palette.test.tsx]], …) | 4 |
| [[request]] | 6 ([[Features/assistant\|Ask the Socius assistant]], [[Ask the Socius assistant\|AI > Ask the Socius assistant...]], [[features.test.ts]], [[palette.test.tsx]], …) | 2 |

## Actions
| action | writes | callers |
|---|---|---|
| [[consumeRequest()]] | [[request]] | 1 |
| [[setOpen()]] | [[useAssistantUi/open\|open]] | 1 |

## State keys
- [[useAssistantUi/open|useAssistantUi.open]]
- [[request|useAssistantUi.request]]

## Actions
- [[consumeRequest()|useAssistantUi.consumeRequest()]]
- [[setOpen()|useAssistantUi.setOpen()]]

## Called by
- [[AssistantRoot|<AssistantRoot>]]

## Used by
- [[AssistantRoot|<AssistantRoot>]]
- [[open.ts#closeAssistant|closeAssistant()]]
- [[AssistantPanel.tsx#currentContext|currentContext()]]
- [[open.ts#openAssistant|openAssistant()]]
- [[features.test.ts]]
- [[palette.test.tsx]] · whole-state
- [[open.ts#toggleAssistant|toggleAssistant()]]
