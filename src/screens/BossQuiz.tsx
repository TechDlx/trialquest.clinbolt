import { useCallback, useEffect, useState } from 'react';
import { content } from '@/content';
import { economy } from '@/content/economy';
import { navigate } from '@/app/router';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import type { EngineResult, Mistake } from '@/engine/scoring';
import { applyMistake, conceptOutcomes, failureReason, scoreBoss, type BossScore } from '@/engine/pipeline';
import { TaskShell } from '@/engine/TaskShell';
import { QuizBlitz, type MistakeFeedback } from '@/engine/quiz-blitz/QuizBlitz';
import { Button } from '@/components/Button';
import { Page, TopBar } from '@/components/Layout';
import { Hearts } from '@/components/Hud';
import { CrownIcon, ShapeIcon } from '@/components/Icons';
import { Speech } from '@/components/Mascot';
import { Debrief } from './Debrief';

type Phase =
  | { name: 'intro' }
  | { name: 'playing' }
  | { name: 'done'; result: EngineResult; score: BossScore }
  | { name: 'failed'; mistakes: Mistake[]; reason: string };

/**
 * Thin host for the end-of-world boss (becomes the Crisis Boss in Milestone 2b).
 * Rule logic lives in engine/pipeline.ts; this screen only renders and commits.
 */
