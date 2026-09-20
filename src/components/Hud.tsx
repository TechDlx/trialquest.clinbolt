import type { MeterId } from '@/content/types';
import { economy } from '@/content/economy';
import { DatabaseIcon, HeartIcon, ShieldIcon, ClockIcon, StarIcon } from './Icons';

export function Hearts({
  hearts,
  size = 18,
  className = '',
}: {
  hearts: number;
  size?: number;
  className?: string;
}) {
  const max = economy.hearts.max;
  return (
    <div
      className={`flex items-center gap-0.5 ${className}`}
      role="img"
      aria-label={`${hearts} of ${max} hearts`}
    >
      {Array.from({ length: max }, (_, i) => (
        <HeartIcon
          key={i}
          size={size}
          filled={i < hearts}
          className={i < hearts ? 'text-heart' : 'text-locked'}
        />
      ))}
      <span className="ml-1 text-sm font-semibold tabular-nums">{hearts}</span>
    </div>
  );
}

export function Stars({
  stars,
  size = 22,
  className = '',
}: {
  stars: number;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className}`}
      role="img"
      aria-label={`${stars} of 3 stars`}
    >
      {[0, 1, 2].map((i) => (
        <StarIcon
          key={i}
          size={size}
          filled={i < stars}
          className={i < stars ? 'text-star' : 'text-locked'}
        />
      ))}
    </div>
  );
}

const meterMeta: Record<MeterId, { label: string; color: string; Icon: typeof ShieldIcon }> = {
  safety: { label: 'Patient safety', color: 'bg-meter-safety', Icon: ShieldIcon },
  integrity: { label: 'Data integrity', color: 'bg-meter-integrity', Icon: DatabaseIcon },
  timeline: { label: 'Timeline & budget', color: 'bg-meter-timeline', Icon: ClockIcon },
};

export function Meter({ id, value, compact = false }: { id: MeterId; value: number; compact?: boolean }) {
  const { label, color, Icon } = meterMeta[id];
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-1.5" title={`${label}: ${pct}`}>
      <Icon size={compact ? 14 : 16} className="text-muted shrink-0" />
      {!compact && <span className="w-28 truncate text-xs text-muted">{label}</span>}
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-2 flex-1 overflow-hidden rounded-full bg-border"
      >
        <div
          className={`h-full rounded-full ${color} transition-[width] duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-7 text-right text-xs font-semibold tabular-nums">{pct}</span>
    </div>
  );
}

export function Meters({ meters, compact = false }: { meters: Record<MeterId, number>; compact?: boolean }) {
  return (
    <div className={compact ? 'grid grid-cols-3 gap-2' : 'grid gap-1.5'}>
      {(['safety', 'integrity', 'timeline'] as MeterId[]).map((m) => (
        <Meter key={m} id={m} value={meters[m]} compact={compact} />
      ))}
    </div>
  );
}

export function TimerBar({
  fraction,
  remaining,
  relaxed,
  warn = 0.25,
  label,
}: {
  fraction: number;
  remaining: number;
  relaxed: boolean;
  warn?: number;
  /** Text shown instead of the bar when there is no clock (defaults to the relaxed-mode line). */
  label?: string;
}) {
  if (relaxed) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted" aria-live="off">
        <ClockIcon size={16} />
        <span>{label ?? 'Relaxed mode: no timer'}</span>
      </div>
    );
  }
  const low = fraction <= warn;
  const secs = Math.ceil(remaining);
  return (
    <div className="flex items-center gap-2">
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-border" role="presentation">
        <div
          className={`h-full rounded-full transition-[width] duration-100 ease-linear ${low ? 'bg-bad' : 'bg-brand-500'}`}
          style={{ width: `${Math.max(0, Math.min(100, fraction * 100))}%` }}
        />
      </div>
      <span
        className={`w-8 text-right text-sm font-bold tabular-nums ${low ? 'text-bad' : ''}`}
        role="timer"
        aria-live={low ? 'polite' : 'off'}
        aria-label={`${secs} seconds left`}
      >
        {secs}
      </span>
    </div>
  );
}

export function Chip({
  children,
  color = 'bg-brand-600',
  className = '',
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold text-white ${color} ${className}`}
    >
      {children}
    </span>
  );
}
