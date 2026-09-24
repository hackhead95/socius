// Exports: coded segments table and the qualitative report (content + HTML). Word output lives in
// docxExports.ts so the docx library loads only when a Word file is requested.

import type { CodeDef, CodedSegment, CodingProject, TextDoc } from '../../core/coding-types';
import { attributeKeys, codeFrequencies } from './analysis';
import { codePath, flattenTree, buildCodeTree, parentName } from './tree';

export type Row = Array<string | number>;

/** Header + rows of all coded segments, one row per segment. */
export function segmentTable(project: CodingProject, segments: CodedSegment[] = project.segments): { header: string[]; rows: Row[] } {
  const docs = new Map(project.docs.map((d) => [d.id, d]));
  const codes = new Map(project.codes.map((c) => [c.id, c]));
  const attrs = attributeKeys(project.docs);
  const header = ['Document', 'Type', ...attrs, 'Code', 'Parent code', 'Code path', 'Text', 'Start', 'End', 'Coder', 'Origin', 'Memo'];
  const rows: Row[] = [];
  const ordered = [...segments].sort((a, b) => {
    const da = docs.get(a.docId)?.name ?? '', db = docs.get(b.docId)?.name ?? '';
    return da.localeCompare(db, undefined, { numeric: true }) || a.start - b.start;
  });
  for (const s of ordered) {
    const d = docs.get(s.docId);
    const c = codes.get(s.codeId);
    if (!d || !c) continue;
    rows.push([
      d.name,
      d.kind === 'response' ? 'Response' : 'Document',
      ...attrs.map((k) => d.attributes?.[k] ?? ''),
      c.name,
      parentName(project.codes, c.id),
      codePath(project.codes, c.id),
      d.text.slice(s.start, s.end),
      s.start,
      s.end,
      s.coder,
      originLabel(s.origin),
      s.memo ?? '',
    ]);
  }
  return { header, rows };
}

export function originLabel(o: CodedSegment['origin']): string {
  return o === 'auto-rule' ? 'Auto-coded (rule)' : o === 'ai-suggested' ? 'AI suggestion (accepted)' : 'Manual';
}

/** Up to `n` example quotes for a code: distinct documents, preferring manual, medium-length passages. */
export function exampleQuotes(project: CodingProject, codeId: string, n = 3, maxLen = 320): Array<{ doc: TextDoc; text: string }> {
  const docs = new Map(project.docs.map((d) => [d.id, d]));
  const segs = project.segments.filter((s) => s.codeId === codeId && docs.has(s.docId));
  const score = (s: CodedSegment) => {
    const len = s.end - s.start;
    return (s.origin === 'manual' ? 0 : 1000) + (len < 30 ? 500 : 0) + Math.abs(len - 160) / 10;
  };
  const out: Array<{ doc: TextDoc; text: string }> = [];
  const usedDocs = new Set<string>();
  for (const s of [...segs].sort((a, b) => score(a) - score(b))) {
    if (usedDocs.has(s.docId)) continue;
    usedDocs.add(s.docId);
    const d = docs.get(s.docId)!;
    let t = d.text.slice(s.start, s.end).replace(/\s+/g, ' ').trim();
    if (t.length > maxLen) t = t.slice(0, maxLen).replace(/\s+\S*$/, '') + ' ...';
    out.push({ doc: d, text: t });
    if (out.length >= n) break;
  }
  return out;
}

export interface ReportData {
  title: string;
  generated: string;
  nDocuments: number;
  nResponses: number;
  nSegments: number;
  coders: string[];
  codes: Array<{
    code: CodeDef;
    depth: number;
    path: string;
    segments: number;
    docs: number;
    pctDocs: number;
    /** Documents (interviews, notes) coded with the code, and with the code or any sub-code. */
    documents: number;
    documentsInclSub: number;
    /** Open-ended responses coded with the code (and % of all responses), and incl. sub-codes. */
    responses: number;
    pctResponses: number;
    responsesInclSub: number;
    pctResponsesInclSub: number;
    hasChildren: boolean;
    quotes: Array<{ source: string; text: string }>;
  }>;
}

