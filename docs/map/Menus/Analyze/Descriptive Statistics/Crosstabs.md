---
id: "cmd:analyze:crosstabs"
type: command
file: src/app/menus.ts
area: app
---

# Analyze > Descriptive Statistics > Crosstabs...

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** Analyze > Descriptive Statistics > Crosstabs...
- **Needs a dataset:** yes
- **Generated:** from procedures registry
- **Menu:** Analyze

## Calls store actions
- [[openDialog()|useStore.openDialog()]]

## Opens
- [[procedure/crosstabs|procedure: crosstabs]]

## Part of
- [[Descriptive Statistics|Analyze > Descriptive Statistics]]

## Tested by
- [[ai-features.spec.ts]] · menu label
- [[qual.spec.ts]] · menu label
- [[quant.spec.ts]] · menu label
- [[search.spec.ts]] · menu label
- [[features.test.ts]] · menu label
- [[navigation-audit.test.tsx]] · menu label
- [[palette.test.tsx]] · menu label
- [[search.test.ts]] · menu label
- [[units.test.ts]] · menu label

## Suggested by
- [[CommandPalette.tsx#SUGGESTED|SUGGESTED]]
