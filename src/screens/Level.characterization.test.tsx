/**
 * Characterization tests: capture the CURRENT behaviour of the Level screen's result
 * handling (hearts, meters, setbacks, XP, records, spaced repetition) before the logic is
 * extracted into src/engine/pipeline.ts. These must keep passing unchanged after the refactor.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LevelScreen } from './Level';
import { content } from '@/content';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

function questionsFor(levelId: string) {
  const level = content.levelById[levelId]!;
  return level.game.questions;
}

function answer(kind: 'right' | 'wrong') {
  const prompt = screen.getByTestId('quiz-prompt').textContent!.trim();
  const q = content.levels.flatMap((l) => l.game.questions).find((x) => x.prompt === prompt)!;
  const correct = q.options.find((o) => o.correct)!.text;
  const options = screen.getAllByTestId('quiz-option');
  const target = options.find((el) => {
    const label = el.getAttribute('aria-label') ?? '';
    return kind === 'right' ? label.endsWith(`: ${correct}`) : !label.endsWith(`: ${correct}`);
  })!;
  fireEvent.click(target);
}

function next() {
  fireEvent.click(screen.getByTestId('quiz-next'));
}

function startLevel(levelId: string) {
  const level = content.levelById[levelId]!;
  useProgress.getState().markCardViewed(level.roleId);
  render(<LevelScreen levelId={levelId} />);
  fireEvent.click(screen.getByTestId('start-level'));
}

beforeEach(() => {
  useProgress.getState().resetProgress();
  useSettings.getState().resetSettings();
  useSettings.getState().setRelaxed(true); // no timers; "Next" always shown
  window.location.hash = '';
});

describe('Level screen result pipeline (current behaviour)', () => {
  it('first mistake in World 1 is free; the second costs a heart and hits the focus meter', () => {
    startLevel('w1-l1'); // meterFocus: safety
    answer('wrong');
    expect(screen.getByTestId('quiz-feedback')).toHaveTextContent('First slip in World 1 is free');
    expect(useProgress.getState().hearts).toBe(5);
    expect(useProgress.getState().meters.safety).toBe(100);
    next();
    answer('wrong');
    expect(useProgress.getState().hearts).toBe(4);
    expect(useProgress.getState().meters.safety).toBe(95);
    expect(useProgress.getState().meters.integrity).toBe(100);
    expect(useProgress.getState().heartsUpdatedAt).not.toBeNull();
  });

  it('a level without meterFocus damages data integrity by 3', () => {
    startLevel('w1-l2');
    answer('wrong');
    next();
    answer('wrong');
    expect(useProgress.getState().meters.integrity).toBe(97);
    expect(useProgress.getState().meters.safety).toBe(100);
  });

  it('completing a level records stars, score, XP, streak and per-concept outcomes', () => {
    startLevel('w1-l1');
    const qs = questionsFor('w1-l1');
    answer('wrong');
    next();
    answer('wrong');
    next();
    for (let i = 2; i < qs.length; i++) {
      answer('right');
      next();
    }
    expect(screen.getByTestId('debrief')).toBeInTheDocument();
    // accuracy 4/6, relaxed speed 0.5 -> score round(80*0.6667 + 10) = 63 -> 1 star
    expect(screen.getByTestId('debrief-score')).toHaveTextContent('4 of 6 correct · score 63');
    const s = useProgress.getState();
    expect(s.levels['w1-l1']).toMatchObject({ stars: 1, bestScore: 63, attempts: 1 });
    expect(s.levels['w1-l1']!.completedAt).toBeTruthy();
    // 1 star = 15 XP, first completion +10, not perfect; +5 from the card view.
    expect(s.xp).toBe(5 + 15 + 10);
    expect(screen.getByTestId('debrief-xp')).toHaveTextContent('+25 XP');
    expect(s.streak.count).toBe(1);
    const missed = [qs[0]!.conceptId, qs[1]!.conceptId];
    for (const q of qs) {
      const rec = s.concepts[q.conceptId]!;
      expect(rec, q.conceptId).toBeDefined();
      if (missed.includes(q.conceptId)) expect(rec).toMatchObject({ box: 1, misses: 1 });
      else expect(rec).toMatchObject({ box: 2, misses: 0 });
    }
    expect(screen.getByTestId('debrief-continue')).toHaveTextContent('Continue');
  });

  it('a perfect run earns the perfect bonus and 3 stars', () => {
    startLevel('w1-l4');
    for (let i = 0; i < questionsFor('w1-l4').length; i++) {
      answer('right');
      next();
    }
    expect(screen.getByTestId('debrief-score')).toHaveTextContent('6 of 6 correct · score 90');
    expect(useProgress.getState().levels['w1-l4']).toMatchObject({ stars: 3, bestScore: 90 });
    expect(useProgress.getState().xp).toBe(5 + 45 + 10 + 10);
    expect(screen.getByTestId('debrief-continue')).toHaveTextContent('Continue to the boss quiz');
  });

  it('running out of hearts fails the level immediately and disables retry', () => {
    for (let i = 0; i < 4; i++) useProgress.getState().loseHeart();
    startLevel('w1-l2');
    answer('wrong'); // free
    next();
    answer('wrong'); // hearts 1 -> 0
    expect(useProgress.getState().hearts).toBe(0);
    expect(screen.getByTestId('debrief')).toHaveTextContent('Out of hearts');
    expect(screen.getByTestId('debrief-retry')).toBeDisabled();
    expect(useProgress.getState().levels['w1-l2']).toBeUndefined();
  });

  it('a meter reaching zero triggers a setback, resets the meter to 40 and fails the level', () => {
    useProgress.getState().applyMeter('safety', -95); // 5 left; the level start raises it to >= 60
    useProgress.getState().startWorld('w1'); // consume the one-time raise first
    useProgress.getState().applyMeter('safety', -95); // now 5 and it stays 5
    startLevel('w1-l1');
    answer('wrong'); // free
    next();
    answer('wrong'); // -5 -> 0
    expect(screen.getByTestId('debrief')).toHaveTextContent('Clinical hold');
    expect(useProgress.getState().meters.safety).toBe(40);
    expect(useProgress.getState().hearts).toBe(4);
  });

  it('a second attempt keeps the best result and does not re-award the first-completion bonus', () => {
    useProgress.getState().recordLevelResult('w1-l4', { stars: 3, score: 90, xp: { total: 65, lines: [] } });
    startLevel('w1-l4');
    answer('wrong');
    next();
    for (let i = 1; i < 6; i++) {
      answer('right');
      next();
    }
    const rec = useProgress.getState().levels['w1-l4']!;
    expect(rec.stars).toBe(3);
    expect(rec.bestScore).toBe(90);
    expect(rec.attempts).toBe(2);
    // 5/6 -> score 77 -> 2 stars -> 30 XP, no first-time bonus, not perfect
    expect(useProgress.getState().xp).toBe(65 + 5 + 30);
  });
});
