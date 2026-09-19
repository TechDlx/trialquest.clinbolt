import type { CrisisBoss, KnowledgeCheck, Level, QuizQuestion, ReviewNode, Role, World } from './types';
import { worlds, worldById } from './worlds';
import { roleIndex, roleRefById } from './roleIndex';
import { glossary, glossaryById } from './glossary';
import { w1Crisis, w1Levels, w1Review, w1Roles } from './worlds/w1';
import { w2Crisis, w2Levels, w2Review, w2Roles } from './worlds/w2';
import { w3Crisis, w3Levels, w3Reviews, w3Roles } from './worlds/w3';
import { w4Crisis, w4Levels, w4Review, w4Roles } from './worlds/w4';
import { w5Crisis, w5Levels, w5Review, w5Roles } from './worlds/w5';
import { w1Knowledge } from './knowledge/w1';
import { w2Knowledge } from './knowledge/w2';
import { w3Knowledge } from './knowledge/w3';
import { w4Knowledge } from './knowledge/w4';
import { w5Knowledge } from './knowledge/w5';
export { artifactRegistry } from './artifacts';

/**
 * Content registry: every world's roles, levels, crises, review nodes and Test Yourself sets.
 */
const roles: Role[] = [...w1Roles, ...w2Roles, ...w3Roles, ...w4Roles, ...w5Roles];
const levels: Level[] = [...w1Levels, ...w2Levels, ...w3Levels, ...w4Levels, ...w5Levels];
const crises: CrisisBoss[] = [w1Crisis, w2Crisis, w3Crisis, w4Crisis, w5Crisis];
const reviewNodes: ReviewNode[] = [w1Review, w2Review, ...w3Reviews, w4Review, w5Review];
const knowledge: KnowledgeCheck[] = [
  ...w1Knowledge,
  ...w2Knowledge,
  ...w3Knowledge,
  ...w4Knowledge,
  ...w5Knowledge,
];

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
