---
id: src/features/assistant/AssistantPanel.tsx
type: module
file: src/features/assistant/AssistantPanel.tsx
area: features/assistant
---

# src/features/assistant/AssistantPanel.tsx

*Module* · area [[features - assistant|features/assistant]] · 534 lines

> The assistant panel: header (provider, what it can see, clear, close), the conversation with activity traces and action cards, the composer, and the privacy line.

## Imports
- [[react]] · value
- [[store.ts]] · value
- [[AiBits.tsx]] · value
- [[ai/hooks.ts]] · value
- [[chat-store.ts]] · value
- [[controller.ts]] · value
- [[assistant/icons.tsx]] · value
- [[Markdown.tsx]] · value
- [[open.ts]] · value
- [[starters.ts]] · value
- [[assistant/types.ts]] · type-only
- [[zustand]] · value

## Imported by
- [[AssistantRoot.tsx]] · value

## Private helpers
MIN_W (line 16) · maxWidth() (line 18) · stepClass() (line 250)

## Symbols

### AssistantPanel
*component* · line 22 · exported · note: [[AssistantPanel|<AssistantPanel>]]
- Renders: [[AsIcon|<AsIcon>]], [[Components/Empty|<Empty>]], [[Composer|<Composer>]], [[Entry|<Entry>]], [[ResizeHandle|<ResizeHandle>]], [[SeeMenu|<SeeMenu>]]
- Calls: [[AssistantPanel.tsx]], [[useAiStatus|useAiStatus()]], [[useAssistantChat]]
- Uses: [[AiBits.tsx#SET_UP_AI|SET_UP_AI]], [[ai/hooks.ts#openAiSettings|openAiSettings()]], [[useAssistantChat]]
- Reads: [[entries|useAssistantChat.entries]], [[running|useAssistantChat.running]], [[width|useAssistantChat.width]]
- Store actions: [[clear()|useAssistantChat.clear()]]
- Rendered by: [[AssistantRoot|<AssistantRoot>]]

### ResizeHandle
*component* · line 118 · note: [[ResizeHandle|<ResizeHandle>]]
- Calls: [[AssistantPanel.tsx]], [[useAssistantChat]]
- Uses: [[AssistantPanel.tsx]]
- Reads: [[width|useAssistantChat.width]]
- Store actions: [[setWidth()|useAssistantChat.setWidth()]]

### SeeMenu
*component* · line 157 · note: [[SeeMenu|<SeeMenu>]]
- Calls: [[useAssistantChat]]
- Reads: [[permissions|useAssistantChat.permissions]]
- Store actions: [[setPermission()|useAssistantChat.setPermission()]]

### Empty
*component* · line 193 · note: [[Components/Empty|<Empty>]]
- Calls: [[controller.ts#sendMessage|sendMessage()]], [[starters.ts#starterPrompts|starterPrompts()]], [[useStore]]
- Uses: [[AiBits.tsx#SET_UP_AI|SET_UP_AI]], [[ai/hooks.ts#openAiSettings|openAiSettings()]], [[useAssistantChat]], [[useAssistantUiNeedsSetup]]
- Reads: [[dataset|useStore.dataset]], [[outputs|useStore.outputs]], [[useStore/coding|useStore.coding]], [[useStore/tab|useStore.tab]]
- Writes: [[show|useAssistantUiNeedsSetup.show]]
- Store actions: [[setDraft()|useAssistantChat.setDraft()]]

### Entry
*component* · line 238 · note: [[Entry|<Entry>]]
- Renders: [[AssistantMessage|<AssistantMessage>]]

### AssistantMessage
*component* · line 254 · note: [[AssistantMessage|<AssistantMessage>]]
- Renders: [[AiActivityLine|<AiActivityLine>]], [[AiErrorDetails|<AiErrorDetails>]], [[ArtifactCard|<ArtifactCard>]], [[AsIcon|<AsIcon>]], [[Markdown|<Markdown>]], [[Typing|<Typing>]]
- Calls: [[AssistantPanel.tsx]], [[controller.ts#copyAnswer|copyAnswer()]], [[controller.ts#retryLast|retryLast()]]
- Uses: [[AiBits.tsx#AI_SETTINGS_LABEL|AI_SETTINGS_LABEL]], [[ai/hooks.ts#openAiSettings|openAiSettings()]]

### Typing
*component* · line 344 · note: [[Typing|<Typing>]]

### ArtifactCard
*component* · line 354 · note: [[ArtifactCard|<ArtifactCard>]]
- Renders: [[AsIcon|<AsIcon>]], [[ProposalCard|<ProposalCard>]]
- Calls: [[controller.ts#runArtifact|runArtifact()]]

### ProposalCard
*component* · line 381 · note: [[ProposalCard|<ProposalCard>]]
- Renders: [[AsIcon|<AsIcon>]]
- Calls: [[controller.ts#dismissArtifact|dismissArtifact()]], [[controller.ts#runArtifact|runArtifact()]]

### useAssistantUiNeedsSetup
*store* · line 454 · note: [[useAssistantUiNeedsSetup]]
> "Set up AI first" under the composer, shown when a question is sent before AI is set up.

### Composer
*component* · line 456 · note: [[Composer|<Composer>]]
- Renders: [[AsIcon|<AsIcon>]]
- Calls: [[controller.ts#sendMessage|sendMessage()]], [[useAssistantChat]], [[useAssistantUiNeedsSetup]], [[useStore]]
- Uses: [[AiBits.tsx#SET_UP_AI|SET_UP_AI]], [[ai/hooks.ts#openAiSettings|openAiSettings()]], [[controller.ts#stopAssistant|stopAssistant()]], [[useAssistantChat]], [[useAssistantUiNeedsSetup]]
- Reads: [[dataset|useStore.dataset]], [[draft|useAssistantChat.draft]], [[outputs|useStore.outputs]], [[running|useAssistantChat.running]], [[show|useAssistantUiNeedsSetup.show]], [[useAssistantChat/focusOutputId|useAssistantChat.focusOutputId]]
- Writes: [[show|useAssistantUiNeedsSetup.show]]
- Store actions: [[setDraft()|useAssistantChat.setDraft()]], [[setFocusOutput()|useAssistantChat.setFocusOutput()]]

### currentContext
*function* · line 531 · exported
> For tests and callers: the current context the panel would send (no request is made).
- Calls: [[controller.ts#appSnapshot|appSnapshot()]]
- Uses: [[useAssistantChat]], [[useAssistantUi]]
- Reads: [[permissions|useAssistantChat.permissions]], [[useAssistantUi/open|useAssistantUi.open]]
