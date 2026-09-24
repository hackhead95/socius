---
id: "ai-tool:search_help"
type: ai-tool
file: src/lib/assistant/tools/help.ts
line: 27
area: lib/assistant
---

# search_help

*Assistant tool* · defined in [[tools/help.ts]] (line 27) · area [[lib - assistant|lib/assistant]]

- **Description:** Search the Socius beginner's guide for step-by-step instructions (menus, dialogs, buttons). Use for any 'how do I ... in Socius' question before answering.
- **Tool kind:** read
- **In compact tool set:** yes

## Calls
- [[assistant/format.ts#byteLength|byteLength()]]
- [[assistant/help.ts#cleanGuideText|cleanGuideText()]]
- [[assistant/format.ts#enc|enc]]
- [[assistant/help.ts#guideSections|guideSections()]]
- [[assistant/help.ts#helpTokens|helpTokens()]]
- [[assistant/help.ts#rankSections|rankSections()]]
- [[assistant/help.ts#sectionsPromise|sectionsPromise]]
- [[assistant/help.ts#sectionText|sectionText()]]
- [[assistant/help.ts#splitGuide|splitGuide()]]
- [[assistant/help.ts#stem|stem()]]
- [[assistant/help.ts#STOP|STOP]]
- [[assistant/help.ts#SYNONYMS|SYNONYMS]]
- [[assistant/format.ts#trimToBytes|trimToBytes()]]

## Tested by
- [[assistant.spec.ts]] · tool name
- [[scenarios.test.ts]] · tool name

## Implemented by
- [[tools/help.ts#searchHelp|searchHelp()]]

## Listed by
- [[tools/index.ts#compactTools|compactTools()]]
