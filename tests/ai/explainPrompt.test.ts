// "Explain with AI": what goes into the prompt (aggregate numbers, labels, summaries, warnings) and
// what never does (individual cases: scatter points, outlier values, casewise tables, quotes).
import { describe, expect, it } from 'vitest';
import { cell, hcell, type OutputItem } from '../../src/core/output';
import {
  EXPLAIN_INSTRUCTIONS, buildExplainPrompt, byteLength, chartToCompactText, isExplainable, outputItemContext, plainText, tableToCompactText,
} from '../../src/features/ai/explainPrompt';

function crosstabItem(): OutputItem {
  return {
    id: 'o1',
    procedure: 'crosstabs',
    title: 'Crosstabs: gender by voted',
    createdAt: 0,
    datasetName: 'Confidential study',
    caseNote: 'N = 640',
    syntax: 'CROSSTABS /TABLES=gender BY voted /STATISTICS=CHISQ.',
    blocks: [
      {
        kind: 'table',
        table: {
          title: 'gender * voted Crosstabulation',
          header: [[hcell('Gender', { rowSpan: 2 }), hcell('', { rowSpan: 2 }), hcell('Voted', { colSpan: 2 }), hcell('Total', { rowSpan: 2 })], [hcell('Yes'), hcell('No')]],
          rows: [
            [hcell('Woman', { rowSpan: 2 }), hcell('Count'), cell(201, 'int'), cell(123, 'int'), cell(324, 'int')],
            [hcell('% within gender'), cell(62.04, 'pct'), cell(37.96, 'pct'), cell(100, 'pct')],
            [hcell('Man', { rowSpan: 2 }), hcell('Count'), cell(174, 'int'), cell(142, 'int'), cell(316, 'int')],
            [hcell('% within gender'), cell(55.06, 'pct'), cell(44.94, 'pct'), cell(100, 'pct')],
          ],
          stubColumns: 2,
          footnotes: ['a. 0 cells have expected count less than 5.'],
        },
      },
      {
        kind: 'table',
        table: {
          title: 'Chi-Square Tests',
          header: [[hcell(''), hcell('Value'), hcell('df'), hcell('Asymptotic Significance (2-sided)')]],
          rows: [[hcell('Pearson Chi-Square'), cell(3.2125, 'dec3'), cell(1, 'int'), cell(0.0731, 'p')]],
        },
      },
      { kind: 'chart', chart: { type: 'scatter', title: 'Age by income', xLabel: 'age', yLabel: 'income', points: [{ x: 41, y: 987654.321 }, { x: 77, y: 123456.789 }] } },
      {
        kind: 'chart',
        chart: { type: 'box', title: 'Income by gender', groups: [{ name: 'Woman', min: 1, q1: 2, median: 3, q3: 4, max: 5, n: 10, outliers: [{ value: 55555.5, caseIndex: 4242 }] }] },
      },
      {
        kind: 'table',
        table: { title: 'Casewise Diagnostics', header: [[hcell('Case Number'), hcell('Std. Residual'), hcell('income')]], rows: [[cell(4242, 'int'), cell(3.9, 'dec3'), cell(31337, 'int')]] },
      },
      { kind: 'text', style: 'interpretation', text: 'Women were slightly more likely than men to vote.' },
      { kind: 'text', style: 'apa', text: 'χ²(1, N = 640) = 3.21, p = .073' },
      { kind: 'text', style: 'warning', text: 'The sample is not random.' },
      { kind: 'text', style: 'note', ai: true, text: 'AI-generated explanation (Gemini). An earlier answer.' },
    ],
  };
}

