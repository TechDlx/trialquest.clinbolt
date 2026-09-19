import type { BossQuiz, Level, QuizQuestion, ReviewNode, Role, World } from './types';
import { worlds, worldById } from './worlds';
import { roleIndex, roleRefById } from './roleIndex';
import { glossary, glossaryById } from './glossary';
import { w1Boss, w1Levels, w1Review, w1Roles } from './worlds/w1';

/**
 * Content registry. Milestone 1 bundles World 1 synchronously; Milestone 3 turns
 * this into per-world lazy imports so each world is its own chunk.
 */
const roles: Role[] = [...w1Roles];
const levels: Level[] = [...w1Levels];
const bossQuizzes: BossQuiz[] = [w1Boss];
const reviewNodes: ReviewNode[] = [w1Review];

export const content = {
  worlds,
  worldById,
  roleIndex,
  roleRefById,
  roles,
  roleById: Object.fromEntries(roles.map((r) => [r.id, r])) as Record<string, Role>,
  levels,
  levelById: Object.fromEntries(levels.map((l) => [l.id, l])) as Record<string, Level>,
  bossQuizzes,
  bossById: Object.fromEntries(bossQuizzes.map((b) => [b.id, b])) as Record<string, BossQuiz>,
  reviewNodes,
  reviewById: Object.fromEntries(reviewNodes.map((r) => [r.id, r])) as Record<string, ReviewNode>,
  glossary,
  glossaryById,
};

export type Content = typeof content;

export function getWorld(id: string): World | undefined {
  return worldById[id];
}

export function worldForLevel(levelId: string): World | undefined {
  const level = content.levelById[levelId];
  return level ? worldById[level.worldId] : undefined;
}

/** All quiz questions from ready content, keyed by concept, for review nodes. */
export function questionsByConcept(): Record<string, QuizQuestion[]> {
  const out: Record<string, QuizQuestion[]> = {};
  const push = (q: QuizQuestion) => {
    (out[q.conceptId] ??= []).push(q);
  };
  for (const level of levels) {
    if (level.game.engine === 'quiz-blitz') level.game.questions.forEach(push);
  }
  for (const boss of bossQuizzes) boss.questions.forEach(push);
  return out;
}
