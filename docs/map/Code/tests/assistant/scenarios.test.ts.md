---
id: tests/assistant/scenarios.test.ts
type: test
file: tests/assistant/scenarios.test.ts
area: tests
---

# tests/assistant/scenarios.test.ts

*Test file* · area [[tests]] · 666 lines

> Evaluation suite for the Socius assistant: realistic research questions on the bundled sample survey, answered by a scripted fake model through the real agent loop, real tools and the real store. Checks which tools are called with which arguments, that the numbers passed back to the model match Socius's own procedures, the guardrails (disabled case access, proposals never applied silently), and...

## Test cases
- **Scenario 1: "Describe my data"**
  - looks at the overview, then key variables; the numbers match Descriptives
- **Scenario 2: "Which test for trust5 by gender?"**
  - inspects measurement levels and categories before recommending anything
- **Scenario 3: crosstab and interpret**
  - runs Crosstabs on the live data; the chi-square matches the procedure; Add to Output is a separate click
- **Scenario 4: t-test life_sat by migrant**
  - fills in the two groups automatically and passes back the same t, df and d as the dialog
  - asks for two groups (or suggests ANOVA / Kruskal-Wallis) when the grouping variable has three
- **Scenario 5: regression with dummies**
  - runs Linear Regression with categorical predictors dummy-coded; R squared matches
- **Scenario 6: reliability of the trust items**
  - surfaces the trust3 reverse-coding warning, then proposes a reverse-code that only applies on click
- **Scenario 7: weighted vs unweighted**
  - reports weighted counts when a weight is on, matching Frequencies with WEIGHT BY wt
- **Scenario 8: filter active**
  - says the filter is on and analyses only the selected cases
- **Scenario 9: missing-value codes 8 and 9**
  - excludes declared codes from valid N, and flags them when they are not declared
- **Scenario 10: individual cases are off by default**
  - get_cases returns a disabled message and no values; with permission it returns rows
- **Scenario 11: a how-do-I question**
  - answers from the guide via search_help, with the exact menu path
- **Scenario 12: proposing a recode**
  - previews agegrp with checks and syntax; the store is untouched until Apply; Apply is undoable
  - warns when rules miss valid values or turn missing codes into answers; never overwrites a variable
- **Scenario 13: tool errors are returned to the model, which recovers**
  - unknown tool, unknown analysis, misspelt variable and missing arguments come back as clear errors
- **Scenario 14: rate limits**
  - backs off once on 429 with the service delay, then continues
  - a used-up daily quota fails at once with a clear message
  - paces requests to the free-tier limit per minute
- **Scenario 15: Stop**
  - aborting while the model is thinking rejects with "cancelled" and changes nothing
  - aborting between rounds stops before running the requested tools
- **Scenario 16: limits of the loop**
  - after 8 tool rounds the model must answer (tools off, limit note in the prompt)
  - runs several tool calls from one turn together and returns the results in order
  - keeps each request within the byte budget: long results are trimmed and old ones removed first
- **Scenario 17: qualitative coding**
  - summarises themes from the codebook and quotes, and compares codes by gender with the same counts as Codes by attribute
  - does not read excerpts when "Excerpts from coded texts" is off
- **Scenario 18: explaining a result from the Output tab**
  - puts the output item into the context and can read it with get_output
- **Scenario 19: the on-device model uses the JSON action protocol**
  - repairs one malformed reply, runs the tool, streams and returns the answer
- **Scenario 20: Claude in the viewer runs the tool rounds itself**
  - passes instructions as the first user turn and executes page tools
- **Controller: the store only changes on the user's click**
  - a whole conversation with a proposal and an analysis leaves data and outputs unchanged until the buttons are clicked
  - Stop marks the answer stopped, Retry asks again, and an unconfigured AI gives the set-up message

## Imports
- [[node-fs|node:fs]] · value
- [[node-url|node:url]] · value
- [[coding-types.ts]] · value
- [[output.ts]] · type-only
- [[procedure.ts]] · value
- [[store.ts]] · value
- [[core/types.ts]] · type-only
- [[chat-store.ts]] · value
- [[controller.ts]] · value
- [[assistant/actions.ts]] · value
- [[agent.ts]] · value
- [[prompt.ts]] · value
- [[rate-limit.ts]] · value
- [[tools/index.ts]] · value
- [[assistant/types.ts]] · value
- [[coding/analysis.ts]] · value
- [[example.ts]] · value
- [[tree.ts]] · value
- [[io/index.ts]] · value
- [[transform/index.ts]] · value
- [[ai-tools.ts]] · type-only
- [[claude.ts]] · value
- [[procedures/index.ts]] · value
- [[vitest]] · value

