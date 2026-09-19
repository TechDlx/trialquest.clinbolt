/**
 * Content validation. Runs as part of `npm test` and `npm run validate:content`.
 * Fails the build on any 'fail' issue; prints warnings.
 */
import { describe, expect, it } from 'vitest';
import { content } from './index';
import { formatIssue, validateContent } from './validate';
import type { Level } from './types';

describe('content validator', () => {
  const issues = validateContent(content);
  const fails = issues.filter((i) => i.severity === 'fail');
  const warns = issues.filter((i) => i.severity === 'warn');

  it('reports no failures', () => {
    if (fails.length) console.error(fails.map(formatIssue).join('\n\n'));
    expect(fails.map(formatIssue)).toEqual([]);
  });

  it('prints warnings (informational)', () => {
    if (warns.length)
      console.warn(`${warns.length} content warning(s):\n` + warns.map(formatIssue).join('\n\n'));
    expect(true).toBe(true);
  });

  it('has 44 roles and every authored question keeps the quiz shape', () => {
    expect(content.roleIndex.length).toBe(44);
    const all = content.knowledge.flatMap((k) => k.questions);
    expect(all.length).toBe(32);
    for (const q of all) expect(q.options.filter((o) => o.correct).length).toBe(1);
  });

  it('World 1 main path contains no quiz-blitz', () => {
    for (const l of content.levels.filter((x) => x.worldId === 'w1'))
      for (const s of l.stages) expect(s.game.engine).not.toBe('quiz-blitz');
    for (const r of content.crises.flatMap((c) => c.rounds)) expect(r.game.engine).not.toBe('quiz-blitz');
  });
});

describe('validator catches broken content', () => {
  const base = content.levelById['w1-l3']!;
  const withStage = (mutate: (l: Level) => void) => {
    const copy = JSON.parse(JSON.stringify(base)) as Level;
    mutate(copy);
    const c = { ...content, levels: [copy], levelById: { [copy.id]: copy }, crises: [], knowledge: [] };
    return validateContent(c)
      .filter((i) => i.severity === 'fail')
      .map((i) => i.message);
  };

  it('band gaps, bad targetBand, and unknown curves', () => {
    const msgs = withStage((l) => {
      const sim = (
        l.stages[1]!.game as { simulation: { bands: { range: [number, number] }[]; targetBand: string } }
      ).simulation;
      sim.bands[1]!.range[0] = 0.4;
      sim.targetBand = 'nope';
    });
    expect(msgs.some((m) => m.includes('gap or overlap'))).toBe(true);
    expect(msgs.some((m) => m.includes('targetBand'))).toBe(true);
  });

  it('unknown artifact fields in copy and dangling rule ids', () => {
    const msgs = withStage((l) => {
      l.intro = 'Dose was {{dose.starting.nothing}}';
      l.emits![0]!.outcomes[0]!.when.band = 'missing';
    });
    expect(msgs.some((m) => m.includes('has no field'))).toBe(true);
    expect(msgs.some((m) => m.includes('band "missing"'))).toBe(true);
  });

  it('variant patches that name unknown ids, and opening hits that breach the floor', () => {
    const msgs = withStage((l) => {
      l.variants = [
        {
          when: { 'phase1.escalation': 'fast' },
          patch: { stages: { findings: { items: { cards: { remove: ['ghost'] } } } } },
        },
        { when: { 'phase1.escalation': 'slow' }, patch: { meterOpening: { safety: -35 } } },
      ];
    });
    expect(msgs.some((m) => m.includes('cannot remove unknown id'))).toBe(true);
    expect(msgs.some((m) => m.includes('meterOpening'))).toBe(true);
  });

  it('quiz-blitz on the main path and shortcut buckets used as correct answers', () => {
    const msgs = withStage((l) => {
      (l.stages[0]!.game as { cards: { bucketId: string }[] }).cards[0]!.bucketId = 'noise';
      l.stages.push({ id: 'q', game: { engine: 'quiz-blitz', questions: [], secondsPerQuestion: 10 } });
    });
    expect(msgs.some((m) => m.includes('not allowed on the main path'))).toBe(true);
    expect(msgs.some((m) => m.includes('shortcut bucket'))).toBe(true);
  });
});
