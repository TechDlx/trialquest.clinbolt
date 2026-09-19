import { describe, expect, it } from 'vitest';
import { content } from '@/content';
import type { BranchingConfig } from '@/content/types';
import { buildLevel, consumedKeys, enumerateAssignments, PatchError, resolveAssignment } from './variants';
import { interpolate } from '@/content/richText';

const hold = content.levelById['w4-l4']!;
const scenario = (l: ReturnType<typeof buildLevel>) => l.stages[0]!.game as BranchingConfig;

describe('variants', () => {
  it('derives consumed keys from `when` and enumerates every tag assignment (4 × 3 = 12)', () => {
    expect(consumedKeys(hold).sort()).toEqual(['dose.starting', 'phase1.escalation']);
    expect(enumerateAssignments(hold)).toHaveLength(12);
  });

  it('resolves the registry default when nothing was emitted, so the level works standalone', () => {
    expect(resolveAssignment(hold, {})).toEqual({
      'dose.starting': 'standard',
      'phase1.escalation': 'standard',
    });
    const base = buildLevel(hold, {});
    expect(base.appliedVariants).toEqual([]);
    expect(base.meterOpening).toEqual({});
    expect(base.intro).toContain('Cohort 3');
  });

  it('applies matching variants in order, sums opening hits, and interpolates artifact data', () => {
    const built = buildLevel(hold, {
      'dose.starting': {
        key: 'dose.starting',
        tag: 'reckless',
        data: { mgPerKg: 4.8 },
        emittedBy: 'w1-l3',
        emittedAt: 'x',
      },
      'phase1.escalation': { key: 'phase1.escalation', tag: 'fast', emittedBy: 'w4-l3', emittedAt: 'x' },
    });
    expect(built.appliedVariants).toEqual([2, 3]);
    expect(built.meterOpening).toEqual({ safety: -25 });
    expect(built.intro).toContain('4.8 mg/kg');
    const g = scenario(built);
    expect(g.nodes.some((n) => n.id === 'n-sentinel')).toBe(true);
    expect(g.nodes.find((n) => n.id === 'n-amend')!.choices!.find((c) => c.id === 'c-amend-full')!.next).toBe(
      'n-sentinel',
    );
    expect(g.nodes.find((n) => n.id === 'n-respond')!.text).toContain('tripled');
    // node replace kept the choices
    expect(g.nodes.find((n) => n.id === 'n-data')!.choices).toHaveLength(3);
  });

  it('uses the field fallback when the artifact was emitted without data', () => {
    const built = buildLevel(hold, {
      'dose.starting': { key: 'dose.starting', tag: 'aggressive', emittedBy: 'w1-l3', emittedAt: 'x' },
    });
    expect(built.intro).toContain('0.5 mg/kg');
    expect(interpolate('{{dose.starting.mgPerKg}} and {{nope.x.y}}', {})).toBe('0.5 and {{nope.x.y}}');
  });

  it('rejects patches that touch unknown ids, node structure, or the engine', () => {
    const bad = {
      ...hold,
      variants: [
        {
          when: { 'dose.starting': 'cautious' as const },
          patch: { stages: { scenario: { items: { nodes: { replace: [{ id: 'ghost', text: 'x' }] } } } } },
        },
      ],
    };
    expect(() => buildLevel(bad, {}, { 'dose.starting': 'cautious' })).toThrow(PatchError);
    const structural = {
      ...hold,
      variants: [
        {
          when: { 'dose.starting': 'cautious' as const },
          patch: { stages: { scenario: { items: { nodes: { replace: [{ id: 'n-data', choices: [] }] } } } } },
        },
      ],
    };
    expect(() => buildLevel(structural, {}, { 'dose.starting': 'cautious' })).toThrow(/copy only/);
    const engine = {
      ...hold,
      variants: [
        {
          when: { 'dose.starting': 'cautious' as const },
          patch: { stages: { scenario: { fields: { engine: 'builder' } } } },
        },
      ],
    };
    expect(() => buildLevel(engine, {}, { 'dose.starting': 'cautious' })).toThrow(/engine/);
  });
});
