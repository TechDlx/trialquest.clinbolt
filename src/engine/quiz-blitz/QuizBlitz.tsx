import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { QuizQuestion } from '@/content/types';
import { economy } from '@/content/economy';
import {
  bossMaxPoints,
  bossPointsForAnswer,
  streakMultiplier,
  type Mistake,
  type EngineResult,
  type ItemOutcome,
  emptyOutcomes,
} from '@/engine/scoring';
import { useCountdown } from '@/engine/useCountdown';
import { CheckIcon, ShapeIcon, XIcon } from '@/components/Icons';
import { TimerBar } from '@/components/Hud';
import { Button } from '@/components/Button';
import { RichText } from '@/components/RichText';

export type QuizMode = 'level' | 'boss' | 'review';

export interface MistakeFeedback {
  heartLost: boolean;
  /** Extra line shown under the explanation (e.g. "First slip is free in World 1"). */
  note?: string;
}

export interface QuizBlitzProps {
  questions: QuizQuestion[];
  secondsPerQuestion: number;
  timerScale?: number;
  relaxed: boolean;
  paused?: boolean;
  mode?: QuizMode;
  shuffle?: boolean;
  /** Seed for option shuffling; the host picks one per run so renders stay pure. */
  seed?: number;
  /** Called on every wrong answer or timeout. Return value drives the feedback panel. */
  /** Optional: Test Yourself passes none, so hearts and meters are unreachable from that mode. */
  onMistake?: (m: Mistake) => MistakeFeedback;
  onComplete: (r: EngineResult) => void;
  /** Called after each answer so the host can track progress. */
  onProgress?: (answered: number, total: number) => void;
}

const SHAPES = ['triangle', 'diamond', 'circle', 'square'] as const;
const COLORS = ['bg-ans-red', 'bg-ans-blue', 'bg-ans-yellow', 'bg-ans-green'];
const SHAPE_NAMES = ['Triangle', 'Diamond', 'Circle', 'Square'];
/** Timers never go below this many seconds, whatever the world scale says. */
export const MIN_SECONDS = 3;

