// Quick-code picker: search codes, create a code inline, number keys 1-9 for recent codes.

import { useMemo, useState, type ReactNode } from 'react';
import { useStore } from '../../core/store';
import type { CodeDef } from '../../core/coding-types';
import { codePath } from '../../lib/coding/tree';
import { useOrderedCodes } from './hooks';
import { useCodingUi } from './uiStore';
import { Swatch } from './ui';

export interface QuickCodeProps {
  /** Called with the chosen code id. */
  onPick: (codeId: string) => void;
  /** Create a code with this name and return it. */
  onCreate: (name: string) => CodeDef;
  onClose: () => void;
  /** Code ids to mark as already applied (shown with a check; picking toggles them). */
  applied?: Set<string>;
  title?: ReactNode;
  footer?: ReactNode;
  placeholder?: string;
}

type Option = { kind: 'code'; code: CodeDef; key?: number } | { kind: 'create'; name: string };

export function QuickCode(props: QuickCodeProps) {
  const codes = useStore((s) => s.coding.codes);
  const ordered = useOrderedCodes();
  const recentIds = useCodingUi((s) => s.recentCodeIds);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);

  const recent = useMemo(() => recentIds.map((id) => codes.find((c) => c.id === id)).filter((c): c is CodeDef => !!c).slice(0, 9), [recentIds, codes]);

  const options: Option[] = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) {
      const rest = ordered.map((n) => n.code).filter((c) => !recent.includes(c));
      return [...recent.map((c, i) => ({ kind: 'code' as const, code: c, key: i + 1 })), ...rest.map((c) => ({ kind: 'code' as const, code: c }))];
    }
    const matches = ordered
      .map((n) => n.code)
      .filter((c) => c.name.toLowerCase().includes(query) || codePath(codes, c.id).toLowerCase().includes(query))
      .sort((a, b) => Number(!a.name.toLowerCase().startsWith(query)) - Number(!b.name.toLowerCase().startsWith(query)));
    const exact = codes.some((c) => c.name.trim().toLowerCase() === query);
    const out: Option[] = matches.map((c) => ({ kind: 'code', code: c }));
    if (!exact) out.push({ kind: 'create', name: q.trim() });
    return out;
  }, [q, ordered, recent, codes]);

  const choose = (o: Option | undefined) => {
    if (!o) return;
    if (o.kind === 'create') {
      const c = props.onCreate(o.name);
      props.onPick(c.id);
    } else props.onPick(o.code.id);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(options.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(options[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      props.onClose();
    } else if (!q && /^[1-9]$/.test(e.key)) {
      const c = recent[Number(e.key) - 1];
      if (c) {
        e.preventDefault();
        props.onPick(c.id);
      }
    }
  };

  const withKeys = !q.trim() && recent.length > 0;
  return (
    <div className="cw-qc">
      {props.title ? <div className="cw-qc-title">{props.title}</div> : null}
      <input
        className="input cw-qc-input"
        autoFocus
        value={q}
        placeholder={props.placeholder ?? (codes.length ? 'Find or create a code' : 'Name your first code')}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
        }}
        onKeyDown={onKey}
        aria-label="Find or create a code"
        role="combobox"
        aria-expanded="true"
        aria-controls="cw-qc-list"
        aria-activedescendant={options[active] ? `cw-qc-opt-${active}` : undefined}
      />
      <div className="cw-qc-list" id="cw-qc-list" role="listbox">
        {withKeys ? <div className="cw-qc-group">Recent</div> : null}
        {options.map((o, i) => {
          const showAllHeader = withKeys && o.kind === 'code' && !o.key && (i === 0 || (options[i - 1] as any).key);
          return (
            <div key={o.kind === 'code' ? o.code.id : 'create'}>
              {showAllHeader ? <div className="cw-qc-group">All codes</div> : null}
              <button
                id={`cw-qc-opt-${i}`}
                role="option"
                aria-selected={i === active}
                className={`cw-qc-opt ${i === active ? 'is-active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(o)}
              >
                {o.kind === 'code' ? (
                  <>
                    <Swatch color={o.code.color} />
                    <span className="cw-qc-name">
                      {o.code.parentId ? <span className="faint">{codePath(codes, o.code.id).split(' > ').slice(0, -1).join(' > ')} › </span> : null}
                      {o.code.name}
                    </span>
                    {props.applied?.has(o.code.id) ? <span className="cw-qc-check" aria-label="applied">✓</span> : null}
                    {o.key ? <span className="kbd">{o.key}</span> : null}
                  </>
                ) : (
                  <>
                    <span className="cw-qc-plus" aria-hidden>+</span>
                    <span className="cw-qc-name">
                      Create code <b>{o.name}</b>
                    </span>
                    <span className="kbd">Enter</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
        {!options.length ? <div className="cw-qc-empty">Type a name to create a code.</div> : null}
      </div>
      {props.footer ? <div className="cw-qc-footer">{props.footer}</div> : null}
    </div>
  );
}
