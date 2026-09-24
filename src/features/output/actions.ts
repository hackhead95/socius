// Browser-side output actions: copy as rich HTML, save charts, export the report. All file saves go
// through platform/host (saveFile) so they work inside the claude.ai Artifact sandbox.
import type { ChartSpec, OutputItem, OutputTable } from '../../core/output';
import { copyToClipboard, saveFile, type SaveOutcome } from '../../platform/host';
import { useStore } from '../../core/store';
import { chartToPng, chartToPngDataUrl, chartToSvg, fileStem } from '../charts/export';
import type { TableStyle } from './format';
import { itemToHtml, reportToHtmlDocument, type ReportOptions } from './reportHtml';
import { itemToText, reportToText } from './exportText';
import { tableToHtml, tableToText } from './tableRender';
import { useOutputPrefs } from './viewPrefs';
import { useUi } from '../../app/ui-store';
import { logFailure } from '../../platform/errorlog';

const MIME = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  html: 'text/html;charset=utf-8',
  txt: 'text/plain;charset=utf-8',
  png: 'image/png',
  svg: 'image/svg+xml',
};

function toast(text: string, tone: 'info' | 'success' | 'warning' | 'error' = 'info') {
  useStore.getState().toast(text, tone);
}

function report(outcome: SaveOutcome, filename: string) {
  if (outcome === 'saved') toast(`Saved ${filename}`, 'success');
  else if (outcome === 'declined') toast('Download cancelled.', 'info');
  else toast(`Could not save ${filename}. Your browser blocked the download.`, 'error');
}

