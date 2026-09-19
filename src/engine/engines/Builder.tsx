import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BuilderConfig } from '@/content/types';
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

/** Tap a part, then tap a slot (or the other way round). Check when every slot is filled. */
export function Builder(p: EngineProps<BuilderConfig>) {
  const slots = useMemo(
    () => (p.onlyItems ? p.config.slots.filter((s) => p.onlyItems!.includes(s.id)) : p.config.slots),
    [p.config.slots, p.onlyItems],
  );
  const parts = useMemo(() => {
    const list = p.onlyItems ? p.config.parts.filter((x) => p.onlyItems!.includes(x.id)) : p.config.parts;
    return seededShuffle(list, p.seed);
  }, [p.config.parts, p.onlyItems, p.seed]);
  const [placed, setPlaced] = useState<Record<string, string>>({}); // slotId -> partId
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);

  const { onHold } = p;
  useEffect(() => {
    onHold?.(!!pending);
  }, [pending, onHold]);
  const [locked, setLocked] = useState<Record<string, boolean>>({});
  const [heartsLost, setHeartsLost] = useState(0);
  const [mistakes, setMistakes] = useState<EngineResult['mistakes']>([]);
  const [shortcuts, setShortcuts] = useState<EngineResult['shortcuts']>([]);
  const usedCarriers = useRef(new Set<string>());
  const done = useRef(false);

  const evaluate = useCallback(
    (current: Record<string, string>) => {
      const itemResults: Record<string, ItemOutcome> = {};
      let correct = 0;
      for (const s of slots) {
        const partId = current[s.id];
        const part = parts.find((x) => x.id === partId);
        if (!part) itemResults[s.id] = 'skipped';
        else if (part.shortcut) itemResults[s.id] = 'shortcut';
        else if (part.slotId === s.id) {
          itemResults[s.id] = 'correct';
          correct++;
        } else itemResults[s.id] = 'wrong';
      }
      return { itemResults, correct };
    },
    [slots, parts],
  );

  const finish = useCallback(
    (current: Record<string, string>) => {
      if (done.current) return;
      done.current = true;
      const { itemResults, correct } = evaluate(current);
      p.onComplete({
        accuracy: slots.length ? correct / slots.length : 0,
        speed: p.relaxed ? economy.score.relaxedSpeed : p.remainingFraction,
        mistakes,
        shortcuts,
        itemResults,
        outcomes: { ...emptyOutcomes(), parts: current, shortcutsTaken: shortcuts.map((s) => s.itemId) },
        correct,
        total: slots.length,
        heartsLost,
      });
    },
    [evaluate, slots.length, mistakes, shortcuts, heartsLost, p],
  );

  useEffect(() => {
    if (p.timeUp && !done.current) finish(placed);
  }, [p.timeUp, finish, placed]);

  const placeInto = (slotId: string, partId: string) => {
    if (locked[slotId] || pending || p.paused) return;
    const next = { ...placed };
    for (const [s, pid] of Object.entries(next)) if (pid === partId) delete next[s];
    next[slotId] = partId;
    setPlaced(next);
    setSelectedPart(null);
    const part = parts.find((x) => x.id === partId);
    if (part?.shortcut && !usedCarriers.current.has(part.id)) {
      usedCarriers.current.add(part.id);
      const ev = { itemId: part.id, meters: part.shortcut.meters, why: part.shortcut.why };
      p.onShortcut(ev);
      setShortcuts((s) => [...s, ev]);
      setPending({
        kind: 'shortcut',
        title: 'Shortcut taken',
        explanation: part.shortcut.why,
        note: 'Not counted as correct. Meters changed.',
      });
    }
  };

  const tapSlot = (slotId: string) => {
    if (selectedPart) placeInto(slotId, selectedPart);
    else if (placed[slotId] && !locked[slotId]) {
      const next = { ...placed };
      delete next[slotId];
      setPlaced(next);
    }
  };

  const check = () => {
    const { itemResults, correct } = evaluate(placed);
    const nextLocked = { ...locked };
    for (const s of slots) if (itemResults[s.id] === 'correct') nextLocked[s.id] = true;
    setLocked(nextLocked);
    if (correct === slots.length) {
      setPending({
        kind: 'correct',
        title: 'Built!',
        explanation: 'Every part is where it belongs.',
        finish: true,
      });
      return;
    }
    const wrongSlot = slots.find((s) => itemResults[s.id] === 'wrong' || itemResults[s.id] === 'shortcut');
    if (!wrongSlot) {
      setPending({
        kind: 'info',
        title: 'Some slots are empty.',
        explanation: 'Fill every slot, then check again.',
      });
      return;
    }
    const chosen = parts.find((x) => x.id === placed[wrongSlot.id])!;
    const right = parts.find((x) => x.slotId === wrongSlot.id)!;
    if (chosen.shortcut) {
      setPending({
        kind: 'shortcut',
        title: `${wrongSlot.label}: that was the shortcut.`,
        explanation: right.explanation,
        note: 'Swap it for the real thing and check again.',
      });
      return;
    }
    const m = {
      itemId: wrongSlot.id,
      conceptId: right.conceptId,
      prompt: wrongSlot.label,
      chosen: chosen.text,
      correctAnswer: right.text,
      explanation: right.explanation,
      consequence: right.consequence,
    };
    setMistakes((ms) => [...ms, m]);
    const fb = p.onMistake(m);
    if (fb.heartLost) setHeartsLost((h) => h + 1);
    setPending({
      kind: 'wrong',
      title: `${wrongSlot.label}: not quite.`,
      explanation: `${chosen.explanation} ${right.explanation}`,
      note: fb.note,
    });
  };

  const next = () => {
    const wasFinish = pending?.finish;
    setPending(null);
    if (wasFinish) finish(placed);
  };

  const allFilled = slots.every((s) => placed[s.id]);
  const trayParts = parts.filter((x) => !Object.values(placed).includes(x.id));

  return (
    <div className="flex flex-1 flex-col gap-3" data-testid="builder">
      <p className="text-sm font-semibold">
        <RichText text={p.config.prompt} />
      </p>
      <div className="grid gap-2" role="group" aria-label="Slots">
        {slots.map((s) => {
          const part = parts.find((x) => x.id === placed[s.id]);
          const isLocked = locked[s.id];
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => tapSlot(s.id)}
              disabled={!!pending || p.paused || isLocked}
              data-testid={`slot-${s.id}`}
              data-filled={part ? 'true' : 'false'}
              className={`tap flex min-h-[56px] flex-col items-start rounded-2xl border-2 px-3 py-2 text-left transition ${
                isLocked
                  ? 'border-ok bg-ok-soft'
                  : part
                    ? 'border-brand-600 bg-surface'
                    : 'border-dashed border-border bg-surface-2'
              } ${selectedPart && !isLocked ? 'ring-4 ring-brand-300' : ''}`}
            >
              <span className="text-xs font-bold uppercase tracking-wide text-muted">{s.label}</span>
              <span className="text-sm font-semibold">
                {part ? part.text : (s.hint ?? 'Tap a part, then this slot')}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Parts">
        {trayParts.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setSelectedPart(selectedPart === x.id ? null : x.id)}
            disabled={!!pending || p.paused}
            aria-pressed={selectedPart === x.id}
            data-testid={`part-${x.id}`}
            className={`tap rounded-2xl border-2 px-3 py-2 text-left text-sm font-semibold shadow-card transition ${
              selectedPart === x.id
                ? 'border-brand-600 bg-brand-100 text-brand-800'
                : x.shortcut
                  ? 'border-star bg-star-soft text-amber-950'
                  : 'border-border bg-surface'
            }`}
          >
            <RichText text={x.text} />
          </button>
        ))}
      </div>
      {!pending && (
        <Button onClick={check} disabled={!allFilled || p.paused} full data-testid="builder-check">
          {allFilled ? 'Check the build' : 'Fill every slot to check'}
        </Button>
      )}
      {pending && (
        <Feedback
          kind={pending.kind}
          title={pending.title}
          explanation={pending.explanation}
          note={pending.note}
          nextLabel={pending.finish ? 'Finish' : 'Keep building'}
          onNext={next}
        />
      )}
    </div>
  );
}
