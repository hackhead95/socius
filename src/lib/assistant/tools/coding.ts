// Qualitative tools over the Text coding project: codebook with counts, coded segments (quotes),
// codes by a document attribute, and keyword-in-context search.
import type { CodedSegment, CodingProject, TextDoc } from '../../../core/coding-types';
import { attributeKeys, attributeValues, codeByAttribute, codeFrequencies } from '../../../lib/coding/analysis';
import { kwic } from '../../../lib/coding/text';
import { codePath, descendantIds, orderedCodes } from '../../../lib/coding/tree';
import { closestNames, pct, trimToBytes } from '../format';
import type { AgentTool, ToolContext, ToolOutput } from '../types';

export const TEXTS_OFF =
  'DISABLED: The user has switched off "Excerpts from coded texts" under "What the assistant can see". You can still use list_codes (names and counts). Explain that they can switch excerpts on in the assistant panel.';
const NO_CODING =
  'The Text coding project is empty. Explain how to start: Text coding > Import documents... (interview transcripts), Text coding > Import open-ended answers from dataset... (survey answers), or Text coding > Load sample interviews.';

/** Segments in scope: the active coder's when several coders have coded, else all. */
export function scopedSegments(p: CodingProject): { segments: CodedSegment[]; note: string } {
  const coders = new Set(p.segments.map((s) => s.coder));
  if (coders.size > 1) return { segments: p.segments.filter((s) => s.coder === p.activeCoder), note: `Counts use the active coder (${p.activeCoder}) only; ${coders.size} coders have coded.` };
  return { segments: p.segments, note: '' };
}

function projectOf(ctx: ToolContext): CodingProject | ToolOutput {
  const p = ctx.state().coding;
  if (!p.docs.length && !p.codes.length) return { text: NO_CODING, ok: false, summary: 'The Text coding project is empty' };
  return p;
}

function findCode(p: CodingProject, name: unknown) {
  const n = String(name ?? '').trim().toLowerCase();
  return p.codes.find((c) => c.name.toLowerCase() === n) ?? p.codes.find((c) => codePath(p.codes, c.id).toLowerCase() === n) ?? p.codes.find((c) => c.id === name);
}

function codeNotFound(p: CodingProject, name: unknown): ToolOutput {
  const near = closestNames(String(name ?? ''), p.codes.map((c) => c.name));
  return { text: `There is no code named "${String(name ?? '')}".${near.length ? ` Did you mean ${near.join(', ')}?` : ''} Call list_codes for the codebook.`, ok: false, summary: 'Code not found' };
}

function docLabel(d: TextDoc): string {
  const attrs = Object.entries(d.attributes ?? {}).slice(0, 4).map(([k, v]) => `${k}=${v}`).join(', ');
  return `${d.name}${attrs ? ` (${attrs})` : ''}`;
}

function listCodes(_a: Record<string, unknown>, ctx: ToolContext): ToolOutput {
  const p = projectOf(ctx);
  if (!('codes' in p)) return p;
  const { segments, note } = scopedSegments(p);
  const docs = p.docs;
  const freq = codeFrequencies(p.codes, docs, segments);
  const byId = new Map(freq.rows.map((r) => [r.codeId, r]));
  const nDocuments = docs.filter((d) => d.kind === 'document').length;
  const nResponses = docs.length - nDocuments;
  const lines = [
    `Text coding project: ${nDocuments} document${nDocuments === 1 ? '' : 's'}${nResponses ? ` and ${nResponses} survey responses` : ''}; ${freq.nCodedDocs} coded; ${p.codes.length} codes; ${segments.length} coded segments. ${note}`,
    `Document attributes available: ${attributeKeys(docs).join(', ') || 'none'}.`,
    'Codebook (path: documents coded (% of all), incl. sub-codes; segments) - description:',
  ];
  for (const c of orderedCodes(p.codes)) {
    const r = byId.get(c.id);
    const depth = codePath(p.codes, c.id).split(' > ').length - 1;
    const sub = r && r.docsInclSub !== r.docs ? `, ${r.docsInclSub} incl. sub-codes` : '';
    lines.push(`${'  '.repeat(depth)}- ${c.name}: ${r?.docs ?? 0} docs (${pct(r?.pctDocs ?? 0)})${sub}; ${r?.segments ?? 0} segments${c.description ? ` - ${c.description.slice(0, 160)}` : ''}`);
  }
  if (!p.codes.length) lines.push('(no codes yet: suggest Text coding > Suggest a codebook with AI... or creating codes in the Codebook panel)');
  return { text: trimToBytes(lines.join('\n'), ctx.maxResultBytes), summary: `Looked at the codebook (${p.codes.length} codes)` };
}

