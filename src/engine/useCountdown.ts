import { useEffect, useRef, useState } from 'react';

export interface CountdownOptions {
  /** Total seconds. Ignored when `enabled` is false. */
  seconds: number;
  /** false = timer is off (relaxed mode / untimed). */
  enabled: boolean;
  running: boolean;
  onExpire?: () => void;
  /** Change this value to restart the countdown from the full duration. */
  resetKey?: number | string;
  /** Seconds left to start from on first mount (resuming a checkpoint). Later resets use `seconds`. */
  initialRemaining?: number;
}

export interface Countdown {
  /** Seconds remaining (float). Equals `seconds` when disabled. */
  remaining: number;
  /** 0..1 remaining fraction; 1 when disabled. */
  fraction: number;
  expired: boolean;
}

const TICK_MS = 100;

/**
 * Pausable countdown driven by wall-clock time (robust to tab throttling).
 * `onExpire` fires exactly once per reset.
 */
export function useCountdown({
  seconds,
  enabled,
  running,
  onExpire,
  resetKey = 0,
  initialRemaining,
}: CountdownOptions): Countdown {
  const startRef = useRef(initialRemaining);
  const [remaining, setRemaining] = useState(initialRemaining ?? seconds);
  const [expired, setExpired] = useState(false);

  // Restart when the key or duration changes (React's "adjust state on prop change" pattern).
  const [prev, setPrev] = useState({ resetKey, seconds });
  if (prev.resetKey !== resetKey || prev.seconds !== seconds) {
    setPrev({ resetKey, seconds });
    setRemaining(seconds);
    setExpired(false);
  }

  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  const remainingRef = useRef(initialRemaining ?? seconds);
  useEffect(() => {
    remainingRef.current = startRef.current ?? seconds;
    startRef.current = undefined;
  }, [seconds, resetKey]);

  const lastTickRef = useRef<number | null>(null);
  useEffect(() => {
    if (!enabled || !running || expired) return;
    lastTickRef.current = null;
    const id = window.setInterval(() => {
      const now = Date.now();
      const last = lastTickRef.current ?? now;
      lastTickRef.current = now;
      const next = Math.max(0, remainingRef.current - (now - last) / 1000);
      remainingRef.current = next;
      setRemaining(next);
      if (next <= 0) {
        window.clearInterval(id);
        setExpired(true);
        onExpireRef.current?.();
      }
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [enabled, running, expired, resetKey]);

  if (!enabled) return { remaining: seconds, fraction: 1, expired: false };
  return { remaining, fraction: seconds > 0 ? remaining / seconds : 0, expired };
}
