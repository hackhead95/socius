---
id: src/features/ai/explainPrompt.ts
type: module
file: src/features/ai/explainPrompt.ts
area: features/ai
---

# src/features/ai/explainPrompt.ts

*Module* · area [[features - ai|features/ai]] · 189 lines

> "Explain with AI" for Output items: the item as compact text (titles, table numbers and labels, Socius's own summary, APA sentence and warnings) and the prompt around it. Pure: no network. Never sent: individual cases. Scatter plot points, box plot outlier values, and tables that list cases (casewise diagnostics, keyword-in-context quotes...) are left out; only aggregate numbers go.

## Imports
- [[output.ts]] · type-only
- [[dataTable.ts]] · value
- [[output/format.ts]] · value

## Calls
- [[output/format.ts#formatCell|formatCell()]]

## Tested by
- [[explainPrompt.test.ts]] · import

## Imported by
- [[ExplainPanel.tsx]] · value
- [[explainStore.ts]] · value
- [[features.ts]] · value
- [[OutputViewer.tsx]] · value
- [[explainPrompt.test.ts]] · value

## Types
ExplainContext (line 73) · ExplainPrompt (line 158)

## Private helpers
enc (line 11) · CASE_LEVEL_TABLE (line 15) · cellStr() (line 24) · num() (line 60) · TEXT_LABEL (line 81)

## Symbols

### byteLength
*function* · line 12 · exported
- Uses: [[explainPrompt.ts]]
- Used in: [[ExplainPanel.tsx]], [[explainPrompt.test.ts]]

### isExplainable
*function* · line 18 · exported
> Items that make sense to explain: analyses and charts (not data-change logs or quote lists).
- Uses: [[explainPrompt.ts]]
- Output: [[Blocks/chart|chart]], [[scatter]], [[table]], [[text]]
- Used in: [[features.ts]], [[OutputViewer.tsx]], [[explainPrompt.test.ts]]

### tableToCompactText
*function* · line 30 · exported
> A table as compact text: a header line of column names, then one line per row ("a | b | c").
- Calls: [[explainPrompt.ts]], [[output/format.ts#layoutRows|layoutRows()]]
- Used in: [[explainPrompt.test.ts]]

### chartToCompactText
*function* · line 63 · exported
> A chart as compact text of its aggregate data, or null when it only holds individual cases.
- Calls: [[dataTable.ts#chartDataTable|chartDataTable()]]
- Uses: [[explainPrompt.ts]]
- Output: [[box]], [[scatter]]
- Used in: [[explainPrompt.test.ts]]

### outputItemContext
*function* · line 89 · exported
> The result as compact text that fits `maxBytes`. Text blocks come first so they always fit.
- Calls: [[explainPrompt.ts#byteLength|byteLength()]], [[explainPrompt.ts#chartToCompactText|chartToCompactText()]], [[explainPrompt.ts#tableToCompactText|tableToCompactText()]]
- Uses: [[explainPrompt.ts]]
- Output: [[Blocks/chart|chart]], [[heading]], [[scatter]], [[table]], [[text]]
- Used in: [[explainPrompt.test.ts]]

### EXPLAIN_INSTRUCTIONS
*const* · line 142 · exported
- Used in: [[explainPrompt.test.ts]]

### buildExplainPrompt
*function* · line 164 · exported
> The full prompt for one item, within the provider's prompt budget (bytes).
- Calls: [[explainPrompt.ts#byteLength|byteLength()]], [[explainPrompt.ts#outputItemContext|outputItemContext()]]
- Uses: [[explainPrompt.ts#EXPLAIN_INSTRUCTIONS|EXPLAIN_INSTRUCTIONS]]
- Used in: [[ExplainPanel.tsx]], [[explainStore.ts]], [[explainPrompt.test.ts]]

### plainText
*function* · line 172 · exported
> Markdown-ish model reply -> plain text for the output document and exports.
- Used in: [[ExplainPanel.tsx]], [[explainStore.ts]], [[explainPrompt.test.ts]]
