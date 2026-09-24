// Global keyboard shortcuts (undo/redo/open/save) and platform helpers.
import { useStore } from '../core/store';
import { redoStep, runRedo, runUndo, undoStep } from './undo';
import { openDataFile, saveProject } from '../features/project/fileActions';
import { useUi } from './ui-store';

export function isMac(): boolean {
  try {
    return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  } catch {
    return false;
  }
}

export function modKey(): string {
  return isMac() ? 'Cmd' : 'Ctrl';
}

function inTextField(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') {
    const type = (el as HTMLInputElement).type;
    return !['checkbox', 'radio', 'button', 'submit', 'range', 'color', 'file'].includes(type);
  }
  return (el as HTMLElement).isContentEditable;
}

/**
 * App-wide keys (registered on window in App.tsx).
 *
 * Precedence, for keys that a view also handles itself ("/" in the Text coding Responses view,
 * Ctrl/Cmd+F in the Data View grid, Ctrl/Cmd+K inside the search palette): the view's own handler wins
 * while focus is in that view. View handlers are React handlers on the view's element, so they run
 * first (React listens at the app root, inside window); a view that handles a key calls
 * preventDefault(), and a key that was handled is left alone here. Anywhere else, the global meaning
 * applies. A key is never acted on twice.
 */
export function handleGlobalKey(e: KeyboardEvent): void {
  if (e.defaultPrevented) return;
  const mod = e.ctrlKey || e.metaKey;
  const key = e.key.toLowerCase();
  const modalOpen = !!document.querySelector('.modal');
  // Search palette: Ctrl/Cmd+K anywhere, "/" when not typing.
  if ((mod && !e.altKey && !e.shiftKey && key === 'k') || (!mod && !e.altKey && e.key === '/' && !inTextField(document.activeElement))) {
    if (modalOpen || document.querySelector('.menu-sheet, .menu-dropdown')) return;
    e.preventDefault();
    const ui = useUi.getState();
    ui.setPaletteOpen(!ui.paletteOpen);
    return;
  }
  if (!mod || e.altKey) return;
  const st = useStore.getState();
  if (key === 's') {
    e.preventDefault();
    if (!modalOpen) void saveProject();
    return;
  }
  if (key === 'o') {
    e.preventDefault();
    if (!modalOpen) void openDataFile();
    return;
  }
  if (modalOpen || inTextField(document.activeElement)) return;
  if (key === 'f' && st.dataset && st.tab === 'data') {
    e.preventDefault();
    useUi.getState().requestFind();
    return;
  }
  // Undo / Redo follow the tab you are in (src/app/undo.ts). Text fields keep their own undo (above).
  if (key === 'z' && !e.shiftKey) {
    if (!undoStep()) return;
    e.preventDefault();
    runUndo();
  } else if ((key === 'z' && e.shiftKey) || key === 'y') {
    if (!redoStep()) return;
    e.preventDefault();
    runRedo();
  }
}
