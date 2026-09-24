// Searchable variable list used by transform dialogs and Variable View tools.
// Single mode: click picks one. Multiple mode: checkboxes; the value keeps the order of picking.
import { useMemo, useRef, useState } from 'react';
import type { Dataset, Variable } from '../core/types';
import { VarMeasureIcon } from './MeasureIcon';
import { Icon } from './Icon';

export interface VarPickerProps {
  ds: Dataset;
  value: string[];
  onChange: (ids: string[]) => void;
  multiple?: boolean;
  /** Only list variables passing this test. */
  filter?: (v: Variable) => boolean;
  /** Visible list height in px. */
  height?: number;
  label?: string;
  /** Show "Select all / none" for multiple mode. */
  bulk?: boolean;
  id?: string;
}

export function VarPicker({ ds, value, onChange, multiple = false, filter, height = 220, label, bulk = true, id }: VarPickerProps) {
  const [q, setQ] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const vars = useMemo(() => {
    const base = filter ? ds.variables.filter(filter) : ds.variables;
    const t = q.trim().toLowerCase();
    if (!t) return base;
    return base.filter((v) => v.name.toLowerCase().includes(t) || v.label.toLowerCase().includes(t));
  }, [ds.variables, filter, q]);
  const selected = new Set(value);

  const toggle = (v: Variable) => {
    if (!multiple) return onChange([v.id]);
    if (selected.has(v.id)) onChange(value.filter((x) => x !== v.id));
    else onChange([...value, v.id]);
  };

  const onKey = (e: React.KeyboardEvent) => {
    const items = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []);
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[Math.min(items.length - 1, i + 1)]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (i <= 0) (e.currentTarget.querySelector('input') as HTMLInputElement | null)?.focus();
      else items[i - 1]?.focus();
    }
  };

  return (
    <div className="varpicker" onKeyDown={onKey}>
      <div className="varpicker-search">
        <Icon name="search" size={14} />
        <input
          id={id}
          className="varpicker-input"
          placeholder={`Search ${label ? label.toLowerCase() : 'variables'}`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label={label ? `Search ${label}` : 'Search variables'}
        />
        {multiple && bulk ? (
          <span className="varpicker-bulk">
            <button type="button" className="linkish" onClick={() => onChange([...value, ...vars.map((v) => v.id).filter((x) => !selected.has(x))])}>All</button>
            <button type="button" className="linkish" onClick={() => onChange(value.filter((x) => !vars.some((v) => v.id === x)))}>None</button>
          </span>
        ) : null}
      </div>
      <div ref={listRef} className="varpicker-list" role="listbox" aria-multiselectable={multiple} aria-label={label ?? 'Variables'} style={{ maxHeight: height }}>
        {vars.length === 0 ? <div className="varpicker-empty">No matching variables.</div> : null}
        {vars.map((v) => {
          const on = selected.has(v.id);
          const order = multiple && on ? value.indexOf(v.id) + 1 : 0;
          return (
            <button key={v.id} type="button" role="option" aria-selected={on} className={`varpicker-item ${on ? 'on' : ''}`} onClick={() => toggle(v)} title={v.label ? `${v.name}: ${v.label}` : v.name}>
              {multiple ? <span className={`varpicker-box ${on ? 'on' : ''}`} aria-hidden="true">{on ? <Icon name="check" size={12} /> : null}</span> : null}
              <VarMeasureIcon v={v} />
              <span className="varpicker-name mono">{v.name}</span>
              <span className="varpicker-label">{v.label}</span>
              {order ? <span className="varpicker-order num">{order}</span> : null}
            </button>
          );
        })}
      </div>
      {multiple ? <div className="help" style={{ marginTop: 4 }}>{value.length ? `${value.length} selected` : 'None selected'}</div> : null}
    </div>
  );
}
