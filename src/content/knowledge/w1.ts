import type { KnowledgeCheck, QuizQuestion } from '../types';
import { w1LegacyLevels } from './w1.legacyLevels';
import { w1LegacyBoss } from './w1.legacyBoss';

/**
 * Test Yourself for World 1. Every question authored for the Milestone 1 quiz levels and
 * boss quiz is preserved here, grouped by role. Optional; never gates progress.
 */
const byRole: Record<string, QuizQuestion[]> = {};
for (const level of w1LegacyLevels) {
  for (const q of level.game.questions) (byRole[level.roleId] ??= []).push({ ...q, roleId: level.roleId });
}
for (const q of w1LegacyBoss.questions) if (q.roleId) (byRole[q.roleId] ??= []).push(q);

export const w1Knowledge: KnowledgeCheck[] = Object.entries(byRole).map(([roleId, questions]) => ({
  id: `kc-${roleId}`,
  roleId,
  questions,
}));
