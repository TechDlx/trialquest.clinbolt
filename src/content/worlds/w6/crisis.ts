import type { CrisisBoss } from '../../types';

/** World 6 crisis: interim analysis week. Four rounds, 100 s, pool 115 s. */
export const w6Crisis: CrisisBoss = {
  id: 'w6-crisis',
  worldId: 'w6',
  title: 'Interim week',
  situation: [
    'The DSMB meets Friday. The interim data cut is due Monday, the datasets Wednesday, the closed-session report Thursday night. Every hand-off is a day.',
    'One slip and the board meets without data, and the trial runs three more months blind. Four roles, one week.',
  ],
  rounds: [
    {
      id: 'r-lock',
      roleId: 'database-lock-lead',
      seconds: 25,
      brief:
        "You're the Lock Lead. Monday. Which steps happen before the interim data cut, and which never happen at an interim?",
      meterHit: { integrity: -15 },
      game: {
        engine: 'bucket-sort',
        prompt: 'Before the cut, or never at an interim?',
        seconds: 25,
        buckets: [
          { id: 'before', label: 'Before the cut' },
          { id: 'never', label: 'Never at an interim' },
        ],
        cards: [
          {
            id: 'snapshot',
            text: 'Take a dated snapshot of the cleaned data',
            bucketId: 'before',
            conceptId: 'interim-analysis',
            explanation: 'An interim runs on a frozen, dated snapshot, not the live database.',
            consequence: 'Analysing live data means the board reviews numbers that changed overnight.',
          },
          {
            id: 'sponsor-codes',
            text: 'Send the randomization codes to the sponsor statistician',
            bucketId: 'never',
            conceptId: 'unblinding',
            explanation:
              'Only the independent statistician sees codes at an interim. The sponsor stays blind.',
            consequence: 'Sponsor unblinding at interim can void the trial.',
          },
          {
            id: 'sae-recon',
            text: 'Reconcile serious events between the safety and clinical databases',
            bucketId: 'before',
            conceptId: 'data-cleaning',
            explanation: 'The board judges safety; the serious cases must be complete and consistent.',
            consequence: 'A missing SAE in the interim report is the worst thing a board can discover later.',
          },
        ],
      },
      emits: [
        {
          key: 'local.cut',
          tags: ['clean', 'late'],
          defaultTag: 'late',
          outcomes: [{ tag: 'clean', when: { accuracyAtLeast: 1 } }],
        },
      ],
    },
    {
      id: 'r-prog',
      roleId: 'statistical-programmer',
      seconds: 25,
      brief: "You're the Programmer. Wednesday. Put the interim run in order.",
      meterHit: { integrity: -10 },
      game: {
        engine: 'sequence-sort',
        prompt: 'Order the steps.',
        seconds: 25,
        items: [
          {
            id: 'extract',
            text: 'Extract the dated snapshot',
            conceptId: 'interim-analysis',
            explanation: 'Start from the frozen cut, nothing else.',
            consequence: 'Programming from live data gives the board a moving target.',
          },
          {
            id: 'derive',
            text: 'Derive the analysis datasets per the interim SAP',
            conceptId: 'adam',
            explanation: 'The interim SAP defines exactly which datasets and boundaries apply.',
            consequence: "Deviating from the interim plan makes the board's decision indefensible.",
          },
          {
            id: 'validate',
            text: 'Double-program and reconcile the closed-session tables',
            conceptId: 'double-programming',
            explanation: 'The board decides on these tables. They are checked twice.',
            consequence:
              'A wrong denominator in a closed-session table can stop a trial that should continue.',
          },
        ],
      },
    },
    {
      id: 'r-writer',
      roleId: 'medical-writer',
      seconds: 25,
      brief: "You're the Writer. Thursday night. Which paragraph belongs in the closed-session report?",
      meterHit: { integrity: -10 },
      game: {
        engine: 'spot-the-impostor',
        prompt: 'Which paragraph is written correctly for the board?',
        seconds: 25,
        targetLabel: 'the correct paragraph',
        cards: [
          {
            id: 'para-neutral',
            title: 'Paragraph A',
            lines: [
              'Liver enzyme rises: 4.1% (Arm X) vs 1.2% (Arm Y)',
              'Conditional power 55%; futility boundary 20%',
              'No stopping boundary crossed',
            ],
            impostor: true,
            conceptId: 'interim-analysis',
            explanation: 'Numbers by arm, boundaries stated, no interpretation. This is what a board reads.',
            consequence: 'The board interprets; the report informs.',
          },
          {
            id: 'para-spin',
            title: 'Paragraph B',
            lines: [
              'VX-101 shows an encouraging trend toward benefit',
              'Liver findings are likely not clinically meaningful',
            ],
            conceptId: 'benefit-risk',
            explanation: "Interpretation and reassurance are the sponsor's hopes, not the board's data.",
            consequence: "Editorialising in a closed-session report compromises the board's independence.",
          },
          {
            id: 'para-blind',
            title: 'Paragraph C',
            lines: [
              'Overall liver enzyme rises: 2.6%',
              'Overall response: 43%',
              'Arms pooled to protect the blind',
            ],
            conceptId: 'unblinding',
            explanation: 'The closed session exists to see arms. Pooled data tell the board nothing.',
            consequence: 'A board that cannot see arms cannot do its job.',
          },
        ],
      },
    },
    {
      id: 'r-dsmb',
      roleId: 'dsmb-member',
      seconds: 25,
      brief: "You're on the DSMB. Friday. The report is in front of you. Decide.",
      meterHit: { safety: -15 },
      game: {
        engine: 'branching-scenario',
        start: 'n-vote',
        nodes: [
          {
            id: 'n-vote',
            speaker: 'DSMB chair',
            text: 'No boundary crossed. A liver imbalance worth watching. The sponsor is waiting outside for one word.',
            choices: [
              {
                id: 'c-continue',
                text: 'Continue as planned, with enhanced liver monitoring',
                quality: 'best',
                next: 'end-continue',
                conceptId: 'dsmb',
                explanation:
                  'The charter says continue when no boundary is crossed. The monitoring change is the modification the data justify.',
                consequence: 'A clear, charter-based decision is what protects patients and the trial.',
              },
              {
                id: 'c-leak',
                text: 'Continue, and reassure the sponsor that the efficacy trend looks good',
                quality: 'bad',
                next: 'end-leak',
                meters: { integrity: -20 },
                conceptId: 'unblinding',
                explanation:
                  '"Looks good" is unblinded information. One sentence and the sponsor is no longer blind.',
                consequence:
                  'A reassuring word from the board is an unblinding event with regulatory consequences.',
              },
              {
                id: 'c-delay',
                text: 'Defer the decision a month for more data',
                quality: 'ok',
                next: 'end-continue',
                meters: { timeline: -10 },
                conceptId: 'interim-analysis',
                explanation:
                  'Deferral is allowed but costly, and the charter gave you enough to decide today.',
                consequence: 'Unnecessary deferrals delay decisions the patients are waiting on.',
              },
            ],
          },
          {
            id: 'end-continue',
            text: 'The letter goes out: continue as planned, with enhanced liver monitoring. The sponsor learns nothing else.',
            end: { summary: 'One word to the sponsor. The rest stays in the room.' },
          },
          {
            id: 'end-leak',
            text: 'The sponsor\'s statistician hears "looks good" and understands. Two weeks later, a press release hints at it. The regulator asks how they knew.',
            end: { summary: "The board's only job was to keep that sentence inside the room." },
          },
        ],
      },
      variants: [
        {
          when: { 'local.cut': 'late' },
          patch: {
            brief:
              "You're on the DSMB. Friday. The data cut slipped, so the report arrived an hour ago, with a reconciliation note attached. Decide anyway.",
            meterHit: { safety: -20 },
          },
        },
      ],
    },
  ],
  resolution: {
    success: {
      id: 'w6-crisis-success',
      title: 'Friday, 4 pm',
      paragraphs: [
        'The cut was clean, the run was validated, the report was neutral, and the board said one word to the sponsor.',
        'The trial continues, with closer liver monitoring. Nobody outside the closed session knows anything else, which is the point.',
      ],
      mayaStatus: 'Continuing her extension visits.',
    },
    partial: {
      id: 'w6-crisis-partial',
      title: 'A rough week',
      paragraphs: [
        'The board met and decided, but the path there had gaps that will show up in the minutes.',
        'Have another go: every round is one hand-off on one day.',
      ],
      mayaStatus: 'Continuing her extension visits.',
    },
    fail: {
      id: 'w6-crisis-fail',
      title: 'Blind no more',
      paragraphs: [
        'The cut was late, the tables were unchecked, the report editorialised and the board reassured the sponsor. The trial is compromised in the way that cannot be fixed.',
        'The regulator will decide how much of the study still counts.',
      ],
      mayaStatus: 'Read that the trial had "an irregularity".',
    },
  },
};
