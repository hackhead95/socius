// Synthetic survey Dataset for procedure tests: value labels, user-missing codes, a weight variable
// and a filter variable, built from the oracle's sociology-like data.
import { makeDataset, makeVariable, type Dataset, type Variable } from '../../src/core/types';
import { socio } from './helpers';

export interface BuildOpts {
  weighted?: boolean;
  filtered?: boolean;
  /** Inject user-missing codes (99) into trust, likert and r2 for a few cases. */
  userMissing?: boolean;
}

export function buildSurvey(opts: BuildOpts = {}): Dataset {
  const n = socio.educ.length;
  const vars: Variable[] = [];
  const columns: Record<string, Float64Array | string[]> = {};
  const add = (name: string, values: ArrayLike<number>, partial: Partial<Variable> = {}) => {
    const v = makeVariable({ id: `v_${name}`, name, ...partial });
    vars.push(v);
    columns[v.id] = Float64Array.from(values);
    return v;
  };
  const trust = socio.trust.slice();
  const likert = socio.likert.slice();
  const r2 = socio.r2.slice();
  if (opts.userMissing) {
    for (const i of [3, 17, 40]) trust[i] = 99;
    for (const i of [5, 60]) likert[i] = 99;
    r2[8] = 99;
    trust[11] = NaN; // system-missing too
  }
  add('educ', socio.educ, { label: 'Years of education', decimals: 0 });
  add('age', socio.age, { label: 'Age in years', decimals: 0 });
  add('female', socio.female, { label: 'Female', measure: 'nominal', decimals: 0, valueLabels: [{ value: 0, label: 'Male' }, { value: 1, label: 'Female' }] });
  add('income', socio.income, { label: 'Monthly income (thousands)', decimals: 1 });
  add('educ_cat', socio.educ_cat, {
    label: 'Highest qualification',
    measure: 'ordinal',
    decimals: 0,
    valueLabels: [
      { value: 1, label: 'Primary' },
      { value: 2, label: 'Secondary' },
      { value: 3, label: 'Vocational' },
      { value: 4, label: 'Graduate' },
    ],
  });
  add('region', socio.region, { label: 'Region', measure: 'nominal', decimals: 0, valueLabels: [{ value: 1, label: 'North' }, { value: 2, label: 'Centre' }, { value: 3, label: 'South' }] });
  add('noise', socio.noise, { label: 'Random noise', decimals: 3 });
  add('trust', trust, { label: 'Generalised trust score', missing: { discrete: [99] } });
  add('voted', socio.voted, { label: 'Voted in last election', measure: 'nominal', decimals: 0, valueLabels: [{ value: 0, label: 'Did not vote' }, { value: 1, label: 'Voted' }] });
  add('likert', likert, {
    label: 'Satisfaction with democracy',
    measure: 'ordinal',
    decimals: 0,
    missing: { discrete: [99] },
    valueLabels: [
      { value: 1, label: 'Very dissatisfied' },
      { value: 2, label: 'Dissatisfied' },
      { value: 3, label: 'Neutral' },
      { value: 4, label: 'Satisfied' },
      { value: 5, label: 'Very satisfied' },
    ],
  });
  add('party', socio.party, { label: 'Party preference', measure: 'nominal', decimals: 0, valueLabels: [{ value: 1, label: 'Left' }, { value: 2, label: 'Centre' }, { value: 3, label: 'Right' }] });
  add('wt', socio.wt, { label: 'Design weight', decimals: 0 });
  const agree = [
    { value: 1, label: 'Strongly disagree' },
    { value: 2, label: 'Disagree' },
    { value: 3, label: 'Neither' },
    { value: 4, label: 'Agree' },
    { value: 5, label: 'Strongly agree' },
  ];
  for (const nm of ['r1', 'r2', 'r3', 'r4', 's1', 's2', 's3', 's4']) {
    add(nm, nm === 'r2' ? r2 : socio[nm], { label: `Item ${nm}`, measure: 'ordinal', decimals: 0, valueLabels: agree, missing: { discrete: [99] } });
  }
  const filter = Float64Array.from({ length: n }, (_, i) => (i % 10 === 0 ? 0 : 1));
  add('in_sample', filter, { label: 'Selected cases', decimals: 0 });
  // A string variable for categorical handling.
  const sv = makeVariable({ id: 'v_sector', name: 'sector', type: 'string', width: 8, label: 'Employment sector' });
  vars.push(sv);
  columns[sv.id] = Array.from({ length: n }, (_, i) => (['public', 'private', 'none'] as const)[i % 3]);
  return makeDataset({
    name: 'survey',
    variables: vars,
    columns,
    nCases: n,
    weightVarId: opts.weighted ? 'v_wt' : null,
    filterVarId: opts.filtered ? 'v_in_sample' : null,
  });
}
