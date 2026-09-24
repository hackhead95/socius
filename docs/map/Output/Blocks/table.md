---
id: "output-kind:table"
type: output-kind
file: src/core/output.ts
area: core
---

# table

*Output block kind* · defined in [[output.ts]] · area [[core]]

## Created by
- [[graphs/index.ts#barChart|barChart]]
- [[graphs/index.ts#boxPlot|boxPlot]]
- [[outputs.ts#codeByAttributeOutput|codeByAttributeOutput()]]
- [[outputs.ts#cooccurrenceOutput|cooccurrenceOutput()]]
- [[outputs.ts#frequenciesOutput|frequenciesOutput()]]
- [[outputs.ts#kwicOutput|kwicOutput()]]
- [[graphs/index.ts#lineChart|lineChart]]
- [[graphs/index.ts#pieChart|pieChart]]
- [[graphs/index.ts#pyramid|pyramid]]
- [[outputs.ts#reliabilityOutput|reliabilityOutput()]]
- [[linear.ts#runLinear|runLinear()]]
- [[graphs/index.ts#scatter|scatter]]
- [[linear.ts#table|table()]]
- [[binary.ts#tbl|tbl()]]
- [[models/factor.ts#tbl|tbl()]]
- [[models/reliability.ts#tbl|tbl()]]
- [[nomreg.ts#tbl|tbl()]]
- [[plum.ts#tbl|tbl()]]
- [[outputs.ts#wordFrequencyOutput|wordFrequencyOutput()]]

## Handled by
- [[BlockView|<BlockView>]] · renderer
- [[OutputViewer|<OutputViewer>]] · renderer
- [[OutputViewer.tsx#blockLabel|blockLabel()]] · renderer
- [[assistant/format.ts#blockText|blockText()]] · consumer
- [[exportDocx.ts#buildDocx|buildDocx()]] · exporter
- [[output/actions.ts#exportReport|exportReport()]] · renderer
- [[explainPrompt.ts#isExplainable|isExplainable()]] · consumer
- [[reportHtml.ts#itemToHtml|itemToHtml()]] · exporter
- [[exportText.ts#itemToText|itemToText()]] · exporter
- [[explainPrompt.ts#outputItemContext|outputItemContext()]] · consumer
- [[OutputViewer.tsx#outputNumbering|outputNumbering()]] · renderer
