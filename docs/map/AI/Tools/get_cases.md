---
id: "ai-tool:get_cases"
type: ai-tool
file: src/lib/assistant/tools/data.ts
line: 318
area: lib/assistant
---

# get_cases

*Assistant tool* · defined in [[tools/data.ts]] (line 318) · area [[lib - assistant|lib/assistant]]

- **Description:** Individual case values (raw rows) for up to 10 variables and 30 cases. Only works when the user has switched on "Individual cases"; otherwise it says it is disabled. Prefer summary tools; use this only when the question is about specific cases (outliers, data entry errors).
- **Tool kind:** read

## Calls
- [[core/data.ts#activeCaseMask|activeCaseMask()]]
- [[assistant/format.ts#byteLength|byteLength()]]
- [[tools/data.ts#CASES_OFF|CASES_OFF]]
- [[assistant/format.ts#closestNames|closestNames()]]
- [[tools/data.ts#ctxData|ctxData()]]
- [[assistant/format.ts#enc|enc]]
- [[core/data.ts#formatCell|formatCell()]]
- [[core/data.ts#isUserMissing|isUserMissing()]]
- [[assistant/format.ts#levenshtein|levenshtein()]]
- [[tools/data.ts#NO_DATA|NO_DATA]]
- [[tools/data.ts#resolveVariables|resolveVariables()]]
- [[tools/data.ts#STATS_OFF|STATS_OFF]]
- [[assistant/format.ts#trimToBytes|trimToBytes()]]

## Reads
- [[dataset|useStore.dataset]]

## Tested by
- [[assistant.spec.ts]] · tool name
- [[scenarios.test.ts]] · tool name
- [[units.test.ts]] · tool name

## Implemented by
- [[tools/data.ts#cases|cases()]]
