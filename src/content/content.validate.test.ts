/**
 * Content validation. Runs as part of `npm test` and `npm run validate:content`.
 * Fails the build on missing role cards, broken hand-off references, levels without a
 * debrief, bad quiz questions, or glossary links that point nowhere.
 */
import { describe, expect, it } from 'vitest';
import { content } from './index';
import { extractTermIds } from './richText';

const readyWorlds = content.worlds.filter((w) => w.status === 'ready');
const readyWorldIds = new Set(readyWorlds.map((w) => w.id));

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectStrings(v, out));
  return out;
}

describe('role index', () => {
  it('has unique ids and 44 roles', () => {
    const ids = content.roleIndex.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(44);
  });
  it('short titles fit on a badge', () => {
    for (const r of content.roleIndex) expect(r.shortTitle.length, r.id).toBeLessThanOrEqual(20);
  });
});

describe('worlds', () => {
  it('are numbered 1-8 in order', () => {
    expect(content.worlds.map((w) => w.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
  it('every level node references a role in its own world, and covers every role once', () => {
    for (const world of content.worlds) {
      const rolesInWorld = content.roleIndex.filter((r) => r.worldId === world.id).map((r) => r.id);
      const levelRoles = world.nodes
        .filter((n) => n.kind === 'level')
        .map((n) => (n as { roleId: string }).roleId);
      expect(levelRoles, world.id).toEqual(rolesInWorld);
    }
  });
  it('node ids are globally unique', () => {
    const ids = content.worlds.flatMap((w) => w.nodes.map((n) => n.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('ends with a boss (and the finale in world 8)', () => {
    for (const world of content.worlds) {
      const kinds = world.nodes.map((n) => n.kind);
      if (world.id === 'w8') expect(kinds.slice(-2)).toEqual(['boss', 'finale']);
      else expect(kinds.at(-1)).toBe('boss');
    }
  });
});

describe('ready worlds have complete content', () => {
  for (const world of readyWorlds) {
    describe(world.id, () => {
      const levelNodes = world.nodes.filter((n) => n.kind === 'level');

      it('has a role card for every role', () => {
        for (const node of levelNodes) {
          const roleId = (node as { roleId: string }).roleId;
          const role = content.roleById[roleId];
          expect(role, `missing role card: ${roleId}`).toBeDefined();
          const card = role!.card;
          expect(card.whatIDo.length, roleId).toBeGreaterThan(40);
          expect(card.responsibilities.length, roleId).toBeGreaterThanOrEqual(3);
          expect(card.responsibilities.length, roleId).toBeLessThanOrEqual(5);
          expect(card.skills.length, roleId).toBeGreaterThan(0);
          expect(card.documents.length, roleId).toBeGreaterThan(0);
          expect(card.funFact.length, roleId).toBeGreaterThan(20);
          expect(card.background.length, roleId).toBeGreaterThan(10);
        }
      });

      it('has a level with a debrief for every level node', () => {
        for (const node of levelNodes) {
          const level = content.levelById[node.id];
          expect(level, `missing level: ${node.id}`).toBeDefined();
          expect(level!.roleId).toBe((node as { roleId: string }).roleId);
          expect(level!.worldId).toBe(world.id);
          expect(level!.debrief.learned.length, node.id).toBeGreaterThan(20);
          expect(level!.debrief.handoffLine.length, node.id).toBeGreaterThan(10);
          expect(level!.intro.length, node.id).toBeGreaterThan(10);
        }
      });

      it('has a boss quiz that covers every role in the world', () => {
        const bossNode = world.nodes.find((n) => n.kind === 'boss')!;
        const boss = content.bossById[bossNode.id];
        expect(boss, `missing boss quiz: ${bossNode.id}`).toBeDefined();
        expect(boss!.questions.length).toBeGreaterThanOrEqual(8);
        const covered = new Set(boss!.questions.map((q) => q.roleId));
        for (const node of levelNodes) {
          expect(covered.has((node as { roleId: string }).roleId), `boss ${boss!.id} lacks role`).toBe(true);
        }
      });

      it('has a review node for every review map node', () => {
        for (const node of world.nodes.filter((n) => n.kind === 'review')) {
          expect(content.reviewById[node.id], `missing review node: ${node.id}`).toBeDefined();
        }
      });
    });
  }
});

describe('role cards', () => {
  it('hand-off references point at real roles', () => {
    for (const role of content.roles) {
      for (const id of [...role.card.receivesFrom, ...role.card.handsOffTo]) {
        expect(content.roleRefById[id], `${role.id} references unknown role ${id}`).toBeDefined();
        expect(id, `${role.id} references itself`).not.toBe(role.id);
      }
    }
  });
  it('every role except the first receives from someone', () => {
    for (const role of content.roles) {
      if (role.id === 'patient-advocate') continue;
      expect(role.card.receivesFrom.length, role.id).toBeGreaterThan(0);
    }
  });
});

describe('quiz questions', () => {
  const all = [
    ...content.levels.flatMap((l) => (l.game.engine === 'quiz-blitz' ? l.game.questions : [])),
    ...content.bossQuizzes.flatMap((b) => b.questions),
  ];
  it('exist', () => expect(all.length).toBeGreaterThan(0));
  it('have unique ids', () => {
    const ids = all.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('have exactly 4 options with exactly 1 correct', () => {
    for (const q of all) {
      expect(q.options.length, q.id).toBe(4);
      expect(q.options.filter((o) => o.correct).length, q.id).toBe(1);
    }
  });
  it('have an explanation, a consequence, and a known concept', () => {
    for (const q of all) {
      expect(q.explanation.length, q.id).toBeGreaterThan(10);
      expect(q.consequence.length, q.id).toBeGreaterThan(10);
      expect(content.glossaryById[q.conceptId], `${q.id} has unknown conceptId ${q.conceptId}`).toBeDefined();
    }
  });
  it('boss questions name a role', () => {
    for (const b of content.bossQuizzes) for (const q of b.questions) expect(q.roleId, q.id).toBeDefined();
  });
});

describe('glossary', () => {
  it('has unique ids and one-sentence short definitions', () => {
    const ids = content.glossary.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of content.glossary) {
      expect(t.short.length, t.id).toBeGreaterThan(15);
      expect(t.short.length, t.id).toBeLessThanOrEqual(220);
    }
  });
  it('every [[term]] link in copy resolves', () => {
    const strings = collectStrings({
      roles: content.roles,
      levels: content.levels,
      bosses: content.bossQuizzes,
      worlds: content.worlds.filter((w) => readyWorldIds.has(w.id)).map((w) => [w.intro, w.outro]),
    });
    for (const s of strings) {
      for (const id of extractTermIds(s)) {
        expect(
          content.glossaryById[id],
          `unknown glossary link [[${id}]] in: "${s.slice(0, 60)}"`,
        ).toBeDefined();
      }
    }
  });
});
