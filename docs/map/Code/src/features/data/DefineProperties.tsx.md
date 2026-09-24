---
id: src/features/data/DefineProperties.tsx
type: module
file: src/features/data/DefineProperties.tsx
area: features/data
---

# src/features/data/DefineProperties.tsx

*Module* · area [[features - data|features/data]] · 686 lines

> Data > Define variable properties...: scan the values variables really have, then label values, mark missing codes and set the measurement level with Socius's suggestions. Every edit stays a draft until Apply, which makes one undoable change and logs the SPSS syntax to Output. The logic is in src/lib/transform/properties.ts.

## Imports
- [[react]] · value
- [[ui-store.ts]] · value
- [[core/data.ts]] · value
- [[store.ts]] · value
- [[core/types.ts]] · type-only
- `src/features/data/DefineProperties.css` · side-effect
- [[dsops.ts]] · value
- [[log.ts]] · value
- [[properties.ts]] · value
- [[Icon.tsx]] · value
- [[MeasureIcon.tsx]] · value
- [[Modal.tsx]] · value
- [[VarPicker.tsx]] · value

## Calls
- [[core/data.ts#isDateFormat|isDateFormat()]]

## Imported by
- [[DialogHost.tsx]] · value

## Private helpers
MEASURES (line 28) · typeText() (line 30)

## Symbols

### DEFINE_PROPERTIES_TITLE
*const* · line 24 · exported

### DefinePropertiesDialog
*component* · line 36 · exported · note: [[DefinePropertiesDialog|<DefinePropertiesDialog>]]
- Renders: [[Icon|<Icon>]], [[Modal|<Modal>]], [[StatusGlyph|<StatusGlyph>]], [[VarMeasureIcon|<VarMeasureIcon>]], [[VarPicker|<VarPicker>]], [[VariableEditor|<VariableEditor>]]
- Calls: [[dsops.ts#fmtN|fmtN()]], [[dsops.ts#plural|plural()]], [[log.ts#transformLogItem|transformLogItem()]], [[properties.ts#applyPropertyDrafts|applyPropertyDrafts()]], [[properties.ts#copyDraftProps|copyDraftProps()]], [[properties.ts#draftFromVariable|draftFromVariable()]], [[properties.ts#draftIssues|draftIssues()]], [[properties.ts#isDraftChanged|isDraftChanged()]], [[properties.ts#scanVariables|scanVariables()]], [[properties.ts#statusOf|statusOf()]]
- Uses: [[DefineProperties.tsx#DEFINE_PROPERTIES_TITLE|DEFINE_PROPERTIES_TITLE]], [[properties.ts#COPYABLE_PROPS|COPYABLE_PROPS]], [[properties.ts#DEFAULT_MAX_VALUES|DEFAULT_MAX_VALUES]], [[useStore]], [[useUi]]
- Reads: [[dataset|useStore.dataset]]
- Store actions: [[addOutput()|useStore.addOutput()]], [[confirm()|useUi.confirm()]], [[mutateDataset()|useStore.mutateDataset()]], [[toast()|useStore.toast()]]
- Rendered by: [[DialogHost|<DialogHost>]]

### StatusGlyph
*component* · line 292 · note: [[StatusGlyph|<StatusGlyph>]]
- Renders: [[Icon|<Icon>]]

### VariableEditor
*component* · line 317 · note: [[VariableEditor|<VariableEditor>]]
- Renders: [[ApplyToPanel|<ApplyToPanel>]], [[CopyFromPanel|<CopyFromPanel>]], [[Icon|<Icon>]], [[MeasureIcon|<MeasureIcon>]], [[SuggestPanel|<SuggestPanel>]]
- Calls: [[DefineProperties.tsx]], [[MeasureIcon.tsx#measureKind|measureKind()]], [[core/data.ts#isDateFormat|isDateFormat()]], [[dsops.ts#fmtN|fmtN()]], [[properties.ts#buildRows|buildRows()]], [[properties.ts#copyDraftProps|copyDraftProps()]], [[properties.ts#describeMissingSpec|describeMissingSpec()]], [[properties.ts#displayValue|displayValue()]], [[properties.ts#draftFromVariable|draftFromVariable()]], [[properties.ts#labelFor|labelFor()]], [[properties.ts#measureName|measureName()]], [[properties.ts#parseValue|parseValue()]], [[properties.ts#removeMissingRange|removeMissingRange()]], [[properties.ts#setValueLabel|setValueLabel()]], [[properties.ts#suggestMeasure|suggestMeasure()]], [[properties.ts#summarise|summarise()]], [[properties.ts#toggleMissing|toggleMissing()]], [[properties.ts#valueKey|valueKey()]]
- Uses: [[DefineProperties.tsx]], [[properties.ts#COPYABLE_PROPS|COPYABLE_PROPS]]

### SuggestPanel
*component* · line 538 · note: [[SuggestPanel|<SuggestPanel>]]
> ---------- panels ----------
- Calls: [[dsops.ts#plural|plural()]], [[properties.ts#applySuggestion|applySuggestion()]], [[properties.ts#displayValue|displayValue()]], [[properties.ts#labelFor|labelFor()]], [[properties.ts#previewSuggestion|previewSuggestion()]], [[properties.ts#suggestLabels|suggestLabels()]], [[properties.ts#valueKey|valueKey()]]
- Uses: [[properties.ts#displayValue|displayValue()]]

### PropChecks
*component* · line 613 · note: [[PropChecks|<PropChecks>]]
- Uses: [[properties.ts#COPYABLE_PROPS|COPYABLE_PROPS]]

### CopyFromPanel
*component* · line 626 · note: [[CopyFromPanel|<CopyFromPanel>]]
- Renders: [[PropChecks|<PropChecks>]], [[VarPicker|<VarPicker>]]
- Calls: [[dsops.ts#plural|plural()]], [[properties.ts#describeMissingSpec|describeMissingSpec()]], [[properties.ts#draftFromVariable|draftFromVariable()]], [[properties.ts#measureName|measureName()]]
- Uses: [[properties.ts#COPYABLE_PROPS|COPYABLE_PROPS]]

### ApplyToPanel
*component* · line 655 · note: [[ApplyToPanel|<ApplyToPanel>]]
- Renders: [[PropChecks|<PropChecks>]], [[VarPicker|<VarPicker>]]
- Calls: [[dsops.ts#plural|plural()]], [[properties.ts#batterySiblings|batterySiblings()]]
- Uses: [[properties.ts#COPYABLE_PROPS|COPYABLE_PROPS]]
