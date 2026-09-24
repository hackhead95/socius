// Unit tests for the assistant's building blocks: safe Markdown, guide search, argument checks,
// the JSON action protocol, starter prompts and the prompt catalogue.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseInline, parseMarkdown, safeHref } from '../../src/features/assistant/markdown';
import { starterPrompts } from '../../src/features/assistant/starters';
import { rankSections, splitGuide, cleanGuideText } from '../../src/lib/assistant/help';
import { checkArgs } from '../../src/lib/assistant/validate';
import { parseAction, partialAnswer, buildJsonPrompt } from '../../src/lib/assistant/json-protocol';
import { allTools, compactTools } from '../../src/lib/assistant/tools';
import { catalogueText } from '../../src/lib/assistant/tools/analysis';
import { systemPrompt } from '../../src/lib/assistant/prompt';
import { parseFrom, parseTo } from '../../src/lib/assistant/tools/transform';
import { trimToBytes, byteLength } from '../../src/lib/assistant/format';
import { procedures } from '../../src/procedures';
import { emptyCodingProject } from '../../src/core/coding-types';
import { makeDataset, makeVariable } from '../../src/core/types';
import { DEFAULT_PERMISSIONS } from '../../src/lib/assistant/types';
import { isAssistantShortcut } from '../../src/features/assistant/AssistantRoot';

describe('Markdown', () => {
  it('parses headings, lists (nested and numbered), tables, code and quotes', () => {
    const md = '## Result\n\nWomen **felt less safe** (see `trust5`).\n\n1. First\n2. Second\n   - nested *one*\n\n| Group | % |\n|---|--:|\n| Man | 44.8 |\n| Woman | 29.3 |\n\n```\nCROSSTABS\n```\n\n> Note';
    const b = parseMarkdown(md);
    expect(b.map((x) => x.t)).toEqual(['h', 'p', 'list', 'table', 'code', 'quote']);
    const list = b[2] as Extract<(typeof b)[number], { t: 'list' }>;
    expect(list.ordered).toBe(true);
    expect(list.items).toHaveLength(2);
    expect(list.items[1].some((x) => x.t === 'list')).toBe(true);
    const table = b[3] as Extract<(typeof b)[number], { t: 'table' }>;
    expect(table.align).toEqual([null, 'right']);
    expect(table.rows).toHaveLength(2);
  });

  it('never lets HTML or script URLs through: raw tags stay text, only http(s)/mailto links', () => {
    const inl = parseInline('<img src=x onerror=alert(1)> [click](javascript:alert(1)) [ok](https://example.org)');
    expect(inl[0]).toEqual({ t: 'text', v: '<img src=x onerror=alert(1)> ' });
    expect(inl.some((x) => x.t === 'link' && x.href.startsWith('javascript'))).toBe(false);
    expect(inl.find((x) => x.t === 'link')).toMatchObject({ href: 'https://example.org' });
    expect(safeHref('data:text/html,hi')).toBeNull();
  });

  it('keeps underscores inside variable names and survives half-finished input while streaming', () => {
    expect(parseInline('use trust3_r and hh_income')).toEqual([{ t: 'text', v: 'use trust3_r and hh_income' }]);
    expect(parseInline('a _real_ emphasis')[1]).toEqual({ t: 'em', c: [{ t: 'text', v: 'real' }] });
    expect(() => parseMarkdown('## Head\n\n| a | b |\n|---|')).not.toThrow();
    expect(() => parseMarkdown('```\nunfinished code')).not.toThrow();
    expect(() => parseMarkdown('**bold without end and [link(')).not.toThrow();
    expect(parseMarkdown('> quote one\n> quote two')[0].t).toBe('quote');
  });
});

