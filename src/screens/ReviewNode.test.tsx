/** Review node through the real screen: due situations replay as micro-rounds and are rescheduled. */
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReviewNodeScreen } from './ReviewNode';
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
  window.location.hash = '';
});

describe('ReviewNode screen', () => {
  it('with nothing due, refills hearts and records the review', () => {
    useProgress.getState().loseHeart();
    render(<ReviewNodeScreen reviewId="w1-r1" />);
    fireEvent.click(screen.getByTestId('review-claim'));
    expect(useProgress.getState().hearts).toBe(5);
    expect(useProgress.getState().reviews['w1-r1']!.count).toBe(1);
  }, 30_000);

  it('replays a missed card and a taken shortcut, then promotes what was answered well', async () => {
    const past = new Date('2020-01-01T00:00:00Z');
    useProgress.getState().recordSituation('w1-l3', 'findings', 'alt', false, past);
    useProgress.getState().recordSituation('w1-l1', 'voice', 'c-hype', false, past);
    useProgress.getState().loseHeart();
    render(<ReviewNodeScreen reviewId="w1-r1" />);
    expect(screen.getByText(/2 situations to revisit/)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('start-review'));

    // Round 1: bucket-sort with the missed card among three.
    const cfg = content.levelById['w1-l3']!.stages[0]!.game as BucketSortConfig;
    for (let i = 0; i < 3; i++) {
      const text = (await screen.findByTestId('bucket-card')).textContent!.trim();
      const card = cfg.cards.find((c) => strip(c.text) === text)!;
      fireEvent.click(screen.getByTestId(`bucket-${card.bucketId}`));
      await gone();
    }
    // Round 2: the decision that contained the shortcut; decline it.
    fireEvent.click(await screen.findByTestId('choice-c-honest', {}, { timeout: 3000 }));
    await gone();

    await screen.findByTestId('debrief', {}, { timeout: 3000 });
    const s = useProgress.getState();
    expect(s.situations['w1-l3:findings:alt']!.box).toBe(2);
    expect(s.situations['w1-l1:voice:c-hype']!.box).toBe(2);
    expect(s.hearts).toBe(5);
    expect(s.reviews['w1-r1']!.count).toBe(1);
  });

  it('a missed scenario decision counts as fixed when replayed with the best choice', async () => {
    const past = new Date('2020-01-01T00:00:00Z');
    useProgress.getState().recordSituation('w1-l1', 'voice', 'c-no', false, past);
    render(<ReviewNodeScreen reviewId="w1-r1" />);
    fireEvent.click(screen.getByTestId('start-review'));
    fireEvent.click(await screen.findByTestId('choice-c-yes', {}, { timeout: 3000 }));
    await gone();
    await screen.findByTestId('debrief', {}, { timeout: 3000 });
    expect(screen.getByTestId('debrief-score')).toHaveTextContent('1 of 1');
    expect(screen.queryByTestId('debrief-retry')).toBeNull(); // no retry on a review
    expect(useProgress.getState().situations['w1-l1:voice:c-no']!.box).toBe(2);
  });
});
