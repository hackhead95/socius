---
id: tests/transform/project.test.ts
type: test
file: tests/transform/project.test.ts
area: tests
---

# tests/transform/project.test.ts

*Test file* · area [[tests]] · 64 lines

## Test cases
- **project file**
  - round-trips data exactly, including NaN, -0 and -Infinity
  - base64 helpers are exact
  - rejects non-projects with helpful messages
  - accepts a project without a dataset
  - makes safe file names

## Imports
- [[coding-types.ts]] · value
- [[projectFile.ts]] · value
- [[transform/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[projectFile.ts#base64ToFloat64|base64ToFloat64()]]
- [[transform/helpers.ts#col|col()]]
- [[transform/helpers.ts#ds|ds()]]
- [[coding-types.ts#emptyCodingProject|emptyCodingProject()]]
- [[projectFile.ts#float64ToBase64|float64ToBase64()]]
- [[projectFile.ts#parseProject|parseProject()]]
- [[projectFile.ts#projectFileName|projectFileName()]]
- [[projectFile.ts#serializeProject|serializeProject()]]

## Uses
- [[projectFile.ts#ProjectError|ProjectError]]

## Tests
- [[coding-types.ts]] · import
- [[projectFile.ts]] · import
