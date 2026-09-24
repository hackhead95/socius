---
id: src/features/coding/dialogs/AutoCodeDialog.tsx
type: module
file: src/features/coding/dialogs/AutoCodeDialog.tsx
area: features/coding
---

# src/features/coding/dialogs/AutoCodeDialog.tsx

*Module* · area [[features - coding|features/coding]] · 209 lines

> Auto-coding with keyword / regex rules: edit rules per code, preview matches in context, apply.

## Imports
- [[react]] · value
- [[store.ts]] · value
- [[coding/actions.ts]] · value
- [[coding/hooks.ts]] · value
- [[ui.tsx]] · value
- [[rules.ts]] · value
- [[Modal.tsx]] · value

## Imported by
- [[CodingDialog.tsx]] · value

## Private helpers
contextWithHits() (line 183)

## Symbols

### AutoCodeDialog
*component* · line 13 · exported · note: [[AutoCodeDialog|<AutoCodeDialog>]]
- Renders: [[Modal|<Modal>]], [[Swatch|<Swatch>]]
- Calls: [[AutoCodeDialog.tsx]], [[coding/actions.ts#addSegmentsBulk|addSegmentsBulk()]], [[coding/actions.ts#canUndo|canUndo()]], [[coding/actions.ts#undoCoding|undoCoding()]], [[coding/actions.ts#updateCode|updateCode()]], [[coding/hooks.ts#plural|plural()]], [[coding/hooks.ts#toast|toast()]], [[rules.ts#findRuleMatches|findRuleMatches()]], [[rules.ts#parseRules|parseRules()]], [[rules.ts#rulesFromText|rulesFromText()]], [[useOrderedCodes|useOrderedCodes()]], [[useStore]]
- Reads: [[useStore/coding|useStore.coding]]
- Rendered by: [[CodingDialog|<CodingDialog>]]
