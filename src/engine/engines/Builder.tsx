import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BuilderConfig, BuilderSimulation, PkNextDoseVisual } from '@/content/types';
import { motion } from 'framer-motion';
import { economy } from '@/content/economy';
import { emptyOutcomes, type EngineResult, type ItemOutcome } from '@/engine/scoring';
import { Button } from '@/components/Button';
import { RichText } from '@/components/RichText';
import { Feedback, adaptFeedback, type FeedbackKind } from './Feedback';
import { seededShuffle, type EngineProps, type ScoredSnapshot } from './types';

interface Pending {
  kind: FeedbackKind;
  title: string;
  confirm?: string;
  explanation: string;
  note?: string;
  finish?: boolean;
}

type Snap = ScoredSnapshot & {
  placed: Record<string, string>;
  selectedPart: string | null;
  pending: Pending | null;
  phase: 'build' | 'reveal' | 'sandbox';
  committed: { placed: Record<string, string>; bandIndex: number; accuracy: number } | null;
  locked: Record<string, boolean>;
};

/** Tap a part, then tap a slot (or the other way round). Check when every slot is filled. */
export function Builder(p: EngineProps<BuilderConfig>) {
  const snap = p.snapshot as Partial<Snap> | undefined;
  const slots = useMemo(
    () => (p.onlyItems ? p.config.slots.filter((s) => p.onlyItems!.includes(s.id)) : p.config.slots),
    [p.config.slots, p.onlyItems],
  );
  const parts = useMemo(() => {
    const list = p.onlyItems ? p.config.parts.filter((x) => p.onlyItems!.includes(x.id)) : p.config.parts;
    return seededShuffle(list, p.seed);
  }, [p.config.parts, p.onlyItems, p.seed]);
  const [placed, setPlaced] = useState<Record<string, string>>(snap?.placed ?? {}); // slotId -> partId
  const [selectedPart, setSelectedPart] = useState<string | null>(snap?.selectedPart ?? null);
  const [pending, setPending] = useState<Pending | null>(snap?.pending ?? null);
  const sim = p.config.simulation;
  const [phase, setPhase] = useState<'build' | 'reveal' | 'sandbox'>(snap?.phase ?? 'build');
  const [committed, setCommitted] = useState<{
    placed: Record<string, string>;
    bandIndex: number;
    accuracy: number;
  } | null>(snap?.committed ?? null);

  const { onHold } = p;
  useEffect(() => {
    onHold?.(!!pending || phase !== 'build');
  }, [pending, phase, onHold]);
  const [locked, setLocked] = useState<Record<string, boolean>>(snap?.locked ?? {});
  const [heartsLost, setHeartsLost] = useState(snap?.heartsLost ?? 0);
  const [mistakes, setMistakes] = useState<EngineResult['mistakes']>(snap?.mistakes ?? []);
  const [shortcuts, setShortcuts] = useState<EngineResult['shortcuts']>(snap?.shortcuts ?? []);
  const usedCarriers = useRef(new Set<string>(snap?.usedCarriers ?? []));
  const done = useRef(false);

  // Every state change is reported so the host can checkpoint per item (resume after leaving).
  const { onSnapshot } = p;
  useEffect(() => {
    onSnapshot?.({
      placed,
      selectedPart,
      pending,
      phase,
      committed,
      locked,
      heartsLost,
      mistakes,
      shortcuts,
      usedCarriers: [...usedCarriers.current],
    } satisfies Snap);
  }, [onSnapshot, placed, selectedPart, pending, phase, committed, locked, heartsLost, mistakes, shortcuts]);

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
      // With a simulation the first check is binding: score the committed build, not sandbox edits.
      const scored = sim && committed ? committed.placed : current;
      const ev = evaluate(scored);
      const itemResults = ev.itemResults;
      let correct = ev.correct;
      let accuracy = slots.length ? correct / slots.length : 0;
      let band: string | undefined;
      if (sim && committed) {
        // The simulation slot is right only when the committed band is the target band.
        itemResults[sim.slotId] = committed.accuracy === 1 ? 'correct' : 'wrong';
        correct = Object.values(itemResults).filter((v) => v === 'correct').length;
        accuracy = (accuracy + committed.accuracy) / 2;
        band = sim.bands[committed.bandIndex]!.tag;
      }
      p.onComplete({
        accuracy,
        speed: p.relaxed ? economy.score.relaxedSpeed : p.remainingFraction,
        mistakes,
        shortcuts,
        itemResults,
        outcomes: { ...emptyOutcomes(), band, parts: scored, shortcutsTaken: shortcuts.map((s) => s.itemId) },
        correct,
        total: slots.length,
        heartsLost,
      });
    },
    [evaluate, slots.length, mistakes, shortcuts, heartsLost, p, sim, committed],
  );

  useEffect(() => {
    if (p.timeUp && !done.current) finish(placed);
  }, [p.timeUp, finish, placed]);

  const placeInto = (slotId: string, partId: string) => {
    if (locked[slotId] || pending || p.paused || phase === 'reveal') return;
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
    if (sim) {
      const partId = placed[sim.slotId];
      const idx = sim.bands.findIndex((b) => partId !== undefined && b.parts.includes(partId));
      const bandIndex = Math.max(0, idx);
      const band = sim.bands[bandIndex]!;
      const target = sim.bands.findIndex((b) => b.tag === sim.targetBand);
      const d = Math.abs(bandIndex - target);
      const acc = d === 0 ? 1 : d === 1 ? 0.5 : 0;
      setCommitted({ placed: { ...placed }, bandIndex, accuracy: acc });
      if (band.meters) p.onMeters(band.meters, band.label);
      if (acc < 1) {
        const slot = slots.find((x) => x.id === sim.slotId)!;
        const chosen = parts.find((x) => x.id === partId);
        const right = parts.find((x) => x.slotId === slot.id)!;
        const m = {
          itemId: slot.id,
          conceptId: right.conceptId,
          prompt: slot.label,
          chosen: chosen?.text ?? 'nothing',
          correctAnswer: right.text,
          explanation: right.explanation,
          consequence: band.consequence ?? right.consequence,
        };
        setMistakes((ms) => [...ms, m]);
        if (acc === 0) {
          const fb = p.onMistake(m);
          if (fb.heartLost) setHeartsLost((h) => h + 1);
        }
      }
      setPhase('reveal');
      return;
    }
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

  const shown = adaptFeedback(p.mode, pending);

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
                {part ? (
                  <RichText text={part.text} interactive={false} />
                ) : (
                  (s.hint ?? 'Tap a part, then this slot')
                )}
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
            <RichText text={x.text} interactive={false} />
          </button>
        ))}
      </div>
      {phase === 'sandbox' && (
        <div
          className="rounded-xl border-2 border-dashed border-star bg-star-soft p-2 text-center text-xs font-bold text-amber-950"
          data-testid="sandbox-banner"
        >
          What if? Exploring, not scored. Your first check still counts.
        </div>
      )}
      {!pending && phase === 'build' && (
        <Button onClick={check} disabled={!allFilled || p.paused} full data-testid="builder-check">
          {allFilled ? (sim ? sim.commitLabel : 'Check the build') : 'Fill every slot to check'}
        </Button>
      )}
      {sim && phase === 'reveal' && committed && (
        <PkReveal
          sim={sim}
          bandIndex={committed.bandIndex}
          scored
          onDone={() => (p.config.sandbox === false ? finish(placed) : setPhase('sandbox'))}
          doneLabel={p.config.sandbox === false ? 'Continue' : 'Try "what if?"'}
          onSkip={p.config.sandbox === false ? undefined : () => finish(placed)}
        />
      )}
      {sim && phase === 'sandbox' && (
        <>
          <PkReveal
            sim={sim}
            bandIndex={Math.max(
              0,
              sim.bands.findIndex(
                (b) => placed[sim.slotId] !== undefined && b.parts.includes(placed[sim.slotId]!),
              ),
            )}
            scored={false}
          />
          <Button onClick={() => finish(placed)} full data-testid="sandbox-done">
            Done exploring
          </Button>
        </>
      )}
      {shown && (
        <Feedback
          auto={shown.auto}
          inline={shown.inline}
          ms={shown.ms}
          kind={shown.kind}
          title={shown.title}
          explanation={shown.explanation}
          note={shown.note}
          nextLabel={shown.finish ? 'Finish' : 'Keep building'}
          onNext={next}
        />
      )}
    </div>
  );
}

