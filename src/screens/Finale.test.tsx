/** Finale: relay chain of every role, journey stats, certificate fallback, and the seen flag. */
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FinaleScreen } from './Finale';
import { content } from '@/content';
import { useProgress } from '@/store/progress';

beforeEach(() => {
  useProgress.getState().resetProgress();
  window.location.hash = '';
});

describe('Finale screen', () => {
  it('shows 44 relay steps, the stats, a certificate (or its text fallback) and marks the finale seen', () => {
    const p = useProgress.getState();
    for (const l of content.levels)
      p.recordLevelResult(l.id, { stars: 3, score: 95, xp: { total: 45, lines: [] } });
    for (const c of content.crises)
      p.recordCrisisResult(c.id, { stars: 3, points: 100, xp: { total: 100, lines: [] } });
    p.setArtifacts([
      { key: 'dose.starting', tag: 'standard', emittedBy: 'w1-l3', emittedAt: new Date().toISOString() },
    ]);

    render(<FinaleScreen />);
    expect(screen.getAllByTestId('relay-step')).toHaveLength(44);
    expect(screen.getByTestId('relay-artifact')).toHaveTextContent('Starting dose: standard');
    expect(screen.getByTestId('finale-stats')).toHaveTextContent('44 of 44');
    // jsdom has no 2D canvas, so the text fallback carries the certificate content.
    expect(screen.getByTestId('certificate-fallback')).toHaveTextContent('44 of 44 roles');
    expect(screen.getByTestId('certificate-fallback')).not.toHaveTextContent('Knowledge checks');

    fireEvent.click(screen.getByTestId('finale-continue'));
    expect(useProgress.getState().finaleSeen).toBe(true);
    expect(window.location.hash).toBe('#/map/w8');
  });
});
