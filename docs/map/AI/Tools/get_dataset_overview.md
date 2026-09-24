---
id: "ai-tool:get_dataset_overview"
type: ai-tool
file: src/lib/assistant/tools/data.ts
line: 288
area: lib/assistant
---

# get_dataset_overview

*Assistant tool* · defined in [[tools/data.ts]] (line 288) · area [[lib - assistant|lib/assistant]]

- **Description:** The open dataset: name, number of cases, filter and weight status, and every variable with its label, type, measurement level, value labels, declared missing codes, number of valid answers and possible data problems (FLAGS). Call this first for any question about the data.
- **Tool kind:** read
- **In compact tool set:** yes

## Calls
- [[core/data.ts#activeCaseMask|activeCaseMask()]]
- [[assistant/format.ts#byteLength|byteLength()]]
- [[tools/data.ts#caseStatus|caseStatus()]]
- [[tools/data.ts#ctxData|ctxData()]]
- [[assistant/format.ts#enc|enc]]
- [[core/data.ts#formatRawValue|formatRawValue()]]
- [[core/data.ts#isDateFormat|isDateFormat()]]
- [[tools/data.ts#MISSING_WORDS|MISSING_WORDS]]
- [[assistant/format.ts#missingText|missingText()]]
- [[tools/data.ts#NO_DATA|NO_DATA]]
- [[assistant/format.ts#num|num()]]
- [[assistant/format.ts#pct|pct()]]
- [[tools/data.ts#scan|scan()]]
- [[tools/data.ts#SENTINELS|SENTINELS]]
- [[tools/data.ts#STATS_OFF|STATS_OFF]]
- [[assistant/format.ts#trimToBytes|trimToBytes()]]
- [[assistant/format.ts#valueLabelsText|valueLabelsText()]]
- [[tools/data.ts#variableFlags|variableFlags()]]

## Reads
- [[dataset|useStore.dataset]]

## Tested by
- [[assistant.spec.ts]] · tool name
- [[ai-tools.test.ts]] · tool name
- [[scenarios.test.ts]] · tool name
- [[ai-latency.test.ts]] · tool name

## Implemented by
- [[tools/data.ts#overview|overview()]]

## Listed by
- [[tools/index.ts#compactTools|compactTools()]]
