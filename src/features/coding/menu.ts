// STUB — owned by the Text Coding agent. The app shell renders these in the "Text coding" menu.
// Selecting one switches to the coding tab and calls openDialog({ kind: 'coding', id }) unless `tabOnly`.
export interface CodingMenuItem {
  id: string;
  label: string;
  /** Visual separator before this item. */
  separator?: boolean;
  /** Only switch to the Text coding tab (no dialog). */
  tabOnly?: boolean;
}

export const codingMenuItems: CodingMenuItem[] = [{ id: 'workspace', label: 'Open coding workspace', tabOnly: true }];
