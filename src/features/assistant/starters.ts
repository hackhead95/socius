// Context-aware starter prompts for an empty conversation.
import type { AppSnapshot } from '../../lib/assistant/types';
import { attributeKeys } from '../../lib/coding/analysis';
import type { Dataset, Variable } from '../../core/types';
import { isUserMissing } from '../../core/data';

function usable(ds: Dataset, v: Variable): boolean {
  return v.id !== ds.weightVarId && v.id !== ds.filterVarId && !/(^|_)id$|identifier|respondent id/i.test(`${v.name} ${v.label}`);
}

/** "Which test should I use to compare life_sat across gender?" with real variable names when possible. */
function comparePrompt(ds: Dataset): string {
  // Prefer an attitude or outcome measure (satisfaction, a score, income) over counts, dates and weights.
  const scales = ds.variables.filter((v) => usable(ds, v) && v.type === 'numeric' && v.measure === 'scale' && !/^(DATE|ADATE|EDATE|SDATE|DATETIME|TIME)/i.test(v.format) && !/weight|^wt$/i.test(`${v.name} ${v.label}`));
  const score = (v: Variable) =>
    (/satisf|score|index|scale|attitude|trust|happi|well-?being|income|wage|salary|health|stress|anxiety|support/i.test(`${v.name} ${v.label}`) ? 3 : 0) +
    (v.valueLabels.some((l) => !isUserMissing(v.missing, l.value)) ? 1 : 0) -
    (/^age$|size|number of|how many|years/i.test(`${v.name} ${v.label}`) ? 2 : 0);
  const outcome = [...scales].sort((a, b) => score(b) - score(a))[0];
  const group = ds.variables.find((v) => usable(ds, v) && v.measure === 'nominal' && v.valueLabels.length >= 2 && v.valueLabels.length <= 6 && /gender|sex/i.test(`${v.name} ${v.label}`))
    ?? ds.variables.find((v) => usable(ds, v) && v.measure === 'nominal' && v.valueLabels.length >= 2 && v.valueLabels.length <= 6);
  if (outcome && group) return `Which test should I use to compare ${outcome.name} across ${group.name}?`;
  return 'Which test should I use to compare two groups?';
}

/** A family of items like trust1..trust5 suggests "Build a trust scale". */
function scalePrompt(ds: Dataset): string {
  const counts = new Map<string, number>();
  for (const v of ds.variables) {
    const m = /^([a-z]+)_?\d+$/i.exec(v.name);
    if (m && v.type === 'numeric') counts.set(m[1], (counts.get(m[1]) ?? 0) + 1);
  }
  const best = [...counts.entries()].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1])[0];
  return best ? `Build a ${best[0]} scale` : 'Build a scale from several items';
}

export function starterPrompts(s: AppSnapshot): string[] {
  if (s.tab === 'coding') {
    const p = s.coding;
    if (!p.docs.length) return ['How do I code interview transcripts?', 'How do I code open-ended survey answers?', 'What can Socius do?'];
    const attrs = attributeKeys(p.docs);
    const attr = attrs.find((a) => /gender|sex/i.test(a)) ?? attrs[0];
    const out = ['Summarise the main themes'];
    if (attr) out.push(`Compare codes by ${attr}`);
    out.push(p.codes.length ? 'Which codes overlap or could be merged?' : 'Suggest a codebook for these texts');
    return out;
  }
  if (!s.dataset) return ['How do I open my SPSS file?', 'What can Socius do?', 'How do I load the sample survey?'];
  if (s.tab === 'output') {
    const has = s.outputs.some((o) => o.procedure !== 'transform');
    return has ? ['Explain my latest result', 'How do I report this in APA style?', 'What should I check next?'] : ['Describe my dataset', comparePrompt(s.dataset), 'How do I copy a table into Word?'];
  }
  return ['Describe my dataset', 'Which variables need cleaning?', comparePrompt(s.dataset), scalePrompt(s.dataset)];
}
