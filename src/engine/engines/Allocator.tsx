import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type {
  AllocatorConfig,
  AllocatorSimulation,
  DoseResponseVisual,
  MeterDelta,
  PreviewCurve,
  PriceAccessVisual,
  TrialPowerVisual,
} from '@/content/types';
import { economy } from '@/content/economy';
import { emptyOutcomes, type EngineResult, type ItemOutcome } from '@/engine/scoring';
import { Button } from '@/components/Button';
import { RichText } from '@/components/RichText';
import { Feedback, adaptFeedback, type FeedbackKind } from './Feedback';
import type { EngineProps, ScoredSnapshot } from './types';

export function interpolateCurve(curve: PreviewCurve, x: number): number {
  const pts = curve.points;
  if (x <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i]!;
    const [x0, y0] = pts[i - 1]!;
    if (x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return pts.at(-1)![1];
}

export function bandFor(sim: AllocatorSimulation, value: number) {
  const bands = sim.bands;
  const idx = bands.findIndex(
    (b, i) =>
      value >= b.range[0] - 1e-9 &&
      (i === bands.length - 1 ? value <= b.range[1] + 1e-9 : value < b.range[1]),
  );
  return { band: bands[Math.max(0, idx)]!, index: Math.max(0, idx) };
}

export function bandAccuracy(sim: AllocatorSimulation, index: number): number {
  const target = sim.bands.findIndex((b) => b.tag === sim.targetBand);
  const d = Math.abs(index - target);
  return d === 0 ? 1 : d === 1 ? 0.5 : 0;
}

/** For each meter: the worse (more negative) of the shortcut's and the band's negative deltas, once. */
export function combinedNegatives(shortcut: MeterDelta, band: MeterDelta): MeterDelta {
  const out: MeterDelta = {};
  for (const m of ['safety', 'integrity', 'timeline'] as const) {
    const a = Math.min(0, shortcut[m] ?? 0);
    const b = Math.min(0, band[m] ?? 0);
    const v = Math.min(a, b);
    if (v < 0) out[m] = v;
  }
  return out;
}

const fmt = (v: number, f?: PreviewCurve['format']) =>
  f === 'percent'
    ? `${Math.round(v)}%`
    : f === 'money'
      ? `$${v.toFixed(0)}M`
      : f === 'decimal1'
        ? v.toFixed(1)
        : String(Math.round(v));

interface Pending {
  kind: FeedbackKind;
  title: string;
  confirm?: string;
  explanation: string;
  note?: string;
  finish?: boolean;
}

type Phase = 'adjust' | 'reveal' | 'sandbox';

type Snap = ScoredSnapshot & {
  values: Record<string, number>;
  phase: Phase;
  pending: Pending | null;
  activePreset: string | null;
  committed: { value: number; bandIndex: number; accuracy: number; values: Record<string, number> } | null;
};

/** Sliders under constraints, optionally ending in a consequence simulation. */
export function Allocator(p: EngineProps<AllocatorConfig>) {
  const snap = p.snapshot as Partial<Snap> | undefined;
  const cats = p.config.categories;
  const editable = useMemo(
    () => (p.onlyItems ? cats.filter((c) => p.onlyItems!.includes(c.id)) : cats),
    [cats, p.onlyItems],
  );
  const initialValues = useMemo(() => {
    const v: Record<string, number> = {};
    for (const c of cats) v[c.id] = editable.includes(c) ? c.initial : (c.target[0] + c.target[1]) / 2;
    return v;
  }, [cats, editable]);
  const [values, setValues] = useState<Record<string, number>>(snap?.values ?? initialValues);
  const [phase, setPhase] = useState<Phase>(snap?.phase ?? 'adjust');
  const [pending, setPending] = useState<Pending | null>(snap?.pending ?? null);

  const { onHold } = p;
  useEffect(() => {
    onHold?.(!!pending || phase !== 'adjust');
  }, [pending, phase, onHold]);
  const [heartsLost, setHeartsLost] = useState(snap?.heartsLost ?? 0);
  const [mistakes, setMistakes] = useState<EngineResult['mistakes']>(snap?.mistakes ?? []);
  const [shortcuts, setShortcuts] = useState<EngineResult['shortcuts']>(snap?.shortcuts ?? []);
  const [activePreset, setActivePreset] = useState<string | null>(snap?.activePreset ?? null);
  const [committed, setCommitted] = useState<{
    value: number;
    bandIndex: number;
    accuracy: number;
    values: Record<string, number>;
  } | null>(snap?.committed ?? null);
  const usedCarriers = useRef(new Set<string>(snap?.usedCarriers ?? []));
  const done = useRef(false);

  // Every state change is reported so the host can checkpoint per item (resume after leaving).
  const { onSnapshot } = p;
  useEffect(() => {
    onSnapshot?.({
      values,
      phase,
      pending,
      activePreset,
      committed,
      heartsLost,
      mistakes,
      shortcuts,
      usedCarriers: [...usedCarriers.current],
    } satisfies Snap);
  }, [onSnapshot, values, phase, pending, activePreset, committed, heartsLost, mistakes, shortcuts]);

  const sim = p.config.simulation;
  const simValue = sim ? (values[sim.input.categoryId] ?? 0) : 0;

  const evaluate = useCallback(
    (v: Record<string, number>) => {
      const itemResults: Record<string, ItemOutcome> = {};
      let correct = 0;
      for (const c of cats) {
        const ok = v[c.id]! >= c.target[0] - 1e-9 && v[c.id]! <= c.target[1] + 1e-9;
        itemResults[c.id] = ok ? 'correct' : 'wrong';
        if (ok) correct++;
      }
      if (
        p.config.total !== undefined &&
        Math.abs(Object.values(v).reduce((s, x) => s + x, 0) - p.config.total) > 1e-9
      )
        return { itemResults, correct, totalOk: false };
      return { itemResults, correct, totalOk: true };
    },
    [cats, p.config.total],
  );

  const finish = useCallback(
    (v: Record<string, number>, sc: EngineResult['shortcuts'], commit: typeof committed) => {
      if (done.current) return;
      done.current = true;
      // The first commit is binding: sandbox edits never reach the score.
      const { itemResults, correct } = evaluate(commit ? commit.values : v);
      let accuracy = cats.length ? correct / cats.length : 0;
      let band: string | undefined;
      if (sim && commit) {
        accuracy = (accuracy + commit.accuracy) / 2;
        band = sim.bands[commit.bandIndex]!.tag;
      }
      for (const s of sc) itemResults[s.itemId] = 'shortcut';
      p.onComplete({
        accuracy,
        speed: p.relaxed ? economy.score.relaxedSpeed : p.remainingFraction,
        mistakes,
        shortcuts: sc,
        itemResults,
        outcomes: {
          ...emptyOutcomes(),
          band,
          inputValue: sim ? commit?.value : undefined,
          shortcutsTaken: sc.map((s) => s.itemId),
        },
        correct,
        total: cats.length,
        heartsLost,
      });
    },
    [evaluate, cats.length, sim, mistakes, heartsLost, p],
  );

  useEffect(() => {
    if (p.timeUp && !done.current) finish(values, shortcuts, committed);
  }, [p.timeUp, finish, values, shortcuts, committed]);

  const setValue = (id: string, v: number) => {
    const c = cats.find((x) => x.id === id)!;
    const clamped = Math.min(c.max, Math.max(c.min, Math.round(v / c.step) * c.step));
    setValues((old) => ({ ...old, [id]: Number(clamped.toFixed(6)) }));
    setActivePreset(null);
  };

  const applyPreset = (id: string) => {
    const preset = p.config.presets?.find((x) => x.id === id);
    if (!preset || pending || p.paused || phase !== 'adjust') return;
    setValues((old) => ({ ...old, ...preset.values }));
    setActivePreset(preset.shortcut ? preset.id : null);
    if (preset.shortcut && !usedCarriers.current.has(preset.id)) {
      usedCarriers.current.add(preset.id);
      const lure: MeterDelta = {};
      for (const [m, d] of Object.entries(preset.shortcut.meters))
        if ((d ?? 0) > 0) lure[m as keyof MeterDelta] = d;
      const ev = { itemId: preset.id, meters: lure, why: preset.shortcut.why };
      p.onShortcut(ev);
      setShortcuts((s) => [...s, ev]);
    }
  };

  const commit = () => {
    if (pending || p.paused) return;
    const { itemResults, correct, totalOk } = evaluate(values);
    if (!sim) {
      if (!totalOk) {
        setPending({
          kind: 'info',
          title: `The total must be ${p.config.total}.`,
          explanation: 'Adjust the sliders so they add up.',
        });
        return;
      }
      if (correct === cats.length) {
        setPending({
          kind: 'correct',
          title: 'Within every constraint.',
          explanation: cats.map((c) => c.explanation).join(' '),
          finish: true,
        });
        return;
      }
      const wrong = cats.find((c) => itemResults[c.id] === 'wrong')!;
      const m = {
        itemId: wrong.id,
        conceptId: wrong.conceptId,
        prompt: wrong.label,
        chosen: `${values[wrong.id]} ${wrong.unit}`,
        correctAnswer: `${wrong.target[0]}–${wrong.target[1]} ${wrong.unit}`,
        explanation: wrong.explanation,
        consequence: wrong.consequence,
      };
      setMistakes((ms) => [...ms, m]);
      const fb = p.onMistake(m);
      if (fb.heartLost) setHeartsLost((h) => h + 1);
      setPending({
        kind: 'wrong',
        title: `${wrong.label}: outside the safe range.`,
        explanation: wrong.explanation,
        note: fb.note,
      });
      return;
    }
    // Simulation: the first commit is binding.
    const { band, index } = bandFor(sim, simValue);
    const acc = bandAccuracy(sim, index);
    setCommitted({ value: simValue, bandIndex: index, accuracy: acc, values: { ...values } });
    const preset = activePreset ? p.config.presets?.find((x) => x.id === activePreset) : undefined;
    if (preset?.shortcut) {
      const neg = combinedNegatives(preset.shortcut.meters, band.meters ?? {});
      if (Object.keys(neg).length) p.onMeters(neg, preset.shortcut.why);
    } else if (band.meters) p.onMeters(band.meters, band.label);
    if (acc < 1) {
      const c = cats.find((x) => x.id === sim.input.categoryId)!;
      const m = {
        itemId: c.id,
        conceptId: c.conceptId,
        prompt: c.label,
        chosen: `${simValue} ${c.unit}`,
        correctAnswer: `${sim.bands.find((b) => b.tag === sim.targetBand)!.label}`,
        explanation: c.explanation,
        consequence: band.consequence ?? c.consequence,
      };
      setMistakes((ms) => [...ms, m]);
      if (acc === 0) {
        const fb = p.onMistake(m);
        if (fb.heartLost) setHeartsLost((h) => h + 1);
      }
    }
    setPhase('reveal');
  };

  const next = () => {
    const wasFinish = pending?.finish;
    setPending(null);
    if (wasFinish) finish(values, shortcuts, committed);
  };

  const finishReveal = () => {
    if (sim && p.config.sandbox !== false && sim.preview === 'on-commit' && phase === 'reveal')
      setPhase('sandbox');
    else finish(values, shortcuts, committed);
  };

  const runningTotal = Object.values(values).reduce((s, x) => s + x, 0);
  const totalOk = p.config.total === undefined || Math.abs(runningTotal - p.config.total) < 1e-9;
  const sandboxAvailable = !!sim && p.config.sandbox !== false && sim.preview === 'on-commit';
  const revealBand = committed && sim ? sim.bands[committed.bandIndex]! : undefined;
  const sandboxBand = sim && phase === 'sandbox' ? bandFor(sim, simValue).band : undefined;

  const shown = adaptFeedback(p.mode, pending);
  return (
    <div className="flex flex-1 flex-col gap-3" data-testid="allocator" data-phase={phase}>
      <p className="text-sm font-semibold">
        <RichText text={p.config.prompt} />
      </p>
      {p.config.context && (
        <ul className="rounded-card bg-surface-2 p-3 text-sm">
          {p.config.context.map((c, i) => (
            <li key={i} className="py-0.5">
              <RichText text={c} />
            </li>
          ))}
        </ul>
      )}
      {phase === 'sandbox' && (
        <div
          className="rounded-xl border-2 border-dashed border-star bg-star-soft p-2 text-center text-xs font-bold text-amber-950"
          data-testid="sandbox-banner"
        >
          What if? Exploring, not scored. Your first commit still counts.
        </div>
      )}
      {(phase === 'adjust' || phase === 'sandbox') && (
        <div className="grid gap-3">
          {cats.map((c) => {
            const v = values[c.id]!;
            const canEdit = editable.includes(c) && !pending && !p.paused;
            return (
              <div key={c.id} className="rounded-card bg-surface p-3 shadow-card">
                <div className="flex items-baseline justify-between">
                  <label htmlFor={`slider-${c.id}`} className="font-bold">
                    {c.label}
                  </label>
                  <output className="text-lg font-black tabular-nums" data-testid={`value-${c.id}`}>
                    {Number(v.toFixed(2))} {c.unit}
                  </output>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    className="tap rounded-xl border-2 border-border bg-surface-2 px-3 text-lg font-bold"
                    onClick={() => setValue(c.id, v - c.step)}
                    disabled={!canEdit}
                    aria-label={`Decrease ${c.label}`}
                  >
                    −
                  </button>
                  <input
                    id={`slider-${c.id}`}
                    type="range"
                    min={c.min}
                    max={c.max}
                    step={c.step}
                    value={v}
                    disabled={!canEdit}
                    onChange={(e) => setValue(c.id, Number(e.target.value))}
                    className="h-11 flex-1 accent-brand-600"
                    data-testid={`slider-${c.id}`}
                  />
                  <button
                    type="button"
                    className="tap rounded-xl border-2 border-border bg-surface-2 px-3 text-lg font-bold"
                    onClick={() => setValue(c.id, v + c.step)}
                    disabled={!canEdit}
                    aria-label={`Increase ${c.label}`}
                  >
                    +
                  </button>
                </div>
                {sim && sim.preview === 'live' && sim.input.categoryId === c.id && sim.curves && (
                  <ul className="mt-2 grid grid-cols-2 gap-1 text-xs">
                    {sim.curves.map((cv) => (
                      <li key={cv.id} className="rounded-lg bg-surface-2 px-2 py-1">
                        <span className="text-muted">{cv.label}: </span>
                        <strong data-testid={`curve-${cv.id}`}>
                          {fmt(interpolateCurve(cv, v), cv.format)}
                        </strong>{' '}
                        {cv.unit}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
      {p.config.total !== undefined && phase === 'adjust' && (
        <p
          className={`text-sm font-semibold ${totalOk ? 'text-ok' : 'text-bad'}`}
          data-testid="allocator-total"
          aria-live="polite"
        >
          Total: {Number(runningTotal.toFixed(2))} of {p.config.total}
          {totalOk
            ? ''
            : ` (${runningTotal > p.config.total ? 'over' : 'under'} by ${Number(Math.abs(runningTotal - p.config.total).toFixed(2))})`}
        </p>
      )}
      {phase === 'adjust' && p.config.presets && !pending && (
        <div className="flex flex-wrap gap-2">
          {p.config.presets.map((pr) => (
            <button
              key={pr.id}
              type="button"
              onClick={() => applyPreset(pr.id)}
              disabled={p.paused}
              data-testid={`preset-${pr.id}`}
              className={`tap rounded-2xl border-2 px-3 py-2 text-left text-sm font-semibold ${pr.shortcut ? 'border-star bg-star-soft text-amber-950' : 'border-border bg-surface'}`}
            >
              {pr.label}
            </button>
          ))}
        </div>
      )}
      {phase === 'adjust' && !pending && (
        <Button onClick={commit} disabled={p.paused} full data-testid="allocator-commit">
          {sim ? sim.commitLabel : 'Commit'}
        </Button>
      )}
      {phase === 'reveal' && sim && revealBand && committed && (
        <Reveal
          sim={sim}
          band={revealBand}
          value={committed.value}
          scored
          onDone={finishReveal}
          doneLabel={sandboxAvailable ? 'Try "what if?"' : 'Continue'}
          onSkip={sandboxAvailable ? () => finish(values, shortcuts, committed) : undefined}
        />
      )}
      {phase === 'sandbox' && sim && sandboxBand && (
        <>
          <Reveal sim={sim} band={sandboxBand} value={simValue} scored={false} />
          <Button onClick={() => finish(values, shortcuts, committed)} full data-testid="sandbox-done">
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
          nextLabel={shown.finish ? 'Finish' : 'Adjust'}
          onNext={next}
        />
      )}
    </div>
  );
}

function Reveal({
  sim,
  band,
  value,
  scored,
  onDone,
  doneLabel,
  onSkip,
}: {
  sim: AllocatorSimulation;
  band: AllocatorSimulation['bands'][number];
  value: number;
  scored: boolean;
  onDone?: () => void;
  doneLabel?: string;
  onSkip?: () => void;
}) {
  const exposureCurveId = (band.visual as { exposureCurve?: string }).exposureCurve;
  const curve = sim.curves?.find((c) => c.id === exposureCurveId);
  const dr = band.visual as DoseResponseVisual;
  const tp = band.visual as TrialPowerVisual;
  const pa = band.visual as PriceAccessVisual;
  // When a curve shares a name with a visual field, the reveal reads it at the committed value,
  // so the projection agrees with the live preview instead of quoting the band's representative case.
  const curveAt = (id: string) => {
    const c = sim.curves?.find((x) => x.id === id);
    return c ? interpolateCurve(c, value) : undefined;
  };
  const power = curveAt('power') ?? tp.power;
  const costMillions = curveAt('cost') ?? tp.costMillions;
  const months = curveAt('months') ?? tp.months;
  const successes = curveAt('power') !== undefined ? Math.round(power) : tp.successfulRunsOf100;
  const coveragePct = curveAt('coverage') ?? pa.coveragePct;
  const patientsReachedPct = curveAt('reached') ?? pa.patientsReachedPct;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-card bg-surface p-4 shadow-card"
      data-testid="reveal"
      data-band={band.tag}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-muted">
        {scored ? 'Projection' : 'What if?'} · {Number(value.toFixed(2))} {sim.input.unit} · {band.label}
      </p>
      {sim.kind === 'dose-response' && (
        <CohortVisual
          cohort={dr.cohort}
          fine={dr.fine}
          mild={dr.mild}
          serious={dr.serious}
          seconds={sim.revealSeconds}
        />
      )}
      {sim.kind === 'trial-power' && (
        <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <Stat label="Power" value={`${Math.round(power)}%`} />
          <Stat label="Cost" value={`$${Number(costMillions.toFixed(1))}M`} />
          <Stat label="Months" value={String(Math.round(months))} />
          <Stat label="Successes of 100 runs" value={String(successes)} />
        </dl>
      )}
      {sim.kind === 'price-access' && (
        <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
          <Stat label="Payer coverage" value={`${Math.round(coveragePct)}%`} />
          <Stat label="Patients reached" value={`${Math.round(patientsReachedPct)}%`} />
          <Stat label="Revenue index" value={String(pa.revenueIndex)} />
        </dl>
      )}
      {curve && (
        <p className="mt-2 text-sm">
          {curve.label}:{' '}
          <strong data-testid="reveal-exposure">{fmt(interpolateCurve(curve, value), curve.format)}</strong>{' '}
          {curve.unit}
        </p>
      )}
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-2 px-2 py-1">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}

function CohortVisual({
  cohort,
  fine,
  mild,
  serious,
  seconds,
}: {
  cohort: number;
  fine: number;
  mild: number;
  serious: number;
  seconds: number;
}) {
  const states = [
    ...Array(serious).fill('serious'),
    ...Array(mild).fill('mild'),
    ...Array(Math.max(0, cohort - mild - serious)).fill('fine'),
  ].slice(0, cohort) as ('fine' | 'mild' | 'serious')[];
  const color = { fine: 'bg-ok text-white', mild: 'bg-star text-white', serious: 'bg-bad text-white' };
  const label = { fine: 'fine', mild: 'mild AE', serious: 'serious AE' };

  return (
    <div className="mt-2">
      <div
        className="flex flex-wrap gap-2"
        role="img"
        aria-label={`${fine} fine, ${mild} mild, ${serious} serious of ${cohort} volunteers`}
      >
        {states.map((s, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: Math.min(seconds, 6) * (i / Math.max(1, cohort)) * 0.6,
              type: 'spring',
              stiffness: 260,
              damping: 18,
            }}
            className={`flex h-12 w-12 flex-col items-center justify-center rounded-full text-[10px] font-bold ${color[s]}`}
          >
            <span aria-hidden="true">●</span>
            {label[s]}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
