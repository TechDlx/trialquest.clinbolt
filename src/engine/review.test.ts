import { describe, expect, it } from 'vitest';
import { content } from '@/content';
import { buildReviewRound, dueSituations } from './review';
import type { BucketSortConfig, BranchingConfig, BuilderConfig, ImpostorConfig } from '@/content/types';

const sit = (levelId: string, stageId: string, itemId: string) => ({
  levelId,
  stageId,
  itemId,
  box: 1,
  dueAt: '2020-01-01T00:00:00Z',
  misses: 1,
});

describe('review micro-rounds', () => {
  it('bucket-sort: the missed card plus two others, all buckets, 20 seconds', () => {
    const round = buildReviewRound(content, sit('w1-l3', 'findings', 'alt'))!;
    expect(round.onlyItems).toHaveLength(3);
    expect(round.onlyItems).toContain('alt');
    expect((round.stage.game as BucketSortConfig).seconds).toBe(20);
    expect(round.isShortcut).toBe(false);
  });

  it('a shortcut bucket replays the temptation with three cards', () => {
    const round = buildReviewRound(content, sit('w1-l3', 'findings', 'noise'))!;
    expect(round.isShortcut).toBe(true);
    expect(round.onlyItems).toHaveLength(3);
    expect((round.stage.game as BucketSortConfig).buckets.some((b) => b.id === 'noise')).toBe(true);
  });

  it('branching: replays the parent decision of the missed choice, untimed', () => {
    const round = buildReviewRound(content, sit('w1-l1', 'voice', 'c-hype'))!;
    expect(round.onlyItems).toEqual(['c-hype']);
    expect(round.isShortcut).toBe(true);
    expect('seconds' in (round.stage.game as BranchingConfig)).toBe(false);
  });

  it('builder: the missed slot, its correct part and two distractors', () => {
    const round = buildReviewRound(content, sit('w1-l4', 'build', 'storage'))!;
    expect(round.onlyItems).toContain('storage');
    expect(round.onlyItems).toContain('below-25');
    expect(round.onlyItems).toHaveLength(4);
    const g = round.stage.game as BuilderConfig;
    expect(g.parts.length).toBeGreaterThan(0);
  });

  it('impostor: always includes the real target', () => {
    const round = buildReviewRound(content, sit('w1-l2', 'screen', 'vx-088'))!;
    expect(round.onlyItems).toContain('vx-101');
    expect(round.onlyItems).toHaveLength(3);
    const g = round.stage.game as ImpostorConfig;
    expect(g.cards.some((c) => c.impostor)).toBe(true);
  });

  it('allocator: only the category is editable and the simulation is dropped', () => {
    const round = buildReviewRound(content, sit('w1-l3', 'dose', 'dose'))!;
    expect(round.onlyItems).toEqual(['dose']);
    expect('simulation' in round.stage.game).toBe(false);
  });

  it('returns null for stale situations and picks due ones oldest first, capped', () => {
    expect(buildReviewRound(content, sit('w9-l9', 'x', 'y'))).toBeNull();
    const due = dueSituations({
      a: { ...sit('w1-l1', 'voice', 'c-no'), dueAt: '2020-01-02T00:00:00Z' },
      b: { ...sit('w1-l1', 'voice', 'c-later'), dueAt: '2020-01-01T00:00:00Z' },
      retired: { ...sit('w1-l1', 'voice', 'c-fastest'), box: 5 },
      future: { ...sit('w1-l1', 'voice', 'c-marker'), dueAt: '2999-01-01T00:00:00Z' },
    });
    expect(due.map((s) => s.itemId)).toEqual(['c-later', 'c-no']);
  });
});
