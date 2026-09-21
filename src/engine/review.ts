/**
 * Review micro-rounds: rebuilds a missed situation as a small round of its original engine,
 * padded with context so the round is meaningful. Deterministic (seeded by the situation key).
 */
import type { Content } from '@/content';
import type { EngineResult } from '@/engine/scoring';
import { economy } from '@/content/economy';
import type { MainPathConfig, Stage } from '@/content/types';
import { getCollection, findNodeOfChoice } from './registry';
import { seededShuffle } from './engines/types';
import type { SituationRecord } from '@/store/progress';

export interface ReviewRound {
  key: string;
  levelId: string;
  levelTitle: string;
  stage: Stage;
  onlyItems: string[];
  /** The item under review (for scoring the situation afterwards). */
  itemId: string;
  /** True when the item is a shortcut carrier: "correct" means not taking it. */
  isShortcut: boolean;
}

/**
 * Did the replay fix the situation? Most engines key results by the item under review.
 * A scenario records the choice made (not the missed one) and an impostor round marks
 * every un-accused card "skipped", so those two are judged on the round as a whole.
 */
export function roundCorrect(round: ReviewRound, r: EngineResult): boolean {
  if (round.isShortcut) return !r.outcomes.shortcutsTaken.includes(round.itemId);
  const engine = round.stage.game.engine;
  if (engine === 'branching-scenario') return r.mistakes.length === 0 && r.accuracy >= 1;
  if (engine === 'spot-the-impostor') return r.mistakes.length === 0 && r.correct > 0;
  return r.itemResults[round.itemId] === 'correct';
}

/** Engines whose review round shows several cards, each one a separate decision. */
const CARD_ENGINES = new Set<string>(['bucket-sort', 'sequence-sort', 'match-pairs', 'spot-the-impostor']);

function hash(s: string): number {
  let h = 7;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 1_000_003;
  return h + 1;
}

const pickOthers = (ids: string[], exclude: string[], n: number, seed: number) =>
  seededShuffle(
    ids.filter((i) => !exclude.includes(i)),
    seed,
  ).slice(0, n);

/** Builds one round for a situation, or null if it cannot be reconstructed. */
export function buildReviewRound(
  c: Content,
  sit: SituationRecord,
  seconds: number = economy.review.roundSeconds,
): ReviewRound | null {
  const level = c.levelById[sit.levelId];
  const stage = level?.stages.find((s) => s.id === sit.stageId);
  if (!level || !stage || stage.game.engine === 'quiz-blitz') return null;
  const seed = hash(`${sit.levelId}:${sit.stageId}:${sit.itemId}`);
  const g = stage.game as MainPathConfig;
  let onlyItems: string[] = [];
  let isShortcut = false;
  let game: MainPathConfig = { ...g, seconds } as MainPathConfig;

  switch (g.engine) {
    case 'bucket-sort': {
      const cardIds = g.cards.map((x) => x.id);
      isShortcut = g.buckets.some((b) => b.id === sit.itemId && b.shortcut);
      onlyItems = isShortcut
        ? pickOthers(cardIds, [], 3, seed)
        : [sit.itemId, ...pickOthers(cardIds, [sit.itemId], 2, seed)];
      break;
    }
    case 'builder': {
      const part = g.parts.find((x) => x.id === sit.itemId);
      isShortcut = !!part?.shortcut;
      const slot =
        g.slots.find((s) => s.id === sit.itemId) ?? g.slots.find((s) => s.id === part?.slotId) ?? g.slots[0]!;
      const correct = g.parts.find((x) => x.slotId === slot.id)!;
      const distractors = pickOthers(
        g.parts.filter((x) => x.slotId !== slot.id).map((x) => x.id),
        [correct.id, sit.itemId],
        isShortcut ? 1 : 2,
        seed,
      );
      onlyItems = [slot.id, correct.id, ...(isShortcut ? [sit.itemId] : []), ...distractors];
      break;
    }
    case 'branching-scenario': {
      const node = findNodeOfChoice(g.nodes, sit.itemId);
      if (!node) return null;
      isShortcut = !!node.choices?.find((ch) => ch.id === sit.itemId)?.shortcut;
      onlyItems = [sit.itemId];
      game = g; // untimed
      break;
    }
    case 'spot-the-impostor': {
      isShortcut = g.signOff?.id === sit.itemId;
      const impostor = g.cards.find((x) => x.impostor)!.id;
      const base = isShortcut ? [impostor] : [sit.itemId, ...(sit.itemId === impostor ? [] : [impostor])];
      onlyItems = [
        ...base,
        ...pickOthers(
          g.cards.map((x) => x.id),
          base,
          3 - base.length,
          seed,
        ),
      ];
      break;
    }
    case 'allocator': {
      isShortcut = !!g.presets?.some((p) => p.id === sit.itemId && p.shortcut);
      const cat =
        g.categories.find((x) => x.id === sit.itemId) ??
        g.categories.find((x) => x.id === g.simulation?.input.categoryId) ??
        g.categories[0]!;
      onlyItems = [cat.id];
      const { simulation: _drop, ...rest } = g;
      game = { ...rest, seconds } as MainPathConfig;
      break;
    }
    case 'sequence-sort': {
      const i = g.items.findIndex((x) => x.id === sit.itemId);
      if (i < 0) return null;
      const lo = Math.max(0, Math.min(i - 1, g.items.length - 3));
      onlyItems = g.items.slice(lo, lo + 3).map((x) => x.id);
      break;
    }
    case 'match-pairs': {
      onlyItems = [
        sit.itemId,
        ...pickOthers(
          g.pairs.map((x) => x.id),
          [sit.itemId],
          2,
          seed,
        ),
      ];
      break;
    }
    case 'dash-manager': {
      isShortcut = g.stations.some((s) => s.id === sit.itemId && s.shortcut);
      onlyItems = isShortcut
        ? pickOthers(
            g.items.map((x) => x.id),
            [],
            1,
            seed,
          )
        : [sit.itemId];
      break;
    }
  }
  if (!isShortcut && !getCollection(g, 'x') && onlyItems.length === 0) return null;
  // The clock covers the whole round, so it grows with the cards the player must place.
  if ('seconds' in game && game !== g) {
    const cards = CARD_ENGINES.has(g.engine) ? onlyItems.length : 1;
    game = { ...game, seconds: Math.max(seconds, economy.review.secondsPerCard * cards) } as MainPathConfig;
  }
  return {
    key: `${sit.levelId}:${sit.stageId}:${sit.itemId}`,
    levelId: level.id,
    levelTitle: level.title,
    stage: { ...stage, game },
    onlyItems,
    itemId: sit.itemId,
    isShortcut,
  };
}

/** Due situations, oldest first, up to the review limit. */
export function dueSituations(
  situations: Record<string, SituationRecord>,
  now = new Date(),
  max = economy.review.maxItems,
): SituationRecord[] {
  return Object.values(situations)
    .filter((s) => s.box < 5 && new Date(s.dueAt).getTime() <= now.getTime())
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, max);
}
