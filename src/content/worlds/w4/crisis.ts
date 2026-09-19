import type { CrisisBoss } from '../../types';

/** World 4 crisis: a liver enzyme spike in cohort 3. Four rounds, 100 s, pool 115 s. */
export const w4Crisis: CrisisBoss = {
  id: 'w4-crisis',
  worldId: 'w4',
  title: 'Cohort 3, day 4',
  situation: [
    "Day-4 labs are back for cohort 3. One volunteer's ALT is climbing: four times the upper limit and rising. He feels fine. The next cohort is scheduled for Monday.",
    'Screen, manage the visit, read the PK, and decide. Four roles, one afternoon.',
  ],
  rounds: [
    {
      id: 'r-pi',
      roleId: 'principal-investigator',
      seconds: 25,
      brief: "You're the Investigator. Cohort 3 is in the unit. What happens to each volunteer today?",
      meterHit: { safety: -10 },
      game: {
        engine: 'bucket-sort',
        prompt: 'Decide for each volunteer.',
        seconds: 25,
        buckets: [
          { id: 'repeat', label: 'Repeat labs today' },
          { id: 'specialist', label: 'Refer to a liver specialist' },
          { id: 'home', label: 'Send home as planned' },
        ],
        cards: [
          {
            id: 'rising',
            text: 'The volunteer with ALT at 4× and rising',
            bucketId: 'specialist',
            conceptId: 'alt',
            explanation: 'Rising, not just raised. He needs a specialist and daily labs, today.',
            consequence: 'Waiting to see is how a liver signal becomes liver injury.',
          },
          {
            id: 'mild',
            text: 'A volunteer with ALT at 1.5×, stable since day 2',
            bucketId: 'repeat',
            conceptId: 'alt',
            explanation: 'Mild and stable still needs a repeat before anyone goes home.',
            consequence: 'A repeat today tells you whether it is one case or two.',
          },
          {
            id: 'normal',
            text: 'A volunteer with normal labs and no symptoms',
            bucketId: 'repeat',
            conceptId: 'stopping-rule',
            explanation: 'The cohort has a signal. Everyone gets a repeat today, normal or not.',
            consequence: 'Sending the cohort home untested leaves the picture incomplete.',
          },
        ],
      },
      emits: [
        {
          key: 'local.spike',
          tags: ['caught', 'missed'],
          defaultTag: 'missed',
          outcomes: [{ tag: 'caught', when: { bucketOf: { itemId: 'rising', bucketId: 'specialist' } } }],
        },
      ],
    },
    {
      id: 'r-crc',
      roleId: 'study-coordinator',
      seconds: 25,
      brief: "You're the Coordinator. The volunteer is in front of you. Put this afternoon in order.",
      meterHit: { integrity: -10 },
      game: {
        engine: 'sequence-sort',
        prompt: 'Order the steps.',
        seconds: 25,
        items: [
          {
            id: 'tell-pi',
            text: 'Tell the investigator the lab result now',
            conceptId: 'adverse-event',
            explanation: 'The investigator decides. Nothing else happens until they know.',
            consequence: 'A coordinator who acts alone leaves the doctor out of a medical decision.',
          },
          {
            id: 'record',
            text: 'Record the event with onset, values and actions taken',
            conceptId: 'source-document',
            explanation: 'Documented as it happens, in the source, before memory drifts.',
            consequence: 'Events reconstructed later are the ones inspectors distrust.',
          },
          {
            id: 'draw',
            text: 'Draw the repeat labs the investigator ordered',
            conceptId: 'pk-sampling',
            explanation: 'The repeat comes after the order, not before it.',
            consequence: 'Samples without an order are samples without a reason.',
          },
        ],
      },
    },
    {
      id: 'r-pk',
      roleId: 'clinical-pharmacologist',
      seconds: 25,
      brief: "You're the Pharmacologist. Which PK reading explains what happened?",
      meterHit: { safety: -10 },
      game: {
        engine: 'spot-the-impostor',
        prompt: 'Which reading fits the rising ALT?',
        seconds: 25,
        targetLabel: 'the reading that fits',
        cards: [
          {
            id: 'high-exposure',
            title: 'Reading A',
            lines: ['His exposure is twice the cohort average', 'Slow clearance: half-life 16 hours'],
            impostor: true,
            conceptId: 'exposure',
            explanation:
              'Twice the exposure with slow clearance: a person whose body handles the drug differently. This fits.',
            consequence: 'Understanding why one person is different is what protects the next cohort.',
          },
          {
            id: 'no-absorb',
            title: 'Reading B',
            lines: ['His exposure is near zero', 'The capsule may not have dissolved'],
            conceptId: 'exposure',
            explanation: 'Zero exposure cannot cause a drug-related liver rise.',
            consequence: 'Blaming the wrong reading sends the investigation the wrong way.',
          },
          {
            id: 'average',
            title: 'Reading C',
            lines: ['His exposure matches the cohort average', 'Nothing unusual'],
            conceptId: 'half-life',
            explanation: 'If he were average, the whole cohort would be at risk, and they are not.',
            consequence: 'Missing the outlier means missing the mechanism.',
          },
        ],
      },
    },
    {
      id: 'r-src',
      roleId: 'safety-review-committee',
      seconds: 25,
      brief: "You chair the Safety Review Committee. Monday's cohort is waiting. Decide.",
      meterHit: { safety: -15 },
      game: {
        engine: 'branching-scenario',
        start: 'n-decide',
        nodes: [
          {
            id: 'n-decide',
            speaker: 'Sponsor physician',
            text: 'One rising ALT, one high-exposure outlier, a cohort scheduled for Monday. What does the committee do?',
            choices: [
              {
                id: 'c-pause',
                text: 'Pause escalation, follow the volunteer daily, notify the regulator',
                quality: 'best',
                next: 'end-pause',
                conceptId: 'clinical-hold',
                explanation:
                  'Pause, understand, tell the regulator. That is the stopping rule doing its job.',
                consequence: 'A sponsor pause, well documented, is how holds are avoided or shortened.',
              },
              {
                id: 'c-continue',
                text: "Dose Monday's cohort at the same level; one case is not a pattern",
                quality: 'bad',
                next: 'end-continue',
                meters: { safety: -15 },
                conceptId: 'stopping-rule',
                explanation: 'The stopping rule was written for exactly this. One rising case is enough.',
                consequence: 'Dosing through a signal is the finding regulators never forgive.',
              },
              {
                id: 'c-stop',
                text: 'Terminate the study',
                quality: 'ok',
                next: 'end-pause',
                meters: { timeline: -15 },
                conceptId: 'dose-escalation',
                explanation: 'Safe, but premature. A pause with a plan keeps the programme alive.',
                consequence: 'Terminating on one case throws away a programme that might have been managed.',
              },
            ],
          },
          {
            id: 'end-pause',
            text: "Dosing pauses. The volunteer's ALT peaks on day 6 and falls. The committee has a mechanism, a plan and a letter ready for the regulator.",
            end: { summary: 'Pause, understand, respond.' },
          },
          {
            id: 'end-continue',
            text: "Monday's cohort is dosed. On Thursday a second volunteer's ALT rises. The regulator places the study on hold that afternoon.",
            end: { summary: 'The rule you did not apply was applied for you.' },
          },
        ],
      },
      variants: [
        {
          when: { 'local.spike': 'missed' },
          patch: {
            brief:
              "You chair the Safety Review Committee. The rising volunteer was not referred and his day-5 ALT is 8×. Monday's cohort is waiting. Decide.",
            meterHit: { safety: -20 },
          },
        },
      ],
    },
  ],
  resolution: {
    success: {
      id: 'w4-crisis-success',
      title: 'Signal caught',
      paragraphs: [
        'The volunteer was referred the same day, the event was documented as it happened, the outlier exposure was understood, and dosing paused before Monday.',
        'The hold that follows is short, because the committee could show it saw the signal first.',
      ],
      mayaStatus: 'Heard the study paused. Worried, then reassured.',
    },
    partial: {
      id: 'w4-crisis-partial',
      title: 'Caught late',
      paragraphs: [
        "The signal was handled, mostly. The gaps will become questions in the regulator's letter.",
        'Have another go. Every round is one role seeing the same lab result.',
      ],
      mayaStatus: 'Waiting for news.',
    },
    fail: {
      id: 'w4-crisis-fail',
      title: 'Dosed through it',
      paragraphs: [
        'The cohort was dosed, the second case appeared, and the regulator imposed the hold the committee should have imposed on itself.',
        'The programme survives with a finding it will carry into every future submission.',
      ],
      mayaStatus: 'Read a news story about the trial. Not a good one.',
    },
  },
};