function dateStamp(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function reportFileStem(items: OutputItem[]): string {
  const ds = items.find((i) => i.datasetName)?.datasetName;
  return `${fileStem(ds ? `${ds} output` : 'socius output')}-${dateStamp()}`;
}

const PASTE_FONT = undefined; // inherit the target document's font when pasting

export async function copyItem(item: OutputItem, opts: ReportOptions): Promise<void> {
  const images = new Map<number, string>();
  try {
    for (let i = 0; i < item.blocks.length; i++) {
      const b = item.blocks[i];
      if (b.kind === 'chart') {
        // APA: the copy prints "Figure N" and the italic title above the image, so the image leaves it out.
        const { url, width, height } = await chartToPngDataUrl(b.chart, undefined, { showTitle: opts.style !== 'apa' });
        images.set(i, `<img src="${url}" width="${Math.round(width * 0.85)}" height="${Math.round(height * 0.85)}" alt="${b.chart.title.replace(/"/g, '&quot;')}">`);
      }
    }
  } catch {
    // Charts that cannot be rasterised are left out of the copy; tables and text still copy.
  }
  const html = `<div>${itemToHtml(item, opts, { table: 0, figure: 0 }, (_b, i) => images.get(i) ?? null, PASTE_FONT)}</div>`;
  const ok = await copyToClipboard(itemToText(item, opts), html);
  toast(ok ? 'Copied. Paste into Word or Google Docs to keep the formatting.' : 'Copy failed. Your browser did not allow clipboard access.', ok ? 'success' : 'error');
}

export async function copyTable(table: OutputTable, style: TableStyle, number?: number): Promise<void> {
  const ok = await copyToClipboard(tableToText(table, style), `<div>${tableToHtml(table, { style, number })}</div>`);
  toast(ok ? 'Table copied. Paste into Word or Google Docs.' : 'Copy failed. Your browser did not allow clipboard access.', ok ? 'success' : 'error');
}

export async function copyText(text: string, what = 'Text'): Promise<void> {
  const ok = await copyToClipboard(text);
  toast(ok ? `${what} copied.` : 'Copy failed. Your browser did not allow clipboard access.', ok ? 'success' : 'error');
}

export async function saveTableXlsx(table: OutputTable, style: TableStyle): Promise<void> {
  try {
    const { tablesToXlsx } = await import('./exportXlsx');
    const blob = await tablesToXlsx([table], style);
    const name = `${fileStem(table.title)}.xlsx`;
    report(await saveFile(name, blob, MIME.xlsx), name);
  } catch (e) {
    logFailure('export', e, { op: 'table xlsx' });
    toast(`Excel export failed: ${(e as Error).message}`, 'error');
  }
}

export async function saveChartPng(spec: ChartSpec): Promise<void> {
  try {
    const png = await chartToPng(spec);
    const name = `${fileStem(spec.title)}.png`;
    report(await saveFile(name, png.blob, MIME.png), name);
  } catch (e) {
    logFailure('export', e, { op: 'chart png' });
    toast(`Could not create the image: ${(e as Error).message}`, 'error');
  }
}

export async function saveChartSvg(spec: ChartSpec): Promise<void> {
  try {
    const { svg } = chartToSvg(spec);
    const name = `${fileStem(spec.title)}.svg`;
    report(await saveFile(name, svg, MIME.svg), name);
  } catch (e) {
    logFailure('export', e, { op: 'chart svg' });
    toast(`Could not create the image: ${(e as Error).message}`, 'error');
  }
}

export type ReportFormat = 'docx' | 'html' | 'xlsx' | 'txt';

export async function exportReport(items: OutputItem[], format: ReportFormat, opts: ReportOptions): Promise<void> {
  if (!items.length) {
    toast('There is no output to export yet.', 'info');
    return;
  }
  const stem = reportFileStem(items);
  const filename = `${stem}.${format}`;
  try {
    let data: Blob | Uint8Array | string;
    if (format === 'docx') {
      const { buildDocx } = await import('./exportDocx');
      data = await buildDocx(items, { ...opts, style: 'apa' }, async (spec) => {
        try {
          // Word is always APA: "Figure N" and the italic title are paragraphs above the image.
          const p = await chartToPng(spec, undefined, 2, { showTitle: false });
          return { bytes: p.bytes, width: p.width, height: p.height };
        } catch {
          return null;
        }
      });
    } else if (format === 'html') {
      data = reportToHtmlDocument(items, opts, (b) => {
        try {
          const { svg } = chartToSvg(b.chart, undefined, { showTitle: opts.style !== 'apa' });
          return svg.replace(/^<\?xml[^>]*>\s*/, '');
        } catch {
          return null;
        }
      });
    } else if (format === 'xlsx') {
      const tables = items.flatMap((i) => i.blocks.flatMap((b) => (b.kind === 'table' ? [b.table] : [])));
      if (!tables.length) {
        toast('The output has no tables to put in a spreadsheet.', 'info');
        return;
      }
      const { tablesToXlsx } = await import('./exportXlsx');
      data = await tablesToXlsx(tables, opts.style);
    } else {
      data = reportToText(items, opts);
    }
    report(await saveFile(filename, data, MIME[format]), filename);
  } catch (e) {
    logFailure('export', e, { op: `report ${format}` });
    toast(`Export failed: ${(e as Error).message}`, 'error');
  }
}

/** The report formats, in menu order. Shared by File > Export output report and the Output toolbar. */
export const REPORT_FORMATS: Array<{ f: ReportFormat; label: string; help: string }> = [
  { f: 'docx', label: 'Word document (.docx)', help: 'APA tables and figures, ready to edit' },
  { f: 'html', label: 'Web page (.html)', help: 'Standalone and printable' },
  { f: 'xlsx', label: 'Excel workbook (.xlsx)', help: 'One sheet per table' },
  { f: 'txt', label: 'Plain text (.txt)', help: 'Tables as aligned text' },
];

/** Export every output item with the Output view's current settings (table style, interpretations, syntax). */
export function exportAllOutput(format: ReportFormat): Promise<void> {
  const { tableStyle, showInterpretations, showSyntax } = useOutputPrefs.getState();
  return exportReport(useStore.getState().outputs, format, { style: tableStyle, includeInterpretations: showInterpretations, includeSyntax: showSyntax });
}

/** One confirmation for clearing the output, used by Edit > Clear output... and the Output toolbar. */
export async function confirmAndClearOutputs(): Promise<void> {
  const n = useStore.getState().outputs.length;
  if (!n) return;
  const ok = await useUi.getState().confirm({
    title: 'Clear all output?',
    message: `This removes all ${n} result${n === 1 ? '' : 's'} from the Output view and cannot be undone. Export a report first if you want to keep them.`,
    confirmLabel: 'Clear output',
    danger: true,
  });
  if (ok) useStore.getState().clearOutputs();
}
