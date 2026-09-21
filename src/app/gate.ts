import { content } from '@/content';
import { labLevelById } from '@/content/lab';
import { computeMapState, isPlayable, type MapState } from '@/engine/progression';
import type { Route } from './router';

/** The slice of progress the gate reads. */
export interface GateProgress {
  levels: Record<string, { stars: number }>;
  crises: Record<string, { stars: number }>;
  reviews: Record<string, { count: number }>;
  finaleSeen?: boolean;
  cardsViewed: Record<string, unknown>;
}

const playable = (map: MapState, nodeId: string) => isPlayable(map.nodeStatus[nodeId] ?? 'locked');

// Reads the map nodes, not levelById: a world's levels load lazily, its nodes are always there.
const roleLevelDone = (roleId: string, p: GateProgress) =>
  content.worlds.some((w) =>
    w.nodes.some((n) => n.kind === 'level' && n.roleId === roleId && (p.levels[n.id]?.stars ?? 0) > 0),
  );

/**
 * Deep links obey the same unlock rules as the map: a route that plays, reveals or rewards a
 * node is open only when the map would let the player tap that node. Returns true when the
 * route must be refused. Unknown ids pass through so each screen shows its own "not found".
 */
export function isLockedRoute(route: Route, p: GateProgress): boolean {
  const map = computeMapState(content.worlds, p);
  const knownNode = (id: string) => id in map.nodeStatus;
  const levelLocked = (levelId: string) =>
    !labLevelById[levelId] && knownNode(levelId) && !playable(map, levelId);

  switch (route.name) {
    case 'badge':
    case 'level':
      return levelLocked(route.levelId);
    case 'role':
      if (route.levelId) return levelLocked(route.levelId);
      // A card on its own is a Codex page: only for cards already collected.
      return !!content.roleRefById[route.roleId] && !p.cardsViewed[route.roleId];
    case 'crisis':
      return knownNode(route.crisisId) && !playable(map, route.crisisId);
    case 'review':
      return knownNode(route.reviewId) && !playable(map, route.reviewId);
    case 'story':
      if (!(route.worldId in map.worldUnlocked)) return false;
      return route.beat === 'intro' ? !map.worldUnlocked[route.worldId] : !map.worldComplete[route.worldId];
    case 'test':
      if (route.roleId) return !!content.roleRefById[route.roleId] && !roleLevelDone(route.roleId, p);
      return route.worldId !== undefined && map.worldUnlocked[route.worldId] === false;
    case 'finale': {
      const finale = content.worlds.flatMap((w) => w.nodes).find((n) => n.kind === 'finale');
      return !!finale && !playable(map, finale.id);
    }
    default:
      return false;
  }
}
