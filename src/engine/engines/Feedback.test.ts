import { afterEach, describe, expect, it } from 'vitest';
import { AUTO_ADVANCE_MS, adaptFeedback, feedbackTiming, firstSentence } from './Feedback';

const saved = feedbackTiming.perCharMs;
afterEach(() => {
  feedbackTiming.perCharMs = saved;
});

describe('right-answer reinforcement', () => {
  it('keeps the confirmation and adds the first sentence of the reason', () => {
    const shown = adaptFeedback('level', {
      kind: 'correct',
      title: 'Correct!',
      confirm: 'Yes: measure what patients actually feel.',
      explanation: 'A patient-reported outcome captures how people feel. Clinicians cannot see fatigue.',
    })!;
    expect(shown.inline).toBe(true);
    expect(shown.auto).toBe(true);
    expect(shown.title).toBe('Yes: measure what patients actually feel.');
    expect(shown.explanation).toBe('A patient-reported outcome captures how people feel.');
  });

  it('stays up longer for a longer reason, within the cap', () => {
    feedbackTiming.perCharMs = 25;
    const short = adaptFeedback('level', { kind: 'correct', title: 'Yes', explanation: 'Short one.' })!;
    const long = adaptFeedback('level', {
      kind: 'correct',
      title: 'Yes',
      explanation: 'x'.repeat(400) + '.',
    })!;
    expect(short.ms).toBeGreaterThan(AUTO_ADVANCE_MS);
    expect(long.ms).toBe(feedbackTiming.maxMs);
  });

  it('drops a reason that only repeats the confirmation, and crisis rounds stay a flash', () => {
    const same = adaptFeedback('level', {
      kind: 'correct',
      title: 'That is the hit',
      confirm: 'That is the hit: potent, selective, reproducible, clean.',
      explanation: 'Potent, selective, reproducible and clean.',
    })!;
    expect(same.explanation).toBe('');
    const crisis = adaptFeedback('crisis', { kind: 'correct', title: 'Yes', explanation: 'Because.' })!;
    expect(crisis.explanation).toBe('');
  });

  it('cuts at the first sentence end, not at decimals or markup', () => {
    expect(firstSentence('Start at 4.8 mg/kg divided by 10. Then escalate.')).toBe(
      'Start at 4.8 mg/kg divided by 10.',
    );
    expect(firstSentence('An [[ind|IND]] opens the door! Then trials.')).toBe(
      'An [[ind|IND]] opens the door!',
    );
  });
});
