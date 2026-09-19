import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { economy } from '@/content/economy';
import type { MeterId } from '@/content/types';
import type { ArtifactStore, StoredArtifact } from '@/content/artifacts';
import { gainHearts, loseHeart as loseHeartPure, refillHearts } from '@/engine/hearts';
import { dayKey, daysBetween } from '@/engine/dates';
import type { Stars, XpBreakdown } from '@/engine/scoring';
import { safeStorage, STORAGE_KEYS } from './storage';

export const PROGRESS_VERSION = 2;

/** Node ids renamed between schema versions; applied to every id-keyed map on migration. */
export const ID_RENAMES: Record<string, string> = { 'w1-boss': 'w1-crisis' };

export interface LevelRecord {
  stars: number;
  bestScore: number;
  attempts: number;
  completedAt?: string;
}

export interface CrisisRecord {
  stars: number;
  bestPoints: number;
  attempts: number;
  completedAt?: string;
  /** Migrated from a v1 boss-quiz record. */
  legacy?: boolean;
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
  box: number;
  dueAt: string;
  misses: number;
}

export interface SituationRecord {
  levelId: string;
  stageId: string;
  itemId: string;
  box: number;
  dueAt: string;
  misses: number;
}

export interface KnowledgeRecord {
  attempts: number;
  bestFraction: number;
  ribbon: boolean;
  lastPlayedDay?: string;
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
  crises: Record<string, CrisisRecord>;
  reviews: Record<string, ReviewRecord>;
  cardsViewed: Record<string, CardRecord>;
  meters: Meters;
  concepts: Record<string, ConceptRecord>;
  situations: Record<string, SituationRecord>;
  artifacts: ArtifactStore;
  knowledge: Record<string, KnowledgeRecord>;
  worldsCompleted: string[];
  worldsStarted: string[];
  introSeen: boolean;
  finaleSeen: boolean;
  tipsDismissed: Record<string, boolean>;
  createdAt: string;
}

export const situationKey = (levelId: string, stageId: string, itemId: string) =>
  `${levelId}:${stageId}:${itemId}`;

export interface ProgressActions {
  markCardViewed: (roleId: string, now?: Date) => { xpGained: number };
  claimCodexHeart: (roleId: string, now?: Date) => boolean;
  recordLevelResult: (
    levelId: string,
    r: { stars: Stars; score: number; xp: XpBreakdown },
    now?: Date,
  ) => void;
  recordCrisisResult: (
    crisisId: string,
    r: { stars: Stars; points: number; xp: XpBreakdown },
    now?: Date,
  ) => void;
  recordReview: (reviewId: string, xp: XpBreakdown, now?: Date) => void;
  recordKnowledge: (roleId: string, fraction: number, xpGained: number, now?: Date) => void;
  setArtifacts: (artifacts: StoredArtifact[]) => void;
  addXp: (amount: number) => void;
  commitSnapshot: (s: { hearts: number; heartsUpdatedAt: string | null; meters: Meters }) => void;
  loseHeart: (now?: Date) => number;
  syncHearts: (now?: Date) => void;
  applyMeter: (meter: MeterId, delta: number) => number;
  resetMeter: (meter: MeterId, to?: number) => void;
  startWorld: (worldId: string) => void;
  completeWorld: (worldId: string) => { xpGained: number };
  recordConcept: (conceptId: string, correct: boolean, now?: Date) => void;
  recordSituation: (levelId: string, stageId: string, itemId: string, correct: boolean, now?: Date) => void;
  pruneSituations: (exists: (levelId: string, stageId: string, itemId: string) => boolean) => void;
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
    crises: {},
    reviews: {},
    cardsViewed: {},
    meters: { safety: economy.meters.max, integrity: economy.meters.max, timeline: economy.meters.max },
    concepts: {},
    situations: {},
    artifacts: {},
    knowledge: {},
    worldsCompleted: [],
    worldsStarted: [],
    introSeen: false,
    finaleSeen: false,
    tipsDismissed: {},
    createdAt: now.toISOString(),
  };
}

const clampMeter = (n: number) => Math.max(0, Math.min(economy.meters.max, Math.round(n)));

function renameKeys<T>(map: Record<string, T> | undefined): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [k, v] of Object.entries(map ?? {})) out[ID_RENAMES[k] ?? k] = v;
  return out;
}

/** v1 -> v2: boss records become legacy crisis records, ids renamed everywhere, new maps added. */
function migrateV1toV2(data: Record<string, unknown>): Record<string, unknown> {
  const bosses = renameKeys(data.bosses as Record<string, CrisisRecord> | undefined);
  const crises: Record<string, CrisisRecord> = {};
  for (const [k, v] of Object.entries(bosses)) crises[k] = { ...v, legacy: true };
  const renameList = (list: unknown) =>
    Array.isArray(list) ? list.map((x) => ID_RENAMES[String(x)] ?? x) : [];
  const { bosses: _drop, ...rest } = data;
  return {
    ...rest,
    levels: renameKeys(data.levels as Record<string, LevelRecord> | undefined),
    reviews: renameKeys(data.reviews as Record<string, ReviewRecord> | undefined),
    tipsDismissed: renameKeys(data.tipsDismissed as Record<string, boolean> | undefined),
    worldsCompleted: renameList(data.worldsCompleted),
    worldsStarted: renameList(data.worldsStarted),
    crises,
    situations: {},
    artifacts: {},
    knowledge: {},
  };
}

