/**
 * Engine-agnostic result pipeline. Pure functions only: no React, no store access.
 * Screens (Level, Crisis, Review) feed these with a snapshot of the store and commit
 * the returned snapshot. Every rule about hearts, meters, setbacks, scoring and
 * spaced repetition lives here, once.
 */
import { economy } from '@/content/economy';
import type { MeterId } from '@/content/types';
import { loseHeart } from './hearts';
import {
  clamp01,
  computeScore,
  emptyOutcomes,
  streakMultiplier,
  xpForBoss,
  xpForLevel,
  type EngineResult,
  type Mistake,
  type Stars,
  type XpBreakdown,
} from './scoring';

export type Meters = Record<MeterId, number>;

export interface PipelineSnapshot {
  hearts: number;
  heartsUpdatedAt: string | null;
  meters: Meters;
}

export interface MistakeRules {
  /** World rule: the first mistake in a level is free. */
  firstMistakeFree: boolean;
  /** Whether the free mistake has already been used in this attempt. */
  freeUsed: boolean;
  /** Meter damaged by a mistake in this level (default integrity). */
  meterFocus: MeterId;
}

export interface MistakeOutcome {
  snapshot: PipelineSnapshot;
  heartLost: boolean;
  freeUsed: boolean;
  /** Extra line for the feedback panel (e.g. the free-mistake note). */
  note?: string;
  /** Set when the focus meter hit zero; the snapshot already has it reset to the setback value. */
  setback?: MeterId;
  outOfHearts: boolean;
}

export const FREE_MISTAKE_NOTE =
  'Dose: "In World 1 your first slip on each try is free. The next one costs a heart."';

