---
id: "area:lib/coding"
type: area
area: lib/coding
---

# Area: lib/coding

16 files, 2963 lines.

## Depends on (module imports)
- [[core]]: 21

## Used by areas
- [[features - coding|features/coding]]: 43
- [[lib - assistant|lib/assistant]]: 3
- [[features - assistant|features/assistant]]: 1

## Files
- [[coding/ai.ts]]: Prompt builders and response validators for AI-assisted coding. No network calls here: the feature layer sends prompts through platform/ai (…
- [[coding/analysis.ts]]: Code frequencies, co-occurrence and code-by-attribute counts. Pure functions over explicit lists of codes, documents and segments (callers f…
- [[codebookIO.ts]]: Codebook import/export as JSON and CSV. Hierarchy is kept via parent names (CSV) or ids (JSON).
- [[docxExports.ts]]: Word (DOCX) exports: codebook table (thesis appendix) and the qualitative report.
- [[example.ts]]: Worked example for the bundled sample survey: the open-ended answers to q_challenge ("What is the biggest challenge facing your neighbourhoo…
- [[exports.ts]]: Exports: coded segments table and the qualitative report (content + HTML). Word output lives in docxExports.ts so the docx library loads onl…
- [[importers.ts]]: Source importers: .docx text extraction, CSV parsing, plain-text normalisation.
- [[outputs.ts]]: OutputItem builders for the Output viewer (procedure 'coding').
- [[palette.ts]]: Highlighter colours for codes. Mid-luminance, saturated hues that stay distinguishable as a translucent fill on white paper and on the dark …
- [[coding/reliability.ts]]: Intercoder reliability: Cohen's kappa, percent agreement and Krippendorff's alpha (nominal). Units of analysis: - Survey responses (kind 're…
- [[rules.ts]]: Auto-coding: keyword / regex rules per code, applied to whole texts, sentences or paragraphs. Rule syntax (one rule per line): /regex/flags …
- [[segments.ts]]: Segment utilities: overlap tests, merging, subtracting ranges, paragraph runs for rendering.
- [[survey.ts]]: Open-ended survey answers (a string variable of the active dataset) -> response documents.
- [[text.ts]]: Text analysis: Unicode tokeniser, stopwords, word and bigram frequencies, sentences, KWIC. Works for any script with letters and combining m…
- [[toDataset.ts]]: Mixed-methods bridge: turn codes applied to open-ended responses into 0/1 dataset variables.
- [[tree.ts]]: Codebook hierarchy helpers (themes > sub-codes).
