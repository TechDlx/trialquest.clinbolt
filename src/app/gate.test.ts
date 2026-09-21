import { describe, expect, it } from 'vitest';
import { isLockedRoute, type GateProgress } from './gate';

const fresh = (): GateProgress => ({ levels: {}, crises: {}, reviews: {}, cardsViewed: {} });
const partW1 = (): GateProgress => ({
  ...fresh(),
  levels: { 'w1-l1': { stars: 2 } },
  cardsViewed: { 'patient-advocate': {} },
});

describe('deep-link unlock gate', () => {
  it('refuses a level, badge or level role card in a locked world', () => {
    const p = partW1();
    expect(isLockedRoute({ name: 'level', levelId: 'w6-l1' }, p)).toBe(true);
    expect(isLockedRoute({ name: 'badge', levelId: 'w6-l1' }, p)).toBe(true);
    expect(isLockedRoute({ name: 'role', roleId: 'global-study-manager', levelId: 'w6-l1' }, p)).toBe(true);
  });

  it('refuses a card on its own until it has been collected', () => {
    expect(isLockedRoute({ name: 'role', roleId: 'global-study-manager' }, partW1())).toBe(true);
    const p = partW1();
    p.cardsViewed['global-study-manager'] = {};
    expect(isLockedRoute({ name: 'role', roleId: 'global-study-manager' }, p)).toBe(false);
  });

  it('opens the current node and done nodes, and refuses later ones in the same world', () => {
    const p = partW1();
    expect(isLockedRoute({ name: 'level', levelId: 'w1-l1' }, p)).toBe(false);
    expect(isLockedRoute({ name: 'level', levelId: 'w1-l2' }, p)).toBe(false);
    expect(isLockedRoute({ name: 'level', levelId: 'w1-l3' }, p)).toBe(true);
    expect(isLockedRoute({ name: 'crisis', crisisId: 'w1-crisis' }, p)).toBe(true);
  });

  it('gates stories, tests and the finale', () => {
    const p = partW1();
    expect(isLockedRoute({ name: 'story', worldId: 'w1', beat: 'intro' }, p)).toBe(false);
    expect(isLockedRoute({ name: 'story', worldId: 'w1', beat: 'outro' }, p)).toBe(true);
    expect(isLockedRoute({ name: 'story', worldId: 'w6', beat: 'intro' }, p)).toBe(true);
    expect(isLockedRoute({ name: 'test', roleId: 'global-study-manager' }, p)).toBe(true);
    expect(isLockedRoute({ name: 'finale' }, p)).toBe(true);
  });

  it('lets lab levels, unknown ids and non-play routes through', () => {
    const p = fresh();
    expect(isLockedRoute({ name: 'level', levelId: 'lab-sequence' }, p)).toBe(false);
    expect(isLockedRoute({ name: 'level', levelId: 'nope' }, p)).toBe(false);
    expect(isLockedRoute({ name: 'map' }, p)).toBe(false);
    expect(isLockedRoute({ name: 'glossary' }, p)).toBe(false);
  });
});
