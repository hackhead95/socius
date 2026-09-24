---
id: "ai-tool:describe_variables"
type: ai-tool
file: src/lib/assistant/tools/data.ts
line: 304
area: lib/assistant
---

# describe_variables

*Assistant tool* · defined in [[tools/data.ts]] (line 304) · area [[lib - assistant|lib/assistant]]

- **Description:** Summary statistics for up to 12 variables, with the same missing-value, filter and weight rules as Socius analyses. Scale variables: N, missing, mean, SD, median, min, max, skewness. Categorical: frequency table with labels and valid %. Strings: most common values. Use before choosing or interpreting a test.
- **Tool kind:** read
- **In compact tool set:** yes

## Calls
- [[assistant/format.ts#byteLength|byteLength()]]
- [[tools/data.ts#caseStatus|caseStatus()]]
- [[assistant/format.ts#closestNames|closestNames()]]
- [[tools/data.ts#ctxData|ctxData()]]
- [[tools/data.ts#describeVariable|describeVariable()]]
- [[assistant/format.ts#enc|enc]]
- [[tools/data.ts#freqEntries|freqEntries()]]
- [[assistant/format.ts#levenshtein|levenshtein()]]
- [[tools/data.ts#NO_DATA|NO_DATA]]
- [[assistant/format.ts#num|num()]]
- [[assistant/format.ts#pct|pct()]]
- [[tools/data.ts#resolveVariables|resolveVariables()]]
- [[tools/data.ts#STATS_OFF|STATS_OFF]]
- [[assistant/format.ts#trimToBytes|trimToBytes()]]

## Reads
- [[dataset|useStore.dataset]]

## Tested by
- [[assistant.spec.ts]] · tool name
- [[ai-tools.test.ts]] · tool name
- [[scenarios.test.ts]] · tool name
- [[units.test.ts]] · tool name

## Implemented by
- [[tools/data.ts#describe|describe()]]

## Listed by
- [[tools/index.ts#compactTools|compactTools()]]
