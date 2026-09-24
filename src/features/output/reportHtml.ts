// Output items -> HTML. `itemToHtml` produces a fragment with inline styles only (safe to paste into
// Word or Google Docs); `reportToHtmlDocument` wraps items into a standalone, printable page.

import type { OutputBlock, OutputItem } from '../../core/output';
import type { TableStyle } from './format';
import { esc, tableToHtml } from './tableRender';

export interface ReportOptions {
  style: TableStyle;
  includeInterpretations: boolean;
  includeSyntax: boolean;
}

export interface Counters {
  table: number;
  figure: number;
}

/** Chart image provider: returns an <img>/<svg> HTML snippet for a chart block, or null to skip it. */
export type ChartHtml = (block: Extract<OutputBlock, { kind: 'chart' }>, index: number) => string | null;

const SERIF = "'Source Serif 4', Georgia, 'Times New Roman', serif";

export function formatItemTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function itemMeta(item: OutputItem): string[] {
  const parts: string[] = [];
  if (item.datasetName) parts.push(item.datasetName);
  parts.push(formatItemTime(item.createdAt));
  return parts;
}

/** Whether a block is shown under the given options. */
export function blockVisible(block: OutputBlock, opts: Pick<ReportOptions, 'includeInterpretations'>): boolean {
  return !(block.kind === 'text' && block.style === 'interpretation' && !opts.includeInterpretations);
}

export function itemToHtml(item: OutputItem, opts: ReportOptions, counters: Counters, chartHtml: ChartHtml, fontFamily?: string): string {
  const apa = opts.style === 'apa';
  const font = fontFamily ? `font-family:${fontFamily};` : '';
  const out: string[] = [];
  out.push(`<h2 style="${font}font-size:15pt;font-weight:bold;margin:18pt 0 2pt 0;">${esc(item.title)}</h2>`);
  const meta = itemMeta(item).join(' · ');
  out.push(`<p style="${font}font-size:9pt;color:#5d6878;margin:0 0 ${item.caseNote ? '2pt' : '8pt'} 0;">${esc(meta)}</p>`);
  if (item.caseNote) out.push(`<p style="${font}font-size:9pt;color:#5d6878;margin:0 0 8pt 0;">${esc(item.caseNote)}</p>`);
  item.blocks.forEach((b, i) => {
    if (!blockVisible(b, opts)) return;
    switch (b.kind) {
      case 'heading':
        out.push(`<h3 style="${font}font-size:12pt;font-weight:bold;margin:12pt 0 4pt 0;">${esc(b.text)}</h3>`);
        break;
      case 'table':
        counters.table++;
        out.push(`<div style="overflow-x:auto;">${tableToHtml(b.table, { style: opts.style, number: apa ? counters.table : undefined, fontFamily })}</div>`);
        break;
      case 'chart': {
        const html = chartHtml(b, i);
        if (!html) break;
        counters.figure++;
        if (apa) {
          out.push(`<p style="margin:12pt 0 0 0;${font}font-size:11pt;font-weight:bold;">Figure ${counters.figure}</p>`);
          out.push(`<p style="margin:4pt 0 6pt 0;${font}font-size:11pt;font-style:italic;">${esc(b.chart.title)}</p>`);
        }
        out.push(`<div style="margin:6pt 0 10pt 0;">${html}</div>`);
        break;
      }
      case 'text': {
        const text = esc(b.text).replace(/\n/g, '<br>');
        if (b.style === 'interpretation')
          out.push(`<p style="${font}font-size:11pt;margin:8pt 0;padding:6pt 10pt;border-left:3px solid #2c4a9e;background:#e3e9f8;"><b>What this means.</b> ${text}</p>`);
        else if (b.style === 'apa')
          out.push(`<p style="${font}font-size:11pt;margin:8pt 0;padding:6pt 10pt;border:1px solid #b7c0cc;"><span style="font-size:8.5pt;color:#5d6878;letter-spacing:0.06em;">APA-STYLE REPORT</span><br>${text}</p>`);
        else if (b.style === 'warning')
          out.push(`<p style="${font}font-size:10pt;margin:6pt 0;padding:5pt 10pt;border-left:3px solid #9a6200;background:#fbf0d9;color:#3b2a00;"><b>Check this:</b> ${text}</p>`);
        else out.push(`<p style="${font}font-size:9.5pt;margin:4pt 0;color:#5d6878;">${text}</p>`);
        break;
      }
    }
  });
  if (opts.includeSyntax && item.syntax) {
    out.push(`<p style="${font}font-size:9pt;font-weight:bold;margin:10pt 0 2pt 0;color:#5d6878;">Syntax</p>`);
    out.push(`<pre style="font-family:'IBM Plex Mono',Consolas,monospace;font-size:8.5pt;margin:0 0 8pt 0;padding:6pt 8pt;background:#f5f7f9;border:1px solid #d5dbe3;white-space:pre-wrap;">${esc(item.syntax)}</pre>`);
  }
  return out.join('\n');
}

/** Standalone HTML report (styled, printable). */
export function reportToHtmlDocument(items: OutputItem[], opts: ReportOptions, chartHtml: (block: Extract<OutputBlock, { kind: 'chart' }>, itemIndex: number, blockIndex: number) => string | null, title = 'Analysis report'): string {
  const counters: Counters = { table: 0, figure: 0 };
  const datasets = [...new Set(items.map((i) => i.datasetName).filter(Boolean))] as string[];
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const body = items.map((it, ii) => `<section class="item">${itemToHtml(it, opts, counters, (b, bi) => chartHtml(b, ii, bi))}</section>`).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap">
<style>
  body { margin: 0; background: #eef1f4; color: #19202b; font-family: ${SERIF}; line-height: 1.45; }
  main { max-width: 820px; margin: 24px auto; background: #ffffff; padding: 40px 56px; box-shadow: 0 1px 3px rgba(20,30,50,.12); }
  header h1 { font-size: 22pt; margin: 0 0 4pt 0; font-weight: 600; }
  header p { margin: 0; color: #5d6878; font-size: 10pt; }
  table { font-variant-numeric: tabular-nums; }
  .item { border-top: 1px solid #d5dbe3; margin-top: 18pt; }
  .item:first-of-type { border-top: 0; }
  svg, img { max-width: 100%; height: auto; }
  .wrap { overflow-x: auto; }
  @media (max-width: 640px) { main { padding: 20px 16px; margin: 0; } }
  @media print {
    body { background: #ffffff; }
    main { box-shadow: none; margin: 0; max-width: none; padding: 0; }
    table, svg, img, pre { break-inside: avoid; }
    h2, h3 { break-after: avoid; }
  }
</style>
</head>
<body>
<main>
<header>
<h1>${esc(title)}</h1>
<p>${esc([datasets.length ? `Data: ${datasets.join(', ')}` : '', `Created ${date} with Socius`].filter(Boolean).join(' · '))}</p>
</header>
${body}
</main>
</body>
</html>
`;
}
