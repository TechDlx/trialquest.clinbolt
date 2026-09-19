import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QuizBlitz, type MistakeFeedback } from './QuizBlitz';
import type { QuizQuestion } from '@/content/types';
import type { Mistake } from '@/engine/scoring';

const questions: QuizQuestion[] = [
  {
    id: 'q1',
    conceptId: 'target',
    prompt: 'What is a target?',
    options: [
      { text: 'Right', correct: true },
      { text: 'Wrong A' },
      { text: 'Wrong B' },
      { text: 'Wrong C' },
    ],
    explanation: 'Because.',
    consequence: 'Bad things.',
  },
  {
    id: 'q2',
    conceptId: 'hit',
    prompt: 'What is a hit?',
    options: [{ text: 'Right 2', correct: true }, { text: 'Nope' }, { text: 'Nah' }, { text: 'No' }],
    explanation: 'Because 2.',
    consequence: 'Worse things.',
  },
];

function clickOption(text: string) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`: ${text}$`) }));
}

describe('QuizBlitz', () => {
  it('reports mistakes with explanations and completes with accuracy', async () => {
    const onMistake = vi.fn((_m: Mistake): MistakeFeedback => ({ heartLost: true }));
    const onComplete = vi.fn();
    render(
      <QuizBlitz
        questions={questions}
        secondsPerQuestion={20}
        relaxed
        onMistake={onMistake}
        onComplete={onComplete}
        shuffle={false}
      />,
    );
    expect(screen.getByTestId('quiz-progress')).toHaveTextContent('Question 1 of 2');

    clickOption('Wrong A');
    expect(onMistake).toHaveBeenCalledTimes(1);
    expect(onMistake.mock.calls[0]![0]).toMatchObject({
      conceptId: 'target',
      chosen: 'Wrong A',
      correctAnswer: 'Right',
    });
    expect(screen.getByTestId('quiz-feedback')).toHaveTextContent('Not quite.');
    expect(screen.getByTestId('quiz-feedback')).toHaveTextContent('Because.');

    fireEvent.click(screen.getByTestId('quiz-next'));
    expect(screen.getByTestId('quiz-progress')).toHaveTextContent('Question 2 of 2');

    clickOption('Right 2');
    expect(screen.getByTestId('quiz-feedback')).toHaveTextContent('Correct!');
    fireEvent.click(screen.getByTestId('quiz-next'));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0]![0];
    expect(result.correct).toBe(1);
    expect(result.total).toBe(2);
    expect(result.accuracy).toBe(0.5);
    expect(result.speed).toBe(0.5);
    expect(result.heartsLost).toBe(1);
    expect(result.mistakes).toHaveLength(1);
  });

  it('answers with number keys and auto-advances after a correct timed answer', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(
      <QuizBlitz
        questions={questions}
        secondsPerQuestion={20}
        relaxed={false}
        onMistake={() => ({ heartLost: true })}
        onComplete={onComplete}
        shuffle={false}
      />,
    );
    fireEvent.keyDown(window, { key: '1' });
    expect(screen.getByTestId('quiz-feedback')).toHaveTextContent('Correct!');
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(screen.getByTestId('quiz-progress')).toHaveTextContent('Question 2 of 2');
    vi.useRealTimers();
  });

  it('counts a timeout as a mistake', () => {
    vi.useFakeTimers();
    const onMistake = vi.fn(() => ({ heartLost: true }));
    render(
      <QuizBlitz
        questions={[questions[0]!]}
        secondsPerQuestion={2}
        relaxed={false}
        onMistake={onMistake}
        onComplete={() => {}}
        shuffle={false}
      />,
    );
    act(() => {
      vi.advanceTimersByTime(3500); // engine clamps timers to a 3-second minimum
    });
    expect(onMistake).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('quiz-feedback')).toHaveTextContent('Time ran out.');
    vi.useRealTimers();
  });
});
