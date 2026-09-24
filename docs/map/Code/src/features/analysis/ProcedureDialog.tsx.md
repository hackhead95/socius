---
id: src/features/analysis/ProcedureDialog.tsx
type: module
file: src/features/analysis/ProcedureDialog.tsx
area: features/analysis
---

# src/features/analysis/ProcedureDialog.tsx

*Module* · area [[features - analysis|features/analysis]] · 848 lines

> Generic analysis dialog rendered from a ProcedureDef: variable list on the left, target boxes (slots) on the right, options grouped in tabs, validation, and a Run that never crashes the app.

## Imports
- [[react]] · value
- [[core/data.ts]] · value
- [[procedure.ts]] · type-only
- [[store.ts]] · value
- [[core/types.ts]] · type-only
- `src/features/analysis/dialog.css` · side-effect
- [[varUtils.ts]] · value
- [[output/actions.ts]] · value
- [[output/icons.tsx]] · value
- [[errorlog.ts]] · value
- [[procedures/index.ts]] · value
- [[Modal.tsx]] · value

## Calls
- [[core/data.ts#categoryLabel|categoryLabel()]]
- [[core/data.ts#distinctValues|distinctValues()]]

## Tested by
- [[dialog-ui.test.tsx]] · import

## Imported by
- [[DialogHost.tsx]] · value
- [[dialog-ui.test.tsx]] · value

## Private helpers
valueCache (line 38) · valuesOf() (line 39) · varText() (line 81) · valueOptions() (line 728)

## Symbols

### ProcedureDialog
*component* · line 18 · exported · note: [[ProcedureDialog|<ProcedureDialog>]]
- Renders: [[DialogBody|<DialogBody>]], [[Modal|<Modal>]]
- Calls: [[procedures/index.ts#getProcedure|getProcedure()]], [[useStore]]
- Reads: [[dataset|useStore.dataset]]
- Rendered by: [[DialogHost|<DialogHost>]], [[dialog-ui.test.tsx]]

### VarIcon
*component* · line 52 · exported · note: [[VarIcon|<VarIcon>]]
> ---------- icons for variables ----------
- Uses: [[varUtils.ts#MEASURE_LABEL|MEASURE_LABEL]]

### HoverCard
*component* · line 93 · note: [[HoverCard|<HoverCard>]]
> ---------- hover card ----------
- Renders: [[VarIcon|<VarIcon>]]
- Calls: [[ProcedureDialog.tsx]]
- Uses: [[varUtils.ts#MEASURE_LABEL|MEASURE_LABEL]]

### DialogBody
*component* · line 136 · note: [[DialogBody|<DialogBody>]]
- Renders: [[HoverCard|<HoverCard>]], [[IconArrowLeft|<IconArrowLeft>]], [[IconArrowRight|<IconArrowRight>]], [[IconCopy|<IconCopy>]], [[IconDown|<IconDown>]], [[IconSearch|<IconSearch>]], [[IconUp|<IconUp>]], [[IconWarn|<IconWarn>]], [[IconX|<IconX>]], [[Modal|<Modal>]], [[OptionField|<OptionField>]], [[VarIcon|<VarIcon>]]
- Calls: [[ProcedureDialog.tsx]], [[errorlog.ts#logFailure|logFailure()]], [[errorlog.ts#logSlow|logSlow()]], [[output/actions.ts#copyText|copyText()]], [[useStore]], [[varUtils.ts#addToSlot|addToSlot()]], [[varUtils.ts#bestSlotFor|bestSlotFor()]], [[varUtils.ts#measureWarning|measureWarning()]], [[varUtils.ts#moveWithinSlot|moveWithinSlot()]], [[varUtils.ts#optionInactive|optionInactive()]], [[varUtils.ts#recall|recall()]], [[varUtils.ts#remember|remember()]], [[varUtils.ts#removeFromSlot|removeFromSlot()]], [[varUtils.ts#slotCountHint|slotCountHint()]], [[varUtils.ts#slotSuitHint|slotSuitHint()]], [[varUtils.ts#typeFits|typeFits()]], [[varUtils.ts#validate|validate()]]
- Uses: [[useStore]]
- Reads: [[dataset|useStore.dataset]], [[outputs|useStore.outputs]]
- Store actions: [[addOutput()|useStore.addOutput()]]

### OptionField
*component* · line 669 · note: [[OptionField|<OptionField>]]
> ---------- options ----------
- Renders: [[GroupPairField|<GroupPairField>]], [[ValueListField|<ValueListField>]]

### GroupPairField
*component* · line 736 · note: [[GroupPairField|<GroupPairField>]]
- Calls: [[ProcedureDialog.tsx]], [[varUtils.ts#parseValue|parseValue()]]

### ValueListField
*component* · line 803 · note: [[ValueListField|<ValueListField>]]
- Renders: [[IconDown|<IconDown>]], [[IconUp|<IconUp>]]
- Calls: [[ProcedureDialog.tsx]]
