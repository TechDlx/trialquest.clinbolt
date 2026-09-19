import type { CrisisBoss, KnowledgeCheck, Level, QuizQuestion, ReviewNode, Role, World } from './types';
import { worlds, worldById } from './worlds';
import { roleIndex, roleRefById } from './roleIndex';
import { glossary, glossaryById } from './glossary';
import { w1Crisis, w1Levels, w1Review, w1Roles } from './worlds/w1';
import { w2Crisis, w2Levels, w2Review, w2Roles } from './worlds/w2';
import { w4Levels } from './worlds/w4/levels';
import { w1Knowledge } from './knowledge/w1';
import { w2Knowledge } from './knowledge/w2';
export { artifactRegistry } from './artifacts';

/**
 * Content registry. Milestone 3 turns this into per-world lazy imports.
 * Levels from planned worlds may be registered early when they consume artifacts (w4-l4).
 */
const roles: Role[] = [...w1Roles, ...w2Roles];
const levels: Level[] = [...w1Levels, ...w2Levels, ...w4Levels];
const crises: CrisisBoss[] = [w1Crisis, w2Crisis];
const reviewNodes: ReviewNode[] = [w1Review, w2Review];
const knowledge: KnowledgeCheck[] = [...w1Knowledge, ...w2Knowledge];

export const content = {
  worlds,
  worldById,
  roleIndex,
  roleRefById,
  roles,
  roleById: Object.fromEntries(roles.map((r) => [r.id, r])) as Record<string, Role>,
  levels,
  levelById: Object.fromEntries(levels.map((l) => [l.id, l])) as Record<string, Level>,
  crises,
  crisisById: Object.fromEntries(crises.map((c) => [c.id, c])) as Record<string, CrisisBoss>,
  reviewNodes,
  reviewById: Object.fromEntries(reviewNodes.map((r) => [r.id, r])) as Record<string, ReviewNode>,
  knowledge,
  knowledgeByRole: Object.fromEntries(knowledge.map((k) => [k.roleId, k])) as Record<string, KnowledgeCheck>,
  glossary,
  glossaryById,
};

export type Content = typeof content;

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