/**
 * Schema migrations, one case per version. Unknown or corrupt data falls back to a fresh
 * profile; partial saves are filled with defaults.
 */
export function migrateProgress(persisted: unknown, fromVersion: number): ProgressData {
  let data = (persisted && typeof persisted === 'object' ? persisted : {}) as Record<string, unknown>;
  let version = fromVersion;
  while (version < PROGRESS_VERSION) {
    switch (version) {
      case 1:
        data = migrateV1toV2(data);
        break;
      default:
        data = {};
    }
    version += 1;
  }
  return { ...initialProgress(), ...(data as Partial<ProgressData>) };
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
        set({ ...next, cardsViewed: { ...s.cardsViewed, [roleId]: { ...card, lastHeartClaimDay: today } } });
        return true;
      },

      recordLevelResult: (levelId, r, now = new Date()) => {
        const s = get();
        const prev = s.levels[levelId] ?? { stars: 0, bestScore: 0, attempts: 0 };
        set({
          levels: {
            ...s.levels,
            [levelId]: {
              stars: Math.max(prev.stars, r.stars),
              bestScore: Math.max(prev.bestScore, r.score),
              attempts: prev.attempts + 1,
              completedAt: prev.completedAt ?? (r.stars > 0 ? now.toISOString() : undefined),
            },
          },
          xp: s.xp + r.xp.total,
        });
      },

      recordCrisisResult: (crisisId, r, now = new Date()) => {
        const s = get();
        const prev = s.crises[crisisId] ?? { stars: 0, bestPoints: 0, attempts: 0 };
        set({
          crises: {
            ...s.crises,
            [crisisId]: {
              stars: Math.max(prev.stars, r.stars),
              bestPoints: Math.max(prev.bestPoints, r.points),
              attempts: prev.attempts + 1,
              completedAt: prev.completedAt ?? (r.stars > 0 ? now.toISOString() : undefined),
              legacy: r.stars > 0 ? undefined : prev.legacy,
            },
          },
          xp: s.xp + r.xp.total,
        });
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

      recordKnowledge: (roleId, fraction, xpGained, now = new Date()) => {
        const s = get();
        const prev = s.knowledge[roleId] ?? { attempts: 0, bestFraction: 0, ribbon: false };
        const best = Math.max(prev.bestFraction, fraction);
        set({
          knowledge: {
            ...s.knowledge,
            [roleId]: {
              attempts: prev.attempts + 1,
              bestFraction: best,
              ribbon: best >= economy.knowledge.ribbonFraction,
              lastPlayedDay: dayKey(now),
            },
          },
          xp: s.xp + xpGained,
        });
      },

      setArtifacts: (artifacts) => {
        if (artifacts.length === 0) return;
        const next: ArtifactStore = { ...get().artifacts };
        for (const a of artifacts) next[a.key] = a;
        set({ artifacts: next });
      },

      addXp: (amount) => set({ xp: get().xp + amount }),

      commitSnapshot: (s) =>
        set({ hearts: s.hearts, heartsUpdatedAt: s.heartsUpdatedAt, meters: { ...s.meters } }),

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

      resetMeter: (meter, to = economy.meters.setbackResetTo) =>
        set({ meters: { ...get().meters, [meter]: clampMeter(to) } }),

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
        const box = correct ? Math.min(5, (prev?.box ?? 1) + 1) : 1;
        const delayDays =
          economy.review.boxDelaysDays[Math.min(box, economy.review.boxDelaysDays.length) - 1] ?? 0;
        set({
          concepts: {
            ...s.concepts,
            [conceptId]: {
              box,
              dueAt: new Date(now.getTime() + delayDays * 86_400_000).toISOString(),
              misses: (prev?.misses ?? 0) + (correct ? 0 : 1),
            },
          },
        });
      },

      recordSituation: (levelId, stageId, itemId, correct, now = new Date()) => {
        const s = get();
        const key = situationKey(levelId, stageId, itemId);
        const prev = s.situations[key];
        if (correct && !prev) return; // nothing to review
        const box = correct ? Math.min(5, (prev?.box ?? 1) + 1) : 1;
        const delayDays =
          economy.review.boxDelaysDays[Math.min(box, economy.review.boxDelaysDays.length) - 1] ?? 0;
        set({
          situations: {
            ...s.situations,
            [key]: {
              levelId,
              stageId,
              itemId,
              box,
              dueAt: new Date(now.getTime() + delayDays * 86_400_000).toISOString(),
              misses: (prev?.misses ?? 0) + (correct ? 0 : 1),
            },
          },
        });
      },

      pruneSituations: (exists) => {
        const s = get();
        const kept: Record<string, SituationRecord> = {};
        let changed = false;
        for (const [k, v] of Object.entries(s.situations)) {
          if (exists(v.levelId, v.stageId, v.itemId)) kept[k] = v;
          else changed = true;
        }
        if (changed) set({ situations: kept });
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
          crises,
          reviews,
          cardsViewed,
          meters,
          concepts,
          situations,
          artifacts,
          knowledge,
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
          crises,
          reviews,
          cardsViewed,
          meters,
          concepts,
          situations,
          artifacts,
          knowledge,
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
