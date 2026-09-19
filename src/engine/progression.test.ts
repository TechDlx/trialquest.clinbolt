import { describe, expect, it } from 'vitest';
import { computeMapState } from './progression';
import { content } from '@/content';

const empty = { levels: {}, crises: {}, reviews: {} };

describe('computeMapState', () => {
  it('starts with the first level current and everything else locked', () => {
    const s = computeMapState(content.worlds, empty);
    expect(s.currentNodeId).toBe('w1-l1');
    expect(s.nodeStatus['w1-l1']).toBe('current');
    expect(s.nodeStatus['w1-l2']).toBe('locked');
    expect(s.nodeStatus['w1-crisis']).toBe('locked');
    expect(s.worldUnlocked.w1).toBe(true);
    expect(s.worldUnlocked.w2).toBe(false);
  });

  it('advances the current node as levels complete and keeps done nodes replayable', () => {
    const s = computeMapState(content.worlds, { ...empty, levels: { 'w1-l1': { stars: 2 } } });
    expect(s.nodeStatus['w1-l1']).toBe('done');
    expect(s.nodeStatus['w1-l2']).toBe('current');
  });

  it('makes the review node available without blocking the boss', () => {
    const levels = {
      'w1-l1': { stars: 1 },
      'w1-l2': { stars: 1 },
      'w1-l3': { stars: 1 },
      'w1-l4': { stars: 1 },
    };
    const s = computeMapState(content.worlds, { ...empty, levels });
    expect(s.nodeStatus['w1-r1']).toBe('available');
    expect(s.nodeStatus['w1-crisis']).toBe('current');
  });

  it('unlocks the next world once the boss is done', () => {
    const levels = {
      'w1-l1': { stars: 1 },
      'w1-l2': { stars: 1 },
      'w1-l3': { stars: 1 },
      'w1-l4': { stars: 1 },
    };
    const s = computeMapState(content.worlds, { ...empty, levels, crises: { 'w1-crisis': { stars: 3 } } });
    expect(s.worldComplete.w1).toBe(true);
    expect(s.worldUnlocked.w2).toBe(true);
    // World 2 is ready, so its first level becomes the current node.
    expect(s.nodeStatus['w2-l1']).toBe('current');
    expect(s.currentNodeId).toBe('w2-l1');
  });
});
