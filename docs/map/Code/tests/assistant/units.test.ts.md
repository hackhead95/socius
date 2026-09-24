---
id: tests/assistant/units.test.ts
type: test
file: tests/assistant/units.test.ts
area: tests
---

# tests/assistant/units.test.ts

*Test file* · area [[tests]] · 174 lines

> Unit tests for the assistant's building blocks: safe Markdown, guide search, argument checks, the JSON action protocol, starter prompts and the prompt catalogue.

## Test cases
- **Markdown**
  - parses headings, lists (nested and numbered), tables, code and quotes
  - never lets HTML or script URLs through: raw tags stay text, only http(s)/mailto links
  - keeps underscores inside variable names and survives half-finished input while streaming
- **Guide search**
  - splits the guide into sections and removes its markup
- **Argument checks**
  - coerces small slips and reports real mistakes
  - parses recode rules the SPSS way
- **JSON action protocol**
  - accepts tool calls and answers, tolerates fences, rejects unknown tools
  - shows a streaming answer and keeps prompts inside the small budget
- **Knowledge and context**
  - generates the catalogue from the live registry
  - never states the data when statistics are switched off
  - trims to a byte budget at a line break
- **Starter prompts and shortcut**
  - fit the context
  - Ctrl+J and Cmd+J toggle the panel

## Imports
- [[node-fs|node:fs]] · value
- [[coding-types.ts]] · value
- [[core/types.ts]] · value
- [[AssistantRoot.tsx]] · value
- [[markdown.ts]] · value
- [[starters.ts]] · value
- [[assistant/format.ts]] · value
- [[assistant/help.ts]] · value
- [[json-protocol.ts]] · value
- [[prompt.ts]] · value
- [[tools/analysis.ts]] · value
- [[tools/index.ts]] · value
- [[transform.ts]] · value
- [[assistant/types.ts]] · value
- [[validate.ts]] · value
- [[procedures/index.ts]] · value
- [[vitest]] · value

## Calls
- [[tools/index.ts#allTools|allTools()]]
- [[json-protocol.ts#buildJsonPrompt|buildJsonPrompt()]]
- [[assistant/format.ts#byteLength|byteLength()]]
- [[tools/analysis.ts#catalogueText|catalogueText()]]
- [[validate.ts#checkArgs|checkArgs()]]
- [[assistant/help.ts#cleanGuideText|cleanGuideText()]]
- [[tools/index.ts#compactTools|compactTools()]]
- [[coding-types.ts#emptyCodingProject|emptyCodingProject()]]
- [[AssistantRoot.tsx#isAssistantShortcut|isAssistantShortcut()]]
- [[core/types.ts#makeDataset|makeDataset()]]
- [[core/types.ts#makeVariable|makeVariable()]]
- [[json-protocol.ts#parseAction|parseAction()]]
- [[transform.ts#parseFrom|parseFrom()]]
- [[markdown.ts#parseInline|parseInline()]]
- [[markdown.ts#parseMarkdown|parseMarkdown()]]
- [[transform.ts#parseTo|parseTo()]]
- [[json-protocol.ts#partialAnswer|partialAnswer()]]
- [[assistant/help.ts#rankSections|rankSections()]]
- [[markdown.ts#safeHref|safeHref()]]
- [[assistant/help.ts#splitGuide|splitGuide()]]
- [[starters.ts#starterPrompts|starterPrompts()]]
- [[prompt.ts#systemPrompt|systemPrompt()]]
- [[assistant/format.ts#trimToBytes|trimToBytes()]]

## Uses
- [[assistant/types.ts#DEFAULT_PERMISSIONS|DEFAULT_PERMISSIONS]]
- [[procedures/index.ts#procedures|procedures]]

## Tests
- [[Descriptive Statistics/Crosstabs|Analyze > Descriptive Statistics > Crosstabs...]] · menu label
- [[Procedures/crosstabs|Crosstabs]] · menu label, procedure id
- [[Select cases|Data > Select cases...]] · menu label
- [[Weight cases|Data > Weight cases...]] · menu label
- [[describe_variables]] · tool name
- [[get_cases]] · tool name
- [[run_analysis]] · tool name
- [[coding-types.ts]] · import
- [[core/types.ts]] · import
- [[AssistantRoot.tsx]] · import
- [[markdown.ts]] · import
- [[starters.ts]] · import
- [[assistant/format.ts]] · import
- [[assistant/help.ts]] · import
- [[json-protocol.ts]] · import
- [[prompt.ts]] · import
- [[tools/analysis.ts]] · import
- [[tools/index.ts]] · import
- [[transform.ts]] · import
- [[assistant/types.ts]] · import
- [[validate.ts]] · import
- [[procedures/index.ts]] · import
