---
id: "ai-feature:explain"
type: ai-feature
file: src/features/ai/features.ts
area: features/ai
---

# Explain a result

*AI feature* · defined in [[features.ts]] · area [[features - ai|features/ai]]

- **Does:** explains one result from the Output tab in plain language: what was tested, what the numbers mean, whether the warnings matter and how to report it.
- **Menu label:** Explain a result...

## Calls
- [[features.ts#explainableOutputs|explainableOutputs()]]
- [[features.ts#startExplain|startExplain()]]

## Calls store actions
- [[open()|useExplain.open()]]
- [[setPending()|useExplain.setPending()]]
- [[openDialog()|useStore.openDialog()]]
- [[setTab()|useStore.setTab()]]
- [[focusOutput()|useUi.focusOutput()]]

## Opens
- [[ai-explain-pick|custom: ai-explain-pick]]

## Started by
- [[features.ts#runAiFeature|runAiFeature()]]
