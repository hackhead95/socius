---
id: src/features/transform/TransformDialogs.tsx
type: module
file: src/features/transform/TransformDialogs.tsx
area: features/transform
---

# src/features/transform/TransformDialogs.tsx

*Module* · area [[features - transform|features/transform]] · 42 lines

> Registry: store dialog { kind: 'transform', id } -> dialog component.

## Imports
- [[react]] · type-only
- [[store.ts]] · value
- [[core/types.ts]] · type-only
- [[CasesDialogs.tsx]] · value
- [[ComputeDialog.tsx]] · value
- [[DeriveDialogs.tsx]] · value
- [[MergeDialogs.tsx]] · value
- [[RecodeDialog.tsx]] · value

## Renders
- [[RecodeDialog|<RecodeDialog>]]

## Uses
- [[AggregateDialog|<AggregateDialog>]]
- [[AutoRecodeDialog|<AutoRecodeDialog>]]
- [[BinningDialog|<BinningDialog>]]
- [[ComputeDialog|<ComputeDialog>]]
- [[CountDialog|<CountDialog>]]
- [[MergeCasesDialog|<MergeCasesDialog>]]
- [[MergeVariablesDialog|<MergeVariablesDialog>]]
- [[RankDialog|<RankDialog>]]
- [[ReverseDialog|<ReverseDialog>]]
- [[ScaleDialog|<ScaleDialog>]]
- [[SelectCasesDialog|<SelectCasesDialog>]]
- [[SortDialog|<SortDialog>]]
- [[StandardizeDialog|<StandardizeDialog>]]
- [[WeightDialog|<WeightDialog>]]

## Imported by
- [[DialogHost.tsx]] · value

## Private helpers
DIALOGS (line 13)

## Symbols

### hasTransformDialog
*function* · line 32 · exported
- Uses: [[TransformDialogs.tsx]]

### TransformDialog
*component* · line 36 · exported · note: [[TransformDialog|<TransformDialog>]]
- Calls: [[useStore]]
- Uses: [[TransformDialogs.tsx]]
- Reads: [[dataset|useStore.dataset]]
- Rendered by: [[DialogHost|<DialogHost>]]
