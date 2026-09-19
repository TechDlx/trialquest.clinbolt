import type { Level } from '../../types';

/**
 * World 4 (planned) — the clinical hold level is authored now because it consumes chain (c).
 * The hold ALWAYS happens; artifacts change only its cause, severity and copy (SPEC Amendment 1).
 */
export const w4Levels: Level[] = [
  {
    id: 'w4-l4',
    worldId: 'w4',
    roleId: 'safety-review-committee',
    title: 'Clinical hold',
    meterFocus: 'safety',
    // Base = 'standard' starting dose and 'standard' escalation. The cause is independent of the player's dose.
    intro:
      'Cohort 3 of the Phase I study was dosed this morning. One volunteer\'s labs show [[alt|ALT]] (a liver enzyme) four times the upper limit. He feels fine. The [[fda|FDA]] has been told, and this afternoon they placed the study on [[clinical-hold|clinical hold]]. You chair the Safety Review Committee. ("Clinical hold" is the FDA\'s term; in the EU a national authority or ethics committee can pause a trial in a similar way.)',
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
            'Cohort 5 of the Phase I study was dosed this morning, after four uneventful cohorts and six weeks behind plan. One volunteer\'s labs show [[alt|ALT]] (a liver enzyme) four times the upper limit. He feels fine. The [[fda|FDA]] has been told, and this afternoon they placed the study on [[clinical-hold|clinical hold]]. You chair the Safety Review Committee. ("Clinical hold" is the FDA\'s term; in the EU a national authority or ethics committee can pause a trial in a similar way.)',
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
            'Cohort 2 of the Phase I study was dosed this morning. Your starting dose of {{dose.starting.mgPerKg}} mg/kg left little room, and one volunteer\'s labs now show [[alt|ALT]] (a liver enzyme) six times the upper limit. He is nauseous. The [[fda|FDA]] has been told, and this afternoon they placed the study on [[clinical-hold|clinical hold]]. You chair the Safety Review Committee. ("Clinical hold" is the FDA\'s term; in the EU a national authority or ethics committee can pause a trial in a similar way.)',
          meterOpening: { safety: -15 },
        },
      },
      {
        when: { 'dose.starting': 'reckless' },
        patch: {
          intro:
            'The very first cohort was dosed at {{dose.starting.mgPerKg}} mg/kg. One volunteer is in hospital with [[alt|ALT]] (a liver enzyme) eight times the upper limit and a rising bilirubin, a sign the liver is struggling. The [[fda|FDA]] placed the study on [[clinical-hold|clinical hold]] within the hour, and their letter cites your starting dose. You chair the Safety Review Committee. ("Clinical hold" is the FDA\'s term; in the EU a national authority or ethics committee can pause a trial in a similar way.)',
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
        "A clinical hold is a pause while the sponsor answers the regulator's questions. The way out is always the same: stop, investigate, amend, and respond completely.",
      handoffLine:
        'You hand the lifted hold and the amended protocol back to the Investigator. Dosing resumes.',
    },
  },
];
