import { describe, expect, it } from 'vitest';
import { makeDataset, makeVariable } from '../../src/core/types';
import type { CodeDef, CodedSegment } from '../../src/core/coding-types';
import { buildCodeVariables, codeVarStem } from '../../src/lib/coding/toDataset';
import { buildResponseDocs } from '../../src/lib/coding/survey';

function dataset() {
  const ans = makeVariable({ id: 'v_ans', name: 'q12_open', type: 'string', width: 200, label: 'Why did you move?' });
  const gender = makeVariable({ id: 'v_g', name: 'gender', valueLabels: [{ value: 1, label: 'Man' }, { value: 2, label: 'Woman' }], missing: { discrete: [9] } });
  const id = makeVariable({ id: 'v_id', name: 'resp_id', decimals: 0 });
  const existing = makeVariable({ id: 'v_c', name: 'c_work' });
  return makeDataset({
    name: 'survey',
    variables: [id, gender, ans, existing],
    nCases: 5,
    columns: {
      v_id: Float64Array.from([101, 102, 103, 104, 105]),
      v_g: Float64Array.from([1, 2, 9, 2, NaN]),
      v_ans: ['For work ', '', 'Family reasons', 'work and family', '   '],
      v_c: new Float64Array(5),
    },
  });
}

describe('open-ended answers to response documents', () => {
  it('creates one response per non-empty answer with labelled attributes', () => {
    const ds = dataset();
    const r = buildResponseDocs(ds, 'v_ans', ['v_g'], 'v_id', []);
    expect(r.docs.map((d) => [d.name, d.text, d.caseIndex, d.attributes])).toEqual([
      ['resp_id 101', 'For work', 0, { gender: 'Man' }],
      ['resp_id 103', 'Family reasons', 2, {}],
      ['resp_id 104', 'work and family', 3, { gender: 'Woman' }],
    ]);
    expect(r.nEmpty).toBe(2);
    expect(r.docs.every((d) => d.kind === 'response' && d.varId === 'v_ans')).toBe(true);
    const again = buildResponseDocs(ds, 'v_ans', [], null, r.docs);
    expect(again.docs).toHaveLength(0);
    expect(again.nDuplicate).toBe(3);
  });
  it('rejects numeric variables', () => {
    expect(() => buildResponseDocs(dataset(), 'v_g', [], null, [])).toThrow(/string/);
  });
});

describe('export codes to dataset', () => {
  it('builds 0/1 variables with sysmis for no answer, unique names and a count variable', () => {
    const ds = dataset();
    const { docs } = buildResponseDocs(ds, 'v_ans', [], null, []);
    const codes: CodeDef[] = [
      { id: 'k1', name: 'Work', description: '', color: '#000', parentId: null, createdAt: 0 },
      { id: 'k2', name: 'Family & kin', description: '', color: '#000', parentId: null, createdAt: 0 },
    ];
    const seg = (d: number, codeId: string, coder = 'A'): CodedSegment => ({ id: `${d}${codeId}${coder}`, docId: docs[d].id, codeId, start: 0, end: docs[d].text.length, coder, origin: 'manual', createdAt: 0 });
    const segments = [seg(0, 'k1'), seg(2, 'k1'), seg(2, 'k2'), seg(1, 'k2'), seg(1, 'k1', 'B')];
    const out = buildCodeVariables(ds, codes, docs, segments, ['k1', 'k2'], { countVariable: true, coder: 'A' });
    expect(out.nLinked).toBe(3);
    expect(out.plans.map((p) => p.variable.name)).toEqual(['c_work_1', 'c_family_kin', 'c_count']);
    const [work, fam, count] = out.plans;
    expect(Array.from(work.column)).toEqual([1, NaN, 0, 1, NaN]);
    expect(Array.from(fam.column)).toEqual([0, NaN, 1, 1, NaN]);
    expect(Array.from(count.column)).toEqual([1, NaN, 1, 2, NaN]);
    expect(work.variable).toMatchObject({ label: 'Work', measure: 'nominal', type: 'numeric', decimals: 0 });
    expect(work.variable.valueLabels).toEqual([{ value: 0, label: 'Not mentioned' }, { value: 1, label: 'Mentioned' }]);
  });
  it('skips responses whose case no longer matches', () => {
    const ds = dataset();
    const { docs } = buildResponseDocs(ds, 'v_ans', [], null, []);
    const changed = { ...ds, columns: { ...ds.columns, v_ans: ['Something else', '', 'Family reasons', 'work and family', ''] } };
    const out = buildCodeVariables(changed, [], docs, [], [], {});
    expect(out.nMismatched).toBe(1);
    expect(out.nLinked).toBe(2);
  });
  it('makes readable stems', () => {
    expect(codeVarStem('Café / discrimination at work')).toBe('c_cafe_discrimination_at');
  });
});
