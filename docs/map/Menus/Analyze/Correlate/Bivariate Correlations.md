---
id: "cmd:analyze:correlations"
type: command
file: src/app/menus.ts
area: app
---

# Analyze > Correlate > Bivariate Correlations...

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** Analyze > Correlate > Bivariate Correlations...
- **Needs a dataset:** yes
- **Generated:** from procedures registry
- **Menu:** Analyze

## Calls store actions
- [[openDialog()|useStore.openDialog()]]

## Opens
- [[procedure/correlations|procedure: correlations]]

## Part of
- [[Correlate|Analyze > Correlate]]

## Tested by
- [[quant.spec.ts]] · menu label
- [[search.test.ts]] · menu label
