import { describe, expect, it } from 'vitest';
import { gainHearts, loseHeart, msToNextHeart, refillHearts } from './hearts';

const t0 = new Date('2026-09-18T10:00:00Z');
const plus = (min: number) => new Date(t0.getTime() + min * 60_000);

describe('hearts', () => {
  it('starts the refill clock on the first loss', () => {
    const s = loseHeart({ hearts: 5, heartsUpdatedAt: null }, t0);
    expect(s).toEqual({ hearts: 4, heartsUpdatedAt: t0.toISOString() });
  });
  it('does not refill before 30 minutes', () => {
    const s = { hearts: 3, heartsUpdatedAt: t0.toISOString() };
    expect(refillHearts(s, plus(29))).toEqual(s);
  });
  it('refills one heart per 30 minutes and keeps the remainder', () => {
    const s = { hearts: 3, heartsUpdatedAt: t0.toISOString() };
    const r = refillHearts(s, plus(75));
    expect(r.hearts).toBe(5);
    expect(r.heartsUpdatedAt).toBeNull();
    const r2 = refillHearts({ hearts: 1, heartsUpdatedAt: t0.toISOString() }, plus(75));
    expect(r2.hearts).toBe(3);
    expect(r2.heartsUpdatedAt).toBe(plus(60).toISOString());
  });
  it('never exceeds max', () => {
    expect(gainHearts({ hearts: 5, heartsUpdatedAt: null }, 3).hearts).toBe(5);
    expect(refillHearts({ hearts: 0, heartsUpdatedAt: t0.toISOString() }, plus(10_000)).hearts).toBe(5);
  });
  it('reports time to next heart', () => {
    expect(msToNextHeart({ hearts: 5, heartsUpdatedAt: null })).toBeNull();
    expect(msToNextHeart({ hearts: 2, heartsUpdatedAt: t0.toISOString() }, plus(10))).toBe(20 * 60_000);
  });
  it('survives a corrupt timestamp', () => {
    const r = refillHearts({ hearts: 2, heartsUpdatedAt: 'garbage' }, t0);
    expect(r.hearts).toBe(2);
    expect(r.heartsUpdatedAt).toBe(t0.toISOString());
  });
});
