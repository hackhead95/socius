// Matching and ranking for the search palette (Ctrl+K). Pure: no React, no store.
//
// Matching works on words: every word of the query must match a word of the entry (its title, menu
// path, synonyms or, with less weight, its description), either exactly, as the start of a word, inside a
// longer word, or with a small typo. Sociological and SPSS vocabulary ("chi square", "t test", "alpha",
// "select cases"...) maps to the right command through SYNONYMS.

import type { MenuItem } from '../ui/Menu';

export type SearchGroup = 'commands' | 'variables' | 'results' | 'coding' | 'help' | 'assistant';

export interface SearchEntry {
  id: string;
  group: SearchGroup;
  title: string;
  /** Second line: menu path, variable label, result title... */
  detail?: string;
  /** Words and phrases matched almost like the title (menu path words, synonyms). */
  keywords?: string[];
  /** Words matched with low weight (descriptions, value labels). */
  extra?: string;
  disabled?: boolean;
  /** Why a disabled entry cannot run now. */
  disabledReason?: string;
  shortcut?: string;
  /** Small ranking nudge among equally good matches (e.g. the most used t-test). */
  boost?: number;
}

// ---------- normalising ----------

const STOPWORDS = new Set(['a', 'an', 'the', 'of', 'for', 'to', 'in', 'on', 'and', 'my', 'with', 'by', 'how', 'do', 'i']);

export function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/χ²|χ2|χ/g, 'chi square ')
    .replace(/²/g, '2')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function words(s: string): string[] {
  const n = normalise(s);
  return n ? n.split(' ') : [];
}

/** Query words without filler words (unless the query is only filler). */
export function queryWords(q: string): string[] {
  const all = words(q);
  const kept = all.filter((w) => !STOPWORDS.has(w));
  return kept.length ? kept : all;
}

/** Optimal string alignment distance (Levenshtein plus adjacent swaps), capped for speed. */
export function editDistance(a: string, b: string, max = 3): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev2 = new Array(b.length + 1).fill(0);
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur.push(v);
      rowMin = Math.min(rowMin, v);
    }
    for (let j = 0; j <= b.length; j++) prev2[j] = prev[j];
    prev = cur;
    if (rowMin > max) return max + 1;
  }
  return prev[b.length];
}

function typoAllowance(len: number): number {
  return len >= 8 ? 2 : len >= 4 ? 1 : 0;
}

/** How well one query word matches one entry word (0..1). */
export function wordScore(q: string, t: string): number {
  if (!q || !t) return 0;
  if (t === q) return 1;
  if (t.startsWith(q)) return q.length === 1 ? 0.6 : 0.88;
  if (q.length >= 3 && t.includes(q)) return 0.6;
  const allow = typoAllowance(q.length);
  if (allow) {
    if (editDistance(q, t, allow) <= allow) return 0.72;
    // A partial word with a typo: compare with the start of the entry word.
    if (t.length > q.length && editDistance(q, t.slice(0, q.length), allow) <= allow) return 0.6;
  }
  return 0;
}

// ---------- scoring ----------

interface Prepared {
  title: string[];
  titleNorm: string;
  keywords: string[];
  phrases: string[];
  extra: string[];
}

const prepCache = new WeakMap<SearchEntry, Prepared>();

function prepare(e: SearchEntry): Prepared {
  let p = prepCache.get(e);
  if (!p) {
    const phrases = (e.keywords ?? []).map(normalise).filter(Boolean);
    p = {
      title: words(e.title),
      titleNorm: normalise(e.title),
      keywords: [...new Set(phrases.flatMap((k) => k.split(' ')))],
      phrases,
      extra: [...new Set(words(`${e.detail ?? ''} ${e.extra ?? ''}`))],
    };
    prepCache.set(e, p);
  }
  return p;
}

function best(q: string, list: string[], weight: number): number {
  let m = 0;
  for (const t of list) {
    const s = wordScore(q, t);
    if (s > m) m = s;
    if (m === 1) break;
  }
  return m * weight;
}

