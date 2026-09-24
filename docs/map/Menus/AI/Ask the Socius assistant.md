---
id: "cmd:ai:ai-assistant"
type: command
file: src/app/menus.ts
area: app
---

# AI > Ask the Socius assistant...

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** AI > Ask the Socius assistant...
- **Shortcut:** Mod+J
- **Menu:** AI

## Calls
- [[features.ts#runAiFeature|runAiFeature()]] · ("assistant")

## Writes
- [[useAssistantUi/open|useAssistantUi.open]] · runAiFeature
- [[request|useAssistantUi.request]] · runAiFeature

## Part of
- [[AI]]

## Tested by
- [[ai-features.spec.ts]] · menu label
- [[features.test.ts]] · menu label
- [[search.test.ts]] · menu label

## Documents shortcut
- [[Mod+J]] · AI > Ask the Socius assistant...

## Suggested by
- [[CommandPalette.tsx#SUGGESTED|SUGGESTED]]
