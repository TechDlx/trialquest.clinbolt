import type { Level } from './types';

/**
 * Engine lab: demo levels for the engines World 1 does not use. Reached from #/lab, never on
 * the map, no role card gate. Validated by the same stage rules as real levels.
 */
export const labLevels: Level[] = [
  {
    id: 'lab-sequence',
    worldId: 'w2',
    roleId: 'regulatory-affairs-specialist',
    title: 'Lab: file the IND',
    intro: 'Put the steps of a first [[ind|IND]] filing in order.',
    meterFocus: 'integrity',
    shortcutPrompt: {
      id: 'skip-qc',
      offer: 'Skip the final quality check on the dossier and file today?',
      accept: {
        meters: { timeline: 10, integrity: -10 },
        why: 'A day saved, and a refuse-to-file letter waiting if a module is missing.',
      },
    },
    stages: [
      {
        id: 'order',
        title: 'Order the steps',
        game: {
          engine: 'sequence-sort',
          prompt: 'Drag or tap to order the filing steps.',
          seconds: 70,
          items: [
            {
              id: 'preind',
              text: 'Pre-IND meeting with the FDA',
              conceptId: 'ind',
              explanation: 'Early advice shapes the whole package.',
              consequence: 'Filing without advice invites avoidable questions.',
            },
            {
              id: 'nonclin',
              text: 'Finalise the [[glp|GLP]] toxicology reports',
              conceptId: 'glp',
              explanation: 'The safety story comes before the human plan.',
              consequence: 'A protocol without safety data cannot be reviewed.',
            },
            {
              id: 'protocol',
              text: 'Write the Phase I [[protocol]]',
              conceptId: 'protocol',
              explanation: 'The protocol is built on the nonclinical findings.',
              consequence: 'A protocol written first has to be rewritten.',
            },
            {
              id: 'assemble',
              text: 'Assemble the [[ectd|eCTD]] modules',
              conceptId: 'ectd',
              explanation: 'Everything goes into the five-module structure.',
              consequence: 'Loose documents are refused at the gateway.',
            },
            {
              id: 'submit',
              text: 'Submit and start the 30-day clock',
              conceptId: 'ind',
              explanation: 'The FDA has 30 days to object before dosing may begin.',
              consequence: 'Dosing before day 30 is a serious violation.',
            },
          ],
        },
      },
    ],
    debrief: {
      learned:
        'An IND is a package in a fixed order: advice, safety data, protocol, assembly, submission, then a 30-day wait.',
      handoffLine: 'Lab level. Nothing is handed off.',
    },
  },
  {
    id: 'lab-match',
    worldId: 'w5',
    roleId: 'medical-coder',
    title: 'Lab: code the events',
    intro: 'Match each adverse event, as the patient described it, to its coded term.',
    meterFocus: 'integrity',
    shortcutPrompt: {
      id: 'auto-code',
      offer: 'Let the auto-coder pick terms without checking them?',
      accept: {
        meters: { timeline: 10, integrity: -15 },
        why: 'Fast, and half the terms will be wrong in the safety database.',
      },
    },
    stages: [
      {
        id: 'pairs',
        title: 'Match verbatim to term',
        game: {
          engine: 'match-pairs',
          prompt: 'Tap a patient description, then its coded term.',
          seconds: 70,
          pairs: [
            {
              id: 'nausea',
              left: '"Feeling sick to my stomach"',
              right: 'Nausea',
              conceptId: 'pharmacodynamics',
              explanation: 'Verbatim words map to one preferred term.',
              consequence: 'Miscoded events hide real signals.',
            },
            {
              id: 'headache',
              left: '"Pounding head all afternoon"',
              right: 'Headache',
              conceptId: 'pharmacodynamics',
              explanation: 'The term is the symptom, not the timing.',
              consequence: 'Splitting one symptom across terms undercounts it.',
            },
            {
              id: 'rash',
              left: '"Red blotches on both arms"',
              right: 'Rash',
              conceptId: 'pharmacodynamics',
              explanation: 'Location goes in the description, not the term.',
              consequence: 'Over-specific terms fragment the safety picture.',
            },
            {
              id: 'dizzy',
              left: '"Room was spinning when I stood up"',
              right: 'Dizziness',
              conceptId: 'pharmacodynamics',
              explanation: 'Postural dizziness still codes to dizziness.',
              consequence: 'Coding to the wrong body system misroutes the review.',
            },
            {
              id: 'fatigue',
              left: '"Wiped out for two days"',
              right: 'Fatigue',
              conceptId: 'pharmacodynamics',
              explanation: 'Duration is captured separately from the term.',
              consequence: 'Fatigue split from tiredness looks like two signals.',
            },
          ],
        },
      },
    ],
    debrief: {
      learned:
        'Coders turn patient words into standard terms so events can be counted and compared across the whole trial.',
      handoffLine: 'Lab level. Nothing is handed off.',
    },
  },
  {
    id: 'lab-dash',
    worldId: 'w4',
    roleId: 'study-coordinator',
    title: 'Lab: run the dosing day',
    intro:
      'Volunteers arrive on a schedule. Take each through check-in, consent, dose and sample before their patience runs out.',
    meterFocus: 'safety',
    stages: [
      {
        id: 'queue',
        title: 'Serve the queue',
        game: {
          engine: 'dash-manager',
          prompt: 'Tap a volunteer, then tap stations in order.',
          seconds: 90,
          stations: [
            { id: 'checkin', label: 'Check in' },
            { id: 'consent', label: 'Confirm consent' },
            { id: 'dose', label: 'Dose' },
            { id: 'sample', label: 'Blood sample' },
            {
              id: 'skip-id',
              label: 'Skip ID check',
              shortcut: {
                meters: { timeline: 10, integrity: -10 },
                why: 'Faster, until the wrong volunteer gets the wrong dose.',
              },
            },
          ],
          items: [
            {
              id: 'v1',
              label: 'Volunteer 101',
              steps: ['checkin', 'consent', 'dose', 'sample'],
              patienceSeconds: 40,
              arrivesAt: 0,
              conceptId: 'gcp',
              explanation: 'Every step, every time, in order.',
              consequence: 'A skipped consent check is a GCP violation.',
            },
            {
              id: 'v2',
              label: 'Volunteer 102',
              steps: ['checkin', 'consent', 'dose', 'sample'],
              patienceSeconds: 40,
              arrivesAt: 8,
              conceptId: 'gcp',
              explanation: 'Order matters: consent before dose.',
              consequence: 'Dosing before consent is reportable.',
            },
            {
              id: 'v3',
              label: 'Volunteer 103',
              steps: ['checkin', 'consent', 'dose', 'sample'],
              patienceSeconds: 40,
              arrivesAt: 18,
              conceptId: 'gcp',
              explanation: 'A late sample ruins the PK point.',
              consequence: 'Missed samples mean missing data.',
            },
          ],
        },
      },
    ],
    debrief: {
      learned:
        'A coordinator keeps every volunteer moving through the same steps in the same order, whatever the queue looks like.',
      handoffLine: 'Lab level. Nothing is handed off.',
    },
  },
  {
    id: 'lab-pk',
    worldId: 'w4',
    roleId: 'clinical-pharmacologist',
    title: 'Lab: pick the next dose',
    intro:
      'Cohort 2 tolerated 2 mg/kg with peak exposure at 40% of the safety ceiling. Place the next dose on the chart.',
    meterFocus: 'safety',
    stages: [
      {
        id: 'next',
        title: 'Choose the next dose',
        game: {
          engine: 'builder',
          prompt: 'Place one dose in the slot, then project it.',
          seconds: 60,
          slots: [{ id: 'next-dose', label: 'Next cohort dose', hint: 'Tap a dose, then this slot' }],
          parts: [
            {
              id: 'dose-3',
              text: '3 mg/kg (1.5× step)',
              conceptId: 'pharmacokinetics',
              explanation: 'A small step learns little and adds a cohort.',
              consequence: 'Slow escalation adds months.',
            },
            {
              id: 'dose-4',
              text: '4 mg/kg (2× step)',
              slotId: 'next-dose',
              conceptId: 'pharmacokinetics',
              explanation: 'Doubling keeps peak exposure under the ceiling with margin.',
              consequence: 'The standard step balances speed and safety.',
            },
            {
              id: 'dose-8',
              text: '8 mg/kg (4× step)',
              conceptId: 'pharmacokinetics',
              explanation: 'A 4× step projects exposure above the ceiling.',
              consequence: 'Overshooting the ceiling is how Phase I studies get held.',
              shortcut: {
                meters: { timeline: 15, safety: -20 },
                why: 'Two cohorts saved, and the projection crosses the line.',
              },
            },
          ],
          simulation: {
            kind: 'pk-next-dose',
            host: 'builder',
            slotId: 'next-dose',
            preview: 'on-commit',
            revealSeconds: 4,
            commitLabel: 'Project the exposure',
            targetBand: 'standard',
            bands: [
              {
                tag: 'slow',
                label: 'Slow step',
                parts: ['dose-3'],
                narration:
                  'Peak exposure reaches 60% of the ceiling. Safe, and you will need an extra cohort.',
                meters: { timeline: -5 },
                consequence: 'Small steps cost months.',
                visual: {
                  exposure: 60,
                  safetyCeiling: 100,
                  points: [
                    { t: 0, c: 0 },
                    { t: 1, c: 45 },
                    { t: 2, c: 60 },
                    { t: 4, c: 40 },
                    { t: 8, c: 15 },
                    { t: 12, c: 5 },
                  ],
                },
              },
              {
                tag: 'standard',
                label: 'Standard step',
                parts: ['dose-4'],
                narration: 'Peak exposure reaches 80% of the ceiling. Measurable, with margin.',
                visual: {
                  exposure: 80,
                  safetyCeiling: 100,
                  points: [
                    { t: 0, c: 0 },
                    { t: 1, c: 60 },
                    { t: 2, c: 80 },
                    { t: 4, c: 55 },
                    { t: 8, c: 20 },
                    { t: 12, c: 7 },
                  ],
                },
              },
              {
                tag: 'fast',
                label: 'Fast step',
                parts: ['dose-8'],
                narration: 'Peak exposure projects to 160% of the ceiling. The committee would stop you.',
                meters: { safety: -15 },
                consequence: 'Exposure above the ceiling is exactly what the ceiling exists to prevent.',
                visual: {
                  exposure: 160,
                  safetyCeiling: 100,
                  points: [
                    { t: 0, c: 0 },
                    { t: 1, c: 120 },
                    { t: 2, c: 160 },
                    { t: 4, c: 110 },
                    { t: 8, c: 40 },
                    { t: 12, c: 14 },
                  ],
                },
              },
            ],
          },
        },
      },
    ],
    debrief: {
      learned:
        'Each cohort steps the dose up by a planned factor and checks the projected peak against a safety ceiling before anyone is dosed.',
      handoffLine: 'Lab level. Nothing is handed off.',
    },
  },
];

export const labLevelById: Record<string, Level> = Object.fromEntries(labLevels.map((l) => [l.id, l]));
