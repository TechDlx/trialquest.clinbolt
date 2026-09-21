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

/**
 * A correct answer stays up long enough to read its one-line reason: the base time plus
 * perCharMs per character, capped. Tests set perCharMs to 0 to keep flows fast.
 */
export const feedbackTiming = { perCharMs: 25, maxMs: 3200 };

const words = (t: string) => t.toLowerCase().match(/[a-z0-9]+/g) ?? [];

/** True when the reason mostly repeats the confirmation (80% of its words are already there). */
function restates(title: string, why: string): boolean {
  const seen = new Set(words(title));
  const w = words(why);
  return w.length > 0 && w.filter((x) => seen.has(x)).length / w.length >= 0.8;
}

/** The first sentence of an explanation: the "why" shown with a right answer. */
export function firstSentence(text: string): string {
  const m = text.match(/^.*?[.!?](?=\s|$)/s);
  return (m ? m[0] : text).trim();
}

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
            : pending.title,
    };
  }
  if (pending.kind === 'correct') {
    // Reinforce the right answer with its reason in one line, then move on by itself.
    const title = pending.confirm ?? pending.title;
    const why = pending.explanation ? firstSentence(pending.explanation) : '';
    const explanation = why && !restates(title, why) ? why : '';
    const ms = Math.min(
      feedbackTiming.maxMs,
      AUTO_ADVANCE_MS + feedbackTiming.perCharMs * explanation.length,
    );
    return { ...pending, auto: true, inline: true, ms, title, explanation };
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
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        role="status"
        aria-live="polite"
        data-testid="engine-feedback"
        data-kind={kind}
        data-inline="true"
        className={`flex items-start gap-2 rounded-xl border-2 px-3 py-2 text-sm ${cls}`}
      >
        <div className="min-w-0 flex-1">
          <p className="font-bold">
            {kind === 'correct' ? '✓ ' : kind === 'wrong' ? '✗ ' : ''}
            <RichText text={title} />
          </p>
          {explanation && <RichText as="p" text={explanation} className="mt-0.5" />}
        </div>
        {explanation && (
          <button
            type="button"
            onClick={onNext}
            className="tap shrink-0 rounded-lg px-2 text-xs font-bold underline underline-offset-2"
            data-testid="engine-skip"
          >
            Next
          </button>
        )}
      </motion.div>
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
      <RichText as="p" text={title} className="font-bold" />
      {correctAnswer && (
        <p className="mt-1 text-sm">
          Correct:{' '}
          <strong>
            <RichText text={correctAnswer} />
          </strong>
        </p>
      )}
      {explanation && <RichText as="p" text={explanation} className="mt-1 text-sm" />}
      {note && <RichText as="p" text={note} className="mt-1 text-sm font-semibold" />}
      <Button onClick={onNext} className="mt-3" full data-testid="engine-next">
        {nextLabel}
      </Button>
    </motion.div>
  );
}
