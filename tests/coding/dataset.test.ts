import { describe, expect, it } from 'vitest';
import { makeDataset, makeVariable } from '../../src/core/types';
import type { CodeDef, CodedSegment } from '../../src/core/coding-types';
import { applyCodeVariables, buildCodeVariables, codeVarStem, CODE_ATTR, COUNT_CODE, findExportedVariable, SOURCE_ATTR } from '../../src/lib/coding/toDataset';
import { exportSav, importFile } from '../../src/lib/io';
import { useStore } from '../../src/core/store';
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
  it('adds a theme variable that is 1 when the theme or any sub-code applies, without double counting', () => {
    const ds = dataset();
    const { docs } = buildResponseDocs(ds, 'v_ans', [], null, []);
    const codes: CodeDef[] = [
      { id: 't', name: 'Infrastructure', description: '', color: '#000', parentId: null, createdAt: 0 },
      { id: 'w', name: 'Water', description: '', color: '#000', parentId: 't', createdAt: 0 },
      { id: 'f', name: 'Flooding', description: '', color: '#000', parentId: 't', createdAt: 0 },
    ];
    const seg = (d: number, codeId: string): CodedSegment => ({ id: `${d}${codeId}`, docId: docs[d].id, codeId, start: 0, end: docs[d].text.length, coder: 'A', origin: 'manual', createdAt: 0 });
    const out = buildCodeVariables(ds, codes, docs, [seg(0, 'w'), seg(2, 'w'), seg(2, 'f')], ['t', 'w', 'f'], { countVariable: true, members: { t: ['t', 'w', 'f'] } });
    const [theme, water, flood, count] = out.plans;
    expect(theme.variable.label).toBe('Infrastructure (theme, incl. sub-codes)');
    expect(Array.from(theme.column)).toEqual([1, NaN, 0, 1, NaN]);
    expect(theme.nMentioned).toBe(2);
    expect(Array.from(water.column)).toEqual([1, NaN, 0, 1, NaN]);
    expect(Array.from(flood.column)).toEqual([0, NaN, 0, 1, NaN]);
    expect(Array.from(count.column)).toEqual([1, NaN, 0, 2, NaN]);
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

describe('exporting the same codes to the dataset again', () => {
  const codes: CodeDef[] = [
    { id: 'k1', name: 'Work', description: '', color: '#000', parentId: null, createdAt: 0 },
    { id: 'k2', name: 'Family & kin', description: '', color: '#000', parentId: null, createdAt: 0 },
  ];
  const setup = () => {
    const ds = dataset();
    const { docs } = buildResponseDocs(ds, 'v_ans', [], null, []);
    const seg = (d: number, codeId: string): CodedSegment => ({ id: `${d}${codeId}`, docId: docs[d].id, codeId, start: 0, end: docs[d].text.length, coder: 'A', origin: 'manual', createdAt: 0 });
    return { ds, docs, seg };
  };

  it('records the code and source question as variable attributes', () => {
    const { ds, docs, seg } = setup();
    const out = buildCodeVariables(ds, codes, docs, [seg(0, 'k1')], ['k1'], { sourceVarId: 'v_ans', countVariable: true });
    expect(out.previous).toEqual([]);
    expect(out.plans.every((p) => p.replaces === null)).toBe(true);
    expect(out.plans[0].variable.attributes).toEqual({ coding_code: 'Work', [CODE_ATTR]: 'k1', [SOURCE_ATTR]: 'v_ans' });
    expect(out.plans[1].variable.attributes).toEqual({ [CODE_ATTR]: COUNT_CODE, [SOURCE_ATTR]: 'v_ans' });
    // Without an explicit question, the only question among the linked responses is used.
    const implicit = buildCodeVariables(ds, codes, docs, [seg(0, 'k1')], ['k1'], {});
    expect(implicit.plans[0].variable.attributes?.[SOURCE_ATTR]).toBe('v_ans');
  });

  it('update mode overwrites the earlier variables in place, keeping names and edits', () => {
    const { ds, docs, seg } = setup();
    const first = buildCodeVariables(ds, codes, docs, [seg(0, 'k1')], ['k1'], { sourceVarId: 'v_ans', countVariable: true });
    let d1 = applyCodeVariables(ds, first.plans, 'v_ans');
    expect(d1.variables.map((v) => v.name)).toEqual(['resp_id', 'gender', 'q12_open', 'c_work_1', 'c_count', 'c_work']);
    const workId = first.plans[0].variable.id;
    // The user relabels the variable and moves it to the end before coding more and exporting again.
    d1 = { ...d1, variables: [...d1.variables.filter((v) => v.id !== workId), { ...d1.variables.find((v) => v.id === workId)!, label: 'Mentions work (recoded)' }] };
    expect(findExportedVariable(d1, 'k1', 'v_ans')?.id).toBe(workId);
    expect(findExportedVariable(d1, 'k1', 'v_other')).toBeUndefined();

    const second = buildCodeVariables(d1, codes, docs, [seg(0, 'k1'), seg(2, 'k1'), seg(2, 'k2')], ['k1', 'k2'], { sourceVarId: 'v_ans', countVariable: true, mode: 'update' });
    expect(second.previous.map((v) => v.name)).toEqual(['c_work_1', 'c_count']);
    expect(second.plans.map((p) => [p.variable.name, p.replaces !== null])).toEqual([['c_work_1', true], ['c_family_kin', false], ['c_count', true]]);
    const d2 = applyCodeVariables(d1, second.plans, 'v_ans');
    expect(d2.variables.map((v) => v.name)).toEqual(['resp_id', 'gender', 'q12_open', 'c_family_kin', 'c_count', 'c_work', 'c_work_1']);
    const work = d2.variables.find((v) => v.id === workId)!;
    expect(work.label).toBe('Mentions work (recoded)');
    expect(Array.from(d2.columns[workId] as Float64Array)).toEqual([1, NaN, 0, 1, NaN]);
    const countVar = d2.variables.find((v) => v.name === 'c_count')!;
    expect(countVar.id).toBe(first.plans[1].variable.id);
    expect(Array.from(d2.columns[countVar.id] as Float64Array)).toEqual([1, NaN, 0, 2, NaN]);
    expect(d2.variables.filter((v) => /^c_work_\d$/.test(v.name))).toHaveLength(1);
  });

  it('new mode creates suffixed copies and leaves the earlier variables alone', () => {
    const { ds, docs, seg } = setup();
    const first = buildCodeVariables(ds, codes, docs, [seg(0, 'k1')], ['k1'], { sourceVarId: 'v_ans' });
    const d1 = applyCodeVariables(ds, first.plans, 'v_ans');
    const again = buildCodeVariables(d1, codes, docs, [seg(0, 'k1'), seg(2, 'k1')], ['k1'], { sourceVarId: 'v_ans', mode: 'new' });
    expect(again.previous.map((v) => v.name)).toEqual(['c_work_1']);
    expect(again.plans[0].replaces).toBeNull();
    expect(again.plans[0].variable.name).toBe('c_work_2');
    const d2 = applyCodeVariables(d1, again.plans, 'v_ans');
    expect(Array.from(d2.columns[first.plans[0].variable.id] as Float64Array)).toEqual([1, NaN, 0, 0, NaN]);
    expect(Array.from(d2.columns[again.plans[0].variable.id] as Float64Array)).toEqual([1, NaN, 0, 1, NaN]);
  });

  it('updating is a single undo step in the store', () => {
    const { ds, docs, seg } = setup();
    const first = buildCodeVariables(ds, codes, docs, [seg(0, 'k1')], ['k1'], { sourceVarId: 'v_ans' });
    useStore.getState().setDataset(applyCodeVariables(ds, first.plans, 'v_ans'));
    const before = useStore.getState().dataset!;
    const second = buildCodeVariables(before, codes, docs, [seg(0, 'k1'), seg(1, 'k1'), seg(2, 'k2')], ['k1', 'k2'], { sourceVarId: 'v_ans', mode: 'update' });
    useStore.getState().mutateDataset((d) => applyCodeVariables(d, second.plans, 'v_ans'));
    const after = useStore.getState().dataset!;
    expect(after.variables).toHaveLength(before.variables.length + 1);
    expect(Array.from(after.columns[first.plans[0].variable.id] as Float64Array)).toEqual([1, NaN, 1, 0, NaN]);
    expect(useStore.getState().past).toHaveLength(1);
    useStore.getState().undo();
    expect(useStore.getState().dataset).toBe(before);
    useStore.getState().setDataset(null);
  });

  it('the origin attributes survive a .sav round trip', async () => {
    const { ds, docs, seg } = setup();
    const out = buildCodeVariables(ds, codes, docs, [seg(0, 'k1')], ['k1'], { sourceVarId: 'v_ans', countVariable: true });
    const back = (await importFile('x.sav', exportSav(applyCodeVariables(ds, out.plans, 'v_ans')))).dataset;
    const work = back.variables.find((v) => v.name === 'c_work_1')!;
    expect(work.attributes).toMatchObject({ [CODE_ATTR]: 'k1', [SOURCE_ATTR]: 'v_ans' });
    expect(back.variables.find((v) => v.name === 'c_count')!.attributes).toMatchObject({ [CODE_ATTR]: COUNT_CODE });
  });
});
