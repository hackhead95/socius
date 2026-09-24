---
id: "output-kind:heading"
type: output-kind
file: src/core/output.ts
area: core
---

# heading

*Output block kind* · defined in [[output.ts]] · area [[core]]

## Created by
- [[core/common.ts#heading|heading()]]

## Handled by
- [[BlockView|<BlockView>]] · renderer
- [[OutputViewer.tsx#blockLabel|blockLabel()]] · renderer
- [[assistant/format.ts#blockText|blockText()]] · consumer
- [[exportDocx.ts#buildDocx|buildDocx()]] · exporter
- [[reportHtml.ts#itemToHtml|itemToHtml()]] · exporter
- [[exportText.ts#itemToText|itemToText()]] · exporter
- [[explainPrompt.ts#outputItemContext|outputItemContext()]] · consumer
