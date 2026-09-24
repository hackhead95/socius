// Stroke icons for the assistant (16px grid, currentColor).
const P = {
  assistant: 'M8 1.8l1.3 3.4 3.4 1.3-3.4 1.3L8 11.2 6.7 7.8 3.3 6.5l3.4-1.3zM12.6 10.4l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6z',
  send: 'M2.5 8 13.5 2.5 10.5 13.5 7.7 8.9zM7.7 8.9 13.5 2.5',
  stop: 'M4.5 4.5h7v7h-7z',
  eye: 'M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8ZM8 6.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Z',
  clear: 'M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 9h5.8l.6-9',
  close: 'm4 4 8 8M12 4l-8 8',
  copy: 'M5.5 5.5h8v8h-8zM10.5 5.5v-3h-8v8h3',
  retry: 'M13 8a5 5 0 1 1-1.5-3.6M13 2.5v3h-3',
  check: 'm3.5 8.5 3 3 6-7',
  warn: 'M8 2 1.5 13.5h13zM8 6.5v3.5M8 12h.01',
  table: 'M2.5 3h11v10h-11zM2.5 6.5h11M6.5 3v10',
  wand: 'M3 13 11 5M9.5 3.5l3 3M12.5 1.5v2M14.5 3.5h-2M4 2.5v2M5 3.5H3',
  dialog: 'M2.5 3h11v10h-11zM2.5 5.5h11M5 8h6M5 10.5h4',
  chevron: 'm6 4.5 3.5 3.5L6 11.5',
  expand: 'M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5 9 7M2.5 13.5 7 9',
} as const;

export type AsIconName = keyof typeof P;

export function AsIcon({ name, size = 16, className }: { name: AsIconName; size?: number; className?: string }) {
  const filled = name === 'assistant' || name === 'stop';
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0.6 : 1.4} strokeLinecap="round" strokeLinejoin="round">
      <path d={P[name]} />
    </svg>
  );
}