describe('explain prompt', () => {
  it('contains the tables as compact text, the summaries and the warnings', () => {
    const { prompt } = buildExplainPrompt(crosstabItem());
    expect(prompt).toContain(EXPLAIN_INSTRUCTIONS);
    expect(prompt).toContain('Result: Crosstabs: gender by voted');
    expect(prompt).toContain('Cases: N = 640');
    expect(prompt).toContain('Table: gender * voted Crosstabulation');
    expect(prompt).toContain('Columns: Gender | - | Voted: Yes | Voted: No | Total');
    expect(prompt).toContain('Woman | Count | 201 | 123 | 324');
    expect(prompt).toContain('Woman | % within gender | 62.0% | 38.0% | 100.0%'); // row-spanning labels repeat
    expect(prompt).toContain('Pearson Chi-Square | 3.213 | 1 | .073');
    expect(prompt).toContain('Footnote: a. 0 cells have expected count less than 5.');
    expect(prompt).toContain("Socius's plain-language summary: Women were slightly more likely than men to vote.");
    expect(prompt).toContain('APA sentence produced by Socius: χ²(1, N = 640) = 3.21, p = .073');
    expect(prompt).toContain('Warning shown by Socius: The sample is not random.');
    expect(prompt).toContain('CROSSTABS /TABLES=gender BY voted');
    // Box plot: five-number summary and the outlier count only.
    expect(prompt).toContain('Chart (box): Income by gender');
  });

  it('never contains case-level values', () => {
    const { prompt, context } = buildExplainPrompt(crosstabItem());
    for (const v of ['987654', '123456', '55555', '4242', '31337']) expect(prompt).not.toContain(v);
    expect(prompt).not.toContain('Casewise Diagnostics |');
    expect(context.omitted.join(' ')).toMatch(/Scatter plot "Age by income"/);
    expect(context.omitted.join(' ')).toMatch(/Casewise Diagnostics/);
    // Neither earlier AI text nor the dataset name is sent.
    expect(prompt).not.toContain('An earlier answer');
    expect(prompt).not.toContain('Confidential study');
  });

  it('asks for the five sections and the usual cautions', () => {
    for (const h of ['What was tested', 'What the numbers mean', 'Assumptions and warnings', 'How to report it', 'Cautions']) expect(EXPLAIN_INSTRUCTIONS).toContain(h);
    expect(EXPLAIN_INSTRUCTIONS).toMatch(/not causation/);
    expect(EXPLAIN_INSTRUCTIONS).toMatch(/never invent values/);
    expect(EXPLAIN_INSTRUCTIONS).not.toMatch(/—/);
  });

  it('stays within the provider budget, shortening long tables', () => {
    const item = crosstabItem();
    const rows = Array.from({ length: 2000 }, (_, i) => [hcell(`Category ${i}`), cell(i, 'int'), cell(i / 3, 'dec2')]);
    item.blocks.unshift({ kind: 'table', table: { title: 'Big table', header: [[hcell(''), hcell('N'), hcell('Mean')]], rows } });
    const budget = 10_000;
    const { prompt, context } = buildExplainPrompt(item, { budgetBytes: budget });
    expect(byteLength(prompt)).toBeLessThanOrEqual(budget);
    expect(context.truncated).toBe(true);
    expect(prompt).toMatch(/more rows not sent/);
    // The summaries come first, so they survive.
    expect(prompt).toContain('Women were slightly more likely');
  });

  it('knows which items can be explained', () => {
    expect(isExplainable(crosstabItem())).toBe(true);
    expect(isExplainable({ id: 't', procedure: 'transform', title: 'Compute', createdAt: 0, blocks: [{ kind: 'text', style: 'note', text: 'x' }] })).toBe(false);
    expect(isExplainable({ id: 'k', procedure: 'coding', title: 'Keyword in context: "water"', createdAt: 0, blocks: [{ kind: 'table', table: { title: 'Keyword in context: "water"', header: [], rows: [] } }] })).toBe(false);
  });

  it('turns tables and charts into compact text', () => {
    const t = tableToCompactText({ title: 'T', header: [[hcell('A'), hcell('B')]], rows: [[hcell('x'), cell(1.5, 'dec1')], [hcell('y'), cell(null)]] }, 1);
    expect(t.text).toBe('Table: T\nColumns: A | B\nx | 1.5\n(1 more row not sent)');
    expect(chartToCompactText({ type: 'scatter', title: 's', xLabel: 'x', yLabel: 'y', points: [] })).toBeNull();
    expect(chartToCompactText({ type: 'bar', title: 'Votes', categories: ['Yes', 'No'], series: [{ name: 'Count', values: [3, 4] }] })).toBe('Chart (bar): Votes\nColumns: Category | Count\nYes | 3\nNo | 4');
    expect(outputItemContext(crosstabItem()).text.startsWith('Result: ')).toBe(true);
  });

  it('turns a Markdown reply into plain text for the output', () => {
    expect(plainText('## What was tested\n**Voting** by gender.\n* one\n\n\n\n- two `x`')).toBe('What was tested\nVoting by gender.\n- one\n\n- two x');
  });
});
