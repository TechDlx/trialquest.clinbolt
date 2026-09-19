import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { content } from '@/content';
import { economy } from '@/content/economy';
import type { CrisisRound, MainPathConfig, MeterDelta, Stage } from '@/content/types';
import { navigate } from '@/app/router';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import type { EngineResult, Mistake, ShortcutEvent } from '@/engine/scoring';
import {
  applyMeterDelta,
  crisisRoundPoints,
  scoreCrisis,
  setbackCopy,
  type CrisisRoundOutcome,
  type CrisisScore,
} from '@/engine/pipeline';
import { loseHeart } from '@/engine/hearts';
import { evaluateCrisisEmits } from '@/engine/artifacts';
import { applyStagePatch } from '@/engine/variants';
import { EngineHost } from '@/engine/EngineHost';
import { useCountdown } from '@/engine/useCountdown';
import { TaskShell } from '@/engine/TaskShell';
import { Button } from '@/components/Button';
import { Page, TopBar } from '@/components/Layout';
import { Hearts, TimerBar } from '@/components/Hud';
import { BadgeGlyph } from '@/components/BadgeGlyph';
import { SirenIcon } from '@/components/Icons';
import { RichText } from '@/components/RichText';
import { Speech } from '@/components/Mascot';
import { Debrief } from './Debrief';
import { StoryBeatView } from './StoryBeat';

type Phase =
  | { name: 'intro' }
  | { name: 'badge' }
  | { name: 'play' }
  | { name: 'between'; cleared: boolean }
  | { name: 'done'; score: CrisisScore }
  | { name: 'setback'; reason: string };

const snap = () => {
  const s = useProgress.getState();
  return { hearts: s.hearts, heartsUpdatedAt: s.heartsUpdatedAt, meters: s.meters };
};