export const setbackCopy: Record<MeterId, { title: string; text: string }> = {
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

export const OUT_OF_HEARTS_TEXT =
  'Out of hearts. Every mistake below has a real-world cost. Take a breath and try again.';

const clampMeter = (n: number) => Math.max(0, Math.min(economy.meters.max, Math.round(n)));

/** Meter damage for one mistake: integrity uses the economy default; other meters take -5. */
export function meterDeltaForMistake(meter: MeterId): number {
  return meter === 'integrity' ? economy.meters.defaultMistakeIntegrity : -5;
}

/** Applies one mistake event to hearts and meters. Order matters: heart first, then meter, then setback. */
export function applyMistake(
  snapshot: PipelineSnapshot,
  rules: MistakeRules,
  now: Date = new Date(),
): MistakeOutcome {
  if (rules.firstMistakeFree && !rules.freeUsed) {
    return { snapshot, heartLost: false, freeUsed: true, note: FREE_MISTAKE_NOTE, outOfHearts: false };
  }
  const hearts = loseHeart({ hearts: snapshot.hearts, heartsUpdatedAt: snapshot.heartsUpdatedAt }, now);
  const meter = rules.meterFocus;
  const value = clampMeter(snapshot.meters[meter] + meterDeltaForMistake(meter));
  const meters: Meters = { ...snapshot.meters, [meter]: value };
  const outOfHearts = hearts.hearts <= 0;
  if (value <= 0) {
    meters[meter] = economy.meters.setbackResetTo;
    return {
      snapshot: { ...hearts, meters },
      heartLost: true,
      freeUsed: rules.freeUsed,
      setback: meter,
      outOfHearts,
    };
  }
  return { snapshot: { ...hearts, meters }, heartLost: true, freeUsed: rules.freeUsed, outOfHearts };
}

/** Text for the failure debrief. Setbacks take priority over running out of hearts. */
export function failureReason(outcome: Pick<MistakeOutcome, 'setback' | 'outOfHearts'>): string | undefined {
  if (outcome.setback) {
    const sb = setbackCopy[outcome.setback];
    return `${sb.title}: ${sb.text}`;
  }
  if (outcome.outOfHearts) return OUT_OF_HEARTS_TEXT;
  return undefined;
}

export interface LevelScore {
  stars: Stars;
  score: number;
  xp: XpBreakdown;
  perfect: boolean;
}

export function scoreLevel(
  result: EngineResult,
  opts: { firstTime: boolean; previousStars?: number },
): LevelScore {
  const { score, stars } = computeScore(result.accuracy, result.speed);
  const perfect = result.heartsLost === 0 && result.mistakes.length === 0 && result.accuracy >= 1 - 1e-9;
  const xp = xpForLevel({
    stars,
    perfect,
    firstTime: opts.firstTime,
    previousStars: opts.previousStars ?? 0,
  });
  return { stars, score, xp, perfect };
}

export interface BossScore {
  passed: boolean;
  stars: Stars;
  score: number;
  xp: XpBreakdown;
}

/** Boss/crisis scoring: pass at >= passFraction accuracy; a pass is never 0 stars. */
export function scoreBoss(
  result: EngineResult,
  opts: { firstTry: boolean; passFraction?: number },
): BossScore {
  const passFraction = opts.passFraction ?? economy.boss.passFraction;
  const passed = result.accuracy >= passFraction;
  const { score, stars: raw } = computeScore(result.accuracy, result.speed);
  const stars: Stars = passed ? (raw === 0 ? 1 : raw) : 0;
  const xp = passed
    ? xpForBoss(result.points ?? 0, result.maxPoints ?? 1, opts.firstTry)
    : { total: 0, lines: [] };
  return { passed, stars, score, xp };
}

/** Per-concept outcomes for spaced repetition: a concept is wrong if any mistake names it. */
export function conceptOutcomes(
  conceptIds: string[],
  mistakes: Mistake[],
): { conceptId: string; correct: boolean }[] {
  const missed = new Set(mistakes.map((m) => m.conceptId));
  return conceptIds.map((conceptId) => ({ conceptId, correct: !missed.has(conceptId) }));
}

/** Weighted aggregate of several stage results into one level result. */
export function aggregateStages(results: EngineResult[], weights?: number[]): EngineResult {
  if (results.length === 0) {
    return {
      accuracy: 0,
      speed: 0,
      mistakes: [],
      shortcuts: [],
      itemResults: {},
      outcomes: emptyOutcomes(),
      correct: 0,
      total: 0,
      heartsLost: 0,
    };
  }
  const w = results.map((_, i) => weights?.[i] ?? 1);
  const totalW = w.reduce((s, x) => s + x, 0) || 1;
  const wavg = (pick: (r: EngineResult) => number) =>
    results.reduce((s, r, i) => s + pick(r) * w[i]!, 0) / totalW;
  const hasPoints = results.some((r) => r.points !== undefined);
  return {
    accuracy: wavg((r) => r.accuracy),
    speed: wavg((r) => r.speed),
    mistakes: results.flatMap((r) => r.mistakes),
    shortcuts: results.flatMap((r) => r.shortcuts),
    itemResults: Object.assign({}, ...results.map((r) => r.itemResults)),
    outcomes: {
      ...Object.assign({}, ...results.map((r) => r.outcomes)),
      shortcutsTaken: results.flatMap((r) => r.outcomes.shortcutsTaken),
    },
    correct: results.reduce((s, r) => s + r.correct, 0),
    total: results.reduce((s, r) => s + r.total, 0),
    points: hasPoints ? results.reduce((s, r) => s + (r.points ?? 0), 0) : undefined,
    maxPoints: hasPoints ? results.reduce((s, r) => s + (r.maxPoints ?? 0), 0) : undefined,
    heartsLost: results.reduce((s, r) => s + r.heartsLost, 0),
  };
}

// ---------------------------------------------------------------- direct meter effects (shortcuts, bands, crisis rounds)

export interface MeterOutcome {
  snapshot: PipelineSnapshot;
  /** First meter that hit zero (already reset to the setback value in the snapshot). */
  setback?: MeterId;
}

/** Applies a meter delta (no hearts). A meter hitting zero is a setback, exactly as for mistakes. */
export function applyMeterDelta(
  snapshot: PipelineSnapshot,
  delta: Partial<Record<MeterId, number>>,
): MeterOutcome {
  const meters: Meters = { ...snapshot.meters };
  let setback: MeterId | undefined;
  for (const m of ['safety', 'integrity', 'timeline'] as MeterId[]) {
    const d = delta[m];
    if (!d) continue;
    meters[m] = clampMeter(meters[m] + d);
    if (meters[m] <= 0 && !setback) {
      setback = m;
      meters[m] = economy.meters.setbackResetTo;
    }
  }
  return { snapshot: { ...snapshot, meters }, setback };
}

// ---------------------------------------------------------------- crisis boss

export interface CrisisRoundOutcome {
  cleared: boolean;
  accuracy: number;
  /** 0..1 of the round's budget used (clamped). */
  timeUsedFraction: number;
  points: number;
}

/** Points for one cleared round: 100 + speed bonus, times the streak multiplier. */
export function crisisRoundPoints(timeUsedFraction: number, clearedStreakBefore: number): number {
  const base =
    economy.boss.basePoints + Math.round(economy.boss.speedPoints * (1 - clamp01(timeUsedFraction)));
  return Math.round(base * streakMultiplier(clearedStreakBefore + 1));
}

export function crisisMaxPoints(roundCount: number): number {
  let total = 0;
  for (let i = 0; i < roundCount; i++) total += crisisRoundPoints(0, i);
  return total;
}

export type CrisisOutcome = 'success' | 'partial' | 'fail';

export interface CrisisScore {
  outcome: CrisisOutcome;
  stars: Stars;
  score: number;
  points: number;
  xp: XpBreakdown;
  clearedCount: number;
}

export function scoreCrisis(
  rounds: CrisisRoundOutcome[],
  opts: {
    totalRounds: number;
    passFraction: number;
    poolExpired: boolean;
    meterZero: boolean;
    firstTry: boolean;
  },
): CrisisScore {
  const clearedCount = rounds.filter((r) => r.cleared).length;
  const points = rounds.reduce((s, r) => s + r.points, 0);
  const max = crisisMaxPoints(opts.totalRounds);
  let outcome: CrisisOutcome;
  if (opts.meterZero || clearedCount === 0) outcome = 'fail';
  else if (clearedCount / opts.totalRounds >= opts.passFraction && !opts.poolExpired) outcome = 'success';
  else outcome = 'partial';
  const meanAcc = rounds.length ? rounds.reduce((s, r) => s + r.accuracy, 0) / opts.totalRounds : 0;
  const meanSpeed = rounds.length
    ? rounds.reduce((s, r) => s + (1 - clamp01(r.timeUsedFraction)), 0) / opts.totalRounds
    : 0;
  const { score, stars: raw } = computeScore(meanAcc, meanSpeed);
  const stars: Stars = outcome === 'success' ? (raw === 0 ? 1 : raw) : 0;
  const xp = outcome === 'success' ? xpForBoss(points, max, opts.firstTry) : { total: 0, lines: [] };
  if (outcome === 'success' && xp.lines[0]) xp.lines[0].label = 'Crisis points';
  return { outcome, stars, score, points, xp, clearedCount };
}
