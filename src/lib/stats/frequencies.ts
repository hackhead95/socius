// Frequency tables (SPSS FREQUENCIES): weighted counts of valid values, each user-missing code and
// system-missing, with percent, valid percent and cumulative percent.

export interface FreqRow {
  value: number | string;
  count: number;
  percent: number;
  validPercent: number;
  cumPercent: number;
}

export interface FreqMissingRow {
  /** the user-missing code, or null for system-missing */
  value: number | string | null;
  count: number;
  percent: number;
}

export interface FreqTable {
  valid: FreqRow[];
  missing: FreqMissingRow[];
  validTotal: number;
  missingTotal: number;
  total: number;
}

export interface FreqEntry {
  value: number | string;
  weight: number;
  /** 'valid', 'user' (user-missing) or 'system' (system-missing) */
  kind: 'valid' | 'user' | 'system';
}

function cmp(a: number | string, b: number | string): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

export function frequencyTable(entries: Iterable<FreqEntry>, order: 'ascending' | 'descending' | 'descendingCounts' | 'ascendingCounts' = 'ascending'): FreqTable {
  const valid = new Map<number | string, number>();
  const user = new Map<number | string, number>();
  let system = 0;
  let hasSystem = false;
  for (const e of entries) {
    if (!(e.weight > 0)) continue;
    const key = typeof e.value === 'string' ? e.value.trimEnd() : e.value;
    if (e.kind === 'valid') valid.set(key, (valid.get(key) ?? 0) + e.weight);
    else if (e.kind === 'user') user.set(key, (user.get(key) ?? 0) + e.weight);
    else {
      system += e.weight;
      hasSystem = true;
    }
  }
  const validTotal = [...valid.values()].reduce((a, b) => a + b, 0);
  const missingTotal = [...user.values()].reduce((a, b) => a + b, 0) + system;
  const total = validTotal + missingTotal;
  let keys = [...valid.keys()];
  if (order === 'ascending') keys.sort(cmp);
  else if (order === 'descending') keys.sort((a, b) => cmp(b, a));
  else if (order === 'descendingCounts') keys.sort((a, b) => valid.get(b)! - valid.get(a)! || cmp(a, b));
  else keys.sort((a, b) => valid.get(a)! - valid.get(b)! || cmp(a, b));
  let cum = 0;
  const rows: FreqRow[] = keys.map((k) => {
    const c = valid.get(k)!;
    cum += c;
    return { value: k, count: c, percent: (100 * c) / total, validPercent: (100 * c) / validTotal, cumPercent: (100 * cum) / validTotal };
  });
  keys = [...user.keys()].sort(cmp);
  const missing: FreqMissingRow[] = keys.map((k) => ({ value: k, count: user.get(k)!, percent: (100 * user.get(k)!) / total }));
  if (hasSystem) missing.push({ value: null, count: system, percent: (100 * system) / total });
  return { valid: rows, missing, validTotal, missingTotal, total };
}
