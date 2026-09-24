---
id: tests/ai/explainPrompt.test.ts
type: test
file: tests/ai/explainPrompt.test.ts
area: tests
---

# tests/ai/explainPrompt.test.ts

*Test file* · area [[tests]] · 128 lines

> "Explain with AI": what goes into the prompt (aggregate numbers, labels, summaries, warnings) and what never does (individual cases: scatter points, outlier values, casewise tables, quotes).

## Test cases
- **explain prompt**
  - contains the tables as compact text, the summaries and the warnings
  - never contains case-level values
  - asks for the five sections and the usual cautions
  - stays within the provider budget, shortening long tables
  - knows which items can be explained
  - turns tables and charts into compact text
  - turns a Markdown reply into plain text for the output

## Imports
- [[output.ts]] · value
- [[explainPrompt.ts]] · value
- [[vitest]] · value

## Calls
- [[explainPrompt.ts#buildExplainPrompt|buildExplainPrompt()]]
- [[explainPrompt.ts#byteLength|byteLength()]]
- [[output.ts#cell|cell()]]
- [[explainPrompt.ts#chartToCompactText|chartToCompactText()]]
- [[output.ts#hcell|hcell()]]
- [[explainPrompt.ts#isExplainable|isExplainable()]]
- [[explainPrompt.ts#outputItemContext|outputItemContext()]]
- [[explainPrompt.ts#plainText|plainText()]]
- [[explainPrompt.ts#tableToCompactText|tableToCompactText()]]

## Uses
- [[explainPrompt.ts#EXPLAIN_INSTRUCTIONS|EXPLAIN_INSTRUCTIONS]]

## Tests
- [[output.ts]] · import
- [[explainPrompt.ts]] · import

## Private helpers
crosstabItem() (line 9)