## Calls
- [[assistant/actions.ts#addToOutput|addToOutput()]]
- [[claude.ts#AiUnavailableError|AiUnavailableError]]
- [[tools/index.ts#allTools|allTools()]]
- [[assistant/actions.ts#applyProposal|applyProposal()]]
- [[example.ts#buildWorkedExample|buildWorkedExample()]]
- [[coding/analysis.ts#codeByAttribute|codeByAttribute()]]
- [[prompt.ts#compactSystemPrompt|compactSystemPrompt()]]
- [[tools/index.ts#compactTools|compactTools()]]
- [[procedure.ts#defaultOptions|defaultOptions()]]
- [[tree.ts#descendantIds|descendantIds()]]
- [[coding-types.ts#emptyCodingProject|emptyCodingProject()]]
- [[agent.ts#fitMessages|fitMessages()]]
- [[io/index.ts#importFile|importFile()]]
- [[rate-limit.ts#RateLimiter|RateLimiter]]
- [[controller.ts#retryLast|retryLast()]]
- [[agent.ts#runAgent|runAgent()]]
- [[controller.ts#runArtifact|runArtifact()]]
- [[cases.ts#selectCasesTransform|selectCasesTransform()]]
- [[controller.ts#sendMessage|sendMessage()]]
- [[controller.ts#stopAssistant|stopAssistant()]]
- [[prompt.ts#systemPrompt|systemPrompt()]]

## Uses
- [[assistant/types.ts#DEFAULT_PERMISSIONS|DEFAULT_PERMISSIONS]]
- [[procedures/index.ts#procedures|procedures]]
- [[useAssistantChat]]
- [[useStore]]

## Reads
- [[entries|useAssistantChat.entries]] · alias, getState
- [[useAssistantChat/history|useAssistantChat.history]] · getState
- [[running|useAssistantChat.running]] · getState
- [[dataset|useStore.dataset]] · getState
- [[outputs|useStore.outputs]] · getState

## Writes
- [[outputs|useStore.outputs]] · setState

## Calls store actions
- [[clear()|useAssistantChat.clear()]] · getState
- [[setDataset()|useStore.setDataset()]] · getState
- [[undo()|useStore.undo()]] · getState

## Tests
- [[Descriptive Statistics|Analyze > Descriptive Statistics]] · menu label
- [[Procedures/correlations|Bivariate Correlations]] · procedure id
- [[codes_by_attribute]] · tool name
- [[Transforms/compute|compute]] · transform id
- [[Procedures/crosstabs|Crosstabs]] · procedure id
- [[Weight cases|Data > Weight cases...]] · menu label
- [[describe_variables]] · tool name
- [[Procedures/descriptives|Descriptives]] · procedure id
- [[Procedures/frequencies|Frequencies]] · procedure id
- [[get_cases]] · tool name
- [[get_coded_segments]] · tool name
- [[get_dataset_overview]] · tool name
- [[get_output]] · tool name
- [[Procedures/ttest-independent|Independent-Samples T Test]] · procedure id
- [[Procedures/models.linear|Linear Regression]] · procedure id
- [[list_analyses]] · tool name
- [[list_codes]] · tool name
- [[list_outputs]] · tool name
- [[Procedures/oneway-anova|One-Way ANOVA]] · procedure id
- [[propose_transform]] · tool name
- [[Procedures/models.reliability|Reliability Analysis]] · procedure id
- [[Transforms/reverse|reverse]] · transform id
- [[run_analysis]] · tool name
- [[Transforms/scale|scale]] · transform id
- [[search_help]] · tool name
- [[search_text]] · tool name
- [[coding-types.ts]] · import
- [[output.ts]] · import
- [[procedure.ts]] · import
- [[store.ts]] · import
- [[core/types.ts]] · import
- [[chat-store.ts]] · import
- [[controller.ts]] · import
- [[assistant/actions.ts]] · import
- [[agent.ts]] · import
- [[prompt.ts]] · import
- [[rate-limit.ts]] · import
- [[tools/index.ts]] · import
- [[assistant/types.ts]] · import
- [[coding/analysis.ts]] · import
- [[example.ts]] · import
- [[tree.ts]] · import
- [[io/index.ts]] · import
- [[transform/index.ts]] · import
- [[ai-tools.ts]] · import
- [[claude.ts]] · import
- [[procedures/index.ts]] · import

## Private helpers
SAV (line 31) · base (line 32) · vid() (line 40) · runProc() (line 47) · apaOf() (line 53) · tableOf() (line 54) · fakeModel() (line 63) · seq (line 81) · call() (line 82) · say() (line 83) · snap() (line 85) · scenario() (line 89) · testStore() (line 643)
