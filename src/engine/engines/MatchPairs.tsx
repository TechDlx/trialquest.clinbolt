import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MatchPairsConfig } from '@/content/types';
import { economy } from '@/content/economy';
import { emptyOutcomes, type EngineResult, type ItemOutcome } from '@/engine/scoring';
import { RichText } from '@/components/RichText';
import { Feedback, adaptFeedback } from './Feedback';
import { seededShuffle, type EngineProps, type ScoredSnapshot } from './types';

interface Pending {
  title: string;
  explanation: string;
  note?: string;
  finish?: boolean;
  confirm?: string;
  kind: 'correct' | 'wrong';
}

type Snap = ScoredSnapshot & {
  left: string | null;
  matched: Record<string, boolean>;
  wrong: number;
  pending: Pending | null;
};

/** Tap a left item, then a right item. */
export function MatchPairs(p: EngineProps<MatchPairsConfig>) {
  const snap = p.snapshot as Partial<Snap> | undefined;
  const pairs = useMemo(
    () => (p.onlyItems ? p.config.pairs.filter((x) => p.onlyItems!.includes(x.id)) : p.config.pairs),
    [p.config.pairs, p.onlyItems],
  );
  const rights = useMemo(() => seededShuffle(pairs, p.seed + 17), [pairs, p.seed]);
  const [left, setLeft] = useState<string | null>(snap?.left ?? null);
  const [matched, setMatched] = useState<Record<string, boolean>>(snap?.matched ?? {});
  const [wrong, setWrong] = useState(snap?.wrong ?? 0);
  const [pending, setPending] = useState<Pending | null>(snap?.pending ?? null);

  const { onHold } = p;
  useEffect(() => {
    onHold?.(!!pending);
  }, [pending, onHold]);
  const [heartsLost, setHeartsLost] = useState(snap?.heartsLost ?? 0);
  const [mistakes, setMistakes] = useState<EngineResult['mistakes']>(snap?.mistakes ?? []);
  const done = useRef(false);

  // Every state change is reported so the host can checkpoint per item (resume after leaving).
  const { onSnapshot } = p;
  useEffect(() => {
    onSnapshot?.({
      left,
      matched,
      wrong,
      pending,
      heartsLost,
      mistakes,
      shortcuts: [],
      usedCarriers: [],
    } satisfies Snap);
  }, [onSnapshot, left, matched, wrong, pending, heartsLost, mistakes]);

  const finish = useCallback(
    (m: Record<string, boolean>, w: number) => {
      if (done.current) return;
      done.current = true;
      const itemResults: Record<string, ItemOutcome> = {};
      for (const pr of pairs) itemResults[pr.id] = m[pr.id] ? 'correct' : 'skipped';
      const correct = Object.values(m).filter(Boolean).length;
      p.onComplete({
        accuracy: correct + w ? correct / (correct + w) : 0,
        speed: p.relaxed ? economy.score.relaxedSpeed : p.remainingFraction,
        mistakes,
        shortcuts: [],
        itemResults,
        outcomes: emptyOutcomes(),
        correct,
        total: pairs.length,
        heartsLost,
      });
    },
    [pairs, mistakes, heartsLost, p],
  );

  useEffect(() => {
    if (p.timeUp && !done.current) finish(matched, wrong);
  }, [p.timeUp, finish, matched, wrong]);

  const pickRight = (rightId: string) => {
    if (!left || pending || p.paused) return;
    const pair = pairs.find((x) => x.id === left)!;
    if (rightId === left) {
      const next = { ...matched, [left]: true };
      setMatched(next);
      setLeft(null);
      const all = Object.keys(next).length === pairs.length;
      setPending({
        kind: 'correct',
        title: 'Match!',
        confirm: pair.confirm,
        explanation: pair.explanation,
        finish: all,
      });
      return;
    }
    const chosen = pairs.find((x) => x.id === rightId)!;
    const m = {
      itemId: pair.id,
      conceptId: pair.conceptId,
      prompt: pair.left,
      chosen: chosen.right,
      correctAnswer: pair.right,
      explanation: pair.explanation,
      consequence: pair.consequence,
    };
    setMistakes((ms) => [...ms, m]);
    const fb = p.onMistake(m);
    if (fb.heartLost) setHeartsLost((h) => h + 1);
    setWrong((w) => w + 1);
    setLeft(null);
    setPending({ kind: 'wrong', title: 'Not a match.', explanation: pair.explanation, note: fb.note });
  };

  const next = () => {
    const wasFinish = pending?.finish;
    setPending(null);
    if (wasFinish) finish(matched, wrong);
  };

  const shown = adaptFeedback(p.mode, pending);

  return (
    <div className="flex flex-1 flex-col gap-3" data-testid="match-pairs">
      <p className="text-sm font-semibold">
        <RichText text={p.config.prompt} />
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-2" role="group" aria-label="Terms">
          {pairs.map((pr) => (
            <button
              key={pr.id}
              type="button"
              onClick={() => setLeft(left === pr.id ? null : pr.id)}
              disabled={!!matched[pr.id] || !!pending || p.paused}
              aria-pressed={left === pr.id}
              data-testid={`left-${pr.id}`}
              className={`tap rounded-2xl border-2 px-2 py-2 text-left text-sm font-semibold ${matched[pr.id] ? 'border-ok bg-ok-soft' : left === pr.id ? 'border-brand-600 bg-brand-50' : 'border-border bg-surface'}`}
            >
              <RichText text={pr.left} />
            </button>
          ))}
        </div>
        <div className="grid gap-2" role="group" aria-label="Definitions">
          {rights.map((pr) => (
            <button
              key={pr.id}
              type="button"
              onClick={() => pickRight(pr.id)}
              disabled={!!matched[pr.id] || !left || !!pending || p.paused}
              data-testid={`right-${pr.id}`}
              className={`tap rounded-2xl border-2 px-2 py-2 text-left text-sm ${matched[pr.id] ? 'border-ok bg-ok-soft' : 'border-border bg-surface'}`}
            >
              <RichText text={pr.right} />
            </button>
          ))}
        </div>
      </div>
      {shown && (
        <Feedback
          auto={shown.auto}
          inline={shown.inline}
          ms={shown.ms}
          kind={shown.kind}
          title={shown.title}
          explanation={shown.explanation}
          note={shown.note}
          nextLabel={shown.finish ? 'Finish' : 'Next'}
          onNext={next}
        />
      )}
    </div>
  );
}
