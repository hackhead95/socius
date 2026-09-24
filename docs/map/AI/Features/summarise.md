---
id: "ai-feature:summarise"
type: ai-feature
file: src/features/ai/features.ts
area: features/ai
---

# Summarise a code

*AI feature* · defined in [[features.ts]] · area [[features - ai|features/ai]]

- **Does:** drafts a short summary of the passages coded with one code, for you to check against the quotes.
- **Menu label:** Summarise a code...

## Writes
- [[selectedCodeId|useCodingUi.selectedCodeId]]
- [[useCodingUi/view|useCodingUi.view]]

## Calls store actions
- [[useCodingUi/set()|useCodingUi.set()]]
- [[setTab()|useStore.setTab()]]
- [[toast()|useStore.toast()]]

## Started by
- [[features.ts#runAiFeature|runAiFeature()]]