export function BossQuizScreen({ bossId }: { bossId: string }) {
  const boss = content.bossById[bossId];
  const world = boss ? content.worldById[boss.worldId] : undefined;
  const progress = useProgress();
  const relaxed = useSettings((s) => s.relaxed);
  const [phase, setPhase] = useState<Phase>({ name: 'intro' });
  const [paused, setPaused] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [seed, setSeed] = useState(1);

  useEffect(() => {
    progress.syncHearts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bossId]);

  const start = useCallback(() => {
    setPaused(false);
    setRunKey((k) => k + 1);
    setSeed((Date.now() % 1_000_000) + 1);
    setPhase({ name: 'playing' });
  }, []);

  const onMistake = useCallback((m: Mistake): MistakeFeedback => {
    const s = useProgress.getState();
    const out = applyMistake(
      { hearts: s.hearts, heartsUpdatedAt: s.heartsUpdatedAt, meters: s.meters },
      { firstMistakeFree: false, freeUsed: false, meterFocus: 'integrity' },
    );
    s.commitSnapshot(out.snapshot);
    const reason = failureReason(out);
    if (reason) setPhase({ name: 'failed', mistakes: [m], reason });
    return { heartLost: out.heartLost };
  }, []);

  const onComplete = useCallback(
    (result: EngineResult) => {
      if (!boss || !world) return;
      const s = useProgress.getState();
      const score = scoreBoss(result, { firstTry: (s.bosses[boss.id]?.attempts ?? 0) === 0 });
      s.recordBossResult(boss.id, { stars: score.stars, points: result.points ?? 0, xp: score.xp });
      if (score.passed) {
        s.touchStreak();
        const bonus = s.completeWorld(world.id);
        if (bonus.xpGained > 0) {
          score.xp.lines.push({ label: 'Meters kept high', xp: bonus.xpGained });
          score.xp.total = score.xp.lines.reduce((sum, l) => sum + l.xp, 0);
        }
      }
      for (const c of conceptOutcomes(
        boss.questions.map((q) => q.conceptId),
        result.mistakes,
      )) {
        s.recordConcept(c.conceptId, c.correct);
      }
      setPhase({ name: 'done', result, score });
    },
    [boss, world],
  );

  if (!boss || !world) {
    return (
      <Page nav="map">
        <TopBar title="Boss quiz not found" back={{ name: 'map' }} />
      </Page>
    );
  }

  const goMap = () => navigate({ name: 'map', worldId: world.id });
  const secs = Math.round(boss.secondsPerQuestion * world.timerScale);
  const passPct = Math.round(economy.boss.passFraction * 100);

  if (phase.name === 'intro') {
    return (
      <Page>
        <TopBar
          title={`World ${world.number} · Boss`}
          back={{ name: 'map', worldId: world.id }}
          right={<Hearts hearts={progress.hearts} />}
        />
        <div className="rounded-card bg-brand-700 p-4 text-white shadow-card">
          <div className="flex items-center gap-2">
            <CrownIcon size={26} />
            <h1 className="text-xl font-black">{boss.title}</h1>
          </div>
          <p className="mt-2 text-sm text-brand-100">
            {boss.questions.length} questions mixing every role from this world.{' '}
            {relaxed ? 'Relaxed mode: no timer.' : `${secs} seconds each.`}
          </p>
          <ul className="mt-3 grid gap-1 text-sm">
            <li>⚡ Faster correct answers score more points.</li>
            <li>🔥 3 in a row: ×1.25 points. 5 in a row: ×1.5.</li>
            <li>✅ Get {passPct}% right to pass and unlock the next world.</li>
          </ul>
          <div className="mt-3 flex gap-2" aria-hidden="true">
            <span className="rounded-lg bg-ans-red p-1.5">
              <ShapeIcon shape="triangle" size={16} />
            </span>
            <span className="rounded-lg bg-ans-blue p-1.5">
              <ShapeIcon shape="diamond" size={16} />
            </span>
            <span className="rounded-lg bg-ans-yellow p-1.5">
              <ShapeIcon shape="circle" size={16} />
            </span>
            <span className="rounded-lg bg-ans-green p-1.5">
              <ShapeIcon shape="square" size={16} />
            </span>
          </div>
        </div>
        <Speech mood="cheer" className="mt-3">
          Boss time. Keys 1 to 4 work on a keyboard, or just tap.
        </Speech>
        {progress.hearts <= 0 ? (
          <div className="mt-4 rounded-card border-2 border-heart/50 bg-surface p-4 text-sm">
            <p className="font-bold">No hearts left.</p>
            <p className="mt-1 text-muted">
              Wait for a refill or review a Role Card in the Codex for +1 heart.
            </p>
            <Button variant="secondary" full className="mt-3" onClick={() => navigate({ name: 'codex' })}>
              Open the Codex
            </Button>
          </div>
        ) : (
          <Button size="lg" full className="mt-4" onClick={start} data-testid="start-boss">
            Start the boss quiz
          </Button>
        )}
      </Page>
    );
  }

  if (phase.name === 'playing') {
    return (
      <TaskShell
        title={boss.title}
        hearts={progress.hearts}
        meters={progress.meters}
        paused={paused}
        onPause={setPaused}
        onQuit={goMap}
      >
        <QuizBlitz
          key={runKey}
          questions={boss.questions}
          secondsPerQuestion={boss.secondsPerQuestion}
          timerScale={world.timerScale}
          relaxed={relaxed}
          paused={paused}
          mode="boss"
          seed={seed}
          onMistake={onMistake}
          onComplete={onComplete}
        />
      </TaskShell>
    );
  }

  if (phase.name === 'failed') {
    return (
      <Debrief
        kind="boss"
        title={boss.title}
        stars={0}
        score={0}
        xp={{ total: 0, lines: [] }}
        mistakes={phase.mistakes}
        correct={0}
        total={boss.questions.length}
        failed
        failReason={phase.reason}
        canRetry={progress.hearts > 0}
        onContinue={goMap}
        onRetry={start}
      />
    );
  }

  const { result, score } = phase;
  return (
    <Debrief
      kind="boss"
      title={boss.title}
      stars={score.stars}
      score={score.score}
      xp={score.xp}
      learned={score.passed ? world.outro.paragraphs[0] : undefined}
      mistakes={result.mistakes}
      correct={result.correct}
      total={result.total}
      failed={!score.passed}
      failReason={
        !score.passed ? `You need ${passPct}% to pass. Read the consequences below and try again.` : undefined
      }
      canRetry={progress.hearts > 0}
      onContinue={() =>
        score.passed ? navigate({ name: 'story', worldId: world.id, beat: 'outro' }) : goMap()
      }
      onRetry={start}
      continueLabel={score.passed ? "See Maya's story" : 'Continue'}
    />
  );
}
