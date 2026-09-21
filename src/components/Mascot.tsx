import type { ReactNode } from 'react';

type Mood = 'happy' | 'think' | 'cheer' | 'oops';

/** Per-mood face parts. The body, lanyard and arms never change. */
const faces: Record<Mood, { browL: string; browR: string; mouth: string; tongue?: string }> = {
  happy: {
    browL: 'M36 27.5q4.2-3 8.2-.8',
    browR: 'M51.8 26.7q4.2-2.2 8.2.8',
    mouth: 'M39 46.5h18c0 6-4 10-9 10s-9-4-9-10z',
    tongue: 'M44 51.8h8c0 2.4-1.8 3.8-4 3.8s-4-1.4-4-3.8z',
  },
  cheer: {
    browL: 'M35.6 25.8q4.2-3.2 8.2-1',
    browR: 'M52.2 25q4.2-2.2 8.2 1',
    mouth: 'M38 45.5h20c0 6.8-4.5 11.2-10 11.2s-10-4.4-10-11.2z',
    tongue: 'M43.5 52h9c0 2.6-2 4.2-4.5 4.2s-4.5-1.6-4.5-4.2z',
  },
  think: {
    browL: 'M35.8 25.6q4.2-2.6 8.2-.4',
    browR: 'M52 29q4.2-1.4 8.2.4',
    mouth: 'M43 49.8h10a2.6 2.6 0 0 1 0 5.2H43a2.6 2.6 0 0 1 0-5.2z',
  },
  oops: {
    browL: 'M36 26q4.2-1 8.2 2.2',
    browR: 'M51.8 28.2q4.2-3.2 8.2-2.2',
    mouth: 'M48 46.6c3.5 0 6.3 2.7 6.3 6s-2.8 6-6.3 6-6.3-2.7-6.3-6 2.8-6 6.3-6z',
  },
};

const OUTLINE = '#0f5f63';
const INK = '#12243f';

/** Dose: a capsule in a lab coat lanyard. Pure SVG so it stays sharp and works offline. */
export function Dose({
  size = 96,
  mood = 'happy',
  className = '',
}: {
  /** Pixel size, or a CSS length such as "100%" to fill a sized parent. */
  size?: number | string;
  mood?: Mood;
  className?: string;
}) {
  const face = faces[mood];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      role="img"
      aria-label="Dose, your mascot"
      className={className}
    >
      {/* arms, drawn first so they tuck behind the body */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M30 57c-8 4-11.5 12-8.5 18.5 2 4.2 8 2.5 6.8-2M66 57c8.5-3 12.5-11 10.5-17.5-1.2-4-6.5-3-6.4 1.2"
          stroke={OUTLINE}
          strokeWidth="8.6"
        />
        <path
          d="M30 57c-8 4-11.5 12-8.5 18.5 2 4.2 8 2.5 6.8-2M66 57c8.5-3 12.5-11 10.5-17.5-1.2-4-6.5-3-6.4 1.2"
          stroke="#13878a"
          strokeWidth="5.4"
        />
      </g>

      {/* capsule: white head, mint body */}
      <rect x="28" y="8" width="40" height="80" rx="20" fill="#ffffff" />
      <path d="M28 50h40v18a20 20 0 0 1-40 0z" fill="#5eead4" />
      <path d="M38 18c-4 5-6 12-5 18 4-1 7-8 7-13 0-3-1-5-2-5z" fill="#e8f6f6" />
      <rect x="28" y="8" width="40" height="80" rx="20" fill="none" stroke={OUTLINE} strokeWidth="3.5" />

      {/* face */}
      <g fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round">
        <path d={face.browL} />
        <path d={face.browR} />
      </g>
      <ellipse cx="41.5" cy="37.5" rx="4.7" ry="6.1" fill={INK} />
      <ellipse cx="54.5" cy="37.5" rx="4.7" ry="6.1" fill={INK} />
      <circle cx="43.3" cy="34.8" r="1.7" fill="#ffffff" />
      <circle cx="56.3" cy="34.8" r="1.7" fill="#ffffff" />
      <circle cx="34.5" cy="45.5" r="3.5" fill="#f58f7f" opacity="0.9" />
      <circle cx="61.5" cy="45.5" r="3.5" fill="#f58f7f" opacity="0.9" />
      <path d={face.mouth} fill={INK} />
      {face.tongue && <path d={face.tongue} fill="#ef5f52" />}

      {/* lanyard and ID badge */}
      <path
        d="M33.5 53.5 48 66.5M62.5 53.5 48 66.5"
        fill="none"
        stroke={OUTLINE}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <rect
        x="45.2"
        y="64.5"
        width="5.6"
        height="5"
        rx="1.6"
        fill="#14b8a6"
        stroke={OUTLINE}
        strokeWidth="1.4"
      />
      <rect x="39.5" y="69" width="17" height="14" rx="2.6" fill="#ffffff" stroke={OUTLINE} strokeWidth="2" />
      <path
        d="M46.3 71.8h3.4v3.3l2.7 4.9c.4.8-.1 1.6-.9 1.6h-7c-.8 0-1.3-.8-.9-1.6l2.7-4.9z"
        fill="#0f766e"
      />
    </svg>
  );
}

export function Speech({
  children,
  mood = 'happy',
  side = 'left',
  className = '',
  label,
  onDismiss,
}: {
  children: ReactNode;
  mood?: Mood;
  side?: 'left' | 'right';
  className?: string;
  /** Optional kicker above the line, e.g. "Dose · your guide". */
  label?: string;
  onDismiss?: () => void;
}) {
  return (
    <div
      className={`flex items-end gap-2 ${side === 'right' ? 'flex-row-reverse' : ''} ${className}`}
      role="note"
    >
      <Dose size={64} mood={mood} className="shrink-0" />
      <div className="relative max-w-prose rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-sm shadow-card">
        {label && (
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-wider text-brand-700 dark:text-brand-300">
            {label}
          </p>
        )}
        {children}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="tap mt-1 -mb-1 flex items-center rounded-lg px-1 text-xs font-semibold text-brand-700 dark:text-brand-300"
          >
            Got it
          </button>
        )}
      </div>
    </div>
  );
}
