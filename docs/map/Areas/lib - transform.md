---
id: "area:lib/transform"
type: area
area: lib/transform
---

# Area: lib/transform

15 files, 4393 lines.

## Depends on (module imports)
- [[core]]: 22
- [[lib - io|lib/io]]: 1

## Used by areas
- [[features - data|features/data]]: 6
- [[features - transform|features/transform]]: 6
- [[lib - assistant|lib/assistant]]: 2

## Files
- [[aggregate.ts]]: AGGREGATE: summaries per group of break variables, added to the active file or as a new dataset.
- [[binning.ts]]: Visual Binning: turn a scale variable into ordered groups (equal width, equal count, custom cutpoints). Group labels read "18 to 29" (never …
- [[cases.ts]]: Case-level operations: Select Cases (filter or delete), Sort Cases, Weight Cases.
- [[compute.ts]]: COMPUTE / IF: create or overwrite a variable from an expression.
- [[derive.ts]]: Derived variables: reverse-coding, scale scores, z-scores, counts, ranks.
- [[dsops.ts]]: Immutable dataset helpers shared by all transformations. Each returns a NEW Dataset (version + 1) that shares unchanged columns with the inp…
- [[evaluate.ts]]: Compiles an expression AST into a fast per-row evaluator with SPSS missing-value semantics: - arithmetic with a missing operand gives system…
- [[expr.ts]]: SPSS COMPUTE-compatible expression language: lexer + parser producing an AST. Evaluation (with SPSS missing-value semantics) lives in evalua…
- [[functions.ts]]: Catalogue of COMPUTE functions, shown in the Compute dialog's function list. Every entry here is implemented in evaluate.ts (a test checks t…
- [[transform/index.ts]]: Pure data transformations (no React). Each returns a TransformResult with the new dataset, equivalent SPSS syntax and a plain-language summa…
- [[log.ts]]: Turns a TransformResult into an output-log entry (procedure 'transform').
- [[merge.ts]]: Merge Files: Add Cases (ADD FILES) and Add Variables (MATCH FILES).
- [[properties.ts]]: Define Variable Properties (Data menu): scan the values a variable really has, spot unlabelled values and codes that look like missing answe…
- [[recode.ts]]: RECODE (into same / different variables) and AUTORECODE.
- [[syntax.ts]]: Helpers for writing equivalent SPSS syntax in the output log.
