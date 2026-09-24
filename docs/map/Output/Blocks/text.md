---
id: "output-kind:text"
type: output-kind
file: src/core/output.ts
area: core
---

# text

*Output block kind* · defined in [[output.ts]] · area [[core]]

## Created by
- [[graphs/index.ts#barChart|barChart]]
- [[graphs/index.ts#boxPlot|boxPlot]]
- [[outputs.ts#codeByAttributeOutput|codeByAttributeOutput()]]
- [[outputs.ts#cooccurrenceOutput|cooccurrenceOutput()]]
- [[outputs.ts#frequenciesOutput|frequenciesOutput()]]
- [[graphs/index.ts#histogram|histogram]]
- [[graphs/index.ts#lineChart|lineChart]]
- [[graphs/index.ts#pieChart|pieChart]]
- [[graphs/index.ts#pyramid|pyramid]]
- [[outputs.ts#reliabilityOutput|reliabilityOutput()]]
- [[graphs/index.ts#scatter|scatter]]
- [[core/common.ts#text|text()]]
- [[log.ts#transformLogItem|transformLogItem()]]
- [[useExplain]]

## Handled by
- [[BlockView|<BlockView>]] · renderer
- [[assistant/format.ts#blockText|blockText()]] · consumer
- [[reportHtml.ts#blockVisible|blockVisible()]] · exporter
- [[exportDocx.ts#buildDocx|buildDocx()]] · exporter
- [[procedures/text.ts#cleanBlocks|cleanBlocks()]] · consumer
- [[explainPrompt.ts#isExplainable|isExplainable()]] · consumer
- [[reportHtml.ts#itemToHtml|itemToHtml()]] · exporter
- [[exportText.ts#itemToText|itemToText()]] · exporter
- [[explainPrompt.ts#outputItemContext|outputItemContext()]] · consumer
- [[assistant/format.ts#outputItemText|outputItemText()]] · consumer
