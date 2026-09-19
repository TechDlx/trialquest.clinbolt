import type { CrisisBoss } from '../../types';

/** World 7 crisis: the day-74 letter. Four rounds, 100 s, pool 115 s. */
export const w7Crisis: CrisisBoss = {
  id: 'w7-crisis',
  worldId: 'w7',
  title: 'Day 74',
  situation: [
    "The regulator's filing-review letter arrives on day 74: a broken dataset in Module 5, three questions on the liver cases, an inspection date next week, and a first draft of the label with a boxed warning the sponsor did not expect.",
    'Fix, answer, host, negotiate. Four roles, ten days.',
  ],
  rounds: [
    {
      id: 'r-pub',
      roleId: 'submission-publisher',
      seconds: 25,
      brief: "You're the Publisher. The agency says one dataset failed. Which one, and why?",
      meterHit: { timeline: -10 },
      game: {
        engine: 'spot-the-impostor',
        prompt: 'Which dataset triggered the validation error?',
        seconds: 25,
        targetLabel: 'the failing dataset',
        cards: [
          {
            id: 'ds-ae',
            title: 'ADAE (adverse events)',
            lines: ['Define-XML entry present', 'Variable names match the standard', '11 MB'],
            conceptId: 'technical-validation',
            explanation: 'Documented, standard, small. Clean.',
            consequence: 'Fixing the wrong file wastes a day of the ten.',
          },
          {
            id: 'ds-lb',
            title: 'ADLB (labs)',
            lines: ['Not listed in Define-XML', 'Two variables with non-standard names', '3.9 GB'],
            impostor: true,
            conceptId: 'technical-validation',
            explanation: 'Undocumented, non-standard and far over the size limit. Three errors in one file.',
            consequence: 'This file stops the review clock until replaced.',
          },
          {
            id: 'ds-sl',
            title: 'ADSL (subject level)',
            lines: ['Define-XML entry present', 'Standard variables', '2 MB'],
            conceptId: 'adam',
            explanation: 'The subject-level dataset is the cleanest file in most submissions.',
            consequence: 'Accusing a clean file delays the real fix.',
          },
        ],
      },
      emits: [
        {
          key: 'local.fix',
          tags: ['fixed', 'stuck'],
          defaultTag: 'stuck',
          outcomes: [{ tag: 'fixed', when: { accused: 'ds-lb' } }],
        },
      ],
    },
    {
      id: 'r-ral',
      roleId: 'regulatory-affairs-lead',
      seconds: 25,
      brief:
        "You're the Regulatory Lead. Three agency questions. Which responses are complete enough to send?",
      meterHit: { integrity: -10 },
      game: {
        engine: 'bucket-sort',
        prompt: 'Send it, or rewrite it?',
        seconds: 25,
        buckets: [
          { id: 'send', label: 'Send' },
          { id: 'rewrite', label: 'Rewrite' },
        ],
        cards: [
          {
            id: 'resp-narratives',
            text: 'Narratives for both serious liver cases, with lab time courses and outcomes',
            bucketId: 'send',
            conceptId: 'filing-review',
            explanation: 'Exactly what was asked: the cases, the numbers, what happened.',
            consequence: 'Complete answers keep the clock running.',
          },
          {
            id: 'resp-vague',
            text: '"The sponsor believes the liver findings are not clinically meaningful"',
            bucketId: 'rewrite',
            conceptId: 'benefit-risk',
            explanation: 'A belief is not an answer. The reviewer asked for an analysis.',
            consequence: 'Vague responses generate a second, sharper letter.',
          },
          {
            id: 'resp-dose',
            text: 'Dose-response analysis of enzyme rises across all three trials',
            bucketId: 'send',
            conceptId: 'exposure',
            explanation: 'Pooled dose-response is the analysis that answers "is it related?"',
            consequence: 'Without it, the reviewer assumes the worst.',
          },
          {
            id: 'resp-market',
            text: "A note that competitors' labels carry no liver warning",
            bucketId: 'rewrite',
            conceptId: 'boxed-warning',
            explanation:
              'Other drugs are not evidence about this one. Reviewers find the comparison irrelevant at best.',
            consequence: "Arguing from competitors' labels damages credibility.",
          },
        ],
      },
    },
    {
      id: 'r-insp',
      roleId: 'inspection-readiness-lead',
      seconds: 25,
      brief: "You're Inspection Readiness. The inspector's first three requests. Order your response.",
      meterHit: { integrity: -10 },
      game: {
        engine: 'sequence-sort',
        prompt: 'Order the handling of a request.',
        seconds: 25,
        items: [
          {
            id: 'log',
            text: 'Log the request with time and wording',
            conceptId: 'gcp-inspection',
            explanation: 'Every request is written down before anyone runs to find it.',
            consequence: 'Unlogged requests are answered twice or never.',
          },
          {
            id: 'retrieve',
            text: 'Retrieve the document from the TMF',
            conceptId: 'tmf',
            explanation: "From the file, not from someone's laptop.",
            consequence: 'Documents from laptops raise the question of what else lives there.',
          },
          {
            id: 'qc',
            text: 'Check it is the right version and complete',
            conceptId: 'essential-documents',
            explanation: 'A wrong version handed over is worse than a short wait.',
            consequence: 'Superseded versions become findings in themselves.',
          },
          {
            id: 'hand',
            text: 'Hand it over and record the handover',
            conceptId: 'gcp-inspection',
            explanation: 'The record of what was provided is your defence later.',
            consequence: 'Without a handover record, "not provided" cannot be disputed.',
          },
        ],
      },
    },
    {
      id: 'r-label',
      roleId: 'labeling-specialist',
      seconds: 25,
      brief:
        "You're Labeling. The agency's draft has a boxed warning. Your commercial team wants it gone. Respond.",
      meterHit: { safety: -15 },
      game: {
        engine: 'branching-scenario',
        start: 'n-label',
        nodes: [
          {
            id: 'n-label',
            speaker: 'Commercial lead',
            text: 'A boxed warning will halve the launch forecast. Push back hard.',
            choices: [
              {
                id: 'c-accept-box',
                text: 'Accept the box; negotiate precise wording and a clear monitoring plan',
                quality: 'best',
                next: 'end-box',
                conceptId: 'boxed-warning',
                explanation:
                  'The data justify the box. What can be negotiated is precision: what to watch, how often.',
                consequence: 'A precise boxed warning protects patients and, in the long run, the product.',
              },
              {
                id: 'c-fight',
                text: 'Refuse the box; threaten to withdraw the application',
                quality: 'bad',
                next: 'end-fight',
                meters: { safety: -15, timeline: -15 },
                conceptId: 'prescribing-information',
                explanation: 'Regulators do not negotiate under threat. The data are the data.',
                consequence: 'Fighting a justified warning delays approval and poisons the relationship.',
              },
              {
                id: 'c-soften',
                text: 'Propose a standard warning with "consider monitoring"',
                quality: 'ok',
                next: 'end-box',
                meters: { safety: -5 },
                conceptId: 'boxed-warning',
                explanation:
                  'A counter-proposal is normal, but "consider" for serious cases will be refused, and should be.',
                consequence: 'Softened warnings that pass are the ones that hurt people later.',
              },
            ],
          },
          {
            id: 'end-box',
            text: 'The boxed warning stays, with monthly liver tests for six months spelled out. Approval follows.',
            end: { summary: 'Negotiate the words, not the risk.' },
          },
          {
            id: 'end-fight',
            text: 'The application stalls for four months. The boxed warning stays anyway. The relationship does not recover.',
            end: { summary: 'The data decided this before the meeting started.' },
          },
        ],
      },
      variants: [
        {
          when: { 'local.fix': 'stuck' },
          patch: {
            brief:
              "You're Labeling. The review clock is stopped on a broken dataset, so the agency has time to harden the boxed warning. Your commercial team wants it gone. Respond.",
            meterHit: { safety: -20 },
          },
        },
      ],
    },
  ],
  resolution: {
    success: {
      id: 'w7-crisis-success',
      title: 'Ten days',
      paragraphs: [
        'The dataset was replaced, the questions were answered with data, the inspector got every document in minutes, and the boxed warning was negotiated into precise, useful words.',
        'The review clock keeps running. Approval is weeks away.',
      ],
      mayaStatus: "Refreshing the agency's website.",
    },
    partial: {
      id: 'w7-crisis-partial',
      title: 'Clock stopped',
      paragraphs: [
        'Some of it was handled. The rest stopped the clock or added a finding.',
        'Have another go: each round is one role answering one letter.',
      ],
      mayaStatus: 'Waiting.',
    },
    fail: {
      id: 'w7-crisis-fail',
      title: 'Complete response',
      paragraphs: [
        'The dataset stayed broken, the answers were beliefs, the inspector wrote "not provided", and the company threatened the regulator over a warning the data demanded.',
        'A complete response letter follows. Resubmission in a year.',
      ],
      mayaStatus: 'Read that the decision was delayed.',
    },
  },
};