function shuffled<T>(arr: T[], seed: number): T[] {
  // Deterministic Fisher-Yates so re-renders agree.
  const a = arr.slice();
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

interface Answered {
  chosen: number | null;
  correct: boolean;
  timeLeftFraction: number;
  pointsEarned: number;
  feedback?: MistakeFeedback;
}

function trailingCorrect(history: Answered[]): number {
  let n = 0;
  for (let i = history.length - 1; i >= 0 && history[i]!.correct; i--) n++;
  return n;
}

export function QuizBlitz({
  questions,
  secondsPerQuestion,
  timerScale = 1,
  relaxed,
  paused = false,
  mode = 'level',
  shuffle = true,
  seed = 1,
  onMistake,
  onComplete,
  onProgress,
}: QuizBlitzProps) {
  const prepared = useMemo(
    () =>
      questions.map((q, i) => ({
        ...q,
        options: shuffle ? shuffled(q.options, seed + i * 7919) : q.options,
      })),
    [questions, shuffle, seed],
  );

  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<Answered[]>([]);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [heartsLost, setHeartsLost] = useState(0);
  const completedRef = useRef(false);

  const total = prepared.length;
  const q = prepared[index]!;
  const answered = history.length > index ? history[index]! : null;
  const seconds = Math.max(MIN_SECONDS, Math.round((q.seconds ?? secondsPerQuestion) * timerScale));
  const isBoss = mode === 'boss';
  const streak = trailingCorrect(history);
  const points = history.reduce((s, a) => s + a.pointsEarned, 0);

  const commit = useCallback(
    (chosen: number | null, timeLeftFraction: number) => {
      if (answered) return;
      const correctIdx = q.options.findIndex((o) => o.correct);
      const correct = chosen !== null && chosen === correctIdx;
      let pointsEarned = 0;
      let feedback: MistakeFeedback | undefined;
      if (correct) {
        pointsEarned = bossPointsForAnswer(timeLeftFraction, streak);
      } else {
        const m: Mistake = {
          itemId: q.id,
          conceptId: q.conceptId,
          prompt: q.prompt,
          chosen: chosen === null ? 'No answer (time ran out)' : q.options[chosen]!.text,
          correctAnswer: q.options[correctIdx]!.text,
          explanation: q.explanation,
          consequence: q.consequence,
        };
        setMistakes((prev) => [...prev, m]);
        feedback = onMistake ? onMistake(m) : { heartLost: false };
        if (feedback.heartLost) setHeartsLost((n) => n + 1);
      }
      const a: Answered = { chosen, correct, timeLeftFraction, pointsEarned, feedback };
      setHistory((prev) => [...prev, a]);
      onProgress?.(history.length + 1, total);
    },
    [answered, q, streak, onMistake, onProgress, history.length, total],
  );

  const countdown = useCountdown({
    seconds,
    enabled: !relaxed,
    running: !paused && !answered,
    onExpire: () => commit(null, 0),
    resetKey: index,
  });

  const next = useCallback(() => {
    if (index + 1 < total) {
      setIndex(index + 1);
      return;
    }
    if (completedRef.current) return;
    completedRef.current = true;
    const correct = history.filter((a) => a.correct).length;
    const speed = relaxed
      ? economy.score.relaxedSpeed
      : history.reduce((s, a) => s + a.timeLeftFraction, 0) / Math.max(1, history.length);
    const itemResults: Record<string, ItemOutcome> = {};
    history.forEach((a, i) => {
      const qq = prepared[i];
      if (qq) itemResults[qq.id] = a.correct ? 'correct' : 'wrong';
    });
    onComplete({
      accuracy: correct / Math.max(1, total),
      speed,
      mistakes,
      shortcuts: [],
      itemResults,
      outcomes: emptyOutcomes(),
      correct,
      total,
      points,
      maxPoints: bossMaxPoints(total),
      heartsLost,
    });
  }, [index, total, history, relaxed, onComplete, mistakes, points, heartsLost, prepared]);

  // Auto-advance after a correct answer in timed mode; wrong answers wait for "Next".
  useEffect(() => {
    if (!answered || !answered.correct || relaxed) return;
    const id = window.setTimeout(next, 1100);
    return () => window.clearTimeout(id);
  }, [answered, relaxed, next]);

  // Keyboard: 1-4 to answer, Enter/Space for Next.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (paused) return;
      if (!answered && e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        commit(Number(e.key) - 1, countdown.fraction);
      } else if (answered && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answered, commit, countdown.fraction, next, paused]);

  const correctIdx = q.options.findIndex((o) => o.correct);
  const multiplier = streakMultiplier(streak);

  return (
    <div className="flex flex-1 flex-col gap-3" data-testid="quiz-blitz">
      <div className="flex items-center justify-between text-sm text-muted">
        <span data-testid="quiz-progress">
          Question {index + 1} of {total}
        </span>
        {isBoss ? (
          <span className="font-semibold text-fg" aria-live="polite">
            {points} pts{multiplier > 1 && <span className="ml-1 text-star">×{multiplier}</span>}
          </span>
        ) : (
          <span>{history.filter((a) => a.correct).length} correct</span>
        )}
      </div>
      <TimerBar fraction={countdown.fraction} remaining={countdown.remaining} relaxed={relaxed} />

      <motion.div
        key={q.id}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-1 flex-col gap-3"
      >
        <div className="rounded-card bg-surface p-4 shadow-card">
          <p className="text-base font-semibold leading-snug sm:text-lg" data-testid="quiz-prompt">
            <RichText text={q.prompt} />
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label="Answers">
          {q.options.map((opt, i) => {
            const isChosen = answered?.chosen === i;
            const isCorrect = i === correctIdx;
            const state = !answered ? 'idle' : isCorrect ? 'correct' : isChosen ? 'wrong' : 'dim';
            return (
              <button
                key={i}
                type="button"
                disabled={!!answered || paused}
                onClick={() => commit(i, countdown.fraction)}
                data-testid="quiz-option"
                data-state={state}
                aria-label={`${SHAPE_NAMES[i]}: ${opt.text}`}
                className={`tap relative flex min-h-[64px] items-center gap-3 rounded-2xl px-3 py-3 text-left text-base font-semibold text-white shadow-card transition
                  ${COLORS[i]} ${state === 'dim' ? 'opacity-40' : ''} ${state === 'wrong' ? 'ring-4 ring-white/80' : ''} ${
                    state === 'correct' ? 'ring-4 ring-white' : ''
                  } enabled:hover:brightness-110 enabled:active:scale-[0.98]`}
              >
                <ShapeIcon shape={SHAPES[i] ?? 'circle'} size={22} className="shrink-0 opacity-90" />
                <span className="flex-1">{opt.text}</span>
                <kbd className="hidden rounded bg-black/25 px-1.5 text-xs sm:inline">{i + 1}</kbd>
                {state === 'correct' && <CheckIcon size={22} className="shrink-0" />}
                {state === 'wrong' && <XIcon size={22} className="shrink-0" />}
              </button>
            );
          })}
        </div>

        {answered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
            aria-live="polite"
            data-testid="quiz-feedback"
            className={`rounded-card border-2 p-4 ${answered.correct ? 'border-ok bg-ok-soft text-green-950' : 'border-bad bg-bad-soft text-red-950'}`}
          >
            <p className="font-bold">
              {answered.correct ? 'Correct!' : answered.chosen === null ? 'Time ran out.' : 'Not quite.'}
              {isBoss && answered.correct && (
                <span className="ml-2 font-semibold">+{answered.pointsEarned} pts</span>
              )}
            </p>
            {!answered.correct && (
              <p className="mt-1 text-sm">
                Correct answer: <strong>{q.options[correctIdx]!.text}</strong>
              </p>
            )}
            <p className="mt-1 text-sm">{q.explanation}</p>
            {answered.feedback?.note && (
              <p className="mt-1 text-sm font-semibold">{answered.feedback.note}</p>
            )}
            {(!answered.correct || relaxed) && (
              <Button onClick={next} className="mt-3" full data-testid="quiz-next">
                {index + 1 < total ? 'Next question' : 'Finish'}
              </Button>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
