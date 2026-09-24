// search_help: the beginner's guide sections that best match a "how do I ... in Socius" question.
import { GUIDE_URL, SITE_URL, FEEDBACK_URL } from '../../../app/links';
import { trimToBytes } from '../format';
import { guideSections, rankSections, sectionText } from '../help';
import type { AgentTool, ToolContext, ToolOutput } from '../types';

async function searchHelp(args: Record<string, unknown>, ctx: ToolContext): Promise<ToolOutput> {
  const q = String(args.query ?? '').trim();
  if (!q) return { text: 'Give the question or topic in "query".', ok: false };
  let sections;
  try {
    sections = await guideSections({ SITE_URL, APP_URL: SITE_URL, GUIDE_URL, FEEDBACK_URL });
  } catch {
    return { text: `The guide could not be loaded. The full guide is at ${GUIDE_URL}.`, ok: false, summary: 'Could not load the guide' };
  }
  const best = rankSections(sections, q, 3);
  if (!best.length) return { text: `No section of the guide matches "${q}". The full guide: ${GUIDE_URL} (Help > User guide).`, summary: `Searched the guide for "${q}"` };
  const per = Math.max(600, Math.floor((ctx.maxResultBytes - 300) / best.length));
  const text = [
    `From the Socius beginner's guide (Help > User guide, ${GUIDE_URL}). Menu paths are in **bold**; follow them exactly.`,
    ...best.map((s) => sectionText(s, per)),
  ].join('\n\n');
  return { text: trimToBytes(text, ctx.maxResultBytes), summary: `Looked up "${best[0].title}" in the guide` };
}

export const helpTools: AgentTool[] = [
  {
    name: 'search_help',
    kind: 'read',
    compact: true,
    description: "Search the Socius beginner's guide for step-by-step instructions (menus, dialogs, buttons). Use for any 'how do I ... in Socius' question before answering.",
    parameters: { type: 'object', properties: { query: { type: 'string', description: 'The question or topic, e.g. "reverse code a question".' } }, required: ['query'] },
    label: (a) => `Looked up "${String(a.query ?? '')}" in the guide`,
    run: searchHelp,
  },
];
