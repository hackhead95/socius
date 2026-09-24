// The "Text coding" menu. The app shell renders these; selecting one switches to the coding tab and
// calls openDialog({ kind: 'coding', id }). Ids starting with "view:" switch the workspace view
// (CodingDialog handles them and closes immediately).
//
// Only non-AI coding commands live here. The coding AI features (Suggest a codebook, Suggest codes
// for open-ended answers, Summarise a code) and AI assistant settings have one home, the AI menu; the
// workspace toolbar keeps an "AI suggestions" button as a contextual shortcut. View > Text coding
// switches to the tab. See docs/NAVIGATION.md.
export interface CodingMenuItem {
  id: string;
  label: string;
  /** Visual separator before this item. */
  separator?: boolean;
}

export const codingMenuItems: CodingMenuItem[] = [
  { id: 'import', label: 'Import documents...' },
  { id: 'import-survey', label: 'Import open-ended answers from dataset...' },
  { id: 'load-samples', label: 'Load sample interviews' },
  { id: 'view:responses', label: 'Code open-ended responses', separator: true },
  { id: 'auto-code', label: 'Auto-code with keyword rules...' },
  { id: 'view:retrieve', label: 'Retrieve coded segments', separator: true },
  { id: 'view:frequencies', label: 'Code frequencies' },
  { id: 'view:cooccurrence', label: 'Code co-occurrence' },
  { id: 'view:attribute', label: 'Codes by attribute' },
  { id: 'view:words', label: 'Word frequencies' },
  { id: 'view:kwic', label: 'Keyword in context' },
  { id: 'view:reliability', label: 'Intercoder reliability', separator: true },
  { id: 'coders', label: 'Coders...' },
  { id: 'view:memos', label: 'Memos' },
  { id: 'export-dataset', label: 'Export codes to dataset...', separator: true },
  { id: 'export', label: 'Export coded segments...' },
  { id: 'export-report', label: 'Qualitative report...' },
  { id: 'export-codebook', label: 'Codebook export and import...' },
];
