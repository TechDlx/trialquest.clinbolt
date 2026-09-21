/** Maya's cameo: anonymous inside the task, revealed in the debrief (World 5 on). */
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LevelScreen } from './Level';
import { content } from '@/content';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

beforeEach(() => {
  useProgress.getState().resetProgress();
  useSettings.getState().resetSettings();
  useSettings.getState().setRelaxed(true);
  useProgress.getState().markCardViewed('cra-monitor');
  window.location.hash = '';
});

describe('Level screen: w5-l2 cameo', () => {
  it('tags Participant 0417 in the task and reveals her in the debrief', async () => {
    const level = content.levelById['w5-l2']!;
    render(<LevelScreen levelId="w5-l2" />);
    fireEvent.click(screen.getByTestId('start-level'));
    fireEvent.click(screen.getByTestId('start-stage-sdv'));
    // The card title already reads the label, so the tag shows the portrait only (no double name).
    expect(screen.getByTestId('maya-tag')).toBeInTheDocument();
    expect(screen.getByTestId('card-p-0417')).toHaveTextContent(
      new RegExp('^' + level.mayaCameo!.label + '$'),
    );
    expect(screen.queryByTestId('debrief-maya')).toBeNull();

    // Inspect and accuse the deviation; a correct accusation auto-advances to the debrief.
    fireEvent.click(screen.getByTestId('card-p-0419'));
    fireEvent.click(screen.getByTestId('impostor-accuse'));

    expect(await screen.findByTestId('debrief', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByTestId('debrief-maya')).toHaveTextContent('Maya');
    expect(useProgress.getState().artifacts['monitoring.deviations']?.tag).toBe('clean');
  });
});
