import { useCallback, useMemo, useState } from 'react';
import { content } from '@/content';
import { economy } from '@/content/economy';
import type { MainPathConfig } from '@/content/types';
import { navigate } from '@/app/router';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { xpForReview, type EngineResult } from '@/engine/scoring';
import { buildReviewRound, dueSituations, roundCorrect, type ReviewRound } from '@/engine/review';
import { EngineHost } from '@/engine/EngineHost';
import { useCountdown } from '@/engine/useCountdown';
import { TaskShell } from '@/engine/TaskShell';
import { Button } from '@/components/Button';
import { Page, TopBar } from '@/components/Layout';
import { TimerBar } from '@/components/Hud';
import { Speech } from '@/components/Mascot';
import { RefreshIcon } from '@/components/Icons';
import { Debrief } from './Debrief';

/** Review node: replays missed situations as 20-second micro-rounds of their original engine. */
export function ReviewNodeScreen({ reviewId }: { reviewId: string }) {
  const review = content.reviewById[reviewId];
  const world = review ? content.worldById[review.worldId] : undefined;
  const progress = useProgress();
  const relaxed = useSettings((s) => s.relaxed);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [clean, setClean] = useState(0);
  const [mistakes, setMistakes] = useState<EngineResult['mistakes']>([]);
  // What is due now (for the intro). The playlist is frozen when the review starts, because
  // completing a round reschedules its situation and would otherwise shrink the list mid-play.
  const dueRounds = useMemo<ReviewRound[]>(
    () =>
      dueSituations(progress.situations)
        .map((s) => buildReviewRound(content, s, review?.roundSeconds ?? economy.review.roundSeconds))
        .filter((r): r is ReviewRound => !!r),
    [progress.situations, review?.roundSeconds],
  );
  const [rounds, setRounds] = useState<ReviewRound[]>([]);
  const round = rounds[index];
  const seconds =
    round && 'seconds' in round.stage.game ? (round.stage.game as { seconds: number }).seconds : 0;
  const timed = !relaxed && seconds > 0;
  const clock = useCountdown({
    seconds: seconds || 1,
    enabled: timed,
    running: phase === 'playing' && !paused && !held,
    resetKey: index,
  });

  const onRoundComplete = useCallback(
    (r: EngineResult) => {
      if (!round) return;
      const correct = roundCorrect(round, r);
      useProgress.getState().recordSituation(round.levelId, round.stage.id, round.itemId, correct);
      if (correct) setClean((n) => n + 1);
      setMistakes((m) => [...m, ...r.mistakes]);
      if (index + 1 < rounds.length) setIndex(index + 1);
      else {
        const perfect = clean + (correct ? 1 : 0) === rounds.length;
        useProgress.getState().recordReview(review!.id, xpForReview(perfect));
        useProgress.getState().touchStreak();
        setPhase('done');
      }
    },
    [round, index, rounds.length, clean, review],
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
    return (
      <Page>
        <TopBar title={review.title} back={{ name: 'map', worldId: world.id }} />
        <div className="rounded-card bg-surface p-4 shadow-card">
          <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300">
            <RefreshIcon size={22} />
            <h1 className="text-xl font-black text-fg">Review node</h1>
          </div>
          <p className="mt-2 text-sm text-muted">
            Review nodes replay the exact situations you got wrong, or the shortcuts you took, as short rounds
            spaced out over days. Finishing one refills your hearts.
          </p>
        </div>
        {dueRounds.length === 0 ? (
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
              {dueRounds.length} situation{dueRounds.length === 1 ? '' : 's'} to revisit, up to{' '}
              {review.roundSeconds ?? economy.review.roundSeconds} seconds each; scenario replays are untimed.
              No hearts at stake.
            </Speech>
            <Button
              size="lg"
              full
              className="mt-4"
              onClick={() => {
                setRounds(dueRounds);
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

  if (phase === 'playing' && round) {
    return (
      <TaskShell
        title={`Review ${index + 1}/${rounds.length}: ${round.levelTitle}`}
        hearts={progress.hearts}
        meters={progress.meters}
        paused={paused}
        onPause={setPaused}
        onQuit={goMap}
      >
        <TimerBar
          fraction={clock.fraction}
          remaining={clock.remaining}
          relaxed={!timed}
          label={relaxed ? undefined : 'Untimed round'}
        />
        <EngineHost
          key={round.key}
          config={round.stage.game as MainPathConfig}
          onlyItems={round.onlyItems}
          seed={index + 1}
          paused={paused}
          relaxed={relaxed}
          remainingFraction={timed ? clock.fraction : 1}
          timeUp={timed && clock.expired}
          mode="review"
          hints={false}
          onMistake={() => ({ heartLost: false, note: 'No heart lost in a review.' })}
          onShortcut={() => {}}
          onMeters={() => {}}
          onHold={setHeld}
          onComplete={onRoundComplete}
        />
      </TaskShell>
    );
  }

  const perfect = clean === rounds.length;
  return (
    <Debrief
      kind="review"
      title={review.title}
      stars={perfect ? 3 : clean > 0 ? 2 : 1}
      score={Math.round((clean / Math.max(1, rounds.length)) * 100)}
      xp={xpForReview(perfect)}
      mistakes={mistakes}
      correct={clean}
      total={rounds.length}
      failed={false}
      canRetry={false}
      hideRetry
      onContinue={goMap}
      onRetry={goMap}
      learned="Hearts refilled. Situations you missed will come back in a later review."
    />
  );
}