describe('Guide search', () => {
  const md = readFileSync('docs/guide/guide.md', 'utf8');
  const sections = splitGuide(md, { GUIDE_URL: 'https://x/guide/' });

  it('splits the guide into sections and removes its markup', () => {
    expect(sections.length).toBeGreaterThan(40);
    expect(sections.every((s) => !s.body.includes('<!--') && !s.body.includes('[['))).toBe(true);
    expect(cleanGuideText(':::tip Keep a copy\nText\n:::')).toBe('Tip: Keep a copy:\nText');
  });

  it.each([
    ['How do I open my SPSS file?', 'Open an SPSS file'],
    ['how to reverse code a question', 'Reverse-code a question'],
    ['weight my data', 'Weight cases'],
    ["cronbach's alpha scale", "Build a scale and check Cronbach's alpha"],
    ['copy a table into Word', 'Copy one table into Word'],
    ['intercoder reliability', 'Intercoder reliability: do two coders agree?'],
    ['select only women', 'Select cases'],
    ['set up Gemini key', 'Set it up'],
  ])('"%s" finds "%s"', (q, title) => {
    expect(rankSections(sections, q, 3).map((s) => s.title)).toContain(title);
  });
});

describe('Argument checks', () => {
  const schema = allTools().find((t) => t.name === 'run_analysis')!.parameters;
  it('coerces small slips and reports real mistakes', () => {
    const ok = checkArgs(schema, { procedure_id: 'CROSSTABS', variables: '{"rows": "gender", "columns": ["trust5"]}' });
    expect(ok.errors).toEqual([]);
    expect(ok.args.procedure_id).toBe('crosstabs');
    expect(ok.args.variables).toEqual({ rows: ['gender'], columns: ['trust5'] });
    expect(checkArgs(schema, { variables: {} }).errors).toEqual(['procedure_id is required.']);
    expect(checkArgs(schema, { procedure_id: 'nope', variables: {} }).errors[0]).toMatch(/must be one of/);
    const lim = checkArgs(allTools().find((t) => t.name === 'get_cases')!.parameters, { variables: ['age'], limit: '12' });
    expect(lim.args.limit).toBe(12);
  });

  it('parses recode rules the SPSS way', () => {
    expect(parseFrom('lowest thru 29', 'numeric')).toEqual({ kind: 'lowest', hi: 29 });
    expect(parseFrom('65 thru highest', 'numeric')).toEqual({ kind: 'highest', lo: 65 });
    expect(parseFrom('30-44', 'numeric')).toEqual({ kind: 'range', lo: 30, hi: 44 });
    expect(parseFrom('-1', 'numeric')).toEqual({ kind: 'value', value: -1 });
    expect(parseFrom('MISSING', 'numeric')).toEqual({ kind: 'missing' });
    expect(parseFrom("'yes'", 'string')).toEqual({ kind: 'value', value: 'yes' });
    expect(parseTo('sysmis', 'numeric')).toEqual({ kind: 'sysmis' });
    expect(() => parseTo('high', 'numeric')).toThrow(/Cannot read the new value/);
  });
});

describe('JSON action protocol', () => {
  const tools = compactTools();
  it('accepts tool calls and answers, tolerates fences, rejects unknown tools', () => {
    expect(parseAction('```json\n{"tool": "describe_variables", "args": {"names": ["age"]}}\n```', tools)).toEqual({ kind: 'tool', tool: 'describe_variables', args: { names: ['age'] } });
    expect(parseAction('{"answer": "Hi"}', tools)).toEqual({ kind: 'answer', answer: 'Hi' });
    expect(parseAction('{"tool": "rm_rf", "args": {}}', tools)).toMatchObject({ kind: 'invalid' });
    expect(parseAction('I think...', tools)).toMatchObject({ kind: 'invalid' });
  });

  it('shows a streaming answer and keeps prompts inside the small budget', () => {
    expect(partialAnswer('{"answer": "Line one\\nLine tw')).toBe('Line one\nLine tw');
    expect(partialAnswer('{"tool": "x"')).toBeNull();
    const long = Array.from({ length: 30 }, (_, i) => ({ kind: 'result' as const, text: `result ${i} ${'x'.repeat(900)}` }));
    const p = buildJsonPrompt('system', tools, [{ kind: 'user', text: 'first' }, ...long, { kind: 'user', text: 'latest question' }], 6_500);
    expect(byteLength(p)).toBeLessThanOrEqual(6_600);
    expect(p).toContain('User: latest question');
  });
});

