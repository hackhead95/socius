---
id: "ai-tool:propose_transform"
type: ai-tool
file: src/lib/assistant/tools/transform.ts
line: 235
area: lib/assistant
---

# propose_transform

*Assistant tool* · defined in [[transform.ts]] (line 235) · area [[lib - assistant|lib/assistant]]

- **Description:** Propose a data change that creates NEW variables: kind "compute" (target, expression, optional condition; SPSS expression syntax such as MEAN.4(a, b, c) or (x - 32) / 1.8), "recode" (source, target, rules [{from, to}] with from = "5" | "1 thru 3" | "lowest thru 29" | "65 thru highest" | "missing" | "sysmis" | "else" and to = number | "sysmis" | "copy"; optional value_labels), "reverse" (items; creates <item>_r), or "scale" (items, target, method mean|sum, min_valid). Nothing changes until the user clicks Apply on the preview card.
- **Tool kind:** action

## Calls
- [[transform.ts#buildTransform|buildTransform()]]
- [[assistant/format.ts#byteLength|byteLength()]]
- [[transform.ts#checks|checks()]]
- [[assistant/format.ts#closestNames|closestNames()]]
- [[assistant/format.ts#enc|enc]]
- [[assistant/format.ts#levenshtein|levenshtein()]]
- [[core/types.ts#newId|newId()]]
- [[tools/data.ts#NO_DATA|NO_DATA]]
- [[assistant/format.ts#num|num()]]
- [[transform.ts#parseFrom|parseFrom()]]
- [[transform.ts#parseNumber|parseNumber()]]
- [[transform.ts#parseTo|parseTo()]]
- [[transform.ts#preview|preview()]]
- [[transform.ts#ProposalError|ProposalError]]
- [[transform.ts#requireNewName|requireNewName()]]
- [[transform.ts#requireVar|requireVar()]]
- [[tools/data.ts#resolveVariables|resolveVariables()]]
- [[tools/data.ts#STATS_OFF|STATS_OFF]]
- [[assistant/format.ts#trimToBytes|trimToBytes()]]
- [[transform.ts#unquote|unquote()]]

## Reads
- [[dataset|useStore.dataset]]

## Tested by
- [[assistant.spec.ts]] · tool name
- [[scenarios.test.ts]] · tool name

## Implemented by
- [[transform.ts#propose|propose()]]
