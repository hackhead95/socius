---
id: "ai-feature:codebook"
type: ai-feature
file: src/features/ai/features.ts
area: features/ai
---

# Suggest a codebook

*AI feature* · defined in [[features.ts]] · area [[features - ai|features/ai]]

- **Does:** reads a sample of your interviews or open-ended answers and proposes codes with definitions and example quotes, for you to review.
- **Menu label:** Suggest a codebook...

## Calls store actions
- [[openDialog()|useStore.openDialog()]]
- [[setTab()|useStore.setTab()]]

## Opens
- [[ai-codebook|coding: ai-codebook]]

## Started by
- [[features.ts#runAiFeature|runAiFeature()]]
