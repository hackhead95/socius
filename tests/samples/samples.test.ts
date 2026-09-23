import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { importFile } from '../../src/lib/io';
import { assetBytes, loadSampleDataset, samples, sampleTranscripts, SAMPLE_SURVEY_FILE } from '../../src/samples';
import type { Dataset } from '../../src/core/types';

const SAV = fileURLToPath(new URL('../../src/samples/urban_trust_survey.sav', import.meta.url));
const CSV = fileURLToPath(new URL('../../public/samples/urban_trust_survey.csv', import.meta.url));

const EXPECTED_NAMES = [
  'resp_id', 'city', 'area', 'interviewer', 'int_date', 'gender', 'age', 'educ', 'employ', 'marital',
  'hh_size', 'hh_income', 'migrant', 'yrs_nbhd', 'trust1', 'trust2', 'trust3', 'trust4', 'trust5',
  'civic_meet', 'civic_vol', 'civic_petition', 'civic_contact', 'civic_protest', 'belong', 'life_sat',
  'health', 'internet', 'sm_hours', 'discrim', 'vote', 'wt', 'q_challenge', 'q_connect',
];

/** importFile on the bundled .sav, or null while lib/io is still a stub. */
async function tryImport(): Promise<Dataset | null> {
  try {
    const { dataset } = await importFile(SAMPLE_SURVEY_FILE, new Uint8Array(readFileSync(SAV)));
    return dataset;
  } catch (e) {
    if (e instanceof Error && /not implemented/i.test(e.message)) return null;
    throw e;
  }
}

const SKIP_NOTE = 'importFile is not implemented yet; this test turns on automatically when lib/io lands.';

describe('bundled sample survey file', () => {
  it('exists, is an SPSS system file and has a sensible size', () => {
    const size = statSync(SAV).size;
    expect(size).toBeGreaterThan(100_000);
    expect(size).toBeLessThan(400_000);
    const head = readFileSync(SAV).subarray(0, 4).toString('latin1');
    expect(head).toBe('$FL2');
  });

  it('has a matching CSV copy with 640 data rows', () => {
    const lines = readFileSync(CSV, 'utf8').trimEnd().split('\n');
    expect(lines[0].split(',')).toEqual(EXPECTED_NAMES);
    // Open answers can contain commas (quoted) but no newlines, so one line per case.
    expect(lines.length - 1).toBe(640);
  });

  it('is listed in samples', () => {
    expect(samples.map((s) => s.id)).toContain('urban-trust');
    expect(samples[0].title).toMatch(/synthetic/i);
  });
});

describe('sample survey through lib/io', () => {
  it('imports as 640 cases with the expected dictionary', async (ctx) => {
    const ds = await tryImport();
    if (!ds) {
      console.warn(SKIP_NOTE);
      ctx.skip();
      return;
    }
    expect(ds.nCases).toBe(640);
    expect(ds.variables.map((v) => v.name)).toEqual(EXPECTED_NAMES);
    expect(ds.fileLabel).toMatch(/fictional/i);

    const byName = Object.fromEntries(ds.variables.map((v) => [v.name, v]));
    expect(byName.city.valueLabels.find((l) => l.value === 1)?.label).toBe('Kolkata');
    expect(byName.city.measure).toBe('nominal');
    expect(byName.educ.measure).toBe('ordinal');
    expect(byName.hh_income.measure).toBe('scale');
    expect(byName.trust3.label).toMatch(/very careful/);
    expect([...byName.trust1.missing.discrete].sort()).toEqual([8, 9]);
    expect(byName.hh_income.missing.discrete).toEqual([999999]);
    expect(byName.int_date.format).toMatch(/^DATE11/);
    expect(byName.q_challenge.type).toBe('string');
    expect(byName.q_challenge.width).toBeGreaterThan(255);

    const n = ds.columns[byName.resp_id.id] as Float64Array;
    expect(n[0]).toBe(1001);
    const age = ds.columns[byName.age.id] as Float64Array;
    expect(Array.from(age).some((x) => Number.isNaN(x))).toBe(true);
    const text = ds.columns[byName.q_challenge.id] as string[];
    expect(text.some((s) => /[ঀ-৿]/.test(s))).toBe(true); // Bengali script survives
    expect(text.some((s) => /[ऀ-ॣ]/.test(s))).toBe(true); // Devanagari too
    expect(text.every((s) => s === s.trimEnd())).toBe(true); // no SPSS space padding
    // First interview is 6 Jan 2025: seconds since 1582-10-14.
    const d0 = (ds.columns[byName.int_date.id] as Float64Array)[0];
    expect(d0).toBe((Date.UTC(2025, 0, 6) - Date.UTC(1582, 9, 14)) / 1000);
  });

  describe('loadSampleDataset', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('fetches the bundled file and marks it as a sample', async (ctx) => {
      if (!(await tryImport())) {
        console.warn(SKIP_NOTE);
        ctx.skip();
        return;
      }
      const bytes = readFileSync(SAV);
      vi.stubGlobal('fetch', async () => new Response(bytes));
      const ds = await loadSampleDataset('urban-trust');
      expect(ds.nCases).toBe(640);
      expect(ds.source).toMatchObject({ kind: 'sample', fileName: 'urban_trust_survey.sav' });
      expect(ds.name).toMatch(/sample/i);
    });

    it('rejects an unknown id', async () => {
      await expect(loadSampleDataset('nope')).rejects.toThrow(/no sample/i);
    });
  });
});

describe('assetBytes', () => {
  it('decodes an inlined base64 data: URL (single-file build) without fetch', async () => {
    const bytes = new Uint8Array(readFileSync(SAV));
    const url = `data:application/octet-stream;base64,${Buffer.from(bytes).toString('base64')}`;
    const out = await assetBytes(url);
    expect(out.length).toBe(bytes.length);
    expect(Buffer.from(out).equals(Buffer.from(bytes))).toBe(true);
  });
});

describe('sample transcripts', () => {
  it('has three fictional transcripts of 1,500 to 2,500 words', () => {
    expect(sampleTranscripts).toHaveLength(3);
    for (const t of sampleTranscripts) {
      const words = t.text.split(/\s+/).filter(Boolean).length;
      expect(words).toBeGreaterThanOrEqual(1500);
      expect(words).toBeLessThanOrEqual(2500);
      expect(t.text).toMatch(/FICTIONAL/);
      expect(t.text).toMatch(/^I: /m);
      expect(t.text).toMatch(/^R: /m);
      for (const k of ['pseudonym', 'age', 'gender', 'city', 'migrant', 'interviewDate']) {
        expect(t.attributes[k], `${t.name} ${k}`).toBeTruthy();
      }
    }
  });
});
