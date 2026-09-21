import { useCallback, useEffect, useRef, useState } from 'react';
import { content } from '@/content';
import { labLevelById } from '@/content/lab';
import { economy } from '@/content/economy';
import type { MeterDelta } from '@/content/types';
import type { StoredArtifact } from '@/content/artifacts';
import { navigate } from '@/app/router';
import { useProgress, type LevelAttempt } from '@/store/progress';
import { useSettings } from '@/store/settings';
import type { EngineResult, Mistake, ShortcutEvent } from '@/engine/scoring';
import {
  applyMeterDelta,
  applyMistake,
  failureReason,
  scoreLevel,
  setbackCopy,
  type LevelScore,
} from '@/engine/pipeline';
import { buildLevel } from '@/engine/variants';
import { evaluateEmits } from '@/engine/artifacts';
import { msToNextHeart } from '@/engine/hearts';
import { TaskShell } from '@/engine/TaskShell';
import { StageRunner, type StageCheckpoint } from '@/engine/StageRunner';
import { Button } from '@/components/Button';
import { Page, TopBar } from '@/components/Layout';
import { RichText } from '@/components/RichText';
import { Speech } from '@/components/Mascot';
import { Chip, Hearts } from '@/components/Hud';
import { HeartsSheet } from '@/components/HeartsSheet';
import { Debrief } from './Debrief';
import { employerLabel } from './BadgeSwap';
import { endSegment, startSegment } from '@/engine/timing';

type Phase =
  | { name: 'intro' }
  | { name: 'playing' }
  | { name: 'debrief'; result: EngineResult; score: LevelScore; artifacts: StoredArtifact[] }
  | { name: 'failed'; mistakes: Mistake[]; reason: string };

const snap = () => {
  const s = useProgress.getState();
  return { hearts: s.hearts, heartsUpdatedAt: s.heartsUpdatedAt, meters: s.meters };
};

