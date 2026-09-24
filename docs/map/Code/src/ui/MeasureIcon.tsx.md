---
id: src/ui/MeasureIcon.tsx
type: module
file: src/ui/MeasureIcon.tsx
area: ui
---

# src/ui/MeasureIcon.tsx

*Module* · area [[ui]] · 61 lines

> Measurement-level glyphs, drawn in SVG like SPSS's ruler / bars / circles, plus one for text.

## Imports
- [[core/types.ts]] · type-only

## Imported by
- [[CommandPalette.tsx]] · value
- [[Sidebar.tsx]] · value
- [[DataGrid.tsx]] · value
- [[DefineProperties.tsx]] · value
- [[VariableView.tsx]] · value
- [[FileDialogs.tsx]] · value
- [[transform/common.tsx]] · value
- [[VarPicker.tsx]] · value

## Types
MeasureKind (line 4)

## Symbols

### measureKind
*function* · line 6 · exported
- Used in: [[DataGrid.tsx]], [[DefineProperties.tsx]], [[VariableView.tsx]]

### MEASURE_LABEL
*const* · line 10 · exported

### MeasureIcon
*component* · line 17 · exported · note: [[MeasureIcon|<MeasureIcon>]]
- Rendered by: [[CellDisplay|<CellDisplay>]], [[DataGrid|<DataGrid>]], [[VariableEditor|<VariableEditor>]]

### VarMeasureIcon
*component* · line 53 · exported · note: [[VarMeasureIcon|<VarMeasureIcon>]]
- Renders: [[MeasureIcon|<MeasureIcon>]]
- Calls: [[MeasureIcon.tsx#measureKind|measureKind()]]
- Uses: [[MeasureIcon.tsx#MEASURE_LABEL|MEASURE_LABEL]]
- Rendered by: [[CommandPalette|<CommandPalette>]], [[DefinePropertiesDialog|<DefinePropertiesDialog>]], [[ExpressionHelper|<ExpressionHelper>]], [[ImportDialog (features-project-FileDialogs)|<ImportDialog>]], [[VarPicker|<VarPicker>]], [[VariableList|<VariableList>]]
