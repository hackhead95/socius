---
id: "cmd:analyze:frequencies"
type: command
file: src/app/menus.ts
area: app
---

# Analyze > Descriptive Statistics > Frequencies...

*Menu command* · defined in [[menus.ts]] · area [[Areas/app|app]]

- **Menu path:** Analyze > Descriptive Statistics > Frequencies...
- **Needs a dataset:** yes
- **Generated:** from procedures registry
- **Menu:** Analyze

## Calls store actions
- [[openDialog()|useStore.openDialog()]]

## Opens
- [[procedure/frequencies|procedure: frequencies]]

## Part of
- [[Descriptive Statistics|Analyze > Descriptive Statistics]]

## Tested by
- [[ai-features.spec.ts]] · menu label
- [[ai-local.spec.ts]] · menu label
- [[commands-smoke-app.spec.ts]] · menu label
- [[errorlog.spec.ts]] · menu label
- [[quant.spec.ts]] · menu label
- [[search.spec.ts]] · menu label
- [[ui-overlays-focus.spec.ts]] · menu label
- [[navigation-audit.test.tsx]] · menu label
- [[search.test.ts]] · menu label
- [[ui-overlays.test.tsx]] · menu label
- [[figures.test.tsx]] · menu label
- [[format.test.ts]] · menu label

## Suggested by
- [[CommandPalette.tsx#SUGGESTED|SUGGESTED]]
