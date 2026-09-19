import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { economy } from '@/content/economy';
import type { MeterId } from '@/content/types';
import { gainHearts, loseHeart as loseHeartPure, refillHearts } from '@/engine/hearts';
import { dayKey, daysBetween } from '@/engine/dates';
import type { Stars, XpBreakdown } from '@/engine/scoring';
import { safeStorage, STORAGE_KEYS } from './storage';

export const PROGRESS_VERSION = 1;

export interface LevelRecord {
  stars: number;
  bestScore: number;
  attempts: number;
  completedAt?: string;
}

export interface BossRecord {
  stars: number;
  bestPoints: number;
  attempts: number;
  completedAt?: string;
}

export interface ReviewRecord {
  count: number;
  lastAt: string;
}

export interface CardRecord {
  firstViewedAt: string;
  flipped: boolean;
  lastHeartClaimDay?: string;
}

export interface ConceptRecord {
  /** Leitner box 1..5 (5 = retired). */
  box: number;
  dueAt: string;
  misses: number;
}

export interface Meters {
  safety: number;
  integrity: number;
  timeline: number;
}

export interface ProgressData {
  xp: number;
  hearts: number;
  heartsUpdatedAt: string | null;
  streak: { count: number; lastDay: string | null; freezes: number };
  levels: Record<string, LevelRecord>;
  bosses: Record<string, BossRecord>;
  reviews: Record<string, ReviewRecord>;
  cardsViewed: Record<string, CardRecord>;
  meters: Meters;
  concepts: Record<string, ConceptRecord>;
  worldsCompleted: string[];
  worldsStarted: string[];
  introSeen: boolean;
  finaleSeen: boolean;
  tipsDismissed: Record<string, boolean>;
  createdAt: string;
}

export interface ProgressActions {
  markCardViewed: (roleId: string, now?: Date) => { xpGained: number };
  claimCodexHeart: (roleId: string, now?: Date) => boolean;
  recordLevelResult: (
    levelId: string,
    r: { stars: Stars; score: number; xp: XpBreakdown },
    now?: Date,
  ) => void;
  recordBossResult: (
    bossId: string,
    r: { stars: Stars; points: number; xp: XpBreakdown },
    now?: Date,
  ) => void;
  recordReview: (reviewId: string, xp: XpBreakdown, now?: Date) => void;
  addXp: (amount: number) => void;
  loseHeart: (now?: Date) => number;
  syncHearts: (now?: Date) => void;
  applyMeter: (meter: MeterId, delta: number) => number;
  resetMeter: (meter: MeterId, to?: number) => void;
  startWorld: (worldId: string) => void;
  completeWorld: (worldId: string) => { xpGained: number };
  recordConcept: (conceptId: string, correct: boolean, now?: Date) => void;
  touchStreak: (now?: Date) => { milestoneXp: number };
  setIntroSeen: () => void;
  setFinaleSeen: () => void;
  dismissTip: (id: string) => void;
  resetProgress: () => void;
}

export type ProgressState = ProgressData & ProgressActions;

export function initialProgress(now: Date = new Date()): ProgressData {
  return {
    xp: 0,
    hearts: economy.hearts.max,
    heartsUpdatedAt: null,
    streak: { count: 0, lastDay: null, freezes: 0 },
    levels: {},
    bosses: {},
    reviews: {},
    cardsViewed: {},
    meters: { safety: economy.meters.max, integrity: economy.meters.max, timeline: economy.meters.max },
    concepts: {},
    worldsCompleted: [],
    worldsStarted: [],
    introSeen: false,
    finaleSeen: false,
    tipsDismissed: {},
    createdAt: now.toISOString(),
  };
}

const clampMeter = (n: number) => Math.max(0, Math.min(economy.meters.max, Math.round(n)));

/**
 * Schema migrations. Add a case per version bump; each case upgrades from (version) to (version + 1).
 * Unknown or corrupt data falls back to a fresh profile rather than crashing.
 */
