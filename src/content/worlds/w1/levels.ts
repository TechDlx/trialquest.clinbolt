import type { Level } from '../../types';

/** World 1 levels, retrofitted onto their intended engines (SPEC Amendment 1). */
export const w1Levels: Level[] = [
  // ------------------------------------------------------------------ w1-l1 Patient Advocate
  {
    id: 'w1-l1',
    worldId: 'w1',
    roleId: 'patient-advocate',
    title: "Maya's diagnosis",
    intro:
      'Maya has a name for it at last: Veridian Syndrome. [[rare-disease|Rare]], real, and with no approved treatment. A patient group has asked her to help shape what research comes next. You are her voice.',
    meterFocus: 'integrity',
    stages: [
      {
        id: 'voice',
        title: 'Be the patient voice',
        brief: 'Three decisions. Each one shapes the research that follows.',
        game: {
          engine: 'branching-scenario',
          start: 'n-interview',
          nodes: [
            {
              id: 'n-interview',
              speaker: 'Maya',
              text: 'A university lab wants to interview patients about living with the disease. It means a two-hour call and a lot of questions about bad days. What do I tell them?',
              choices: [
                {
                  id: 'c-yes',
                  text: 'Yes. That is how researchers learn what a bad day is, and what to change.',
                  confirm: 'Right: research starts by listening to patients.',
                  quality: 'best',
                  next: 'n-outcome',
                  conceptId: 'natural-history',
                  explanation:
                    'Interviews and [[natural-history|natural history]] data tell researchers what the disease does and what to measure.',
                  consequence: 'Without patient input, trials measure what is easy instead of what matters.',
                },
                {
                  id: 'c-later',
                  text: 'Maybe later, when there is a treatment to talk about.',
                  quality: 'ok',
                  next: 'n-outcome',
                  meters: { timeline: -5 },
                  conceptId: 'natural-history',
                  explanation:
                    'Research starts with patients, not after them. Waiting delays the study that could lead to a treatment.',
                  consequence:
                    'Trials designed without patients often measure the wrong thing and have to be redone.',
                },
                {
                  id: 'c-no',
                  text: 'No. They only want data; nothing ever comes back to patients.',
                  quality: 'bad',
                  next: 'n-outcome',
                  conceptId: 'unmet-need',
                  explanation:
                    'That data is the start of everything that could come back. Nobody designs a trial for a disease they do not understand.',
                  consequence: 'Diseases without patient data stay diseases without research.',
                },
              ],
            },
            {
              id: 'n-outcome',
              speaker: 'Researcher',
              text: 'We can design our first study around one main outcome. Which matters most to people with Veridian Syndrome?',
              choices: [
                {
                  id: 'c-fatigue',
                  text: 'Days without crushing fatigue, reported by the patients themselves',
                  confirm: 'Yes: measure what patients actually feel.',
                  quality: 'best',
                  next: 'n-press',
                  conceptId: 'patient-reported-outcome',
                  explanation:
                    'A [[patient-reported-outcome|patient-reported outcome]] captures how people actually feel and function.',
                  consequence:
                    'A drug can move a lab number while patients feel no better. Measuring the wrong thing wastes years and hope.',
                },
                {
                  id: 'c-marker',
                  text: 'The VRD-1 blood marker; it is objective and easy to measure',
                  quality: 'ok',
                  next: 'n-press',
                  conceptId: 'biomarker',
                  explanation:
                    'A [[biomarker]] is useful, but a number can improve while people feel no better.',
                  consequence: 'Drugs approved on markers alone sometimes fail to help anyone feel better.',
                },
                {
                  id: 'c-fastest',
                  text: 'Whatever gets the study approved fastest',
                  quality: 'bad',
                  next: 'n-press',
                  meters: { integrity: -10 },
                  conceptId: 'clinical-trial',
                  explanation:
                    'A [[clinical-trial|trial]] that answers the wrong question is not fast. It is wasted.',
                  consequence: 'Regulators reject studies whose main outcome does not matter to patients.',
                },
              ],
            },
            {
              id: 'n-press',
              speaker: 'Patient group chair',
              text: 'A journalist wants Maya\'s story for a piece titled "Miracle cure in the lab". Coverage would bring donations to the group and pressure on the company.',
              choices: [
                {
                  id: 'c-honest',
                  text: 'Give the interview, but insist on honest words: early research, no cure yet.',
                  confirm: 'Honest hope. The community will remember it.',
                  quality: 'best',
                  next: 'end-good',
                  conceptId: 'attrition',
                  explanation:
                    'Only about [[attrition|1 in 10]] molecules that reach human trials is ever approved. Honest hope survives that.',
                  consequence:
                    'Communities sold a cure turn on the researchers when the first compound fails.',
                },
                {
                  id: 'c-hype',
                  text: 'Take the headline. Hope brings donations and speed.',
                  quality: 'bad',
                  next: 'end-hype',
                  conceptId: 'attrition',
                  shortcut: {
                    meters: { timeline: 10, integrity: -15 },
                    why: 'Hype raises money fast. It also raises hopes the science cannot yet keep, and people remember who promised.',
                  },
                  explanation: 'A headline is not a result. The science is years from knowing.',
                  consequence: 'Overpromising to patients about experimental drugs is a real harm.',
                },
                {
                  id: 'c-refuse',
                  text: 'Refuse all press until there is a treatment.',
                  quality: 'ok',
                  next: 'end-good',
                  meters: { timeline: -5 },
                  conceptId: 'patient-advocate',
                  explanation:
                    'Silence protects nobody. Honest coverage brings patients to registries and trials.',
                  consequence: 'Rare diseases nobody hears about get no funding.',
                },
              ],
            },
            {
              id: 'end-good',
              text: 'The lab has patient interviews, a main outcome patients chose, and a community that understands the odds. That is a better start than most molecules get.',
              end: { summary: 'Every medicine starts with a person who can describe what needs to change.' },
            },
            {
              id: 'end-hype',
              text: "The headline runs. Donations jump. Six months later the first compound fails, and the group's inbox fills with people who thought a cure was coming.",
              end: { summary: 'Honest hope lasts longer than headlines.' },
            },
          ],
        },
      },
    ],
    debrief: {
      learned:
        'Every medicine starts with an [[unmet-need|unmet need]] and a patient who can describe it. Advocates make sure research measures what matters to people, and keep hope honest.',
      handoffLine: "You hand Maya's story and her community's priorities to the Discovery Scientist.",
    },
  },

  // ------------------------------------------------------------------ w1-l2 Discovery Scientist
  {
    id: 'w1-l2',
    worldId: 'w1',
    roleId: 'discovery-scientist',
    title: 'Find the hit',
    intro:
      "Your lab found VRD-1, the protein driving Maya's disease. A [[hts|screen]] of 200,000 compounds is back. Five look promising. Only one is a real [[hit]]: potent, [[selectivity|selective]], and reproducible. Inspect the data and find it.",
    stages: [
      {
        id: 'screen',
        title: 'Read the screening data',
        brief: 'Tap a compound to inspect it. Accuse the one you would carry forward.',
        game: {
          engine: 'spot-the-impostor',
          prompt: 'Which compound is the real hit?',
          seconds: 120,
          targetLabel: 'the real hit',
          cards: [
            {
              id: 'vx-088',
              title: 'VX-088',
              lines: [
                'Blocks VRD-1 strongly',
                'Also blocks 6 similar proteins (2× selectivity)',
                'Reproduced in 3 of 3 runs',
              ],
              conceptId: 'selectivity',
              explanation:
                'Potent, but it hits six related proteins almost as hard. That is a side-effect machine.',
              consequence: 'Poorly selective leads fail later in animals or people, after years of work.',
            },
            {
              id: 'vx-101',
              title: 'VX-101',
              lines: [
                'Blocks VRD-1 strongly',
                'Ignores similar proteins (>100× selectivity)',
                'Reproduced in 3 of 3 runs',
                'No assay interference',
              ],
              impostor: true,
              confirm: 'That is the hit: potent, selective, reproducible, clean.',
              conceptId: 'hit',
              explanation: 'Potent, selective, reproducible and clean. This is what a real hit looks like.',
              consequence: 'Passing over the real hit means chasing a worse molecule for months.',
            },
            {
              id: 'vx-114',
              title: 'VX-114',
              lines: [
                'Blocks VRD-1 strongly in 1 of 3 runs',
                'No effect in the other 2 runs',
                'Selectivity not tested',
              ],
              conceptId: 'hit',
              explanation: 'One good run out of three is noise until proven otherwise. Hits must reproduce.',
              consequence: 'Chasing a false positive wastes a chemistry team for a year.',
            },
            {
              id: 'vx-127',
              title: 'VX-127',
              lines: [
                'Blocks VRD-1 strongly',
                "Flagged: interferes with the assay's light signal",
                'Reproduced in 3 of 3 runs',
              ],
              conceptId: 'pains',
              explanation:
                'Compounds that interfere with the test itself look active when they are not. This is a known false-positive class.',
              consequence: 'Assay artefacts are the most common reason early "hits" evaporate.',
            },
            {
              id: 'vx-133',
              title: 'VX-133',
              lines: ['Blocks VRD-1 weakly', 'Clean selectivity', 'Reproduced in 3 of 3 runs'],
              conceptId: 'lead-compound',
              explanation: 'Clean but weak. It would need a dose too high to be practical.',
              consequence: 'Weak leads rarely become medicines; potency is hard to add later.',
            },
          ],
          signOff: {
            id: 'nominate-potent',
            label: 'Nominate the most potent compound now, skip the checks',
            shortcut: {
              meters: { timeline: 10, integrity: -15 },
              why: 'Potency without selectivity is a side-effect machine. You would find out in animals, months from now.',
            },
          },
        },
      },
    ],
    debrief: {
      learned:
        'A real hit is potent, selective and reproducible, and it does not fool the assay. Discovery throws away most candidates so only the strongest molecule moves forward.',
      handoffLine: 'You hand VX-101, and everything you know about it, to the Toxicologist.',
    },
  },

  // ------------------------------------------------------------------ w1-l3 Toxicologist
  {
    id: 'w1-l3',
    worldId: 'w1',
    roleId: 'preclinical-toxicologist',
    title: 'Is it safe enough to try?',
    intro:
      'The 28-day rat study is back. Sort what the pathologist found, then set the first human dose. The US default is a safety factor on the animal [[noael|NOAEL]]; the EU also uses [[mabel|MABEL]] for higher-risk molecules.',
    meterFocus: 'safety',
    stages: [
      {
        id: 'findings',
        title: 'Classify the findings',
        brief: 'Adverse, not adverse, or send it to pathology review?',
        weight: 1,
        game: {
          engine: 'bucket-sort',
          prompt: 'Sort each finding from the 28-day rat study.',
          seconds: 75,
          buckets: [
            { id: 'adverse', label: 'Adverse', hint: 'Harmful, dose-related, or would matter in a person' },
            { id: 'not-adverse', label: 'Not adverse', hint: 'Within normal range, or not related to dose' },
            { id: 'review', label: 'Pathology review', hint: 'Could go either way; needs the slides' },
            {
              id: 'noise',
              label: 'Log as noise',
              hint: 'Skip the review, keep the timeline',
              shortcut: {
                meters: { timeline: 10, safety: -15 },
                why: 'Skipping review is how a real liver signal gets found in humans instead of rats.',
              },
            },
          ],
          cards: [
            {
              id: 'alt',
              confirm: 'Adverse: dose-related, and the liver is the target organ.',
              text: '[[alt|ALT]] (a liver enzyme) 3 times the upper limit at 100 mg/kg, rising with dose',
              bucketId: 'adverse',
              conceptId: 'toxicology',
              explanation:
                'A dose-related rise in a liver enzyme is a classic adverse finding. The liver is a target organ.',
              consequence:
                'Missing a liver signal in animals is how first-in-human trials produce serious liver injury.',
            },
            {
              id: 'weight-gain',
              confirm: 'Not adverse: small, and inside the normal range.',
              text: 'Males gained slightly more weight than controls at every dose',
              bucketId: 'not-adverse',
              conceptId: 'noael',
              explanation:
                "A small change in the same direction at every dose, inside the lab's normal range, is not adverse.",
              consequence:
                'Calling everything adverse buries the real signal and delays a drug patients need.',
            },
            {
              id: 'hypertrophy',
              confirm: 'Review: adaptive or early injury, the slides decide.',
              text: 'Liver cells enlarged at 100 mg/kg; no cell death seen',
              bucketId: 'review',
              conceptId: 'toxicology',
              explanation:
                'Enlarged liver cells can be the liver adapting, or the start of injury. The pathologist decides from the slides.',
              consequence:
                'Guessing instead of reviewing means the wrong NOAEL, and the wrong starting dose.',
            },
            {
              id: 'skin',
              confirm: 'Not adverse: a control rat had it too.',
              text: 'One rat at 10 mg/kg had a skin lesion; so did one control rat',
              bucketId: 'not-adverse',
              conceptId: 'noael',
              explanation: 'Seen in a control animal too, and at only one dose: not related to the drug.',
              consequence: 'Chasing background findings wastes months and animals.',
            },
            {
              id: 'food',
              confirm: 'Adverse: 10% weight loss is toxicity.',
              text: '10% weight loss and reduced food intake at 100 mg/kg',
              bucketId: 'adverse',
              conceptId: 'toxicology',
              explanation: 'Weight loss of this size is a sign of toxicity, whatever the mechanism.',
              consequence:
                'Ignoring general signs of toxicity leads to a starting dose that makes volunteers ill.',
            },
            // Spare cards kept as worked examples (docs/CONTENT_GUIDE.md §4). Five cards fit the 75 s budget.
            // {
            //   id: 'liver-weight',
            //   text: 'Liver weight up 15% at 30 mg/kg; enzymes and slides normal',
            //   bucketId: 'review',
            //   conceptId: 'noael',
            //   explanation:
            //     'An organ-weight change with nothing else is a judgement call. It is often adaptive, but it must be checked.',
            //   consequence:
            //     'If this is early injury, 30 mg/kg is not the NOAEL and the human dose is set too high.',
            // },
            // {
            //   id: 'thyroid',
            //   text: 'Thyroid weight up 10% at the top dose; nothing unusual on the slides',
            //   bucketId: 'review',
            //   conceptId: 'toxicology',
            //   explanation:
            //     'An organ-weight change with clean slides is a judgement call. In rats it is often a harmless adaptation, but the pathologist must confirm it.',
            //   consequence:
            //     'Thyroid findings in rats sometimes matter for people and sometimes do not. Skipping the review means nobody finds out which.',
            // },
          ],
        },
      },
      {
        id: 'dose',
        title: 'Set the first human dose',
        brief:
          'Use the NOAEL, the human equivalent dose and a safety factor. Dose will project how the first cohort responds.',
        weight: 2,
        game: {
          engine: 'allocator',
          prompt: 'Choose the starting dose for the first cohort of six healthy volunteers.',
          seconds: 90,
          context: [
            'Rat [[noael|NOAEL]]: 30 mg/kg per day (liver changes at 100 mg/kg)',
            '[[hed|Human equivalent dose]] (by body surface area): about 4.8 mg/kg',
            'Default [[safety-factor|safety factor]]: divide by at least 10',
            'Target organ to watch: liver',
          ],
          categories: [
            {
              id: 'dose',
              label: 'Starting dose',
              unit: 'mg/kg',
              min: 0.1,
              max: 5,
              step: 0.1,
              initial: 2.4,
              target: [0.3, 0.7],
              conceptId: 'starting-dose',
              explanation:
                '4.8 mg/kg divided by 10 is about 0.5 mg/kg. A little lower is fine; a lot lower wastes cohorts.',
              consequence:
                'Starting too high is how first-in-human trials cause serious harm. Starting far too low adds cohorts and months.',
            },
          ],
          presets: [
            {
              id: 'use-hed',
              label: 'Start at the human equivalent dose (4.8 mg/kg)',
              values: { dose: 4.8 },
              shortcut: {
                meters: { timeline: 15, safety: -25 },
                why: 'Skipping the safety factor saves cohorts and time, and bets every volunteer on rats being a perfect model of people.',
              },
            },
          ],
          simulation: {
            kind: 'dose-response',
            host: 'allocator',
            preview: 'on-commit',
            revealSeconds: 4,
            commitLabel: 'Project the first cohort',
            targetBand: 'standard',
            input: { categoryId: 'dose', min: 0.1, max: 5, step: 0.1, unit: 'mg/kg' },
            curves: [
              {
                id: 'exposure',
                label: 'Projected exposure',
                unit: '% of target',
                format: 'integer',
                points: [
                  [0.1, 3],
                  [0.3, 10],
                  [0.5, 25],
                  [0.8, 45],
                  [1.5, 80],
                  [2, 110],
                  [5, 260],
                ],
              },
            ],
            bands: [
              {
                tag: 'cautious',
                label: 'Very cautious',
                range: [0.1, 0.3],
                narration:
                  "Dose's projection: all six volunteers fine. Drug levels barely measurable. You would need extra cohorts before learning anything.",
                meters: { timeline: -5 },
                consequence:
                  'A start far below the standard margin adds months and cost, and still teaches nothing about safety at useful doses.',
                visual: { cohort: 6, fine: 6, mild: 0, serious: 0, exposureCurve: 'exposure' },
              },
              {
                tag: 'standard',
                label: 'Standard (HED ÷ 10)',
                range: [0.3, 0.8],
                narration:
                  "Dose's projection: all six volunteers fine. Blood levels measurable and well below the animal NOAEL. Escalation can begin.",
                visual: { cohort: 6, fine: 6, mild: 0, serious: 0, exposureCurve: 'exposure' },
              },
              {
                tag: 'aggressive',
                label: 'Aggressive',
                range: [0.8, 2],
                narration:
                  "Dose's projection: one volunteer reports nausea and one shows a mild rise in liver enzymes. Dosing would pause for review.",
                meters: { safety: -5, timeline: -5 },
                consequence:
                  'A start above the standard margin turns the first cohort into the safety experiment.',
                visual: { cohort: 6, fine: 4, mild: 2, serious: 0, exposureCurve: 'exposure' },
              },
              {
                tag: 'reckless',
                label: 'No safety factor',
                range: [2, 5],
                narration:
                  "Dose's projection: one volunteer admitted with liver enzymes far above the limit. The study stops. The regulator opens a review.",
                meters: { safety: -10, timeline: -10 },
                consequence:
                  'This is the scenario the safety factor exists to prevent. Real first-in-human trials have injured volunteers this way.',
                visual: { cohort: 6, fine: 2, mild: 3, serious: 1, exposureCurve: 'exposure' },
              },
            ],
          },
        },
      },
    ],
    emits: [
      {
        key: 'dose.starting',
        outcomes: [
          { tag: 'cautious', when: { stageId: 'dose', band: 'cautious' } },
          { tag: 'standard', when: { stageId: 'dose', band: 'standard' } },
          { tag: 'aggressive', when: { stageId: 'dose', band: 'aggressive' } },
          { tag: 'reckless', when: { stageId: 'dose', band: 'reckless' } },
        ],
        data: { mgPerKg: 'inputValue' },
      },
    ],
    debrief: {
      learned:
        'Animal studies find the highest dose with no harmful effect (the NOAEL) and the organs at risk. The first human dose sits well below that, with a safety factor of at least 10.',
      handoffLine:
        'You hand the safety data and your starting dose to the CMC Scientist. That dose will follow you into World 4.',
    },
  },

  // ------------------------------------------------------------------ w1-l4 CMC Scientist
  {
    id: 'w1-l4',
    worldId: 'w1',
    roleId: 'cmc-scientist',
    title: 'Make it a medicine',
    intro:
      'VX-101 is a white powder in a vial. Maya cannot swallow a powder. Build a product that is stable, safe to make, and identical every time, and be ready to prove it under [[gmp|GMP]].',
    meterFocus: 'integrity',
    stages: [
      {
        id: 'build',
        title: 'Build the product',
        brief: 'Tap a part, then tap the slot it belongs in. Not every part belongs anywhere.',
        game: {
          engine: 'builder',
          prompt: 'Assemble the VX-101 capsule and its quality controls.',
          seconds: 120,
          slots: [
            { id: 'form', label: 'Dosage form', hint: 'What the patient takes' },
            {
              id: 'excipient',
              label: 'Key excipient',
              hint: 'The inactive ingredient that controls release',
            },
            { id: 'test', label: 'Batch release test', hint: 'What proves each batch is right' },
            { id: 'storage', label: 'Storage condition', hint: 'What goes on the label' },
          ],
          parts: [
            {
              id: 'capsule',
              text: 'Hard capsule, 50 mg VX-101',
              slotId: 'form',
              conceptId: 'formulation',
              explanation:
                'A capsule suits a daily medicine taken at home and protects a molecule that dislikes water.',
              consequence: 'The wrong dosage form means a medicine patients cannot or will not take.',
            },
            {
              id: 'iv-bag',
              text: 'IV infusion bag',
              conceptId: 'formulation',
              explanation:
                'An infusion needs a clinic visit. Fine for a hospital drug, wrong for a daily home medicine.',
              consequence: 'Patients stop taking medicines that are hard to take.',
            },
            {
              id: 'lactose-coat',
              text: 'Lactose filler with a slow-release coating',
              slotId: 'excipient',
              conceptId: 'excipient',
              explanation:
                'The filler gives the capsule bulk; the coating controls how fast VX-101 dissolves.',
              consequence:
                'The wrong [[excipient]] makes a drug absorb too fast, too slow, or fall apart in the bottle.',
            },
            {
              id: 'sugar-syrup',
              text: 'Sugar syrup base',
              conceptId: 'stability',
              explanation: 'VX-101 breaks down in water. A syrup would lose strength on the shelf.',
              consequence: 'Drug that degrades in storage loses effect or forms harmful by-products.',
            },
            {
              id: 'assay-dissolution',
              text: 'Assay and [[dissolution]] test on every batch',
              slotId: 'test',
              conceptId: 'gmp',
              explanation:
                'The assay proves how much drug is there; dissolution proves it will be released as designed.',
              consequence: 'A batch released without testing can be under-dosed, over-dosed, or inert.',
            },
            {
              id: 'visual-only',
              text: 'Visual inspection only',
              conceptId: 'gmp',
              explanation: 'Looking at a capsule tells you nothing about what is inside it.',
              consequence: 'Regulators can shut a facility for releasing batches without proper testing.',
            },
            {
              id: 'below-25',
              text: 'Store below 25 °C, protect from light (6-month stability data)',
              slotId: 'storage',
              conceptId: 'stability',
              explanation:
                'Storage instructions come from your own [[stability|stability study]] on this product.',
              consequence: 'A storage claim without data behind it is a label nobody can trust.',
            },
            {
              id: 'borrowed-stability',
              text: 'Use stability data from a similar molecule; skip the 6-month study',
              conceptId: 'stability',
              shortcut: {
                meters: { timeline: 10, integrity: -15 },
                why: 'Six months saved. And a shelf life you cannot prove when the inspector asks.',
              },
              explanation: 'Stability is product-specific. A similar molecule is not this one.',
              consequence:
                'Borrowed stability data is a common inspection finding and can void a whole batch.',
            },
          ],
        },
      },
    ],
    debrief: {
      learned:
        '[[cmc|CMC]] turns a molecule into a product: the right formulation, proven stability, and batches made and tested under GMP. Every batch must be identical and documented.',
      handoffLine:
        'You hand stable VX-101 capsules and their batch records to the trial team. World 1 is almost complete.',
    },
  },
];
