---
id: src/features/ai/AiBits.tsx
type: module
file: src/features/ai/AiBits.tsx
area: features/ai
---

# src/features/ai/AiBits.tsx

*Module* · area [[features - ai|features/ai]] · 129 lines

> Small pieces shown wherever AI help is offered: the set-up button ("Set up AI", the one wording for every set-up prompt; it opens the same AI assistant settings dialog as AI > AI assistant settings), the "what will be sent where" note, the privacy notice and the on-device download progress.

## Imports
- [[react]] · value
- `src/features/ai/ai.css` · side-effect
- [[ai/hooks.ts]] · value
- [[ai-webllm.ts]] · value
- [[platform/ai.ts]] · value
- [[host.ts]] · value

## Imported by
- [[AiFeatureDialogs.tsx]] · value
- [[AiSettingsDialog.tsx]] · value
- [[ExplainPanel.tsx]] · value
- [[AssistantPanel.tsx]] · value
- [[CodingDialog.tsx]] · value
- [[CodingWorkspace.tsx]] · value
- [[AiDialogs.tsx]] · value
- [[RetrievalView.tsx]] · value

## Private helpers
cap() (line 52)

## Symbols

### SET_UP_AI
*const* · line 12 · exported
> The one wording for a contextual set-up prompt (AI not set up yet).
- Used in: [[AiFeatureDialogs.tsx]], [[ExplainPanel.tsx]], [[AssistantPanel.tsx]], [[CodingWorkspace.tsx]]

### AI_SETTINGS_LABEL
*const* · line 14 · exported
> The menu wording of AI > AI assistant settings, used by contextual shortcuts when AI is set up.
- Used in: [[AiFeatureDialogs.tsx]], [[AssistantPanel.tsx]]

### AiSetupButton
*component* · line 16 · exported · note: [[AiSetupButton|<AiSetupButton>]]
- Calls: [[ai/hooks.ts#openAiSettings|openAiSettings()]]
- Uses: [[AiBits.tsx#SET_UP_AI|SET_UP_AI]]
- Rendered by: [[AiGate|<AiGate>]], [[CodingWorkspace|<CodingWorkspace>]]

### AiProviderNote
*component* · line 28 · exported · note: [[AiProviderNote|<AiProviderNote>]]
> Before anything is sent: which provider will receive what, and where it goes. `what` is a phrase like "150 excerpts"; `when` names the button, e.g. "When you click Suggest codes".
- Calls: [[AiBits.tsx]], [[ai-webllm.ts#webLlmChoice|webLlmChoice()]], [[platform/ai.ts#getAiSettings|getAiSettings()]], [[useAiStatus|useAiStatus()]]
- Uses: [[AiBits.tsx#AI_SETTINGS_LABEL|AI_SETTINGS_LABEL]], [[ai/hooks.ts#openAiSettings|openAiSettings()]]
- Reads: [[aiSettings/webllm|aiSettings.webllm]]
- Rendered by: [[AiCodebookDialog|<AiCodebookDialog>]], [[AiSuggestDialog|<AiSuggestDialog>]], [[ExplainPanel|<ExplainPanel>]], [[RetrievalView|<RetrievalView>]]

### AiPrivacyNotice
*component* · line 55 · exported · note: [[AiPrivacyNotice|<AiPrivacyNotice>]]
> Research-ethics privacy notice for a provider.
- Calls: [[platform/ai.ts#providerPrivacy|providerPrivacy()]]
- Rendered by: [[AiSettingsDialog|<AiSettingsDialog>]]

### AiErrorDetails
*component* · line 90 · exported · note: [[AiErrorDetails|<AiErrorDetails>]]
> A "Details" link under an AI error message: shows the diagnostic report (see aiErrorReport in platform/ai-diagnose.ts; it never contains a key) with a Copy details button, for asking for help.
- Calls: [[host.ts#copyToClipboard|copyToClipboard()]]
- Rendered by: [[AssistantMessage|<AssistantMessage>]], [[ExplainPanel|<ExplainPanel>]]

### AiLoadProgress
*component* · line 112 · exported · note: [[AiLoadProgress|<AiLoadProgress>]]
> Download / load progress of the on-device model, shown while a request is waiting for it.
- Calls: [[useWebLlmState|useWebLlmState()]]
- Rendered by: [[AiCodebookDialog|<AiCodebookDialog>]], [[AiSuggestDialog|<AiSuggestDialog>]], [[ExplainPanel|<ExplainPanel>]], [[RetrievalView|<RetrievalView>]]
