// Small stroke icons (currentColor) used by the output viewer and analysis dialogs.
import type { ReactNode } from 'react';

function Svg({ children, size = 16, label }: { children: ReactNode; size?: number; label?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} aria-label={label}>
      {children}
    </svg>
  );
}

export const IconCopy = () => (
  <Svg>
    <rect x="5" y="5" width="8.5" height="8.5" rx="1.5" />
    <path d="M10.5 5V3.5A1.5 1.5 0 0 0 9 2H3.5A1.5 1.5 0 0 0 2 3.5V9a1.5 1.5 0 0 0 1.5 1.5H5" />
  </Svg>
);
export const IconUp = () => (
  <Svg>
    <path d="M8 13V3M4 7l4-4 4 4" />
  </Svg>
);
export const IconDown = () => (
  <Svg>
    <path d="M8 3v10M4 9l4 4 4-4" />
  </Svg>
);
export const IconTrash = () => (
  <Svg>
    <path d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9.5h6.6L12 4" />
  </Svg>
);
export const IconChevron = ({ open }: { open: boolean }) => (
  <Svg>
    <path d={open ? 'M4 6l4 4 4-4' : 'M6 4l4 4-4 4'} />
  </Svg>
);
export const IconDownload = () => (
  <Svg>
    <path d="M8 2v8M4.5 6.5 8 10l3.5-3.5M2.5 13.5h11" />
  </Svg>
);
export const IconTable = () => (
  <Svg size={14}>
    <rect x="2" y="3" width="12" height="10" rx="1" />
    <path d="M2 6.5h12M6 6.5V13" />
  </Svg>
);
export const IconChart = () => (
  <Svg size={14}>
    <path d="M2.5 13.5h11M4.5 11V8M8 11V4.5M11.5 11V6.5" />
  </Svg>
);
export const IconText = () => (
  <Svg size={14}>
    <path d="M3 4h10M3 8h10M3 12h6" />
  </Svg>
);
export const IconWarn = () => (
  <Svg size={14}>
    <path d="M8 2.5 14 13H2L8 2.5z" />
    <path d="M8 6.5v3M8 11.3v.2" />
  </Svg>
);
export const IconOutline = () => (
  <Svg>
    <path d="M2.5 4h11M5 8h8.5M5 12h8.5M2.5 8h.01M2.5 12h.01" />
  </Svg>
);
export const IconArrowRight = () => (
  <Svg>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </Svg>
);
export const IconArrowLeft = () => (
  <Svg>
    <path d="M13 8H3M7 4 3 8l4 4" />
  </Svg>
);
export const IconX = () => (
  <Svg size={14}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </Svg>
);
export const IconSearch = () => (
  <Svg size={14}>
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5 14 14" />
  </Svg>
);
