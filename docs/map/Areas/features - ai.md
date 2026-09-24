---
id: "area:features/ai"
type: area
area: features/ai
---

# Area: features/ai

12 files, 2025 lines.

## Depends on (module imports)
- [[platform]]: 24
- [[core]]: 8
- [[features - assistant|features/assistant]]: 2
- [[features - coding|features/coding]]: 2
- [[features - output|features/output]]: 2
- [[ui]]: 2
- [[Areas/app|app]]: 1
- [[features - charts|features/charts]]: 1
- [[features - project|features/project]]: 1

## Used by areas
- [[features - coding|features/coding]]: 10
- [[Areas/app|app]]: 5
- [[features - output|features/output]]: 4
- [[features - assistant|features/assistant]]: 2

## Files
- [[AiBits.tsx]]: Small pieces shown wherever AI help is offered: the set-up button ("Set up AI", the one wording for every set-up prompt; it opens the same A…
- [[AiFeatureDialogs.tsx]]: App-wide AI entry points: the "do this first" dialog, the result picker for Explain a result, and the AI chip in the top bar with its popove…
- [[AiSettingsDialog.tsx]]: "AI assistant" settings: choose where AI help runs (Claude inside the artifact, a model on this computer, Google Gemini with a free key, or …
- [[AiText.tsx]]: Renders an AI reply written in light Markdown (headings, **bold**, "-" and "1." lists) as plain React elements. No HTML from the model is ev…
- [[ConnectionChecklist.tsx]]: The result of AI assistant settings > Test connection: one line per step with a tick or a cross, the plain-English reason and what to do whe…
- [[ExplainPanel.tsx]]: The "Explain with AI" panel under an Output item: first what will be sent and to whom, then the streamed explanation with Stop, Copy, Add to…
- [[explainPrompt.ts]]: "Explain with AI" for Output items: the item as compact text (titles, table numbers and labels, Socius's own summary, APA sentence and warni…
- [[explainStore.ts]]: State of the "Explain with AI" panels on Output items. Kept outside the viewer so a streaming answer survives switching tabs. Nothing is sen…
- [[features.ts]]: The AI features offered app-wide (AI menu, the AI chip in the top bar, the "AI is ready. Try it" panel, the search palette): what each does,…
- [[ai/hooks.ts]]: React bindings for the AI provider layer (src/platform/ai.ts) and the AI settings dialog.
- [[LocalSetup.tsx]]: AI assistant settings > Other service, when the address is a program on this computer (Ollama, LM Studio, or another local OpenAI-compatible…
- [[WebLlmSetup.tsx]]: AI assistant settings > On this computer: whether this browser can run the on-device model (and exactly why not), the model choice, and the …

## Components
[[AiChip|<AiChip>]] · [[AiErrorDetails|<AiErrorDetails>]] · [[AiLoadProgress|<AiLoadProgress>]] · [[AiPrereqDialog|<AiPrereqDialog>]] · [[AiPrivacyNotice|<AiPrivacyNotice>]] · [[AiProviderNote|<AiProviderNote>]] · [[AiSettingsDialog|<AiSettingsDialog>]] · [[AiSettingsHost|<AiSettingsHost>]] · [[AiSetupButton|<AiSetupButton>]] · [[AiText|<AiText>]] · [[ConnectionChecklist|<ConnectionChecklist>]] · [[CopyLine|<CopyLine>]] · [[ExplainPanel|<ExplainPanel>]] · [[ExplainPickDialog|<ExplainPickDialog>]] · [[FeatureButtons|<FeatureButtons>]] · [[FixList|<FixList>]] · [[GeminiSection|<GeminiSection>]] · [[KeyField|<KeyField>]] · [[LocalSetup|<LocalSetup>]] · [[OllamaOriginsFix|<OllamaOriginsFix>]] · [[OpenAiSection|<OpenAiSection>]] · [[ReadyPanel|<ReadyPanel>]] · [[StepIcon|<StepIcon>]] · [[StepRow|<StepRow>]] · [[WebLlmSetup|<WebLlmSetup>]]

## Hooks
[[useAiStatus|useAiStatus()]] · [[useWebLlmState|useWebLlmState()]]

## Stores
[[useAiSettingsDialog]] · [[useExplain]]
