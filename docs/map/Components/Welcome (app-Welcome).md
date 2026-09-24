---
id: "src/app/Welcome.tsx#Welcome"
type: component
file: src/app/Welcome.tsx
line: 24
area: app
---

# <Welcome>

*React component* · defined in [[Welcome.tsx]] (line 24) · area [[Areas/app|app]]

> The start screen: shown when nothing is open, and over open work when the Socius logo (Home) is clicked, with a way back.

- **Exported:** yes

## Calls
- [[Welcome.tsx#backTarget|backTarget()]]
- [[persistence.ts#listRecent|listRecent()]]
- [[fileActions.ts#loadSample|loadSample()]]
- [[fileActions.ts#newDataset|newDataset()]]
- [[fileActions.ts#openDataFile|openDataFile()]]
- [[fileActions.ts#openProjectFile|openProjectFile()]]
- [[fileActions.ts#openRecentProject|openRecentProject()]]
- [[useStore]]
- [[useUi]]

## Renders
- [[Icon|<Icon>]]

## Uses
- [[samples/index.ts#samples|samples]]
- [[useUi]]

## Reads
- [[dataset|useStore.dataset]] · selector
- [[home (store-key)|useUi.home]] · selector

## Calls store actions
- [[openDialog()|useStore.openDialog()]] · selector
- [[setHome()|useUi.setHome()]] · getState

## Opens
- [[getting-started|custom: getting-started]]

## Rendered by
- [[Components/App|<App>]]
