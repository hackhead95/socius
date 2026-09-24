---
id: "cmd:ai:ai-summarise"
type: command
file: src/app/menus.ts
area: app
---

# AI > Summarise a code...

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** AI > Summarise a code...
- **Menu:** AI

## Calls
- [[features.ts#runAiFeature|runAiFeature()]] · ("summarise")

## Writes
- [[intent|useAiSettingsDialog.intent]] · runAiFeature
- [[useAiSettingsDialog/open|useAiSettingsDialog.open]] · runAiFeature
- [[selectedCodeId|useCodingUi.selectedCodeId]] · runAiFeature
- [[useCodingUi/view|useCodingUi.view]] · runAiFeature

## Calls store actions
- [[useCodingUi/set()|useCodingUi.set()]] · runAiFeature
- [[openDialog()|useStore.openDialog()]] · runAiFeature
- [[setTab()|useStore.setTab()]] · runAiFeature

## Opens
- [[ai-prereq|custom: ai-prereq]] · runAiFeature

## Part of
- [[AI]]

## Tested by
- [[ai-features.spec.ts]] · menu label
- [[features.test.ts]] · menu label
