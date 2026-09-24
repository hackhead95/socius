---
id: src/lib/coding/toDataset.ts
type: module
file: src/lib/coding/toDataset.ts
area: lib/coding
---

# src/lib/coding/toDataset.ts

*Module* · area [[lib - coding|lib/coding]] · 231 lines

> Mixed-methods bridge: turn codes applied to open-ended responses into 0/1 dataset variables.

## Imports
- [[coding-types.ts]] · type-only
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only, value

## Tested by
- [[dataset.test.ts]] · import

## Imported by
- [[ExportDialogs.tsx]] · value
- [[dataset.test.ts]] · value

## Types
ExportMode (line 17) · CodeVariablePlan (line 19) · CodeVariableBuild (line 32)

## Symbols

### CODE_ATTR
*const* · line 12 · exported
> Variable attributes recording where an exported code variable came from. The .sav export writes them as SPSS custom variable attributes, so the link survives saving and reopening the data.
- Used in: [[dataset.test.ts]]

### SOURCE_ATTR
*const* · line 13 · exported
- Used in: [[dataset.test.ts]]

### COUNT_CODE
*const* · line 15 · exported
> CODE_ATTR value of the "number of codes mentioned" variable.
- Used in: [[dataset.test.ts]]

### codeVarStem
*function* · line 46 · exported
> Suggested variable name stem for a code: "c_" + a sanitised, shortened name.
- Used in: [[dataset.test.ts]]

### findExportedVariable
*function* · line 66 · exported
> The numeric variable previously exported from `codeId` (or COUNT_CODE) for the question `sourceVarId`, identified by its origin attributes. The last one wins when there are several.
- Uses: [[toDataset.ts#CODE_ATTR|CODE_ATTR]], [[toDataset.ts#SOURCE_ATTR|SOURCE_ATTR]]
- Used in: [[dataset.test.ts]]

### buildCodeVariables
*function* · line 85 · exported
> Build one numeric 0/1 variable per code for response documents linked to `ds` (TextDoc.caseIndex, TextDoc.varId). Cases with a response get 0 or 1; cases without a response are system-missing. A response is linked only when its variable ...
- Calls: [[core/data.ts#uniqueVarName|uniqueVarName()]], [[core/types.ts#makeVariable|makeVariable()]], [[toDataset.ts#codeVarStem|codeVarStem()]], [[toDataset.ts#findExportedVariable|findExportedVariable()]]
- Uses: [[toDataset.ts#CODE_ATTR|CODE_ATTR]], [[toDataset.ts#COUNT_CODE|COUNT_CODE]], [[toDataset.ts#SOURCE_ATTR|SOURCE_ATTR]]
- Used in: [[ExportDialogs.tsx]], [[dataset.test.ts]]

### applyCodeVariables
*function* · line 214 · exported
> Apply a build to the dataset in one immutable update (one undo step): variables that replace an earlier export get their values (and origin attributes) overwritten where they are; new variables are inserted after `afterVarId` (or at the ...
- Used in: [[ExportDialogs.tsx]], [[dataset.test.ts]]
