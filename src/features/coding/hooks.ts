// Shared selectors and helpers for the coding UI.

import { useMemo } from 'react';
import { useStore } from '../../core/store';
import type { CodeDef, CodedSegment } from '../../core/coding-types';
import { indexByDoc } from '../../lib/coding/segments';
import { buildCodeTree, flattenTree, type CodeNode } from '../../lib/coding/tree';
import { saveFile } from '../../platform/host';
import { toCsv } from '../../lib/coding/importers';
import { useCodingUi } from './uiStore';

/** Segments shown in the UI: all coders, or only the active coder when "show all" is off. */
export function useVisibleSegments(): CodedSegment[] {
  const segments = useStore((s) => s.coding.segments);
  const active = useStore((s) => s.coding.activeCoder);
  const showAll = useCodingUi((s) => s.showAllCoders);
  return useMemo(() => (showAll ? segments : segments.filter((s) => s.coder === active)), [segments, active, showAll]);
}

export function useSegmentIndex(): Map<string, CodedSegment[]> {
  const segs = useVisibleSegments();
  return useMemo(() => indexByDoc(segs), [segs]);
}

export function useCodeMap(): Map<string, CodeDef> {
  const codes = useStore((s) => s.coding.codes);
  return useMemo(() => new Map(codes.map((c) => [c.id, c])), [codes]);
}

export function useOrderedCodes(): CodeNode[] {
  const codes = useStore((s) => s.coding.codes);
  return useMemo(() => flattenTree(buildCodeTree(codes)), [codes]);
}

/** Codes bound to number keys 1-9 in the responses view: the first nine codes in codebook order. */
export function useQuickKeyCodes(): CodeDef[] {
  const nodes = useOrderedCodes();
  return useMemo(() => nodes.slice(0, 9).map((n) => n.code), [nodes]);
}

/** Translucent highlighter fill derived from a code colour (strength from the theme's --cw-hl). */
export function fillOf(color: string, strength = 'var(--cw-hl)'): string {
  return `color-mix(in srgb, ${color} ${strength}, transparent)`;
}

export function toast(text: string, tone: 'info' | 'success' | 'warning' | 'error' = 'info') {
  useStore.getState().toast(text, tone);
}

/** Save a file and report the outcome in a toast. */
export async function saveAndReport(filename: string, data: Blob | Uint8Array | string, mime: string): Promise<void> {
  const r = await saveFile(filename, data, mime);
  if (r === 'saved') toast(`Saved ${filename}`, 'success');
  else if (r === 'declined') toast('Download cancelled.', 'info');
  else toast(`Could not save ${filename}. Try again, or copy the content instead.`, 'error');
}

export async function saveCsv(filename: string, header: string[], rows: Array<Array<string | number>>): Promise<void> {
  await saveAndReport(filename, toCsv([header, ...rows]), 'text/csv;charset=utf-8');
}

export async function saveXlsx(filename: string, sheetName: string, header: string[], rows: Array<Array<string | number>>): Promise<void> {
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  const data = [
    header.map((h) => ({ value: h, fontWeight: 'bold' as const })),
    ...rows.map((r) => r.map((v) => (typeof v === 'number' ? { value: v, type: Number } : { value: String(v ?? ''), type: String, wrap: String(v ?? '').length > 60 }))),
  ];
  const blob = await writeXlsxFile(data as any, {
    sheet: sheetName.slice(0, 31),
    columns: header.map((h) => ({ width: /text|memo/i.test(h) ? 70 : Math.min(30, Math.max(10, h.length + 2)) })),
    stickyRowsCount: 1,
  } as any).toBlob();
  await saveAndReport(filename, blob, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

export function safeFileName(s: string): string {
  return (s.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() || 'export').slice(0, 80);
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString()} ${n === 1 ? one : many}`;
}
