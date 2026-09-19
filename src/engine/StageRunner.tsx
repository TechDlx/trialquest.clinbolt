import { useCallback, useState } from 'react';
import type { MainPathConfig, Stage, World } from '@/content/types';
import { economy } from '@/content/economy';
import { Button } from '@/components/Button';
import { TimerBar } from '@/components/Hud';
import { RichText } from '@/components/RichText';
import { Speech } from '@/components/Mascot';
import { EngineHost, configSeconds } from './EngineHost';
import type { EngineProps } from './engines/types';
import { useCountdown } from './useCountdown';
import type { BuiltLevel } from './variants';
import { aggregateStages } from './pipeline';
import type { EngineResult } from './scoring';

export interface StageRunnerProps extends Pick<
  EngineProps<MainPathConfig>,
  'onMistake' | 'onShortcut' | 'onMeters'
> {
  level: BuiltLevel;
  world: World;
  seed: number;
  relaxed: boolean;
  paused: boolean;
  onComplete: (aggregate: EngineResult, byStage: Record<string, EngineResult>) => void;
}

/** Runs a level's stages in order: stage card → engine → next. Aggregates results by weight. */
export function StageRunner({
  level,
  world,
  seed,
  relaxed,
  paused,
  onMistake,
  onShortcut,
  onMeters,
  onComplete,
}: StageRunnerProps) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'card' | 'play'>('card');
  const [byStage, setByStage] = useState<Record<string, EngineResult>>({});
  const [promptDone, setPromptDone] = useState(false);
  const stage = level.stages[index]!;
  const game = stage.game as MainPathConfig;
  const base = configSeconds(game);
  const seconds = base ? Math.max(5, Math.round(base * world.timerScale)) : 0;
  const timed = !relaxed && seconds > 0;
  const countdown = useCountdown({
    seconds: seconds || 1,
    enabled: timed,
    running: phase === 'play' && !paused,
    resetKey: `${level.id}:${stage.id}:${seed}`,
  });

  const onStageComplete = useCallback(
    (r: EngineResult) => {
      const next = { ...byStage, [stage.id]: r };
      setByStage(next);
      if (index + 1 < level.stages.length) {
        setIndex(index + 1);
        setPhase('card');
      } else {
        const results = level.stages.map((s) => next[s.id]!).filter(Boolean);
        onComplete(
          aggregateStages(
            results,
            level.stages.map((s) => s.weight ?? 1),
          ),
          next,
        );
      }
    },
    [byStage, stage.id, index, level.stages, onComplete],
  );

  const showPrompt = index === 0 && level.shortcutPrompt && !promptDone;

  if (phase === 'card') {
    return (
      <div className="flex flex-1 flex-col gap-3" data-testid={`stage-card-${stage.id}`}>
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          Stage {index + 1} of {level.stages.length}
        </p>
        <div className="rounded-card bg-surface p-4 shadow-card">
          <h2 className="text-xl font-black">{stage.title ?? `Stage ${index + 1}`}</h2>
          {stage.brief && <RichText as="p" text={stage.brief} className="mt-1 text-base" />}
          <p className="mt-2 text-sm text-muted">
            {timed ? `${seconds} seconds.` : relaxed ? 'Relaxed mode: no timer.' : 'No timer for this stage.'}
          </p>
        </div>
        {showPrompt ? (
          <>
            <Speech mood="think">{level.shortcutPrompt!.offer}</Speech>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  onShortcut({
                    itemId: level.shortcutPrompt!.id,
                    meters: level.shortcutPrompt!.accept.meters,
                    why: level.shortcutPrompt!.accept.why,
                  });
                  setPromptDone(true);
                }}
                data-testid="prompt-accept"
              >
                Take the shortcut
              </Button>
              <Button onClick={() => setPromptDone(true)} data-testid="prompt-decline">
                Do it properly
              </Button>
            </div>
          </>
        ) : (
          <Button size="lg" full onClick={() => setPhase('play')} data-testid={`start-stage-${stage.id}`}>
            {index === 0 ? 'Start' : 'Next stage'}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      {level.stages.length > 1 && (
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          Stage {index + 1} of {level.stages.length}: {stage.title}
        </p>
      )}
      <TimerBar fraction={countdown.fraction} remaining={countdown.remaining} relaxed={!timed} />
      <EngineHost
        key={`${stage.id}:${seed}`}
        config={game}
        seed={seed + index * 101}
        paused={paused}
        relaxed={relaxed}
        remainingFraction={timed ? countdown.fraction : 1}
        timeUp={timed && countdown.expired}
        mode="level"
        onMistake={onMistake}
        onShortcut={onShortcut}
        onMeters={onMeters}
        onComplete={onStageComplete}
      />
    </div>
  );
}

export function stageForTest(stage: Stage): Stage {
  return stage;
}

export const RELAXED_SPEED = economy.score.relaxedSpeed;
