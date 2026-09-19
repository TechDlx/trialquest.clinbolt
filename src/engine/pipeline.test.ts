import { describe, expect, it } from 'vitest';
import {
  aggregateStages,
  applyMistake,
  conceptOutcomes,
  failureReason,
  FREE_MISTAKE_NOTE,
  OUT_OF_HEARTS_TEXT,
  scoreBoss,
  scoreLevel,
  type PipelineSnapshot,
} from './pipeline';
import { emptyOutcomes, type EngineResult, type Mistake } from './scoring';

const t0 = new Date('2026-09-18T10:00:00Z');
const snap = (over: Partial<PipelineSnapshot> = {}): PipelineSnapshot => ({
  hearts: 5,
  heartsUpdatedAt: null,
  meters: { safety: 100, integrity: 100, timeline: 100 },
  ...over,
});
const mistake = (conceptId: string, itemId = conceptId): Mistake => ({
  itemId,
  conceptId,
  prompt: 'p',
  chosen: 'c',
  correctAnswer: 'a',
  explanation: 'e',
  consequence: 'q',
});
const result = (over: Partial<EngineResult> = {}): EngineResult => ({
  accuracy: 1,
  speed: 0.5,
  mistakes: [],
  shortcuts: [],
  itemResults: {},
  outcomes: emptyOutcomes(),
  correct: 6,
  total: 6,
  heartsLost: 0,
  ...over,
});

describe('applyMistake', () => {
  it('lets the first mistake through for free when the world allows it', () => {
    const out = applyMistake(snap(), { firstMistakeFree: true, freeUsed: false, meterFocus: 'safety' }, t0);
    expect(out).toMatchObject({
      heartLost: false,
      freeUsed: true,
      note: FREE_MISTAKE_NOTE,
      outOfHearts: false,
    });
    expect(out.snapshot).toEqual(snap());
  });

  it('costs a heart and damages the focus meter (-5 safety, -3 integrity)', () => {
    const a = applyMistake(snap(), { firstMistakeFree: true, freeUsed: true, meterFocus: 'safety' }, t0);
    expect(a.snapshot.hearts).toBe(4);
    expect(a.snapshot.heartsUpdatedAt).toBe(t0.toISOString());
    expect(a.snapshot.meters.safety).toBe(95);
    expect(a.heartLost).toBe(true);
    const b = applyMistake(snap(), { firstMistakeFree: false, freeUsed: false, meterFocus: 'integrity' }, t0);
    expect(b.snapshot.meters.integrity).toBe(97);
    expect(b.freeUsed).toBe(false);
  });

  it('flags a setback when the meter reaches zero and resets it to 40', () => {
    const out = applyMistake(snap({ meters: { safety: 5, integrity: 100, timeline: 100 } }), {
      firstMistakeFree: false,
      freeUsed: false,
      meterFocus: 'safety',
    });
    expect(out.setback).toBe('safety');
    expect(out.snapshot.meters.safety).toBe(40);
    expect(out.snapshot.hearts).toBe(4);
    expect(failureReason(out)).toContain('Clinical hold');
  });

  it('flags out-of-hearts at zero; setbacks take priority in the reason text', () => {
    const out = applyMistake(snap({ hearts: 1 }), {
      firstMistakeFree: false,
      freeUsed: false,
      meterFocus: 'integrity',
    });
    expect(out.outOfHearts).toBe(true);
    expect(failureReason(out)).toBe(OUT_OF_HEARTS_TEXT);
    const both = applyMistake(snap({ hearts: 1, meters: { safety: 100, integrity: 2, timeline: 100 } }), {
      firstMistakeFree: false,
      freeUsed: false,
      meterFocus: 'integrity',
    });
    expect(both.outOfHearts).toBe(true);
    expect(failureReason(both)).toContain('Inspection finding');
    expect(failureReason({ outOfHearts: false })).toBeUndefined();
  });
});

describe('scoreLevel / scoreBoss', () => {
  it('scores a level and awards perfect and first-time bonuses', () => {
    const s = scoreLevel(result(), { firstTime: true });
    expect(s).toMatchObject({ stars: 3, score: 90, perfect: true });
    expect(s.xp.total).toBe(45 + 10 + 10);
    const t = scoreLevel(result({ accuracy: 4 / 6, mistakes: [mistake('a'), mistake('b')] }), {
      firstTime: false,
    });
    expect(t).toMatchObject({ stars: 1, score: 63, perfect: false });
    expect(t.xp.total).toBe(15);
  });

  it('a heart lost without a recorded mistake still breaks the perfect run', () => {
    expect(scoreLevel(result({ heartsLost: 1 }), { firstTime: false }).perfect).toBe(false);
  });

  it('boss passes at 60%, never 0 stars on a pass, no XP on a fail', () => {
    const pass = scoreBoss(result({ accuracy: 0.6, speed: 0, points: 300, maxPoints: 1000 }), {
      firstTry: true,
    });
    expect(pass.passed).toBe(true);
    expect(pass.stars).toBe(1); // score 48 -> 1 star anyway; floor to 1 applies when raw is 0
    expect(pass.xp.total).toBe(30 + 20);
    const floor = scoreBoss(result({ accuracy: 0.6, speed: 0, points: 0, maxPoints: 1 }), {
      firstTry: false,
    });
    expect(floor.score).toBe(48);
    const fail = scoreBoss(result({ accuracy: 0.5, points: 500, maxPoints: 1000 }), { firstTry: true });
    expect(fail).toMatchObject({ passed: false, stars: 0 });
    expect(fail.xp.total).toBe(0);
  });
});

describe('conceptOutcomes', () => {
  it('marks a concept wrong if any mistake names it', () => {
    expect(conceptOutcomes(['a', 'b', 'c'], [mistake('b')])).toEqual([
      { conceptId: 'a', correct: true },
      { conceptId: 'b', correct: false },
      { conceptId: 'c', correct: true },
    ]);
  });
});

describe('aggregateStages', () => {
  it('weights accuracy and speed, concatenates events, and sums counts', () => {
    const a = result({
      accuracy: 1,
      speed: 1,
      correct: 4,
      total: 4,
      itemResults: { x: 'correct' },
      heartsLost: 0,
    });
    const b = result({
      accuracy: 0.5,
      speed: 0,
      correct: 2,
      total: 4,
      mistakes: [mistake('m')],
      itemResults: { y: 'wrong' },
      heartsLost: 1,
      outcomes: { shortcutsTaken: ['s1'], band: 'standard' },
    });
    const agg = aggregateStages([a, b], [1, 2]);
    expect(agg.accuracy).toBeCloseTo((1 * 1 + 0.5 * 2) / 3);
    expect(agg.speed).toBeCloseTo(1 / 3);
    expect(agg.correct).toBe(6);
    expect(agg.total).toBe(8);
    expect(agg.mistakes).toHaveLength(1);
    expect(agg.heartsLost).toBe(1);
    expect(agg.itemResults).toEqual({ x: 'correct', y: 'wrong' });
    expect(agg.outcomes.band).toBe('standard');
    expect(agg.outcomes.shortcutsTaken).toEqual(['s1']);
    expect(agg.points).toBeUndefined();
  });
  it('handles a single stage and an empty list', () => {
    const only = result({ accuracy: 0.75 });
    expect(aggregateStages([only]).accuracy).toBe(0.75);
    expect(aggregateStages([]).total).toBe(0);
  });
});
