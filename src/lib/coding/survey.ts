// Open-ended survey answers (a string variable of the active dataset) -> response documents.

import type { TextDoc } from '../../core/coding-types';
import type { Dataset } from '../../core/types';
import { newId } from '../../core/types';
import { formatCell, isMissingValue, varDisplayName } from '../../core/data';

export interface ResponseImport {
  docs: TextDoc[];
  /** Cases with an empty or missing answer. */
  nEmpty: number;
  /** Answers already imported earlier (same variable and case). */
  nDuplicate: number;
}

/**
 * One TextDoc per non-empty answer: kind 'response', caseIndex + varId set, attributes from the chosen
 * variables (value labels where defined). The document name is the ID variable's value when given,
 * else "Case <n>".
 */
export function buildResponseDocs(ds: Dataset, varId: string, attrVarIds: string[], idVarId: string | null, existing: TextDoc[]): ResponseImport {
  const v = ds.variables.find((x) => x.id === varId);
  const col = ds.columns[varId];
  if (!v || !col || col instanceof Float64Array) throw new Error('Choose a string (text) variable with the open-ended answers.');
  const already = new Set(existing.filter((d) => d.kind === 'response' && d.varId === varId).map((d) => d.caseIndex));
  const attrVars = attrVarIds.map((id) => ds.variables.find((x) => x.id === id)).filter((x): x is NonNullable<typeof x> => !!x);
  const idVar = idVarId ? ds.variables.find((x) => x.id === idVarId) : undefined;
  const docs: TextDoc[] = [];
  let nEmpty = 0, nDuplicate = 0;
  const now = Date.now();
  for (let i = 0; i < ds.nCases; i++) {
    const raw = col[i] ?? '';
    const text = raw.trim();
    if (!text || isMissingValue(v, raw)) {
      nEmpty++;
      continue;
    }
    if (already.has(i)) {
      nDuplicate++;
      continue;
    }
    const attributes: Record<string, string> = {};
    for (const av of attrVars) {
      const x = ds.columns[av.id][i];
      if (isMissingValue(av, x)) continue;
      const s = formatCell(av, x, true).trim();
      if (s) attributes[attrName(av)] = s;
    }
    let name = `Case ${i + 1}`;
    if (idVar) {
      const x = ds.columns[idVar.id][i];
      const s = isMissingValue(idVar, x) ? '' : formatCell(idVar, x, false).trim();
      if (s) name = `${idVar.name} ${s}`;
    }
    docs.push({ id: newId('doc'), name, kind: 'response', text, caseIndex: i, varId, attributes, createdAt: now + i });
  }
  return { docs, nEmpty, nDuplicate };
}

/** Attribute key for a dataset variable: its name (short, stable in tables). */
export function attrName(v: { name: string }): string {
  return v.name;
}

export function questionLabel(ds: Dataset, varId: string): string {
  const v = ds.variables.find((x) => x.id === varId);
  return v ? varDisplayName(v, 'both') : '';
}
