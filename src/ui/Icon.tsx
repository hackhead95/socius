// Small stroke icons (16px grid, currentColor). Kept deliberately plain.
import type { CSSProperties } from 'react';

const PATHS: Record<string, string> = {
  undo: 'M6 4 3 7l3 3M3.5 7H10a3 3 0 0 1 0 6H8',
  redo: 'm10 4 3 3-3 3M12.5 7H6a3 3 0 0 0 0 6h2',
  sun: 'M8 5.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6ZM8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1',
  moon: 'M13 9.6A5.5 5.5 0 0 1 6.4 3a5.5 5.5 0 1 0 6.6 6.6Z',
  monitor: 'M2.5 3.5h11v7h-11zM6 13.5h4M8 10.5v3',
  chevron: 'm4.5 6.5 3.5 3.5 3.5-3.5',
  chevronRight: 'm6.5 4.5 3.5 3.5-3.5 3.5',
  search: 'M7 2.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM10.3 10.3 13.5 13.5',
  x: 'm4 4 8 8M12 4l-8 8',
  plus: 'M8 3v10M3 8h10',
  trash: 'M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 9h5.8l.6-9M7 7v4M9 7v4',
  up: 'M8 13V3M4 7l4-4 4 4',
  down: 'M8 3v10M4 9l4 4 4-4',
  sortAsc: 'M4 3v10M2 5l2-2 2 2M8.5 4.5h2M8.5 8h3.5M8.5 11.5h5',
  sortDesc: 'M4 3v10M2 11l2 2 2-2M8.5 4.5h5M8.5 8h3.5M8.5 11.5h2',
  sigma: 'M12 3.5H4l4.2 4.5L4 12.5h8',
  tag: 'M2.5 2.5h5.2l6 6-5.2 5.2-6-6zM5.3 5.3h.01',
  menu: 'M2.5 4h11M2.5 8h11M2.5 12h11',
  sidebar: 'M2.5 3h11v10h-11zM6 3v10',
  folder: 'M2 4.5h4l1.5 1.5H14v6.5H2z',
  save: 'M3 2.5h8l2 2v9H3zM5.5 2.5v3h5v-3M5 13.5v-4h6v4',
  file: 'M4 1.5h5l3 3v10H4zM9 1.5v3h3',
  copy: 'M5.5 5.5h8v8h-8zM10.5 5.5v-3h-8v8h3',
  filter: 'M2 3h12L9.5 8.5V13l-3-1.5v-3z',
  weight: 'M5 5.5h6l2 8H3zM8 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  check: 'm3.5 8.5 3 3 6-7',
  more: 'M3.5 8h.01M8 8h.01M12.5 8h.01',
  grip: 'M6 4h.01M10 4h.01M6 8h.01M10 8h.01M6 12h.01M10 12h.01',
  info: 'M8 1.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 8 1.8ZM8 7v4.5M8 4.8h.01',
  warn: 'M8 2 1.5 13.5h13zM8 6.5v3.5M8 12h.01',
  insertRow: 'M2 10.5h12M2 13.5h12M8 2v6M5 5h6',
  insertCol: 'M10.5 2v12M13.5 2v12M2 8h6M5 5v6',
  goto: 'M2.5 8h9M8.5 4.5 12 8l-3.5 3.5M13.5 3v10',
  keyboard: 'M1.5 4h13v8h-13zM4 7h.01M6.5 7h.01M9 7h.01M11.5 7h.01M5 9.5h6',
  help: 'M8 1.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 8 1.8ZM6.2 6.2a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.6-.8 1.1v.4M8 11.5h.01',
  download: 'M8 2v8.5M4.5 7 8 10.5 11.5 7M2.5 13.5h11',
  upload: 'M8 11V2.5M4.5 6 8 2.5 11.5 6M2.5 13.5h11',
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 16, style, className }: { name: IconName; size?: number; style?: CSSProperties; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ flex: 'none', ...style }}
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
