import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SequenceSortConfig } from '@/content/types';
import { economy } from '@/content/economy';
import { emptyOutcomes, type EngineResult, type ItemOutcome } from '@/engine/scoring';
import { Button } from '@/components/Button';
import { RichText } from '@/components/RichText';
import { Feedback, type FeedbackKind } from './Feedback';
import { seededShuffle, type EngineProps } from './types';

interface Pending {
  kind: FeedbackKind;
  title: string;
  explanation: string;
  note?: string;
  finish?: boolean;
}

/** Put items in order with up/down buttons (or tap two items to swap). Check when ready. */
export function SequenceSort(p: EngineProps<SequenceSortConfig>) {
  const correctOrder = useMemo(() => {
    const list = p.onlyItems ? p.config.items.filter((i) => p.onlyItems!.includes(i.id)) : p.config.items;
    return list;
  }, [p.config.items, p.onlyItems]);
  const [order, setOrder] = useState(() => seededShuffle(correctOrder, p.seed).map((i) => i.id));
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [locked, setLocked] = useState<Record<string, boolean>>({});
  const [heartsLost, setHeartsLost] = useState(0);
  const [mistakes, setMistakes] = useState<EngineResult['mistakes']>([]);
  const done = useRef(false);

  const evaluate = useCallback(
    (o: string[]) => {
      const itemResults: Record<string, ItemOutcome> = {};
      let correct = 0;
      o.forEach((id, i) => {
        const ok = correctOrder[i]?.id === id;
        itemResults[id] = ok ? 'correct' : 'wrong';
        if (ok) correct++;
      });
      return { itemResults, correct };
    },
    [correctOrder],
  );

  const finish = useCallback(
    (o: string[]) => {
      if (done.current) return;
      done.current = true;
      const { itemResults, correct } = evaluate(o);
      p.onComplete({
        accuracy: o.length ? correct / o.length : 0,
        speed: p.relaxed ? economy.score.relaxedSpeed : p.remainingFraction,
        mistakes,
        shortcuts: [],
        itemResults,
        outcomes: emptyOutcomes(),
        correct,
        total: o.length,
        heartsLost,
      });
    },
    [evaluate, mistakes, heartsLost, p],
  );

  useEffect(() => {
    if (p.timeUp && !done.current) finish(order);
  }, [p.timeUp, finish, order]);

  const move = (id: string, dir: -1 | 1) => {
    const i = order.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= order.length || locked[id] || locked[order[j]!]) return;
    const next = order.slice();
    [next[i], next[j]] = [next[j]!, next[i]!];
    setOrder(next);
  };

  const tap = (id: string) => {
    if (locked[id] || pending) return;
    if (!selected) setSelected(id);
    else if (selected === id) setSelected(null);
    else {
      const i = order.indexOf(selected);
      const j = order.indexOf(id);
      const next = order.slice();
      [next[i], next[j]] = [next[j]!, next[i]!];
      setOrder(next);
      setSelected(null);
    }
  };

  const check = () => {
    const { itemResults, correct } = evaluate(order);
    const nextLocked = { ...locked };
    for (const [id, r] of Object.entries(itemResults)) if (r === 'correct') nextLocked[id] = true;
    setLocked(nextLocked);
    if (correct === order.length) {
      setPending({
        kind: 'correct',
        title: 'In order!',
        explanation: 'Every step is in its place.',
        finish: true,
      });
      return;
    }
    const firstWrongIdx = order.findIndex((id) => itemResults[id] === 'wrong');
    const shouldBe = correctOrder[firstWrongIdx]!;
    const isThere = correctOrder.find((x) => x.id === order[firstWrongIdx])!;
    const m = {
      itemId: shouldBe.id,
      conceptId: shouldBe.conceptId,
      prompt: `Step ${firstWrongIdx + 1}`,
      chosen: isThere.text,
      correctAnswer: shouldBe.text,
      explanation: shouldBe.explanation,
      consequence: shouldBe.consequence,
    };
    setMistakes((ms) => [...ms, m]);
    const fb = p.onMistake(m);
    if (fb.heartLost) setHeartsLost((h) => h + 1);
    setPending({
      kind: 'wrong',
      title: `Step ${firstWrongIdx + 1} is out of place.`,
      explanation: shouldBe.explanation,
      note: fb.note,
    });
  };

  const next = () => {
    const wasFinish = pending?.finish;
    setPending(null);
    if (wasFinish) finish(order);
  };

  return (
    <div className="flex flex-1 flex-col gap-3" data-testid="sequence-sort">
      <p className="text-sm font-semibold">
        <RichText text={p.config.prompt} />
      </p>
      <ol className="grid gap-2" aria-label="Steps">
        {order.map((id, i) => {
          const item = correctOrder.find((x) => x.id === id)!;
          const isLocked = locked[id];
          return (
            <li
              key={id}
              className={`flex items-center gap-2 rounded-2xl border-2 p-2 ${isLocked ? 'border-ok bg-ok-soft' : selected === id ? 'border-brand-600 bg-brand-50' : 'border-border bg-surface'}`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
                {i + 1}
              </span>
              <button
                type="button"
                onClick={() => tap(id)}
                disabled={isLocked || !!pending || p.paused}
                aria-pressed={selected === id}
                data-testid={`seq-${id}`}
                className="tap flex-1 text-left text-sm font-semibold"
              >
                <RichText text={item.text} />
              </button>
              <div className="flex flex-col">
                <button
                  type="button"
                  aria-label={`Move ${item.text} up`}
                  onClick={() => move(id, -1)}
                  disabled={isLocked || i === 0 || !!pending || p.paused}
                  className="tap rounded-lg px-2 text-lg leading-none"
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label={`Move ${item.text} down`}
                  onClick={() => move(id, 1)}
                  disabled={isLocked || i === order.length - 1 || !!pending || p.paused}
                  className="tap rounded-lg px-2 text-lg leading-none"
                >
                  ▼
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      {!pending && (
        <Button onClick={check} disabled={p.paused} full data-testid="sequence-check">
          Check the order
        </Button>
      )}
      {pending && (
        <Feedback
          kind={pending.kind}
          title={pending.title}
          explanation={pending.explanation}
          note={pending.note}
          nextLabel={pending.finish ? 'Finish' : 'Fix it'}
          onNext={next}
        />
      )}
    </div>
  );
}
