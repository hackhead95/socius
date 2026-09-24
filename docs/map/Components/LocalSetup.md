---
id: "src/features/ai/LocalSetup.tsx#LocalSetup"
type: component
file: src/features/ai/LocalSetup.tsx
line: 130
area: features/ai
---

# <LocalSetup>

*React component* · defined in [[LocalSetup.tsx]] (line 130) · area [[features - ai|features/ai]]

> Set-up steps and the guided connection check for a program on this computer.

- **Exported:** yes

## Calls
- [[ai-local.ts#addressAdvice|addressAdvice()]]
- [[host.ts#copyToClipboard|copyToClipboard()]]
- [[ai-local.ts#detectBrowser|detectBrowser()]]
- [[platform/ai.ts#getAiSettings|getAiSettings()]]
- [[ai-local.ts#localDiagnostics|localDiagnostics()]]
- [[ai-local.ts#localKind|localKind()]]
- [[ai-local.ts#runLocalCheck|runLocalCheck()]]
- [[platform/ai.ts#saveAiSettings|saveAiSettings()]]

## Renders
- [[StepRow|<StepRow>]]

## Uses
- [[ai-local.ts#SAFARI_LOCAL_BLOCKED|SAFARI_LOCAL_BLOCKED]]
- [[ai-local.ts#STEP_TITLES|STEP_TITLES]]

## Reads
- [[aiSettings/openai|aiSettings.openai]] · getter

## Writes
- [[aiSettings/openai|aiSettings.openai]] · setter

## Rendered by
- [[OpenAiSection|<OpenAiSection>]]