describe('Knowledge and context', () => {
  it('generates the catalogue from the live registry', () => {
    const text = catalogueText();
    for (const p of procedures) expect(text).toContain(`- ${p.id}: ${p.title}`);
    expect(catalogueText('crosstabs')).toMatch(/Options:\n- observed \(true\/false, default true\)/);
    expect(catalogueText('nope')).toMatch(/Unknown procedure/);
  });

  it('never states the data when statistics are switched off', () => {
    const ds = makeDataset({ name: 'secret_survey', variables: [makeVariable({ name: 'x' })], nCases: 3, columns: {} });
    ds.columns[ds.variables[0].id] = new Float64Array([1, 2, 3]);
    const s = systemPrompt({ snapshot: { dataset: ds, outputs: [], coding: emptyCodingProject(), tab: 'data' }, permissions: { ...DEFAULT_PERMISSIONS, stats: false } });
    expect(s).not.toContain('secret_survey');
    expect(s).toContain('switched off variable information');
  });

  it('trims to a byte budget at a line break', () => {
    const text = Array.from({ length: 60 }, (_, i) => `line ${i} ${'é'.repeat(20)}`).join('\n');
    for (const max of [40, 300, 2000]) {
      const t = trimToBytes(text, max);
      expect(byteLength(t)).toBeLessThanOrEqual(max);
      expect(t.startsWith('line 0')).toBe(true);
    }
    expect(trimToBytes('short', 100)).toBe('short');
  });
});

describe('Starter prompts and shortcut', () => {
  it('fit the context', () => {
    const empty = { dataset: null, outputs: [], coding: emptyCodingProject(), tab: 'data' as const };
    expect(starterPrompts(empty)).toContain('How do I open my SPSS file?');
    const ds = makeDataset({
      name: 'd',
      variables: [
        makeVariable({ name: 'trust1', measure: 'ordinal' }), makeVariable({ name: 'trust2', measure: 'ordinal' }), makeVariable({ name: 'trust3', measure: 'ordinal' }),
        makeVariable({ name: 'life_sat', measure: 'scale' }),
        makeVariable({ name: 'gender', measure: 'nominal', valueLabels: [{ value: 1, label: 'Man' }, { value: 2, label: 'Woman' }] }),
      ],
    });
    const p = starterPrompts({ ...empty, dataset: ds });
    expect(p).toEqual(['Describe my dataset', 'Which variables need cleaning?', 'Which test should I use to compare life_sat across gender?', 'Build a trust scale']);
    expect(starterPrompts({ ...empty, dataset: ds, tab: 'output', outputs: [{ id: 'o', procedure: 'crosstabs', title: 'Crosstabs', createdAt: 0, blocks: [] }] })[0]).toBe('Explain my latest result');
    expect(starterPrompts({ ...empty, tab: 'coding', coding: { ...emptyCodingProject(), docs: [{ id: 'd', name: 'x', kind: 'document', text: 't', createdAt: 0, attributes: { gender: 'Woman' } }] } })).toEqual([
      'Summarise the main themes', 'Compare codes by gender', 'Suggest a codebook for these texts',
    ]);
  });

  it('Ctrl+J and Cmd+J toggle the panel', () => {
    expect(isAssistantShortcut({ key: 'j', ctrlKey: true, metaKey: false, altKey: false, shiftKey: false })).toBe(true);
    expect(isAssistantShortcut({ key: 'J', ctrlKey: false, metaKey: true, altKey: false, shiftKey: false })).toBe(true);
    expect(isAssistantShortcut({ key: 'j', ctrlKey: false, metaKey: false, altKey: false, shiftKey: false })).toBe(false);
  });
});
