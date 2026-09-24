// Search palette (Ctrl+K / Cmd+K, "/" or the search field in the top bar): one box that finds menu
// commands, variables, results in Output, help topics and coded text. Commands come from the same menu
// model as the menubar (useMenus), so selecting one does exactly what the menu does.
import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useStore } from '../core/store';
import type { Variable } from '../core/types';
import { procedures, getProcedure } from '../procedures';
import { Icon, type IconName } from '../ui/Icon';
import { VarMeasureIcon } from '../ui/MeasureIcon';
import { prefillProcedure } from '../features/analysis/varUtils';
import { useCodingUi } from '../features/coding/uiStore';
import { openAssistant } from '../features/assistant/open';
import { readPref, writePref } from '../features/project/persistence';
import { useMenus } from './menus';
import { commandsFromMenus, searchEntries, type SearchEntry, type SearchGroup } from './search';
import { HELP_TOPICS, helpTopicUrl } from './helpTopics';
import { openExternal } from './links';
import { isMac } from './shortcuts';
import { useUi } from './ui-store';
import './palette.css';

interface Secondary {
  label: string;
  hint: string;
  run: () => void;
}

interface PaletteEntry extends SearchEntry {
  run: () => void;
  icon: IconName | 'ai' | { variable: Variable };
  secondary?: Secondary[];
}

const GROUP_LABEL: Record<SearchGroup | 'recent' | 'suggested', string> = {
  commands: 'Commands',
  variables: 'Variables',
  results: 'Results in Output',
  coding: 'Text coding',
  help: 'Help topics',
  assistant: 'Socius assistant',
  recent: 'Recent',
  suggested: 'Suggestions',
};

const RECENT_KEY = 'palette-recent';
const SUGGESTED = ['cmd:analyze:crosstabs', 'cmd:analyze:frequencies', 'cmd:file:open', 'cmd:ai:ai-explain', 'cmd:ai:ai-assistant', 'cmd:help:h-start'];

