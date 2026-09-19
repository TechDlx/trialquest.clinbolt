import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ImpostorConfig } from '@/content/types';
import { economy } from '@/content/economy';
import { emptyOutcomes, type EngineResult, type ItemOutcome } from '@/engine/scoring';
import { Button } from '@/components/Button';
import { RichText } from '@/components/RichText';
import { CheckIcon, XIcon } from '@/components/Icons';
import { Feedback, type FeedbackKind } from './Feedback';
import { seededShuffle, type EngineProps } from './types';

interface Pending {
  kind: FeedbackKind;
  title: string;
  explanation: string;
  note?: string;
  finish?: boolean;
}

/** Tap a card to inspect it; accuse the one that matches the target. */
export function Impostor(p: EngineProps<ImpostorConfig>) {
  const cards = useMemo(() => {
    const list = p.onlyItems ? p.config.cards.filter((c) => p.onlyItems!.includes(c.id)) : p.config.cards;
    return seededShuffle(list, p.seed);
  }, [p.config.cards, p.onlyItems, p.seed]);
  const impostorCount = cards.filter((c) => c.impostor).length;
  const [inspected, setInspected] = useState<string | null>(null);
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, ItemOutcome>>({});
  const [accused, setAccused] = useState<string[]>([]);
  const [pending, setPending] = useState<Pending | null>(null);

  const { onHold } = p;
  useEffect(() => {
    onHold?.(!!pending);
  }, [pending, onHold]);
  const [heartsLost, setHeartsLost] = useState(0);
  const [mistakes, setMistakes] = useState<EngineResult['mistakes']>([]);
  const [shortcuts, setShortcuts] = useState<EngineResult['shortcuts']>([]);
  const done = useRef(false);

  const finish = useCallback(
    (res: Record<string, ItemOutcome>, acc: string[], sc: EngineResult['shortcuts']) => {
      if (done.current) return;
      done.current = true;
      const all = { ...res };
      for (const c of cards) if (!all[c.id]) all[c.id] = c.impostor ? 'wrong' : 'skipped';
      const correctAcc = acc.filter((id) => cards.find((c) => c.id === id)?.impostor).length;
      const missed = cards.filter((c) => c.impostor && !acc.includes(c.id)).length;
      const denom = acc.length + missed;
      p.onComplete({
        accuracy: denom ? correctAcc / denom : 0,
        speed: p.relaxed ? economy.score.relaxedSpeed : p.remainingFraction,
        mistakes,
        shortcuts: sc,
        itemResults: all,
        outcomes: { ...emptyOutcomes(), accused: acc, shortcutsTaken: sc.map((s) => s.itemId) },
        correct: correctAcc,
        total: impostorCount,
        heartsLost,
      });
    },
    [cards, impostorCount, mistakes, heartsLost, p],
  );

  useEffect(() => {
    if (p.timeUp && !done.current) finish(results, accused, shortcuts);
  }, [p.timeUp, finish, results, accused, shortcuts]);

  const accuse = (id: string) => {
    if (pending || p.paused) return;
    const card = cards.find((c) => c.id === id);
    if (!card || results[id]) return;
    const nextAccused = [...accused, id];
    setAccused(nextAccused);
    if (card.impostor) {
      const nextRes = { ...results, [id]: 'correct' as ItemOutcome };
      setResults(nextRes);
      const found = nextAccused.filter((x) => cards.find((c) => c.id === x)?.impostor).length;
      const finished = found >= impostorCount;
      setPending({
        kind: 'correct',
        title: `Found ${p.config.targetLabel}.`,
        explanation: card.explanation,
        finish: finished,
      });
      return;
    }
    const m = {
      itemId: id,
      conceptId: card.conceptId,
      prompt: p.config.prompt,
      chosen: card.title,
      correctAnswer: cards.find((c) => c.impostor)?.title ?? '',
      explanation: card.explanation,
      consequence: card.consequence,
    };
    setMistakes((ms) => [...ms, m]);
    const fb = p.onMistake(m);
    if (fb.heartLost) setHeartsLost((h) => h + 1);
    setResults((r) => ({ ...r, [id]: 'wrong' }));
    setPending({
      kind: 'wrong',
      title: `${card.title} is not ${p.config.targetLabel}.`,
      explanation: card.explanation,
      note: fb.note,
    });
  };

  const signOff = () => {
    const so = p.config.signOff;
    if (!so || pending || p.paused) return;
    const ev = { itemId: so.id, meters: so.shortcut.meters, why: so.shortcut.why };
    p.onShortcut(ev);
    const sc = [...shortcuts, ev];
    setShortcuts(sc);
    setPending({
      kind: 'shortcut',
      title: 'Signed off without checking.',
      explanation: so.shortcut.why,
      note: 'Uninspected cards count as skipped.',
      finish: true,
    });
  };

  const next = () => {
    const wasFinish = pending?.finish;
    setPending(null);
    setInspected(null);
    if (wasFinish) finish(results, accused, shortcuts);
  };

  const found = accused.filter((x) => cards.find((c) => c.id === x)?.impostor).length;
  const current = inspected ? cards.find((c) => c.id === inspected) : undefined;

  return (
    <div className="flex flex-1 flex-col gap-3" data-testid="impostor">
      <div className="flex items-center justify-between text-sm text-muted">
        <span data-testid="engine-progress">
          Found {found} of {impostorCount}
        </span>
        <span>{Object.keys(seen).length} inspected</span>
      </div>
      <p className="text-sm font-semibold">
        <RichText text={p.config.prompt} />
      </p>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Cards">
        {cards.map((c) => {
          const state = results[c.id];
          return (
            <button
              key={c.id}
              type="button"
              disabled={!!pending || p.paused || !!state}
              onClick={() => {
                setInspected(c.id);
                setSeen((s) => ({ ...s, [c.id]: true }));
              }}
              aria-pressed={inspected === c.id}
              data-testid={`card-${c.id}`}
              data-state={state ?? (seen[c.id] ? 'seen' : 'unseen')}
              className={`tap flex min-h-[56px] items-center justify-between rounded-2xl border-2 px-3 py-2 text-left text-sm font-bold shadow-card transition ${
                state === 'correct'
                  ? 'border-ok bg-ok-soft text-green-950'
                  : state === 'wrong'
                    ? 'border-bad bg-bad-soft text-red-950 opacity-70'
                    : inspected === c.id
                      ? 'border-brand-600 bg-brand-50 text-brand-800'
                      : seen[c.id]
                        ? 'border-border bg-surface'
                        : 'border-dashed border-border bg-surface-2'
              }`}
            >
              <span>{c.title}</span>
              {state === 'correct' && <CheckIcon size={18} />}
              {state === 'wrong' && <XIcon size={18} />}
            </button>
          );
        })}
      </div>
      {current && !pending && !results[current.id] && (
        <div className="rounded-card bg-surface p-4 shadow-card" data-testid="impostor-detail">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">{current.title}</p>
          <ul className="mt-1 grid gap-1 text-sm">
            {current.lines.map((l, i) => (
              <li key={i}>• {l}</li>
            ))}
          </ul>
          <Button onClick={() => accuse(current.id)} className="mt-3" full data-testid="impostor-accuse">
            This is {p.config.targetLabel}
          </Button>
        </div>
      )}
      {p.config.signOff && !pending && (
        <button
          type="button"
          onClick={signOff}
          disabled={p.paused}
          data-testid={`shortcut-${p.config.signOff.id}`}
          className="tap rounded-2xl border-2 border-star bg-star-soft px-3 py-2 text-left text-sm font-semibold text-amber-950"
        >
          {p.config.signOff.label}
        </button>
      )}
      {pending && (
        <Feedback
          kind={pending.kind}
          title={pending.title}
          explanation={pending.explanation}
          note={pending.note}
          nextLabel={pending.finish ? 'Finish' : 'Keep looking'}
          onNext={next}
        />
      )}
    </div>
  );
}
