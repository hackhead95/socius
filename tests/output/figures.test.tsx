// @vitest-environment jsdom
// UI-026: charts are APA figures ("Figure N" in bold, the title in italics) numbered like the tables'
// "Table N", and the title is shown once: not again inside the chart under the caption. The same holds
// for the Word and HTML exports and the rich copy. Also UI-030 (item dates) and UI-015 (outline tooltips).
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { ChartSpec, OutputItem } from '../../src/core/output';

const calls: Array<{ fn: string; opts: unknown }> = [];
vi.mock('../../src/features/charts/export', async (orig) => {
  const real = await orig<typeof import('../../src/features/charts/export')>();
  return {
    ...real,
    chartToPng: async (_s: ChartSpec, _w?: number, _sc?: number, opts?: unknown) => {
      calls.push({ fn: 'png', opts });
      return { blob: new Blob([]), bytes: new Uint8Array([137, 80, 78, 71]), width: 680, height: 340 };
    },
    chartToPngDataUrl: async (_s: ChartSpec, _w?: number, opts?: unknown) => {
      calls.push({ fn: 'dataUrl', opts });
      return { url: 'data:image/png;base64,', width: 680, height: 340 };
    },
    chartToSvg: (_s: ChartSpec, _w?: number, opts?: unknown) => {
      calls.push({ fn: 'svg', opts });
      return { svg: '<svg></svg>', width: 680, height: 340 };
    },
  };
});
vi.mock('../../src/platform/host', async (orig) => ({
  ...(await orig<typeof import('../../src/platform/host')>()),
  saveFile: async () => 'saved' as const,
  copyToClipboard: async () => true,
}));

const { useStore } = await import('../../src/core/store');
const { OutputViewer, outputNumbering } = await import('../../src/features/output/OutputViewer');
const { useOutputPrefs } = await import('../../src/features/output/viewPrefs');
const { exportReport, copyItem } = await import('../../src/features/output/actions');
const { Chart } = await import('../../src/features/charts/Chart');
const { formatDateTime, formatTime } = await import('../../src/core/format-date');

const chart: ChartSpec = { type: 'bar', title: 'Highest level of education completed', categories: ['Primary', 'Secondary', 'Degree'], series: [{ name: 'Count', values: [10, 20, 15] }], yLabel: 'Count' };
const at = Date.UTC(2026, 8, 24, 13, 54);
const items = (): OutputItem[] => [
  { id: 'a', procedure: 'frequencies', title: 'Frequencies', createdAt: at, blocks: [{ kind: 'table', table: { title: 'Statistics', header: [], rows: [[{ v: 'N' }, { v: 640, fmt: 'int' }]] } }] },
  {
    id: 'b',
    procedure: 'graph-bar',
    title: 'Bar chart: Highest level of education completed',
    createdAt: at,
    blocks: [
      { kind: 'chart', chart },
      { kind: 'table', table: { title: 'Values shown in the chart', header: [], rows: [[{ v: 'Primary' }, { v: 10, fmt: 'int' }]] } },
      { kind: 'chart', chart: { ...chart, title: 'Second chart' } },
    ],
  },
];

beforeAll(() => {
  (globalThis as any).ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
beforeEach(() => {
  calls.length = 0;
  useStore.setState({ outputs: items(), toasts: [] });
});
afterEach(cleanup);

describe('APA figure numbers', () => {
  it('numbers tables and figures separately across the whole output', () => {
    const n = outputNumbering(items());
    expect([n.get('a:0'), n.get('b:1')]).toEqual([1, 2]); // tables
    expect([n.get('b:0'), n.get('b:2')]).toEqual([1, 2]); // figures
  });

  it('shows "Figure N" and the italic title above the chart, and leaves the title out of the chart', () => {
    useOutputPrefs.setState({ tableStyle: 'apa' });
    render(<OutputViewer />);
    const caps = Array.from(document.querySelectorAll('.ob-fig-caption'));
    expect(caps.map((c) => c.querySelector('.ob-fig-number')!.textContent)).toEqual(['Figure 1', 'Figure 2']);
    expect(caps[0].querySelector('.ob-fig-title')!.textContent).toBe('Highest level of education completed');
    expect(document.querySelectorAll('.ot-number')[1].textContent).toBe('Table 2');
    const fig = caps[0].closest('figure')!;
    expect(fig.querySelector('.chart-header text')).toBeNull();
    // The chart keeps the title as its accessible name.
    expect(fig.querySelector('svg title')!.textContent).toBe('Highest level of education completed');
  });

  it('in SPSS style the chart keeps its own title and there is no figure number', () => {
    useOutputPrefs.setState({ tableStyle: 'spss' });
    render(<OutputViewer />);
    expect(document.querySelector('.ob-fig-caption')).toBeNull();
    expect(document.querySelector('.ob-chart .chart-header text')!.textContent).toBe('Highest level of education completed');
    useOutputPrefs.setState({ tableStyle: 'apa' });
  });

  it('a chart can be drawn without its title', () => {
    const { container, rerender } = render(<Chart spec={chart} width={600} />);
    expect(container.querySelector('.chart-header text')!.textContent).toBe(chart.title);
    rerender(<Chart spec={chart} width={600} showTitle={false} />);
    expect(container.querySelector('.chart-header text')).toBeNull();
    expect(container.querySelector('svg title')!.textContent).toBe(chart.title);
  });
});

describe('exports print the caption, so the chart image leaves the title out', () => {
  const opts = { style: 'apa' as const, includeInterpretations: true, includeSyntax: false };
  it('Word (always APA)', async () => {
    await exportReport(items(), 'docx', opts);
    expect(calls.filter((c) => c.fn === 'png').map((c) => c.opts)).toEqual([{ showTitle: false }, { showTitle: false }]);
  });
  it('HTML in APA style, but not in SPSS style (no caption there)', async () => {
    await exportReport(items(), 'html', opts);
    await exportReport(items(), 'html', { ...opts, style: 'spss' });
    expect(calls.filter((c) => c.fn === 'svg').map((c) => c.opts)).toEqual([{ showTitle: false }, { showTitle: false }, { showTitle: true }, { showTitle: true }]);
  });
  it('the rich copy of one result', async () => {
    await copyItem(items()[1], opts);
    expect(calls.filter((c) => c.fn === 'dataUrl').map((c) => c.opts)).toEqual([{ showTitle: false }, { showTitle: false }]);
  });
});

describe('Output dates and outline', () => {
  it('uses the shared date format for items and a tooltip for long outline titles', () => {
    render(<OutputViewer />);
    expect(screen.getAllByText((_, el) => !!el?.classList.contains('oi-meta') && el.textContent!.includes(formatDateTime(at))).length).toBe(2);
    const title = document.querySelector('.ov-outline-title')!;
    expect(title.getAttribute('title')).toBe('Frequencies');
    const time = document.querySelector('.ov-outline-time')!;
    expect(time.textContent).toBe(formatTime(at));
    expect(time.getAttribute('title')).toBe(formatDateTime(at));
  });
});
