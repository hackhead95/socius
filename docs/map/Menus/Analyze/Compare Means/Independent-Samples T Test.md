---
id: "cmd:analyze:ttest-independent"
type: command
file: src/app/menus.ts
area: app
---

# Analyze > Compare Means > Independent-Samples T Test...

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** Analyze > Compare Means > Independent-Samples T Test...
- **Needs a dataset:** yes
- **Generated:** from procedures registry
- **Menu:** Analyze

## Calls store actions
- [[openDialog()|useStore.openDialog()]]

## Opens
- [[procedure/ttest-independent|procedure: ttest-independent]]

## Part of
- [[Compare Means|Analyze > Compare Means]]

## Tested by
- [[assistant.spec.ts]] · menu label
- [[quant.spec.ts]] · menu label
- [[search.spec.ts]] · menu label
- [[search.test.ts]] · menu label