/** Thin host for a level. All rule logic lives in engine/pipeline.ts; variants in engine/variants.ts. */
export function LevelScreen({ levelId }: { levelId: string }) {
  const raw = content.levelById[levelId] ?? labLevelById[levelId];
  const isLab = !content.levelById[levelId] && !!labLevelById[levelId];
  const role = raw ? (content.roleById[raw.roleId] ?? content.roleRefById[raw.roleId]) : undefined;
  const world = raw ? content.worldById[raw.worldId] : undefined;
  const progress = useProgress();
  const relaxed = useSettings((s) => s.relaxed);
  const [phase, setPhase] = useState<Phase>({ name: 'intro' });
  const [paused, setPaused] = useState(false);
  const [seed, setSeed] = useState(1);
  // Out of hearts mid-level: the engine stays mounted (clock held) while the player recovers a heart.
  const [heartsGate, setHeartsGate] = useState(false);
  // Checkpoint of the attempt in progress: completed stages and where to resume.
  const [resumeFrom, setResumeFrom] =
    useState<Pick<LevelAttempt, 'nextIndex' | 'byStage' | 'engine' | 'remaining'>>();
  const savedAttempt = isLab ? undefined : progress.attempts[levelId];
  const freeUsed = useRef(false);
  const usedCarriers = useRef(new Set<string>());
  const hasCardFlipped = isLab || (raw ? !!progress.cardsViewed[raw.roleId]?.flipped : false);
  // Built once per attempt so the artifact assignment is fixed for the run.
  const [level, setLevel] = useState(() =>
    raw ? buildLevel(raw, useProgress.getState().artifacts) : undefined,
  );

  useEffect(() => {
    if (!raw) return;
    progress.syncHearts();
    progress.startWorld(raw.worldId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId]);

  useEffect(() => {
    if (raw && role && !hasCardFlipped) navigate({ name: 'role', roleId: role.id, levelId }, true);
  }, [raw, role, hasCardFlipped, levelId]);

  const fail = useCallback(
    (reason: string, mistakes: Mistake[]) => setPhase({ name: 'failed', mistakes, reason }),
    [],
  );

  const start = useCallback(
    (attempt?: LevelAttempt) => {
      freeUsed.current = attempt?.freeUsed ?? false;
      usedCarriers.current.clear();
      setPaused(false);
      setHeartsGate(false);
      setSeed(attempt?.seed ?? (Date.now() % 1_000_000) + 1);
      setResumeFrom(
        attempt
          ? {
              nextIndex: attempt.nextIndex,
              byStage: attempt.byStage,
              engine: attempt.engine,
              remaining: attempt.remaining,
            }
          : undefined,
      );
      const built = raw ? buildLevel(raw, useProgress.getState().artifacts) : undefined;
      setLevel(built);
      if (raw && !attempt) {
        // A fresh run: drop any checkpoint and pay the level's opening meter cost (a resumed run already did).
        useProgress.getState().clearAttempt(raw.id);
        if (built && Object.keys(built.meterOpening).length) {
          const out = applyMeterDelta(snap(), built.meterOpening);
          useProgress.getState().commitSnapshot(out.snapshot);
        }
      }
      setPhase({ name: 'playing' });
    },
    [raw],
  );
  const startFresh = useCallback(() => start(), [start]);
  const resume = useCallback(() => start(savedAttempt), [start, savedAttempt]);

  const onCheckpoint = useCallback(
    (c: StageCheckpoint) => {
      if (!raw || isLab) return;
      useProgress.getState().saveAttempt(raw.id, { seed, ...c, freeUsed: freeUsed.current });
    },
    [raw, isLab, seed],
  );

  const onMistake = useCallback(
    (m: Mistake) => {
      if (!raw || !world) return { heartLost: false };
      const out = applyMistake(snap(), {
        firstMistakeFree: world.firstMistakeFree,
        freeUsed: freeUsed.current,
        meterFocus: raw.meterFocus ?? 'integrity',
      });
      freeUsed.current = out.freeUsed;
      if (out.heartLost) useProgress.getState().commitSnapshot(out.snapshot);
      if (out.setback) {
        fail(failureReason(out)!, [m]);
      } else if (out.outOfHearts) {
        // Keep the level exactly where it is; the sheet lets the player win a heart back and continue.
        const saved = isLab ? undefined : useProgress.getState().attempts[raw.id];
        if (saved) useProgress.getState().saveAttempt(raw.id, { ...saved, freeUsed: out.freeUsed });
        setHeartsGate(true);
      }
      return { heartLost: out.heartLost, note: out.note };
    },
    [raw, world, fail, isLab],
  );

  const applyDelta = useCallback(
    (delta: MeterDelta) => {
      const out = applyMeterDelta(snap(), delta);
      useProgress.getState().commitSnapshot(out.snapshot);
      if (out.setback) {
        const sb = setbackCopy[out.setback];
        fail(`${sb.title}: ${sb.text}`, []);
      }
    },
    [fail],
  );

  const onShortcut = useCallback(
    (ev: ShortcutEvent) => {
      if (!raw) return;
      if (usedCarriers.current.has(ev.itemId)) return;
      usedCarriers.current.add(ev.itemId);
      applyDelta(ev.meters);
      // A shortcut that hurts safety or integrity is a situation to review later.
      if ((ev.meters.safety ?? 0) < 0 || (ev.meters.integrity ?? 0) < 0) {
        const stage =
          raw.stages.find((s) => JSON.stringify(s.game).includes(`"${ev.itemId}"`)) ?? raw.stages[0];
        useProgress.getState().recordSituation(raw.id, stage.id, ev.itemId, false);
      }
    },
    [raw, applyDelta],
  );

  const onComplete = useCallback(
    (result: EngineResult, byStage: Record<string, EngineResult>) => {
      if (!raw || !level) return;
      const s = useProgress.getState();
      s.clearAttempt(raw.id);
      const firstTime = !s.levels[raw.id]?.completedAt;
      const earned = scoreLevel(result, { firstTime, previousStars: s.levels[raw.id]?.stars ?? 0 });
      s.recordLevelResult(raw.id, { stars: earned.stars, score: earned.score, xp: earned.xp });
      // The card's first-view XP was granted on the card screen; list it so the total matches the map.
      const cardXp = firstTime && earned.stars > 0 ? economy.xp.roleCardFirstView : 0;
      const score: typeof earned = cardXp
        ? {
            ...earned,
            xp: {
              total: earned.xp.total + cardXp,
              lines: [{ label: 'Role card first read', xp: cardXp }, ...earned.xp.lines],
            },
          }
        : earned;
      if (score.stars > 0) s.touchStreak();
      let artifacts: StoredArtifact[] = [];
      if (score.stars > 0) {
        artifacts = evaluateEmits(level.emits, { byStage, level: result }, raw.id);
        s.setArtifacts(artifacts);
      }
      for (const stage of level.stages) {
        const r = byStage[stage.id];
        if (!r) continue;
        for (const [itemId, outcome] of Object.entries(r.itemResults)) {
          if (outcome === 'wrong') s.recordSituation(raw.id, stage.id, itemId, false);
          else if (outcome === 'correct') s.recordSituation(raw.id, stage.id, itemId, true);
        }
      }
      startSegment(`debrief ${raw.id}`);
      setPhase({ name: 'debrief', result, score, artifacts });
    },
    [raw, level],
  );

  if (!raw || !role || !world || !level) {
    return (
      <Page nav="map">
        <TopBar title="Level not found" back={{ name: 'map' }} />
      </Page>
    );
  }
  if (!hasCardFlipped) return null;

  const goMap = () => {
    endSegment(`debrief ${raw.id}`);
    navigate({ name: 'map', worldId: world.id });
  };
  const readCard = () => navigate({ name: 'role', roleId: role.id, levelId: raw.id });

  if (phase.name === 'intro') {
    const noHearts = progress.hearts <= 0;
    const wait = msToNextHeart({ hearts: progress.hearts, heartsUpdatedAt: progress.heartsUpdatedAt });
    const tipId = 'level-first';
    return (
      <Page>
        <TopBar
          title={`World ${world.number} · ${role.shortTitle}`}
          back={{ name: 'map', worldId: world.id }}
          right={<Hearts hearts={progress.hearts} />}
        />
        <div className="rounded-card bg-surface p-4 shadow-card">
          <Chip color="bg-brand-700">{employerLabel[role.employer]}</Chip>
          <h1 className="mt-2 text-2xl font-black">{level.title}</h1>
          <RichText as="p" text={level.intro} className="mt-2 text-base leading-relaxed" />
          <ul className="mt-3 grid gap-1 text-sm text-muted">
            <li>
              🎯{' '}
              {level.stages.length === 1
                ? `One task: ${level.stages[0].title ?? 'do the job'}.`
                : `${level.stages.length} stages: ${level.stages.map((s) => s.title).join(', ')}.`}
            </li>
            <li>
              ⏱️{' '}
              {relaxed
                ? 'Relaxed mode: no timers.'
                : level.stages.some((s) => 'seconds' in s.game)
                  ? 'Timed stages. Faster is better.'
                  : 'Untimed: take your time on each decision.'}
            </li>
            <li>
              ❤️ A mistake costs a heart{world.firstMistakeFree ? ' (first slip is free here)' : ''}.
              Shortcuts cost meters instead.
            </li>
          </ul>
        </div>
        {!progress.tipsDismissed[tipId] && (
          <Speech mood="happy" className="mt-3" onDismiss={() => progress.dismissTip(tipId)}>
            Do the job the way the role card described it. Every wrong turn comes with an explanation.
          </Speech>
        )}
        {noHearts ? (
          <div className="mt-4 rounded-card border-2 border-heart/50 bg-surface p-4 text-sm">
            <p className="font-bold">No hearts left.</p>
            <p className="mt-1 text-muted">
              Next heart in about {wait ? Math.ceil(wait / 60_000) : economy.hearts.refillMinutes} minutes, or
              review any Role Card in the Codex for +1 heart.
            </p>
            <Button variant="secondary" full className="mt-3" onClick={() => navigate({ name: 'codex' })}>
              Open the Codex
            </Button>
          </div>
        ) : savedAttempt && (savedAttempt.nextIndex > 0 || savedAttempt.engine) ? (
          <div className="mt-4 flex flex-col gap-2">
            <Button size="lg" full onClick={resume} data-testid="resume-level">
              {savedAttempt.engine ? 'Continue where you left off' : 'Continue'} (stage{' '}
              {Math.min(savedAttempt.nextIndex, level.stages.length - 1) + 1} of {level.stages.length})
            </Button>
            <Button variant="ghost" full onClick={startFresh} data-testid="start-level">
              Start over
            </Button>
          </div>
        ) : (
          <Button size="lg" full className="mt-4" onClick={startFresh} data-testid="start-level">
            Start
          </Button>
        )}
      </Page>
    );
  }

  if (phase.name === 'playing') {
    return (
      <TaskShell
        title={level.title}
        hearts={progress.hearts}
        meters={progress.meters}
        paused={paused}
        onPause={setPaused}
        onQuit={goMap}
        onReadCard={readCard}
      >
        <StageRunner
          key={seed}
          level={level}
          world={world}
          seed={seed}
          relaxed={relaxed}
          paused={paused || heartsGate}
          onMistake={onMistake}
          onShortcut={onShortcut}
          onMeters={applyDelta}
          onComplete={onComplete}
          onCheckpoint={onCheckpoint}
          initialIndex={resumeFrom?.nextIndex}
          initialByStage={resumeFrom?.byStage}
          initialEngine={resumeFrom?.engine}
          initialRemaining={resumeFrom?.remaining}
          cameo={level.mayaCameo}
          hints={!progress.levels[raw.id]?.attempts}
        />
        <HeartsSheet
          worldId={world.id}
          open={heartsGate}
          onContinue={() => setHeartsGate(false)}
          onQuit={() => navigate({ name: 'map', worldId: world.id })}
        />
      </TaskShell>
    );
  }

  if (phase.name === 'failed') {
    return (
      <Debrief
        kind="level"
        title={level.title}
        stars={0}
        score={0}
        xp={{ total: 0, lines: [] }}
        learned={level.debrief.learned}
        mistakes={phase.mistakes}
        correct={0}
        total={0}
        failed
        failReason={phase.reason}
        canRetry={progress.hearts > 0}
        onContinue={goMap}
        onRetry={startFresh}
        onReadCard={readCard}
      />
    );
  }

  const isLastLevel = world.nodes.filter((n) => n.kind === 'level').at(-1)?.id === raw.id;
  const { result, score } = phase;
  return (
    <Debrief
      kind="level"
      title={level.title}
      stars={score.stars}
      score={score.score}
      xp={score.xp}
      learned={level.debrief.learned}
      handoffLine={level.debrief.handoffLine}
      mayaLine={level.mayaCameo?.debriefLine}
      mistakes={result.mistakes}
      shortcuts={result.shortcuts}
      artifacts={phase.artifacts}
      correct={result.correct}
      total={result.total}
      failed={score.stars === 0}
      failReason={
        score.stars === 0 ? 'Under half right. Read the consequences below and have another go.' : undefined
      }
      canRetry={progress.hearts > 0}
      onContinue={goMap}
      onRetry={start}
      onReadCard={readCard}
      continueLabel={isLastLevel ? 'Continue to the crisis' : 'Continue'}
    />
  );
}
