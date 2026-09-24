// Names the worked example's toast, note and memo use for places in the app, taken from the real
// menu model (the Text coding menu, the procedure registry behind Analyze, the toolbar and the
// Responses filter), so the guidance cannot drift from what is on screen (UI-029).

import { getProcedure } from '../../procedures';
import type { ExampleGuide } from '../../lib/coding/example';
import { CODING_MENU_NAME, codingMenuLabel } from './menu';

/** Label of the coding toolbar's undo button (and how the guidance names it). */
export const UNDO_CODING_LABEL = 'Undo coding';

/** The Responses code-filter option that lists answers without a code. */
export const NOT_CODED_FILTER_LABEL = 'Not coded yet';

/** Top-level menubar name of the analyses (src/app/menus.ts). */
export const ANALYZE_MENU_NAME = 'Analyze';

/** "Analyze > Descriptive Statistics > Crosstabs...", built like the menubar builds it from the registry. */
export function procedureMenuPath(id: string): string {
  const p = getProcedure(id);
  if (!p) return ANALYZE_MENU_NAME;
  return p.menu === 'Graphs' ? `Graphs > ${p.title}...` : `${ANALYZE_MENU_NAME} > ${p.menu} > ${p.title}...`;
}

export function workedExampleGuide(): ExampleGuide {
  return {
    notCodedFilter: NOT_CODED_FILTER_LABEL,
    codesByAttribute: `${CODING_MENU_NAME} > ${codingMenuLabel('view:attribute')}`,
    exportCodes: `${CODING_MENU_NAME} > ${codingMenuLabel('export-dataset')}`,
    crosstabs: procedureMenuPath('crosstabs'),
    undo: UNDO_CODING_LABEL,
  };
}
