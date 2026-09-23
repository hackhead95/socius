import { cell, hcell, type OutputItem } from '../../src/core/output';

export function sampleItem(): OutputItem {
  return {
    id: 'o1',
    procedure: 'crosstabs',
    title: 'Crosstabs: Education by Sex',
    createdAt: Date.UTC(2026, 8, 1, 10, 30),
    datasetName: 'gss_sample',
    caseNote: 'N = 1,204; 12 excluded (missing)',
    syntax: 'CROSSTABS\n  /TABLES=educ BY sex\n  /STATISTICS=CHISQ.',
    blocks: [
      { kind: 'heading', text: 'Cross-tabulation' },
      {
        kind: 'table',
        table: {
          title: 'Education by sex',
          header: [
            [hcell('', { rowSpan: 2 }), hcell('', { rowSpan: 2 }), hcell('Sex', { colSpan: 2 }), hcell('Total', { rowSpan: 2 })],
            [hcell('Male'), hcell('Female')],
          ],
          stubColumns: 2,
          rows: [
            [hcell('High school', { rowSpan: 2 }), hcell('Count'), cell(310, 'int'), cell(290, 'int'), cell(600, 'int')],
            [hcell('% within Sex'), cell(51.2, 'pct'), cell(48.3, 'pct'), cell(49.8, 'pct')],
            [hcell('Degree', { rowSpan: 2 }), hcell('Count'), cell(296, 'int'), cell(308, 'int'), cell(1604, 'int')],
            [hcell('% within Sex'), cell(48.8, 'pct'), cell(51.7, 'pct'), cell(50.2, 'pct')],
          ],
          ruleBefore: [2],
          footnotes: ['Counts are weighted.'],
        },
      },
      {
        kind: 'table',
        table: {
          title: 'Chi-square tests',
          header: [[hcell(''), hcell('Value'), hcell('df'), hcell('p')]],
          rows: [
            [hcell('Pearson Chi-Square'), cell(14.2, 'dec2', { mark: 'a' }), cell(2, 'int'), cell(0.0004, 'p')],
            [hcell('N of valid cases'), cell(1204, 'int'), cell(null), cell(null)],
          ],
        },
      },
      { kind: 'chart', chart: { type: 'bar', title: 'Education by sex', categories: ['High school', 'Degree'], series: [{ name: 'Male', values: [51.2, 48.8] }, { name: 'Female', values: [48.3, 51.7] }], percent: true } },
      { kind: 'text', style: 'interpretation', text: 'Women were slightly more likely than men to hold a degree.' },
      { kind: 'text', style: 'apa', text: 'χ²(2, N = 1204) = 14.20, p < .001, Cramér’s V = .11' },
      { kind: 'text', style: 'note', text: 'Cells with expected counts below 5: 0.' },
      { kind: 'text', style: 'warning', text: 'Small groups: interpret with care.' },
    ],
  };
}

/** Smallest valid PNG (1x1 transparent). */
export const TINY_PNG = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0));
