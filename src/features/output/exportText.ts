// Output items -> plain text (for .txt export and plain-text clipboard fallbacks).
import type { OutputItem } from '../../core/output';
import { itemMeta, blockVisible, type ReportOptions } from './reportHtml';
import { tableToText } from './tableRender';
import { chartDataTable } from '../charts/dataTable';
import { formatNumber } from './format';

function wrap(text: string, width = 96): string {
  return text
    .split('\n')
    .map((para) => {
      const words = para.split(/\s+/);
      const lines: string[] = [];
      let cur = '';
      for (const w of words) {
        if (cur && (cur + ' ' + w).length > width) {
          lines.push(cur);
          cur = w;
        } else cur = cur ? cur + ' ' + w : w;
      }
      if (cur) lines.push(cur);
      return lines.join('\n');
    })
    .join('\n');
}

export function itemToText(item: OutputItem, opts: ReportOptions): string {
  const out: string[] = [];
  out.push(item.title.toUpperCase());
  out.push(itemMeta(item).join(' | '));
  if (item.caseNote) out.push(item.caseNote);
  out.push('');
  for (const b of item.blocks) {
    if (!blockVisible(b, opts)) continue;
    switch (b.kind) {
      case 'heading':
        out.push(b.text, '');
        break;
      case 'table':
        out.push(tableToText(b.table, opts.style), '');
        break;
      case 'chart': {
        const d = chartDataTable(b.chart);
        out.push(`[Chart] ${b.chart.title}`);
        const fmt = (v: string | number | null) => (v === null ? '' : typeof v === 'number' ? formatNumber(v, undefined) : v);
        const rows = [d.columns, ...d.rows.slice(0, 40).map((r) => r.map(fmt))];
        const widths = d.columns.map((_, c) => Math.max(...rows.map((r) => String(r[c] ?? '').length)));
        for (const r of rows) out.push('  ' + r.map((v, c) => (c === 0 ? String(v).padEnd(widths[c]) : String(v).padStart(widths[c]))).join('  ').trimEnd());
        if (d.rows.length > 40) out.push(`  (${d.rows.length - 40} more rows not shown)`);
        out.push('');
        break;
      }
      case 'text': {
        const prefix = b.style === 'interpretation' ? 'What this means: ' : b.style === 'apa' ? 'APA-style report: ' : b.style === 'warning' ? 'Check this: ' : '';
        out.push(wrap(prefix + b.text), '');
        break;
      }
    }
  }
  if (opts.includeSyntax && item.syntax) out.push('Syntax:', item.syntax, '');
  return out.join('\n');
}

export function reportToText(items: OutputItem[], opts: ReportOptions): string {
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const head = `Analysis report (Socius), ${date}\n${'='.repeat(40)}\n\n`;
  return head + items.map((i) => itemToText(i, opts)).join('\n' + '-'.repeat(40) + '\n\n');
}
