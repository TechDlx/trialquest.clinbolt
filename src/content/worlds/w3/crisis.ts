import type { CrisisBoss } from '../../types';

/** World 3 crisis: a site freezer fails the night before first dose. Four rounds, 100 s, pool 115 s. */
export const w3Crisis: CrisisBoss = {
  id: 'w3-crisis',
  worldId: 'w3',
  title: 'Night before first dose',
  situation: [
    'At 11 pm the pharmacy at Site 01 calls: the drug freezer failed some time this afternoon. The temperature logger shows 14 hours above the limit. The first volunteer is due at 8 am.',
    'Reship, re-file, re-check the systems, and decide what the site is told. Four roles, one night.',
  ],
  rounds: [
    {
      id: 'r-supply',
      roleId: 'clinical-supply-manager',
      seconds: 25,
      brief: "You're the Supply Manager. What happens to each box tonight?",
      meterHit: { safety: -10 },
      game: {
        engine: 'bucket-sort',
        prompt: 'Sort each box.',
        seconds: 25,
        buckets: [
          { id: 'quarantine', label: 'Quarantine & report' },
          { id: 'ship', label: 'Ship tonight' },
          { id: 'use', label: 'Use as normal' },
        ],
        cards: [
          {
            id: 'warm-box',
            text: 'The kits that sat in the failed freezer',
            bucketId: 'quarantine',
            conceptId: 'temperature-excursion',
            explanation:
              'An excursion means quarantine until a stability expert rules. Never dose from it tonight.',
            consequence: 'Dosing from an excursion box risks the volunteer and voids the data.',
          },
          {
            id: 'depot-box',
            text: 'Replacement kits at the central depot, released and logged',
            bucketId: 'ship',
            conceptId: 'clinical-supply',
            explanation: 'Released stock at the depot can go out tonight by courier with a logger.',
            consequence: 'Waiting until morning means the first dose slips a week.',
          },
          {
            id: 'unreleased',
            text: 'A new batch at the depot, not yet QA-released',
            bucketId: 'quarantine',
            conceptId: 'qp-release',
            explanation: 'Unreleased drug does not ship, however urgent the night is.',
            consequence: 'Shipping unreleased drug is a GMP violation on top of the excursion.',
          },
          {
            id: 'placebo-fridge',
            text: 'Kits in the second, working fridge with a clean logger',
            bucketId: 'use',
            conceptId: 'cold-chain',
            explanation: 'A separate unit with an unbroken temperature record is fine to use.',
            consequence: 'Quarantining good stock out of panic delays dosing for nothing.',
          },
        ],
      },
      emits: [
        {
          key: 'local.reship',
          tags: ['sent', 'stuck'],
          defaultTag: 'stuck',
          outcomes: [{ tag: 'sent', when: { bucketOf: { itemId: 'depot-box', bucketId: 'ship' } } }],
        },
      ],
    },
    {
      id: 'r-tmf',
      roleId: 'tmf-specialist',
      seconds: 25,
      brief:
        "You're the TMF Specialist. By morning the file must show what happened. Where does each record go?",
      meterHit: { integrity: -10 },
      game: {
        engine: 'bucket-sort',
        prompt: "File tonight's records.",
        seconds: 25,
        buckets: [
          { id: 'site', label: 'Site management' },
          { id: 'trial-mgmt', label: 'Trial management' },
          { id: 'bin', label: 'Not a TMF document' },
        ],
        cards: [
          {
            id: 'excursion-report',
            text: 'Temperature excursion report from Site 01',
            bucketId: 'site',
            conceptId: 'tmf',
            explanation: 'Site-level supply records, including excursions, file under site management.',
            consequence: 'An unfiled excursion is a deviation the inspector finds before you do.',
          },
          {
            id: 'deviation',
            text: 'Deviation log entry and root-cause note',
            bucketId: 'trial-mgmt',
            conceptId: 'essential-documents',
            explanation: 'Study-level deviations and their root causes are trial management records.',
            consequence: 'Deviations without root cause are repeated.',
          },
          {
            id: 'chat',
            text: 'The 11 pm group chat with the pharmacist',
            bucketId: 'bin',
            conceptId: 'essential-documents',
            explanation: 'Chats are not essential documents. The facts go into a dated note to file.',
            consequence: 'Filing raw chats fills the TMF with noise and exposes personal data.',
          },
        ],
      },
    },
    {
      id: 'r-val',
      roleId: 'systems-validation-engineer',
      seconds: 25,
      brief:
        "You're the Validation Engineer. Three temperature records exist. Which one can the decision rest on?",
      meterHit: { integrity: -10 },
      game: {
        engine: 'spot-the-impostor',
        prompt: 'Which record is trustworthy?',
        seconds: 25,
        targetLabel: 'the trustworthy record',
        cards: [
          {
            id: 'logger',
            title: 'Calibrated logger',
            lines: [
              'Continuous readings every 5 minutes',
              'Calibration certificate valid',
              'Data exported with checksum',
            ],
            impostor: true,
            conceptId: 'audit-trail',
            explanation: 'Calibrated, continuous, tamper-evident. This is the record that decides.',
            consequence: 'Decisions rest on records that can be verified.',
          },
          {
            id: 'wall-chart',
            title: 'Wall chart',
            lines: ['Handwritten twice-daily readings', 'Afternoon reading missing', 'Pen changed mid-page'],
            conceptId: 'audit-trail',
            explanation: 'Gaps and edits without a trail. Supporting evidence at best.',
            consequence: 'A missing reading is exactly the window in question.',
          },
          {
            id: 'memory',
            title: "Pharmacist's recollection",
            lines: ['"It was fine at lunchtime"', 'No written record'],
            conceptId: 'essential-documents',
            explanation: 'Honest, probably true, and not a record.',
            consequence: 'If it is not written down, it did not happen.',
          },
        ],
      },
    },
    {
      id: 'r-pm',
      roleId: 'clinical-project-manager',
      seconds: 25,
      brief: "You're the Project Manager. 6 am. The site asks whether the 8 am volunteer comes in.",
      meterHit: { safety: -10, timeline: -5 },
      game: {
        engine: 'branching-scenario',
        start: 'n-call',
        nodes: [
          {
            id: 'n-call',
            speaker: 'Site coordinator',
            text: 'The volunteer is on his way. Replacement drug is on a courier. Do we dose at 8?',
            choices: [
              {
                id: 'c-wait',
                text: 'Dose only when the courier kits are in the fridge and logged',
                quality: 'best',
                next: 'end-wait',
                conceptId: 'clinical-supply',
                explanation: 'The visit can wait an hour. Dosing from the wrong box cannot be undone.',
                consequence:
                  'A short delay is a footnote; a dose from quarantined stock is a report to the regulator.',
              },
              {
                id: 'c-warm',
                text: 'Dose from the warm kits; 14 hours is probably fine',
                quality: 'bad',
                next: 'end-warm',
                meters: { safety: -15 },
                conceptId: 'temperature-excursion',
                explanation:
                  '"Probably fine" is not a stability ruling. The kits are quarantined for a reason.',
                consequence: 'Dosing from excursion stock is a safety risk and a critical deviation.',
              },
              {
                id: 'c-cancel',
                text: 'Cancel the study start; reschedule next month',
                quality: 'ok',
                next: 'end-wait',
                meters: { timeline: -10 },
                conceptId: 'risk-management-plan',
                explanation: 'Safe, but the risk plan exists so a freezer does not cost a month.',
                consequence: 'Over-cancelling burns the timeline the contingency was meant to protect.',
              },
            ],
          },
          {
            id: 'end-wait',
            text: 'The kits arrive at 8:40, logged and cold. The volunteer is dosed at 9:15. The deviation is on file with its root cause.',
            end: { summary: 'An hour late and fully documented is a good outcome.' },
          },
          {
            id: 'end-warm',
            text: 'The volunteer is dosed from the quarantined box. Two days later QA rules the excursion unacceptable. The dose is reported as a deviation to the regulator.',
            end: { summary: 'The fastest option was the most expensive one.' },
          },
        ],
      },
      variants: [
        {
          when: { 'local.reship': 'stuck' },
          patch: {
            brief:
              "You're the Project Manager. 6 am. No replacement drug was shipped overnight. The site asks whether the 8 am volunteer comes in.",
            meterHit: { safety: -10, timeline: -10 },
          },
        },
      ],
    },
  ],
  resolution: {
    success: {
      id: 'w3-crisis-success',
      title: 'Dosed by lunchtime',
      paragraphs: [
        'The warm kits are quarantined, replacements arrived by courier, the records are filed and the decision rests on a calibrated logger. The first volunteer is dosed an hour late.',
        'A freezer failure is a normal night in a clinical trial. Handling it this way is what the whole of World 3 was for.',
      ],
      mayaStatus: 'Read that dosing has begun.',
    },
    partial: {
      id: 'w3-crisis-partial',
      title: 'A rough night',
      paragraphs: [
        'Some of it was handled. Some of it will appear in the deviation log and then in an inspection report.',
        'Have another go: each round is one role doing its job at 2 am.',
      ],
      mayaStatus: 'Waiting for news.',
    },
    fail: {
      id: 'w3-crisis-fail',
      title: 'First dose, first deviation',
      paragraphs: [
        'The volunteer was dosed from the wrong box, the records are incomplete, and the regulator hears about it from the site.',
        'The study survives, barely, with a finding it will carry to the end.',
      ],
      mayaStatus: 'Heard the study had a problem on day one.',
    },
  },
};
