import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/Button';
import { RichText } from '@/components/RichText';
import type { EngineMode } from './types';
import { playSound } from '@/engine/sound';

export type FeedbackKind = 'correct' | 'wrong' | 'shortcut' | 'info';

/** Correct answers auto-advance after this long; crisis rounds flash even faster. */
export const AUTO_ADVANCE_MS = 900;
export const CRISIS_FLASH_MS = 600;

export interface BasePending {
  kind: FeedbackKind;
  title: string;
  explanation: string;
  /** Optional one-line inline confirmation from content (<= 12 words). */
  confirm?: string;
  note?: string;
  correctAnswer?: string;
}

export type ShownFeedback<T extends BasePending> = T & { auto: boolean; inline: boolean; ms: number };

/**
 * Applies the feedback rules: correct answers show a one-line confirmation and auto-advance;
 * in a crisis round nothing blocks while the pool runs, every outcome flashes and moves on,
 * and the explanations are deferred to the resolution screen.
 */
export function adaptFeedback<T extends BasePending>(
  mode: EngineMode,
  pending: T | null,
): ShownFeedback<T> | null {
  if (!pending) return null;
  if (mode === 'crisis') {
    return {
      ...pending,
      auto: true,
      inline: true,
      ms: CRISIS_FLASH_MS,
      explanation: '',
      note: undefined,
      title:
        pending.kind === 'correct'
          ? (pending.confirm ?? 'Yes')
          : pending.kind === 'shortcut'
            ? 'Shortcut'
            : 'No',
    };
  }
  if (pending.kind === 'correct') {
    return {
      ...pending,
      auto: true,
      inline: true,
      ms: AUTO_ADVANCE_MS,
      title: pending.confirm ?? pending.title,
      explanation: '',
    };
  }
  return { ...pending, auto: false, inline: false, ms: 0 };
}

/** The explanation panel (wrong turns, shortcuts, info) or a slim inline confirmation. */
export function Feedback({
  kind,
  title,
  correctAnswer,
  explanation,
  note,
  nextLabel = 'Next',
  onNext,
  auto = false,
  inline = false,
  ms = AUTO_ADVANCE_MS,
}: {
  kind: FeedbackKind;
  title: string;
  correctAnswer?: string;
  explanation: string;
  note?: string;
  nextLabel?: string;
  onNext: () => void;
  auto?: boolean;
  inline?: boolean;
  ms?: number;
}) {
  const onNextRef = useRef(onNext);
  useEffect(() => {
    onNextRef.current = onNext;
  });
  useEffect(() => {
    if (!auto) return;
    const id = window.setTimeout(() => onNextRef.current(), ms);
    return () => window.clearTimeout(id);
  }, [auto, ms]);
  useEffect(() => {
    if (kind === 'correct' || kind === 'wrong' || kind === 'shortcut') playSound(kind);
  }, [kind]);

  const cls =
    kind === 'correct'
      ? 'border-ok bg-ok-soft text-green-950'
      : kind === 'wrong'
        ? 'border-bad bg-bad-soft text-red-950'
        : kind === 'shortcut'
          ? 'border-star bg-star-soft text-amber-950'
          : 'border-border bg-surface text-fg';

  if (inline) {
    return (
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        role="status"
        aria-live="polite"
        data-testid="engine-feedback"
        data-kind={kind}
        data-inline="true"
        className={`rounded-xl border-2 px-3 py-2 text-sm font-bold ${cls}`}
      >
        {kind === 'correct' ? '✓ ' : kind === 'wrong' ? '✗ ' : ''}
        {title}
      </motion.p>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      role="status"
      aria-live="polite"
      data-testid="engine-feedback"
      data-kind={kind}
      className={`rounded-card border-2 p-4 ${cls}`}
    >
      <p className="font-bold">{title}</p>
      {correctAnswer && (
        <p className="mt-1 text-sm">
          Correct: <strong>{correctAnswer}</strong>
        </p>
      )}
      {explanation && <RichText as="p" text={explanation} className="mt-1 text-sm" />}
      {note && <p className="mt-1 text-sm font-semibold">{note}</p>}
      <Button onClick={onNext} className="mt-3" full data-testid="engine-next">
        {nextLabel}
      </Button>
    </motion.div>
  );
}
