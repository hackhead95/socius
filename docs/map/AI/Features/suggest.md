---
id: "ai-feature:suggest"
type: ai-feature
file: src/features/ai/features.ts
area: features/ai
---

# Suggest codes for open-ended answers

*AI feature* · defined in [[features.ts]] · area [[features - ai|features/ai]]

- **Does:** applies your codebook to open-ended survey answers and suggests codes for each answer, which you accept or reject.
- **Menu label:** Suggest codes for open-ended answers...

## Calls store actions
- [[openDialog()|useStore.openDialog()]]
- [[setTab()|useStore.setTab()]]

## Opens
- [[ai-suggest|coding: ai-suggest]]

## Started by
- [[features.ts#runAiFeature|runAiFeature()]]
