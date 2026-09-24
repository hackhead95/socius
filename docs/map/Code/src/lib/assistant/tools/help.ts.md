---
id: src/lib/assistant/tools/help.ts
type: module
file: src/lib/assistant/tools/help.ts
area: lib/assistant
---

# src/lib/assistant/tools/help.ts

*Module* · area [[lib - assistant|lib/assistant]] · 37 lines

> search_help: the beginner's guide sections that best match a "how do I ... in Socius" question.

## Imports
- [[links.ts]] · value
- [[assistant/format.ts]] · value
- [[assistant/help.ts]] · value
- [[assistant/types.ts]] · type-only

## Imported by
- [[tools/index.ts]] · value

## Symbols

### searchHelp
*function* · line 7
- Calls: [[assistant/format.ts#trimToBytes|trimToBytes()]], [[assistant/help.ts#guideSections|guideSections()]], [[assistant/help.ts#rankSections|rankSections()]], [[assistant/help.ts#sectionText|sectionText()]]
- Uses: [[links.ts#FEEDBACK_URL|FEEDBACK_URL]], [[links.ts#GUIDE_URL|GUIDE_URL]], [[links.ts#SITE_URL|SITE_URL]]

### helpTools
*const* · line 26 · exported
- Uses: [[tools/help.ts#searchHelp|searchHelp()]]
- Used in: [[tools/index.ts]]
