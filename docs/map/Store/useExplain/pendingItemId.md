---
id: "store-key:useExplain.pendingItemId"
type: store-key
file: src/features/ai/explainStore.ts
line: 25
area: features/ai
---

# useExplain.pendingItemId

*Store state key* · defined in [[explainStore.ts]] (line 25) · area [[features - ai|features/ai]]

> Item the user wanted explained before AI was set up (continued after set-up).

- **Store:** useExplain

## Read by
- [[features.ts#runAiFeature|runAiFeature()]] · getState
- [[features.test.ts]] · getState

## Written by
- [[features.test.ts]] · setState
- [[setPending()|useExplain.setPending()]]

## Store
- [[useExplain]]
