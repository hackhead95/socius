import { makeDataset, makeVariable, type Dataset, type Variable } from '../../src/core/types';

export type ColSpec = { name: string; values: Array<number | string | null>; opts?: Partial<Variable> };

/** Build a dataset from plain arrays. null -> system-missing (numeric) or '' (string). */
export function ds(cols: ColSpec[], name = 'test'): Dataset {
  const n = cols.length ? cols[0].values.length : 0;
  const variables: Variable[] = [];
  const columns: Dataset['columns'] = {};
  for (const c of cols) {
    const isStr = c.opts?.type === 'string' || c.values.some((x) => typeof x === 'string');
    const v = makeVariable({ name: c.name, type: isStr ? 'string' : 'numeric', ...(c.opts ?? {}) });
    variables.push(v);
    columns[v.id] = isStr ? c.values.map((x) => (x === null ? '' : String(x))) : Float64Array.from(c.values.map((x) => (x === null ? NaN : Number(x))));
  }
  return makeDataset({ name, variables, columns, nCases: n });
}

export function col(d: Dataset, name: string): Array<number | string> {
  const v = d.variables.find((x) => x.name.toLowerCase() === name.toLowerCase());
  if (!v) throw new Error('no var ' + name);
  return Array.from(d.columns[v.id] as ArrayLike<number | string>);
}

export function vid(d: Dataset, name: string): string {
  return d.variables.find((x) => x.name.toLowerCase() === name.toLowerCase())!.id;
}
