import { describe, expect, it } from 'vitest';
import { content } from '@/content';
import { journeyStats, relayChain } from './finale';
import { artifactEdges } from '@/screens/Handoff';

const allLevels = (stars: number) => Object.fromEntries(content.levels.map((l) => [l.id, { stars }]));
const allCrises = Object.fromEntries(content.crises.map((c) => [c.id, { stars: 2 }]));

describe('journeyStats', () => {
  it('counts roles, stars and crises, and shifts years and cost with the timeline meter', () => {
    const clean = journeyStats({
      levels: allLevels(3),
      crises: allCrises,
      meters: { safety: 90, integrity: 90, timeline: 70 },
      knowledge: {},
    });
    expect(clean.rolesMastered).toBe(44);
    expect(clean.rolesTotal).toBe(44);
    expect(clean.threeStarLevels).toBe(content.levels.length);
    expect(clean.crisesCleared).toBe(8);
    expect(clean.years).toBe(10.5);
    expect(clean.costBillions).toBe(1.3);
    expect(clean.knowledgeOpened).toBe(false);

    const slow = journeyStats({
      levels: allLevels(1),
      crises: {},
      meters: { safety: 50, integrity: 50, timeline: 30 },
      knowledge: { 'patient-advocate': { attempts: 2, ribbon: true } },
    });
    expect(slow.years).toBe(12.5);
    expect(slow.costBillions).toBe(1.7);
    expect(slow.threeStarLevels).toBe(0);
    expect(slow.knowledgeOpened).toBe(true);
    expect(slow.knowledgeRibbons).toBe(1);
  });
});

describe('relayChain', () => {
  it('lists every role once in play order with its hand-off line and the artifacts it produced', () => {
    const chain = relayChain({
      'dose.starting': { key: 'dose.starting', tag: 'cautious', emittedBy: 'w1-l3', emittedAt: 'x' },
      'label.warnings': { key: 'label.warnings', tag: 'boxed', emittedBy: 'w7-l5', emittedAt: 'x' },
    });
    expect(chain.map((s) => s.role.id)).toEqual(content.roleIndex.map((r) => r.id));
    expect(chain[2]!.artifacts).toEqual([{ key: 'dose.starting', title: 'Starting dose', tag: 'cautious' }]);
    expect(chain.find((s) => s.level.id === 'w7-l5')!.artifacts[0]!.tag).toBe('boxed');
    expect(chain.every((s) => s.handoffLine.length > 0)).toBe(true);
  });
});

describe('artifactEdges', () => {
  it('every artifact has an emitter, and chain (a) runs protocol → eCRF → screening → monitoring → central monitoring', () => {
    const edges = artifactEdges();
    for (const e of edges) expect(e.from.length, e.key).toBeGreaterThan(0);
    const by = Object.fromEntries(edges.map((e) => [e.key, e]));
    expect(by['protocol.criteria']!.from).toEqual(['clinical-scientist']);
    expect(by['protocol.criteria']!.to).toEqual(['edc-programmer', 'principal-investigator']);
    expect(by['monitoring.deviations']!.to).toEqual(['central-monitor']);
    expect(by['label.warnings']!.to).toEqual(['brand-marketing-manager', 'signal-detection-scientist']);
  });
});