function readRecent(): string[] {
  try {
    const v = JSON.parse(readPref(RECENT_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 6) : [];
  } catch {
    return [];
  }
}

function pushRecent(id: string) {
  writePref(RECENT_KEY, JSON.stringify([id, ...readRecent().filter((x) => x !== id)].slice(0, 6)));
}

export function openPalette() {
  if (document.querySelector('.modal')) return;
  useUi.getState().setPaletteOpen(true);
}

export function CommandPaletteHost() {
  const open = useUi((s) => s.paletteOpen);
  return open ? <CommandPalette /> : null;
}

/** Everything searchable right now. */
function useEntries(): PaletteEntry[] {
  const menus = useMenus();
  const ds = useStore((s) => s.dataset);
  const outputs = useStore((s) => s.outputs);
  const coding = useStore((s) => s.coding);
  return useMemo(() => {
    const st = useStore.getState;
    const ui = useUi.getState;
    const out: PaletteEntry[] = [];
    const descriptions = Object.fromEntries(procedures.map((p) => [p.id, p.description]));
    for (const c of commandsFromMenus(menus, descriptions)) {
      const top = c.id.split(':')[1];
      out.push({ ...c, icon: top === 'ai' ? 'ai' : top === 'analyze' ? 'sigma' : top === 'graphs' ? 'sigma' : top === 'file' ? 'file' : top === 'help' ? 'help' : top === 'coding' ? 'tag' : 'chevronRight', run: () => c.item.onSelect?.() });
    }
    if (ds) {
      const freq = getProcedure('frequencies');
      for (const v of ds.variables) {
        const toData = () => {
          ui().focusGrid({ varId: v.id });
          st().setTab('data');
        };
        const secondary: Secondary[] = [
          { label: 'Variable View', hint: 'Shift+Enter', run: () => { ui().focusVariableView(v.id); st().setTab('variables'); } },
        ];
        if (freq)
          secondary.push({
            label: 'Frequencies',
            hint: 'Alt+Enter',
            run: () => {
              const cur = st().dataset;
              if (cur) prefillProcedure(freq, cur, [v.id]);
              st().openDialog({ kind: 'procedure', id: freq.id });
            },
          });
        out.push({
          id: `var:${v.id}`,
          group: 'variables',
          title: v.name,
          detail: v.label || undefined,
          keywords: v.label ? [v.label] : [],
          extra: v.valueLabels.slice(0, 40).map((l) => l.label).join(' '),
          icon: { variable: v },
          run: toData,
          secondary,
        });
      }
    }
    for (const it of outputs) {
      const time = new Date(it.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const go = (block?: number) => () => {
        st().setTab('output');
        ui().focusOutput(it.id, block);
      };
      out.push({ id: `out:${it.id}`, group: 'results', title: it.title, detail: `Output · ${time}`, icon: 'file', run: go() });
      it.blocks.forEach((b, i) => {
        const title = b.kind === 'table' ? b.table.title : b.kind === 'chart' ? b.chart.title : null;
        if (title && title !== it.title) out.push({ id: `out:${it.id}:${i}`, group: 'results', title, detail: `In ${it.title}`, icon: b.kind === 'chart' ? 'sigma' : 'file', run: go(i) });
      });
    }
    for (const t of HELP_TOPICS)
      out.push({ id: `help:${t.anchor}`, group: 'help', title: t.title, detail: `User guide · ${t.chapter}`, keywords: [t.chapter, ...(t.keywords ?? [])], icon: 'help', run: () => openExternal(helpTopicUrl(t)) });
    const counts = new Map<string, number>();
    for (const s of coding.segments) counts.set(s.codeId, (counts.get(s.codeId) ?? 0) + 1);
    for (const c of coding.codes) {
      const n = counts.get(c.id) ?? 0;
      out.push({
        id: `code:${c.id}`,
        group: 'coding',
        title: c.name,
        detail: `Code · ${n} coded segment${n === 1 ? '' : 's'}`,
        extra: c.description,
        icon: 'tag',
        run: () => {
          useCodingUi.getState().set({ view: 'retrieve', selectedCodeId: c.id });
          st().setTab('coding');
        },
      });
    }
    return out;
  }, [menus, ds, outputs, coding]);
}

interface Section {
  key: string;
  label: string;
  items: PaletteEntry[];
}

function CommandPalette() {
  const entries = useEntries();
  const hasTexts = useStore((s) => s.coding.docs.length > 0);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);
  const uid = useId();
  const mod = isMac() ? 'Cmd' : 'Ctrl';

  useEffect(() => {
    prevFocus.current = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
  }, []);

  // Typing stays responsive with very large datasets: results follow a moment later.
  const dq = useDeferredValue(q);
  const build = (raw: string): Section[] => {
    const query = raw.trim();
    if (!query) {
      const byId = new Map(entries.map((e) => [e.id, e]));
      const recent = readRecent().map((id) => byId.get(id)).filter((e): e is PaletteEntry => !!e);
      const seen = new Set(recent.map((e) => e.id));
      const suggested = SUGGESTED.map((id) => byId.get(id)).filter((e): e is PaletteEntry => !!e && !seen.has(e.id));
      return [
        ...(recent.length ? [{ key: 'recent', label: GROUP_LABEL.recent, items: recent }] : []),
        ...(suggested.length ? [{ key: 'suggested', label: GROUP_LABEL.suggested, items: suggested }] : []),
      ];
    }
    const groups = searchEntries(query, entries);
    const out: Section[] = groups.map((g) => ({ key: g.group, label: GROUP_LABEL[g.group], items: g.items }));
    if (hasTexts && query.length >= 2) {
      const kwic: PaletteEntry = {
        id: 'kwic',
        group: 'coding',
        title: `Search in texts for "${query}"`,
        detail: 'Text coding · Keyword in context',
        icon: 'search',
        run: () => {
          useCodingUi.getState().set({ view: 'analyse', analyseTab: 'kwic', kwicQuery: query });
          useStore.getState().setTab('coding');
        },
      };
      const sec = out.find((s) => s.key === 'coding');
      if (sec) sec.items = [...sec.items, kwic];
      else out.push({ key: 'coding', label: GROUP_LABEL.coding, items: [kwic] });
    }
    out.push({
      key: 'assistant',
      label: GROUP_LABEL.assistant,
      items: [
        {
          id: 'assistant',
          group: 'assistant',
          title: `Ask the assistant: ${query}`,
          detail: 'Sends your question to the Socius assistant',
          icon: 'ai',
          run: () => openAssistant({ prompt: query, send: true }),
        },
      ],
    });
    return out;
  };
  const sections: Section[] = useMemo(() => build(dq), [dq, entries, hasTexts]); // eslint-disable-line react-hooks/exhaustive-deps

  const flat = useMemo(() => sections.flatMap((s) => s.items), [sections]);
  useEffect(() => setActive(0), [dq]);
  const cur = flat[Math.min(active, flat.length - 1)];

  useEffect(() => {
    (listRef.current?.querySelector(`[data-index="${active}"]`) as HTMLElement | null)?.scrollIntoView?.({ block: 'nearest' });
  }, [active]);

  const close = () => {
    useUi.getState().setPaletteOpen(false);
    const p = prevFocus.current;
    if (p && document.contains(p) && p !== document.body) p.focus({ preventScroll: true });
  };

  const run = (e: PaletteEntry | undefined, which?: number) => {
    if (!e || e.disabled) return;
    const fn = which === undefined ? e.run : e.secondary?.[which]?.run;
    if (!fn) return;
    if (e.group === 'commands') pushRecent(e.id);
    close();
    fn();
  };

  const onKeyDown = (ev: React.KeyboardEvent) => {
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
      ev.preventDefault();
      close();
    } else if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
      ev.preventDefault();
      if (!flat.length) return;
      const d = ev.key === 'ArrowDown' ? 1 : -1;
      setActive((a) => (a + d + flat.length) % flat.length);
    } else if (ev.key === 'PageDown' || ev.key === 'PageUp') {
      ev.preventDefault();
      setActive((a) => Math.max(0, Math.min(flat.length - 1, a + (ev.key === 'PageDown' ? 8 : -8))));
    } else if (ev.key === 'Enter') {
      ev.preventDefault();
      // Enter right after typing: use results for what is typed now, not the deferred ones.
      const target = q === dq ? cur : build(q).flatMap((x) => x.items)[0];
      run(target, ev.shiftKey ? 0 : ev.altKey ? 1 : undefined);
    } else if (ev.key === 'Escape') {
      ev.preventDefault();
      ev.stopPropagation();
      close();
    } else if (ev.key === 'Tab') {
      // Keep focus inside the palette.
      const items = Array.from(ev.currentTarget.querySelectorAll<HTMLElement>('input, button:not([tabindex="-1"])'));
      const i = items.indexOf(document.activeElement as HTMLElement);
      const next = items[(i + (ev.shiftKey ? -1 : 1) + items.length) % items.length];
      ev.preventDefault();
      next?.focus();
    }
  };

  const optId = (i: number) => `${uid}-opt-${i}`;
  let index = -1;

  return (
    <div className="palette-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Search Socius" onKeyDown={onKeyDown}>
        <div className="palette-input-row">
          <Icon name="search" size={18} />
          <input
            ref={inputRef}
            className="palette-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search commands, variables, results, help"
            role="combobox"
            aria-expanded="true"
            aria-controls={`${uid}-list`}
            aria-autocomplete="list"
            aria-activedescendant={cur ? optId(Math.min(active, flat.length - 1)) : undefined}
            aria-label="Search Socius"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="go"
          />
          <kbd className="kbd palette-esc">Esc</kbd>
          <button type="button" className="btn btn-sm btn-ghost palette-close" onClick={close}>Close</button>
        </div>
        <div ref={listRef} id={`${uid}-list`} className="palette-list" role="listbox" aria-label="Search results">
          {sections.map((s) => (
            <div key={s.key} role="group" aria-labelledby={`${uid}-g-${s.key}`} className="palette-section">
              <div id={`${uid}-g-${s.key}`} className="palette-group">{s.label}</div>
              {s.items.map((e) => {
                index++;
                const i = index;
                const on = i === active;
                return (
                  <div
                    key={`${s.key}-${e.id}`}
                    id={optId(i)}
                    data-index={i}
                    role="option"
                    aria-selected={on}
                    aria-disabled={e.disabled ? 'true' : undefined}
                    className={`palette-item ${on ? 'on' : ''} ${e.disabled ? 'is-disabled' : ''}`}
                    onMouseMove={() => !on && setActive(i)}
                    onClick={() => run(e)}
                  >
                    <span className="palette-icon" aria-hidden="true">
                      {e.icon === 'ai' ? <span className="ai-badge">AI</span> : typeof e.icon === 'object' ? <VarMeasureIcon v={e.icon.variable} /> : <Icon name={e.icon} size={15} />}
                    </span>
                    <span className="palette-text">
                      <span className={`palette-title ${e.group === 'variables' ? 'mono' : ''}`}>{e.title}</span>
                      {e.detail ? <span className="palette-detail">{e.detail}</span> : null}
                      {e.disabled && e.disabledReason ? <span className="palette-reason">{e.disabledReason}</span> : null}
                    </span>
                    {e.secondary?.length ? (
                      <span className="palette-secondary">
                        {e.secondary.map((a, k) => (
                          <button
                            key={a.label}
                            type="button"
                            tabIndex={-1}
                            className="btn btn-sm palette-sec-btn"
                            title={`${a.label} (${a.hint})`}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              run(e, k);
                            }}
                          >
                            {a.label}
                          </button>
                        ))}
                      </span>
                    ) : e.shortcut ? (
                      <kbd className="kbd palette-shortcut">{e.shortcut}</kbd>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
          {dq.trim() && !flat.length ? <div className="palette-empty">No matches. Try fewer or other words.</div> : null}
        </div>
        <div className="palette-foot" aria-hidden="true">
          <span><kbd className="kbd">↑</kbd><kbd className="kbd">↓</kbd> move</span>
          <span><kbd className="kbd">Enter</kbd> open</span>
          {cur?.secondary?.length ? <span><kbd className="kbd">Shift+Enter</kbd> Variable View · <kbd className="kbd">Alt+Enter</kbd> Frequencies</span> : null}
          <span className="spacer" />
          <span><kbd className="kbd">{mod}+K</kbd> or <kbd className="kbd">/</kbd> opens search</span>
        </div>
      </div>
    </div>
  );
}
