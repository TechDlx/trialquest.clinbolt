import type { ReactNode } from 'react';

type Mood = 'happy' | 'think' | 'cheer' | 'oops';

/** Dose: a capsule in a lab coat. Pure SVG, ~1.5 KB. */
export function Dose({
  size = 96,
  mood = 'happy',
  className = '',
}: {
  size?: number;
  mood?: Mood;
  className?: string;
}) {
  const mouth =
    mood === 'oops'
      ? 'M40 66q8 -5 16 0'
      : mood === 'think'
        ? 'M42 66h12'
        : mood === 'cheer'
          ? 'M38 62q10 12 20 0'
          : 'M40 63q8 7 16 0';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      role="img"
      aria-label="Dose, your mascot"
      className={className}
    >
      {/* capsule body */}
      <rect x="24" y="8" width="48" height="80" rx="24" fill="#ffffff" stroke="#0f766e" strokeWidth="3" />
      <path d="M24 48h48v16a24 24 0 0 1-48 0z" fill="#5eead4" />
      {/* lab coat lapels */}
      <path d="M32 50l16 18 16-18v30H32z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
      <path d="M40 50l8 12 8-12" fill="none" stroke="#94a3b8" strokeWidth="2" />
      {/* lanyard + badge */}
      <path d="M44 52l4 10 4-10" fill="none" stroke="#0f766e" strokeWidth="2" />
      <rect x="43" y="61" width="10" height="8" rx="1.5" fill="#0f766e" />
      {/* eyes */}
      <circle cx="40" cy="36" r="3.2" fill="#0f172a" />
      <circle cx="56" cy="36" r="3.2" fill="#0f172a" />
      {mood === 'think' && <path d="M52 28l8-3" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />}
      {mood === 'cheer' && (
        <>
          <path d="M34 30l6-3" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
          <path d="M62 30l-6-3" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {/* cheeks */}
      <circle cx="34" cy="43" r="2.5" fill="#fda4af" opacity="0.8" />
      <circle cx="62" cy="43" r="2.5" fill="#fda4af" opacity="0.8" />
      {/* mouth */}
      <path d={mouth} fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
      {/* arms */}
      <path d="M24 56q-8 6-4 14" fill="none" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" />
      <path
        d={mood === 'cheer' ? 'M72 56q10-8 6-16' : 'M72 56q8 6 4 14'}
        fill="none"
        stroke="#0f766e"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Speech({
  children,
  mood = 'happy',
  side = 'left',
  className = '',
  onDismiss,
}: {
  children: ReactNode;
  mood?: Mood;
  side?: 'left' | 'right';
  className?: string;
  onDismiss?: () => void;
}) {
  return (
    <div
      className={`flex items-end gap-2 ${side === 'right' ? 'flex-row-reverse' : ''} ${className}`}
      role="note"
    >
      <Dose size={64} mood={mood} className="shrink-0" />
      <div className="relative rounded-2xl bg-surface border border-border px-3.5 py-2.5 text-sm shadow-card max-w-prose">
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
