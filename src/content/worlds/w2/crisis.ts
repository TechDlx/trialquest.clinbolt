import type { CrisisBoss } from '../../types';

/** World 2 crisis: the regulator sends the filing back with questions. Four rounds, 100 s, pool 115 s. */
export const w2Crisis: CrisisBoss = {
  id: 'w2-crisis',
  worldId: 'w2',
  title: 'Day 29: the letter',
  situation: [
    'One day before the 30-day clock runs out, the regulator writes back. The study may not start: the primary endpoint is unclear, the sample size is not justified, and the ethics committee has a question of its own.',
    'You have one week to answer everything or the programme slips a quarter. Every World 2 role has one thing to fix.',
  ],
  rounds: [
    {
      id: 'r-sci',
      roleId: 'clinical-scientist',
      seconds: 25,
      brief: "You're the Medical Director. The reviewer says the endpoint is vague. Replace it.",
      meterHit: { integrity: -10 },
      game: {
        engine: 'builder',
        prompt: 'Rebuild the endpoint section.',
        seconds: 25,
        slots: [
          { id: 'primary', label: 'Primary endpoint' },
          { id: 'window', label: 'Time window' },
        ],
        parts: [
          {
            id: 'ae-graded',
            text: 'Adverse events, graded by severity',
            slotId: 'primary',
            conceptId: 'primary-endpoint',
            explanation: 'Graded, countable, pre-specified. A reviewer can check it.',
            consequence: 'Vague endpoints get studies sent back, or worse, approved and then argued over.',
          },
          {
            id: 'tolerated',
            text: 'Whether the drug is "well tolerated"',
            conceptId: 'primary-endpoint',
            explanation: '"Well tolerated" is an opinion, not a measurement.',
            consequence: 'Opinion endpoints let a sponsor call any result a success.',
          },
          {
            id: 'day28',
            text: 'Through day 28 after dosing',
            slotId: 'window',
            conceptId: 'phase-1',
            explanation: 'A fixed window means every volunteer is followed the same way.',
            consequence: 'Without a window, late effects are simply never collected.',
          },
          {
            id: 'until-fine',
            text: 'Until the volunteer feels fine',
            conceptId: 'phase-1',
            explanation: 'Follow-up cannot depend on how someone feels; it must be fixed in advance.',
            consequence: 'Variable follow-up hides the very events the study exists to find.',
          },
        ],
      },
      emits: [
        {
          key: 'local.endpoint',
          tags: ['fixed', 'unfixed'],
          defaultTag: 'unfixed',
          outcomes: [{ tag: 'fixed', when: { chosePart: { slotId: 'primary', partId: 'ae-graded' } } }],
        },
      ],
    },
    {
      id: 'r-stat',
      roleId: 'biostatistician',
      seconds: 30,
      brief:
        "You're the Biostatistician. Justify the number: which statements belong in the sample size section?",
      meterHit: { integrity: -10 },
      game: {
        engine: 'bucket-sort',
        prompt: 'Does each statement belong in the sample size justification?',
        seconds: 30,
        buckets: [
          { id: 'include', label: 'Include' },
          { id: 'exclude', label: 'Leave out' },
        ],
        cards: [
          {
            id: 'effect',
            text: 'The expected effect size and where it comes from',
            bucketId: 'include',
            conceptId: 'sample-size',
            explanation:
              'The whole calculation rests on the effect you expect. Reviewers check its source first.',
            consequence: 'An effect size pulled from the air is the classic reason a design is rejected.',
          },
          {
            id: 'power',
            text: 'The power and the false-positive rate used',
            bucketId: 'include',
            conceptId: 'statistical-power',
            explanation: 'Power and alpha are the two dials. State them and anyone can reproduce the number.',
            consequence: 'Unstated assumptions make the number unverifiable.',
          },
          {
            id: 'budget',
            text: 'The number the budget can afford',
            bucketId: 'exclude',
            conceptId: 'sample-size',
            explanation:
              'Budget is real, but it is not a statistical justification. Reviewers see through it instantly.',
            consequence: 'Sizing a study to the budget is how underpowered trials get written.',
          },
          {
            id: 'dropout',
            text: 'The dropout rate assumed and the inflation for it',
            bucketId: 'include',
            conceptId: 'sample-size',
            explanation: 'People leave studies. The plan must say how many, and add patients to cover it.',
            consequence: 'Ignoring dropout leaves the final analysis short of the patients it needs.',
          },
        ],
      },
    },
    {
      id: 'r-irb',
      roleId: 'irb-member',
      seconds: 25,
      brief:
        "You're on the Ethics Committee. The sponsor rewrote one sentence. Which version goes to volunteers?",
      meterHit: { safety: -10 },
      game: {
        engine: 'spot-the-impostor',
        prompt: 'Which sentence is honest enough to sign?',
        seconds: 25,
        targetLabel: 'the honest sentence',
        cards: [
          {
            id: 'v-honest',
            title: 'Version A',
            lines: [
              'You will not benefit medically from this study.',
              'What we learn may help future patients.',
            ],
            impostor: true,
            conceptId: 'therapeutic-misconception',
            explanation: 'No benefit promised, the real purpose stated. This is the sentence.',
            consequence: 'Anything softer invites volunteers to expect treatment.',
          },
          {
            id: 'v-may',
            title: 'Version B',
            lines: [
              'You may benefit from early access to VX-101.',
              'What we learn may help future patients.',
            ],
            conceptId: 'therapeutic-misconception',
            explanation:
              '"May benefit" implies a treatment. Healthy volunteers cannot benefit from a safety study.',
            consequence: 'Implied benefit is the most common consent finding in inspections.',
          },
          {
            id: 'v-legal',
            title: 'Version C',
            lines: [
              'Participation confers no therapeutic entitlement.',
              'Data may inform subsequent development.',
            ],
            conceptId: 'informed-consent',
            explanation: 'True, and unreadable. Consent must be understood, not just signed.',
            consequence: 'Consent forms above an 8th-grade level are routinely sent back by committees.',
          },
        ],
      },
    },
    {
      id: 'r-fin',
      roleId: 'portfolio-lead',
      seconds: 20,
      brief: "You're the Portfolio Lead. The quarter slipped. Re-cut $10M so the answers can be written.",
      meterHit: { timeline: -10 },
      game: {
        engine: 'allocator',
        prompt: 'Split $10M between answering the letter and keeping the study alive.',
        seconds: 20,
        total: 10,
        context: ['Answering the letter (writing and analysis): $2–4M', 'Keeping sites and drug ready: $6–8M'],
        categories: [
          {
            id: 'response',
            label: 'Regulatory response work',
            unit: '$M',
            min: 0,
            max: 10,
            step: 1,
            initial: 5,
            target: [2, 4],
            conceptId: 'ind',
            explanation: 'Answering the letter is writing and analysis: a few million, not half the budget.',
            consequence: 'Overspending on paperwork drains the study it is meant to unblock.',
          },
          {
            id: 'hold-sites',
            label: 'Keep sites and drug ready',
            unit: '$M',
            min: 0,
            max: 10,
            step: 1,
            initial: 5,
            target: [6, 8],
            conceptId: 'go-no-go',
            explanation:
              'Sites and supplies cost money to hold. Lose them and restarting takes longer than the letter did.',
            consequence: 'Programmes that let sites go during a delay often lose a year getting them back.',
          },
        ],
      },
      variants: [
        {
          when: { 'local.endpoint': 'unfixed' },
          patch: {
            brief:
              "You're the Portfolio Lead. The endpoint is still vague, so the response will take longer. Re-cut $10M anyway.",
            meterHit: { timeline: -15 },
          },
        },
      ],
    },
  ],
  resolution: {
    success: {
      id: 'w2-crisis-success',
      title: 'Answered in a week',
      paragraphs: [
        'The endpoint is countable, the number is justified, the consent form tells the truth, and the sites are still waiting. The regulator lifts its objection.',
        'A quarter nearly lost; a week actually spent. That is what a good design team looks like under pressure.',
      ],
      mayaStatus: 'Read that the trial can start. Told her sister.',
    },
    partial: {
      id: 'w2-crisis-partial',
      title: 'Half answered',
      paragraphs: [
        'Some questions are answered, some will come back in a second letter. The study starts late, and the reviewer remembers.',
        "Have another go. Each round is one role's job done properly.",
      ],
      mayaStatus: 'Waiting. Again.',
    },
    fail: {
      id: 'w2-crisis-fail',
      title: 'The quarter slips',
      paragraphs: [
        'The response is late and thin. The study is put on hold before it starts, the sites move on, and the money goes elsewhere.',
        'This is how well-designed programmes die: not in the lab, but in a letter nobody answered properly.',
      ],
      mayaStatus: 'Stopped checking the news.',
    },
  },
};