/** Score of an entry for a query; 0 means "does not match". */
export function scoreEntry(query: string, e: SearchEntry): number {
  const qn = normalise(query);
  if (!qn) return 0;
  const p = prepare(e);
  const qs = queryWords(query);
  let total = 0;
  for (const q of qs) {
    const s = Math.max(best(q, p.title, 1), best(q, p.keywords, 0.9), best(q, p.extra, 0.45));
    if (s === 0) return 0;
    total += s;
  }
  let score = (100 * total) / qs.length;
  // Whole-query bonuses: exact title, title start, synonym phrases (also with a small typo).
  if (p.titleNorm === qn) score = Math.max(score, 170);
  else if (p.titleNorm.startsWith(qn)) score += 25;
  else if (p.titleNorm.includes(qn)) score += 10;
  for (const ph of p.phrases) {
    if (ph === qn) score = Math.max(score, 150);
    else if (qn.length >= 4 && ph.startsWith(qn)) score = Math.max(score, 130);
    else if (qn.length >= 5) {
      const allow = typoAllowance(qn.length);
      if (editDistance(qn, ph, allow) <= allow) score = Math.max(score, 140);
    }
  }
  score += e.boost ?? 0;
  score -= Math.min(10, e.title.length * 0.08);
  if (e.disabled) score -= 6;
  return score;
}

export interface SearchResultGroup<T extends SearchEntry> {
  group: SearchGroup;
  items: T[];
  top: number;
}

export const GROUP_LIMITS: Record<SearchGroup, number> = { commands: 8, variables: 6, results: 5, coding: 5, help: 4, assistant: 1 };

/** Matching entries grouped by kind, best group first; each group sorted best first. */
export function searchEntries<T extends SearchEntry>(query: string, entries: T[], limits: Partial<Record<SearchGroup, number>> = {}): Array<SearchResultGroup<T>> {
  const scored: Array<{ e: T; s: number; i: number }> = [];
  entries.forEach((e, i) => {
    const s = scoreEntry(query, e);
    if (s > 0) scored.push({ e, s, i });
  });
  scored.sort((a, b) => b.s - a.s || a.i - b.i);
  const groups = new Map<SearchGroup, SearchResultGroup<T>>();
  for (const { e, s } of scored) {
    let g = groups.get(e.group);
    if (!g) {
      g = { group: e.group, items: [], top: s };
      groups.set(e.group, g);
    }
    if (g.items.length < (limits[e.group] ?? GROUP_LIMITS[e.group])) g.items.push(e);
  }
  return [...groups.values()].sort((a, b) => b.top - a.top);
}

// ---------- menus -> commands ----------

/**
 * Extra words people use for a command, keyed by menu item id (procedure ids for Analyze and Graphs).
 * `boost` ranks the usual choice first when several commands match equally.
 */