/** "12 (15 with sub-codes)" for themes whose sub-codes add sources; plain count otherwise. */
export function countWithSub(own: number, inclSub: number, pct?: number, pctInclSub?: number): string {
  const f = (n: number, p?: number) => (p === undefined ? `${n}` : `${n} (${p.toFixed(1)}%)`);
  return inclSub !== own ? `${f(own, pct)}; with sub-codes ${f(inclSub, pctInclSub)}` : f(own, pct);
}

/** Assemble report content (shared by the HTML and DOCX renderers). */
export function reportData(project: CodingProject, title = 'Qualitative coding report', quotesPerCode = 3): ReportData {
  const nodes = flattenTree(buildCodeTree(project.codes));
  const freq = codeFrequencies(project.codes, project.docs, project.segments);
  const fr = new Map(freq.rows.map((r) => [r.codeId, r]));
  // Interviews and survey answers are counted separately: "3 of 630 sources" mixes units.
  const byKind = (kind: TextDoc['kind']) => new Map(codeFrequencies(project.codes, project.docs.filter((d) => d.kind === kind), project.segments).rows.map((r) => [r.codeId, r]));
  const frD = byKind('document');
  const frR = byKind('response');
  const parents = new Set(project.codes.map((c) => c.parentId).filter(Boolean));
  return {
    title,
    generated: new Date().toISOString().slice(0, 10),
    nDocuments: project.docs.filter((d) => d.kind === 'document').length,
    nResponses: project.docs.filter((d) => d.kind === 'response').length,
    nSegments: project.segments.length,
    coders: [...new Set(project.segments.map((s) => s.coder))],
    codes: nodes.map((n) => ({
      code: n.code,
      depth: n.depth,
      path: codePath(project.codes, n.code.id),
      segments: fr.get(n.code.id)?.segments ?? 0,
      docs: fr.get(n.code.id)?.docs ?? 0,
      pctDocs: fr.get(n.code.id)?.pctDocs ?? 0,
      documents: frD.get(n.code.id)?.docs ?? 0,
      documentsInclSub: frD.get(n.code.id)?.docsInclSub ?? 0,
      responses: frR.get(n.code.id)?.docs ?? 0,
      pctResponses: frR.get(n.code.id)?.pctDocs ?? 0,
      responsesInclSub: frR.get(n.code.id)?.docsInclSub ?? 0,
      pctResponsesInclSub: frR.get(n.code.id)?.pctDocsInclSub ?? 0,
      hasChildren: parents.has(n.code.id),
      quotes: exampleQuotes(project, n.code.id, quotesPerCode).map((q) => ({ source: q.doc.name, text: q.text })),
    })),
  };
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** A standalone, printable HTML report. */
export function reportHtml(data: ReportData): string {
  const e = escapeHtml;
  const summary = [
    data.nDocuments ? `${data.nDocuments} document${data.nDocuments === 1 ? '' : 's'}` : '',
    data.nResponses ? `${data.nResponses} open-ended response${data.nResponses === 1 ? '' : 's'}` : '',
    `${data.codes.length} codes`,
    `${data.nSegments} coded segments`,
    data.coders.length ? `coded by ${data.coders.join(', ')}` : '',
  ].filter(Boolean).join(' · ');
  const { header: fh, rows: fr } = reportFrequencyTable(data);
  const codeRows = fr
    .map((r, i) => {
      const c = data.codes[i];
      return `<tr><td style="padding-left:${8 + c.depth * 16}px"><span class="sw" style="background:${e(c.code.color)}"></span>${e(r[0])}</td>${r.slice(1).map((v) => `<td class="n">${e(v)}</td>`).join('')}</tr>`;
    })
    .join('');
  const sections = data.codes
    .map((c) => {
      const defs = [
        c.code.description ? `<p>${e(c.code.description)}</p>` : '<p class="muted">No definition written yet.</p>',
        c.code.inclusion ? `<p><b>Include when:</b> ${e(c.code.inclusion)}</p>` : '',
        c.code.exclusion ? `<p><b>Exclude when:</b> ${e(c.code.exclusion)}</p>` : '',
        c.code.example ? `<p><b>Example:</b> ${e(c.code.example)}</p>` : '',
      ].join('');
      const quotes = c.quotes.length
        ? c.quotes.map((q) => `<blockquote>${e(q.text)}<cite>${e(q.source)}</cite></blockquote>`).join('')
        : '<p class="muted">No coded segments yet.</p>';
      const h = c.depth === 0 ? 'h3' : 'h4';
      return `<section><${h}><span class="sw" style="background:${e(c.code.color)}"></span>${e(c.path)}</${h}><p class="meta">${e(reportCodeMeta(data, c))}</p>${defs}${quotes}</section>`;
    })
    .join('\n');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${e(data.title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{font-family:'Source Serif 4',Georgia,serif;max-width:820px;margin:40px auto;padding:0 20px;color:#1d232c;line-height:1.55;background:#fff}
h1{font-size:28px;margin:0 0 4px}h2{font-size:20px;margin:36px 0 10px;border-bottom:1px solid #ccd3dc;padding-bottom:4px}
h3{font-size:17px;margin:28px 0 4px}h4{font-size:15px;margin:22px 0 4px}
.meta,.muted{color:#5d6878;font-size:14px}.sw{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:8px;vertical-align:baseline}
table{border-collapse:collapse;width:100%;font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:13px}
th,td{border-bottom:1px solid #dde2e8;padding:5px 8px;text-align:left}th{background:#f1f3f6}td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
blockquote{margin:10px 0 10px 0;padding:6px 14px;border-left:3px solid #c7ced8;background:#f7f8fa;font-style:italic}
cite{display:block;font-style:normal;font-size:12px;color:#5d6878;margin-top:4px;font-family:'IBM Plex Sans',system-ui,sans-serif}
</style></head><body>
<h1>${e(data.title)}</h1>
<p class="meta">${e(summary)}. Generated ${e(data.generated)} with Socius.</p>
<h2>Code frequencies</h2>
<table><thead><tr>${fh.map((h, i) => `<th${i ? ' class="n"' : ''}>${e(h)}</th>`).join('')}</tr></thead><tbody>${codeRows}</tbody></table>
<h2>Codebook with example quotes</h2>
${sections}
</body></html>`;
}

/** The report's code frequency table as text cells: separate columns for documents and responses. */
export function reportFrequencyTable(data: ReportData): { header: string[]; rows: string[][] } {
  const header = ['Code', 'Segments'];
  if (data.nDocuments) header.push(`Documents (of ${data.nDocuments})`);
  if (data.nResponses) header.push(`Responses (of ${data.nResponses})`);
  const rows = data.codes.map((c) => {
    const r = [c.code.name, String(c.segments)];
    if (data.nDocuments) r.push(countWithSub(c.documents, c.documentsInclSub));
    if (data.nResponses) r.push(countWithSub(c.responses, c.responsesInclSub, c.pctResponses, c.pctResponsesInclSub));
    return r;
  });
  return { header, rows };
}

/** "4 segments in 2 of 3 documents and 40 of 630 responses (6.3%)", mentioning sub-codes for themes. */
export function reportCodeMeta(data: ReportData, c: ReportData['codes'][number]): string {
  const parts: string[] = [];
  if (data.nDocuments) parts.push(`${c.documents} of ${data.nDocuments} document${data.nDocuments === 1 ? '' : 's'}`);
  if (data.nResponses) parts.push(`${c.responses} of ${data.nResponses} response${data.nResponses === 1 ? '' : 's'} (${c.pctResponses.toFixed(1)}%)`);
  let t = `${c.segments} segment${c.segments === 1 ? '' : 's'} in ${parts.join(' and ') || 'no sources'}`;
  if (c.hasChildren && (c.documentsInclSub !== c.documents || c.responsesInclSub !== c.responses)) {
    const sub: string[] = [];
    if (data.nDocuments) sub.push(`${c.documentsInclSub} document${c.documentsInclSub === 1 ? '' : 's'}`);
    if (data.nResponses) sub.push(`${c.responsesInclSub} response${c.responsesInclSub === 1 ? '' : 's'} (${c.pctResponsesInclSub.toFixed(1)}%)`);
    t += `; with its sub-codes ${sub.join(' and ')}`;
  }
  return t;
}
