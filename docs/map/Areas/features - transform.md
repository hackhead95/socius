---
id: "area:features/transform"
type: area
area: features/transform
---

# Area: features/transform

7 files, 1656 lines.

## Depends on (module imports)
- [[core]]: 14
- [[ui]]: 11
- [[lib - transform|lib/transform]]: 6
- [[platform]]: 4
- [[Areas/app|app]]: 2
- [[features - project|features/project]]: 1
- [[lib - io|lib/io]]: 1
- [[lib - stats|lib/stats]]: 1

## Used by areas
- [[Areas/app|app]]: 3

## Files
- [[CasesDialogs.tsx]]: Visual Binning, Select Cases, Weight Cases, Sort Cases.
- [[transform/common.tsx]]: Shared building blocks for transformation dialogs.
- [[ComputeDialog.tsx]]: Transform > Compute Variable.
- [[DeriveDialogs.tsx]]: Automatic Recode, Reverse-code items, Create Scale, Standardize, Count Values, Rank Cases.
- [[MergeDialogs.tsx]]: Data > Merge Files (Add Cases / Add Variables) and Data > Aggregate.
- [[RecodeDialog.tsx]]: Transform > Recode into Same Variables / Recode into Different Variables.
- [[TransformDialogs.tsx]]: Registry: store dialog { kind: 'transform', id } -> dialog component.

## Components
[[AggregateDialog|<AggregateDialog>]] · [[AutoRecodeDialog|<AutoRecodeDialog>]] · [[BinningDialog|<BinningDialog>]] · [[ComputeDialog|<ComputeDialog>]] · [[CountDialog|<CountDialog>]] · [[ExpressionField|<ExpressionField>]] · [[ExpressionHelper|<ExpressionHelper>]] · [[MergeCasesDialog|<MergeCasesDialog>]] · [[MergeVariablesDialog|<MergeVariablesDialog>]] · [[NumField|<NumField>]] · [[RankDialog|<RankDialog>]] · [[RecodeDialog|<RecodeDialog>]] · [[ReverseDialog|<ReverseDialog>]] · [[ScaleDialog|<ScaleDialog>]] · [[SelectCasesDialog|<SelectCasesDialog>]] · [[SortDialog|<SortDialog>]] · [[StandardizeDialog|<StandardizeDialog>]] · [[TextField|<TextField>]] · [[TransformDialog|<TransformDialog>]] · [[TransformModal|<TransformModal>]] · [[VarSelect|<VarSelect>]] · [[WeightDialog|<WeightDialog>]]

## Hooks
[[useFromEditor|useFromEditor()]] · [[useOtherFile|useOtherFile()]] · [[useSuggestedNames|useSuggestedNames()]]
