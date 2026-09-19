/**
 * Integration: plays the Toxicologist level through the real Level screen and checks the
 * pipeline effects a player would see: a shortcut costs meters not hearts and becomes a
 * review situation, the first simulation commit is binding and emits the artifact.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LevelScreen } from './Level';
import { content } from '@/content';
import type { BucketSortConfig } from '@/content/types';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

const strip = (s: string) => s.replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, '$1').replace(/\[\[([^\]]+)\]\]/g, '$1');
const gone = () =>
  waitFor(() => expect(screen.queryByTestId('engine-feedback')).toBeNull(), { timeout: 3000 });

beforeEach(() => {
  useProgress.getState().resetProgress();
  useSettings.getState().resetSettings();
  useSettings.getState().setRelaxed(true);
  useProgress.getState().markCardViewed('preclinical-toxicologist');
  window.location.hash = '';
});

describe('Level screen: w1-l3 end to end', () => {
  it('shortcut bucket costs meters not hearts, records a situation; dose commit emits dose.starting', async () => {
    render(<LevelScreen levelId="w1-l3" />);
    fireEvent.click(screen.getByTestId('start-level'));
    fireEvent.click(screen.getByTestId('start-stage-findings'));
    const cfg = content.levelById['w1-l3']!.stages[0]!.game as BucketSortConfig;
    for (let i = 0; i < cfg.cards.length; i++) {
      const text = screen.getByTestId('bucket-card').textContent!.trim();
      const card = cfg.cards.find((c) => strip(c.text) === text)!;
      if (i === 0) {
        fireEvent.click(screen.getByTestId('bucket-noise'));
        fireEvent.click(screen.getByTestId('engine-next'));
      } else {
        fireEvent.click(screen.getByTestId(`bucket-${card.bucketId}`));
        await gone();
      }
    }
    const afterStage1 = useProgress.getState();
    expect(afterStage1.hearts).toBe(5);
    expect(afterStage1.meters.timeline).toBe(100); // +10 is capped at the meter maximum
    expect(afterStage1.meters.safety).toBe(100 - 15);
    expect(afterStage1.situations['w1-l3:findings:noise']).toMatchObject({ box: 1, misses: 1 });

    fireEvent.click(screen.getByTestId('start-stage-dose'));
    fireEvent.change(screen.getByTestId('slider-dose'), { target: { value: '0.5' } });
    fireEvent.click(screen.getByTestId('allocator-commit'));
    expect(screen.getByTestId('reveal')).toHaveAttribute('data-band', 'standard');
    fireEvent.click(screen.getByTestId('reveal-done'));
    fireEvent.change(screen.getByTestId('slider-dose'), { target: { value: '4.8' } }); // sandbox: unscored
    fireEvent.click(screen.getByTestId('sandbox-done'));

    expect(await screen.findByTestId('debrief')).toBeInTheDocument();
    expect(screen.getByTestId('debrief-artifacts')).toHaveTextContent('Starting dose');
    expect(screen.getByTestId('debrief-artifacts')).toHaveTextContent('standard');
    const s = useProgress.getState();
    expect(s.artifacts['dose.starting']).toMatchObject({
      tag: 'standard',
      data: { mgPerKg: 0.5 },
      emittedBy: 'w1-l3',
    });
    expect(s.levels['w1-l3']!.stars).toBeGreaterThan(0);
    expect(s.meters.safety).toBe(85); // the sandbox never touched the meters
  }, 30_000);

  it('a hard-wrong dose commit costs a heart and the reckless band meters, once', async () => {
    render(<LevelScreen levelId="w1-l3" />);
    fireEvent.click(screen.getByTestId('start-level'));
    fireEvent.click(screen.getByTestId('start-stage-findings'));
    const cfg = content.levelById['w1-l3']!.stages[0]!.game as BucketSortConfig;
    for (let i = 0; i < cfg.cards.length; i++) {
      const text = screen.getByTestId('bucket-card').textContent!.trim();
      const card = cfg.cards.find((c) => strip(c.text) === text)!;
      fireEvent.click(screen.getByTestId(`bucket-${card.bucketId}`));
      await gone();
    }
    fireEvent.click(screen.getByTestId('start-stage-dose'));
    fireEvent.click(screen.getByTestId('preset-use-hed'));
    expect(useProgress.getState().meters.timeline).toBe(100); // lure +15 is capped at 100
    fireEvent.click(screen.getByTestId('allocator-commit'));
    const s = useProgress.getState();
    expect(s.meters.safety).toBe(75); // worse of shortcut -25 and band -10
    expect(s.meters.timeline).toBe(90); // then the band's -10 at the reveal
    expect(s.hearts).toBe(5); // World 1: first mistake free
    expect(screen.getByTestId('reveal')).toHaveAttribute('data-band', 'reckless');
  });
});
