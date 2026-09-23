// Global keyboard shortcuts (undo/redo/open/save) and platform helpers.
import { useStore } from '../core/store';
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

export function handleGlobalKey(e: KeyboardEvent): void {
  const mod = e.ctrlKey || e.metaKey;
  if (!mod || e.altKey) return;
  const key = e.key.toLowerCase();
  const st = useStore.getState();
  const modalOpen = !!document.querySelector('.modal');
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
  if (key === 'z' && !e.shiftKey) {
    if (!st.past.length) return;
    e.preventDefault();
    st.undo();
  } else if ((key === 'z' && e.shiftKey) || key === 'y') {
    if (!st.future.length) return;
    e.preventDefault();
    st.redo();
  }
}
