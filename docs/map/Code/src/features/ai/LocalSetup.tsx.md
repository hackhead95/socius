---
id: src/features/ai/LocalSetup.tsx
type: module
file: src/features/ai/LocalSetup.tsx
area: features/ai
---

# src/features/ai/LocalSetup.tsx

*Module* · area [[features - ai|features/ai]] · 249 lines

> AI assistant settings > Other service, when the address is a program on this computer (Ollama, LM Studio, or another local OpenAI-compatible server): set-up steps for this operating system and website, and a Test connection that checks each step in turn (running? allows this website? browser permission? model installed? answered?) and says how to fix the one that failed. The checking logic is i...

## Imports
- [[react]] · value
- `src/features/ai/ai-local.css` · side-effect
- [[ai-local.ts]] · value
- [[platform/ai.ts]] · value
- [[host.ts]] · value

## Calls
- [[ai-local.ts#lmStudioCorsFix|lmStudioCorsFix()]]
- [[ai-local.ts#pullCommand|pullCommand()]]
- [[ai-local.ts#siteOrigin|siteOrigin()]]

## Imported by
- [[AiSettingsDialog.tsx]] · value

## Private helpers
STATUS_LABEL (line 74) · setupSteps() (line 93)

## Symbols

### CopyLine
*component* · line 17 · exported · note: [[CopyLine|<CopyLine>]]
> A command or value with a Copy button.
- Calls: [[host.ts#copyToClipboard|copyToClipboard()]]

### FixList
*component* · line 34 · note: [[FixList|<FixList>]]
- Renders: [[CopyLine|<CopyLine>]]

### OllamaOriginsFix
*component* · line 48 · exported · note: [[OllamaOriginsFix|<OllamaOriginsFix>]]
> How to let Ollama accept this website, with a switch between Windows, macOS and Linux.
- Renders: [[FixList|<FixList>]]
- Calls: [[ai-local.ts#detectOs|detectOs()]], [[ai-local.ts#ollamaOriginsFix|ollamaOriginsFix()]], [[ai-local.ts#siteOrigin|siteOrigin()]]

### StepRow
*component* · line 76 · note: [[StepRow|<StepRow>]]
- Renders: [[FixList|<FixList>]], [[OllamaOriginsFix|<OllamaOriginsFix>]]
- Uses: [[LocalSetup.tsx]]

### LocalSetup
*component* · line 130 · exported · note: [[LocalSetup|<LocalSetup>]]
> Set-up steps and the guided connection check for a program on this computer.
- Renders: [[StepRow|<StepRow>]]
- Calls: [[LocalSetup.tsx]], [[ai-local.ts#addressAdvice|addressAdvice()]], [[ai-local.ts#detectBrowser|detectBrowser()]], [[ai-local.ts#localDiagnostics|localDiagnostics()]], [[ai-local.ts#localKind|localKind()]], [[ai-local.ts#runLocalCheck|runLocalCheck()]], [[host.ts#copyToClipboard|copyToClipboard()]], [[platform/ai.ts#getAiSettings|getAiSettings()]], [[platform/ai.ts#saveAiSettings|saveAiSettings()]]
- Uses: [[ai-local.ts#SAFARI_LOCAL_BLOCKED|SAFARI_LOCAL_BLOCKED]], [[ai-local.ts#STEP_TITLES|STEP_TITLES]]
- Reads: [[aiSettings/openai|aiSettings.openai]]
- Writes: [[aiSettings/openai|aiSettings.openai]]
- Rendered by: [[OpenAiSection|<OpenAiSection>]]
