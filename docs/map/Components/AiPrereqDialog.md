---
id: "src/features/ai/AiFeatureDialogs.tsx#AiPrereqDialog"
type: component
file: src/features/ai/AiFeatureDialogs.tsx
line: 64
area: features/ai
---

# <AiPrereqDialog>

*React component* · defined in [[AiFeatureDialogs.tsx]] (line 64) · area [[features - ai|features/ai]]

> "Explain a result needs a result first" and similar: what to do before an AI feature can start.

- **Exported:** yes

## Calls
- [[features.ts#aiFeature|aiFeature()]]
- [[features.ts#aiFeatureBlocker|aiFeatureBlocker()]]
- [[features.ts#currentAiContext|currentAiContext()]]
- [[AiFeatureDialogs.tsx#doAction|doAction()]]
- [[features.ts#isAiFeatureId|isAiFeatureId()]]
- [[features.ts#runAiFeature|runAiFeature()]]
- [[useStore]]

## Renders
- [[Modal|<Modal>]]

## Reads
- [[useStore/coding|useStore.coding]] · selector
- [[outputs|useStore.outputs]] · selector

## Rendered by
- [[DialogHost|<DialogHost>]]

## Renders
- [[ai-prereq|custom: ai-prereq]]
