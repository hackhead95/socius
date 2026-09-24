---
id: "cmd:analyze:oneway-anova"
type: command
file: src/app/menus.ts
area: app
---

# Analyze > Compare Means > One-Way ANOVA...

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** Analyze > Compare Means > One-Way ANOVA...
- **Needs a dataset:** yes
- **Generated:** from procedures registry
- **Menu:** Analyze

## Calls store actions
- [[openDialog()|useStore.openDialog()]]

## Opens
- [[procedure/oneway-anova|procedure: oneway-anova]]

## Part of
- [[Compare Means|Analyze > Compare Means]]

## Tested by
- [[quant.spec.ts]] · menu label
- [[search.spec.ts]] · menu label
- [[search.test.ts]] · menu label
