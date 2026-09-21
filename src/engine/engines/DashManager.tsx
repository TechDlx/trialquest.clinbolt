import { useCallback, useEffect, useRef, useState } from 'react';
import type { DashConfig } from '@/content/types';
import { economy } from '@/content/economy';
import { emptyOutcomes, type EngineResult, type ItemOutcome } from '@/engine/scoring';
import { RichText } from '@/components/RichText';
import { MayaTag } from '@/components/MayaTag';
import { Feedback, adaptFeedback } from './Feedback';
import type { EngineProps, ScoredSnapshot } from './types';

interface Live {
  id: string;
  step: number;
  patience: number; // seconds left
  outcome?: ItemOutcome;
  shortcut?: boolean;
}

const TICK = 250;

interface Pending {
  kind: 'correct' | 'wrong' | 'shortcut';
  title: string;
  confirm?: string;
  explanation: string;
  note?: string;
}

type Snap = ScoredSnapshot & {
  elapsed: number;
  live: Record<string, Live>;
  selected: string | null;
  pending: Pending | null;
  wrongItems: string[];
};

/** Queue of items with patience bars; select an item, tap the right station in order. */
export function DashManager(p: EngineProps<DashConfig>) {
  const items = p.onlyItems ? p.config.items.filter((i) => p.onlyItems!.includes(i.id)) : p.config.items;
  const patienceScale = p.onlyItems ? 1.5 : 1;
  const snap = p.snapshot as Partial<Snap> | undefined;
  const [, setElapsed] = useState(0);
  const [live, setLive] = useState<Record<string, Live>>(snap?.live ?? {});
  const [selected, setSelected] = useState<string | null>(snap?.selected ?? null);
  // Items served after a wrong station: served, but not a clean run.
  const [wrongItems, setWrongItems] = useState<string[]>(snap?.wrongItems ?? []);
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
  const liveRef = useRef(live);
  const elapsedRef = useRef(snap?.elapsed ?? 0);
  useEffect(() => {
    liveRef.current = live;
  }, [live]);
  // Checkpoint on arrivals, steps and outcomes, not on every patience tick.
  const liveKey = Object.values(live)
    .map((l) => `${l.id}:${l.step}:${l.outcome ?? ''}`)
    .join(',');
  const { onSnapshot } = p;
  useEffect(() => {
    onSnapshot?.({
      elapsed: elapsedRef.current,
      live: liveRef.current,
      selected,
      pending,
      wrongItems,
      heartsLost,
      mistakes,
      shortcuts,
      usedCarriers: [...usedCarriers.current],
    } satisfies Snap);
  }, [onSnapshot, liveKey, selected, pending, wrongItems, heartsLost, mistakes, shortcuts]);

  const finish = useCallback(
    (state: Record<string, Live>) => {
      if (done.current) return;
      done.current = true;
      const itemResults: Record<string, ItemOutcome> = {};
      let patienceLeft = 0;
      for (const it of items) {
        const l = state[it.id];
        itemResults[it.id] =
          l?.outcome === 'correct' && wrongItems.includes(it.id) ? 'wrong' : (l?.outcome ?? 'skipped');
        if (l?.outcome === 'correct')
          patienceLeft += Math.max(0, l.patience) / (it.patienceSeconds * patienceScale);
      }
      const correct = Object.values(itemResults).filter((v) => v === 'correct').length;
      p.onComplete({
        accuracy: items.length ? correct / items.length : 0,
        speed: p.relaxed ? economy.score.relaxedSpeed : correct ? patienceLeft / correct : 0,
        mistakes,
        shortcuts,
        itemResults,
        outcomes: { ...emptyOutcomes(), shortcutsTaken: shortcuts.map((s) => s.itemId) },
        correct,
        total: items.length,
        heartsLost,
      });
    },
    [items, patienceScale, mistakes, shortcuts, heartsLost, wrongItems, p],
  );

  const handleExpire = useCallback(
    (id: string) => {
      const expired = items.find((it) => it.id === id);
      if (!expired) return;
      const m = {
        itemId: expired.id,
        conceptId: expired.conceptId,
        prompt: expired.label,
        chosen: 'Left waiting',
        correctAnswer: expired.steps
          .map((st) => p.config.stations.find((x) => x.id === st)?.label)
          .join(' → '),
        explanation: expired.explanation,
        consequence: expired.consequence,
      };
      setMistakes((ms) => [...ms, m]);
      const fb = p.onMistake(m);
      if (fb.heartLost) setHeartsLost((h) => h + 1);
      setSelected((sel) => (sel === id ? null : sel));
      setPending({
        kind: 'wrong',
        title: `${expired.label} waited too long.`,
        explanation: expired.explanation,
        note: fb.note,
      });
    },
    [items, p],
  );

  // Callbacks and flags the clock reads live in refs, so the interval survives the host's
  // 100 ms countdown re-renders instead of being torn down before it can fire.
  const handleExpireRef = useRef(handleExpire);
  const relaxedRef = useRef(p.relaxed);
  useEffect(() => {
    handleExpireRef.current = handleExpire;
    relaxedRef.current = p.relaxed;
  });

  // Clock: arrivals, patience decay and expiry, all inside the tick, measured in wall-clock
  // time so dropped or late ticks cannot drift from the stage countdown.
  useEffect(() => {
    if (p.paused || pending || done.current) return;
    let last = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const dt = (now - last) / 1000;
      last = now;
      const relaxed = relaxedRef.current;
      elapsedRef.current += dt;
      const state = liveRef.current;
      const next = { ...state };
      let expiredId: string | undefined;
      for (const it of items) {
        const l = next[it.id];
        if (!l && elapsedRef.current >= it.arrivesAt)
          next[it.id] = { id: it.id, step: 0, patience: it.patienceSeconds * patienceScale };
        else if (l && !l.outcome) {
          const decay = relaxed ? dt / 3 : dt;
          const patience = l.patience - decay;
          if (patience <= 0 && !relaxed && !expiredId) {
            expiredId = it.id;
            next[it.id] = { ...l, patience: 0, outcome: 'wrong' };
          } else next[it.id] = { ...l, patience };
        }
      }
      liveRef.current = next;
      setLive(next);
      setElapsed(elapsedRef.current);
      if (expiredId) handleExpireRef.current(expiredId);
    }, TICK);
    return () => window.clearInterval(id);
  }, [p.paused, pending, items, patienceScale]);

  // All resolved or time up -> finish.
  useEffect(() => {
    const allDone = items.every((it) => live[it.id]?.outcome);
    if ((allDone && items.length > 0 && !pending) || p.timeUp) finish(live);
  }, [live, items, pending, p.timeUp, finish]);

  const tapStation = (stationId: string) => {
    if (!selected || pending || p.paused) return;
    const it = items.find((x) => x.id === selected)!;
    const l = live[selected]!;
    const station = p.config.stations.find((s) => s.id === stationId)!;
    if (station.shortcut) {
      if (!usedCarriers.current.has(station.id)) {
        usedCarriers.current.add(station.id);
        const ev = { itemId: station.id, meters: station.shortcut.meters, why: station.shortcut.why };
        p.onShortcut(ev);
        setShortcuts((s) => [...s, ev]);
      }
      setLive((s) => ({ ...s, [selected]: { ...l, outcome: 'shortcut', shortcut: true } }));
      setSelected(null);
      setPending({
        kind: 'shortcut',
        title: 'Shortcut taken',
        explanation: station.shortcut.why,
        note: 'Served, but not counted as correct.',
      });
      return;
    }
    if (it.steps[l.step] === stationId) {
      const step = l.step + 1;
      const doneItem = step >= it.steps.length;
      setLive((s) => ({ ...s, [selected]: { ...l, step, outcome: doneItem ? 'correct' : undefined } }));
      if (doneItem) setSelected(null);
      return;
    }
    const m = {
      itemId: it.id,
      conceptId: it.conceptId,
      prompt: it.label,
      chosen: station.label,
      correctAnswer: p.config.stations.find((s) => s.id === it.steps[l.step])?.label ?? '',
      explanation: it.explanation,
      consequence: it.consequence,
    };
    setMistakes((ms) => [...ms, m]);
    setWrongItems((w) => (w.includes(it.id) ? w : [...w, it.id]));
    const fb = p.onMistake(m);
    if (fb.heartLost) setHeartsLost((h) => h + 1);
    setPending({
      kind: 'wrong',
      title: `${it.label}: wrong station.`,
      explanation: it.explanation,
      note: fb.note,
    });
  };

  const queue = items.filter((it) => live[it.id] && !live[it.id]!.outcome);

  const shown = adaptFeedback(p.mode, pending);

  return (
    <div className="flex flex-1 flex-col gap-3" data-testid="dash-manager">
      <p className="text-sm font-semibold">
        <RichText text={p.config.prompt} />
      </p>
      <div className="grid gap-2" role="group" aria-label="Queue">
        {queue.length === 0 && <p className="text-sm text-muted">Waiting for the next arrival…</p>}
        {queue.map((it) => {
          const l = live[it.id]!;
          const frac = Math.max(0, l.patience / (it.patienceSeconds * patienceScale));
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => setSelected(selected === it.id ? null : it.id)}
              aria-pressed={selected === it.id}
              disabled={!!pending || p.paused}
              data-testid={`dash-item-${it.id}`}
              className={`tap rounded-2xl border-2 p-2 text-left ${selected === it.id ? 'border-brand-600 bg-brand-50' : 'border-border bg-surface'}`}
            >
              <div className="flex items-center justify-between text-sm font-bold">
                <span className="flex items-center gap-2">
                  {it.label}
                  {p.cameo?.itemId === it.id && <MayaTag label={p.cameo.label} />}
                </span>
                {p.hints !== false && (
                  <span className="text-xs text-muted">
                    next: {p.config.stations.find((s) => s.id === it.steps[l.step])?.label}
                  </span>
                )}
              </div>
              <div
                className="mt-1 h-2 overflow-hidden rounded-full bg-border"
                role="meter"
                aria-label="Patience"
                aria-valuenow={Math.round(frac * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={`h-full ${frac < 0.3 ? 'bg-bad' : 'bg-brand-500'}`}
                  style={{ width: `${frac * 100}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label="Stations">
        {p.config.stations.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => tapStation(s.id)}
            disabled={!selected || !!pending || p.paused}
            data-testid={`station-${s.id}`}
            className={`tap rounded-2xl border-2 px-2 py-3 text-sm font-bold ${s.shortcut ? 'border-star bg-star-soft text-amber-950' : 'border-brand-600 bg-surface'} disabled:opacity-50`}
          >
            <kbd className="mr-1 hidden rounded bg-black/10 px-1 text-xs sm:inline">{i + 1}</kbd>
            {s.label}
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
          explanation={shown.explanation}
          note={shown.note}
          nextLabel="Continue"
          onNext={() => setPending(null)}
        />
      )}
    </div>
  );
}
