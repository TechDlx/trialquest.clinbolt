import { beforeEach, describe, expect, it } from 'vitest';
import { codexHeartsLeft, initialProgress, migrateProgress, PROGRESS_VERSION, useProgress } from './progress';
import { STORAGE_KEYS } from './storage';

beforeEach(() => {
  useProgress.getState().resetProgress();
});

describe('progress store', () => {
  it('awards XP once for a first role card view and marks it flipped', () => {
    const first = useProgress.getState().markCardViewed('patient-advocate');
    const second = useProgress.getState().markCardViewed('patient-advocate');
    expect(first.xpGained).toBe(5);
    expect(second.xpGained).toBe(0);
    expect(useProgress.getState().xp).toBe(5);
    expect(useProgress.getState().cardsViewed['patient-advocate']?.flipped).toBe(true);
  });

  it('Codex reviews refill at most two hearts a day in total, one per card', () => {
    const day1 = new Date(2026, 8, 21, 10);
    const s = () => useProgress.getState();
    for (const id of ['patient-advocate', 'discovery-scientist', 'preclinical-toxicologist'])
      s().markCardViewed(id, day1);
    for (let i = 0; i < 4; i++) s().loseHeart(day1);
    expect(s().hearts).toBe(1);
    expect(s().claimCodexHeart('patient-advocate', day1)).toBe(true);
    expect(s().claimCodexHeart('patient-advocate', day1)).toBe(false); // same card again
    expect(s().claimCodexHeart('discovery-scientist', day1)).toBe(true);
    expect(s().claimCodexHeart('preclinical-toxicologist', day1)).toBe(false); // daily cap
    expect(s().hearts).toBe(3);
    expect(codexHeartsLeft(s(), day1)).toBe(0);
    const day2 = new Date(2026, 8, 22, 10);
    expect(codexHeartsLeft(s(), day2)).toBe(2);
    expect(s().claimCodexHeart('preclinical-toxicologist', day2)).toBe(true);
  });

  it('keeps best stars and score across attempts', () => {
    const s = useProgress.getState();
    s.recordLevelResult('w1-l1', { stars: 3, score: 90, xp: { total: 65, lines: [] } });
    s.recordLevelResult('w1-l1', { stars: 1, score: 50, xp: { total: 15, lines: [] } });
    const rec = useProgress.getState().levels['w1-l1']!;
    expect(rec.stars).toBe(3);
    expect(rec.bestScore).toBe(90);
    expect(rec.attempts).toBe(2);
    expect(useProgress.getState().xp).toBe(80);
  });

  it('loses hearts to zero and refills on review', () => {
    const s = useProgress.getState();
    for (let i = 0; i < 7; i++) s.loseHeart();
    expect(useProgress.getState().hearts).toBe(0);
    s.recordReview('w1-r1', { total: 15, lines: [] });
    expect(useProgress.getState().hearts).toBe(5);
  });

  it('clamps meters and raises them at world start', () => {
    const s = useProgress.getState();
    expect(s.applyMeter('safety', -150)).toBe(0);
    s.startWorld('w2');
    expect(useProgress.getState().meters.safety).toBe(60);
    s.startWorld('w2');
    expect(useProgress.getState().worldsStarted).toEqual(['w2']);
  });

  it('tracks a daily streak with freezes', () => {
    const s = useProgress.getState();
    const day = (d: string) => new Date(`${d}T12:00:00`);
    s.touchStreak(day('2026-09-01'));
    s.touchStreak(day('2026-09-01'));
    s.touchStreak(day('2026-09-02'));
    const r = s.touchStreak(day('2026-09-03'));
    expect(useProgress.getState().streak.count).toBe(3);
    expect(r.milestoneXp).toBe(25);
    // Miss a day with no freeze: streak resets.
    s.touchStreak(day('2026-09-05'));
    expect(useProgress.getState().streak.count).toBe(1);
    // Earn a freeze, then a one-day gap is forgiven.
    s.completeWorld('w1');
    s.touchStreak(day('2026-09-07'));
    expect(useProgress.getState().streak.count).toBe(2);
    expect(useProgress.getState().streak.freezes).toBe(0);
  });

  it('persists to localStorage under a versioned key and resets cleanly', () => {
    useProgress.getState().addXp(42);
    const raw = window.localStorage.getItem(STORAGE_KEYS.progress);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as { version: number; state: { xp: number } };
    expect(parsed.version).toBe(PROGRESS_VERSION);
    expect(parsed.state.xp).toBe(42);
    useProgress.getState().resetProgress();
    expect(useProgress.getState().xp).toBe(0);
    expect(useProgress.getState().hearts).toBe(5);
  });

  it('migrates unknown or partial saves to a full profile', () => {
    const fromNothing = migrateProgress(undefined, 0);
    expect(fromNothing).toEqual({ ...initialProgress(), createdAt: fromNothing.createdAt });
    const partial = migrateProgress({ xp: 10 }, PROGRESS_VERSION);
    expect(partial.xp).toBe(10);
    expect(partial.hearts).toBe(5);
    expect(partial.levels).toEqual({});
  });
});
