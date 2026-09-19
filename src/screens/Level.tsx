import { useCallback, useEffect, useRef, useState } from 'react';
import type { MeterId } from '@/content/types';
import { content } from '@/content';
import { economy } from '@/content/economy';
import { navigate } from '@/app/router';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import {
  computeScore,
  xpForLevel,
  type Mistake,
  type Stars,
  type TaskResult,
  type XpBreakdown,
} from '@/engine/scoring';
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
  | { name: 'debrief'; result: TaskResult; stars: Stars; score: number; xp: XpBreakdown }
  | { name: 'failed'; mistakes: Mistake[]; reason: string; correct: number; total: number };

const setbackTitles: Record<MeterId, { title: string; text: string }> = {
  safety: {
    title: 'Clinical hold',
    text: 'Patient safety hit zero. In real life the regulator can halt a trial until the sponsor fixes the problem. Retry the level.',
  },
  integrity: {
    title: 'Inspection finding',
    text: 'Data integrity hit zero. An inspector would issue findings, and data from this site might be thrown out. Retry the level.',
  },
  timeline: {
    title: 'Portfolio review',
    text: 'Timeline and budget hit zero. Leadership pauses the program until the plan is fixed. Retry the level.',
  },
};

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
  const freeMistakeUsed = useRef(false);
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
    freeMistakeUsed.current = false;
    setPaused(false);
    setRunKey((k) => k + 1);
    setSeed((Date.now() % 1_000_000) + 1);
    setPhase({ name: 'playing' });
  }, []);

  const onMistake = useCallback(
    (m: Mistake): MistakeFeedback => {
      if (!level || !world) return { heartLost: false };
      if (world.firstMistakeFree && !freeMistakeUsed.current) {
        freeMistakeUsed.current = true;
        return {
          heartLost: false,
          note: 'Dose: "First slip in World 1 is free. The next one costs a heart."',
        };
      }
      const hearts = progress.loseHeart();
      const meter = level.meterFocus ?? 'integrity';
      const delta = meter === 'integrity' ? economy.meters.defaultMistakeIntegrity : -5;
      const value = progress.applyMeter(meter, delta);
      if (value <= 0) {
        progress.resetMeter(meter);
        const sb = setbackTitles[meter];
        setPhase({ name: 'failed', mistakes: [m], reason: `${sb.title}: ${sb.text}`, correct: 0, total: 0 });
        return { heartLost: true };
      }
      if (hearts <= 0) {
        setPhase({
          name: 'failed',
          mistakes: [m],
          reason: 'Out of hearts. Every mistake below has a real-world cost. Take a breath and try again.',
          correct: 0,
          total: 0,
        });
      }
      return { heartLost: true };
    },
    [level, world, progress],
  );

  const onComplete = useCallback(
    (result: TaskResult) => {
      if (!level) return;
      const { score, stars } = computeScore(result.accuracy, result.speed);
      const firstTime = !progress.levels[level.id]?.completedAt;
      const xp = xpForLevel({
        stars,
        perfect: result.heartsLost === 0 && result.mistakes.length === 0,
        firstTime,
      });
      progress.recordLevelResult(level.id, { stars, score, xp });
      if (stars > 0) progress.touchStreak();
      const missed = new Set(result.mistakes.map((m) => m.conceptId));
      if (level.game.engine === 'quiz-blitz') {
        for (const q of level.game.questions) progress.recordConcept(q.conceptId, !missed.has(q.conceptId));
      }
      setPhase({ name: 'debrief', result, stars, score, xp });
    },
    [level, progress],
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
        correct={phase.correct}
        total={phase.total}
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
  return (
    <Debrief
      kind="level"
      title={level.title}
      stars={phase.stars}
      score={phase.score}
      xp={phase.xp}
      learned={level.debrief.learned}
      handoffLine={level.debrief.handoffLine}
      mistakes={phase.result.mistakes}
      correct={phase.result.correct}
      total={phase.result.total}
      failed={phase.stars === 0}
      failReason={
        phase.stars === 0 ? 'Under half right. Read the consequences below and have another go.' : undefined
      }
      canRetry={progress.hearts > 0}
      onContinue={goMap}
      onRetry={start}
      onReadCard={readCard}
      continueLabel={isLastLevel ? 'Continue to the boss quiz' : 'Continue'}
    />
  );
}
