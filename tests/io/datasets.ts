// Datasets shared by the SPSS writer tests.
import { makeDataset, makeVariable } from '../../src/core/types';
import type { Dataset, Variable } from '../../src/core/types';

export const BN = 'আমি বাংলায় কথা বলি';

function numVar(name: string, extra: Partial<Variable> = {}): Variable {
  return makeVariable({ name, type: 'numeric', ...extra });
}
function strVar(name: string, width: number, extra: Partial<Variable> = {}): Variable {
  return makeVariable({ name, type: 'string', width, format: `A${width}`, ...extra });
}

/** A dataset exercising every dictionary feature the writer supports. */
export function edgeDataset(): Dataset {
  const long600 = 'x' + 'অ'.repeat(199); // 598 bytes, characters straddle segment boundaries
  const vars: Array<[Variable, Float64Array | string[]]> = [
    [numVar('id', { format: 'F4.0', width: 4, decimals: 0, measure: 'scale', label: 'Respondent ID' }), Float64Array.from([1, 2, 3, 4, 5])],
    [
      numVar('gender', {
        format: 'F1.0', width: 1, decimals: 0, measure: 'nominal', label: 'Gender',
        valueLabels: [{ value: 1, label: 'Male' }, { value: 2, label: 'Female' }, { value: 9, label: 'No answer' }],
        missing: { discrete: [9] },
      }),
      Float64Array.from([1, 2, 9, NaN, 2]),
    ],
    [
      numVar('likert', {
        format: 'F8.2', width: 8, decimals: 2, measure: 'ordinal',
        valueLabels: [{ value: 1, label: 'Strongly disagree' }, { value: 5, label: 'Strongly agree' }, { value: -1, label: 'Refused' }],
        missing: { discrete: [-1], range: { lo: 8, hi: 9 } },
      }),
      Float64Array.from([1, 5, 8.5, -1, 3]),
    ],
    [numVar('income', { format: 'DOLLAR12.2', width: 12, decimals: 2, missing: { discrete: [], range: { lo: -Infinity, hi: 0 } }, columns: 14 }), Float64Array.from([52000.5, -3, 0, 1e15, NaN])],
    [numVar('hi_missing', { missing: { discrete: [], range: { lo: 100, hi: Infinity } } }), Float64Array.from([1, 100, 1e300, -1e300, 0.1])],
    [numVar('bytecode_edges', { format: 'F10.3', width: 10, decimals: 3 }), Float64Array.from([-99, 151, -100, 152, -0])],
    [numVar('a_very_long_variable_name_number_one'), Float64Array.from([1, 2, 3, 4, 5])],
    [numVar('a_very_long_variable_name_number_two'), Float64Array.from([5, 4, 3, 2, 1])],
    [numVar('বয়স', { label: 'বয়স (বছর)', valueLabels: [{ value: 23, label: 'তেইশ' }] }), Float64Array.from([23, 35, 41, 19, 60])],
    [numVar('when', { format: 'DATE11', width: 11, decimals: 0, label: 'Interview date' }), Float64Array.from([13797302400, 13165977600, NaN, 86400, 0])],
    [numVar('stamp', { format: 'DATETIME20', width: 20, decimals: 0 }), Float64Array.from([13797313445, NaN, 12219379200, 0, 1])],
    [numVar('dur', { format: 'TIME8', width: 8, decimals: 0 }), Float64Array.from([3723, NaN, 86399, 0, 60])],
    [numVar('pct', { format: 'PCT6.1', width: 6, decimals: 1, align: 'center' }), Float64Array.from([12.5, 50, 100, NaN, 0])],
    [numVar('wt', { label: 'Case weight' }), Float64Array.from([1, 2.5, 0.5, 1, 1])],
    [strVar('s1', 1, { valueLabels: [{ value: 'a', label: 'Letter A' }], missing: { discrete: ['z'] } }), ['a', 'b', '', 'z', ' ']],
    [strVar('s8', 8, { missing: { discrete: ['n/a', 'refused', 'dk'] } }), ['abcdefgh', '12345678', 'é', '', 'n/a']],
    [
      strVar('s9', 9, { valueLabels: [{ value: 'abcdefghi', label: 'All nine' }, { value: 'x', label: 'Ex' }], missing: { discrete: ['x', 'yy'] } }),
      ['abcdefghi', '123456789', 'x', '', 'ü'],
    ],
    [strVar('s255', 255), ['s'.repeat(255), 'mid', '', 'end', 'ॐ']],
    [strVar('s256', 256, { valueLabels: [{ value: 'long key', label: 'Long string label' }] }), ['t'.repeat(256), 'long key', '', 'e', 'z']],
    [strVar('s600', 600, { label: 'Very long string' }), ['A'.repeat(255) + 'B'.repeat(255) + 'C'.repeat(90), 'short', '', long600, 'q']],
    [strVar('s510', 510), ['u'.repeat(510), 'ab', '', 'x'.repeat(509) + 'y', '']],
    [strVar('s1000', 1000), ['অআ'.repeat(166) + 'z', 'é'.repeat(500), 'a', '', 'end']],
    [
      strVar('text_bn', 60, { label: 'Open answer', columns: 30, measure: 'nominal', role: 'target', attributes: { Question: 'Q7 (open)', 'Note[1]': 'first', 'Note[2]': 'second' } }),
      [BN, 'नमस्ते दुनिया', 'Crème brûlée, Łódź', 'Happy 😀 👍🏽 family 👨‍👩‍👧', ''],
    ],
  ];
  const variables = vars.map(([v]) => v);
  const columns = Object.fromEntries(vars.map(([v, c]) => [v.id, c]));
  return makeDataset({
    name: 'edge',
    fileLabel: 'Edge cases: বাংলা',
    variables,
    columns,
    nCases: 5,
    weightVarId: variables.find((v) => v.name === 'wt')!.id,
    documents: ['First document line.', 'Unicode line: ' + BN, 'x'.repeat(100)],
  });
}

export function emptyDataset(): Dataset {
  const d = edgeDataset();
  const columns = Object.fromEntries(d.variables.map((v) => [v.id, v.type === 'string' ? [] : new Float64Array(0)]));
  return { ...d, columns, nCases: 0 };
}

/** Document lines after the writer wraps them at 80 bytes. */
export const EXPECTED_DOCS = ['First document line.', 'Unicode line: ' + BN, 'x'.repeat(80), 'x'.repeat(20)];
