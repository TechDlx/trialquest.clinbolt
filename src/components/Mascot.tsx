import type { ReactNode } from 'react';
import doseCheer from '@/assets/dose-cheer.png';
import doseHappy from '@/assets/dose-happy.png';
import doseOops from '@/assets/dose-oops.png';
import doseThink from '@/assets/dose-think.png';

type Mood = 'happy' | 'think' | 'cheer' | 'oops';

/**
 * One illustration per mood. Each is the same drawing with only the mouth and
 * eyebrows redrawn, so Dose never changes shape between screens.
 */
const art: Record<Mood, string> = {
  happy: doseHappy,
  cheer: doseCheer,
  think: doseThink,
  oops: doseOops,
};

/** Dose: a capsule with a lab lanyard, and the player's guide. */
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
  return (
    <span
      role="img"
      aria-label="Dose, your mascot"
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <img src={art[mood]} alt="" className="block max-h-full max-w-full" />
    </span>
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
      <Dose size={64} mood={mood} />
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