function getSegments(a: Record<string, unknown>, ctx: ToolContext): ToolOutput {
  const p = projectOf(ctx);
  if (!('codes' in p)) return p;
  if (!ctx.permissions.texts) return { text: TEXTS_OFF, ok: false, summary: 'Excerpts are switched off' };
  const code = findCode(p, a.code);
  if (!code) return codeNotFound(p, a.code);
  const limit = Math.max(1, Math.min(40, Math.floor(Number(a.limit) || 12)));
  const ids = new Set([code.id, ...descendantIds(p.codes, code.id)]);
  const docs = new Map(p.docs.map((d) => [d.id, d]));
  const { segments } = scopedSegments(p);
  const segs = segments.filter((s) => ids.has(s.codeId) && docs.has(s.docId));
  // Spread over documents: one per document first, then more.
  const picked: CodedSegment[] = [];
  const perDoc = new Map<string, number>();
  for (let round = 0; picked.length < limit && round < 50; round++) {
    let added = false;
    for (const s of segs) {
      if (picked.length >= limit) break;
      if ((perDoc.get(s.docId) ?? 0) !== round || picked.includes(s)) continue;
      picked.push(s);
      perDoc.set(s.docId, round + 1);
      added = true;
    }
    if (!added) break;
  }
  const lines = [`Code "${codePath(p.codes, code.id)}"${ids.size > 1 ? ' (with sub-codes)' : ''}: ${segs.length} segments in ${new Set(segs.map((s) => s.docId)).size} documents. Showing ${picked.length}. Quote them faithfully; do not add names or identifying details.`];
  for (const s of picked) {
    const d = docs.get(s.docId)!;
    let t = d.text.slice(s.start, s.end).replace(/\s+/g, ' ').trim();
    if (t.length > 400) t = t.slice(0, 400).replace(/\s+\S*$/, '') + ' ...';
    lines.push(`- [${docLabel(d)}${ids.size > 1 ? `; ${p.codes.find((c) => c.id === s.codeId)?.name}` : ''}] "${t}"${s.memo ? ` (memo: ${s.memo.slice(0, 120)})` : ''}`);
  }
  return { text: trimToBytes(lines.join('\n'), ctx.maxResultBytes), summary: `Read ${picked.length} quotes coded "${code.name}"` };
}

function byAttribute(a: Record<string, unknown>, ctx: ToolContext): ToolOutput {
  const p = projectOf(ctx);
  if (!('codes' in p)) return p;
  const keys = attributeKeys(p.docs);
  const want = String(a.attribute ?? '').trim();
  const attr = keys.find((k) => k === want) ?? keys.find((k) => k.toLowerCase() === want.toLowerCase());
  if (!attr) return { text: `No document attribute "${want}". Available: ${keys.join(', ') || 'none (import responses from a dataset with attribute variables, or add attributes to documents)'}.`, ok: false, summary: 'Attribute not found' };
  let codes = orderedCodes(p.codes).filter((c) => !c.parentId);
  if (Array.isArray(a.codes) && a.codes.length) {
    const chosen = a.codes.map((n) => findCode(p, n)).filter((c): c is NonNullable<typeof c> => !!c);
    if (chosen.length) codes = chosen;
  }
  const members = Object.fromEntries(codes.map((c) => [c.id, [c.id, ...descendantIds(p.codes, c.id)]]));
  const { segments, note } = scopedSegments(p);
  const r = codeByAttribute(codes.map((c) => c.id), p.docs, segments, attr, undefined, members);
  const lines = [
    `Codes by ${attr} (documents coded with the code or its sub-codes; column % of documents with that ${attr}). ${r.nMissing ? `${r.nMissing} documents have no ${attr} and are left out. ` : ''}${note}`,
    `Bases: ${r.values.map((v, j) => `${v} n=${r.bases[j]}`).join(', ')}`,
  ];
  codes.forEach((c, i) => lines.push(`- ${c.name}: ${r.values.map((v, j) => `${v} ${r.counts[i][j]} (${pct(r.colPct[i][j])})`).join('; ')}`));
  const small = r.bases.filter((b) => b < 10).length;
  if (small) lines.push(`Caution: ${small} group(s) have fewer than 10 documents; differences in % are unstable. Qualitative counts describe the material; they are not a statistical test.`);
  lines.push(`Values of ${attr}: ${attributeValues(p.docs, attr).join(', ')}. In Socius: Text coding > Codes by attribute.`);
  return { text: trimToBytes(lines.join('\n'), ctx.maxResultBytes), summary: `Compared codes by ${attr}` };
}

