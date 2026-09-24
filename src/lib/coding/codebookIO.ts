// Codebook import/export as JSON and CSV. Hierarchy is kept via parent names (CSV) or ids (JSON).

import type { CodeDef } from '../../core/coding-types';
import { newId } from '../../core/types';
import { orderedCodes, parentName } from './tree';
import { nextCodeColor, normaliseHex } from './palette';
import { parseCsv, toCsv } from './importers';

export const CODEBOOK_CSV_COLUMNS = ['name', 'parent', 'description', 'inclusion', 'exclusion', 'example', 'color', 'rules'] as const;

export function codebookToCsv(codes: CodeDef[]): string {
  const rows: string[][] = [[...CODEBOOK_CSV_COLUMNS]];
  for (const c of orderedCodes(codes)) {
    rows.push([c.name, parentName(codes, c.id), c.description, c.inclusion ?? '', c.exclusion ?? '', c.example ?? '', c.color, (c.rules ?? []).join('\n')]);
  }
  return toCsv(rows);
}

export function codebookToJson(codes: CodeDef[]): string {
  return JSON.stringify(
    {
      format: 'socius-codebook',
      version: 1,
      codes: orderedCodes(codes).map((c) => ({
        id: c.id,
        name: c.name,
        parent: parentName(codes, c.id) || null,
        parentId: c.parentId,
        description: c.description,
        inclusion: c.inclusion ?? '',
        exclusion: c.exclusion ?? '',
        example: c.example ?? '',
        color: c.color,
        rules: c.rules ?? [],
      })),
    },
    null,
    2,
  );
}

interface RawCode {
  name: string;
  parent?: string;
  description?: string;
  inclusion?: string;
  exclusion?: string;
  example?: string;
  color?: string;
  rules?: string[];
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v);
}

/** Parse a codebook JSON (Socius format, or a plain array of {name, description, parent...}). */
export function parseCodebookJson(text: string): RawCode[] {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('This file is not valid JSON.');
  }
  const arr: any[] = Array.isArray(data) ? data : Array.isArray(data?.codes) ? data.codes : null;
  if (!arr) throw new Error('No list of codes found. Expected an array or an object with a "codes" array.');
  const byId = new Map<string, string>();
  for (const c of arr) if (c && typeof c === 'object' && c.id && c.name) byId.set(String(c.id), String(c.name));
  return arr
    .filter((c) => c && typeof c === 'object' && str(c.name).trim())
    .map((c) => ({
      name: str(c.name).trim(),
      parent: str(c.parent ?? (c.parentId ? byId.get(String(c.parentId)) : '')).trim() || undefined,
      description: str(c.description ?? c.definition),
      inclusion: str(c.inclusion),
      exclusion: str(c.exclusion),
      example: str(c.example),
      color: str(c.color),
      rules: Array.isArray(c.rules) ? c.rules.map(str).filter(Boolean) : str(c.rules).split('\n').map((r) => r.trim()).filter(Boolean),
    }));
}

/** Parse a codebook CSV with a header row (name required; parent, description... optional). */
export function parseCodebookCsv(text: string): RawCode[] {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error('The CSV needs a header row and at least one code.');
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (...names: string[]) => header.findIndex((h) => names.includes(h));
  const iName = col('name', 'code', 'code name');
  if (iName < 0) throw new Error('The CSV needs a "name" column.');
  const iParent = col('parent', 'theme', 'parent code');
  const iDesc = col('description', 'definition');
  const iInc = col('inclusion', 'include', 'inclusion criteria');
  const iExc = col('exclusion', 'exclude', 'exclusion criteria');
  const iEx = col('example', 'example quote');
  const iColor = col('color', 'colour');
  const iRules = col('rules', 'keywords');
  const g = (r: string[], i: number) => (i >= 0 ? (r[i] ?? '').trim() : '');
  return rows
    .slice(1)
    .filter((r) => g(r, iName))
    .map((r) => ({
      name: g(r, iName),
      parent: g(r, iParent) || undefined,
      description: g(r, iDesc),
      inclusion: g(r, iInc),
      exclusion: g(r, iExc),
      example: g(r, iEx),
      color: g(r, iColor),
      rules: g(r, iRules).split(/\n|;/).map((x) => x.trim()).filter(Boolean),
    }));
}

/**
 * Merge imported codes into an existing codebook. Codes whose name (case-insensitive, same parent)
 * already exists are updated only where the existing field is empty; new codes are appended.
 */
export function mergeCodebook(existing: CodeDef[], incoming: RawCode[]): { codes: CodeDef[]; added: number; updated: number } {
  const codes = existing.map((c) => ({ ...c }));
  const key = (name: string) => name.trim().toLowerCase();
  let added = 0, updated = 0;
  const findByName = (name: string) => codes.find((c) => key(c.name) === key(name));
  // Parents first: create any parent names that are not codes yet.
  const ensure = (name: string): CodeDef => {
    const found = findByName(name);
    if (found) return found;
    const c: CodeDef = { id: newId('code'), name: name.trim(), description: '', color: nextCodeColor(codes.map((x) => x.color)), parentId: null, createdAt: Date.now() };
    codes.push(c);
    added++;
    return c;
  };
  for (const r of incoming) {
    const parent = r.parent && key(r.parent) !== key(r.name) ? ensure(r.parent) : null;
    const found = findByName(r.name);
    const color = normaliseHex(r.color ?? '') ?? undefined;
    if (found) {
      let changed = false;
      const fill = (k: 'description' | 'inclusion' | 'exclusion' | 'example', v?: string) => {
        if (v && !found[k]) {
          found[k] = v;
          changed = true;
        }
      };
      fill('description', r.description);
      fill('inclusion', r.inclusion);
      fill('exclusion', r.exclusion);
      fill('example', r.example);
      if (r.rules?.length && !found.rules?.length) {
        found.rules = r.rules;
        changed = true;
      }
      if (parent && !found.parentId && parent.id !== found.id) {
        found.parentId = parent.id;
        changed = true;
      }
      if (changed) updated++;
    } else {
      codes.push({
        id: newId('code'),
        name: r.name.trim(),
        description: r.description ?? '',
        inclusion: r.inclusion || undefined,
        exclusion: r.exclusion || undefined,
        example: r.example || undefined,
        rules: r.rules?.length ? r.rules : undefined,
        color: color ?? nextCodeColor(codes.map((x) => x.color)),
        parentId: parent?.id ?? null,
        createdAt: Date.now(),
      });
      added++;
    }
  }
  return { codes, added, updated };
}
