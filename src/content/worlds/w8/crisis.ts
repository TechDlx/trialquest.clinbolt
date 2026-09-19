import type { CrisisBoss } from '../../types';

/** World 8 crisis: a post-market signal becomes public. Four rounds, 100 s, pool 115 s. */
export const w8Crisis: CrisisBoss = {
  id: 'w8-crisis',
  worldId: 'w8',
  title: 'The pancreatitis story',
  situation: [
    'A newspaper runs a story: "VX-101 linked to pancreatitis". The same morning, a competitor reports one of your reps for an off-label claim, and a specialist asks an MSL on camera whether the drug is safe.',
    'Pull the claim, brief the field, confirm the signal, update the label. Four roles, one day.',
  ],
  rounds: [
    {
      id: 'r-brand',
      roleId: 'brand-marketing-manager',
      seconds: 25,
      brief: "You're the Brand Manager. Three pieces are live. Which one comes down now?",
      meterHit: { integrity: -15 },
      game: {
        engine: 'spot-the-impostor',
        prompt: 'Which piece must be withdrawn today?',
        seconds: 25,
        targetLabel: 'the piece to withdraw',
        cards: [
          {
            id: 'piece-web',
            title: 'Website',
            lines: [
              'Approved indication and efficacy claim',
              'Boxed warning above the fold',
              'Reviewed last month',
            ],
            conceptId: 'fair-balance',
            explanation: 'On-label, balanced, reviewed. It stays, pending the label update.',
            consequence: 'Pulling compliant material in a panic signals guilt where there is none.',
          },
          {
            id: 'piece-detail',
            title: 'Detail aid, version 3',
            lines: [
              'Rep-added slide: "well tolerated with no serious concerns"',
              'Not reviewed',
              'In use at 40 clinics',
            ],
            impostor: true,
            conceptId: 'promotional-review',
            explanation:
              'An unreviewed slide claiming no serious concerns, on the day a signal goes public. Withdraw it now.',
            consequence:
              "Unreviewed claims that contradict emerging safety data are the regulator's first exhibit.",
          },
          {
            id: 'piece-leaflet',
            title: 'Patient leaflet',
            lines: [
              'Mirrors the approved label',
              'Lists liver monitoring',
              'Will need an update when the label changes',
            ],
            conceptId: 'prescribing-information',
            explanation: 'Accurate to the current label. It updates when the label does, not before.',
            consequence: 'Changing patient materials ahead of the label creates inconsistency.',
          },
        ],
      },
      emits: [
        {
          key: 'local.claim',
          tags: ['pulled', 'live'],
          defaultTag: 'live',
          outcomes: [{ tag: 'pulled', when: { accused: 'piece-detail' } }],
        },
      ],
    },
    {
      id: 'r-msl',
      roleId: 'medical-science-liaison',
      seconds: 25,
      brief: "You're the MSL. The specialist asks, on camera: is VX-101 safe? Answer.",
      meterHit: { integrity: -10 },
      game: {
        engine: 'branching-scenario',
        start: 'n-camera',
        nodes: [
          {
            id: 'n-camera',
            speaker: 'Specialist',
            text: 'Is it safe? Yes or no.',
            choices: [
              {
                id: 'c-honest',
                text: 'Explain the signal is being assessed, known risks are in the label, and updates will follow',
                quality: 'best',
                next: 'end-honest',
                conceptId: 'non-promotional',
                explanation:
                  'Neither denial nor panic: what is known, what is being assessed, where the facts will appear.',
                consequence: 'Honest uncertainty keeps trust; false certainty destroys it.',
              },
              {
                id: 'c-deny',
                text: 'Say the drug is completely safe and the story is wrong',
                quality: 'bad',
                next: 'end-deny',
                meters: { integrity: -20 },
                conceptId: 'signal-detection',
                explanation:
                  'The signal is real and under assessment. "Completely safe" is a promotional claim, on camera.',
                consequence: 'A denial that the label later contradicts is replayed forever.',
              },
              {
                id: 'c-nothing',
                text: 'Say you cannot comment on anything',
                quality: 'ok',
                next: 'end-honest',
                meters: { integrity: -5 },
                conceptId: 'medical-information',
                explanation:
                  'Safe, but the label is public information you may share. Silence reads as hiding.',
                consequence: 'Refusing to state public facts leaves the story to the newspaper.',
              },
            ],
          },
          {
            id: 'end-honest',
            text: 'The clip runs. It sounds like a scientist: what is known, what is being checked, where to look.',
            end: {
              summary: 'Say what is known, say what is being assessed, say where the answer will appear.',
            },
          },
          {
            id: 'end-deny',
            text: 'The clip runs. Six weeks later the label adds pancreatitis, and the clip runs again.',
            end: { summary: 'Never promise safety the evidence has not proved.' },
          },
        ],
      },
    },
    {
      id: 'r-signal',
      roleId: 'signal-detection-scientist',
      seconds: 25,
      brief: "You're Signal Detection. The regulator wants the assessment today. Which evidence goes in?",
      meterHit: { safety: -15 },
      game: {
        engine: 'bucket-sort',
        prompt: 'Include in the signal assessment, or leave out?',
        seconds: 25,
        buckets: [
          { id: 'include', label: 'Include' },
          { id: 'exclude', label: 'Leave out' },
        ],
        cards: [
          {
            id: 'ev-disprop',
            text: 'Nine reports versus one expected; disproportionality score above threshold',
            bucketId: 'include',
            conceptId: 'disproportionality',
            explanation: 'The statistical core of the signal.',
            consequence: 'Without the numbers, the assessment is an opinion.',
          },
          {
            id: 'ev-rechallenge',
            text: 'Two patients whose pancreatitis recurred on restarting the drug',
            bucketId: 'include',
            conceptId: 'causality',
            explanation: 'Positive rechallenge is the strongest single piece of causality evidence.',
            consequence: 'Leaving out rechallenge cases understates a real risk.',
          },
          {
            id: 'ev-press',
            text: 'The newspaper article',
            bucketId: 'exclude',
            conceptId: 'signal-detection',
            explanation: 'Not evidence. The cases behind it are already in the database.',
            consequence: 'Citing press coverage as evidence undermines the assessment.',
          },
          {
            id: 'ev-trials',
            text: 'Trial data: zero cases in 1,400 patients, consistent with a rare event',
            bucketId: 'include',
            conceptId: 'signal-detection',
            explanation: 'Context matters: zero in 1,400 does not rule out one in 10,000.',
            consequence: 'Omitting the trial context invites the question of why the trials missed it.',
          },
        ],
      },
    },
    {
      id: 'r-label',
      roleId: 'rwe-lead',
      seconds: 25,
      brief:
        "You're the RWE Lead. The regulator confirms the signal. What does the company commit to, in order?",
      meterHit: { safety: -10, timeline: -5 },
      game: {
        engine: 'sequence-sort',
        prompt: 'Order the response.',
        seconds: 25,
        items: [
          {
            id: 'dhcp',
            text: 'Send a letter to every prescriber describing the new risk and what to do',
            conceptId: 'label-update',
            explanation: 'Doctors hear first, directly, before the label text catches up.',
            consequence: 'Prescribers who learn of a risk from the news lose trust in the company.',
          },
          {
            id: 'label',
            text: 'Update the label: warning, symptoms to watch, when to stop',
            conceptId: 'label-update',
            explanation: 'The [[label-update|label update]] makes the risk permanent and official.',
            consequence: 'A risk not in the label is a risk the next doctor never sees.',
          },
          {
            id: 'study',
            text: 'Start the post-approval study to quantify the risk and find who is most at risk',
            conceptId: 'phase-4',
            explanation:
              'The study answers how big the risk is and for whom, so the label can get more precise.',
            consequence: 'Without the study, the warning stays vague forever.',
          },
        ],
      },
      variants: [
        {
          when: { 'local.claim': 'live' },
          patch: {
            brief:
              "You're the RWE Lead. The regulator confirms the signal, and has seen the rep's 'no serious concerns' slide. What does the company commit to, in order?",
            meterHit: { safety: -15, timeline: -10 },
          },
        },
      ],
    },
  ],
  resolution: {
    success: {
      id: 'w8-crisis-success',
      title: 'Handled in daylight',
      paragraphs: [
        'The unreviewed slide came down in an hour, the MSL told the truth on camera, the assessment reached the regulator with the evidence that mattered, and prescribers heard from the company before the label changed.',
        'The signal was real. The response was too. That is the whole of pharmacovigilance.',
      ],
      mayaStatus: 'Read the letter her doctor forwarded. Kept taking her medicine.',
    },
    partial: {
      id: 'w8-crisis-partial',
      title: 'A long day',
      paragraphs: [
        "Most of it was handled. The parts that were not will appear in the regulator's assessment of the company, not just the drug.",
        'Have another go: each round is one role on the morning the story broke.',
      ],
      mayaStatus: 'Worried. Called her doctor.',
    },
    fail: {
      id: 'w8-crisis-fail',
      title: 'The cover-up story',
      paragraphs: [
        'The slide stayed up, the MSL denied on camera, the assessment cited the newspaper, and prescribers learned of the risk from the label change.',
        'The second newspaper story is not about pancreatitis. It is about the company.',
      ],
      mayaStatus: 'Stopped taking her medicine. Nobody told her not to.',
    },
  },
};
