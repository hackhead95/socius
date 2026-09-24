---
id: src/samples/index.ts
type: module
file: src/samples/index.ts
area: samples
---

# src/samples/index.ts

*Module* · area [[samples]] · 133 lines

> Bundled sample data: a synthetic survey (.sav) and three fictional interview transcripts. Everything here is invented teaching material. Regenerate the survey with `/opt/oracle/bin/python scripts/samples/make_survey.py` and check it with scripts/samples/check_survey.py.

## Imports
- [[core/types.ts]] · type-only
- [[io/index.ts]] · value
- `src/samples/transcripts/int01_kolkata_shyamali.txt` · value
- `src/samples/transcripts/int02_bengaluru_manoj.txt` · value
- `src/samples/transcripts/int03_delhi_sunita.txt` · value
- `src/samples/urban_trust_survey.sav` · value

## Tested by
- [[shell-fixes.test.ts]] · import
- [[example.test.ts]] · import
- [[samples.test.ts]] · import

## Imported by
- [[menus.ts]] · value
- [[Welcome.tsx]] · value
- [[ImportDialog.tsx]] · value
- [[fileActions.ts]] · value
- [[shell-fixes.test.ts]] · value
- [[example.test.ts]] · value
- [[samples.test.ts]] · value

## Types
SampleTranscript (line 12) · SampleInfo (line 18)

## Private helpers
SAMPLE_FILES (line 41) · COMMON (line 75)

## Symbols

### SAMPLE_SURVEY_FILE
*const* · line 25 · exported
> File name the bundled survey is imported under (and shown as its source).
- Used in: [[example.test.ts]], [[samples.test.ts]]

### samples
*const* · line 27 · exported
- Used in: [[Welcome.tsx]], [[menus.ts]], [[fileActions.ts]], [[samples.test.ts]]

### assetBytes
*function* · line 47 · exported
> Bytes behind a Vite asset URL. In the single-file build the URL is an inlined data: URL, which we decode directly (no fetch), so it also works where the host blocks fetch() of data: URLs.
- Used in: [[samples.test.ts]]

### loadSampleDataset
*function* · line 67 · exported
> Load the bundled sample survey (decoded from the bundled .sav via lib/io).
- Calls: [[io/index.ts#importFile|importFile()]], [[samples/index.ts#assetBytes|assetBytes()]]
- Uses: [[samples/index.ts]]
- Used in: [[fileActions.ts]], [[samples.test.ts]]

### sampleTranscripts
*const* · line 80 · exported
- Uses: [[samples/index.ts]]
- Used in: [[ImportDialog.tsx]], [[shell-fixes.test.ts]], [[samples.test.ts]]
