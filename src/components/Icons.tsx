import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number, p: P) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
  ...p,
});

export const HeartIcon = ({ size = 20, filled = true, ...p }: P & { filled?: boolean }) => (
  <svg {...base(size, p)} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 21s-7-4.6-9.3-8.6C.6 8.7 2.4 4.5 6.4 4.5c2 0 3.4 1 4.3 2.3.9-1.3 2.3-2.3 4.3-2.3 4 0 5.8 4.2 3.7 7.9C19 16.4 12 21 12 21z" />
  </svg>
);

export const StarIcon = ({ size = 20, filled = true, ...p }: P & { filled?: boolean }) => (
  <svg {...base(size, p)} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />
  </svg>
);

export const LockIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size, p)}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

export const CrownIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" />
  </svg>
);

export const RefreshIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <path d="M21 3v6h-6" />
  </svg>
);

export const CheckIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={3}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
);

export const XIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={3}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const PauseIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size, p)} fill="currentColor" stroke="none">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

export const FlagIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M5 21V4" />
    <path d="M5 4h12l-3 4 3 4H5" />
  </svg>
);

export const ArrowRightIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const ArrowLeftIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const MapIcon = ({ size = 22, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" />
    <path d="M9 4v14M15 6v14" />
  </svg>
);

export const BookIcon = ({ size = 22, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z" />
    <path d="M20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z" />
  </svg>
);

export const ListIcon = ({ size = 22, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <circle cx="4" cy="6" r="1" fill="currentColor" />
    <circle cx="4" cy="12" r="1" fill="currentColor" />
    <circle cx="4" cy="18" r="1" fill="currentColor" />
  </svg>
);

export const GearIcon = ({ size = 22, ...p }: P) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);

export const ShareIcon = ({ size = 22, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
    <path d="M12 3v13M7 8l5-5 5 5" />
  </svg>
);

export const ShieldIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M12 2l8 3v6c0 5-3.4 8.7-8 11-4.6-2.3-8-6-8-11V5z" />
  </svg>
);

export const DatabaseIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size, p)}>
    <ellipse cx="12" cy="5" rx="8" ry="3" />
    <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
    <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
  </svg>
);

export const ClockIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const FlameIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size, p)} fill="currentColor" stroke="none">
    <path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2 .8-3.3 1.8-4.4C9 10.5 10 12 11 12c0-3-1-5 1-10z" />
  </svg>
);

/** Answer shapes for the Kahoot-style quiz (colour is never the only cue). */
export const ShapeIcon = ({
  shape,
  size = 22,
  ...p
}: P & { shape: 'triangle' | 'diamond' | 'circle' | 'square' }) => {
  const b = { ...base(size, p), fill: 'currentColor', stroke: 'none' };
  switch (shape) {
    case 'triangle':
      return (
        <svg {...b}>
          <path d="M12 3l9 17H3z" />
        </svg>
      );
    case 'diamond':
      return (
        <svg {...b}>
          <path d="M12 2l10 10-10 10L2 12z" />
        </svg>
      );
    case 'circle':
      return (
        <svg {...b}>
          <circle cx="12" cy="12" r="9.5" />
        </svg>
      );
    case 'square':
      return (
        <svg {...b}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      );
  }
};
