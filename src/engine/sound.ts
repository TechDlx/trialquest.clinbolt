import { useSettings } from '@/store/settings';

/**
 * Tiny synthesised sound set (Web Audio, no assets). Off by default; the Settings toggle
 * turns it on. Every call is safe in environments without AudioContext (tests, old browsers).
 */
export type SoundKind = 'tap' | 'correct' | 'wrong' | 'shortcut' | 'star' | 'unlock';

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = (globalThis as { AudioContext?: typeof AudioContext }).AudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    return null;
  }
  return ctx;
}

/** Frequencies (Hz) and durations (s) per note, played in sequence. */
const PATTERNS: Record<SoundKind, { f: number; d: number; type?: OscillatorType }[]> = {
  tap: [{ f: 660, d: 0.04 }],
  correct: [
    { f: 660, d: 0.08 },
    { f: 880, d: 0.12 },
  ],
  wrong: [
    { f: 220, d: 0.12, type: 'square' },
    { f: 180, d: 0.16, type: 'square' },
  ],
  shortcut: [
    { f: 520, d: 0.08, type: 'triangle' },
    { f: 440, d: 0.14, type: 'triangle' },
  ],
  star: [
    { f: 660, d: 0.08 },
    { f: 880, d: 0.08 },
    { f: 1100, d: 0.16 },
  ],
  unlock: [
    { f: 523, d: 0.1 },
    { f: 659, d: 0.1 },
    { f: 784, d: 0.1 },
    { f: 1047, d: 0.2 },
  ],
};

export function playSound(kind: SoundKind): void {
  if (!useSettings.getState().sound) return;
  const ac = context();
  if (!ac) return;
  try {
    if (ac.state === 'suspended') void ac.resume();
    let t = ac.currentTime;
    for (const note of PATTERNS[kind]) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = note.type ?? 'sine';
      osc.frequency.value = note.f;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + note.d);
      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + note.d + 0.02);
      t += note.d;
    }
  } catch {
    // Audio is a nicety; never let it break play.
  }
}
