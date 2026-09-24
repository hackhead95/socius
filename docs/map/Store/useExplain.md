---
id: "src/features/ai/explainStore.ts#useExplain"
type: store
file: src/features/ai/explainStore.ts
line: 37
area: features/ai
---

# useExplain

*Store* · defined in [[explainStore.ts]] (line 37) · area [[features - ai|features/ai]]

- **Exported:** yes

## Keys and who touches them
| key | written by | read by |
|---|---|---|
| [[panels]] | 4 ([[features.test.ts]], [[close()\|useExplain.close()]], [[open()\|useExplain.open()]], [[run()\|useExplain.run()]]) | 5 |
| [[pendingItemId]] | 2 ([[features.test.ts]], [[setPending()\|useExplain.setPending()]]) | 2 |

## Actions
| action | writes | callers |
|---|---|---|
| [[addToOutput()]] |  | 1 |
| [[close()]] | [[panels]] | 3 |
| [[open()]] | [[panels]] | 4 |
| [[run()]] | [[panels]] | 1 |
| [[setPending()]] | [[pendingItemId]] | 6 |
| [[stop()]] |  | 1 |

## Calls
- [[platform/ai.ts#aiErrorMessage|aiErrorMessage()]]
- [[ai-diagnose.ts#aiErrorReport|aiErrorReport()]]
- [[platform/ai.ts#aiErrorText|aiErrorText()]]
- [[platform/ai.ts#aiPromptBudget|aiPromptBudget()]]
- [[platform/ai.ts#askAI|askAI()]]
- [[explainPrompt.ts#buildExplainPrompt|buildExplainPrompt()]]
- [[platform/ai.ts#getAiStatus|getAiStatus()]]
- [[explainPrompt.ts#plainText|plainText()]]

## Uses
- [[useStore]]

## Reads
- [[outputs|useStore.outputs]] · alias

## Writes
- [[outputs|useStore.outputs]] · setState

## State keys
- [[panels|useExplain.panels]]
- [[pendingItemId|useExplain.pendingItemId]]

## Actions
- [[addToOutput()|useExplain.addToOutput()]]
- [[close()|useExplain.close()]]
- [[open()|useExplain.open()]]
- [[run()|useExplain.run()]]
- [[setPending()|useExplain.setPending()]]
- [[stop()|useExplain.stop()]]

## Creates
- [[text]]

## Called by
- [[ExplainButton|<ExplainButton>]]
- [[ExplainPanel|<ExplainPanel>]]

## Used by
- [[ExplainButton|<ExplainButton>]]
- [[ExplainPanel|<ExplainPanel>]]
- [[ReadyPanel|<ReadyPanel>]]
- [[features.ts#runAiFeature|runAiFeature()]]
- [[features.ts#startExplain|startExplain()]]
- [[features.test.ts]]
