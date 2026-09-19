import type { MeterDelta } from '@/content/types';
import type { EngineResult, Mistake, ShortcutEvent } from '@/engine/scoring';
import type { MistakeFeedback } from '@/engine/quiz-blitz/QuizBlitz';

export type EngineMode = 'level' | 'crisis' | 'review';

/** Props every main-path engine receives from its host (StageRunner, Crisis, Review). */
export interface EngineProps<C> {
  config: C;
  /** Restrict to these item ids (review micro-rounds, crisis rounds). */
  onlyItems?: string[];
  seed: number;
  paused: boolean;
  relaxed: boolean;
  /** 0..1 time remaining for this stage (1 when untimed). */
  remainingFraction: number;
  /** The host's clock ran out: finish with what you have. */
  timeUp: boolean;
  mode: EngineMode;
  onMistake: (m: Mistake) => MistakeFeedback;
  /** A shortcut carrier was used; the host applies its meters once per carrier per attempt. */
  onShortcut: (ev: ShortcutEvent) => void;
  /** Direct meter effects (scenario choice meters, simulation bands, combined shortcut consequences). */
  onMeters: (delta: MeterDelta, why?: string) => void;
  onComplete: (r: EngineResult) => void;
}

export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = arr.slice();
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
