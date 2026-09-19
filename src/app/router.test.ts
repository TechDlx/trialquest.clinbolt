import { describe, expect, it } from 'vitest';
import { href, parseHash } from './router';

describe('hash router', () => {
  it('parses routes', () => {
    expect(parseHash('')).toEqual({ name: 'title' });
    expect(parseHash('#/')).toEqual({ name: 'title' });
    expect(parseHash('#/map/w1')).toEqual({ name: 'map', worldId: 'w1' });
    expect(parseHash('#/level/w1-l1')).toEqual({ name: 'level', levelId: 'w1-l1' });
    expect(parseHash('#/role/cmc-scientist?level=w1-l4')).toEqual({
      name: 'role',
      roleId: 'cmc-scientist',
      levelId: 'w1-l4',
    });
    expect(parseHash('#/story/w1/outro')).toEqual({ name: 'story', worldId: 'w1', beat: 'outro' });
    expect(parseHash('#/nope')).toEqual({ name: 'notfound', path: 'nope' });
  });
  it('round-trips through href', () => {
    const routes = [
      { name: 'map', worldId: 'w3' },
      { name: 'role', roleId: 'biostatistician', levelId: 'w2-l2' },
      { name: 'codex', roleId: 'irb-member' },
      { name: 'glossary', termId: 'gcp' },
      { name: 'settings' },
    ] as const;
    for (const r of routes) expect(parseHash(href(r))).toEqual(r);
  });
});
