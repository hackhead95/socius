// Codebook hierarchy helpers (themes > sub-codes).

import type { CodeDef } from '../../core/coding-types';

export interface CodeNode {
  code: CodeDef;
  depth: number;
  children: CodeNode[];
}

/** Build the code tree, keeping codebook order within each level. Orphans (missing parent) become top level. */
export function buildCodeTree(codes: CodeDef[]): CodeNode[] {
  const ids = new Set(codes.map((c) => c.id));
  const byParent = new Map<string | null, CodeDef[]>();
  for (const c of codes) {
    const p = c.parentId && ids.has(c.parentId) && c.parentId !== c.id ? c.parentId : null;
    const arr = byParent.get(p) ?? [];
    arr.push(c);
    byParent.set(p, arr);
  }
  const seen = new Set<string>();
  const build = (parent: string | null, depth: number): CodeNode[] =>
    (byParent.get(parent) ?? [])
      .filter((c) => !seen.has(c.id) && (seen.add(c.id), true))
      .map((c) => ({ code: c, depth, children: build(c.id, depth + 1) }));
  const roots = build(null, 0);
  // Codes caught in a parent cycle never get reached from the roots; show them at top level.
  for (const c of codes) if (!seen.has(c.id)) { seen.add(c.id); roots.push({ code: c, depth: 0, children: build(c.id, 1) }); }
  return roots;
}

/** Depth-first flattened order (what the codebook panel shows). */
export function flattenTree(nodes: CodeNode[], out: CodeNode[] = []): CodeNode[] {
  for (const n of nodes) {
    out.push(n);
    flattenTree(n.children, out);
  }
  return out;
}

/** Codes in display order. */
export function orderedCodes(codes: CodeDef[]): CodeDef[] {
  return flattenTree(buildCodeTree(codes)).map((n) => n.code);
}

/** Ids of all descendants of `id` (not including itself). */
export function descendantIds(codes: CodeDef[], id: string): string[] {
  const kids = new Map<string, string[]>();
  for (const c of codes) if (c.parentId) kids.set(c.parentId, [...(kids.get(c.parentId) ?? []), c.id]);
  const out: string[] = [];
  const seen = new Set<string>([id]);
  const stack = [...(kids.get(id) ?? [])];
  while (stack.length) {
    const k = stack.pop()!;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
    stack.push(...(kids.get(k) ?? []));
  }
  return out;
}

/** True if `codeId` may be moved under `newParentId` (no self-parenting, no cycles). */
export function canReparent(codes: CodeDef[], codeId: string, newParentId: string | null): boolean {
  if (newParentId === null) return true;
  if (newParentId === codeId) return false;
  return !descendantIds(codes, codeId).includes(newParentId);
}

/** "Theme > Sub-code" path label. */
export function codePath(codes: CodeDef[], id: string): string {
  const byId = new Map(codes.map((c) => [c.id, c]));
  const parts: string[] = [];
  let cur = byId.get(id);
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    parts.unshift(cur.name);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return parts.join(' > ');
}

/** Name of the parent code, or ''. */
export function parentName(codes: CodeDef[], id: string): string {
  const c = codes.find((x) => x.id === id);
  if (!c?.parentId) return '';
  return codes.find((x) => x.id === c.parentId)?.name ?? '';
}
