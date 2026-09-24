---
id: src/lib/coding/example.ts
type: module
file: src/lib/coding/example.ts
area: lib/coding
---

# src/lib/coding/example.ts

*Module* · area [[lib - coding|lib/coding]] · 424 lines

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

## Imported by
- [[coding/actions.ts]] · value
- [[CodingWorkspace.tsx]] · value
- [[scenarios.test.ts]] · value
- [[example.test.ts]] · value

## Types
WorkedExample (line 335)

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

### canBuildWorkedExample
*function* · line 345 · exported
> True when the dataset can host the worked example (the bundled sample with its open question).
- Uses: [[example.ts#EXAMPLE_QUESTION|EXAMPLE_QUESTION]]
- Used in: [[CodingWorkspace.tsx]], [[coding/actions.ts]], [[example.test.ts]]

### starterCodes
*function* · line 355 · exported
> The starter codebook as CodeDefs: each theme followed by its codes. Codes get distinct highlighter colours; the themes (which hold no coding of their own) share the last palette colour.
- Calls: [[core/types.ts#newId|newId()]]
- Uses: [[example.ts#STARTER_CODEBOOK|STARTER_CODEBOOK]], [[palette.ts#CODE_PALETTE|CODE_PALETTE]]

### buildWorkedExample
*function* · line 392 · exported
> Build the worked example for the bundled sample survey: response documents with gender, city and area, the starter codebook, and whole-response auto-coding from its keyword rules (origin 'auto-rule', coded as `coder`).
- Calls: [[core/types.ts#newId|newId()]], [[example.ts#starterCodes|starterCodes()]], [[rules.ts#findRuleMatches|findRuleMatches()]], [[survey.ts#buildResponseDocs|buildResponseDocs()]]
- Uses: [[example.ts#EXAMPLE_ATTRIBUTES|EXAMPLE_ATTRIBUTES]], [[example.ts#EXAMPLE_ID_VARIABLE|EXAMPLE_ID_VARIABLE]], [[example.ts#EXAMPLE_QUESTION|EXAMPLE_QUESTION]]
- Used in: [[coding/actions.ts]], [[scenarios.test.ts]], [[example.test.ts]]
