import { economy } from '@/content/economy';

export interface HeartState {
  hearts: number;
  /** ISO timestamp of the moment the refill clock started (last time hearts dropped below max). */
  heartsUpdatedAt: string | null;
}

/** Applies wall-clock refills. Pure; safe to call on every load. */
export function refillHearts(state: HeartState, now: Date = new Date()): HeartState {
  const max = economy.hearts.max;
  if (state.hearts >= max || !state.heartsUpdatedAt)
    return { hearts: Math.min(state.hearts, max), heartsUpdatedAt: null };
  const since = new Date(state.heartsUpdatedAt).getTime();
  if (Number.isNaN(since)) return { hearts: state.hearts, heartsUpdatedAt: now.toISOString() };
  const intervalMs = economy.hearts.refillMinutes * 60_000;
  const elapsed = now.getTime() - since;
  if (elapsed < intervalMs) return state;
  const gained = Math.floor(elapsed / intervalMs);
  const hearts = Math.min(max, state.hearts + gained);
  if (hearts >= max) return { hearts, heartsUpdatedAt: null };
  const remainder = elapsed - gained * intervalMs;
  return { hearts, heartsUpdatedAt: new Date(now.getTime() - remainder).toISOString() };
}

export function loseHeart(state: HeartState, now: Date = new Date()): HeartState {
  const hearts = Math.max(0, state.hearts - 1);
  return { hearts, heartsUpdatedAt: state.heartsUpdatedAt ?? now.toISOString() };
}

export function gainHearts(state: HeartState, amount: number): HeartState {
  const hearts = Math.min(economy.hearts.max, state.hearts + amount);
  return { hearts, heartsUpdatedAt: hearts >= economy.hearts.max ? null : state.heartsUpdatedAt };
}

/** Milliseconds until the next heart, or null if full. */
export function msToNextHeart(state: HeartState, now: Date = new Date()): number | null {
  if (state.hearts >= economy.hearts.max || !state.heartsUpdatedAt) return null;
  const intervalMs = economy.hearts.refillMinutes * 60_000;
  const elapsed = now.getTime() - new Date(state.heartsUpdatedAt).getTime();
  return Math.max(0, intervalMs - (elapsed % intervalMs));
}
