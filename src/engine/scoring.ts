import { economy } from '@/content/economy';
import type { MeterId } from '@/content/types';

/** A heart-costing mistake, as reported by any engine. */
export interface Mistake {
  /** ScoredItem id within the stage (question id, card id, choice id…). */
  itemId: string;
  conceptId: string;
  prompt: string;
  chosen: string;
  correctAnswer: string;
  explanation: string;
  consequence: string;
}

/** A tempting shortcut the player took. Not a mistake; meters are its cost. */
export interface ShortcutEvent {
  itemId: string;
  meters: Partial<Record<MeterId, number>>;
  why: string;
}

export type ItemOutcome = 'correct' | 'wrong' | 'shortcut' | 'skipped';

/** Facts an OutcomeRule can test. Engines fill only the fields they produce. */
export interface EngineOutcomes {
  band?: string;
  endNode?: string;
  parts?: Record<string, string>;
  buckets?: Record<string, string>;
  accused?: string[];
  inputValue?: number;
  shortcutsTaken: string[];
}

export const emptyOutcomes = (): EngineOutcomes => ({ shortcutsTaken: [] });

/** What every engine reports when a stage ends. Engines never touch the store. */
export interface EngineResult {
  /** 0..1 */
  accuracy: number;
  /** 0..1; engines pass economy.score.relaxedSpeed when untimed. */
  speed: number;
  mistakes: Mistake[];
  shortcuts: ShortcutEvent[];
  itemResults: Record<string, ItemOutcome>;
  outcomes: EngineOutcomes;
  correct: number;
  total: number;
  /** Kahoot-style points, when the engine tracks them. */
  points?: number;
  maxPoints?: number;
  /** Hearts lost during the run (excluding free mistakes). */
  heartsLost: number;
}

export type Stars = 0 | 1 | 2 | 3;

export function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function computeScore(accuracy: number, speed: number): { score: number; stars: Stars } {
  const { accuracyWeight, speedWeight, starThresholds } = economy.score;
  const score = Math.round(accuracyWeight * clamp01(accuracy) + speedWeight * clamp01(speed));
  let stars: Stars = 0;
  if (score >= starThresholds.three) stars = 3;
  else if (score >= starThresholds.two) stars = 2;
  else if (score >= starThresholds.one) stars = 1;
  return { score, stars };
}

export interface LevelXpInput {
  stars: Stars;
  perfect: boolean;
  firstTime: boolean;
  /** Best stars before this play (replays pay for improvement only). */
  previousStars?: number;
}

export interface XpBreakdown {
  total: number;
  lines: { label: string; xp: number }[];
}

export function xpForLevel({ stars, perfect, firstTime, previousStars = 0 }: LevelXpInput): XpBreakdown {
  const lines: { label: string; xp: number }[] = [];
  if (!firstTime) {
    // A replay pays only for improvement, so stars cannot be farmed.
    const gain = Math.max(0, stars - previousStars);
    if (gain > 0)
      lines.push({
        label: `Improved to ${stars} star${stars === 1 ? '' : 's'}`,
        xp: economy.xp.perStar * gain,
      });
    return { total: lines.reduce((s, l) => s + l.xp, 0), lines };
  }
  if (stars > 0)
    lines.push({ label: `${stars} star${stars === 1 ? '' : 's'}`, xp: economy.xp.perStar * stars });
  if (stars > 0 && perfect) lines.push({ label: 'No wrong turns', xp: economy.xp.perfectRun });
  if (stars > 0 && firstTime) lines.push({ label: 'First completion', xp: economy.xp.firstCompletion });
  return { total: lines.reduce((s, l) => s + l.xp, 0), lines };
}

/** Kahoot-style points for one correct answer. */
export function bossPointsForAnswer(timeLeftFraction: number, correctStreakBefore: number): number {
  const base = economy.boss.basePoints + Math.round(economy.boss.speedPoints * clamp01(timeLeftFraction));
  return Math.round(base * streakMultiplier(correctStreakBefore + 1));
}

/** Multiplier that applies once the streak (including the current answer) reaches a threshold. */
export function streakMultiplier(streak: number): number {
  for (const tier of economy.boss.streak) if (streak >= tier.after) return tier.multiplier;
  return 1;
}

/** Max points if every answer is instant and the streak never breaks. */
export function bossMaxPoints(questionCount: number): number {
  let total = 0;
  for (let i = 0; i < questionCount; i++) total += bossPointsForAnswer(1, i);
  return total;
}

export function xpForBoss(points: number, maxPoints: number, passedFirstTry: boolean): XpBreakdown {
  const lines: { label: string; xp: number }[] = [];
  const base = maxPoints > 0 ? Math.round((points / maxPoints) * economy.xp.bossMax) : 0;
  lines.push({ label: 'Boss points', xp: base });
  if (passedFirstTry) lines.push({ label: 'Passed first try', xp: economy.xp.bossFirstTryPass });
  return { total: lines.reduce((s, l) => s + l.xp, 0), lines };
}

export function xpForReview(perfect: boolean): XpBreakdown {
  const lines: { label: string; xp: number }[] = [
    { label: 'Review complete', xp: economy.xp.reviewComplete },
  ];
  if (perfect) lines.push({ label: 'All correct', xp: economy.xp.reviewPerfect });
  return { total: lines.reduce((s, l) => s + l.xp, 0), lines };
}
