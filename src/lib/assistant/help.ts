// Search over the beginner's guide (docs/guide/guide.md), so "how do I ... in Socius" answers follow
// the real steps and menu names. The guide is bundled as raw text (a lazy chunk on the static site) and
// split into sections; a small keyword ranking picks the best two or three.

export interface HelpSection {
  chapter: string;
  title: string;
  body: string;
}

const STOP = new Set(
  'a an and are as at be by can do does for from how i in into is it its me my of on or so that the this to what when where which who why will with you your socius use using want get make'.split(' '),
);

/** Words that mean the same thing to a beginner. */
const SYNONYMS: Record<string, string[]> = {
  open: ['import', 'load'],
  import: ['open', 'load'],
  load: ['open', 'import'],
  sav: ['spss'],
  spss: ['sav'],
  excel: ['xlsx', 'csv'],
  csv: ['excel'],
  recode: ['group', 'recoding'],
  group: ['recode'],
  scale: ['index', 'alpha', 'reliability'],
  index: ['scale'],
  alpha: ['cronbach', 'reliability', 'scale'],
  reliability: ['alpha', 'cronbach'],
  weight: ['weighting', 'weights'],
  filter: ['select', 'subset'],
  subset: ['select', 'filter'],
  select: ['filter'],
  chart: ['graph', 'bar', 'histogram'],
  graph: ['chart'],
  plot: ['chart', 'graph'],
  export: ['save', 'report', 'word'],
  word: ['report', 'copy', 'export'],
  report: ['export', 'apa'],
  apa: ['report'],
  ttest: ['t-test', 'compare', 'means'],
  anova: ['compare', 'groups'],
  correlation: ['correlate', 'pearson'],
  regression: ['linear', 'predict'],
  crosstab: ['crosstabs', 'chi-square'],
  chi: ['crosstabs', 'chi-square'],
  missing: ['missing'],
  code: ['coding', 'codebook'],
  coding: ['code', 'codebook'],
  interview: ['transcript', 'interviews'],
  transcript: ['interview'],
  quote: ['retrieve', 'quotes'],
  ai: ['gemini', 'assistant'],
  key: ['gemini', 'ai'],
  reverse: ['reverse-code', 'flip'],
  save: ['project', 'export'],
  share: ['colleague', 'project'],
};

function stem(w: string): string {
  if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith('ed')) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

export function helpTokens(s: string): string[] {
  return (s.toLowerCase().match(/[a-z0-9][a-z0-9'-]*/g) ?? []).map((w) => w.replace(/'s$/, '')).filter((w) => !STOP.has(w)).map(stem);
}

/** Replace the guide's own markup with plain text. */
export function cleanGuideText(s: string, links: Record<string, string> = {}): string {
  return s
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)(\{[^}]*\})?/g, (_m, cap: string) => (cap ? `(Picture: ${cap})` : ''))
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/\{\{([A-Z_]+)\}\}/g, (_m, k: string) => links[k] ?? '')
    .replace(/^:::\s*(\w+)\s*(.*)$/gm, (_m, kind: string, title: string) => `${kind === 'spss' ? 'For SPSS users' : kind[0].toUpperCase() + kind.slice(1)}${title ? `: ${title}` : ''}:`)
    .replace(/^:::\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Split the guide into sections (## headings; a chapter's intro is its own section). */
export function splitGuide(md: string, links: Record<string, string> = {}): HelpSection[] {
  const text = md.replace(/^---\n[\s\S]*?\n---\n/, '');
  const out: HelpSection[] = [];
  let chapter = '';
  let title = '';
  let buf: string[] = [];
  const flush = () => {
    const body = cleanGuideText(buf.join('\n'), links);
    if (body || title) out.push({ chapter, title: title || chapter, body });
    buf = [];
  };
  for (const line of text.split('\n')) {
    const h1 = /^# (.+)$/.exec(line);
    const h2 = /^## (.+)$/.exec(line);
    if (h1) {
      flush();
      chapter = h1[1].trim();
      title = '';
    } else if (h2) {
      flush();
      title = h2[1].trim();
    } else buf.push(line);
  }
  flush();
  return out.filter((s) => s.body.length > 0);
}

/** Rank sections for a question. Returns the best `n` with a score above zero. */
export function rankSections(sections: HelpSection[], query: string, n = 3): HelpSection[] {
  const base = helpTokens(query);
  if (!base.length) return [];
  const terms = new Map<string, number>();
  for (const t of base) {
    terms.set(t, Math.max(terms.get(t) ?? 0, 1));
    for (const s of SYNONYMS[t] ?? []) for (const st of helpTokens(s)) if (!terms.has(st)) terms.set(st, 0.5);
  }
  const docs = sections.map((s) => ({ s, title: helpTokens(`${s.title}`), chapter: helpTokens(s.chapter), body: helpTokens(s.body) }));
  const df = new Map<string, number>();
  for (const d of docs) for (const t of new Set([...d.title, ...d.body])) df.set(t, (df.get(t) ?? 0) + 1);
  const N = docs.length;
  const scored = docs.map((d) => {
    let score = 0;
    for (const [t, w] of terms) {
      const idf = Math.log(1 + N / (1 + (df.get(t) ?? 0)));
      const inTitle = d.title.filter((x) => x === t).length;
      const inChapter = d.chapter.filter((x) => x === t).length;
      const inBody = d.body.filter((x) => x === t).length;
      score += w * idf * (3 * inTitle + 1 * inChapter + Math.log(1 + inBody));
    }
    // Phrase bonus: the query's words appear together.
    if (base.length > 1 && d.s.body.toLowerCase().includes(query.toLowerCase().trim())) score += 3;
    return { s: d.s, score };
  });
  return scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, n).map((x) => x.s);
}

let sectionsPromise: Promise<HelpSection[]> | null = null;

/** Sections of the bundled guide (loaded once, lazily). */
export function guideSections(links: Record<string, string> = {}): Promise<HelpSection[]> {
  if (!sectionsPromise)
    sectionsPromise = import('../../../docs/guide/guide.md?raw').then((m) => splitGuide(m.default, links)).catch((e) => {
      sectionsPromise = null;
      throw e;
    });
  return sectionsPromise;
}

export function sectionText(s: HelpSection, maxChars: number): string {
  const body = s.body.length > maxChars ? s.body.slice(0, maxChars).replace(/\s+\S*$/, '') + ' ...' : s.body;
  return `### ${s.chapter === s.title ? s.title : `${s.chapter} > ${s.title}`}\n${body}`;
}
