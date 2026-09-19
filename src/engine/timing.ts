/**
 * Dev-only timing log for human playtests. Local only: console + a copyable summary on the
 * Settings screen behind the debug flag. Nothing here is persisted or sent anywhere.
 */
import { useSyncExternalStore } from 'react';
import { useSettings } from '@/store/settings';

export interface Segment {
  label: string;
  startedAt: number;
  endedAt?: number;
}

const segments: Segment[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const enabled = () => useSettings.getState().debug;

/** Starts a segment; ends any open segment with the same label first. */
export function startSegment(label: string): void {
  if (!enabled()) return;
  endSegment(label);
  segments.push({ label, startedAt: Date.now() });
  emit();
}

export function endSegment(label: string): void {
  if (!enabled()) return;
  const open = [...segments].reverse().find((s) => s.label === label && !s.endedAt);
  if (!open) return;
  open.endedAt = Date.now();
  console.info(`[timing] ${label}: ${((open.endedAt - open.startedAt) / 1000).toFixed(1)} s`);
  emit();
}

export function clearSegments(): void {
  segments.length = 0;
  emit();
}

export function timingSummary(): string {
  const done = segments.filter((s) => s.endedAt);
  if (done.length === 0) return 'No segments recorded yet.';
  const lines = done.map((s) => `${s.label}\t${((s.endedAt! - s.startedAt) / 1000).toFixed(1)} s`);
  const total = done.reduce((n, s) => n + (s.endedAt! - s.startedAt), 0) / 1000;
  return [...lines, `total\t${total.toFixed(1)} s`].join('\n');
}

export function useTimingSegments(): Segment[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => segments,
    () => segments,
  );
}
