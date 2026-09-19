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

  it('running out of hearts mid-stage keeps the level where it stopped; a Codex card wins a heart back', async () => {
    const p = useProgress.getState();
    for (let i = 0; i < 4; i++) p.loseHeart();
    expect(useProgress.getState().hearts).toBe(1);
    render(<LevelScreen levelId="w1-l3" />);
    fireEvent.click(screen.getByTestId('start-level'));
    fireEvent.click(screen.getByTestId('start-stage-findings'));
    const cfg = content.levelById['w1-l3']!.stages[0]!.game as BucketSortConfig;
    const wrongFor = (text: string) => {
      const card = cfg.cards.find((c) => strip(c.text) === text)!;
      return cfg.buckets.find((b) => b.id !== card.bucketId && b.id !== 'noise')!.id;
    };
    // Card 1 wrong: World 1's free mistake. Card 2 wrong: the last heart.
    fireEvent.click(
      screen.getByTestId(`bucket-${wrongFor(screen.getByTestId('bucket-card').textContent!.trim())}`),
    );
    fireEvent.click(screen.getByTestId('engine-next'));
    const stuckOn = screen.getByTestId('bucket-card').textContent!.trim();
    fireEvent.click(screen.getByTestId(`bucket-${wrongFor(stuckOn)}`));
    expect(useProgress.getState().hearts).toBe(0);
    expect(screen.getByTestId('hearts-sheet')).toBeInTheDocument();
    expect(screen.queryByTestId('debrief')).toBeNull(); // not failed out

    // Re-read the Toxicologist card inside the sheet and claim a heart.
    fireEvent.click(screen.getByTestId('hearts-card-preclinical-toxicologist'));
    fireEvent.click(screen.getByTestId('hearts-claim'));
    expect(useProgress.getState().hearts).toBe(1);
    fireEvent.click(screen.getByTestId('hearts-continue'));
    expect(screen.queryByTestId('hearts-sheet')).toBeNull();

    // Still on the same card, with its explanation waiting.
    fireEvent.click(screen.getByTestId('engine-next'));
    expect(screen.getByTestId('bucket-card').textContent!.trim()).not.toBe(stuckOn);
    for (let i = 2; i < cfg.cards.length; i++) {
      const card = cfg.cards.find(
        (c) => strip(c.text) === screen.getByTestId('bucket-card').textContent!.trim(),
      )!;
      fireEvent.click(screen.getByTestId(`bucket-${card.bucketId}`));
      await gone();
    }
    expect(screen.getByTestId('start-stage-dose')).toBeInTheDocument();
    expect(useProgress.getState().attempts['w1-l3']).toMatchObject({ nextIndex: 1, freeUsed: true });
  });

  it('leaving after a completed stage resumes at the next stage instead of starting over', async () => {
    const { unmount } = render(<LevelScreen levelId="w1-l3" />);
    fireEvent.click(screen.getByTestId('start-level'));
    fireEvent.click(screen.getByTestId('start-stage-findings'));
    const cfg = content.levelById['w1-l3']!.stages[0]!.game as BucketSortConfig;
    for (let i = 0; i < cfg.cards.length; i++) {
      const card = cfg.cards.find(
        (c) => strip(c.text) === screen.getByTestId('bucket-card').textContent!.trim(),
      )!;
      fireEvent.click(screen.getByTestId(`bucket-${card.bucketId}`));
      await gone();
    }
    expect(useProgress.getState().attempts['w1-l3']!.nextIndex).toBe(1);
    unmount(); // e.g. quit to the map to collect hearts

    render(<LevelScreen levelId="w1-l3" />);
    expect(screen.getByTestId('resume-level')).toHaveTextContent('Continue (stage 2 of 2)');
    fireEvent.click(screen.getByTestId('resume-level'));
    expect(screen.getByTestId('start-stage-dose')).toBeInTheDocument(); // straight to stage 2
    fireEvent.click(screen.getByTestId('start-stage-dose'));
    fireEvent.change(screen.getByTestId('slider-dose'), { target: { value: '0.5' } });
    fireEvent.click(screen.getByTestId('allocator-commit'));
    fireEvent.click(screen.getByTestId('reveal-done'));
    fireEvent.click(screen.getByTestId('sandbox-done'));
    expect(await screen.findByTestId('debrief')).toBeInTheDocument();
    const s = useProgress.getState();
    expect(s.attempts['w1-l3']).toBeUndefined();
    expect(s.levels['w1-l3']!.stars).toBe(3); // stage 1 results carried over
    expect(s.artifacts['dose.starting']).toMatchObject({ tag: 'standard' });
  });

  it('quitting mid-stage resumes on the same card with its explanation still up and the clock where it was', async () => {
    useSettings.getState().setRelaxed(false);
    const { unmount } = render(<LevelScreen levelId="w1-l3" />);
    fireEvent.click(screen.getByTestId('start-level'));
    fireEvent.click(screen.getByTestId('start-stage-findings'));
    const cfg = content.levelById['w1-l3']!.stages[0]!.game as BucketSortConfig;
    // Card 1 right, card 2 wrong (free), then leave with the explanation open.
    const first = cfg.cards.find(
      (c) => strip(c.text) === screen.getByTestId('bucket-card').textContent!.trim(),
    )!;
    fireEvent.click(screen.getByTestId(`bucket-${first.bucketId}`));
    await gone();
    const stuckOn = screen.getByTestId('bucket-card').textContent!.trim();
    const second = cfg.cards.find((c) => strip(c.text) === stuckOn)!;
    const wrongBucket = cfg.buckets.find((b) => b.id !== second.bucketId && b.id !== 'noise')!.id;
    fireEvent.click(screen.getByTestId(`bucket-${wrongBucket}`));
    expect(screen.getByTestId('engine-next')).toBeInTheDocument();
    const saved = useProgress.getState().attempts['w1-l3']!;
    expect(saved.nextIndex).toBe(0);
    expect(saved.engine).toMatchObject({
      index: 1,
      results: { [first.id]: 'correct', [second.id]: 'wrong' },
    });
    expect(saved.remaining).toBeGreaterThan(0);
    unmount();

    render(<LevelScreen levelId="w1-l3" />);
    expect(screen.getByTestId('resume-level')).toHaveTextContent(
      'Continue where you left off (stage 1 of 2)',
    );
    fireEvent.click(screen.getByTestId('resume-level'));
    // No stage card: straight back to card 2 with the explanation still showing.
    expect(screen.getByTestId('engine-progress')).toHaveTextContent('Card 2 of');
    expect(screen.getByTestId('bucket-card').textContent!.trim()).toBe(stuckOn);
    fireEvent.click(screen.getByTestId('engine-next'));
    expect(screen.getByTestId('engine-progress')).toHaveTextContent('Card 3 of');
    for (let i = 2; i < cfg.cards.length; i++) {
      const card = cfg.cards.find(
        (c) => strip(c.text) === screen.getByTestId('bucket-card').textContent!.trim(),
      )!;
      fireEvent.click(screen.getByTestId(`bucket-${card.bucketId}`));
      await gone();
    }
    expect(screen.getByTestId('start-stage-dose')).toBeInTheDocument();
    // The earlier wrong turn is still in the stage result, not counted twice.
    expect(useProgress.getState().attempts['w1-l3']!.byStage.findings!.mistakes).toHaveLength(1);
    expect(useProgress.getState().hearts).toBe(5);
  });
});
