import { describe, expect, it } from 'vitest';
import { migrateProgress, PROGRESS_VERSION } from './progress';

/** A real v1 save captured from the Milestone 1 build after finishing World 1 (boss quiz included). */
const v1Fixture = {
  xp: 337,
  hearts: 4,
  heartsUpdatedAt: '2026-09-18T20:11:03.000Z',
  streak: { count: 1, lastDay: '2026-09-18', freezes: 1 },
  levels: {
    'w1-l1': { stars: 3, bestScore: 90, attempts: 1, completedAt: '2026-09-18T19:50:00.000Z' },
    'w1-l2': { stars: 2, bestScore: 77, attempts: 2, completedAt: '2026-09-18T19:55:00.000Z' },
    'w1-l3': { stars: 3, bestScore: 90, attempts: 1, completedAt: '2026-09-18T20:00:00.000Z' },
    'w1-l4': { stars: 1, bestScore: 63, attempts: 1, completedAt: '2026-09-18T20:05:00.000Z' },
  },
  bosses: { 'w1-boss': { stars: 2, bestPoints: 980, attempts: 1, completedAt: '2026-09-18T20:10:00.000Z' } },
  reviews: {},
  cardsViewed: { 'patient-advocate': { firstViewedAt: '2026-09-18T19:45:00.000Z', flipped: true } },
  meters: { safety: 90, integrity: 97, timeline: 100 },
  concepts: { 'unmet-need': { box: 2, dueAt: '2026-09-19T19:50:00.000Z', misses: 0 } },
  worldsCompleted: ['w1'],
  worldsStarted: ['w1'],
  introSeen: true,
  finaleSeen: false,
  tipsDismissed: { 'map-first': true },
  createdAt: '2026-09-18T19:40:00.000Z',
};

describe('progress migration v1 -> v2', () => {
  const out = migrateProgress(v1Fixture, 1);

  it('renames the boss record into a legacy crisis record and drops `bosses`', () => {
    expect(out.crises['w1-crisis']).toEqual({
      stars: 2,
      bestPoints: 980,
      attempts: 1,
      completedAt: '2026-09-18T20:10:00.000Z',
      legacy: true,
    });
    expect((out as unknown as { bosses?: unknown }).bosses).toBeUndefined();
  });

  it('initialises the new maps and keeps everything else intact', () => {
    expect(out.artifacts).toEqual({});
    expect(out.knowledge).toEqual({});
    expect(out.situations).toEqual({});
    expect(out.xp).toBe(337);
    expect(out.levels['w1-l2']!.attempts).toBe(2);
    expect(out.worldsCompleted).toEqual(['w1']);
    expect(out.concepts['unmet-need']!.box).toBe(2);
  });

  it('applies the rename map to every id-keyed map defensively', () => {
    const odd = migrateProgress(
      { ...v1Fixture, tipsDismissed: { 'w1-boss': true }, worldsStarted: ['w1-boss'] },
      1,
    );
    expect(odd.tipsDismissed['w1-crisis']).toBe(true);
    expect(odd.worldsStarted).toEqual(['w1-crisis']);
  });

  it('a v2 save passes through and a corrupt save becomes a fresh profile', () => {
    expect(migrateProgress({ xp: 5, crises: {} }, PROGRESS_VERSION).xp).toBe(5);
    expect(migrateProgress('garbage', 0).xp).toBe(0);
    expect(migrateProgress(null, 1).hearts).toBe(5);
  });
});
