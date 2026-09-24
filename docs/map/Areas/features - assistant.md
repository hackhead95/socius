---
id: "area:features/assistant"
type: area
area: features/assistant
---

# Area: features/assistant

9 files, 1374 lines.

## Depends on (module imports)
- [[lib - assistant|lib/assistant]]: 9
- [[core]]: 5
- [[platform]]: 5
- [[features - ai|features/ai]]: 2
- [[lib - coding|lib/coding]]: 1

## Used by areas
- [[Areas/app|app]]: 2
- [[features - ai|features/ai]]: 2

## Files
- [[AssistantPanel.tsx]]: The assistant panel: header (provider, what it can see, clear, close), the conversation with activity traces and action cards, the composer,…
- [[AssistantRoot.tsx]]: Mounted once by the app shell: the floating Assistant button, the panel, the Ctrl+J / Cmd+J shortcut, and requests from other features (open…
- [[chat-store.ts]]: Conversation state for the assistant panel. Kept in memory for the browser session (it survives closing the panel and switching tabs, not a …
- [[controller.ts]]: What the panel's buttons do: send a message through the agent, stop, retry, apply what the assistant proposed. Reads the live app store at t…
- [[assistant/icons.tsx]]: Stroke icons for the assistant (16px grid, currentColor).
- [[markdown.ts]]: A small Markdown parser for assistant answers: headings, paragraphs, bold/italic, inline code, links (http, https and mailto only), bullet a…
- [[Markdown.tsx]]: Renders parsed Markdown as React elements (never as HTML strings).
- [[open.ts]]: Entry point for the Socius assistant panel (owned by the assistant module). Other features call openAssistant() to show the panel, optionall…
- [[starters.ts]]: Context-aware starter prompts for an empty conversation.

## Components
[[ArtifactCard|<ArtifactCard>]] · [[AsIcon|<AsIcon>]] · [[AssistantMessage|<AssistantMessage>]] · [[AssistantPanel|<AssistantPanel>]] · [[AssistantRoot|<AssistantRoot>]] · [[Composer|<Composer>]] · [[Components/Empty|<Empty>]] · [[Entry|<Entry>]] · [[Markdown|<Markdown>]] · [[ProposalCard|<ProposalCard>]] · [[ResizeHandle|<ResizeHandle>]] · [[SeeMenu|<SeeMenu>]] · [[Typing|<Typing>]]

## Stores
[[useAssistantChat]] · [[useAssistantUi]]
