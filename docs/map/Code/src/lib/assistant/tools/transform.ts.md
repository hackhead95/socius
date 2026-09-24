---
id: src/lib/assistant/tools/transform.ts
type: module
file: src/lib/assistant/tools/transform.ts
area: lib/assistant
---

# src/lib/assistant/tools/transform.ts

*Module* · area [[lib - assistant|lib/assistant]] · 261 lines

> propose_transform: compute, recode, reverse-code or build a scale into NEW variables, using the same transform engine as the Transform menu. The tool only previews; the user applies it with a button, which re-runs it on the data as it is at that moment and records it for Undo.

## Imports
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only, value
- [[assistant/format.ts]] · value
- [[tools/data.ts]] · value
- [[assistant/types.ts]] · type-only
- [[stats/descriptives.ts]] · value
- [[transform/index.ts]] · value

## Tested by
- [[units.test.ts]] · import

## Imported by
- [[assistant/actions.ts]] · value
- [[tools/index.ts]] · value
- [[units.test.ts]] · value

## Symbols

### ProposalError
*class* · line 15 · exported

### parseNumber
*function* · line 17

### unquote
*function* · line 22

### parseFrom
*function* · line 25 · exported
> "5", "1 thru 3", "lowest thru 29", "65 thru highest", "missing", "sysmis", "else", "'text'".
- Calls: [[transform.ts#ProposalError|ProposalError]], [[transform.ts#parseNumber|parseNumber()]], [[transform.ts#unquote|unquote()]]
- Used in: [[units.test.ts]]

### parseTo
*function* · line 46 · exported
- Calls: [[transform.ts#ProposalError|ProposalError]], [[transform.ts#parseNumber|parseNumber()]], [[transform.ts#unquote|unquote()]]
- Used in: [[units.test.ts]]

### requireVar
*function* · line 57
- Calls: [[assistant/format.ts#closestNames|closestNames()]], [[core/data.ts#getVariable|getVariable()]], [[transform.ts#ProposalError|ProposalError]]

### requireNewName
*function* · line 66
- Calls: [[core/data.ts#getVariable|getVariable()]], [[transform.ts#ProposalError|ProposalError]]

### buildTransform
*function* · line 74 · exported
> Run a transform spec on a dataset (pure). Throws ProposalError or the engine's own errors.
- Calls: [[compute.ts#computeVariable|computeVariable()]], [[core/data.ts#getVariable|getVariable()]], [[derive.ts#createScale|createScale()]], [[derive.ts#reverseCode|reverseCode()]], [[recode.ts#recodeDifferent|recodeDifferent()]], [[tools/data.ts#resolveVariables|resolveVariables()]], [[transform.ts#ProposalError|ProposalError]], [[transform.ts#parseFrom|parseFrom()]], [[transform.ts#parseNumber|parseNumber()]], [[transform.ts#parseTo|parseTo()]], [[transform.ts#requireNewName|requireNewName()]], [[transform.ts#requireVar|requireVar()]]
- Used in: [[assistant/actions.ts]]

### preview
*function* · line 119
> First rows of the source variables and the new variable(s), for the proposal card.
- Calls: [[core/data.ts#activeCaseMask|activeCaseMask()]], [[core/data.ts#formatCell|formatCell()]], [[core/data.ts#getVariable|getVariable()]]

### checks
*function* · line 139
> Checks the model should hear about: values that fell through, missing codes turned into answers.
- Calls: [[assistant/format.ts#num|num()]], [[core/data.ts#activeCaseMask|activeCaseMask()]], [[core/data.ts#getVariable|getVariable()]], [[core/data.ts#isMissingValue|isMissingValue()]], [[core/data.ts#isUserMissing|isUserMissing()]], [[stats/descriptives.ts#exploreStats|exploreStats()]]

### propose
*function* · line 175
- Calls: [[assistant/format.ts#trimToBytes|trimToBytes()]], [[core/types.ts#newId|newId()]], [[transform.ts#buildTransform|buildTransform()]], [[transform.ts#checks|checks()]], [[transform.ts#preview|preview()]]
- Uses: [[tools/data.ts#NO_DATA|NO_DATA]], [[tools/data.ts#STATS_OFF|STATS_OFF]]

### transformTools
*const* · line 234 · exported
- Uses: [[transform.ts#propose|propose()]]
- Used in: [[tools/index.ts]]
