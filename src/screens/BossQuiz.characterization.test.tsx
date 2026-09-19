/**
 * Characterization tests for the CURRENT Boss Quiz result handling. The boss becomes the
 * Crisis Boss in 2b, but the shared pipeline (hearts, meters, records, streak, world
 * completion, concepts) must behave identically after extraction.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { BossQuizScreen } from './BossQuiz';
import { content } from '@/content';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

const boss = content.bossById['w1-boss']!;

function answer(kind: 'right' | 'wrong') {
  const prompt = screen.getByTestId('quiz-prompt').textContent!.trim();
  const q = boss.questions.find((x) => x.prompt === prompt)!;
  const correct = q.options.find((o) => o.correct)!.text;
  const options = screen.getAllByTestId('quiz-option');
  fireEvent.click(
    options.find((el) => {
      const label = el.getAttribute('aria-label') ?? '';
      return kind === 'right' ? label.endsWith(`: ${correct}`) : !label.endsWith(`: ${correct}`);
    })!,
  );
}
const next = () => fireEvent.click(screen.getByTestId('quiz-next'));

beforeEach(() => {
  useProgress.getState().resetProgress();
  useSettings.getState().resetSettings();
  useSettings.getState().setRelaxed(true);
  window.location.hash = '';
  render(<BossQuizScreen bossId="w1-boss" />);
  fireEvent.click(screen.getByTestId('start-boss'));
});

describe('Boss quiz result pipeline (current behaviour)', () => {
  it('every mistake costs a heart and 3 integrity; no free mistake', () => {
    answer('wrong');
    expect(useProgress.getState().hearts).toBe(4);
    expect(useProgress.getState().meters.integrity).toBe(97);
    next();
    answer('wrong');
    expect(useProgress.getState().hearts).toBe(3);
    expect(useProgress.getState().meters.integrity).toBe(94);
  });

  it('passing at >= 60% records the crisis, completes the world, and offers the story', () => {
    answer('wrong');
    next();
    for (let i = 1; i < boss.questions.length; i++) {
      answer('right');
      next();
    }
    const s = useProgress.getState();
    // 7/8 = 0.875, speed 0.5 -> score 80 -> 2 stars
    expect(s.bosses['w1-boss']).toMatchObject({ stars: 2, attempts: 1 });
    expect(s.bosses['w1-boss']!.bestPoints).toBeGreaterThan(0);
    expect(s.worldsCompleted).toEqual(['w1']);
    expect(s.streak.count).toBe(1);
    expect(s.streak.freezes).toBe(1);
    // XP: boss points share + first-try +20 + 3 meters >= 70 (+45)
    expect(screen.getByTestId('debrief')).toHaveTextContent('Passed first try');
    expect(screen.getByTestId('debrief')).toHaveTextContent('Meters kept high');
    expect(screen.getByTestId('debrief-continue')).toHaveTextContent("See Maya's story");
    for (const q of boss.questions) expect(s.concepts[q.conceptId]).toBeDefined();
  });

  it('below 60% fails without unlocking the world, keeps the attempt, and offers retry', () => {
    for (let i = 0; i < 4; i++) {
      answer('wrong');
      next();
    }
    for (let i = 4; i < boss.questions.length; i++) {
      answer('right');
      next();
    }
    const s = useProgress.getState();
    expect(s.hearts).toBe(1);
    expect(s.bosses['w1-boss']).toMatchObject({ stars: 0, attempts: 1 });
    expect(s.worldsCompleted).toEqual([]);
    expect(screen.getByTestId('debrief')).toHaveTextContent('You need 60% to pass');
    expect(screen.getByTestId('debrief-retry')).toBeEnabled();
  });

  it('running out of hearts fails immediately', () => {
    for (let i = 0; i < 4; i++) useProgress.getState().loseHeart();
    answer('wrong');
    expect(useProgress.getState().hearts).toBe(0);
    expect(screen.getByTestId('debrief')).toHaveTextContent('Out of hearts');
    expect(useProgress.getState().bosses['w1-boss']).toBeUndefined();
  });
});
