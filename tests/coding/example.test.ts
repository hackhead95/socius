// The Text coding worked example built from the bundled sample survey.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { importFile } from '../../src/lib/io';
import { SAMPLE_SURVEY_FILE } from '../../src/samples';
import type { Dataset } from '../../src/core/types';
import { parseRules } from '../../src/lib/coding/rules';
import { buildWorkedExample, canBuildWorkedExample, EXAMPLE_ATTRIBUTES } from '../../src/lib/coding/example';

const SAV = fileURLToPath(new URL('../../src/samples/urban_trust_survey.sav', import.meta.url));
let ds: Dataset;

beforeAll(async () => {
  const { dataset } = await importFile(SAMPLE_SURVEY_FILE, new Uint8Array(readFileSync(SAV)));
  ds = { ...dataset, source: { ...dataset.source, kind: 'sample', fileName: SAMPLE_SURVEY_FILE } };
});

describe('worked example for the sample survey', () => {
  it('is offered only for the bundled sample', () => {
    expect(canBuildWorkedExample(ds)).toBe(true);
    expect(canBuildWorkedExample({ ...ds, source: { kind: 'sav', fileName: 'mine.sav' } })).toBe(false);
    expect(canBuildWorkedExample(null)).toBe(false);
  });

  it('imports every non-empty q_challenge answer with gender, city and area', () => {
    const ex = buildWorkedExample(ds, 'Coder 1');
    expect(ex.docs).toHaveLength(630);
    expect(ex.docs.every((d) => d.kind === 'response' && d.text.trim().length > 0)).toBe(true);
    const withAll = ex.docs.filter((d) => EXAMPLE_ATTRIBUTES.every((a) => d.attributes?.[a]));
    expect(withAll.length).toBeGreaterThan(600);
    expect(new Set(ex.docs.map((d) => d.attributes?.city))).toEqual(new Set(['Kolkata', 'Delhi', 'Mumbai', 'Bengaluru', 'Chennai']));
  });

  it('creates about ten codes under a few themes, with descriptions and valid rules', () => {
    const { codes } = buildWorkedExample(ds, 'Coder 1');
    const themes = codes.filter((c) => c.parentId === null);
    const leaves = codes.filter((c) => c.parentId !== null);
    expect(themes.length).toBeGreaterThanOrEqual(2);
    expect(themes.length).toBeLessThanOrEqual(4);
    expect(leaves.length).toBeGreaterThanOrEqual(9);
    expect(leaves.length).toBeLessThanOrEqual(12);
    for (const c of leaves) {
      expect(themes.some((t) => t.id === c.parentId), c.name).toBe(true);
      expect(c.description.length, c.name).toBeGreaterThan(20);
      const rules = parseRules(c.rules);
      expect(rules.length, c.name).toBeGreaterThan(3);
      for (const r of rules) expect(r.error, `${c.name}: ${r.source}`).toBeUndefined();
    }
    expect(new Set(leaves.map((c) => c.color)).size).toBe(leaves.length);
    expect(new Set(codes.map((c) => c.name)).size).toBe(codes.length);
  });

  it('auto-codes most answers, each code at least a few times, as whole-response rule coding', () => {
    const ex = buildWorkedExample(ds, 'Coder 1');
    const coded = new Set(ex.segments.map((s) => s.docId));
    expect(ex.nCoded).toBe(coded.size);
    expect(coded.size / ex.docs.length).toBeGreaterThan(0.6);
    const docs = new Map(ex.docs.map((d) => [d.id, d]));
    for (const s of ex.segments) {
      expect(s.origin).toBe('auto-rule');
      expect(s.coder).toBe('Coder 1');
      expect(s.start).toBe(0);
      expect(s.end).toBe(docs.get(s.docId)!.text.length);
    }
    for (const c of ex.codes.filter((x) => x.parentId)) expect(ex.segments.filter((s) => s.codeId === c.id).length, c.name).toBeGreaterThanOrEqual(10);
    // Non-answers stay uncoded.
    const dontKnow = ex.docs.filter((d) => /^(don't know|na|cannot say|nothing)$/i.test(d.text));
    expect(dontKnow.length).toBeGreaterThan(20);
    expect(dontKnow.some((d) => coded.has(d.id))).toBe(false);
  });

  it('codes the multilingual answers too', () => {
    const ex = buildWorkedExample(ds, 'Coder 1');
    const byName = new Map(ex.codes.map((c) => [c.name, c.id]));
    const codesOf = (text: string) => {
      const d = ex.docs.find((x) => x.text === text);
      expect(d, text).toBeTruthy();
      return ex.segments.filter((s) => s.docId === d!.id).map((s) => ex.codes.find((c) => c.id === s.codeId)!.name);
    };
    expect(codesOf('বর্ষায় রাস্তায় জল জমে যায়, অফিস যেতে খুব অসুবিধা হয়।')).toContain('Drainage and flooding');
    expect(codesOf('पानी की बहुत दिक्कत है, टैंकर पर निर्भर रहना पड़ता है।')).toContain('Water supply');
    expect(codesOf('Kiraya har saal badh jaata hai, salary utni nahi badhti.')).toContain('Rent and housing');
    expect(codesOf('Local log outsider bolke alag treat karte hai')).toContain('Newcomers and old residents');
    expect(codesOf('noise pollution')).toEqual(['Noise']);
    expect(byName.size).toBe(ex.codes.length);
  });

  it('explains itself in a memo and does not import the same answers twice', () => {
    const ex = buildWorkedExample(ds, 'Coder 1');
    expect(ex.memo.title).toMatch(/example/i);
    expect(ex.memo.text).toMatch(/keyword rules/);
    expect(ex.memo.text).toMatch(/review/);
    expect(ex.memo.text).not.toMatch(/\u2014/);
    const again = buildWorkedExample(ds, 'Coder 1', { codes: [], docs: ex.docs, segments: [], memos: [], coders: ['Coder 1'], activeCoder: 'Coder 1' });
    expect(again.docs).toHaveLength(0);
  });
});
