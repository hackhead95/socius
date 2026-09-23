// Highlighter colours for codes. Mid-luminance, saturated hues that stay distinguishable as a
// translucent fill on white paper and on the dark theme's surface, and as solid gutter bars.

export const CODE_PALETTE: string[] = [
  '#e9b200', // highlighter yellow
  '#2f9be0', // blue
  '#e0566a', // rose
  '#3eaa6d', // green
  '#9063d2', // violet
  '#ee7f2d', // orange
  '#1fa59a', // teal
  '#cf4fa6', // magenta
  '#8b9a2e', // olive
  '#5271d6', // indigo
  '#b87942', // brown
  '#6aa9c4', // steel
];

/** The first palette colour not yet used by `used`; cycles when all are taken. */
export function nextCodeColor(used: string[]): string {
  const taken = new Set(used.map((c) => c.toLowerCase()));
  for (const c of CODE_PALETTE) if (!taken.has(c)) return c;
  return CODE_PALETTE[used.length % CODE_PALETTE.length];
}

/** Normalise a user colour to #rrggbb, or null when invalid. */
export function normaliseHex(input: string): string | null {
  const s = input.trim().toLowerCase();
  const m3 = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(s);
  if (m3) return `#${m3[1]}${m3[1]}${m3[2]}${m3[2]}${m3[3]}${m3[3]}`;
  const m6 = /^#?([0-9a-f]{6})$/.exec(s);
  return m6 ? `#${m6[1]}` : null;
}
