---
id: src/features/project/projectFile.ts
type: module
file: src/features/project/projectFile.ts
area: features/project
---

# src/features/project/projectFile.ts

*Module* · area [[features - project|features/project]] · 221 lines

> Socius project file (<name>.socius.json): dataset + output log + text-coding project + UI prefs. Numeric columns are stored as base64 of their raw little-endian float64 bytes, so every value (including system-missing NaN) round-trips exactly. Non-finite numbers elsewhere (NaN cells in output tables, -Infinity "LO" in missing ranges) are encoded as {"$n": "NaN"} since JSON has no NaN.

## Imports
- [[coding-types.ts]] · type-only, value
- [[output.ts]] · type-only
- [[store.ts]] · type-only
- [[core/types.ts]] · type-only
- [[buildInfo.ts]] · value

## Calls
- [[coding-types.ts#emptyCodingProject|emptyCodingProject()]]

## Tested by
- [[project.test.ts]] · import

## Imported by
- [[fileActions.ts]] · value
- [[persistence.ts]] · type-only
- [[project.test.ts]] · value

## Types
ProjectUi (line 17) · ProjectState (line 22)

## Private helpers
LITTLE_ENDIAN (line 31) · replacer() (line 66) · reviver() (line 71) · isObj() (line 103) · checkVariable() (line 107) · checkDataset() (line 135) · checkCoding() (line 176)

## Symbols

### PROJECT_FORMAT
*const* · line 13 · exported

### PROJECT_VERSION
*const* · line 14 · exported

### APP_VERSION
*const* · line 15 · exported
- Uses: [[buildInfo.ts#BUILD_INFO|BUILD_INFO]]

### ProjectError
*class* · line 29 · exported
- Used in: [[project.test.ts]]

### float64ToBase64
*function* · line 33 · exported
- Uses: [[projectFile.ts]]
- Used in: [[project.test.ts]]

### base64ToFloat64
*function* · line 47 · exported
- Calls: [[projectFile.ts#ProjectError|ProjectError]]
- Uses: [[projectFile.ts]]
- Used in: [[project.test.ts]]

### serializeProject
*function* · line 79 · exported
- Calls: [[projectFile.ts#float64ToBase64|float64ToBase64()]]
- Uses: [[projectFile.ts#APP_VERSION|APP_VERSION]], [[projectFile.ts#PROJECT_FORMAT|PROJECT_FORMAT]], [[projectFile.ts#PROJECT_VERSION|PROJECT_VERSION]], [[projectFile.ts]]
- Used in: [[fileActions.ts]], [[project.test.ts]]

### parseProject
*function* · line 191 · exported
> Parse and validate a project file. Throws ProjectError with a message a user can act on.
- Calls: [[projectFile.ts#ProjectError|ProjectError]], [[projectFile.ts]]
- Uses: [[projectFile.ts#PROJECT_FORMAT|PROJECT_FORMAT]], [[projectFile.ts#PROJECT_VERSION|PROJECT_VERSION]], [[projectFile.ts]]
- Used in: [[fileActions.ts]], [[project.test.ts]]

### projectFileName
*function* · line 217 · exported
> File name for saving: "<dataset name>.socius.json" with unsafe characters removed.
- Used in: [[fileActions.ts]], [[project.test.ts]]
