/** roundCorrect: how a replayed situation is judged, engine by engine. */
import { describe, expect, it } from 'vitest';
import type { EngineId } from '@/content/types';
import { emptyOutcomes, type EngineResult } from './scoring';
import { roundCorrect, type ReviewRound } from './review';

const round = (engine: EngineId, itemId: string, isShortcut = false): ReviewRound =>
  ({
    key: 'k',
    levelId: 'l',
    levelTitle: 't',
    stage: { id: 's', game: { engine } as never },
    onlyItems: [itemId],
    itemId,
    isShortcut,
  }) as ReviewRound;

const result = (over: Partial<EngineResult>): EngineResult => ({
  accuracy: 1,
  speed: 1,
  mistakes: [],
  shortcuts: [],
  itemResults: {},
  outcomes: emptyOutcomes(),
  correct: 1,
  total: 1,
  heartsLost: 0,
  ...over,
});
const mistake = {
  itemId: 'x',
  conceptId: 'c',
  prompt: '',
  chosen: '',
  correctAnswer: '',
  explanation: '',
  consequence: '',
};

describe('roundCorrect', () => {
  it('bucket, builder, sequence, match, allocator and dash: the reviewed item must be correct', () => {
    for (const engine of [
      'bucket-sort',
      'builder',
      'sequence-sort',
      'match-pairs',
      'allocator',
      'dash-manager',
    ] as const) {
      expect(
        roundCorrect(round(engine, 'a'), result({ itemResults: { a: 'correct', b: 'wrong' } })),
        engine,
      ).toBe(true);
      expect(
        roundCorrect(round(engine, 'a'), result({ itemResults: { a: 'wrong', b: 'correct' } })),
        engine,
      ).toBe(false);
      expect(roundCorrect(round(engine, 'a'), result({ itemResults: { a: 'skipped' } })), engine).toBe(false);
    }
  });

  it('scenario: judged on the decision made, since the missed choice is never in the results', () => {
    expect(
      roundCorrect(round('branching-scenario', 'c-no'), result({ itemResults: { 'c-yes': 'correct' } })),
    ).toBe(true);
    expect(
      roundCorrect(
        round('branching-scenario', 'c-no'),
        result({ accuracy: 0.5, itemResults: { 'c-later': 'wrong' } }),
      ),
    ).toBe(false);
  });

  it('impostor: the wrongly accused card is "skipped" on a clean replay, which counts as fixed', () => {
    const clean = result({ correct: 1, itemResults: { 'vx-088': 'skipped', 'vx-101': 'correct' } });
    expect(roundCorrect(round('spot-the-impostor', 'vx-088'), clean)).toBe(true);
    const again = result({
      correct: 1,
      mistakes: [mistake],
      itemResults: { 'vx-088': 'wrong', 'vx-101': 'correct' },
    });
    expect(roundCorrect(round('spot-the-impostor', 'vx-088'), again)).toBe(false);
    const notFound = result({ correct: 0, itemResults: { 'vx-088': 'skipped', 'vx-101': 'wrong' } });
    expect(roundCorrect(round('spot-the-impostor', 'vx-088'), notFound)).toBe(false);
  });

  it('shortcut carriers: fixed when the temptation is declined', () => {
    const declined = result({ outcomes: { ...emptyOutcomes(), shortcutsTaken: [] } });
    const taken = result({ outcomes: { ...emptyOutcomes(), shortcutsTaken: ['noise'] } });
    expect(roundCorrect(round('bucket-sort', 'noise', true), declined)).toBe(true);
    expect(roundCorrect(round('bucket-sort', 'noise', true), taken)).toBe(false);
  });
});