/** PK chart for the pk-next-dose simulation: exposure curve against the safety ceiling. */
function PkReveal({
  sim,
  bandIndex,
  scored,
  onDone,
  doneLabel,
  onSkip,
}: {
  sim: BuilderSimulation;
  bandIndex: number;
  scored: boolean;
  onDone?: () => void;
  doneLabel?: string;
  onSkip?: () => void;
}) {
  const band = sim.bands[bandIndex]!;
  const v = band.visual as PkNextDoseVisual;
  const maxT = Math.max(...v.points.map((pt) => pt.t), 1);
  const maxC = Math.max(v.safetyCeiling, ...v.points.map((pt) => pt.c)) * 1.15;
  const x = (t: number) => 10 + (t / maxT) * 180;
  const y = (c: number) => 90 - (c / maxC) * 80;
  const d = v.points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${x(pt.t).toFixed(1)} ${y(pt.c).toFixed(1)}`)
    .join(' ');
  const over = v.exposure > v.safetyCeiling;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-card bg-surface p-4 shadow-card"
      data-testid="reveal"
      data-band={band.tag}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-muted">
        {scored ? 'Projection' : 'What if?'} · {band.label}
      </p>
      <svg
        viewBox="0 0 200 100"
        className="mt-2 h-40 w-full"
        role="img"
        aria-label={`Exposure ${v.exposure} against a safety ceiling of ${v.safetyCeiling}`}
      >
        <line
          x1="10"
          x2="190"
          y1={y(v.safetyCeiling)}
          y2={y(v.safetyCeiling)}
          stroke="currentColor"
          strokeDasharray="4 3"
          className="text-bad"
        />
        <text x="12" y={y(v.safetyCeiling) - 3} className="fill-current text-bad" fontSize="7">
          safety ceiling
        </text>
        <motion.path
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={over ? 'text-bad' : 'text-brand-600'}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: Math.min(sim.revealSeconds, 6) * 0.6 }}
        />
        <line x1="10" x2="190" y1="90" y2="90" stroke="currentColor" className="text-border" />
      </svg>
      <p className="text-sm">
        Peak exposure <strong data-testid="reveal-exposure">{v.exposure}</strong> vs ceiling {v.safetyCeiling}
      </p>
      <RichText as="p" text={band.narration} className="mt-2 text-sm leading-relaxed" />
      {onDone && (
        <Button onClick={onDone} className="mt-3" full data-testid="reveal-done">
          {doneLabel ?? 'Continue'}
        </Button>
      )}
      {onSkip && (
        <Button variant="ghost" onClick={onSkip} className="mt-1" full data-testid="reveal-skip">
          Continue
        </Button>
      )}
    </motion.div>
  );
}
