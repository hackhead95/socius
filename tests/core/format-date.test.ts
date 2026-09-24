// UI-030: one date/time format everywhere (Output, memo list, memo footer, reports).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dateLocale, formatDate, formatDateTime, formatLongDate, formatTime } from '../../src/core/format-date';

const T = Date.UTC(2026, 8, 24, 14, 55, 18);
const utc = (locale: string) => ({ locale, timeZone: 'UTC' });

afterEach(() => vi.unstubAllGlobals());

describe('shared date formatter', () => {
  it('writes "24 Sep 2026, 14:55" in British English: month as a word, 24-hour clock, no seconds', () => {
    expect(formatDateTime(T, utc('en-GB'))).toBe('24 Sep 2026, 14:55');
    expect(formatDate(T, utc('en-GB'))).toBe('24 Sep 2026');
    expect(formatLongDate(T, utc('en-GB'))).toBe('24 September 2026');
    expect(formatTime(T, utc('en-GB'))).toBe('14:55');
  });

  it('follows the English locale order but never the ambiguous 9/24/2026 or a 12-hour clock', () => {
    const us = formatDateTime(T, utc('en-US'));
    expect(us).toBe('Sep 24, 2026, 14:55');
    expect(us).not.toMatch(/\d+\/\d+\/\d+|PM|AM/);
    expect(formatDateTime(Date.UTC(2026, 8, 24, 0, 5), utc('en-US'))).toBe('Sep 24, 2026, 00:05');
    expect(formatDateTime(T, utc('en-IN'))).toBe('24 Sep 2026, 14:55');
  });

  it('accepts a timestamp, a Date or an ISO string and returns "" for an invalid date', () => {
    expect(formatDateTime(new Date(T), utc('en-GB'))).toBe('24 Sep 2026, 14:55');
    expect(formatDateTime(new Date(T).toISOString(), utc('en-GB'))).toBe('24 Sep 2026, 14:55');
    expect(formatDateTime('not a date')).toBe('');
    expect(formatDateTime(NaN)).toBe('');
  });

  it('uses the browser language only when it is English (the interface is English)', () => {
    vi.stubGlobal('navigator', { languages: ['de-DE', 'en-US'], language: 'de-DE' });
    expect(dateLocale()).toBe('en-US');
    vi.stubGlobal('navigator', { languages: ['de-DE'], language: 'de-DE' });
    expect(dateLocale()).toBe('en-GB');
    expect(formatDateTime(T, { timeZone: 'UTC' })).toBe('24 Sep 2026, 14:55');
    vi.stubGlobal('navigator', { languages: [], language: 'en-AU' });
    expect(dateLocale()).toBe('en-AU');
  });

  it('is the only way the app formats dates (coding, output, the shell, data, files, error log, AI)', async () => {
    const { readFileSync, readdirSync, statSync } = await import('node:fs');
    const { join } = await import('node:path');
    const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
    const files = [
      'src/features/coding', 'src/features/output', 'src/features/charts', 'src/lib/coding',
      'src/app', 'src/ui', 'src/features/data', 'src/features/transform', 'src/features/project', 'src/features/assistant', 'src/features/errorlog', 'src/features/ai',
    ].flatMap(walk).filter((f) => /\.tsx?$/.test(f));
    const adHoc = /toLocale(Date|Time)String\(|new Date\([^)]*\)\.toLocaleString\(/;
    expect(files.filter((f) => adHoc.test(readFileSync(f, 'utf8')))).toEqual([]);
  });
});
