---
id: tests/io/sav-spssio.test.ts
type: test
file: tests/io/sav-spssio.test.ts
area: tests
---

# tests/io/sav-spssio.test.ts

*Test file* · area [[tests]] · 34 lines

> Files written by Socius, read by IBM's SPSS I/O library (libspssdio from SPSS 20, bundled with the savReaderWriter Python package): the same code SPSS Statistics uses to open .sav files. Skipped with a reason when Python or savReaderWriter is not installed (e.g. in CI).

## Imports
- [[node-child_process|node:child_process]] · value
- [[node-fs|node:fs]] · value
- [[node-path|node:path]] · value
- [[sav-writer.ts]] · value
- [[datasets.ts]] · value
- [[io/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[datasets.ts#edgeDataset|edgeDataset()]]
- [[io/helpers.ts#expectSpssioMatches|expectSpssioMatches()]]
- [[io/helpers.ts#tempPath|tempPath()]]
- [[sav-writer.ts#writeSav|writeSav()]]

## Uses
- [[io/helpers.ts#HAS_ORACLE|HAS_ORACLE]]
- [[io/helpers.ts#PYTHON|PYTHON]]
- [[io/helpers.ts#ROOT|ROOT]]

## Tests
- [[sav-writer.ts]] · import

## Private helpers
SCRIPT (line 12) · HAS_SPSSIO (line 13) · spssioRead() (line 15)
