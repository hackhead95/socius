---
id: "area:features/output"
type: area
area: features/output
---

# Area: features/output

11 files, 1842 lines.

## Depends on (module imports)
- [[core]]: 11
- [[features - ai|features/ai]]: 4
- [[features - charts|features/charts]]: 4
- [[platform]]: 3
- [[Areas/app|app]]: 2
- [[procedures]]: 1
- [[ui]]: 1

## Used by areas
- [[Areas/app|app]]: 2
- [[features - ai|features/ai]]: 2
- [[features - analysis|features/analysis]]: 2
- [[lib - assistant|lib/assistant]]: 1
- [[procedures]]: 1

## Files
- [[output/actions.ts]]: Browser-side output actions: copy as rich HTML, save charts, export the report. All file saves go through platform/host (saveFile) so they w…
- [[exportDocx.ts]]: Output items -> Word (.docx) with the `docx` library. Tables become real Word tables in APA style (horizontal rules only, bold header, no ve…
- [[exportText.ts]]: Output items -> plain text (for .txt export and plain-text clipboard fallbacks).
- [[exportXlsx.ts]]: Output tables -> .xlsx (one sheet per table). Numbers stay numbers with Excel formats that match the on-screen formatting; p < .001 is writt…
- [[output/format.ts]]: Number formatting for output tables. Pure functions (unit-tested); every renderer and exporter (screen, clipboard, Word, HTML, Excel, text) …
- [[output/icons.tsx]]: Small stroke icons (currentColor) used by the output viewer and analysis dialogs.
- [[OutputTableView.tsx]]
- [[OutputViewer.tsx]]: The Output viewer: a document of analysis results (like the SPSS Output Viewer) with an outline navigator, APA/SPSS table styles, per-item a…
- [[reportHtml.ts]]: Output items -> HTML. `itemToHtml` produces a fragment with inline styles only (safe to paste into Word or Google Docs); `reportToHtmlDocume…
- [[tableRender.ts]]: Output table -> HTML string (inline styles, for Word/Google Docs paste and the HTML report) and -> plain text. Pure: no DOM, so exporters an…
- [[viewPrefs.ts]]: Output viewer preferences (per browser, remembered across sessions when storage is available).

## Components
[[BlockView|<BlockView>]] · [[ChartBlock|<ChartBlock>]] · [[EmptyState|<EmptyState>]] · [[ExplainButton|<ExplainButton>]] · [[ExportMenu|<ExportMenu>]] · [[IconArrowLeft|<IconArrowLeft>]] · [[IconArrowRight|<IconArrowRight>]] · [[IconChart|<IconChart>]] · [[IconChevron|<IconChevron>]] · [[IconCopy|<IconCopy>]] · [[IconDown|<IconDown>]] · [[IconDownload|<IconDownload>]] · [[IconOutline|<IconOutline>]] · [[IconSearch|<IconSearch>]] · [[IconTable|<IconTable>]] · [[IconText|<IconText>]] · [[IconTrash|<IconTrash>]] · [[IconUp|<IconUp>]] · [[IconWarn|<IconWarn>]] · [[IconX|<IconX>]] · [[OutputItemView|<OutputItemView>]] · [[OutputTableView|<OutputTableView>]] · [[OutputViewer|<OutputViewer>]] · [[Svg|<Svg>]] · [[SyntaxView|<SyntaxView>]]

## Hooks
[[useNumbering|useNumbering()]] · [[useScrollEdges|useScrollEdges()]]

## Stores
[[useOutputPrefs]]
