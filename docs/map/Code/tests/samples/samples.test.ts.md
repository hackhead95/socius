---
id: tests/samples/samples.test.ts
type: test
file: tests/samples/samples.test.ts
area: tests
---

# tests/samples/samples.test.ts

*Test file* · area [[tests]] · 139 lines

## Test cases
- **bundled sample survey file**
  - exists, is an SPSS system file and has a sensible size
  - has a matching CSV copy with 640 data rows
  - is listed in samples
- **sample survey through lib/io**
  - imports as 640 cases with the expected dictionary
- **loadSampleDataset**
  - fetches the bundled file and marks it as a sample
  - rejects an unknown id
- **assetBytes**
  - decodes an inlined base64 data: URL (single-file build) without fetch
- **sample transcripts**
  - has three fictional transcripts of 1,500 to 2,500 words

## Imports
- [[node-fs|node:fs]] · value
- [[node-url|node:url]] · value
- [[core/types.ts]] · type-only
- [[io/index.ts]] · value
- [[samples/index.ts]] · value
- [[vitest]] · value

## Calls
- [[samples/index.ts#assetBytes|assetBytes()]]
- [[io/index.ts#importFile|importFile()]]
- [[samples/index.ts#loadSampleDataset|loadSampleDataset()]]

## Uses
- [[samples/index.ts#SAMPLE_SURVEY_FILE|SAMPLE_SURVEY_FILE]]
- [[samples/index.ts#samples|samples]]
- [[samples/index.ts#sampleTranscripts|sampleTranscripts]]

## Tests
- [[core/types.ts]] · import
- [[io/index.ts]] · import
- [[samples/index.ts]] · import

## Private helpers
SAV (line 8) · CSV (line 9) · EXPECTED_NAMES (line 11) · tryImport() (line 19) · SKIP_NOTE (line 29)
