---
id: src/features/ai/ConnectionChecklist.tsx
type: module
file: src/features/ai/ConnectionChecklist.tsx
area: features/ai
---

# src/features/ai/ConnectionChecklist.tsx

*Module* · area [[features - ai|features/ai]] · 133 lines

> The result of AI assistant settings > Test connection: one line per step with a tick or a cross, the plain-English reason and what to do when a step fails, a model picker when an online service does not offer the typed model, and "Copy details" (a report for support that never contains the key).

## Imports
- [[react]] · value
- `src/features/ai/ai.css` · side-effect
- [[ai-diagnose.ts]] · value
- [[host.ts]] · value

## Imported by
- [[AiSettingsDialog.tsx]] · value

## Private helpers
STATE_WORDS (line 9)

## Symbols

### StepIcon
*component* · line 18 · note: [[StepIcon|<StepIcon>]]

### ConnectionChecklist
*component* · line 67 · exported · note: [[ConnectionChecklist|<ConnectionChecklist>]]
> The step list, the failure explanation and the support report.
- Renders: [[StepIcon|<StepIcon>]]
- Calls: [[ai-diagnose.ts#connectionReport|connectionReport()]], [[host.ts#copyToClipboard|copyToClipboard()]]
- Uses: [[ConnectionChecklist.tsx]]
- Rendered by: [[AiSettingsDialog|<AiSettingsDialog>]]
