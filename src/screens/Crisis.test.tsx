/**
 * Crisis boss through the real screen: a failed round costs one heart and its meterHit,
 * explanations are deferred to the resolution, and clearing 3 of 4 rounds resolves the crisis.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CrisisScreen } from './Crisis';
import { content } from '@/content';
import type { BranchingConfig, BucketSortConfig, BuilderConfig, ImpostorConfig } from '@/content/types';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

const strip = (s: string) => s.replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, '$1').replace(/\[\[([^\]]+)\]\]/g, '$1');
const flashGone = () =>
  waitFor(() => expect(screen.queryByTestId('engine-feedback')).toBeNull(), { timeout: 3000 });

beforeEach(() => {
  useProgress.getState().resetProgress();
  useSettings.getState().resetSettings();
  useSettings.getState().setRelaxed(true);
  window.location.hash = '';
});

describe('Crisis screen: w1-crisis', () => {
  it('fails round 1, clears the rest, and resolves with deferred explanations', async () => {
    const crisis = content.crisisById['w1-crisis']!;
    render(<CrisisScreen crisisId="w1-crisis" />);
    fireEvent.click(screen.getByTestId('start-crisis'));

    // Round 1 (bucket-sort): every card wrong -> not cleared.
    await screen.findByTestId('crisis-brief', {}, { timeout: 3000 });
    const r1 = crisis.rounds[0]!.game as BucketSortConfig;
    for (let i = 0; i < r1.cards.length; i++) {
      const text = screen.getByTestId('bucket-card').textContent!.trim();
      const card = r1.cards.find((c) => strip(c.text) === text)!;
      const wrong = r1.buckets.find((b) => b.id !== card.bucketId)!;
      fireEvent.click(screen.getByTestId(`bucket-${wrong.id}`));
      expect(screen.queryByTestId('engine-next')).toBeNull(); // nothing blocks in a crisis
      await flashGone();
    }
    await screen.findByTestId('crisis-next-round', {}, { timeout: 3000 });
    let s = useProgress.getState();
    expect(s.hearts).toBe(4);
    expect(s.meters.safety).toBe(90);
    fireEvent.click(screen.getByTestId('crisis-next-round'));

    // Round 2 (builder): correct.
    await screen.findByTestId('crisis-brief', {}, { timeout: 3000 });
    const r2 = crisis.rounds[1]!.game as BuilderConfig;
    for (const slot of r2.slots) {
      const part = r2.parts.find((p) => p.slotId === slot.id)!;
      fireEvent.click(screen.getByTestId(`part-${part.id}`));
      fireEvent.click(screen.getByTestId(`slot-${slot.id}`));
    }
    fireEvent.click(screen.getByTestId('builder-check'));
    await screen.findByTestId('crisis-next-round', {}, { timeout: 3000 });
    fireEvent.click(screen.getByTestId('crisis-next-round'));

    // Round 3 (impostor): correct.
    await screen.findByTestId('crisis-brief', {}, { timeout: 3000 });
    const r3 = crisis.rounds[2]!.game as ImpostorConfig;
    fireEvent.click(screen.getByTestId(`card-${r3.cards.find((c) => c.impostor)!.id}`));
    fireEvent.click(screen.getByTestId('impostor-accuse'));
    await screen.findByTestId('crisis-next-round', {}, { timeout: 3000 });
    fireEvent.click(screen.getByTestId('crisis-next-round'));

    // Round 4 (branching, 'missed' variant because round 1 buried the necrosis): best choice.
    await screen.findByTestId('crisis-brief', {}, { timeout: 3000 });
    expect(screen.getByTestId('crisis-brief')).toHaveTextContent('downplayed');
    const r4 = crisis.rounds[3]!.game as BranchingConfig;
    const best = r4.nodes.find((n) => n.id === r4.start)!.choices!.find((c) => c.quality === 'best')!;
    fireEvent.click(screen.getByTestId(`choice-${best.id}`));
    await flashGone();
    fireEvent.click(await screen.findByTestId('branching-finish', {}, { timeout: 3000 }));

    // Resolution: success (3 of 4), story beat, deferred explanations, world complete.
    await screen.findByTestId('crisis-success', {}, { timeout: 3000 });
    expect(screen.getByTestId('debrief')).toHaveTextContent('Signal contained');
    expect(screen.getByTestId('debrief-mistakes')).toHaveTextContent('top 2 of 4');
    fireEvent.click(screen.getByTestId('debrief-see-all'));
    expect(screen.getByTestId('debrief-mistakes').querySelectorAll('li').length).toBe(4);
    s = useProgress.getState();
    expect(s.crises['w1-crisis']!.stars).toBeGreaterThan(0);
    expect(s.worldsCompleted).toEqual(['w1']);
    expect(s.hearts).toBe(4); // still only one heart lost
  });
});
