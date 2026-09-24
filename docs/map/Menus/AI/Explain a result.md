---
id: "cmd:ai:ai-explain"
type: command
file: src/app/menus.ts
area: app
---

# AI > Explain a result...

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** AI > Explain a result...
- **Menu:** AI

## Calls
- [[features.ts#runAiFeature|runAiFeature()]] · ("explain")

## Writes
- [[intent|useAiSettingsDialog.intent]] · runAiFeature
- [[useAiSettingsDialog/open|useAiSettingsDialog.open]] · runAiFeature

## Calls store actions
- [[open()|useExplain.open()]] · runAiFeature
- [[setPending()|useExplain.setPending()]] · runAiFeature
- [[openDialog()|useStore.openDialog()]] · runAiFeature
- [[setTab()|useStore.setTab()]] · runAiFeature
- [[focusOutput()|useUi.focusOutput()]] · runAiFeature

## Opens
- [[ai-explain-pick|custom: ai-explain-pick]] · runAiFeature
- [[ai-prereq|custom: ai-prereq]] · runAiFeature

## Part of
- [[AI]]

## Tested by
- [[ai-features.spec.ts]] · menu label
- [[features.test.ts]] · menu label
- [[palette.test.tsx]] · menu label
- [[search.test.ts]] · menu label

## Suggested by
- [[CommandPalette.tsx#SUGGESTED|SUGGESTED]]
