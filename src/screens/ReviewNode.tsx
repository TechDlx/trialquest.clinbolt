import { useCallback, useMemo, useState } from 'react';
import type { QuizQuestion } from '@/content/types';
import { content, questionsByConcept } from '@/content';
import { economy } from '@/content/economy';
import { navigate } from '@/app/router';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { computeScore, xpForReview, type EngineResult } from '@/engine/scoring';
import { conceptOutcomes } from '@/engine/pipeline';
import { TaskShell } from '@/engine/TaskShell';
import { QuizBlitz } from '@/engine/quiz-blitz/QuizBlitz';
import { Button } from '@/components/Button';
import { Page, TopBar } from '@/components/Layout';
import { Speech } from '@/components/Mascot';
import { RefreshIcon } from '@/components/Icons';
import { Debrief } from './Debrief';

/** Picks up to N due concepts (oldest due first) and one question for each. */
export function pickReviewQuestions(
  concepts: Record<string, { box: number; dueAt: string }>,
  now = new Date(),
): QuizQuestion[] {
  const byConcept = questionsByConcept();
  const due = Object.entries(concepts)
    .filter(([, c]) => c.box < 5 && new Date(c.dueAt).getTime() <= now.getTime())
    .sort((a, b) => new Date(a[1].dueAt).getTime() - new Date(b[1].dueAt).getTime())
    .map(([id]) => id);
  const out: QuizQuestion[] = [];
  for (const id of due) {
    const q = byConcept[id]?.[0];
    if (q) out.push(q);
    if (out.length >= economy.review.maxItems) break;
  }
  return out;
}

export function ReviewNodeScreen({ reviewId }: { reviewId: string }) {
  const review = content.reviewById[reviewId];
  const world = review ? content.worldById[review.worldId] : undefined;
  const progress = useProgress();
  const relaxed = useSettings((s) => s.relaxed);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const [result, setResult] = useState<EngineResult | null>(null);
  const [paused, setPaused] = useState(false);
  const [seed, setSeed] = useState(1);
  const questions = useMemo(() => pickReviewQuestions(progress.concepts), [progress.concepts]);

  const onComplete = useCallback(
    (r: EngineResult) => {
      if (!review) return;
      const perfect = r.mistakes.length === 0;
      progress.recordReview(review.id, xpForReview(perfect));
      progress.touchStreak();
      for (const c of conceptOutcomes(
        questions.map((q) => q.conceptId),
        r.mistakes,
      )) {
        progress.recordConcept(c.conceptId, c.correct);
      }
      setResult(r);
      setPhase('done');
    },
    [review, progress, questions],
  );

  if (!review || !world) {
    return (
      <Page nav="map">
        <TopBar title="Review not found" back={{ name: 'map' }} />
      </Page>
    );
  }
  const goMap = () => navigate({ name: 'map', worldId: world.id });

  if (phase === 'intro') {
    const nothingDue = questions.length === 0;
    return (
      <Page>
        <TopBar title={review.title} back={{ name: 'map', worldId: world.id }} />
        <div className="rounded-card bg-surface p-4 shadow-card">
          <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300">
            <RefreshIcon size={22} />
            <h1 className="text-xl font-black text-fg">Review node</h1>
          </div>
          <p className="mt-2 text-sm text-muted">
            Review nodes bring back concepts you missed, spaced out over days so they stick. Finishing one
            refills your hearts.
          </p>
        </div>
        {nothingDue ? (
          <>
            <Speech mood="cheer" className="mt-3">
              All caught up. Nothing is due for review right now. Have your hearts back anyway.
            </Speech>
            <Button
              size="lg"
              full
              className="mt-4"
              onClick={() => {
                progress.recordReview(review.id, { total: 0, lines: [] });
                goMap();
              }}
              data-testid="review-claim"
            >
              Refill hearts and go back
            </Button>
          </>
        ) : (
          <>
            <Speech mood="think" className="mt-3">
              {questions.length} concept{questions.length === 1 ? '' : 's'} to revisit. No hearts at stake
              here.
            </Speech>
            <Button
              size="lg"
              full
              className="mt-4"
              onClick={() => {
                setSeed((Date.now() % 1_000_000) + 1);
                setPhase('playing');
              }}
              data-testid="start-review"
            >
              Start review
            </Button>
          </>
        )}
      </Page>
    );
  }

  if (phase === 'playing') {
    return (
      <TaskShell
        title={review.title}
        hearts={progress.hearts}
        meters={progress.meters}
        paused={paused}
        onPause={setPaused}
        onQuit={goMap}
      >
        <QuizBlitz
          questions={questions}
          secondsPerQuestion={economy.quiz.defaultSecondsPerQuestion}
          timerScale={world.timerScale}
          relaxed={relaxed}
          paused={paused}
          mode="review"
          seed={seed}
          onMistake={() => ({ heartLost: false, note: 'No heart lost in a review.' })}
          onComplete={onComplete}
        />
      </TaskShell>
    );
  }

  const r = result!;
  const { score, stars } = computeScore(r.accuracy, r.speed);
  return (
    <Debrief
      kind="review"
      title={review.title}
      stars={stars === 0 ? 1 : stars}
      score={score}
      xp={xpForReview(r.mistakes.length === 0)}
      mistakes={r.mistakes}
      correct={r.correct}
      total={r.total}
      failed={false}
      canRetry={false}
      onContinue={goMap}
      onRetry={goMap}
      learned="Hearts refilled. Missed concepts will come back in a later review."
    />
  );
}
