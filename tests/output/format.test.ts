import { describe, expect, it } from 'vitest';
import { cellText, formatCell, formatNumber, formatP, isSignificantP, layoutRows, percentColumns } from '../../src/features/output/format';
import { cell, hcell, type OutputTable } from '../../src/core/output';

describe('formatNumber', () => {
  it('int: rounds and groups thousands', () => {
    expect(formatNumber(1234, 'int')).toBe('1,234');
    expect(formatNumber(1234567.6, 'int')).toBe('1,234,568');
    expect(formatNumber(12, 'int')).toBe('12');
    expect(formatNumber(-0.2, 'int')).toBe('0');
  });
  it('decN: fixed decimals, grouping from 1,000', () => {
    expect(formatNumber(3.14159, 'dec2')).toBe('3.14');
    expect(formatNumber(1234.5, 'dec1')).toBe('1,234.5');
    expect(formatNumber(0.5, 'dec3')).toBe('0.500');
    expect(formatNumber(2, 'dec4')).toBe('2.0000');
    expect(formatNumber(-0.001, 'dec2')).toBe('0.00');
  });
  it('pct: % unless the column header names percent', () => {
    expect(formatNumber(45.24, 'pct')).toBe('45.2%');
    expect(formatNumber(45.24, 'pct', { style: 'spss', percentColumn: true })).toBe('45.2');
    expect(formatNumber(100, 'pct')).toBe('100.0%');
  });
  it('p: APA and SPSS styles, never 0.000', () => {
    expect(formatP(0.0321)).toBe('.032');
    expect(formatP(0.0004)).toBe('< .001');
    expect(formatP(0.0004, 'spss')).toBe('<.001');
    expect(formatP(0)).toBe('< .001');
    expect(formatP(0.00099)).toBe('< .001');
    expect(formatP(0.001)).toBe('.001');
    expect(formatP(0.9999)).toBe('1.000');
    expect(formatP(0.5)).toBe('.500');
    expect(formatNumber(0.0000001, 'p', { style: 'apa' })).not.toMatch(/0\.000|\.000/);
  });
  it('r: drops the leading zero', () => {
    expect(formatNumber(0.4523, 'r')).toBe('.452');
    expect(formatNumber(-0.087, 'r')).toBe('-.087');
    expect(formatNumber(1, 'r')).toBe('1.000');
    expect(formatNumber(0, 'r')).toBe('.000');
  });
  it('coef: 3 decimals, leading zero kept', () => {
    expect(formatNumber(0.4523, 'coef')).toBe('0.452');
    expect(formatNumber(12.3, 'coef')).toBe('12.300');
    expect(formatNumber(-1234.5678, 'coef')).toBe('-1,234.568');
  });
  it('special values', () => {
    expect(formatNumber(NaN, 'dec2')).toBe('.');
    expect(formatNumber(NaN, 'p')).toBe('.');
    expect(formatNumber(Infinity, 'dec2')).toBe('∞');
    expect(formatNumber(2.5, undefined)).toBe('2.5');
    expect(formatNumber(1 / 3, undefined)).toBe('0.333');
    expect(formatNumber(10000, undefined)).toBe('10,000');
  });
});

describe('formatCell', () => {
  it('null is blank, strings pass through, marks kept separately', () => {
    expect(formatCell(cell(null)).text).toBe('');
    expect(formatCell(hcell('Total')).text).toBe('Total');
    const f = formatCell(cell(0.21, 'r', { mark: '**' }));
    expect(f.text).toBe('.210');
    expect(f.mark).toBe('**');
    expect(cellText(cell(0.21, 'r', { mark: '**' }))).toBe('.210**');
    expect(formatCell(cell(3, 'int')).numeric).toBe(true);
  });
  it('flags significant p-values', () => {
    expect(isSignificantP(cell(0.01, 'p'))).toBe(true);
    expect(isSignificantP(cell(0.2, 'p'))).toBe(false);
    expect(isSignificantP(cell(0.01, 'dec2'))).toBe(false);
  });
});

describe('table geometry', () => {
  it('lays out colSpan/rowSpan like HTML', () => {
    const { grid, columns } = layoutRows([
      [hcell('', { rowSpan: 2 }), hcell('Sex', { colSpan: 2 }), hcell('Total', { rowSpan: 2 })],
      [hcell('Male'), hcell('Female')],
    ]);
    expect(columns).toBe(4);
    expect(grid[1].map((g) => g.col)).toEqual([1, 2]);
    expect(grid[0][2].col).toBe(3);
  });
  it('finds percent columns from the lowest header', () => {
    const t: OutputTable = {
      title: 'Frequencies',
      header: [[hcell(''), hcell('Frequency'), hcell('Percent'), hcell('Valid Percent'), hcell('Cumulative Percent'), hcell('Percentile')]],
      rows: [],
    };
    expect(percentColumns(t)).toEqual([false, false, true, true, true, false]);
    const t2: OutputTable = {
      title: 'Crosstab',
      header: [[hcell('', { rowSpan: 2 }), hcell('Percent by sex', { colSpan: 2 })], [hcell('Male'), hcell('Female')]],
      rows: [],
    };
    expect(percentColumns(t2)).toEqual([false, false, false]);
  });
});
