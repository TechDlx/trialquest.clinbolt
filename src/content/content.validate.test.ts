/**
 * Content validation. Runs as part of `npm test` and `npm run validate:content`.
 * Fails the build on any 'fail' issue; prints warnings and the per-level time estimates.
 */
import { describe, expect, it } from 'vitest';
import { content } from './index';
import { formatIssue, validateContent } from './validate';
import type { Level } from './types';

describe('content validator', () => {
  const issues = validateContent(content);
  const fails = issues.filter((i) => i.severity === 'fail');
  const warns = issues.filter((i) => i.severity === 'warn');
  const infos = issues.filter((i) => i.severity === 'info');

  it('reports no failures', () => {
    if (fails.length) console.error(fails.map(formatIssue).join('\n\n'));
    expect(fails.map(formatIssue)).toEqual([]);
  });

  it('prints warnings, time estimates and planned references (informational)', () => {
    if (warns.length)
      console.warn(`${warns.length} content warning(s):\n` + warns.map(formatIssue).join('\n\n'));
    console.info(infos.map((i) => `${i.id}: ${i.message}`).join('\n'));
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

  it('World 1 levels are within the 210 s reader-paced budget', () => {
    for (const l of content.levels.filter((x) => x.worldId === 'w1')) {
      const over = warns.find((w) => w.id === l.id && w.message.startsWith('Estimated'));
      expect(over, over?.message).toBeUndefined();
    }
  });
});

describe('validator catches broken content', () => {
  const base = content.levelById['w1-l3']!;
  const run = (mutate: (l: Level) => void, worlds = content.worlds) => {
    const copy = JSON.parse(JSON.stringify(base)) as Level;
    mutate(copy);
    const worldById = Object.fromEntries(worlds.map((w) => [w.id, w]));
    const c = {
      ...content,
      worlds,
      worldById,
      levels: [copy],
      levelById: { [copy.id]: copy },
      crises: [],
      knowledge: [],
    };
    return validateContent(c);
  };
  const failsOf = (issues: ReturnType<typeof validateContent>) =>
    issues.filter((i) => i.severity === 'fail').map((i) => i.message);

  it('band gaps, bad targetBand, and unknown curves', () => {
    const msgs = failsOf(
      run((l) => {
        const sim = (
          l.stages[1]!.game as { simulation: { bands: { range: [number, number] }[]; targetBand: string } }
        ).simulation;
        sim.bands[1]!.range[0] = 0.4;
        sim.targetBand = 'nope';
      }),
    );
    expect(msgs.some((m) => m.includes('gap or overlap'))).toBe(true);
    expect(msgs.some((m) => m.includes('targetBand'))).toBe(true);
  });

  it('unknown artifact fields in copy and dangling rule ids', () => {
    const msgs = failsOf(
      run((l) => {
        l.intro = 'Dose was {{dose.starting.nothing}}';
        l.emits![0]!.outcomes[0]!.when.band = 'missing';
      }),
    );
    expect(msgs.some((m) => m.includes('has no field'))).toBe(true);
    expect(msgs.some((m) => m.includes('band "missing"'))).toBe(true);
  });

  it('variant patches that name unknown ids, and opening hits that breach the floor', () => {
    const msgs = failsOf(
      run((l) => {
        l.variants = [
          {
            when: { 'phase1.escalation': 'fast' },
            patch: { stages: { findings: { items: { cards: { remove: ['ghost'] } } } } },
          },
          { when: { 'phase1.escalation': 'slow' }, patch: { meterOpening: { safety: -35 } } },
        ];
      }),
    );
    expect(msgs.some((m) => m.includes('cannot remove unknown id'))).toBe(true);
    expect(msgs.some((m) => m.includes('meterOpening'))).toBe(true);
  });

  it('quiz-blitz on the main path and shortcut buckets used as correct answers', () => {
    const msgs = failsOf(
      run((l) => {
        (l.stages[0]!.game as { cards: { bucketId: string }[] }).cards[0]!.bucketId = 'noise';
        l.stages.push({ id: 'q', game: { engine: 'quiz-blitz', questions: [], secondsPerQuestion: 10 } });
      }),
    );
    expect(msgs.some((m) => m.includes('not allowed on the main path'))).toBe(true);
    expect(msgs.some((m) => m.includes('shortcut bucket'))).toBe(true);
  });

  it('word budgets warn, and a missing emitter fails unless the key or level is planned (and always when the world is released)', () => {
    const issues = run((l) => {
      l.intro = Array(50).fill('word').join(' ');
      l.variants = [{ when: { 'protocol.criteria': 'tight' }, patch: { intro: 'x' } }];
    });
    expect(issues.some((i) => i.severity === 'warn' && i.message.includes('intro is 50 words'))).toBe(true);
    expect(failsOf(issues).some((m) => m.includes('no level emits it'))).toBe(true);
    // While the owning world is still planned, a planned level may reference a missing emitter.
    const plannedWorlds = content.worlds.map((w) =>
      w.id === 'w1' ? { ...w, status: 'planned' as const } : w,
    );
    const planned = run((l) => {
      l.planned = true;
      l.variants = [{ when: { 'protocol.criteria': 'tight' }, patch: { intro: 'x' } }];
    }, plannedWorlds);
    expect(failsOf(planned).some((m) => m.includes('no level emits it'))).toBe(false);
    expect(planned.some((i) => i.severity === 'info' && i.message.startsWith('Planned:'))).toBe(true);
    // Same level once the world is released (World 1 is ready): planned no longer excuses it.
    const released = run((l) => {
      l.planned = true;
      l.variants = [{ when: { 'protocol.criteria': 'tight' }, patch: { intro: 'x' } }];
    });
    expect(failsOf(released).some((m) => m.includes('world is released'))).toBe(true);
  });
});

describe('engine lab levels', () => {
  it('pass stage validation and use the engines World 1 does not', async () => {
    const { labLevels } = await import('./lab');
    const { validateStage } = await import('./validate');
    const issues: string[] = [];
    for (const l of labLevels)
      for (const s of l.stages)
        validateStage(
          'src/content/lab.ts',
          `${l.id}/${s.id}`,
          s,
          (_f, id, m) => issues.push(`${id}: ${m}`),
          () => {},
          content,
        );
    expect(issues).toEqual([]);
    const engines = new Set(labLevels.flatMap((l) => l.stages.map((s) => s.game.engine)));
    expect([...engines].sort()).toEqual(['builder', 'dash-manager', 'match-pairs', 'sequence-sort']);
  });
});
