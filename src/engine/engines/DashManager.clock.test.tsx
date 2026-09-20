/**
 * Regression for the arrival starvation bug: the stage host re-renders the engine every 100 ms
 * (its countdown), which used to recreate the 250 ms tick before it could fire, so items never
 * arrived. The clock must keep wall-clock time across those re-renders.
 */
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { useEffect, useState } from 'react';
import type { DashConfig } from '@/content/types';
import { DashManager } from './DashManager';
import type { EngineResult } from '@/engine/scoring';

const cfg: DashConfig = {
  engine: 'dash-manager',
  prompt: 'Serve the queue.',
  seconds: 30,
  stations: [{ id: 'a', label: 'A' }],
  items: [
    {
      id: 'first',
      label: 'First',
      steps: ['a'],
      patienceSeconds: 20,
      arrivesAt: 0,
      conceptId: 'gcp',
      explanation: 'x',
      consequence: 'y',
    },
    {
      id: 'second',
      label: 'Second',
      steps: ['a'],
      patienceSeconds: 20,
      arrivesAt: 0.6,
      conceptId: 'gcp',
      explanation: 'x',
      consequence: 'y',
    },
  ],
};

/** Mimics StageRunner: a countdown that changes the engine's props ten times a second. */
function Host() {
  const [remaining, setRemaining] = useState(1);
  useEffect(() => {
    const id = window.setInterval(() => setRemaining((r) => Math.max(0, r - 0.1 / 30)), 100);
    return () => window.clearInterval(id);
  }, []);
  return (
    <DashManager
      config={cfg}
      seed={1}
      paused={false}
      relaxed={false}
      remainingFraction={remaining}
      timeUp={false}
      mode="level"
      onMistake={vi.fn(() => ({ heartLost: true }))}
      onShortcut={vi.fn()}
      onMeters={vi.fn()}
      onComplete={vi.fn<(r: EngineResult) => void>()}
    />
  );
}

describe('DashManager clock', () => {
  it('items arrive on wall-clock time even when the host re-renders every 100 ms', async () => {
    render(<Host />);
    await waitFor(() => expect(screen.getByTestId('dash-item-first')).toBeInTheDocument(), { timeout: 2000 });
    expect(screen.queryByTestId('dash-item-second')).toBeNull();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 900));
    });
    await waitFor(() => expect(screen.getByTestId('dash-item-second')).toBeInTheDocument(), {
      timeout: 2000,
    });
  });
});
