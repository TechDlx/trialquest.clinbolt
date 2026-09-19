import { describe, expect, it } from 'vitest';
import { content } from '@/content';
import { evaluateCrisisEmits, evaluateEmits, ruleMatches } from './artifacts';
import { emptyOutcomes, type EngineResult } from './scoring';

const r = (over: Partial<EngineResult> = {}): EngineResult => ({
  accuracy: 1,
  speed: 0.5,
  mistakes: [],
  shortcuts: [],
  itemResults: {},
  outcomes: emptyOutcomes(),
  correct: 1,
  total: 1,
  heartsLost: 0,
  ...over,
});

describe('artifact rules', () => {
  it('ANDs every field and targets the named stage', () => {
    const results = {
      byStage: { dose: r({ outcomes: { ...emptyOutcomes(), band: 'reckless', inputValue: 4.8 } }) },
      level: r({ accuracy: 0.6 }),
    };
    expect(ruleMatches({ stageId: 'dose', band: 'reckless' }, results)).toBe(true);
    expect(ruleMatches({ stageId: 'dose', band: 'reckless', accuracyAtLeast: 1.1 }, results)).toBe(false);
    expect(ruleMatches({ band: 'reckless' }, results)).toBe(false); // level result has no band
    expect(ruleMatches({ accuracyAtLeast: 0.6 }, results)).toBe(true);
    expect(ruleMatches({ stageId: 'nope', band: 'x' }, results)).toBe(false);
  });

  it('emits the Toxicologist starting dose with its data, and the default tag when nothing matches', () => {
    const level = content.levelById['w1-l3']!;
    const results = {
      byStage: {
        findings: r(),
        dose: r({ outcomes: { ...emptyOutcomes(), band: 'aggressive', inputValue: 1.2 } }),
      },
      level: r(),
    };
    const [a] = evaluateEmits(level.emits, results, level.id, new Date('2026-09-18T00:00:00Z'));
    expect(a).toMatchObject({
      key: 'dose.starting',
      tag: 'aggressive',
      data: { mgPerKg: 1.2 },
      emittedBy: 'w1-l3',
    });
    const none = evaluateEmits(level.emits, { byStage: {}, level: r() }, level.id);
    expect(none[0]!.tag).toBe('standard');
  });

  it('crisis-local emits resolve from bucket placements', () => {
    const round = content.crisisById['w1-crisis']!.rounds[0]!;
    const contained = evaluateCrisisEmits(
      round.emits,
      r({ outcomes: { ...emptyOutcomes(), buckets: { necrosis: 'adverse' } } }),
    );
    const missed = evaluateCrisisEmits(
      round.emits,
      r({ outcomes: { ...emptyOutcomes(), buckets: { necrosis: 'review' } } }),
    );
    expect(contained).toEqual({ 'local.signal': 'contained' });
    expect(missed).toEqual({ 'local.signal': 'missed' });
  });
});
