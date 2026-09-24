---
id: src/lib/assistant/tools/index.ts
type: module
file: src/lib/assistant/tools/index.ts
area: lib/assistant
---

# src/lib/assistant/tools/index.ts

*Module* · area [[lib - assistant|lib/assistant]] · 25 lines

> The assistant's tool set. Read tools only look; action tools only ever propose.

## Imports
- [[tools/analysis.ts]] · value
- [[coding.ts]] · value
- [[tools/data.ts]] · value
- [[tools/help.ts]] · value
- [[transform.ts]] · value
- [[assistant/types.ts]] · type-only

## Tested by
- [[scenarios.test.ts]] · import
- [[units.test.ts]] · import

## Imported by
- [[controller.ts]] · value
- [[scenarios.test.ts]] · value
- [[units.test.ts]] · value

## Private helpers
cached (line 9)

## Symbols

### allTools
*function* · line 11 · exported
- Calls: [[tools/analysis.ts#analysisTools|analysisTools()]]
- Uses: [[coding.ts#codingTools|codingTools]], [[tools/data.ts#dataTools|dataTools]], [[tools/help.ts#helpTools|helpTools]], [[tools/index.ts]], [[transform.ts#transformTools|transformTools]]
- Used in: [[controller.ts]], [[scenarios.test.ts]], [[units.test.ts]]

### compactTools
*function* · line 17 · exported
> The small set offered to the on-device model (short context, weak at tools).
- Calls: [[tools/index.ts#allTools|allTools()]]
- Used in: [[controller.ts]], [[scenarios.test.ts]], [[units.test.ts]]

### toolByName
*function* · line 22 · exported
- Calls: [[tools/index.ts#allTools|allTools()]]