export function migrateProgress(persisted: unknown, fromVersion: number): ProgressData {
  let data = (persisted ?? {}) as Partial<ProgressData>;
  let version = fromVersion;
  while (version < PROGRESS_VERSION) {
    switch (version) {
      // case 1: data = migrateV1toV2(data); break;
      default:
        data = {};
    }
    version += 1;
  }
  // Fill any missing keys with defaults so partial/corrupt saves still load.
  return { ...initialProgress(), ...data };
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...initialProgress(),

      markCardViewed: (roleId, now = new Date()) => {
        const existing = get().cardsViewed[roleId];
        if (existing) {
          if (!existing.flipped)
            set({ cardsViewed: { ...get().cardsViewed, [roleId]: { ...existing, flipped: true } } });
          return { xpGained: 0 };
        }
        set({
          cardsViewed: {
            ...get().cardsViewed,
            [roleId]: { firstViewedAt: now.toISOString(), flipped: true },
          },
          xp: get().xp + economy.xp.roleCardFirstView,
        });
        return { xpGained: economy.xp.roleCardFirstView };
      },

      claimCodexHeart: (roleId, now = new Date()) => {
        const s = get();
        const card = s.cardsViewed[roleId];
        const today = dayKey(now);
        if (!card || card.lastHeartClaimDay === today || s.hearts >= economy.hearts.max) return false;
        const next = gainHearts(
          { hearts: s.hearts, heartsUpdatedAt: s.heartsUpdatedAt },
          economy.hearts.codexReviewRefill,
        );
        set({
          ...next,
          cardsViewed: { ...s.cardsViewed, [roleId]: { ...card, lastHeartClaimDay: today } },
        });
        return true;
      },

      recordLevelResult: (levelId, r, now = new Date()) => {
        const s = get();
        const prev = s.levels[levelId] ?? { stars: 0, bestScore: 0, attempts: 0 };
        const record: LevelRecord = {
          stars: Math.max(prev.stars, r.stars),
          bestScore: Math.max(prev.bestScore, r.score),
          attempts: prev.attempts + 1,
          completedAt: prev.completedAt ?? (r.stars > 0 ? now.toISOString() : undefined),
        };
        set({ levels: { ...s.levels, [levelId]: record }, xp: s.xp + r.xp.total });
      },

      recordBossResult: (bossId, r, now = new Date()) => {
        const s = get();
        const prev = s.bosses[bossId] ?? { stars: 0, bestPoints: 0, attempts: 0 };
        const record: BossRecord = {
          stars: Math.max(prev.stars, r.stars),
          bestPoints: Math.max(prev.bestPoints, r.points),
          attempts: prev.attempts + 1,
          completedAt: prev.completedAt ?? (r.stars > 0 ? now.toISOString() : undefined),
        };
        set({ bosses: { ...s.bosses, [bossId]: record }, xp: s.xp + r.xp.total });
      },

      recordReview: (reviewId, xp, now = new Date()) => {
        const s = get();
        const prev = s.reviews[reviewId];
        set({
          reviews: { ...s.reviews, [reviewId]: { count: (prev?.count ?? 0) + 1, lastAt: now.toISOString() } },
          xp: s.xp + xp.total,
          hearts: economy.hearts.max,
          heartsUpdatedAt: null,
        });
      },

      addXp: (amount) => set({ xp: get().xp + amount }),

      loseHeart: (now = new Date()) => {
        const s = get();
        const next = loseHeartPure({ hearts: s.hearts, heartsUpdatedAt: s.heartsUpdatedAt }, now);
        set(next);
        return next.hearts;
      },

      syncHearts: (now = new Date()) => {
        const s = get();
        const next = refillHearts({ hearts: s.hearts, heartsUpdatedAt: s.heartsUpdatedAt }, now);
        if (next.hearts !== s.hearts || next.heartsUpdatedAt !== s.heartsUpdatedAt) set(next);
      },

      applyMeter: (meter, delta) => {
        const s = get();
        const value = clampMeter(s.meters[meter] + delta);
        set({ meters: { ...s.meters, [meter]: value } });
        return value;
      },

      resetMeter: (meter, to = economy.meters.setbackResetTo) => {
        set({ meters: { ...get().meters, [meter]: clampMeter(to) } });
      },

      startWorld: (worldId) => {
        const s = get();
        if (s.worldsStarted.includes(worldId)) return;
        const min = economy.meters.worldStartMinimum;
        set({
          worldsStarted: [...s.worldsStarted, worldId],
          meters: {
            safety: Math.max(s.meters.safety, min),
            integrity: Math.max(s.meters.integrity, min),
            timeline: Math.max(s.meters.timeline, min),
          },
        });
      },

      completeWorld: (worldId) => {
        const s = get();
        if (s.worldsCompleted.includes(worldId)) return { xpGained: 0 };
        const metersAbove = (['safety', 'integrity', 'timeline'] as MeterId[]).filter(
          (m) => s.meters[m] >= economy.xp.worldMeterThreshold,
        ).length;
        const xpGained = metersAbove * economy.xp.worldMeterBonus;
        set({
          worldsCompleted: [...s.worldsCompleted, worldId],
          xp: s.xp + xpGained,
          streak: { ...s.streak, freezes: Math.min(economy.streak.maxFreezes, s.streak.freezes + 1) },
        });
        return { xpGained };
      },

      recordConcept: (conceptId, correct, now = new Date()) => {
        const s = get();
        const prev = s.concepts[conceptId];
        const delays = economy.review.boxDelaysDays;
        let box: number;
        if (correct) box = Math.min(5, (prev?.box ?? 1) + 1);
        else box = 1;
        const delayDays = delays[Math.min(box, delays.length) - 1] ?? 0;
        const dueAt = new Date(now.getTime() + delayDays * 86_400_000).toISOString();
        set({
          concepts: {
            ...s.concepts,
            [conceptId]: { box, dueAt, misses: (prev?.misses ?? 0) + (correct ? 0 : 1) },
          },
        });
      },

      touchStreak: (now = new Date()) => {
        const s = get();
        const today = dayKey(now);
        const { count, lastDay, freezes } = s.streak;
        if (lastDay === today) return { milestoneXp: 0 };
        let nextCount = 1;
        let nextFreezes = freezes;
        if (lastDay) {
          const gap = daysBetween(lastDay, today);
          if (gap === 1) nextCount = count + 1;
          else if (gap === 2 && freezes > 0) {
            nextCount = count + 1;
            nextFreezes = freezes - 1;
          }
        }
        const milestoneXp = economy.xp.streakMilestones[nextCount] ?? 0;
        set({ streak: { count: nextCount, lastDay: today, freezes: nextFreezes }, xp: s.xp + milestoneXp });
        return { milestoneXp };
      },

      setIntroSeen: () => set({ introSeen: true }),
      setFinaleSeen: () => set({ finaleSeen: true }),
      dismissTip: (id) => set({ tipsDismissed: { ...get().tipsDismissed, [id]: true } }),

      resetProgress: () => set({ ...initialProgress() }),
    }),
    {
      name: STORAGE_KEYS.progress,
      version: PROGRESS_VERSION,
      storage: createJSONStorage(() => safeStorage),
      migrate: (persisted, version) => migrateProgress(persisted, version) as unknown as ProgressState,
      merge: (persisted, current) => ({ ...current, ...migrateProgress(persisted, PROGRESS_VERSION) }),
      partialize: (s) => {
        const {
          xp,
          hearts,
          heartsUpdatedAt,
          streak,
          levels,
          bosses,
          reviews,
          cardsViewed,
          meters,
          concepts,
          worldsCompleted,
          worldsStarted,
          introSeen,
          finaleSeen,
          tipsDismissed,
          createdAt,
        } = s;
        return {
          xp,
          hearts,
          heartsUpdatedAt,
          streak,
          levels,
          bosses,
          reviews,
          cardsViewed,
          meters,
          concepts,
          worldsCompleted,
          worldsStarted,
          introSeen,
          finaleSeen,
          tipsDismissed,
          createdAt,
        };
      },
    },
  ),
);

/** Selector helpers */
export const selectProgressSnapshot = (s: ProgressState) => ({
  levels: s.levels,
  bosses: s.bosses,
  reviews: s.reviews,
  finaleSeen: s.finaleSeen,
});
