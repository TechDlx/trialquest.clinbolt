import type { Level } from '../../types';

/** World 5 — Phase II. Maya enrols (blinded). Chains (a) and (b) both pass through here. */
export const w5Levels: Level[] = [
  // ------------------------------------------------------------------ w5-l1 Patient Recruitment Specialist
  {
    id: 'w5-l1',
    worldId: 'w5',
    roleId: 'recruitment-specialist',
    title: 'Find 200 patients',
    intro:
      'The [[phase-2|Phase II]] study needs 200 people with Veridian Syndrome in 27 months. Spend the [[patient-recruitment|recruitment]] budget where patients really are, then check the campaign before the ethics committee does.',
    meterFocus: 'integrity',
    stages: [
      {
        id: 'channels',
        title: 'Spend the budget',
        brief: 'Sliders must total 100%. Rare-disease patients are not where ads are cheapest.',
        weight: 1,
        game: {
          engine: 'allocator',
          prompt: 'Split the recruitment budget across channels.',
          seconds: 60,
          total: 100,
          context: [
            'Patient organisations and registries: most Veridian patients are known to one (30–50%)',
            'Referring specialists: a few dozen clinics see almost every case (30–50%)',
            'Social media ads: broad reach, mostly people without the disease (10–30%)',
          ],
          categories: [
            {
              id: 'groups',
              label: 'Patient organisations',
              unit: '%',
              min: 0,
              max: 100,
              step: 10,
              initial: 20,
              target: [30, 50],
              conceptId: 'patient-recruitment',
              explanation:
                'For a rare disease, the community already knows who has it. This is the main channel.',
              consequence:
                'Ignoring patient groups leaves the study searching for people who are already on a list.',
            },
            {
              id: 'clinics',
              label: 'Referring specialists',
              unit: '%',
              min: 0,
              max: 100,
              step: 10,
              initial: 20,
              target: [30, 50],
              conceptId: 'patient-recruitment',
              explanation: 'Specialists see the patients and can judge eligibility before referring.',
              consequence: 'Without specialist referrals, screen failures pile up.',
            },
            {
              id: 'ads',
              label: 'Social media ads',
              unit: '%',
              min: 0,
              max: 100,
              step: 10,
              initial: 60,
              target: [10, 30],
              conceptId: 'patient-recruitment',
              explanation:
                'Ads reach many people and few patients. Useful for awareness, expensive as the main channel.',
              consequence: 'Ad-heavy campaigns for rare diseases generate calls from people who cannot join.',
            },
          ],
          presets: [
            {
              id: 'finder-fees',
              label: 'Pay specialists a bonus per patient referred',
              values: { groups: 20, clinics: 70, ads: 10 },
              shortcut: {
                meters: { timeline: 10, integrity: -20 },
                why: 'Referrals would jump. So would the temptation to refer people who do not quite fit. Regulators call it a conflict of interest.',
              },
            },
          ],
        },
      },
      {
        id: 'ads',
        title: 'Check the campaign',
        brief: 'Every ad goes to the ethics committee. One of these should not.',
        weight: 1,
        game: {
          engine: 'spot-the-impostor',
          prompt: 'Which ad breaks the rules for [[recruitment-materials|recruitment materials]]?',
          seconds: 60,
          targetLabel: 'the non-compliant ad',
          cards: [
            {
              id: 'ad-plain',
              title: 'Ad A',
              lines: [
                'A research study for adults with Veridian Syndrome',
                'Study drug or placebo; no cost to join',
                'Call to learn more',
              ],
              conceptId: 'recruitment-materials',
              explanation: 'Says it is research, mentions placebo, promises nothing. This is compliant.',
              consequence: 'Accusing a good ad delays a compliant campaign.',
            },
            {
              id: 'ad-cure',
              title: 'Ad B',
              lines: [
                'New treatment for Veridian Syndrome now available',
                'Free medication for a year',
                'Limited places, apply today',
              ],
              impostor: true,
              confirm: 'Found it: promises treatment and pressures people to apply.',
              conceptId: 'recruitment-materials',
              explanation:
                '"Treatment", "free medication" and "limited places" promise benefit and add pressure. Nothing here says research.',
              consequence: 'Misleading ads are pulled by ethics committees and reported by regulators.',
            },
            {
              id: 'ad-group',
              title: 'Ad C',
              lines: [
                'Shared through the patient association newsletter',
                'Describes the visits and the placebo chance',
                'Committee-approved text',
              ],
              conceptId: 'recruitment-materials',
              explanation: 'Approved text through a trusted channel. Fine.',
              consequence: 'Blocking the community channel cuts the study off from its patients.',
            },
            {
              id: 'ad-poster',
              title: 'Ad D',
              lines: [
                'Clinic waiting-room poster',
                'Lists eligibility basics and a phone number',
                'States that participation is voluntary',
              ],
              conceptId: 'recruitment-materials',
              explanation: 'Plain, factual, voluntary. Compliant.',
              consequence: 'Over-policing plain posters slows a compliant campaign for nothing.',
            },
          ],
          signOff: {
            id: 'launch-unreviewed',
            label: 'Launch every ad now; send them to the committee later',
            shortcut: {
              meters: { timeline: 10, integrity: -15 },
              why: 'Recruitment starts a month early. And every patient who saw an unapproved ad becomes a question at inspection.',
            },
          },
        },
      },
    ],
    variants: [
      {
        when: { 'phase1.hold': 'severe' },
        patch: {
          intro:
            'The [[phase-2|Phase II]] study needs 200 people with Veridian Syndrome in 27 months, and the {{phase1.hold.days}}-day hold already ate into that. Spend the [[patient-recruitment|recruitment]] budget where patients really are, then check the campaign before the ethics committee does.',
        },
      },
    ],
    debrief: {
      learned:
        'Rare-disease recruitment runs through the community and the specialists who already know the patients. Every ad is research, not treatment, and every ad is approved by the ethics committee before anyone sees it.',
      handoffLine:
        'You hand a compliant campaign, and the first referrals, to the sites. The Monitor visits them next.',
    },
  },

  // ------------------------------------------------------------------ w5-l2 Clinical Research Associate (Monitor)
  {
    id: 'w5-l2',
    worldId: 'w5',
    roleId: 'cra-monitor',
    title: 'The site visit',
    intro:
      'Site 07 has enrolled twelve patients. You are here for [[sdv|source data verification]]: does the database match the clinic notes? Inspect each record and find the [[protocol-deviation|protocol deviation]].',
    meterFocus: 'integrity',
    mayaCameo: {
      stageId: 'sdv',
      itemId: 'p-0417',
      presentation: 'data-row',
      label: 'Participant 0417',
      debriefLine:
        'Participant 0417 was Maya. You checked her visit 2 notes against the database. They matched.',
    },
    stages: [
      {
        id: 'sdv',
        title: 'Verify the source',
        brief: 'Tap a participant record to compare source and database. Accuse the deviation.',
        game: {
          engine: 'spot-the-impostor',
          prompt: 'Which record is a protocol deviation?',
          seconds: 100,
          targetLabel: 'the deviation',
          cards: [
            {
              id: 'p-0412',
              title: 'Participant 0412',
              lines: [
                'Consent signed 3 March, first dose 5 March',
                'Visit 2 labs match the lab report',
                'Dose diary complete',
              ],
              conceptId: 'sdv',
              explanation: 'Consent before dosing, labs match, diary complete. Clean.',
              consequence: "Accusing clean records burns the visit and the site's goodwill.",
            },
            {
              id: 'p-0417',
              title: 'Participant 0417',
              lines: [
                'Consent signed 9 March, first dose 12 March',
                'Visit 2 weight 61.2 kg in notes and database',
                'One mild rash recorded, coded, followed up',
              ],
              conceptId: 'sdv',
              explanation: 'Everything matches the source, including the adverse event. Clean.',
              consequence: 'Clean records are the point of monitoring: confirm them and move on.',
            },
            {
              id: 'p-0419',
              title: 'Participant 0419',
              lines: ['First dose 14 March', 'Consent form signed 16 March', 'Labs match'],
              impostor: true,
              confirm: 'Found it: dosed two days before consent.',
              conceptId: 'protocol-deviation',
              explanation:
                'Dosed before consent was signed. This is a serious deviation, whatever the labs say.',
              consequence:
                'Dosing before consent is a critical finding that must be reported to the ethics committee.',
            },
            {
              id: 'p-0421',
              title: 'Participant 0421',
              lines: [
                'Visit 3 blood pressure 128/82 in notes',
                'Database shows 128/82',
                'Visit 3 was 2 days late, documented and explained',
              ],
              conceptId: 'monitoring-visit',
              explanation:
                'A late visit that is documented and explained is a minor deviation already handled, not the one you are hunting.',
              consequence: 'Treating every documented slip as a crisis hides the real problem.',
            },
            {
              id: 'p-0425',
              title: 'Participant 0425',
              lines: [
                'Database says haemoglobin 13.1',
                'Lab report says 13.1',
                'Drug returned and counted: matches diary',
              ],
              conceptId: 'sdv',
              explanation: 'Source and database agree, accountability reconciles. Clean.',
              consequence: 'Drug accountability that reconciles is what a monitor hopes to see.',
            },
          ],
          signOff: {
            id: 'sign-visit-report',
            label: 'Sign the visit report; the coordinator says everything matches',
            shortcut: {
              meters: { timeline: 15, integrity: -20 },
              why: 'Home by lunch. And a consent problem that stays in the file until an inspector, not you, finds it.',
            },
          },
        },
      },
    ],
    emits: [
      {
        key: 'monitoring.deviations',
        outcomes: [
          { tag: 'noisy', when: { stageId: 'sdv', tookShortcut: 'sign-visit-report' } },
          { tag: 'clean', when: { stageId: 'sdv', accuracyAtLeast: 1 } },
          { tag: 'typical', when: { stageId: 'sdv', accuracyAtLeast: 0 } },
        ],
      },
    ],
    variants: [
      {
        when: { 'screening.eligibility': 'lenient' },
        patch: {
          intro:
            "Site 07 has enrolled twelve patients, and the Phase I site's screening was lenient, so expect eligibility problems to have followed the habit. You are here for [[sdv|source data verification]]. Inspect each record and find every [[protocol-deviation|protocol deviation]].",
          meterOpening: { integrity: -5 },
          stages: {
            sdv: {
              items: {
                cards: {
                  add: [
                    {
                      id: 'p-0422',
                      title: 'Participant 0422',
                      lines: [
                        'Screening ALT 1.5 times the upper limit',
                        'Enrolled anyway; no sponsor clarification on file',
                      ],
                      impostor: true,
                      conceptId: 'protocol-deviation',
                      explanation:
                        'An eligibility violation with nothing in writing. The habit from Phase I travelled.',
                      consequence:
                        'Eligibility violations can exclude a patient from the analysis and the site from the study.',
                    },
                  ],
                },
              },
            },
          },
        },
      },
      {
        when: { 'screening.eligibility': 'strict' },
        patch: {
          intro:
            'Site 07 has enrolled twelve patients, slowly: screening has been strict since Phase I. You are here for [[sdv|source data verification]]: does the database match the clinic notes? Inspect each record and find the [[protocol-deviation|protocol deviation]].',
        },
      },
    ],
    debrief: {
      learned:
        'A monitor checks the database against the source, patient by patient, and hunts for deviations: consent, eligibility, visit windows, drug accountability. Signing without looking is how deviations reach inspectors.',
      handoffLine:
        'You hand the visit report and the deviation to the Data Manager. How clean the site looked follows the data into World 6.',
    },
  },

  // ------------------------------------------------------------------ w5-l3 Clinical Data Manager
  {
    id: 'w5-l3',
    worldId: 'w5',
    roleId: 'clinical-data-manager',
    title: 'Clean the data',
    intro:
      'Two hundred patients, forty sites, and a queue of [[data-query|queries]]: values that look wrong, fields left blank, dates that do not add up. Raise, route, review and close each one before the site stops answering.',
    meterFocus: 'integrity',
    mayaCameo: {
      stageId: 'queries',
      itemId: 'q-0417',
      presentation: 'queue',
      label: 'Participant 0417',
      debriefLine: "The visit 6 weight query was Maya's. The site corrected a typo: 61.2 kg, not 16.2.",
    },
    stages: [
      {
        id: 'queries',
        title: 'Work the queue',
        brief: 'Tap a query, then its stations in order. Sites answer faster when queries are clear.',
        game: {
          engine: 'dash-manager',
          prompt: 'Get every query to closed before the site loses interest.',
          seconds: 110,
          stations: [
            { id: 'raise', label: 'Raise the query' },
            { id: 'route', label: 'Route to site' },
            { id: 'review', label: 'Review the answer' },
            { id: 'close', label: 'Close' },
            {
              id: 'auto-close',
              label: 'Close without review',
              shortcut: {
                meters: { timeline: 10, integrity: -15 },
                why: 'The queue empties fast. And the value that was wrong stays wrong, now with a "resolved" stamp on it.',
              },
            },
          ],
          items: [
            {
              id: 'q-0417',
              label: 'Visit 6 weight 16.2 kg for an adult',
              steps: ['raise', 'route', 'review', 'close'],
              patienceSeconds: 45,
              arrivesAt: 0,
              conceptId: 'data-query',
              explanation:
                'An impossible value: raise it, let the site check the source, review the answer, close.',
              consequence: 'An unqueried impossible value ends up in the analysis dataset.',
            },
            {
              id: 'q-blank',
              label: 'Visit 3 blood pressure left blank',
              steps: ['raise', 'route', 'review', 'close'],
              patienceSeconds: 40,
              arrivesAt: 10,
              conceptId: 'data-cleaning',
              explanation:
                'Missing data is queried too. The site either enters it from source or confirms it was not done.',
              consequence: 'Blanks left alone become missing data in the final analysis.',
            },
            {
              id: 'q-date',
              label: 'AE end date before its start date',
              steps: ['raise', 'route', 'review', 'close'],
              patienceSeconds: 40,
              arrivesAt: 22,
              conceptId: 'data-query',
              explanation: 'Dates that contradict each other are a classic edit-check hit.',
              consequence: 'Impossible dates make adverse event durations meaningless.',
            },
            {
              id: 'q-reanswer',
              label: 'Site answered "as per source" without a value',
              steps: ['review', 'route', 'review', 'close'],
              patienceSeconds: 35,
              arrivesAt: 38,
              conceptId: 'data-cleaning',
              explanation: 'A non-answer goes back to the site. Review, re-route, review again, then close.',
              consequence:
                'Accepting non-answers leaves the query technically closed and actually unresolved.',
            },
          ],
        },
      },
    ],
    debrief: {
      learned:
        'Data management turns raw entries into a dataset that can be analysed: every impossible value, blank or contradiction is queried, answered from source, reviewed and closed. Closing without review is the quiet way to corrupt a trial.',
      handoffLine: 'You hand clean adverse event terms to the Medical Coder.',
    },
  },

  // ------------------------------------------------------------------ w5-l4 Medical Coder
  {
    id: 'w5-l4',
    worldId: 'w5',
    roleId: 'medical-coder',
    title: 'Code the events',
    intro:
      'Sites write what patients say. Analysis needs standard terms. Match each verbatim report to its [[meddra|MedDRA]] term, and each medicine to its [[whodrug|WHODrug]] entry, so the same event is counted the same way everywhere.',
    meterFocus: 'integrity',
    shortcutPrompt: {
      id: 'auto-code',
      offer:
        'Dose: "The auto-coder has a first suggestion for every term. We could accept them all and move on."',
      accept: {
        meters: { timeline: 10, integrity: -15 },
        why: 'Two hours saved. And "heart racing" coded as a heart attack, or a liver signal coded as fatigue, until someone reads the tables.',
      },
    },
    stages: [
      {
        id: 'code',
        title: 'Match verbatim to term',
        brief: 'Tap a verbatim report, then the standard term it belongs to.',
        game: {
          engine: 'match-pairs',
          prompt: 'Code each verbatim report.',
          seconds: 70,
          pairs: [
            {
              id: 'headache',
              left: '"Splitting headache since this morning"',
              right: 'Headache',
              conceptId: 'medical-coding',
              explanation:
                'The verbatim says headache; the coded term is headache. Do not upgrade it to migraine.',
              consequence: 'Over-coding turns a mild event into a serious one in the tables.',
            },
            {
              id: 'palpitations',
              left: '"My heart was racing for an hour"',
              right: 'Palpitations',
              conceptId: 'medical-coding',
              explanation:
                'A racing heart the patient felt is palpitations. Not a heart attack, not "anxiety".',
              consequence:
                'Coding this as a cardiac emergency, or as nothing, both distort the safety profile.',
            },
            {
              id: 'alt',
              left: '"Liver numbers up": ALT 3 times the upper limit',
              right: 'Alanine aminotransferase increased',
              conceptId: 'medical-coding',
              explanation: 'A lab abnormality is coded as that lab abnormality, not as "liver problem".',
              consequence: 'This is the term the safety team searches for when they look for a liver signal.',
            },
            {
              id: 'ibuprofen',
              left: 'Took "ibuprofen 400 mg for the pain"',
              right: 'Ibuprofen (WHODrug: anti-inflammatory)',
              conceptId: 'whodrug',
              explanation: 'Concomitant medicines are coded to WHODrug so drug interactions can be searched.',
              consequence: 'Uncoded medicines hide interactions that explain adverse events.',
            },
          ],
        },
      },
    ],
    emits: [
      {
        key: 'ae.coded',
        outcomes: [
          { tag: 'miscoded', when: { stageId: 'code', tookShortcut: 'auto-code' } },
          { tag: 'correct', when: { stageId: 'code', accuracyAtLeast: 1 } },
          { tag: 'miscoded', when: { stageId: 'code', accuracyAtLeast: 0 } },
        ],
      },
    ],
    variants: [
      {
        when: { 'ae.report': 'incomplete' },
        patch: {
          intro:
            'Sites write what patients say, and one Phase I headache arrived with no onset date or severity, so the safety file already has a gap. Match each verbatim report to its [[meddra|MedDRA]] term and each medicine to [[whodrug|WHODrug]].',
          meterOpening: { integrity: -5 },
        },
      },
    ],
    debrief: {
      learned:
        'Coding maps what patients said to standard dictionary terms (MedDRA for events, WHODrug for medicines) so the same thing is counted the same way at every site. Coding too high or too low both distort safety.',
      handoffLine:
        'You hand the coded events to Pharmacovigilance. Whether the liver term was coded right decides what they see.',
    },
  },

  // ------------------------------------------------------------------ w5-l5 Drug Safety / Pharmacovigilance Associate
  {
    id: 'w5-l5',
    worldId: 'w5',
    roleId: 'pharmacovigilance-associate',
    title: 'The clock is running',
    intro:
      'Five reports landed overnight. Triage each one: an [[adverse-event|AE]] to record, an [[sae|SAE]] the site must report within 24 hours, or a [[susar|SUSAR]] that goes to regulators on a 7- or 15-day clock. The clock started when the site knew.',
    meterFocus: 'safety',
    stages: [
      {
        id: 'triage',
        title: 'Triage the reports',
        brief: 'AE, SAE or SUSAR? The category sets the deadline.',
        game: {
          engine: 'bucket-sort',
          prompt: 'Classify each report.',
          seconds: 75,
          buckets: [
            { id: 'ae', label: 'AE', hint: 'Record and follow; no expedited report' },
            { id: 'sae', label: 'SAE', hint: 'Serious: hospital, life-threatening, disability, death' },
            { id: 'susar', label: 'SUSAR', hint: 'Serious, unexpected, possibly drug-related: expedite' },
            {
              id: 'later',
              label: 'Batch for the monthly report',
              hint: 'Deal with it all at once',
              shortcut: {
                meters: { timeline: 10, safety: -20 },
                why: 'One tidy monthly report. And a 7-day clock that ran out three weeks ago, on a case the regulator will read first.',
              },
            },
          ],
          cards: [
            {
              id: 'rash',
              text: 'Mild rash on the arms, resolved in two days, no treatment',
              bucketId: 'ae',
              confirm: 'AE: recorded, followed, not serious.',
              conceptId: 'adverse-event',
              explanation:
                'Mild, resolved, no hospital: an adverse event to record and follow. No expedited clock.',
              consequence: 'Expediting every rash buries the reports that matter.',
            },
            {
              id: 'fracture',
              text: 'Broke an ankle falling off a bicycle; hospitalised overnight',
              bucketId: 'sae',
              confirm: 'SAE: hospitalised, but not unexpected for the drug.',
              conceptId: 'sae',
              explanation:
                'Hospitalisation makes it serious, so the site reports within 24 hours. A bicycle fall is not an unexpected drug effect.',
              consequence:
                'Missing an SAE report deadline is a regulatory finding even when the drug had nothing to do with it.',
            },
            {
              id: 'liver',
              text: 'Jaundice and ALT 10 times the limit, admitted; investigator says "possibly related"',
              bucketId: 'susar',
              confirm: 'SUSAR: serious, unexpected, possibly related. Expedite.',
              conceptId: 'susar',
              explanation:
                'Serious, unexpected at this severity, and possibly [[causality|related]]: regulators hear within 15 days (7 if it were fatal or life-threatening).',
              consequence: 'A late SUSAR is the most serious pharmacovigilance failure there is.',
            },
            {
              id: 'nausea',
              text: 'Nausea after each dose for a week, took an anti-sickness tablet',
              bucketId: 'ae',
              confirm: 'AE: expected, not serious.',
              conceptId: 'adverse-event',
              explanation:
                'Uncomfortable but not serious, and already listed as expected. Record and follow.',
              consequence: 'Over-reporting expected events makes the real signals harder to see.',
            },
            {
              id: 'placebo-sae',
              text: 'Chest pain, admitted for observation; blinded, could be on placebo',
              bucketId: 'sae',
              confirm: 'SAE: serious now; causality is assessed blinded.',
              conceptId: 'expedited-reporting',
              explanation:
                'Hospitalisation makes it serious today. Whether it becomes a SUSAR depends on causality and unblinding, later.',
              consequence: 'Waiting to find out the arm before reporting breaks the 24-hour rule.',
            },
          ],
        },
      },
    ],
    emits: [
      {
        key: 'safety.report',
        outcomes: [
          { tag: 'late', when: { stageId: 'triage', tookShortcut: 'later' } },
          { tag: 'late', when: { stageId: 'triage', bucketOf: { itemId: 'liver', bucketId: 'ae' } } },
          { tag: 'late', when: { stageId: 'triage', bucketOf: { itemId: 'liver', bucketId: 'sae' } } },
          { tag: 'on-time', when: { stageId: 'triage', accuracyAtLeast: 0 } },
        ],
      },
    ],
    variants: [
      {
        when: { 'ae.coded': 'miscoded' },
        patch: {
          intro:
            'Five reports landed overnight, and the coding upstream was sloppy, so read each one from the verbatim. An [[adverse-event|AE]] to record, an [[sae|SAE]] reported within 24 hours, or a [[susar|SUSAR]] on a 7- or 15-day clock?',
          meterOpening: { integrity: -5 },
        },
      },
    ],
    debrief: {
      learned:
        'Pharmacovigilance sorts events by seriousness, expectedness and causality. SAEs reach the sponsor within 24 hours; SUSARs reach regulators within 7 days (fatal or life-threatening) or 15 days. The clock starts when the site knew.',
      handoffLine:
        'You hand the safety database to the Phase III team. Whether the liver case was expedited on time will follow the drug to its label.',
    },
  },
];
