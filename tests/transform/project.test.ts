import { describe, expect, it } from 'vitest';
import { parseProject, serializeProject, projectFileName, ProjectError, float64ToBase64, base64ToFloat64 } from '../../src/features/project/projectFile';
import { emptyCodingProject } from '../../src/core/coding-types';
import { ds, col } from './helpers';

describe('project file', () => {
  const d = ds([
    { name: 'x', values: [1.5, null, -0, 1e300, 99], opts: { missing: { discrete: [99], range: { lo: -Infinity, hi: -5 } }, valueLabels: [{ value: 1.5, label: 'one and a half' }] } },
    { name: 's', values: ['a', '', 'ünï', 'x"y', 'z'] },
  ]);
  const withMeta = { ...d, weightVarId: d.variables[0].id, filterVarId: 'gone' };

  it('round-trips data exactly, including NaN, -0 and -Infinity', () => {
    const text = serializeProject({
      dataset: withMeta,
      outputs: [{ id: 'o1', procedure: 'x', title: 'T', createdAt: 1, blocks: [{ kind: 'table', table: { title: 't', header: [], rows: [[{ v: NaN, fmt: 'dec2' }]] } }] }],
      coding: { ...emptyCodingProject(), codes: [{ id: 'c', name: 'Trust', description: '', color: '#fff', parentId: null, createdAt: 1 }] },
      ui: { showValueLabels: false, tab: 'output' },
    });
    const p = parseProject(text);
    const x = col(p.dataset!, 'x') as number[];
    expect(x[0]).toBe(1.5);
    expect(x[1]).toBeNaN();
    expect(Object.is(x[2], -0)).toBe(true);
    expect(x[3]).toBe(1e300);
    expect(col(p.dataset!, 's')).toEqual(['a', '', 'ünï', 'x"y', 'z']);
    expect(p.dataset!.variables[0].missing.range).toEqual({ lo: -Infinity, hi: -5 });
    expect(p.dataset!.weightVarId).toBe(d.variables[0].id);
    expect(p.dataset!.filterVarId).toBeNull();
    const cellV = (p.outputs[0].blocks[0] as any).table.rows[0][0].v;
    expect(cellV).toBeNaN();
    expect(p.coding.codes[0].name).toBe('Trust');
    expect(p.ui).toEqual({ showValueLabels: false, tab: 'output' });
  });
  it('base64 helpers are exact', () => {
    const a = Float64Array.from([NaN, Infinity, -1.25, 0]);
    const b = base64ToFloat64(float64ToBase64(a), 4);
    expect(Array.from(b)).toEqual(Array.from(a));
    expect(() => base64ToFloat64(float64ToBase64(a), 3)).toThrow(ProjectError);
  });
  it('rejects non-projects with helpful messages', () => {
    expect(() => parseProject('not json')).toThrow(/not valid JSON/);
    expect(() => parseProject('{"a":1}')).toThrow(/not a Socius project/);
    expect(() => parseProject('{"format":"socius-project","version":99}')).toThrow(/newer version/);
    const text = serializeProject({ dataset: d, outputs: [], coding: emptyCodingProject(), ui: { showValueLabels: true, tab: 'data' } });
    const broken = JSON.parse(text);
    broken.dataset.nCases = 7;
    expect(() => parseProject(JSON.stringify(broken))).toThrow(/7 cases/);
    delete broken.dataset.columns[d.variables[1].id];
    broken.dataset.nCases = 5;
    expect(() => parseProject(JSON.stringify(broken))).toThrow(/data for variable s is missing/);
  });
  it('accepts a project without a dataset', () => {
    const p = parseProject(serializeProject({ dataset: null, outputs: [], coding: emptyCodingProject(), ui: { showValueLabels: true, tab: 'coding' } }));
    expect(p.dataset).toBeNull();
    expect(p.ui.tab).toBe('coding');
  });
  it('makes safe file names', () => {
    expect(projectFileName('My survey: wave 1')).toBe('My survey_ wave 1.socius.json');
    expect(projectFileName('x.socius.json')).toBe('x.socius.json');
    expect(projectFileName('')).toBe('project.socius.json');
  });
});
