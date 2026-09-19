import type { Level } from '../../types';

/** World 2 — Designing the Trial. Five levels; w2-l1 starts artifact chain (a). */
export const w2Levels: Level[] = [
  // ------------------------------------------------------------------ w2-l1 Clinical Scientist
  {
    id: 'w2-l1',
    worldId: 'w2',
    roleId: 'clinical-scientist',
    title: 'Write the protocol',
    intro:
      'VX-101 needs a plan before it meets a patient. Build the core of the Phase I [[protocol]]: what it asks, what it measures, who may join, and how the answer stays honest.',
    meterFocus: 'integrity',
    stages: [
      {
        id: 'build',
        title: 'Build the protocol core',
        brief: 'Tap a part, then the slot it belongs in. Some parts belong nowhere.',
        game: {
          engine: 'builder',
          prompt: 'Assemble the four pillars of the VX-101 first-in-human protocol.',
          seconds: 95,
          slots: [
            { id: 'objective', label: 'Primary objective', hint: 'The one question this study must answer' },
            { id: 'endpoint', label: 'Primary endpoint', hint: 'The measurement that answers it' },
            { id: 'criteria', label: 'Eligibility criteria', hint: 'Who may join, who may not' },
            { id: 'design', label: 'Design', hint: 'How the comparison stays fair' },
          ],
          parts: [
            {
              id: 'obj-safety',
              text: 'Assess safety and tolerability of single doses in healthy volunteers',
              slotId: 'objective',
              confirm: 'Right: Phase I asks "is it safe?", not "does it work?"',
              conceptId: 'phase-1',
              explanation:
                'A first-in-human study exists to learn safety, tolerability and [[pharmacokinetics|PK]]. Efficacy comes later.',
              consequence: 'A Phase I built to prove efficacy is underpowered for both questions.',
            },
            {
              id: 'obj-cure',
              text: 'Show that VX-101 cures Veridian Syndrome',
              conceptId: 'phase-1',
              explanation:
                'No single study "cures" anything, and Phase I volunteers do not even have the disease.',
              consequence: 'Overreaching objectives get protocols rejected and hopes raised for nothing.',
            },
            {
              id: 'ep-ae',
              text: 'Frequency and severity of [[adverse-event|adverse events]] through day 28',
              slotId: 'endpoint',
              confirm: 'Yes: a measurable, pre-specified safety endpoint.',
              conceptId: 'primary-endpoint',
              explanation:
                'A [[primary-endpoint|primary endpoint]] is one pre-specified measurement. For a safety study, adverse events are it.',
              consequence: 'A vague endpoint lets anyone read the result however they like.',
            },
            {
              id: 'ep-feel',
              text: 'Whether volunteers say they feel better',
              conceptId: 'primary-endpoint',
              explanation:
                'Healthy volunteers have nothing to feel better from, and "better" is not a measurement.',
              consequence: 'Unmeasurable endpoints cannot be analysed, so the study proves nothing.',
            },
            {
              id: 'crit-balanced',
              text: 'Healthy adults 18–55, normal liver tests, no daily medicines',
              slotId: 'criteria',
              confirm: 'Balanced: safe to dose, still possible to recruit.',
              conceptId: 'eligibility-criteria',
              explanation:
                '[[eligibility-criteria|Eligibility criteria]] protect volunteers (liver is the target organ) without making recruitment impossible.',
              consequence:
                'Criteria set for the wrong reason either endanger volunteers or stall the study for a year.',
            },
            {
              id: 'crit-loose',
              text: 'Any adult who wants to join',
              conceptId: 'eligibility-criteria',
              shortcut: {
                meters: { timeline: 10, safety: -15 },
                why: 'Recruitment would fly. So would the risk to a volunteer with a quiet liver problem nobody checked.',
              },
              explanation:
                'With a liver signal in rats, dosing people with unknown liver health is not a shortcut, it is a gamble.',
              consequence:
                'Loose criteria put vulnerable people into a study that was never designed for them.',
            },
            {
              id: 'crit-tight',
              text: 'Healthy adults 25–35, non-smokers, BMI 20–24, no caffeine',
              conceptId: 'eligibility-criteria',
              explanation:
                'Every extra rule shrinks the pool. Some of these protect nobody; they just make the study slower.',
              consequence:
                'Over-tight criteria are the most common reason studies miss their enrolment dates.',
            },
            {
              id: 'design-blind',
              text: '[[randomization|Randomized]], [[placebo]]-controlled, [[blinding|double-blind]]',
              slotId: 'design',
              confirm: 'Yes: randomized, blinded, placebo-controlled.',
              conceptId: 'blinding',
              explanation:
                'Random assignment and blinding stop hope and habit from shaping what gets recorded as a side effect.',
              consequence: 'Unblinded safety data is argued over for years, because nobody can trust it.',
            },
            {
              id: 'design-open',
              text: 'Everyone gets VX-101; the doctor decides the dose',
              conceptId: 'blinding',
              explanation:
                'Without placebo you cannot tell a drug effect from a Tuesday. Without blinding, expectations leak in.',
              consequence: 'Open, unrandomized data cannot separate the drug from chance.',
            },
          ],
        },
      },
    ],
    emits: [
      {
        key: 'protocol.criteria',
        outcomes: [
          {
            tag: 'balanced',
            when: { stageId: 'build', chosePart: { slotId: 'criteria', partId: 'crit-balanced' } },
          },
          {
            tag: 'loose',
            when: { stageId: 'build', chosePart: { slotId: 'criteria', partId: 'crit-loose' } },
          },
          {
            tag: 'tight',
            when: { stageId: 'build', chosePart: { slotId: 'criteria', partId: 'crit-tight' } },
          },
        ],
      },
    ],
    debrief: {
      learned:
        'A protocol is the trial written down before it happens: one objective, one primary endpoint, clear eligibility, and a design that keeps the answer honest. Everyone downstream builds from it.',
      handoffLine:
        'You hand the draft protocol to the Biostatistician. Your eligibility criteria will follow the study all the way to the clinic.',
    },
  },

  // ------------------------------------------------------------------ w2-l2 Biostatistician
  {
    id: 'w2-l2',
    worldId: 'w2',
    roleId: 'biostatistician',
    title: 'How many people?',
    intro:
      'The Phase II plan needs a number: how many patients to randomize. Too few and a real effect hides in noise. Too many and you spend years you do not have. Set the sample size and watch what it buys.',
    meterFocus: 'integrity',
    stages: [
      {
        id: 'size',
        title: 'Set the sample size',
        brief: 'Dose will project the study you would get at that size.',
        game: {
          engine: 'allocator',
          prompt: 'Choose the number of patients for the Phase II study.',
          seconds: 90,
          context: [
            'Expected effect: 20 more fatigue-free days per year on VX-101 than placebo',
            'Target [[statistical-power|power]]: 80% or more, at a 5% false-positive rate',
            'Cost: about $60,000 per patient. Enrolment: about 8 patients per month',
          ],
          categories: [
            {
              id: 'n',
              label: 'Patients randomized',
              unit: 'patients',
              min: 40,
              max: 400,
              step: 10,
              initial: 100,
              target: [180, 260],
              conceptId: 'sample-size',
              explanation:
                'Around 200 patients gives roughly 80% power for this effect. Below that the study often misses a real effect; far above wastes years.',
              consequence:
                'Underpowered trials fail for no reason but arithmetic; oversized ones expose extra patients to placebo and delay every answer.',
            },
          ],
          presets: [
            {
              id: 'cut-half',
              label: 'Halve the study to hit the budget (100 patients)',
              values: { n: 100 },
              shortcut: {
                meters: { timeline: 15, integrity: -20 },
                why: 'Half the cost, half the time. And a coin flip whether a real effect ever shows up in the data.',
              },
            },
          ],
          simulation: {
            kind: 'trial-power',
            host: 'allocator',
            preview: 'live',
            revealSeconds: 3,
            commitLabel: 'Run 100 imaginary trials',
            targetBand: 'powered',
            input: { categoryId: 'n', min: 40, max: 400, step: 10, unit: 'patients' },
            curves: [
              {
                id: 'power',
                label: 'Power',
                unit: '',
                format: 'percent',
                points: [
                  [40, 22],
                  [100, 46],
                  [160, 68],
                  [200, 80],
                  [260, 89],
                  [400, 98],
                ],
              },
              {
                id: 'cost',
                label: 'Cost',
                unit: '',
                format: 'money',
                points: [
                  [40, 2.4],
                  [400, 24],
                ],
              },
              {
                id: 'months',
                label: 'Enrolment',
                unit: 'months',
                format: 'integer',
                points: [
                  [40, 5],
                  [400, 50],
                ],
              },
            ],
            bands: [
              {
                tag: 'underpowered',
                label: 'Underpowered',
                range: [40, 140],
                narration:
                  "Dose's projection: of 100 trials this size, fewer than half find the effect that is really there. The rest end 'inconclusive'.",
                meters: { integrity: -10, timeline: -5 },
                consequence: 'An underpowered trial is a very expensive way to learn nothing.',
                visual: { power: 40, costMillions: 6, months: 13, successfulRunsOf100: 40 },
              },
              {
                tag: 'marginal',
                label: 'Marginal',
                range: [140, 180],
                narration:
                  "Dose's projection: about two trials in three find the effect. One in three misses it and the programme stalls.",
                meters: { integrity: -5 },
                consequence: 'A one-in-three chance of a false failure is a bet most sponsors regret.',
                visual: { power: 70, costMillions: 9.6, months: 20, successfulRunsOf100: 70 },
              },
              {
                tag: 'powered',
                label: 'Adequately powered',
                range: [180, 260],
                narration:
                  "Dose's projection: 80 to 89 of 100 trials find the effect. About 27 months and $13 million. This is the study you can defend.",
                visual: { power: 84, costMillions: 13, months: 27, successfulRunsOf100: 84 },
              },
              {
                tag: 'oversized',
                label: 'Oversized',
                range: [260, 400],
                narration:
                  "Dose's projection: the effect is found almost every time, but enrolment takes four years and hundreds more patients get placebo.",
                meters: { timeline: -10 },
                consequence:
                  'Exposing more patients than needed to placebo is an ethical cost, not just a financial one.',
                visual: { power: 96, costMillions: 20, months: 42, successfulRunsOf100: 96 },
              },
            ],
          },
        },
      },
    ],
    debrief: {
      learned:
        '[[sample-size|Sample size]] comes from the effect you expect, the noise you expect, and the power you want. Too small and real effects vanish; too big and patients and years are wasted. The [[sap|SAP]] fixes the analysis before the data exist.',
      handoffLine:
        'You hand the sample size and the statistical plan to the Regulatory Affairs Specialist for the filing.',
    },
  },

  // ------------------------------------------------------------------ w2-l3 Regulatory Affairs Specialist
  {
    id: 'w2-l3',
    worldId: 'w2',
    roleId: 'regulatory-affairs-specialist',
    title: 'Permission to begin',
    intro:
      'Nothing is dosed until the regulator allows it. In the US that is an [[ind|IND]]; in the EU a [[cta|CTA]]. Put the steps in the order that gets VX-101 to its first volunteer without a rejection.',
    meterFocus: 'integrity',
    shortcutPrompt: {
      id: 'skip-meeting',
      offer:
        'Dose: "The pre-submission meeting takes six weeks to book. We could file cold and answer questions later."',
      accept: {
        meters: { timeline: 10, integrity: -10 },
        why: 'Filing cold saves six weeks, and gives the reviewer nothing but surprises. Surprises become questions, and questions become a hold.',
      },
    },
    stages: [
      {
        id: 'order',
        title: 'Order the filing',
        brief: 'Move each step up or down, then check.',
        game: {
          engine: 'sequence-sort',
          prompt: 'Put the road to first dose in order.',
          seconds: 80,
          items: [
            {
              id: 'pre-meeting',
              text: 'Meet the regulator before filing to agree what the package needs',
              conceptId: 'pre-ind-meeting',
              explanation:
                'A [[pre-ind-meeting|pre-submission meeting]] settles what the agency expects before you spend months assembling it.',
              consequence: 'Filing without alignment is the top cause of avoidable holds.',
            },
            {
              id: 'assemble',
              text: "Assemble the package: nonclinical data, CMC, protocol, [[investigators-brochure|Investigator's Brochure]]",
              conceptId: 'ind',
              explanation:
                'The IND or CTA is the whole story so far: animal safety, how the drug is made, and the plan for people.',
              consequence: 'A package with a missing section is not reviewed; it is returned.',
            },
            {
              id: 'submit',
              text: 'Submit the IND (US) or CTA (EU) electronically',
              conceptId: 'cta',
              explanation:
                'Submission starts the clock. In the US, 30 days; in the EU, a fixed assessment timetable.',
              consequence: 'Submitting before the package is complete resets the clock.',
            },
            {
              id: 'wait',
              text: 'Wait out the review period and answer any questions',
              conceptId: 'clinical-hold',
              explanation:
                'In the US the study may start after 30 days unless the FDA objects. In the EU you wait for an authorisation.',
              consequence: 'Dosing during the review period is illegal and ends careers.',
            },
            {
              id: 'irb',
              text: 'Get ethics approval for the site, then dose the first volunteer',
              conceptId: 'irb',
              explanation:
                'Regulator approval is not ethics approval. The [[irb|IRB or ethics committee]] must also say yes before anyone is dosed.',
              consequence:
                'A site dosing without ethics approval is a critical finding that can void the whole study.',
            },
          ],
        },
      },
    ],
    debrief: {
      learned:
        "The IND (US) or CTA (EU) is the regulator's permission to test a drug in people. Align first, file complete, wait the clock, and get ethics approval before the first dose.",
      handoffLine:
        'You hand the filed package to the IRB / Ethics Committee, who read the consent form next.',
    },
  },

  // ------------------------------------------------------------------ w2-l4 IRB / Ethics Committee Member
  {
    id: 'w2-l4',
    worldId: 'w2',
    roleId: 'irb-member',
    title: 'Read the consent form',
    intro:
      "The sponsor's [[informed-consent|consent form]] is on your desk. Volunteers will sign it before they are dosed. One section would mislead them. Find it before they do.",
    meterFocus: 'safety',
    stages: [
      {
        id: 'consent',
        title: 'Review the consent form',
        brief: 'Tap a section to read it. Accuse the one that misleads a volunteer.',
        game: {
          engine: 'spot-the-impostor',
          prompt: 'Which section of the consent form must not go to volunteers as written?',
          seconds: 100,
          targetLabel: 'the misleading section',
          cards: [
            {
              id: 'purpose',
              title: 'Purpose',
              lines: [
                'This study tests the safety of VX-101 in healthy people',
                'It is not designed to treat any condition',
              ],
              conceptId: 'informed-consent',
              explanation: 'Clear, honest and at a reading level anyone can follow.',
              consequence: 'Accusing a good section wastes review time and delays a fair study.',
            },
            {
              id: 'risks',
              title: 'Risks',
              lines: [
                'Animal studies showed liver changes at high doses',
                'Your liver will be tested at every visit',
                'Unknown risks may exist',
              ],
              conceptId: 'informed-consent',
              explanation:
                'Known risks stated plainly, unknown risks admitted. This is what a risk section should do.',
              consequence: 'Hiding the liver signal here would be the ethical failure, not stating it.',
            },
            {
              id: 'benefits',
              title: 'Benefits',
              lines: [
                'You will receive a proven treatment for Veridian Syndrome',
                'Most participants experience improvement',
              ],
              impostor: true,
              confirm: 'Found it: healthy volunteers get no treatment benefit.',
              conceptId: 'therapeutic-misconception',
              explanation:
                'Nothing is proven, and healthy volunteers have nothing to improve. This is [[therapeutic-misconception|therapeutic misconception]] in writing.',
              consequence:
                'Consent obtained with a false promise is not consent. Regulators can invalidate every enrolment.',
            },
            {
              id: 'withdraw',
              title: 'Your rights',
              lines: [
                'You may leave the study at any time',
                'Leaving will not affect your care',
                'Your data stays confidential',
              ],
              conceptId: 'informed-consent',
              explanation: 'Voluntary, revocable, confidential: the core rights, stated in plain words.',
              consequence: 'Removing any of these rights would break [[gcp|GCP]] and the law.',
            },
            {
              id: 'payment',
              title: 'Payment',
              lines: [
                'You will be paid $75 per visit for your time',
                'Payment is not linked to completing the study',
              ],
              conceptId: 'undue-influence',
              explanation:
                'Modest, per-visit, not tied to completion: this avoids [[undue-influence|undue influence]].',
              consequence: 'A large completion bonus pressures people to stay when they should leave.',
            },
          ],
          signOff: {
            id: 'approve-unread',
            label: "Approve it; the sponsor's lawyers already checked",
            shortcut: {
              meters: { timeline: 10, safety: -20 },
              why: 'Lawyers protect the sponsor. The committee exists to protect the volunteer. Nobody else reads it for them.',
            },
          },
        },
      },
    ],
    debrief: {
      learned:
        'An ethics committee protects participants: consent must be honest about purpose, risks, benefits and rights, in words a person can understand. Promising a benefit that does not exist is the classic failure.',
      handoffLine:
        'You return the corrected consent form to the sponsor and hand your approval to the Portfolio Lead, who decides whether the money flows.',
    },
  },

  // ------------------------------------------------------------------ w2-l5 Portfolio / Finance Lead
  {
    id: 'w2-l5',
    worldId: 'w2',
    roleId: 'portfolio-lead',
    title: 'Go or no-go',
    intro:
      'VX-101 is one of six programmes fighting for the same money. You have $30 million for the next 18 months. Fund what the Phase I actually needs, keep a reserve, and leave the rest of the pipeline alive.',
    meterFocus: 'timeline',
    stages: [
      {
        id: 'budget',
        title: 'Split the budget',
        brief: 'The sliders must add up to $30M. Every line has a range the plan can live with.',
        game: {
          engine: 'allocator',
          prompt: 'Allocate $30 million across the next 18 months.',
          seconds: 90,
          total: 30,
          context: [
            'Phase I clinical costs (site, volunteers, labs): needs $8–10M',
            'Drug manufacturing for Phase I and II: needs $6–8M',
            'Reserve for surprises (a hold, a repeat study): keep $3–5M',
            'Other pipeline programmes: at least $9M or two of them stop',
          ],
          categories: [
            {
              id: 'clinical',
              label: 'Phase I clinical',
              unit: '$M',
              min: 0,
              max: 30,
              step: 1,
              initial: 12,
              target: [8, 10],
              conceptId: 'go-no-go',
              explanation:
                'The study costs what it costs. Below $8M it cannot run; above $10M you are paying for nothing.',
              consequence: 'Starving the study delays first dose; gilding it starves everything else.',
            },
            {
              id: 'cmc',
              label: 'Manufacturing',
              unit: '$M',
              min: 0,
              max: 30,
              step: 1,
              initial: 4,
              target: [6, 8],
              conceptId: 'cmc',
              explanation:
                'Phase II needs drug made months before it starts. Underfunding it here creates a gap next year.',
              consequence:
                'Studies have waited a year for drug supply because manufacturing was cut to save cash.',
            },
            {
              id: 'reserve',
              label: 'Reserve',
              unit: '$M',
              min: 0,
              max: 30,
              step: 1,
              initial: 2,
              target: [3, 5],
              conceptId: 'go-no-go',
              explanation:
                'Something always goes wrong. A reserve turns a crisis into a delay instead of a cancellation.',
              consequence: 'Programmes with no reserve die at the first clinical hold.',
            },
            {
              id: 'pipeline',
              label: 'Rest of pipeline',
              unit: '$M',
              min: 0,
              max: 30,
              step: 1,
              initial: 12,
              target: [9, 13],
              conceptId: 'attrition',
              explanation:
                'Most programmes fail. A portfolio survives by keeping several alive, not by betting everything on one.',
              consequence: 'Betting the company on one molecule is how companies disappear.',
            },
          ],
          presets: [
            {
              id: 'all-in',
              label: 'All-in on VX-101: cancel the reserve and the other programmes',
              values: { clinical: 14, cmc: 12, reserve: 0, pipeline: 4 },
              shortcut: {
                meters: { timeline: 15, integrity: -15 },
                why: 'VX-101 would move fast for a year. Then one bad rat study, and there is nothing left to fall back on.',
              },
            },
          ],
        },
      },
    ],
    debrief: {
      learned:
        'A [[go-no-go|go / no-go]] decision weighs one programme against the whole pipeline. Fund what the study needs, keep a reserve, and remember that most molecules fail.',
      handoffLine:
        'You hand the approved budget and timeline to the Clinical Project Manager. World 2 is nearly done.',
    },
  },
];
