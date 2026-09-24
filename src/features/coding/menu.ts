// The "Text coding" menu. The app shell renders these; selecting one switches to the coding tab and
// calls openDialog({ kind: 'coding', id }) unless `tabOnly`. Ids starting with "view:" switch the
// workspace view (CodingDialog handles them and closes immediately).
export interface CodingMenuItem {
  id: string;
  label: string;
  /** Visual separator before this item. */
  separator?: boolean;
  /** Only switch to the Text coding tab (no dialog). */
  tabOnly?: boolean;
  /** AI item: opens the set-up help when no AI provider is ready (see aiMenuAvailable). */
  ai?: boolean;
}

/**
 * Whether the AI items belong in the menu. Always: free options exist everywhere (a model on this
 * computer, Gemini with a free key), and an AI item opens the set-up help when nothing is set up yet.
 * Reading this makes no request to any AI service.
 */
export function aiMenuAvailable(): boolean {
  return true;
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
  { id: 'ai-settings', label: 'AI assistant settings…', ai: true },
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
