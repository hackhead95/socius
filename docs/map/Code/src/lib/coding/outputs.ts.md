---
id: src/lib/coding/outputs.ts
type: module
file: src/lib/coding/outputs.ts
area: lib/coding
---

# src/lib/coding/outputs.ts

*Module* · area [[lib - coding|lib/coding]] · 277 lines

> OutputItem builders for the Output viewer (procedure 'coding').

## Imports
- [[coding-types.ts]] · type-only
- [[output.ts]] · type-only, value
- [[core/types.ts]] · value
- [[coding/analysis.ts]] · type-only
- [[coding/reliability.ts]] · type-only, value
- [[coding/text.ts]] · type-only

## Calls
- [[core/types.ts#newId|newId()]]

## Tested by
- [[outputs.test.ts]] · import

## Imported by
- [[AnalyseView.tsx]] · value
- [[ReliabilityView.tsx]] · value
- [[outputs.test.ts]] · value

## Private helpers
item() (line 12) · fmtPct() (line 16) · fmtR() (line 264) · cap() (line 270) · singular() (line 274)

## Symbols

### frequenciesOutput
*function* · line 20 · exported
- Calls: [[output.ts#cell|cell()]], [[output.ts#hcell|hcell()]], [[outputs.ts]]
- Output: [[Blocks/chart|chart]], [[Charts/bar|bar]], [[table]], [[text]]
- Used in: [[AnalyseView.tsx]], [[outputs.test.ts]]

### cooccurrenceOutput
*function* · line 83 · exported
- Calls: [[output.ts#cell|cell()]], [[output.ts#hcell|hcell()]], [[outputs.ts]]
- Output: [[Blocks/chart|chart]], [[heatmap]], [[table]], [[text]]
- Used in: [[AnalyseView.tsx]], [[outputs.test.ts]]

### codeByAttributeOutput
*function* · line 116 · exported
- Calls: [[output.ts#cell|cell()]], [[output.ts#hcell|hcell()]], [[outputs.ts]]
- Output: [[Blocks/chart|chart]], [[Charts/bar|bar]], [[table]], [[text]]
- Used in: [[AnalyseView.tsx]], [[outputs.test.ts]]

### wordFrequencyOutput
*function* · line 165 · exported
- Calls: [[output.ts#cell|cell()]], [[output.ts#hcell|hcell()]], [[outputs.ts]]
- Output: [[Blocks/chart|chart]], [[Charts/bar|bar]], [[table]]
- Used in: [[AnalyseView.tsx]], [[outputs.test.ts]]

### kwicOutput
*function* · line 183 · exported
- Calls: [[output.ts#cell|cell()]], [[output.ts#hcell|hcell()]], [[outputs.ts]]
- Output: [[table]]
- Used in: [[AnalyseView.tsx]], [[outputs.test.ts]]

### reliabilityOutput
*function* · line 198 · exported
- Calls: [[coding/reliability.ts#landisKoch|landisKoch()]], [[output.ts#cell|cell()]], [[output.ts#hcell|hcell()]], [[outputs.ts]]
- Output: [[table]], [[text]]
- Used in: [[ReliabilityView.tsx]], [[outputs.test.ts]]
