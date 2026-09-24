// Output viewer preferences (per browser, remembered across sessions when storage is available).
import { create } from 'zustand';
import type { TableStyle } from './format';

interface Prefs {
  tableStyle: TableStyle;
  showInterpretations: boolean;
  showSyntax: boolean;
  set: (p: Partial<Omit<Prefs, 'set'>>) => void;
}

const KEY = 'socius.output.prefs';

function load(): Partial<Prefs> {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (!raw) return {};
    const p = JSON.parse(raw);
    return {
      tableStyle: p.tableStyle === 'spss' ? 'spss' : 'apa',
      showInterpretations: p.showInterpretations !== false,
      showSyntax: p.showSyntax !== false,
    };
  } catch {
    return {};
  }
}

export const useOutputPrefs = create<Prefs>((set, get) => ({
  tableStyle: 'apa',
  showInterpretations: true,
  showSyntax: true,
  ...load(),
  set: (p) => {
    set(p);
    try {
      const { tableStyle, showInterpretations, showSyntax } = get();
      localStorage.setItem(KEY, JSON.stringify({ tableStyle, showInterpretations, showSyntax }));
    } catch {
      // Storage blocked (private window, sandbox): preferences last for this session only.
    }
  },
}));
