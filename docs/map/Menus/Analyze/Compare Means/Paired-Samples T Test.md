---
id: "cmd:analyze:ttest-paired"
type: command
file: src/app/menus.ts
area: app
---

# Analyze > Compare Means > Paired-Samples T Test...

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** Analyze > Compare Means > Paired-Samples T Test...
- **Needs a dataset:** yes
- **Generated:** from procedures registry
- **Menu:** Analyze

## Calls store actions
- [[openDialog()|useStore.openDialog()]]

## Opens
- [[procedure/ttest-paired|procedure: ttest-paired]]

## Part of
- [[Compare Means|Analyze > Compare Means]]

## Tested by
- [[search.test.ts]] · menu label
