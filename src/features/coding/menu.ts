// The "Text coding" menu. The app shell renders these; selecting one switches to the coding tab and
// calls openDialog({ kind: 'coding', id }) unless `tabOnly`. Ids starting with "view:" switch the
// workspace view (CodingDialog handles them and closes immediately).
import { useCodingUi } from './uiStore';

export interface CodingMenuItem {
  id: string;
  label: string;
  /** Visual separator before this item. */
  separator?: boolean;
  /** Only switch to the Text coding tab (no dialog). */
  tabOnly?: boolean;
  /** AI item: shown only where AI help can be offered (see aiMenuAvailable). */
  ai?: boolean;
}

/**
 * Whether the AI items belong in the menu: only inside the Claude artifact viewer (a `claude` global
 * exists) and not after the capability check said no. Reading this makes no request to Claude.
 */
export function aiMenuAvailable(): boolean {
  const c = (globalThis as { claude?: { use?: unknown } }).claude;
  return typeof c?.use === 'function' && useCodingUi.getState().ai !== 'no';
}

export const codingMenuItems: CodingMenuItem[] = [
  { id: 'workspace', label: 'Open coding workspace', tabOnly: true },
  { id: 'import', label: 'Import documents…', separator: true },
  { id: 'import-survey', label: 'Import open-ended answers from dataset…' },
  { id: 'load-samples', label: 'Load sample interviews' },
  { id: 'view:responses', label: 'Code open-ended responses', separator: true },
  { id: 'auto-code', label: 'Auto-code with keyword rules…' },
  { id: 'ai-codebook', label: 'Suggest a codebook with AI…', ai: true },
  { id: 'ai-suggest', label: 'Suggest codes for responses with AI…', ai: true },
  { id: 'view:retrieve', label: 'Retrieve coded segments', separator: true },
  { id: 'view:frequencies', label: 'Code frequencies' },
  { id: 'view:cooccurrence', label: 'Code co-occurrence' },
  { id: 'view:attribute', label: 'Codes by attribute' },
  { id: 'view:words', label: 'Word frequencies' },
  { id: 'view:kwic', label: 'Keyword in context' },
  { id: 'view:reliability', label: 'Intercoder reliability', separator: true },
  { id: 'coders', label: 'Coders…' },
  { id: 'view:memos', label: 'Memos' },
  { id: 'export-dataset', label: 'Export codes to dataset…', separator: true },
  { id: 'export', label: 'Export coded segments…' },
  { id: 'export-report', label: 'Qualitative report…' },
  { id: 'export-codebook', label: 'Codebook export and import…' },
];
