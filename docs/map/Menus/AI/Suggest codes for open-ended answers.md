---
id: "cmd:ai:ai-suggest"
type: command
file: src/app/menus.ts
area: app
---

# AI > Suggest codes for open-ended answers...

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** AI > Suggest codes for open-ended answers...
- **Menu:** AI

## Calls
- [[features.ts#runAiFeature|runAiFeature()]] · ("suggest")

## Writes
- [[intent|useAiSettingsDialog.intent]] · runAiFeature
- [[useAiSettingsDialog/open|useAiSettingsDialog.open]] · runAiFeature

## Calls store actions
- [[openDialog()|useStore.openDialog()]] · runAiFeature
- [[setTab()|useStore.setTab()]] · runAiFeature

## Opens
- [[ai-suggest|coding: ai-suggest]] · runAiFeature
- [[ai-prereq|custom: ai-prereq]] · runAiFeature

## Part of
- [[AI]]

## Tested by
- [[ai-features.spec.ts]] · menu label
- [[ai.spec.ts]] · menu label
- [[qual.spec.ts]] · menu label
- [[features.test.ts]] · menu label
