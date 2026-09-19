import { describe, expect, it } from 'vitest';
import {
  bossMaxPoints,
  bossPointsForAnswer,
  computeScore,
  streakMultiplier,
  xpForBoss,
  xpForLevel,
} from './scoring';

describe('computeScore', () => {
  it('weights accuracy 80 and speed 20', () => {
    expect(computeScore(1, 1)).toEqual({ score: 100, stars: 3 });
    expect(computeScore(1, 0)).toEqual({ score: 80, stars: 2 });
    expect(computeScore(0.5, 0.5)).toEqual({ score: 50, stars: 1 });
    expect(computeScore(0, 1)).toEqual({ score: 20, stars: 0 });
  });
  it('lets relaxed-mode players (speed 0.5) reach 3 stars with perfect accuracy', () => {
    expect(computeScore(1, 0.5).stars).toBe(3);
  });
  it('clamps inputs', () => {
    expect(computeScore(2, -1)).toEqual({ score: 80, stars: 2 });
  });
});

describe('xpForLevel', () => {
  it('awards per star plus bonuses', () => {
    expect(xpForLevel({ stars: 3, perfect: true, firstTime: true }).total).toBe(45 + 10 + 10);
    expect(xpForLevel({ stars: 1, perfect: false, firstTime: false }).total).toBe(15);
  });
  it('awards nothing on failure', () => {
    expect(xpForLevel({ stars: 0, perfect: true, firstTime: true }).total).toBe(0);
  });
});

describe('boss points', () => {
  it('gives 100-150 base depending on time left', () => {
    expect(bossPointsForAnswer(1, 0)).toBe(150);
    expect(bossPointsForAnswer(0, 0)).toBe(100);
    expect(bossPointsForAnswer(0.5, 0)).toBe(125);
  });
  it('applies streak multipliers at 3 and 5', () => {
    expect(streakMultiplier(2)).toBe(1);
    expect(streakMultiplier(3)).toBe(1.25);
    expect(streakMultiplier(5)).toBe(1.5);
    expect(bossPointsForAnswer(1, 2)).toBe(Math.round(150 * 1.25));
  });
  it('computes a max and maps to xp', () => {
    const max = bossMaxPoints(8);
    expect(max).toBeGreaterThan(8 * 150);
    expect(xpForBoss(max, max, true).total).toBe(120);
    expect(xpForBoss(0, max, false).total).toBe(0);
  });
});
