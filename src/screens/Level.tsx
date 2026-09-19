import { useCallback, useEffect, useRef, useState } from 'react';
import { content } from '@/content';
import { economy } from '@/content/economy';
import { navigate } from '@/app/router';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import type { EngineResult, Mistake } from '@/engine/scoring';
import { applyMistake, conceptOutcomes, failureReason, scoreLevel, type LevelScore } from '@/engine/pipeline';
import { msToNextHeart } from '@/engine/hearts';
import { TaskShell } from '@/engine/TaskShell';
import { QuizBlitz, type MistakeFeedback } from '@/engine/quiz-blitz/QuizBlitz';
import { Button } from '@/components/Button';
import { Page, TopBar } from '@/components/Layout';
import { RichText } from '@/components/RichText';
import { Speech } from '@/components/Mascot';
import { Chip, Hearts } from '@/components/Hud';
import { Debrief } from './Debrief';
import { employerLabel } from './BadgeSwap';

type Phase =
  | { name: 'intro' }
  | { name: 'playing' }
  | { name: 'debrief'; result: EngineResult; score: LevelScore }
  | { name: 'failed'; mistakes: Mistake[]; reason: string };

/**
 * Thin host for a level: intro card, the engine inside TaskShell, and the debrief.
 * All rule logic (hearts, meters, setbacks, scoring, spaced repetition) is in engine/pipeline.ts.
 */
export function LevelScreen({ levelId }: { levelId: string }) {
  const level = content.levelById[levelId];
  const role = level ? content.roleById[level.roleId] : undefined;
  const world = level ? content.worldById[level.worldId] : undefined;

  const progress = useProgress();
  const relaxed = useSettings((s) => s.relaxed);
  const [phase, setPhase] = useState<Phase>({ name: 'intro' });
  const [paused, setPaused] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [seed, setSeed] = useState(1);
  const freeUsed = useRef(false);
  const hasCardFlipped = level ? !!progress.cardsViewed[level.roleId]?.flipped : false;

  useEffect(() => {
    if (!level) return;
    progress.syncHearts();
    progress.startWorld(level.worldId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId]);

  // Guard: the Role Card must be viewed before the task can start.
  useEffect(() => {
    if (level && role && !hasCardFlipped) navigate({ name: 'role', roleId: role.id, levelId }, true);
  }, [level, role, hasCardFlipped, levelId]);

  const start = useCallback(() => {
    freeUsed.current = false;
    setPaused(false);
    setRunKey((k) => k + 1);
    setSeed((Date.now() % 1_000_000) + 1);
    setPhase({ name: 'playing' });
  }, []);

  const onMistake = useCallback(
    (m: Mistake): MistakeFeedback => {
      if (!level || !world) return { heartLost: false };
      const s = useProgress.getState();
      const out = applyMistake(
        { hearts: s.hearts, heartsUpdatedAt: s.heartsUpdatedAt, meters: s.meters },
        {
          firstMistakeFree: world.firstMistakeFree,
          freeUsed: freeUsed.current,
          meterFocus: level.meterFocus ?? 'integrity',
        },
      );
      freeUsed.current = out.freeUsed;
      if (out.heartLost) s.commitSnapshot(out.snapshot);
      const reason = failureReason(out);
      if (reason) setPhase({ name: 'failed', mistakes: [m], reason });
      return { heartLost: out.heartLost, note: out.note };
    },
    [level, world],
  );

  const onComplete = useCallback(
    (result: EngineResult) => {
      if (!level) return;
      const s = useProgress.getState();
      const score = scoreLevel(result, { firstTime: !s.levels[level.id]?.completedAt });
      s.recordLevelResult(level.id, { stars: score.stars, score: score.score, xp: score.xp });
      if (score.stars > 0) s.touchStreak();
      const conceptIds =
        level.game.engine === 'quiz-blitz' ? level.game.questions.map((q) => q.conceptId) : [];
      for (const c of conceptOutcomes(conceptIds, result.mistakes)) s.recordConcept(c.conceptId, c.correct);
      setPhase({ name: 'debrief', result, score });
    },
    [level],
  );

  if (!level || !role || !world) {
    return (
      <Page nav="map">
        <TopBar title="Level not found" back={{ name: 'map' }} />
      </Page>
    );
  }
  if (!hasCardFlipped) return null;

  const goMap = () => navigate({ name: 'map', worldId: world.id });
  const readCard = () => navigate({ name: 'role', roleId: role.id, levelId: level.id });

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
            <li>🎯 Answer {level.game.questions.length} quick questions.</li>
            <li>
              ⏱️{' '}
              {relaxed
                ? 'Relaxed mode: no timer.'
                : `${Math.round(level.game.secondsPerQuestion * world.timerScale)} seconds each. Faster is better.`}
            </li>
            <li>
              ❤️ A wrong answer costs a heart{world.firstMistakeFree ? ' (first slip is free here)' : ''}.
            </li>
          </ul>
        </div>
        {!progress.tipsDismissed[tipId] && (
          <Speech mood="happy" className="mt-3" onDismiss={() => progress.dismissTip(tipId)}>
            Tap the answer you think is right. Every answer comes with a short explanation, right or wrong.
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
        ) : (
          <Button size="lg" full className="mt-4" onClick={start} data-testid="start-level">
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
        <QuizBlitz
          key={runKey}
          questions={level.game.questions}
          secondsPerQuestion={level.game.secondsPerQuestion}
          timerScale={world.timerScale}
          relaxed={relaxed}
          paused={paused}
          mode="level"
          seed={seed}
          shuffle={level.game.shuffleOptions ?? true}
          onMistake={onMistake}
          onComplete={onComplete}
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
        onRetry={start}
        onReadCard={readCard}
      />
    );
  }

  const isLastLevel = world.nodes.filter((n) => n.kind === 'level').at(-1)?.id === level.id;
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
      mistakes={result.mistakes}
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
      continueLabel={isLastLevel ? 'Continue to the boss quiz' : 'Continue'}
    />
  );
}