function searchText(a: Record<string, unknown>, ctx: ToolContext): ToolOutput {
  const p = projectOf(ctx);
  if (!('codes' in p)) return p;
  if (!ctx.permissions.texts) return { text: TEXTS_OFF, ok: false, summary: 'Excerpts are switched off' };
  const q = String(a.query ?? '').trim();
  if (!q) return { text: 'Give a word or phrase in "query" (use * as a wildcard, e.g. migra*).', ok: false };
  const limit = Math.max(1, Math.min(40, Math.floor(Number(a.limit) || 15)));
  const all = kwic(p.docs.map((d) => d.text), q, { window: 70, limit: 5000 });
  const docsHit = new Set(all.map((l) => l.docIndex));
  const lines = [`"${q}": ${all.length} hits in ${docsHit.size} of ${p.docs.length} documents. Showing ${Math.min(limit, all.length)}. (In Socius: Text coding > Keyword in context.)`];
  for (const l of all.slice(0, limit)) lines.push(`- [${docLabel(p.docs[l.docIndex])}] ...${l.left}[${l.match}]${l.right}...`);
  return { text: trimToBytes(lines.join('\n'), ctx.maxResultBytes), summary: `Searched the texts for "${q}" (${all.length} hits)` };
}

export const codingTools: AgentTool[] = [
  {
    name: 'list_codes',
    kind: 'read',
    description: 'The Text coding project: number of documents and responses, document attributes, and the codebook (hierarchy, descriptions) with how many documents and segments each code has.',
    parameters: { type: 'object', properties: {} },
    label: () => 'Looked at the codebook',
    run: listCodes,
  },
  {
    name: 'get_coded_segments',
    kind: 'read',
    description: 'Quotes coded with a code (and its sub-codes), spread over documents, with the document name and attributes. Use to summarise or illustrate a theme.',
    parameters: {
      type: 'object',
      properties: { code: { type: 'string', description: 'Code name.' }, limit: { type: 'integer', description: 'How many quotes, at most 40 (default 12).' } },
      required: ['code'],
    },
    label: (a) => `Read quotes coded "${String(a.code ?? '')}"`,
    run: getSegments,
  },
  {
    name: 'codes_by_attribute',
    kind: 'read',
    description: 'How often each top-level code (or the listed codes) occurs across values of a document attribute such as gender or city: documents coded and column %.',
    parameters: {
      type: 'object',
      properties: { attribute: { type: 'string' }, codes: { type: 'array', items: { type: 'string' }, description: 'Optional code names; default all top-level codes.' } },
      required: ['attribute'],
    },
    label: (a) => `Compared codes by ${String(a.attribute ?? 'attribute')}`,
    run: byAttribute,
  },
  {
    name: 'search_text',
    kind: 'read',
    description: 'Keyword-in-context search across all Text coding documents and responses (whole words, * wildcard).',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string' }, limit: { type: 'integer', description: 'How many lines, at most 40 (default 15).' } },
      required: ['query'],
    },
    label: (a) => `Searched the texts for "${String(a.query ?? '')}"`,
    run: searchText,
  },
];