/** Crisis boss: one shared clock, rapid badge swaps through the world's roles, one existing engine per round. */
export function CrisisScreen({ crisisId }: { crisisId: string }) {
  const crisis = content.crisisById[crisisId];
  const world = crisis ? content.worldById[crisis.worldId] : undefined;
  const progress = useProgress();
  const relaxed = useSettings((s) => s.relaxed);
  const [phase, setPhase] = useState<Phase>({ name: 'intro' });
  const [paused, setPaused] = useState(false);
  const [round, setRound] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [outcomes, setOutcomes] = useState<CrisisRoundOutcome[]>([]);
  const [locals, setLocals] = useState<Record<string, string>>({});
  const heartLostThisAttempt = useRef(false);
  const roundStartRef = useRef(0);
  const usedCarriers = useRef(new Set<string>());

  const rounds = useMemo(() => crisis?.rounds ?? [], [crisis]);
  const outcomesRef = useRef<CrisisRoundOutcome[]>([]);
  const phaseRef = useRef<Phase>({ name: 'intro' });
  useEffect(() => {
    outcomesRef.current = outcomes;
    phaseRef.current = phase;
  });
  const slack = crisis?.slack ?? economy.crisis.slack;
  const pool = Math.round(rounds.reduce((s, r) => s + r.seconds, 0) * (1 + slack));
  const clearThreshold = crisis?.clearThreshold ?? economy.crisis.clearThreshold;
  const passFraction = crisis?.passFraction ?? economy.crisis.passFraction;
  const timed = !relaxed;
  const clock = useCountdown({
    seconds: pool,
    enabled: timed,
    running: phase.name === 'play' && !paused,
    resetKey: attempt,
    onExpire: () => {
      if (phaseRef.current.name !== 'play') return;
      const done = outcomesRef.current;
      const remaining = rounds
        .slice(done.length)
        .map(() => ({ cleared: false, accuracy: 0, timeUsedFraction: 1, points: 0 }));
      finishCrisisRef.current([...done, ...remaining], false, true);
    },
  });
  const poolExpired = timed && clock.expired;

  useEffect(() => {
    progress.syncHearts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crisisId]);

  /** The round as the player sees it: crisis-local variants applied. */
  const current: { round: CrisisRound; stage: Stage; brief: string; meterHit: MeterDelta } | undefined =
    useMemo(() => {
      const r = rounds[round];
      if (!r) return undefined;
      let stage: Stage = { id: r.id, game: r.game };
      let brief = r.brief;
      let meterHit = r.meterHit;
      for (const v of r.variants ?? []) {
        if (!Object.entries(v.when).every(([k, tag]) => locals[k] === tag)) continue;
        if (v.patch.stage) stage = applyStagePatch(stage, v.patch.stage, `${r.id}`);
        if (v.patch.brief) brief = v.patch.brief;
        if (v.patch.meterHit) meterHit = v.patch.meterHit;
      }
      return { round: r, stage, brief, meterHit };
    }, [rounds, round, locals]);

  const finishCrisisRef = useRef<(all: CrisisRoundOutcome[], meterZero: boolean, expired?: boolean) => void>(
    () => {},
  );
  const finishCrisis = useCallback(
    (all: CrisisRoundOutcome[], meterZero: boolean, expired = false) => {
      if (!crisis || !world) return;
      const s = useProgress.getState();
      const firstTry = (s.crises[crisis.id]?.attempts ?? 0) === 0;
      const score = scoreCrisis(all, {
        totalRounds: rounds.length,
        passFraction,
        poolExpired: expired,
        meterZero,
        firstTry,
      });
      s.recordCrisisResult(crisis.id, { stars: score.stars, points: score.points, xp: score.xp });
      if (score.outcome === 'success') {
        s.touchStreak();
        const bonus = s.completeWorld(world.id);
        if (bonus.xpGained > 0) {
          score.xp.lines.push({ label: 'Meters kept high', xp: bonus.xpGained });
          score.xp.total = score.xp.lines.reduce((sum, l) => sum + l.xp, 0);
        }
      }
      setPhase({ name: 'done', score });
    },
    [crisis, world, rounds.length, passFraction],
  );
  useEffect(() => {
    finishCrisisRef.current = finishCrisis;
  }, [finishCrisis]);

  const start = () => {
    setOutcomes([]);
    setLocals({});
    setRound(0);
    heartLostThisAttempt.current = false;
    usedCarriers.current.clear();
    setAttempt((a) => a + 1);
    setPaused(false);
    setPhase({ name: 'badge' });
  };

  useEffect(() => {
    if (phase.name !== 'badge') return;
    const id = window.setTimeout(() => {
      roundStartRef.current = Date.now();
      setPhase({ name: 'play' });
    }, 700);
    return () => window.clearTimeout(id);
  }, [phase.name]);

  const applyDelta = useCallback((delta: MeterDelta): boolean => {
    const out = applyMeterDelta(snap(), delta);
    useProgress.getState().commitSnapshot(out.snapshot);
    if (out.setback) {
      const sb = setbackCopy[out.setback];
      setPhase({ name: 'setback', reason: `${sb.title}: ${sb.text}` });
      return true;
    }
    return false;
  }, []);

  const onMistake = useCallback((_m: Mistake) => ({ heartLost: false }), []); // rounds punish via meterHit, not per mistake
  const onShortcut = useCallback(
    (ev: ShortcutEvent) => {
      if (usedCarriers.current.has(ev.itemId)) return;
      usedCarriers.current.add(ev.itemId);
      applyDelta(ev.meters);
    },
    [applyDelta],
  );

  const onRoundComplete = useCallback(
    (r: EngineResult) => {
      if (!current) return;
      const used = Math.min(1, (Date.now() - roundStartRef.current) / 1000 / current.round.seconds);
      const cleared = r.accuracy >= clearThreshold;
      const streakBefore = (() => {
        let n = 0;
        for (let i = outcomes.length - 1; i >= 0 && outcomes[i]!.cleared; i--) n++;
        return n;
      })();
      const points = cleared ? crisisRoundPoints(relaxed ? 0.5 : used, streakBefore) : 0;
      const next = [
        ...outcomes,
        { cleared, accuracy: r.accuracy, timeUsedFraction: relaxed ? 0.5 : used, points },
      ];
      setOutcomes(next);
      setLocals((l) => ({ ...l, ...evaluateCrisisEmits(current.round.emits, r) }));
      let meterZero = false;
      if (!cleared) {
        if (!heartLostThisAttempt.current) {
          heartLostThisAttempt.current = true;
          const s = useProgress.getState();
          s.commitSnapshot({
            ...loseHeart({ hearts: s.hearts, heartsUpdatedAt: s.heartsUpdatedAt }),
            meters: s.meters,
          });
        }
        meterZero = applyDelta(current.meterHit);
      }
      if (meterZero) return;
      if (round + 1 < rounds.length) setPhase({ name: 'between', cleared });
      else finishCrisis(next, false);
    },
    [current, clearThreshold, outcomes, relaxed, round, rounds.length, applyDelta, finishCrisis],
  );

  if (!crisis || !world) {
    return (
      <Page nav="map">
        <TopBar title="Crisis not found" back={{ name: 'map' }} />
      </Page>
    );
  }
  const goMap = () => navigate({ name: 'map', worldId: world.id });
  const role = current ? content.roleRefById[current.round.roleId] : undefined;

  if (phase.name === 'intro') {
    return (
      <Page>
        <TopBar
          title={`World ${world.number} · Crisis`}
          back={{ name: 'map', worldId: world.id }}
          right={<Hearts hearts={progress.hearts} />}
        />
        <div className="rounded-card bg-bad p-4 text-white shadow-card">
          <div className="flex items-center gap-2">
            <SirenIcon size={26} />
            <h1 className="text-xl font-black">{crisis.title}</h1>
          </div>
          {crisis.situation.map((s, i) => (
            <RichText key={i} as="p" text={s} className="mt-2 text-sm leading-relaxed text-white/95" />
          ))}
          <ul className="mt-3 grid gap-1 text-sm">
            <li>
              🪪 {rounds.length} rounds, one role each:{' '}
              {rounds.map((r) => content.roleRefById[r.roleId]?.shortTitle).join(', ')}.
            </li>
            <li>
              ⏱️ {relaxed ? 'Relaxed mode: no clock.' : `One shared clock: ${pool} seconds for everything.`}
            </li>
            <li>
              ✅ Clear {Math.round(passFraction * 100)}% of rounds to resolve the crisis and unlock the next
              world.
            </li>
            <li>❤️ At most one heart per attempt. Failed rounds hit the meters.</li>
          </ul>
        </div>
        <Speech mood="cheer" className="mt-3">
          Every badge you earned in this world, back to back. Go.
        </Speech>
        {progress.hearts <= 0 ? (
          <div className="mt-4 rounded-card border-2 border-heart/50 bg-surface p-4 text-sm">
            <p className="font-bold">No hearts left.</p>
            <Button variant="secondary" full className="mt-3" onClick={() => navigate({ name: 'codex' })}>
              Open the Codex
            </Button>
          </div>
        ) : (
          <Button size="lg" full className="mt-4" onClick={start} data-testid="start-crisis">
            Start the crisis
          </Button>
        )}
      </Page>
    );
  }

  if (phase.name === 'badge' || phase.name === 'between') {
    const next = phase.name === 'between' ? rounds[round + 1] : rounds[round];
    const nextRole = next ? content.roleRefById[next.roleId] : undefined;
    return (
      <TaskShell
        title={crisis.title}
        hearts={progress.hearts}
        meters={progress.meters}
        paused={false}
        onPause={() => {}}
        onQuit={goMap}
      >
        <TimerBar fraction={clock.fraction} remaining={clock.remaining} relaxed={!timed} />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 flex flex-col items-center gap-3 text-center"
          data-testid="crisis-badge"
        >
          {phase.name === 'between' && (
            <p className={`text-lg font-black ${phase.cleared ? 'text-ok' : 'text-bad'}`}>
              {phase.cleared ? 'Round cleared' : 'Round missed'}
            </p>
          )}
          {nextRole && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white">
                <BadgeGlyph icon={nextRole.badgeIcon} size={34} />
              </div>
              <p className="text-sm font-bold">Badge swap: {nextRole.title}</p>
            </>
          )}
          {phase.name === 'between' && (
            <Button
              size="lg"
              full
              onClick={() => {
                setRound(round + 1);
                setPhase({ name: 'badge' });
              }}
              data-testid="crisis-next-round"
            >
              Next round
            </Button>
          )}
        </motion.div>
      </TaskShell>
    );
  }

  if (phase.name === 'play' && current && role) {
    return (
      <TaskShell
        title={`${role.shortTitle} · round ${round + 1}/${rounds.length}`}
        hearts={progress.hearts}
        meters={progress.meters}
        paused={paused}
        onPause={setPaused}
        onQuit={goMap}
      >
        <TimerBar fraction={clock.fraction} remaining={clock.remaining} relaxed={!timed} />
        <p className="text-sm font-semibold" data-testid="crisis-brief">
          <RichText text={current.brief} />
          <span className="ml-2 text-xs text-muted">(budget {current.round.seconds}s)</span>
        </p>
        <EngineHost
          key={`${attempt}:${round}`}
          config={current.stage.game as MainPathConfig}
          onlyItems={current.round.onlyItems}
          seed={attempt * 1000 + round}
          paused={paused}
          relaxed={relaxed}
          remainingFraction={timed ? clock.fraction : 1}
          timeUp={poolExpired}
          mode="crisis"
          onMistake={onMistake}
          onShortcut={onShortcut}
          onMeters={(d) => applyDelta(d)}
          onComplete={onRoundComplete}
        />
      </TaskShell>
    );
  }

  if (phase.name === 'setback') {
    return (
      <Debrief
        kind="boss"
        title={crisis.title}
        stars={0}
        score={0}
        xp={{ total: 0, lines: [] }}
        mistakes={[]}
        correct={outcomes.filter((o) => o.cleared).length}
        total={rounds.length}
        failed
        failReason={phase.reason}
        canRetry={progress.hearts > 0}
        onContinue={goMap}
        onRetry={start}
      />
    );
  }

  if (phase.name === 'done') {
    const { score } = phase;
    const beat = crisis.resolution[score.outcome];
    return (
      <StoryBeatView
        beat={beat}
        kicker={
          score.outcome === 'success'
            ? `Crisis resolved · ${score.clearedCount}/${rounds.length} rounds · ${score.points} pts · +${score.xp.total} XP`
            : score.outcome === 'partial'
              ? `Partly resolved · ${score.clearedCount}/${rounds.length} rounds`
              : 'Crisis failed'
        }
        cta={score.outcome === 'success' ? "See Maya's story" : 'Try again'}
        testId={`crisis-${score.outcome}`}
        onContinue={() =>
          score.outcome === 'success'
            ? navigate({ name: 'story', worldId: world.id, beat: 'outro' })
            : start()
        }
        doseLine={
          score.outcome === 'success'
            ? `${score.stars} star${score.stars === 1 ? '' : 's'}. ${score.stars === 3 ? 'Flawless.' : 'Replay for more.'}`
            : 'No hearts lost beyond the first miss. Meters tell the story.'
        }
      />
    );
  }
  return null;
}