export const SYNONYMS: Record<string, { words: string[]; boost?: number }> = {
  crosstabs: { words: ['chi square', 'chi square test', 'chi2', 'crosstab', 'cross tabulation', 'contingency table', 'cramers v', 'association', 'two way table', 'kappa', 'odds ratio'], boost: 3 },
  'chisquare-gof': { words: ['goodness of fit', 'one sample chi square', 'expected proportions'] },
  frequencies: { words: ['frequency table', 'freq', 'counts', 'percentages', 'distribution', 'mode'], boost: 2 },
  descriptives: { words: ['mean', 'average', 'standard deviation', 'sd', 'summary statistics', 'min max'] },
  explore: { words: ['normality', 'shapiro wilk', 'outliers', 'skewness', 'kurtosis', 'confidence interval'] },
  means: { words: ['compare means', 'group means', 'mean by group'] },
  'ttest-independent': { words: ['t test', 'ttest', 'student t', 'two groups', 'compare two groups', 'difference in means', 'levene'], boost: 3 },
  'ttest-paired': { words: ['t test', 'ttest', 'paired t', 'before after', 'repeated', 'dependent t test'] },
  'ttest-one-sample': { words: ['t test', 'ttest', 'test value', 'compare with a value'] },
  'oneway-anova': { words: ['anova', 'analysis of variance', 'f test', 'compare groups', 'three groups', 'post hoc', 'tukey', 'several groups'], boost: 2 },
  correlations: { words: ['correlation', 'pearson', 'spearman', 'kendall', 'r'], boost: 2 },
  'partial-correlations': { words: ['correlation', 'control for', 'partial r'] },
  'mann-whitney': { words: ['nonparametric', 'wilcoxon rank sum', 'u test', 'two groups ranks'] },
  'kruskal-wallis': { words: ['nonparametric anova', 'h test', 'ranks several groups'] },
  wilcoxon: { words: ['nonparametric paired', 'signed rank'] },
  friedman: { words: ['nonparametric repeated measures'] },
  binomial: { words: ['proportion test', 'binomial test'] },
  'models.linear': { words: ['regression', 'ols', 'linear model', 'predict', 'multiple regression', 'r squared', 'coefficients'], boost: 3 },
  'models.logistic': { words: ['regression', 'logit', 'logistic', 'binary outcome', 'odds ratio'] },
  'models.ordinal': { words: ['regression', 'ordinal logit', 'plum', 'ordered logit', 'likert outcome'] },
  'models.multinomial': { words: ['regression', 'mlogit', 'nomreg', 'categorical outcome'] },
  'models.reliability': { words: ['reliability', 'cronbach', 'cronbachs alpha', 'alpha', 'internal consistency', 'scale reliability'], boost: 3 },
  'models.factor': { words: ['pca', 'principal components', 'efa', 'factor', 'dimension reduction', 'loadings'] },
  'graph-bar': { words: ['chart', 'plot', 'graph', 'bar graph', 'column chart'] },
  'graph-histogram': { words: ['chart', 'plot', 'graph', 'distribution'] },
  'graph-box': { words: ['chart', 'plot', 'graph', 'boxplot', 'box and whisker'] },
  'graph-scatter': { words: ['chart', 'plot', 'graph', 'scatterplot', 'scattergram'] },
  'graph-line': { words: ['chart', 'plot', 'graph', 'trend'] },
  'graph-pie': { words: ['chart', 'plot', 'graph'] },
  'graph-pyramid': { words: ['chart', 'plot', 'graph', 'age pyramid', 'age sex'] },
  't-compute': { words: ['compute', 'formula', 'calculate', 'new variable', 'sum', 'mean of items'] },
  't-count': { words: ['count', 'count occurrences'] },
  't-same': { words: ['recode', 'regroup', 'collapse categories'] },
  't-diff': { words: ['recode', 'regroup', 'collapse categories', 'age groups', 'recode into new'], boost: 2 },
  't-auto': { words: ['recode', 'string to numeric', 'autorecode'] },
  't-bin': { words: ['recode', 'bins', 'age groups', 'categorise', 'cut points', 'binning'] },
  't-rev': { words: ['reverse', 'reverse code', 'recode', 'flip scale', 'negatively worded'] },
  't-scale': { words: ['index', 'sum score', 'mean score', 'alpha', 'scale', 'composite'] },
  't-z': { words: ['z scores', 'standardise', 'zscore'] },
  't-rank': { words: ['rank', 'percentile', 'quantiles'] },
  'd-weight': { words: ['weight', 'weighting', 'survey weights', 'weight by'], boost: 2 },
  'd-weight-off': { words: ['weight', 'unweighted', 'remove weight'] },
  'd-select': { words: ['filter', 'select cases', 'select if', 'subset', 'exclude cases'], boost: 2 },
  'd-filter-off': { words: ['filter', 'all cases', 'remove filter'] },
  'd-sort': { words: ['sort', 'order'] },
  // Data > Define variable properties... (a real wizard since September 2026; it used to only switch to Variable View).
  'd-define': { words: ['define variable properties', 'define properties', 'variable properties', 'value labels', 'label values', 'labels', 'missing values', 'missing codes', 'measurement level', 'measure', 'likert labels'], boost: 3 },
  'd-copy': { words: ['copy labels', 'copy value labels'] },
  'd-agg': { words: ['aggregate', 'group by', 'collapse', 'summarise by group'] },
  'm-cases': { words: ['merge', 'append', 'add cases', 'combine files', 'stack'] },
  'm-vars': { words: ['merge', 'join', 'add variables', 'match files'] },
  'cb-x': { words: ['codebook', 'data dictionary', 'variable list'] },
  'cb-c': { words: ['codebook', 'data dictionary', 'variable list'] },
  open: { words: ['open', 'import', 'load', 'sav', 'spss', 'csv', 'excel', 'xlsx', 'data file'], boost: 2 },
  'open-proj': { words: ['project', 'socius json'] },
  save: { words: ['save', 'project'] },
  sav: { words: ['export', 'spss', 'sav', 'save data'] },
  sample: { words: ['sample', 'example data', 'practice data', 'demo'] },
  find: { words: ['find', 'search data', 'look up value'] },
  goto: { words: ['go to case', 'case number', 'row'] },
  'h-guide': { words: ['manual', 'help', 'documentation', 'guide', 'tutorial'], boost: 1 },
  'h-start': { words: ['help', 'tutorial', 'introduction', 'beginner'] },
  'h-keys': { words: ['shortcuts', 'keys', 'hotkeys', 'keyboard'] },
  'h-feedback': { words: ['bug', 'report', 'issue', 'feedback', 'problem'] },
  'h-errorlog': { words: ['error log', 'errors', 'error report', 'report a problem', 'diagnostics', 'crash', 'log', 'something went wrong', 'bug report'], boost: 2 },
  'c-view:reliability': { words: ['kappa', 'cohens kappa', 'krippendorff', 'agreement', 'intercoder', 'inter rater', 'interrater'], boost: 6 },
  'c-export-codebook': { words: ['codebook', 'code list'], boost: 1 },
  'c-view:kwic': { words: ['kwic', 'keyword', 'concordance', 'search text'] },
  'c-view:words': { words: ['word cloud', 'word count', 'most common words'] },
  'c-auto-code': { words: ['keyword rules', 'automatic coding'] },
  'c-import-survey': { words: ['open ended', 'survey answers', 'string variable'] },
  'c-import': { words: ['transcript', 'interview', 'docx', 'word document'] },
  'ai-explain': { words: ['explain', 'interpret', 'what does this mean', 'help me understand', 'ai'], boost: 2 },
  'ai-assistant': { words: ['chat', 'assistant', 'ask', 'question', 'which test', 'ai', 'help'], boost: 2 },
  'ai-codebook': { words: ['codebook', 'themes', 'ai'] },
  'ai-suggest': { words: ['code responses', 'ai', 'open ended'] },
  'ai-summarise': { words: ['summary', 'summarize', 'ai'] },
  // The one home of AI set-up (it used to be in Help and Text coding too): old words still find it.
  'ai-settings': { words: ['ai', 'ai settings', 'ai assistant settings', 'set up ai', 'gemini', 'gemini key', 'api key', 'settings', 'preferences', 'llm', 'chatgpt', 'openai', 'groq', 'ollama', 'on device model', 'provider'], boost: 2 },
  // Views: the one home of switching tabs (Text coding > Open coding workspace did the same and was removed).
  'v-vars': { words: ['dictionary', 'edit variables', 'variable names'] },
  'v-code': { words: ['open coding workspace', 'coding workspace', 'qualitative', 'code text'] },
  'v-labels': { words: ['show value labels', 'labels instead of codes'] },
};

