---
id: "output-kind:chart"
type: output-kind
file: src/core/output.ts
area: core
---

# chart

*Output block kind* · defined in [[output.ts]] · area [[core]]

## Variants
- [[Charts/bar|bar]]
- [[box]]
- [[heatmap]]
- [[Charts/histogram|histogram]]
- [[line]]
- [[pie]]
- [[pyramid]]
- [[scatter]]

## Created by
- [[graphs/index.ts#boxPlot|boxPlot]]
- [[outputs.ts#codeByAttributeOutput|codeByAttributeOutput()]]
- [[outputs.ts#cooccurrenceOutput|cooccurrenceOutput()]]
- [[outputs.ts#frequenciesOutput|frequenciesOutput()]]
- [[core/crosstabs.ts#run|run()]]
- [[core/frequencies.ts#run|run()]]
- [[correlations.ts#runCorrelations|runCorrelations()]]
- [[core/descriptives.ts#runExplore|runExplore()]]
- [[oneway.ts#runOneway|runOneway()]]
- [[outputs.ts#wordFrequencyOutput|wordFrequencyOutput()]]

## Handled by
- [[BlockView|<BlockView>]] · renderer
- [[OutputViewer|<OutputViewer>]] · renderer
- [[OutputViewer.tsx#blockLabel|blockLabel()]] · renderer
- [[assistant/format.ts#blockText|blockText()]] · consumer
- [[exportDocx.ts#buildDocx|buildDocx()]] · exporter
- [[output/actions.ts#copyItem|copyItem()]] · renderer
- [[explainPrompt.ts#isExplainable|isExplainable()]] · consumer
- [[reportHtml.ts#itemToHtml|itemToHtml()]] · exporter
- [[exportText.ts#itemToText|itemToText()]] · exporter
- [[explainPrompt.ts#outputItemContext|outputItemContext()]] · consumer
- [[OutputViewer.tsx#outputNumbering|outputNumbering()]] · renderer
