---
id: src/lib/assistant/actions.ts
type: module
file: src/lib/assistant/actions.ts
area: lib/assistant
---

# src/lib/assistant/actions.ts

*Module* · area [[lib - assistant|lib/assistant]] · 68 lines

> Applying what the assistant proposed, only ever from a user's click. Transforms go through the store's mutateDataset (so Edit > Undo reverses them) and are logged like the Transform dialogs.

## Imports
- [[output.ts]] · type-only
- [[store.ts]] · type-only
- [[varUtils.ts]] · value
- [[transform.ts]] · value
- [[assistant/types.ts]] · type-only
- [[transform/index.ts]] · value

## Tested by
- [[scenarios.test.ts]] · import

## Imported by
- [[controller.ts]] · value
- [[scenarios.test.ts]] · value

## Types
ApplyResult (line 12)

## Private helpers
transformName() (line 54)

## Symbols

### applyProposal
*function* · line 18 · exported
> Apply a proposal against the data as it is now.
- Calls: [[assistant/actions.ts]], [[log.ts#transformLogItem|transformLogItem()]], [[transform.ts#buildTransform|buildTransform()]], [[varUtils.ts#remember|remember()]]
- Used in: [[controller.ts]], [[scenarios.test.ts]]

### addToOutput
*function* · line 45 · exported
> Add an analysis the assistant ran to the Output tab (a fresh id, so adding twice keeps both).
- Used in: [[controller.ts]], [[scenarios.test.ts]]
