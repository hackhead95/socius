---
id: "area:features/data"
type: area
area: features/data
---

# Area: features/data

8 files, 3461 lines.

## Depends on (module imports)
- [[core]]: 20
- [[ui]]: 13
- [[lib - transform|lib/transform]]: 6
- [[Areas/app|app]]: 3
- [[lib - io|lib/io]]: 2
- [[features - transform|features/transform]]: 1
- [[platform]]: 1

## Used by areas
- [[Areas/app|app]]: 4

## Files
- [[DataGrid.tsx]]: Virtualised Data View grid (rows AND columns), SPSS-style: sticky variable-name header, sticky case numbers (struck through when filtered ou…
- [[DataView.tsx]]: Data View: toolbar, virtualised grid, find bar, context menus and quick column statistics.
- [[DefineProperties.tsx]]: Data > Define variable properties...: scan the values variables really have, then label values, mark missing codes and set the measurement l…
- [[find.ts]]: Find in the Data View: matches values and value labels without formatting every cell.
- [[gridEdit.ts]]: Parsing typed/pasted cell text and TSV clipboard data for the Data View.
- [[mutations.ts]]: Immutable dataset edits used by the Data View and Variable View (all go through mutateDataset).
- [[VarDialogs.tsx]]: Variable View dialogs: Type, Value Labels, Missing Values, Copy Properties.
- [[VariableView.tsx]]: Variable View: the SPSS dictionary as an editable table (one row per variable).

## Components
[[ApplyToPanel|<ApplyToPanel>]] · [[CellDisplay|<CellDisplay>]] · [[CopyFromPanel|<CopyFromPanel>]] · [[CopyPropertiesDialog|<CopyPropertiesDialog>]] · [[DataGrid|<DataGrid>]] · [[DataView|<DataView>]] · [[DataViewInner|<DataViewInner>]] · [[DefinePropertiesDialog|<DefinePropertiesDialog>]] · [[DialogCell|<DialogCell>]] · [[FindBar|<FindBar>]] · [[GotoBar|<GotoBar>]] · [[GridCell|<GridCell>]] · [[MissingDialog|<MissingDialog>]] · [[PropChecks|<PropChecks>]] · [[StatsPopover|<StatsPopover>]] · [[StatusGlyph|<StatusGlyph>]] · [[SuggestPanel|<SuggestPanel>]] · [[TypeDialog|<TypeDialog>]] · [[ValueLabelsDialog|<ValueLabelsDialog>]] · [[VariableEditor|<VariableEditor>]] · [[VariableView|<VariableView>]] · [[VariableViewInner|<VariableViewInner>]]
