---
id: src/features/coding/exampleGuide.ts
type: module
file: src/features/coding/exampleGuide.ts
area: features/coding
---

# src/features/coding/exampleGuide.ts

*Module* · area [[features - coding|features/coding]] · 34 lines

> Names the worked example's toast, note and memo use for places in the app, taken from the real menu model (the Text coding menu, the procedure registry behind Analyze, the toolbar and the Responses filter), so the guidance cannot drift from what is on screen (UI-029).

## Imports
- [[menu.ts]] · value
- [[example.ts]] · type-only
- [[procedures/index.ts]] · value

## Tested by
- [[ui-fixes.test.tsx]] · import

## Imported by
- [[coding/actions.ts]] · value
- [[CodingWorkspace.tsx]] · value
- [[ResponsesView.tsx]] · value
- [[ui-fixes.test.tsx]] · value

## Symbols

### UNDO_CODING_LABEL
*const* · line 10 · exported
> Label of the coding toolbar's undo button (and how the guidance names it).
- Used in: [[CodingWorkspace.tsx]], [[ui-fixes.test.tsx]]

### NOT_CODED_FILTER_LABEL
*const* · line 13 · exported
> The Responses code-filter option that lists answers without a code.
- Used in: [[ResponsesView.tsx]], [[ui-fixes.test.tsx]]

### ANALYZE_MENU_NAME
*const* · line 16 · exported
> Top-level menubar name of the analyses (src/app/menus.ts).

### procedureMenuPath
*function* · line 19 · exported
> "Analyze > Descriptive Statistics > Crosstabs...", built like the menubar builds it from the registry.
- Calls: [[procedures/index.ts#getProcedure|getProcedure()]]
- Uses: [[exampleGuide.ts#ANALYZE_MENU_NAME|ANALYZE_MENU_NAME]]

### workedExampleGuide
*function* · line 25 · exported
- Calls: [[exampleGuide.ts#procedureMenuPath|procedureMenuPath()]], [[menu.ts#codingMenuLabel|codingMenuLabel()]]
- Uses: [[exampleGuide.ts#NOT_CODED_FILTER_LABEL|NOT_CODED_FILTER_LABEL]], [[exampleGuide.ts#UNDO_CODING_LABEL|UNDO_CODING_LABEL]], [[menu.ts#CODING_MENU_NAME|CODING_MENU_NAME]]
- Used in: [[ResponsesView.tsx]], [[coding/actions.ts]], [[ui-fixes.test.tsx]]
