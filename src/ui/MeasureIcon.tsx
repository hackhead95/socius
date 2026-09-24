// Measurement-level glyphs, drawn in SVG like SPSS's ruler / bars / circles, plus one for text.
import type { Variable } from '../core/types';

export type MeasureKind = 'scale' | 'ordinal' | 'nominal' | 'string';

export function measureKind(v: Pick<Variable, 'type' | 'measure'>): MeasureKind {
  return v.type === 'string' ? 'string' : v.measure;
}

export const MEASURE_LABEL: Record<MeasureKind, string> = {
  scale: 'Scale (numbers you can average)',
  ordinal: 'Ordinal (ordered categories)',
  nominal: 'Nominal (unordered categories)',
  string: 'Text',
};

export function MeasureIcon({ kind, size = 14 }: { kind: MeasureKind; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 14 14', 'aria-hidden': true as const, focusable: 'false' as const, className: `measure-icon measure-${kind}` };
  switch (kind) {
    case 'scale':
      return (
        <svg {...common}>
          <rect x="1" y="4.5" width="12" height="5" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M3.5 4.5v2M6 4.5v1.3M8.5 4.5v2M11 4.5v1.3" stroke="currentColor" strokeWidth="1.1" />
        </svg>
      );
    case 'ordinal':
      return (
        <svg {...common}>
          <rect x="1.5" y="8" width="2.6" height="4.5" fill="currentColor" rx="0.4" />
          <rect x="5.7" y="5" width="2.6" height="7.5" fill="currentColor" rx="0.4" opacity="0.85" />
          <rect x="9.9" y="1.5" width="2.6" height="11" fill="currentColor" rx="0.4" opacity="0.7" />
        </svg>
      );
    case 'nominal':
      return (
        <svg {...common}>
          <circle cx="4.3" cy="4.6" r="2.4" fill="currentColor" />
          <circle cx="9.7" cy="4.6" r="2.4" fill="currentColor" opacity="0.75" />
          <circle cx="7" cy="9.6" r="2.4" fill="currentColor" opacity="0.55" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M2.2 12 5.4 2.5h1.2L9.8 12M3.4 8.6h5.2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11 6.5v5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
  }
}

export function VarMeasureIcon({ v, size }: { v: Pick<Variable, 'type' | 'measure'>; size?: number }) {
  const k = measureKind(v);
  return (
    <span className="measure-wrap" title={MEASURE_LABEL[k]}>
      <MeasureIcon kind={k} size={size} />
    </span>
  );
}
