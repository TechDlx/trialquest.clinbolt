import type {
  CrisisBoss,
  KnowledgeCheck,
  Level,
  QuizQuestion,
  ReviewNode,
  Role,
  World,
  WorldId,
} from './types';
import { worlds, worldById } from './worlds';
import { roleIndex, roleRefById } from './roleIndex';
import { glossary, glossaryById } from './glossary';
import type { WorldPack } from './pack';
export { artifactRegistry } from './artifacts';
export type { WorldPack } from './pack';

/**
 * Content registry. The world list, role index, story beats and glossary are always present.
 * Each world's roles, levels, crisis, review nodes and Test Yourself sets live in a separate
 * chunk (`worlds/<world>/pack.ts`) that `loadWorld` registers on demand, so the first paint
 * carries one world, not eight. Tests load every world up front (src/test/setup.ts).
 */
const roles: Role[] = [];
const levels: Level[] = [];
const crises: CrisisBoss[] = [];
const reviewNodes: ReviewNode[] = [];
const knowledge: KnowledgeCheck[] = [];

export const content = {
  worlds,
  worldById,
  roleIndex,
  roleRefById,
  roles,
  roleById: {} as Record<string, Role>,
  levels,
  levelById: {} as Record<string, Level>,
  crises,
  crisisById: {} as Record<string, CrisisBoss>,
  reviewNodes,
  reviewById: {} as Record<string, ReviewNode>,
  knowledge,
  knowledgeByRole: {} as Record<string, KnowledgeCheck>,
  glossary,
  glossaryById,
};

export type Content = typeof content;

const loaders: Record<WorldId, () => Promise<{ default: WorldPack }>> = {
  w1: () => import('./worlds/w1/pack'),
  w2: () => import('./worlds/w2/pack'),
  w3: () => import('./worlds/w3/pack'),
  w4: () => import('./worlds/w4/pack'),
  w5: () => import('./worlds/w5/pack'),
  w6: () => import('./worlds/w6/pack'),
  w7: () => import('./worlds/w7/pack'),
  w8: () => import('./worlds/w8/pack'),
};

const loaded = new Set<WorldId>();
const inflight = new Map<WorldId, Promise<void>>();
const listeners = new Set<() => void>();
const worldNumber = (id: string) => worldById[id]?.number ?? 99;
const byWorld = <T extends { worldId: string }>(arr: T[]) =>
  arr.sort((a, b) => worldNumber(a.worldId) - worldNumber(b.worldId));

function register(pack: WorldPack) {
  roles.push(...pack.roles);
  levels.push(...pack.levels);
  crises.push(pack.crisis);
  reviewNodes.push(...pack.reviews);
  knowledge.push(...pack.knowledge);
  // Worlds may arrive out of order; keep every list in play order (stable sort keeps in-world order).
  byWorld(roles);
  byWorld(levels);
  byWorld(crises);
  byWorld(reviewNodes);
  for (const r of pack.roles) content.roleById[r.id] = r;
  for (const l of pack.levels) content.levelById[l.id] = l;
  content.crisisById[pack.crisis.id] = pack.crisis;
  for (const r of pack.reviews) content.reviewById[r.id] = r;
  for (const k of pack.knowledge) content.knowledgeByRole[k.roleId] = k;
}

export function isWorldLoaded(id: WorldId): boolean {
  return loaded.has(id);
}

export function loadWorld(id: WorldId): Promise<void> {
  if (loaded.has(id)) return Promise.resolve();
  let p = inflight.get(id);
  if (!p) {
    p = loaders[id]().then((m) => {
      if (!loaded.has(id)) {
        register(m.default);
        loaded.add(id);
      }
      inflight.delete(id);
      for (const l of listeners) l();
    });
    inflight.set(id, p);
  }
  return p;
}

export function loadWorlds(ids: WorldId[]): Promise<void> {
  return Promise.all(ids.map(loadWorld)).then(() => undefined);
}

export function loadAllWorlds(): Promise<void> {
  return loadWorlds(worlds.map((w) => w.id));
}

/** Subscribe to registry changes (a world finished loading). Returns the unsubscribe function. */
export function onContentChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The world a level, crisis or review id belongs to ('w3-l4' → 'w3'); undefined for lab ids. */
export function worldIdOf(id: string | undefined): WorldId | undefined {
  const head = id?.split('-')[0];
  return head && worldById[head] ? (head as WorldId) : undefined;
}

/** Worlds needed to show a set of roles (by role id). */
export function worldsOfRoles(roleIds: string[]): WorldId[] {
  return [...new Set(roleIds.map((id) => roleRefById[id]?.worldId).filter((w): w is WorldId => !!w))];
}

export function worldForLevel(levelId: string): World | undefined {
  const level = content.levelById[levelId];
  return level ? worldById[level.worldId] : undefined;
}

/** True when a level/stage/item triple exists in content (used to prune stale situations). */
export function situationExists(levelId: string, stageId: string, itemId: string): boolean {
  const level = content.levelById[levelId];
  const stage = level?.stages.find((s) => s.id === stageId);
  if (!stage) return false;
  const g = stage.game as unknown as Record<string, unknown>;
  for (const v of Object.values(g)) {
    if (Array.isArray(v) && v.some((x) => x && typeof x === 'object' && (x as { id?: string }).id === itemId))
      return true;
    if (Array.isArray(v))
      for (const n of v as { choices?: { id: string }[] }[])
        if (n.choices?.some((c) => c.id === itemId)) return true;
  }
  if (stage.game.engine === 'spot-the-impostor' && stage.game.signOff?.id === itemId) return true;
  return level?.shortcutPrompt?.id === itemId;
}

/** Test Yourself questions for a role, missed concepts first. */
export function knowledgeQuestions(
  roleId: string,
  conceptBox: (conceptId: string) => number,
): QuizQuestion[] {
  const kc = content.knowledgeByRole[roleId];
  if (!kc) return [];
  return [...kc.questions].sort((a, b) => conceptBox(a.conceptId) - conceptBox(b.conceptId));
}
