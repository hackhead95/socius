---
id: src/app/Welcome.tsx
type: module
file: src/app/Welcome.tsx
area: app
---

# src/app/Welcome.tsx

*Module* · area [[Areas/app|app]] · 121 lines

> Welcome screen (no dataset open) and the sample-data banner.

## Imports
- [[react]] · value
- [[ui-store.ts]] · value
- [[store.ts]] · value
- [[fileActions.ts]] · value
- [[persistence.ts]] · value
- [[samples/index.ts]] · value
- [[Icon.tsx]] · value

## Tested by
- [[shell-fixes.test.ts]] · import

## Imported by
- [[App.tsx]] · value
- [[shell-fixes.test.ts]] · value

## Private helpers
TAB_NAMES (line 10)

## Symbols

### backTarget
*function* · line 13 · exported
> What "Back" returns to from the start screen, or null when nothing is open.
- Uses: [[Welcome.tsx]]
- Used in: [[shell-fixes.test.ts]]

### Welcome
*component* · line 24 · exported · note: [[Welcome (app-Welcome)|<Welcome>]]
> The start screen: shown when nothing is open, and over open work when the Socius logo (Home) is clicked, with a way back.
- Renders: [[Icon|<Icon>]]
- Calls: [[Welcome.tsx#backTarget|backTarget()]], [[fileActions.ts#loadSample|loadSample()]], [[fileActions.ts#newDataset|newDataset()]], [[fileActions.ts#openDataFile|openDataFile()]], [[fileActions.ts#openProjectFile|openProjectFile()]], [[fileActions.ts#openRecentProject|openRecentProject()]], [[persistence.ts#listRecent|listRecent()]], [[useStore]], [[useUi]]
- Uses: [[samples/index.ts#samples|samples]], [[useUi]]
- Reads: [[dataset|useStore.dataset]], [[home (store-key)|useUi.home]]
- Store actions: [[openDialog()|useStore.openDialog()]], [[setHome()|useUi.setHome()]]
- Opens: [[getting-started|custom: getting-started]]
- Rendered by: [[Components/App|<App>]]

### SampleBanner
*component* · line 106 · exported · note: [[Components/SampleBanner|<SampleBanner>]]
- Renders: [[Icon|<Icon>]]
- Calls: [[fileActions.ts#openDataFile|openDataFile()]], [[useStore]], [[useUi]]
- Reads: [[dataset|useStore.dataset]], [[useUi/sampleBanner|useUi.sampleBanner]]
- Store actions: [[setSampleBanner()|useUi.setSampleBanner()]]
- Rendered by: [[Components/App|<App>]]