export interface CommandEntry extends SearchEntry {
  group: 'commands';
  item: MenuItem;
  /** The menu path, e.g. ["Analyze", "Descriptive Statistics"]. */
  path: string[];
}

/** Menu label without the trailing "..." / "…" that means "opens a dialog". */
export function cleanLabel(label: string): string {
  return label.replace(/\s*(\.\.\.|…)\s*$/, '');
}

/** Every runnable menu item as a search entry (disabled ones keep their reason). */
export function commandsFromMenus(menus: Array<{ id: string; label: string; items: MenuItem[] }>, descriptions: Record<string, string> = {}): CommandEntry[] {
  const out: CommandEntry[] = [];
  const walk = (menuId: string, items: MenuItem[], path: string[], parentDisabled: { reason?: string } | null, nested: boolean) => {
    for (const it of items) {
      if (it.children) {
        walk(menuId, it.children, [...path, cleanLabel(it.label)], it.disabled ? { reason: it.title } : parentDisabled, true);
        continue;
      }
      if (!it.onSelect && !it.disabled) continue;
      const label = cleanLabel(it.label);
      // Leaves of File/View submenus ("Excel (.xlsx)") read better with their parent ("Export codebook: Excel (.xlsx)").
      const parent = path.length > 1 ? path[path.length - 1] : null;
      const title = nested && parent && menuId !== 'analyze' ? `${parent}: ${label}` : label;
      const syn = SYNONYMS[it.id];
      const disabled = !!(it.disabled || parentDisabled);
      out.push({
        id: `cmd:${menuId}:${it.id}`,
        group: 'commands',
        title,
        detail: path.join(' > '),
        keywords: [...path, ...(syn?.words ?? [])],
        extra: descriptions[it.id],
        disabled,
        disabledReason: disabled ? it.title ?? parentDisabled?.reason ?? 'Not available right now' : undefined,
        shortcut: it.shortcut,
        boost: syn?.boost,
        item: it,
        path,
      });
    }
  };
  for (const m of menus) walk(m.id, m.items, [m.label], null, false);
  return out;
}
