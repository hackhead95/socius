---
id: "cmd:ai:ai-codebook"
type: command
file: src/app/menus.ts
area: app
---

# AI > Suggest a codebook...

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** AI > Suggest a codebook...
- **Menu:** AI

## Calls
- [[features.ts#runAiFeature|runAiFeature()]] · ("codebook")

## Writes
- [[intent|useAiSettingsDialog.intent]] · runAiFeature
- [[useAiSettingsDialog/open|useAiSettingsDialog.open]] · runAiFeature

## Calls store actions
- [[openDialog()|useStore.openDialog()]] · runAiFeature
- [[setTab()|useStore.setTab()]] · runAiFeature

## Opens
- [[ai-codebook|coding: ai-codebook]] · runAiFeature
- [[ai-prereq|custom: ai-prereq]] · runAiFeature

## Part of
- [[AI]]

## Tested by
- [[ai-features.spec.ts]] · menu label
- [[ai.spec.ts]] · menu label
- [[qual.spec.ts]] · menu label
- [[features.test.ts]] · menu label
- [[navigation-audit.test.tsx]] · menu label
- [[search.test.ts]] · menu label
