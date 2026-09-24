---
id: src/lib/coding/example.ts
type: module
file: src/lib/coding/example.ts
area: lib/coding
---

# src/lib/coding/example.ts

*Module* · area [[lib - coding|lib/coding]] · 466 lines

> Worked example for the bundled sample survey: the open-ended answers to q_challenge ("What is the biggest challenge facing your neighbourhood today?"), a starter codebook with keyword rules, and the rules applied once as auto-coding. Pure: the UI commits the result as one undo step. The rules cover the English, Hinglish, romanised Bengali, Bengali and Hindi wording used in the sample answers. T...

## Imports
- [[coding-types.ts]] · type-only
- [[core/types.ts]] · type-only, value
- [[palette.ts]] · value
- [[rules.ts]] · value
- [[survey.ts]] · value

## Tested by
- [[scenarios.test.ts]] · import
- [[example.test.ts]] · import
- [[ui-fixes.test.tsx]] · import

## Imported by
- [[coding/actions.ts]] · value
- [[CodebookPanel.tsx]] · value
- [[CodingWorkspace.tsx]] · value
- [[exampleGuide.ts]] · type-only
- [[scenarios.test.ts]] · value
- [[example.test.ts]] · value
- [[ui-fixes.test.tsx]] · value

## Types
ExampleGuide (line 340) · WorkedExample (line 375)

## Symbols

### EXAMPLE_QUESTION
*const* · line 17 · exported
> The open-ended question and the respondent characteristics the example brings in.

### EXAMPLE_ATTRIBUTES
*const* · line 18 · exported
- Used in: [[example.test.ts]]

### EXAMPLE_ID_VARIABLE
*const* · line 19 · exported

### STARTER_CODEBOOK
*const* · line 36 · exported

### DEFAULT_EXAMPLE_GUIDE
*const* · line 353 · exported

### codebookSize
*function* · line 362 · exported
> Size of a codebook as shown in the codebook panel: all codes, and how many are themes (codes with sub-codes).

### describeCodebookSize
*function* · line 368 · exported
> "15 codes (4 themes and 11 sub-codes)": the same total as the codebook panel's count.
- Calls: [[example.ts#codebookSize|codebookSize()]]
- Used in: [[CodebookPanel.tsx]], [[CodingWorkspace.tsx]], [[ui-fixes.test.tsx]]

### canBuildWorkedExample
*function* · line 385 · exported
> True when the dataset can host the worked example (the bundled sample with its open question).
- Uses: [[example.ts#EXAMPLE_QUESTION|EXAMPLE_QUESTION]]
- Used in: [[CodingWorkspace.tsx]], [[coding/actions.ts]], [[example.test.ts]]

### starterCodes
*function* · line 395 · exported
> The starter codebook as CodeDefs: each theme followed by its codes. Codes get distinct highlighter colours; the themes (which hold no coding of their own) share the last palette colour.
- Calls: [[core/types.ts#newId|newId()]]
- Uses: [[example.ts#STARTER_CODEBOOK|STARTER_CODEBOOK]], [[palette.ts#CODE_PALETTE|CODE_PALETTE]]

### buildWorkedExample
*function* · line 432 · exported
> Build the worked example for the bundled sample survey: response documents with gender, city and area, the starter codebook, and whole-response auto-coding from its keyword rules (origin 'auto-rule', coded as `coder`).
- Calls: [[core/types.ts#newId|newId()]], [[example.ts#describeCodebookSize|describeCodebookSize()]], [[example.ts#starterCodes|starterCodes()]], [[rules.ts#findRuleMatches|findRuleMatches()]], [[survey.ts#buildResponseDocs|buildResponseDocs()]]
- Uses: [[example.ts#DEFAULT_EXAMPLE_GUIDE|DEFAULT_EXAMPLE_GUIDE]], [[example.ts#EXAMPLE_ATTRIBUTES|EXAMPLE_ATTRIBUTES]], [[example.ts#EXAMPLE_ID_VARIABLE|EXAMPLE_ID_VARIABLE]], [[example.ts#EXAMPLE_QUESTION|EXAMPLE_QUESTION]]
- Used in: [[coding/actions.ts]], [[scenarios.test.ts]], [[example.test.ts]], [[ui-fixes.test.tsx]]
