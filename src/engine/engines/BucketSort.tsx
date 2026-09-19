import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BucketSortConfig } from '@/content/types';
import { economy } from '@/content/economy';
import { emptyOutcomes, type EngineResult, type ItemOutcome } from '@/engine/scoring';
import { RichText } from '@/components/RichText';
import { Feedback, adaptFeedback, type FeedbackKind } from './Feedback';
import { seededShuffle, type EngineProps, type ScoredSnapshot } from './types';

interface Pending {
  kind: FeedbackKind;
  title: string;
  confirm?: string;
  correctAnswer?: string;
  explanation: string;
  note?: string;
}

type Snap = ScoredSnapshot & {
  index: number;
  results: Record<string, ItemOutcome>;
  buckets: Record<string, string>;
  pending: Pending | null;
};

/** Cards come one at a time; tap a bucket (or press 1–4). */
export function BucketSort(p: EngineProps<BucketSortConfig>) {
  const snap = p.snapshot as Partial<Snap> | undefined;
  const cards = useMemo(() => {
    const list = p.onlyItems ? p.config.cards.filter((c) => p.onlyItems!.includes(c.id)) : p.config.cards;
    return seededShuffle(list, p.seed);
  }, [p.config.cards, p.onlyItems, p.seed]);
  const [index, setIndex] = useState(snap?.index ?? 0);
  const [results, setResults] = useState<Record<string, ItemOutcome>>(snap?.results ?? {});
  const [buckets, setBuckets] = useState<Record<string, string>>(snap?.buckets ?? {});
  const [pending, setPending] = useState<Pending | null>(snap?.pending ?? null);

  const { onHold } = p;
  useEffect(() => {
    onHold?.(!!pending);
  }, [pending, onHold]);
  const [heartsLost, setHeartsLost] = useState(snap?.heartsLost ?? 0);
  const [mistakes, setMistakes] = useState<EngineResult['mistakes']>(snap?.mistakes ?? []);
  const [shortcuts, setShortcuts] = useState<EngineResult['shortcuts']>(snap?.shortcuts ?? []);
  const usedCarriers = useRef(new Set<string>(snap?.usedCarriers ?? []));
  const done = useRef(false);

  // Every state change is reported so the host can checkpoint per item (resume after leaving).
  const { onSnapshot } = p;
  useEffect(() => {
    onSnapshot?.({
      index,
      results,
      buckets,
      pending,
      heartsLost,
      mistakes,
      shortcuts,
      usedCarriers: [...usedCarriers.current],
    } satisfies Snap);
  }, [onSnapshot, index, results, buckets, pending, heartsLost, mistakes, shortcuts]);

  const card = cards[index];

  const finish = useCallback(
    (finalResults: Record<string, ItemOutcome>, finalBuckets: Record<string, string>) => {
      if (done.current) return;
      done.current = true;
      const all = { ...finalResults };
      for (const c of cards) if (!all[c.id]) all[c.id] = 'skipped';
      const correct = Object.values(all).filter((v) => v === 'correct').length;
      p.onComplete({
        accuracy: cards.length ? correct / cards.length : 0,
        speed: p.relaxed ? economy.score.relaxedSpeed : p.remainingFraction,
        mistakes,
        shortcuts,
        itemResults: all,
        outcomes: {
          ...emptyOutcomes(),
          buckets: finalBuckets,
          shortcutsTaken: shortcuts.map((s) => s.itemId),
        },
        correct,
        total: cards.length,
        heartsLost,
      });
    },
    [cards, mistakes, shortcuts, heartsLost, p],
  );

  useEffect(() => {
    if (p.timeUp && !done.current) finish(results, buckets);
  }, [p.timeUp, finish, results, buckets]);

  const place = (bucketId: string) => {
    if (!card || pending || p.paused) return;
    const bucket = p.config.buckets.find((b) => b.id === bucketId);
    if (!bucket) return;
    const nextBuckets = { ...buckets, [card.id]: bucketId };
    setBuckets(nextBuckets);
    if (bucket.shortcut) {
      const ev = { itemId: bucket.id, meters: bucket.shortcut.meters, why: bucket.shortcut.why };
      if (!usedCarriers.current.has(bucket.id)) {
        usedCarriers.current.add(bucket.id);
        p.onShortcut(ev);
      }
      setShortcuts((s) => [...s, ev]);
      setResults((r) => ({ ...r, [card.id]: 'shortcut' }));
      setPending({
        kind: 'shortcut',
        title: 'Shortcut taken',
        explanation: bucket.shortcut.why,
        note: 'Not counted as correct. Meters changed.',
      });
      return;
    }
    if (bucketId === card.bucketId) {
      setResults((r) => ({ ...r, [card.id]: 'correct' }));
      setPending({
        kind: 'correct',
        title: 'Correct!',
        confirm: card.confirm,
        explanation: card.explanation,
      });
      return;
    }
    const m = {
      itemId: card.id,
      conceptId: card.conceptId,
      prompt: card.text,
      chosen: bucket.label,
      correctAnswer: p.config.buckets.find((b) => b.id === card.bucketId)?.label ?? card.bucketId,
      explanation: card.explanation,
      consequence: card.consequence,
    };
    setMistakes((ms) => [...ms, m]);
    const fb = p.onMistake(m);
    if (fb.heartLost) setHeartsLost((h) => h + 1);
    setResults((r) => ({ ...r, [card.id]: 'wrong' }));
    setPending({
      kind: 'wrong',
      title: 'Not quite.',
      correctAnswer: m.correctAnswer,
      explanation: card.explanation,
      note: fb.note,
    });
  };

  const next = () => {
    setPending(null);
    if (index + 1 < cards.length) setIndex(index + 1);
    else finish(results, buckets);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (p.paused) return;
      if (!pending && e.key >= '1' && e.key <= '4') {
        const b = p.config.buckets[Number(e.key) - 1];
        if (b) place(b.id);
      } else if (pending && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!card) return null;
  const correctSoFar = Object.values(results).filter((v) => v === 'correct').length;

  const shown = adaptFeedback(p.mode, pending);

  return (
    <div className="flex flex-1 flex-col gap-3" data-testid="bucket-sort">
      <div className="flex items-center justify-between text-sm text-muted">
        <span data-testid="engine-progress">
          Card {index + 1} of {cards.length}
        </span>
        <span>{correctSoFar} correct</span>
      </div>
      <p className="text-sm font-semibold">
        <RichText text={p.config.prompt} />
      </p>
      <div className="rounded-card bg-surface p-4 shadow-card" data-testid="bucket-card">
        <RichText as="p" text={card.text} className="text-base font-semibold leading-snug sm:text-lg" />
      </div>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Buckets">
        {p.config.buckets.map((b, i) => (
          <button
            key={b.id}
            type="button"
            disabled={!!pending || p.paused}
            onClick={() => place(b.id)}
            data-testid={`bucket-${b.id}`}
            className={`tap flex min-h-[64px] flex-col items-start justify-center rounded-2xl border-2 px-3 py-2 text-left shadow-card transition enabled:active:scale-[0.98] ${
              b.shortcut ? 'border-star bg-star-soft text-amber-950' : 'border-brand-600 bg-surface text-fg'
            }`}
          >
            <span className="text-base font-bold">
              <kbd className="mr-1.5 hidden rounded bg-black/10 px-1 text-xs sm:inline">{i + 1}</kbd>
              {b.label}
            </span>
            {b.hint && <span className="text-xs text-muted">{b.hint}</span>}
          </button>
        ))}
      </div>
      {shown && (
        <Feedback
          auto={shown.auto}
          inline={shown.inline}
          ms={shown.ms}
          kind={shown.kind}
          title={shown.title}
          correctAnswer={shown.correctAnswer}
          explanation={shown.explanation}
          note={shown.note}
          nextLabel={index + 1 < cards.length ? 'Next card' : 'Finish'}
          onNext={next}
        />
      )}
    </div>
  );
}
