import type { Level } from '../../types';

/**
 * World 4 — Phase I. The clinical hold (w4-l4) ALWAYS happens; artifacts change only its cause,
 * severity and copy (SPEC Amendment 1). w4-l1 continues chain (a), w4-l2 starts chain (b),
 * w4-l3 continues chain (c).
 */
export const w4Levels: Level[] = [
  // ------------------------------------------------------------------ w4-l1 Principal Investigator
  {
    id: 'w4-l1',
    worldId: 'w4',
    roleId: 'principal-investigator',
    title: 'Screen the volunteers',
    intro:
      'Six healthy volunteers are in the waiting room for [[screening]]. The protocol says 18–55, normal liver tests, no daily medicines. Decide who is eligible. The liver rule exists because of what the rats showed.',
    meterFocus: 'safety',
    stages: [
      {
        id: 'screen',
        title: 'Apply the criteria',
        brief: 'Eligible, not eligible, or ask the sponsor before deciding?',
        game: {
          engine: 'bucket-sort',
          prompt: 'Screen each volunteer against the protocol.',
          seconds: 75,
          buckets: [
            { id: 'eligible', label: 'Eligible', hint: 'Meets every criterion' },
            { id: 'not-eligible', label: 'Not eligible', hint: 'Fails a criterion: a screen failure' },
            { id: 'query', label: 'Ask the sponsor', hint: 'The protocol does not say; get it in writing' },
            {
              id: 'enrol-anyway',
              label: 'Enrol, note it later',
              hint: 'Keep the cohort on schedule',
              shortcut: {
                meters: { timeline: 10, safety: -15 },
                why: 'The cohort doses tomorrow. A borderline volunteer enrolled today becomes an eligibility deviation next week, or a liver case.',
              },
            },
          ],
          cards: [
            {
              id: 'v-clean',
              text: 'Age 31, all labs normal, takes no medicines',
              bucketId: 'eligible',
              confirm: 'Eligible: meets every criterion.',
              conceptId: 'eligibility-criteria',
              explanation:
                'Every criterion met and documented in the [[source-document|source]]. This is what eligible looks like.',
              consequence: 'Turning away eligible volunteers stalls the cohort for no reason.',
            },
            {
              id: 'v-alt',
              text: 'Age 44, [[alt|ALT]] 1.4 times the upper limit, feels fine',
              bucketId: 'not-eligible',
              confirm: 'Not eligible: the liver rule is the whole point.',
              conceptId: 'screen-failure',
              explanation:
                '"Normal liver tests" means normal. A raised ALT is a [[screen-failure|screen failure]], however well he feels.',
              consequence:
                'Dosing a volunteer with a raised liver enzyme in a study with a liver signal is how volunteers get hurt.',
            },
            {
              id: 'v-age',
              text: 'Age 57, labs normal, no medicines',
              bucketId: 'not-eligible',
              confirm: 'Not eligible: 57 is outside 18–55.',
              conceptId: 'eligibility-criteria',
              explanation: 'Two years over the limit is over the limit. Criteria are not suggestions.',
              consequence: 'Age deviations are among the most common findings in Phase I inspections.',
            },
            {
              id: 'v-vitamin',
              text: 'Age 26, labs normal, takes a daily multivitamin',
              bucketId: 'query',
              confirm: 'Ask: the protocol does not define "medicine".',
              conceptId: 'protocol-clarification',
              explanation:
                'Is a vitamin a "daily medicine"? The protocol does not say. A written [[protocol-clarification|clarification]] settles it for every site.',
              consequence:
                'Sites deciding grey areas alone apply the protocol differently, and the data cannot be pooled.',
            },
            {
              id: 'v-consent',
              text: 'Age 38, labs normal, signed the consent form before the doctor explained the study',
              bucketId: 'not-eligible',
              confirm: 'Not eligible until consent is done properly.',
              conceptId: 'consent-process',
              explanation:
                'A signature before the explanation is not [[consent-process|informed consent]]. Re-consent first; only then can screening count.',
              consequence: 'Consent obtained out of order is a critical GCP finding.',
            },
          ],
        },
      },
    ],
    emits: [
      {
        key: 'screening.eligibility',
        outcomes: [
          { tag: 'lenient', when: { stageId: 'screen', tookShortcut: 'enrol-anyway' } },
          {
            tag: 'lenient',
            when: { stageId: 'screen', bucketOf: { itemId: 'v-alt', bucketId: 'eligible' } },
          },
          {
            tag: 'strict',
            when: { stageId: 'screen', bucketOf: { itemId: 'v-vitamin', bucketId: 'not-eligible' } },
          },
          { tag: 'standard', when: { stageId: 'screen', accuracyAtLeast: 0 } },
        ],
      },
    ],
    variants: [
      {
        when: { 'protocol.criteria': 'tight' },
        patch: {
          intro:
            "Six healthy volunteers are in the waiting room for [[screening]]. The protocol's criteria are tight: 18–55, normal liver tests, no daily medicines, and more. Expect screen failures. The liver rule exists because of what the rats showed.",
          meterOpening: { timeline: -5 },
        },
      },
      {
        when: { 'protocol.criteria': 'loose' },
        patch: {
          intro:
            "Six healthy volunteers are in the waiting room for [[screening]]. The protocol's criteria are loose, so the sponsor added a note: check liver tests anyway. You are the last line between the rat data and a person.",
          meterOpening: { safety: -5 },
        },
      },
      {
        when: { 'ecrf.fields': 'minimal' },
        patch: {
          stages: {
            screen: {
              brief:
                'The screening form has no liver field, so work from the paper lab reports. Eligible, not eligible, or ask the sponsor?',
            },
          },
        },
      },
      {
        when: { 'ecrf.fields': 'bloated' },
        patch: {
          stages: {
            screen: {
              brief:
                'Ninety fields per volunteer. Find the ones that matter. Eligible, not eligible, or ask the sponsor?',
            },
          },
          meterOpening: { timeline: -5 },
        },
      },
    ],
    debrief: {
      learned:
        'The investigator applies the criteria exactly as written, documents every decision in source records, and asks the sponsor in writing when the protocol is silent. Consent comes before anything else.',
      handoffLine:
        'You hand the eligible volunteers to the Study Coordinator for dosing day. How strictly you screened will follow the data to the monitor.',
    },
  },

  // ------------------------------------------------------------------ w4-l2 Clinical Research Coordinator / Study Nurse
  {
    id: 'w4-l2',
    worldId: 'w4',
    roleId: 'study-coordinator',
    title: 'Dosing day',
    intro:
      'Cohort 2 doses today. Each volunteer needs consent confirmed, vitals, the dose, and blood draws at exact times for [[pk-sampling|PK]]. One will report a headache. Get everyone through the right stations before their window closes.',
    meterFocus: 'integrity',
    stages: [
      {
        id: 'visit',
        title: 'Run the visit',
        brief: 'Tap a volunteer, then their stations in order. Blood draws have a time window.',
        game: {
          engine: 'dash-manager',
          prompt: 'Get every volunteer through dosing day correctly.',
          seconds: 110,
          stations: [
            { id: 'consent', label: 'Confirm consent' },
            { id: 'vitals', label: 'Vitals & labs' },
            { id: 'dose', label: 'Dose' },
            { id: 'draw', label: 'PK blood draw' },
            { id: 'ae-form', label: 'Record the AE' },
            {
              id: 'skip-ae',
              label: 'Note it verbally, skip the form',
              shortcut: {
                meters: { timeline: 10, integrity: -15 },
                why: 'A headache is nothing, until the safety team needs to know whether it was one headache or six. The form is how they find out.',
              },
            },
          ],
          items: [
            {
              id: 'vol-a',
              label: 'Volunteer A: first visit',
              steps: ['consent', 'vitals', 'dose', 'draw'],
              patienceSeconds: 45,
              arrivesAt: 0,
              conceptId: 'consent-process',
              explanation:
                'Consent is confirmed at every visit, vitals before dosing, then the dose, then the timed draw.',
              consequence: 'A missed pre-dose vital sign leaves the safety data without a baseline.',
            },
            {
              id: 'vol-b',
              label: 'Volunteer B: dosing visit',
              steps: ['vitals', 'dose', 'draw'],
              patienceSeconds: 40,
              arrivesAt: 10,
              conceptId: 'pk-sampling',
              explanation:
                'The [[pk-sampling|PK draw]] must land inside its window or the concentration point is lost.',
              consequence: 'A late draw distorts the PK curve the pharmacologist reads tomorrow.',
            },
            {
              id: 'vol-c',
              label: 'Volunteer C: reports a headache',
              steps: ['vitals', 'ae-form', 'draw'],
              patienceSeconds: 40,
              arrivesAt: 22,
              conceptId: 'adverse-event',
              explanation:
                'Any complaint is an [[adverse-event|adverse event]]: record it with onset, severity and what was done, then continue.',
              consequence: 'Unrecorded events make the safety picture look cleaner than it is.',
            },
            {
              id: 'draw-4h',
              label: 'Cohort 4-hour draw window',
              steps: ['draw'],
              patienceSeconds: 25,
              arrivesAt: 40,
              conceptId: 'pk-sampling',
              explanation: 'Timed draws are the whole point of the visit. The window does not wait.',
              consequence: 'Missing the window means a cohort without a 4-hour point.',
            },
          ],
        },
      },
    ],
    emits: [
      {
        key: 'ae.report',
        outcomes: [
          { tag: 'incomplete', when: { stageId: 'visit', tookShortcut: 'skip-ae' } },
          { tag: 'complete', when: { stageId: 'visit', accuracyAtLeast: 0 } },
        ],
      },
    ],
    debrief: {
      learned:
        'The coordinator makes the protocol happen: consent confirmed, vitals before dose, draws on the clock, and every complaint recorded as an adverse event with the details the safety team will need.',
      handoffLine:
        'You hand the timed samples and the adverse event forms to the Clinical Pharmacologist. Whether the headache was recorded properly follows the data into World 5.',
    },
  },

  // ------------------------------------------------------------------ w4-l3 Clinical Pharmacologist
  {
    id: 'w4-l3',
    worldId: 'w4',
    roleId: 'clinical-pharmacologist',
    title: 'Read the curve, choose the dose',
    intro:
      "Cohort 2's [[pharmacokinetics|PK]] results are in. Read what the curve says and set the rule that stops [[dose-escalation|escalation]]. Then choose cohort 3's dose, and Dose will project the exposure before anyone is dosed.",
    meterFocus: 'safety',
    stages: [
      {
        id: 'read',
        title: 'Read cohort 2',
        brief: 'Tap a part, then its slot. Read the curve, not the hope.',
        weight: 1,
        game: {
          engine: 'builder',
          prompt: 'What does cohort 2 show, and what ends escalation?',
          seconds: 60,
          slots: [
            { id: 'reading', label: 'What cohort 2 shows' },
            { id: 'rule', label: 'Stopping rule', hint: 'What ends escalation' },
          ],
          parts: [
            {
              id: 'read-linear',
              text: 'Exposure doubled when the dose doubled; [[half-life]] about 8 hours; peak at 50% of the ceiling',
              slotId: 'reading',
              confirm: 'Right: predictable, with room above.',
              conceptId: 'exposure',
              explanation:
                'Doubling exposure with doubling dose means the next step is predictable. Half the ceiling leaves margin.',
              consequence: 'Misreading the curve is how a cohort is dosed past the ceiling.',
            },
            {
              id: 'read-flat',
              text: 'Exposure barely changed with dose; the drug is not being absorbed',
              conceptId: 'exposure',
              explanation: 'The data show a clean doubling. Calling it flat would justify a dangerous jump.',
              consequence: 'A false "flat" reading is the classic prelude to an overdose cohort.',
            },
            {
              id: 'rule-stop',
              text: 'Stop if any volunteer has a Grade 2 or worse event, or exposure exceeds the ceiling',
              slotId: 'rule',
              confirm: 'Yes: a stopping rule written before the data.',
              conceptId: 'stopping-rule',
              explanation:
                'A [[stopping-rule|stopping rule]] fixed in advance takes the decision out of the moment.',
              consequence: 'Without a rule, escalation continues on optimism.',
            },
            {
              id: 'rule-vibes',
              text: 'Stop when the investigator feels uncomfortable',
              conceptId: 'stopping-rule',
              explanation: 'Discomfort is not a criterion. The rule must name a grade and a number.',
              consequence: 'Vague stopping rules are why escalations go one cohort too far.',
            },
          ],
        },
      },
      {
        id: 'escalate',
        title: 'Choose cohort 3',
        brief: 'Pick the step, then project the exposure. Your first projection counts.',
        weight: 2,
        game: {
          engine: 'builder',
          prompt: 'How big a step for cohort 3?',
          seconds: 60,
          sandbox: true,
          slots: [{ id: 'next-dose', label: 'Cohort 3 dose', hint: 'Cohort 2 peaked at 50% of the ceiling' }],
          parts: [
            {
              id: 'dose-slow',
              text: 'Small step: 1.5 times cohort 2',
              slotId: 'next-dose',
              conceptId: 'dose-escalation',
              explanation: 'Safe, and slow. With this much margin it costs an extra cohort and a month.',
              consequence: 'Steps that are too small add cohorts and expose more volunteers overall.',
            },
            {
              id: 'dose-standard',
              text: 'Standard step: double cohort 2',
              slotId: 'next-dose',
              confirm: 'Standard: predicted peak at 80% of the ceiling.',
              conceptId: 'dose-escalation',
              explanation: 'A doubling from 50% lands near 80% of the ceiling: measurable, with margin.',
              consequence: 'This is the step the escalation plan was written for.',
            },
            {
              id: 'dose-fast',
              text: 'Big step: 3.3 times cohort 2',
              slotId: 'next-dose',
              conceptId: 'dose-escalation',
              explanation: 'From 50%, 3.3 times lands well above the ceiling. The curve told you that.',
              consequence: 'Over-shooting the ceiling is how liver signals appear in cohort 3.',
            },
            {
              id: 'dose-effective',
              text: 'Jump straight to the dose expected to work in patients',
              conceptId: 'dose-escalation',
              shortcut: {
                meters: { timeline: 15, safety: -20 },
                why: 'Two cohorts saved. The whole point of escalation is that nobody knows what happens between here and there.',
              },
              explanation:
                'Escalation exists because the model is a guess. Skipping steps is skipping the safety data.',
              consequence:
                'Jumping to the target dose has caused serious harm in real first-in-human studies.',
            },
          ],
          simulation: {
            kind: 'pk-next-dose',
            host: 'builder',
            slotId: 'next-dose',
            preview: 'on-commit',
            revealSeconds: 4,
            commitLabel: 'Project cohort 3 exposure',
            targetBand: 'standard',
            bands: [
              {
                tag: 'slow',
                label: 'Small step',
                parts: ['dose-slow'],
                narration:
                  "Dose's projection: peak exposure at 60% of the ceiling. Safe, and you will need an extra cohort to reach a useful dose.",
                meters: { timeline: -5 },
                consequence: 'Small steps cost months and expose more volunteers overall.',
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
                parts: ['dose-standard'],
                narration:
                  "Dose's projection: peak exposure at 80% of the ceiling. Measurable, with margin. The stopping rule stays untouched.",
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
                label: 'Big step',
                parts: ['dose-fast', 'dose-effective'],
                narration:
                  "Dose's projection: peak exposure at 130% of the ceiling. One volunteer's liver enzymes rise. Dosing stops for review.",
                meters: { safety: -10, timeline: -5 },
                consequence: 'A step that overshoots the ceiling turns cohort 3 into the safety experiment.',
                visual: {
                  exposure: 130,
                  safetyCeiling: 100,
                  points: [
                    { t: 0, c: 0 },
                    { t: 1, c: 95 },
                    { t: 2, c: 130 },
                    { t: 4, c: 90 },
                    { t: 8, c: 35 },
                    { t: 12, c: 12 },
                  ],
                },
              },
            ],
          },
        },
      },
    ],
    emits: [
      {
        key: 'phase1.escalation',
        outcomes: [
          { tag: 'slow', when: { stageId: 'escalate', band: 'slow' } },
          { tag: 'standard', when: { stageId: 'escalate', band: 'standard' } },
          { tag: 'fast', when: { stageId: 'escalate', band: 'fast' } },
        ],
      },
    ],
    debrief: {
      learned:
        'Clinical pharmacology reads exposure, not just dose: how much drug reaches the blood, how fast it clears, and how far below the safety ceiling the next step lands. Stopping rules are written before the data.',
      handoffLine:
        "You hand the cohort 3 plan to the Safety Review Committee. Your step size, and the Toxicologist's starting dose, are about to matter.",
    },
  },

  {
    id: 'w4-l4',
    worldId: 'w4',
    roleId: 'safety-review-committee',
    title: 'Clinical hold',
    meterFocus: 'safety',
    // Base = 'standard' starting dose and 'standard' escalation. The cause is independent of the player's dose.
    intro:
      "Cohort 3 was dosed this morning. One volunteer's [[alt|ALT]] (a liver enzyme) is four times the upper limit. He feels fine. The [[fda|FDA]] has placed the study on [[clinical-hold|clinical hold]]. You chair the Safety Review Committee.",
    stages: [
      {
        id: 'scenario',
        title: 'Resolve the hold',
        brief: 'Stop, investigate, amend, respond. Every choice has a cost.',
        game: {
          engine: 'branching-scenario',
          start: 'n-data',
          nodes: [
            {
              id: 'n-data',
              speaker: 'Study physician',
              text: 'One volunteer, one lab value, no symptoms. The rest of cohort 3 is due back for their next visit tomorrow. Your call as chair.',
              choices: [
                {
                  id: 'c-pause',
                  text: 'Pause all dosing and convene the committee today',
                  quality: 'best',
                  next: 'n-workup',
                  meters: { safety: 5 },
                  conceptId: 'safety-pharmacology',
                  explanation:
                    'A liver signal in a first-in-human study stops dosing until it is understood. That is what stopping rules are for.',
                  consequence: 'Dosing through a signal is how a warning becomes an injury.',
                },
                {
                  id: 'c-continue',
                  text: 'Dose the rest of cohort 3 tomorrow; one lab value is not a pattern',
                  quality: 'bad',
                  next: 'n-workup-2',
                  meters: { safety: -15 },
                  conceptId: 'safety-pharmacology',
                  explanation:
                    'You do not yet know whether this is the drug. Until you do, nobody else gets it.',
                  consequence:
                    'Volunteers dosed after an unexplained liver signal have been seriously harmed in real studies.',
                },
                {
                  id: 'c-stop-all',
                  text: 'Stop the whole programme and tell the board it is over',
                  quality: 'ok',
                  next: 'n-board',
                  meters: { timeline: -10 },
                  conceptId: 'phase-1',
                  explanation:
                    'A hold is a pause, not a verdict. Most holds are lifted once the sponsor answers the questions.',
                  consequence:
                    'Abandoning a programme at the first signal throws away the years and patients behind it.',
                },
              ],
            },
            {
              id: 'n-board',
              speaker: 'Board chair',
              text: 'You want to end a programme over one lab value in one volunteer, before the workup? Reconsider.',
              choices: [
                {
                  id: 'c-board-pause',
                  text: 'Fair. Pause dosing, run the workup, decide with data.',
                  quality: 'best',
                  next: 'n-workup',
                  conceptId: 'phase-1',
                  explanation: 'Decisions this big are made on evidence, not on the first alarm.',
                  consequence: 'Panic decisions cost programmes; so does bravado.',
                },
                {
                  id: 'c-board-stop',
                  text: 'No. I am not risking another volunteer. End it.',
                  quality: 'ok',
                  next: 'end-abandoned',
                  meters: { timeline: -30 },
                  conceptId: 'attrition',
                  explanation:
                    'Caution is a virtue, but ending a programme is not the only safe option. Pausing is.',
                  consequence: 'Patients like Maya lose a candidate that might have been fixed.',
                },
              ],
            },
            {
              id: 'n-workup',
              speaker: 'Study physician',
              text: 'The volunteer is admitted for observation. What do you order?',
              choices: [
                {
                  id: 'c-full',
                  text: "Full workup: repeat liver panel, hepatitis screen, alcohol and medication history, and his cohort's drug levels",
                  quality: 'best',
                  next: 'n-amend',
                  conceptId: 'pharmacokinetics',
                  explanation:
                    'To blame or clear the drug you must rule out the common causes and see how much drug was in his blood.',
                  consequence:
                    "Without the workup you cannot answer the regulator's first question: is it the drug?",
                },
                {
                  id: 'c-repeat',
                  text: 'Repeat the liver panel tomorrow and wait',
                  quality: 'ok',
                  next: 'n-amend',
                  conceptId: 'pharmacokinetics',
                  explanation: 'The trend matters, but a repeat alone cannot tell drug injury from a virus.',
                  consequence: 'The regulator asks for the missing tests anyway, and the hold runs longer.',
                },
                {
                  id: 'c-blame',
                  text: 'Write to the FDA now that it is unrelated to VX-101',
                  quality: 'bad',
                  next: 'n-amend',
                  meters: { integrity: -15 },
                  conceptId: 'gcp',
                  explanation:
                    'A cause-and-effect call before the data is an opinion, and a regulator will read it as one.',
                  consequence:
                    'Premature "not related" claims damage a sponsor\'s credibility for the rest of the programme.',
                },
              ],
            },
            {
              id: 'n-workup-2',
              speaker: 'Study physician',
              text: 'Cohort 3 was dosed again. A second volunteer now has raised liver enzymes. Both are admitted for observation. What do you order?',
              choices: [
                {
                  id: 'c-full-2',
                  text: 'Full workup on both: liver panels, hepatitis screens, histories, and drug levels',
                  quality: 'best',
                  next: 'n-amend',
                  conceptId: 'pharmacokinetics',
                  explanation:
                    'Two cases make the drug the likely cause. Now you need to know how likely, and how bad.',
                  consequence: 'Without the workup the regulator will assume the worst.',
                },
                {
                  id: 'c-repeat-2',
                  text: 'Repeat both liver panels tomorrow and wait',
                  quality: 'ok',
                  next: 'n-amend',
                  conceptId: 'pharmacokinetics',
                  explanation: 'A repeat alone cannot separate drug injury from anything else.',
                  consequence: 'The hold runs longer while the regulator waits for the tests you skipped.',
                },
                {
                  id: 'c-blame-2',
                  text: 'Write to the FDA that both cases are unrelated to VX-101',
                  quality: 'bad',
                  next: 'n-amend',
                  meters: { integrity: -15 },
                  conceptId: 'gcp',
                  explanation:
                    'Two cases after continued dosing, called "unrelated" with no data: nobody will believe it.',
                  consequence: 'This is the kind of letter that ends up in an inspection report.',
                },
              ],
            },
            {
              id: 'n-amend',
              speaker: 'Committee',
              text: 'Workup done: hepatitis negative, no alcohol, enzymes falling now that dosing has stopped. Likely drug-related, mild, reversible. The FDA wants a plan.',
              choices: [
                {
                  id: 'c-amend-full',
                  text: 'Amend the [[protocol]]: halve the next dose step, add twice-weekly liver tests and written stopping rules',
                  quality: 'best',
                  next: 'n-respond',
                  conceptId: 'protocol',
                  explanation:
                    'Smaller steps, closer monitoring and clear stopping rules are the standard answer to a reversible signal.',
                  consequence:
                    'Without stopping rules the next cohort meets the same signal with nobody obliged to stop.',
                },
                {
                  id: 'c-monitor-only',
                  text: 'Keep the escalation schedule but add liver tests',
                  quality: 'ok',
                  next: 'n-respond',
                  meters: { safety: -5 },
                  conceptId: 'protocol',
                  explanation:
                    'Monitoring finds problems; it does not prevent them. The dose step is the lever.',
                  consequence: 'The regulator is likely to ask why the step size did not change.',
                },
                {
                  id: 'c-skip',
                  text: 'Answer the hold without an amendment; a rewrite costs six weeks',
                  quality: 'bad',
                  next: 'n-respond-noplan',
                  conceptId: 'protocol',
                  shortcut: {
                    meters: { timeline: 15, safety: -20 },
                    why: 'Six weeks saved now, and the next cohort meets the same signal with no stopping rule.',
                  },
                  explanation: 'Speed is real. So is the volunteer in the next cohort.',
                  consequence: 'Holds answered without a plan get re-imposed after the next event.',
                },
              ],
            },
            {
              id: 'n-respond',
              speaker: 'Regulatory Affairs',
              text: 'Your complete response goes to the FDA today. They have 30 days to answer.',
              choices: [
                {
                  id: 'c-complete',
                  text: 'Send the data, the workup, the amended protocol and the stopping rules together',
                  quality: 'best',
                  next: 'end-lifted',
                  conceptId: 'ind',
                  explanation:
                    'A complete response answers every question the reviewer would ask, in one package.',
                  consequence: 'Piecemeal responses restart the clock each time.',
                },
                {
                  id: 'c-partial',
                  text: 'Send the data now and promise the amendment later',
                  quality: 'ok',
                  next: 'end-lifted-slow',
                  meters: { timeline: -10 },
                  conceptId: 'ind',
                  explanation: 'The regulator cannot lift a hold on a promise.',
                  consequence: 'Expect a second information request and another month.',
                },
                {
                  id: 'c-argue',
                  text: 'Argue that one asymptomatic lab value should never have triggered a hold',
                  quality: 'bad',
                  next: 'end-lifted-slow',
                  meters: { integrity: -10, timeline: -15 },
                  conceptId: 'ind',
                  explanation: 'Whether the hold was fair is not the question the reviewer is asking.',
                  consequence:
                    'Arguing with the regulator instead of answering them is remembered at approval time.',
                },
              ],
            },
            {
              id: 'n-respond-noplan',
              speaker: 'Regulatory Affairs',
              text: 'Your response has the data and the workup, but no change to the protocol. Send it as is?',
              choices: [
                {
                  id: 'c-noplan-send',
                  text: 'Send it. We can amend later if they insist.',
                  quality: 'ok',
                  next: 'end-reimposed',
                  conceptId: 'protocol',
                  explanation:
                    'They will lift the hold on the data. Then the next cohort runs on the old rules.',
                  consequence: 'A hold lifted without a plan is a hold waiting to come back.',
                },
                {
                  id: 'c-noplan-amend',
                  text: 'Stop. Write the amendment after all, then send.',
                  quality: 'best',
                  next: 'n-respond',
                  meters: { timeline: -5 },
                  conceptId: 'protocol',
                  explanation: 'Six weeks late is better than a second hold.',
                  consequence: 'Nothing lost but a little time.',
                },
              ],
            },
            {
              id: 'end-lifted',
              text: 'Hold lifted after 26 days. Dosing resumes at the smaller step, with the new stopping rules in place.',
              end: { summary: 'Holds are common. Handling them well is the job.' },
            },
            {
              id: 'end-lifted-slow',
              text: 'Hold lifted after 71 days and two more rounds of questions. Dosing resumes with the amended protocol. The delay is on the timeline meter.',
              end: { summary: 'The hold was always going to lift. How long it took was up to you.' },
            },
            {
              id: 'end-reimposed',
              text: "Hold lifted after 40 days. The next cohort is dosed on the old schedule with no stopping rule. Two weeks later a second volunteer's liver enzymes rise, and the FDA re-imposes the hold.",
              end: { summary: 'Answering the letter is not the same as fixing the problem.' },
            },
            {
              id: 'end-abandoned',
              text: "The programme is closed. The hold is moot. VX-101 goes back on the shelf, and Maya's community is told the news.",
              end: { summary: 'Sometimes stopping is right. This time, a pause would have done.' },
            },
          ],
        },
      },
    ],
    emits: [
      {
        key: 'phase1.hold',
        outcomes: [
          { tag: 'mild', when: { stageId: 'scenario', endNode: 'end-lifted', accuracyAtLeast: 0.85 } },
          { tag: 'severe', when: { stageId: 'scenario', endNode: 'end-reimposed' } },
          { tag: 'severe', when: { stageId: 'scenario', endNode: 'end-abandoned' } },
        ],
      },
    ],
    variants: [
      {
        // Independent trigger; the benefit of caution is a later cohort and a milder opening, paid for in time.
        when: { 'dose.starting': 'cautious' },
        patch: {
          intro:
            "Cohort 5 was dosed this morning, after four quiet cohorts and six weeks behind plan. One volunteer's [[alt|ALT]] (a liver enzyme) is four times the upper limit. He feels fine. The [[fda|FDA]] has placed the study on [[clinical-hold|clinical hold]]. You chair the committee.",
          meterOpening: { timeline: -10 },
          stages: {
            scenario: {
              items: {
                nodes: {
                  replace: [
                    {
                      id: 'n-data',
                      text: 'One volunteer, one lab value, no symptoms, at the fifth dose level. The rest of cohort 5 is due back tomorrow. Your call as chair.',
                    },
                  ],
                },
              },
            },
          },
        },
      },
      {
        when: { 'dose.starting': 'aggressive' },
        patch: {
          intro:
            "Cohort 2 was dosed this morning. Your starting dose of {{dose.starting.mgPerKg}} mg/kg left little room: one volunteer's [[alt|ALT]] (a liver enzyme) is six times the upper limit and he is nauseous. The [[fda|FDA]] has placed the study on [[clinical-hold|clinical hold]]. You chair the committee.",
          meterOpening: { safety: -15 },
        },
      },
      {
        when: { 'dose.starting': 'reckless' },
        patch: {
          intro:
            "The first cohort was dosed at {{dose.starting.mgPerKg}} mg/kg. One volunteer is in hospital: [[alt|ALT]] (a liver enzyme) eight times the limit and rising bilirubin, a sign the liver is struggling. The [[fda|FDA]]'s [[clinical-hold|clinical hold]] letter cites your starting dose. You chair the committee.",
          meterOpening: { safety: -20 },
          stages: {
            scenario: {
              items: {
                nodes: {
                  replace: [
                    {
                      id: 'n-data',
                      text: 'One volunteer in hospital, a liver pattern that worries the specialist, and a regulator asking how the starting dose was chosen. The rest of cohort 1 is due back tomorrow. Your call as chair.',
                    },
                  ],
                  add: [
                    {
                      id: 'n-sentinel',
                      speaker: 'Committee',
                      text: 'The FDA asks how dosing will restart. With a starting dose this high, do you dose the next cohort all at once, or one or two volunteers first?',
                      choices: [
                        {
                          id: 'c-sentinel-yes',
                          text: '[[sentinel-dosing|Sentinel dosing]]: one volunteer first, wait 48 hours, then the rest',
                          quality: 'best',
                          next: 'n-respond',
                          meters: { safety: 5 },
                          conceptId: 'sentinel-dosing',
                          explanation:
                            'Dosing one person first limits how many are exposed if the next dose level surprises you.',
                          consequence:
                            'Dosing a whole cohort at once after a serious signal has caused multiple injuries in real trials.',
                        },
                        {
                          id: 'c-sentinel-no',
                          text: 'Dose the whole cohort together to keep the schedule',
                          quality: 'bad',
                          next: 'n-respond',
                          meters: { safety: -10, timeline: 5 },
                          conceptId: 'sentinel-dosing',
                          explanation:
                            'After a hospitalisation, exposing six people at once is the one thing the regulator will not accept.',
                          consequence: 'Expect the response to be rejected and the hold extended.',
                        },
                      ],
                    },
                  ],
                },
                choices: {
                  replace: [
                    { id: 'c-amend-full', next: 'n-sentinel' },
                    { id: 'c-monitor-only', next: 'n-sentinel' },
                  ],
                },
              },
            },
          },
        },
      },
      {
        when: { 'phase1.escalation': 'fast' },
        patch: {
          meterOpening: { safety: -5 },
          stages: {
            scenario: {
              items: {
                nodes: {
                  replace: [
                    {
                      id: 'n-respond',
                      text: 'Your complete response goes to the FDA today. They have 30 days to answer, and they have asked why the dose steps were tripled rather than doubled.',
                    },
                  ],
                },
              },
            },
          },
        },
      },
      {
        when: { 'phase1.escalation': 'slow' },
        patch: {
          meterOpening: { timeline: -5 },
          stages: {
            scenario: {
              items: {
                nodes: {
                  replace: [
                    {
                      id: 'n-respond',
                      text: 'Your complete response goes to the FDA today. They have 30 days to answer. The programme was already two months behind from the slow escalation.',
                    },
                  ],
                },
              },
            },
          },
        },
      },
      {
        // Two keys must both match: a cautious start plus a slow escalation means the board has already lost patience.
        when: { 'dose.starting': 'cautious', 'phase1.escalation': 'slow' },
        patch: {
          meterOpening: { timeline: -5 },
          stages: {
            scenario: {
              items: {
                nodes: {
                  replace: [
                    {
                      id: 'n-board',
                      text: 'You want to end a programme that is already four months behind, over one lab value in one volunteer, before the workup? The board has been patient. Reconsider.',
                    },
                  ],
                },
              },
            },
          },
        },
      },
    ],
    debrief: {
      learned:
        'A clinical hold is a pause while the sponsor answers the regulator\'s questions: stop, investigate, amend, respond completely. "Clinical hold" is the FDA\'s term; EU authorities can pause a trial in a similar way.',
      handoffLine:
        'You hand the lifted hold and the amended protocol back to the Investigator. Dosing resumes.',
    },
  },
];
