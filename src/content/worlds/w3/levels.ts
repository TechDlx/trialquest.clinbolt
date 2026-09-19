import type { Level } from '../../types';

/** World 3 — Study Start-Up. Seven levels; w3-l4 continues artifact chain (a). */
export const w3Levels: Level[] = [
  // ------------------------------------------------------------------ w3-l1 Clinical Project Manager
  {
    id: 'w3-l1',
    worldId: 'w3',
    roleId: 'clinical-project-manager',
    title: 'Plan the start-up',
    intro:
      'The trial is approved and funded. Nothing exists yet: no sites, no drug on shelves, no database. Put the [[study-startup|start-up]] in the right order, then spend the start-up budget where the risk is.',
    meterFocus: 'timeline',
    stages: [
      {
        id: 'order',
        title: 'Sequence the start-up',
        brief: 'Move each step up or down, then check.',
        weight: 1,
        game: {
          engine: 'sequence-sort',
          prompt: 'Put the start-up milestones in order.',
          seconds: 60,
          items: [
            {
              id: 'feasibility',
              text: 'Site feasibility: find sites that have the patients and the staff',
              conceptId: 'site-feasibility',
              explanation:
                'Everything downstream depends on where the study will run. [[site-feasibility|Feasibility]] comes first.',
              consequence: 'Contracting before feasibility means paying sites that never enrol.',
            },
            {
              id: 'contracts',
              text: 'Contracts and budgets signed with the chosen sites',
              conceptId: 'site-contract',
              explanation:
                'A site cannot open without a signed [[site-contract|agreement]] and ethics approval.',
              consequence: 'Unsigned contracts are the single biggest cause of start-up delay.',
            },
            {
              id: 'systems',
              text: 'Database, randomization system and supplies ready',
              conceptId: 'study-startup',
              explanation: 'The systems must be built and tested before the first visit, not during it.',
              consequence:
                'Sites opened before the database exists collect data on paper that is re-entered later, with errors.',
            },
            {
              id: 'siv',
              text: 'Site initiation visit: train the site, then open it',
              conceptId: 'site-initiation-visit',
              explanation:
                'The [[site-initiation-visit|initiation visit]] confirms the site is trained and ready. Only then may it screen.',
              consequence: 'Untrained sites make protocol deviations in the first week.',
            },
          ],
        },
      },
      {
        id: 'risk',
        title: 'Fund the risk plan',
        brief: 'Sliders must total $6M. Put money where the study can fail.',
        weight: 1,
        game: {
          engine: 'allocator',
          prompt: 'Allocate the $6M start-up budget.',
          seconds: 60,
          total: 6,
          context: [
            'Site payments and start-up fees: needs $2–3M',
            'Vendors (database, randomization, labs): needs $2–3M',
            'Contingency for a slow site or a reship: keep $1–2M',
          ],
          categories: [
            {
              id: 'sites',
              label: 'Sites',
              unit: '$M',
              min: 0,
              max: 6,
              step: 1,
              initial: 4,
              target: [2, 3],
              conceptId: 'site-contract',
              explanation:
                'Sites need start-up fees and per-patient payments. Over-paying does not make them faster.',
              consequence: 'Underpaid sites de-prioritise your study; overpaid ones drain the vendors.',
            },
            {
              id: 'vendors',
              label: 'Vendors',
              unit: '$M',
              min: 0,
              max: 6,
              step: 1,
              initial: 2,
              target: [2, 3],
              conceptId: 'study-startup',
              explanation:
                'The database, randomization and lab contracts are fixed costs. Cut them and nothing works.',
              consequence: 'A cheap vendor that fails validation costs more than the expensive one.',
            },
            {
              id: 'contingency',
              label: 'Contingency',
              unit: '$M',
              min: 0,
              max: 6,
              step: 1,
              initial: 0,
              target: [1, 2],
              conceptId: 'risk-management-plan',
              explanation: 'A [[risk-management-plan|risk plan]] without money behind it is a wish list.',
              consequence: 'The first temperature excursion with no contingency becomes a three-month delay.',
            },
          ],
          presets: [
            {
              id: 'no-contingency',
              label: 'Skip contingency; open two extra sites instead',
              values: { sites: 4, vendors: 2, contingency: 0 },
              shortcut: {
                meters: { timeline: 10, integrity: -10 },
                why: 'More sites now, no cushion later. When a shipment fails, you will pay for it with the vendor budget and the data will show it.',
              },
            },
          ],
        },
      },
    ],
    debrief: {
      learned:
        'Start-up is a sequence: feasibility, contracts, systems, initiation. A project manager owns the order, the budget and the risk plan, and keeps a reserve for the thing that will go wrong.',
      handoffLine: 'You hand the plan and the site list to the Site Start-up Specialist.',
    },
  },

  // ------------------------------------------------------------------ w3-l2 Site Feasibility & Start-up Specialist
  {
    id: 'w3-l2',
    worldId: 'w3',
    roleId: 'site-startup-specialist',
    title: 'Pick the sites',
    intro:
      'Forty hospitals answered the feasibility survey. Match each site to what its answers really mean, then split the enrolment target across the countries you trust to deliver.',
    meterFocus: 'timeline',
    shortcutPrompt: {
      id: 'skip-visits',
      offer: 'Dose: "Qualification visits take a month. We could select from the survey answers alone."',
      accept: {
        meters: { timeline: 10, integrity: -10 },
        why: 'Surveys are optimistic. Sites that promise 30 patients on paper deliver 3. You would find out at month six.',
      },
    },
    stages: [
      {
        id: 'match',
        title: 'Read the feasibility answers',
        brief: 'Match each site to what its survey really tells you.',
        weight: 1,
        game: {
          engine: 'match-pairs',
          prompt: 'Match the site to the right conclusion.',
          seconds: 60,
          pairs: [
            {
              id: 'site-a',
              left: 'Site A: 200 patients on file, no research staff, never run a trial',
              right: 'Patients, but no capacity: needs a coordinator before it can open',
              conceptId: 'site-feasibility',
              explanation: 'Patients alone do not enrol. A site needs trained staff and time.',
              consequence: 'Opening inexperienced sites without support produces deviations, not patients.',
            },
            {
              id: 'site-b',
              left: 'Site B: 12 patients, experienced team, three competing trials',
              right: 'Strong site, split attention: expect slow enrolment',
              conceptId: 'site-feasibility',
              explanation: 'Competing trials fight for the same patients and the same coordinator hours.',
              consequence: "Counting on a busy site's full promise leaves the study short.",
            },
            {
              id: 'site-c',
              left: 'Site C: 40 patients, dedicated research unit, no competing trials',
              right: 'Best candidate: patients, staff and focus',
              conceptId: 'site-selection',
              explanation:
                'This is what [[site-selection|selection]] looks for: the patients, the people and the bandwidth.',
              consequence: 'Missing the best site means the study leans on weaker ones.',
            },
            {
              id: 'site-d',
              left: 'Site D: "as many as you need", answered the survey in five minutes',
              right: 'Over-promise: verify with a qualification visit before trusting a number',
              conceptId: 'site-qualification-visit',
              explanation:
                'An instant, unlimited promise is a red flag. A [[site-qualification-visit|qualification visit]] checks the reality.',
              consequence: 'Sites that over-promise are the usual reason enrolment forecasts miss by half.',
            },
          ],
        },
      },
      {
        id: 'countries',
        title: 'Split the enrolment target',
        brief: '240 patients across three regions. Each has a realistic range.',
        weight: 1,
        game: {
          engine: 'allocator',
          prompt: 'Divide the 240-patient target between the regions.',
          seconds: 60,
          total: 240,
          context: [
            'North America: 8 strong sites, high cost, fast ethics approval',
            'Western Europe: 10 sites, moderate cost, country-by-country start dates',
            'New region: 4 unproven sites, low cost, 6-month regulatory lead time',
          ],
          categories: [
            {
              id: 'na',
              label: 'North America',
              unit: 'patients',
              min: 0,
              max: 240,
              step: 10,
              initial: 80,
              target: [90, 130],
              conceptId: 'site-selection',
              explanation: 'Fast to open and reliable, but expensive. Around half the study belongs here.',
              consequence: "Leaning too hard on one region makes the study fragile to one country's delays.",
            },
            {
              id: 'eu',
              label: 'Western Europe',
              unit: 'patients',
              min: 0,
              max: 240,
              step: 10,
              initial: 80,
              target: [80, 120],
              conceptId: 'site-selection',
              explanation: 'Good sites at moderate cost, staggered start dates. A solid second pillar.',
              consequence: 'Under-using proven regions to chase cheap ones costs months.',
            },
            {
              id: 'new',
              label: 'New region',
              unit: 'patients',
              min: 0,
              max: 240,
              step: 10,
              initial: 80,
              target: [10, 40],
              conceptId: 'site-feasibility',
              explanation: 'Unproven sites and a six-month lead time: a small bet, not a pillar.',
              consequence:
                'Studies that depend on an unproven region often wait a year for its first patient.',
            },
          ],
        },
      },
    ],
    debrief: {
      learned:
        'Site selection is about patients, people and focus, verified in person. Enrolment targets go where sites have delivered before, with a small bet on new regions.',
      handoffLine:
        'You hand the selected sites and their contracts to the Clinical Supply Manager, who must get drug to them.',
    },
  },

  // ------------------------------------------------------------------ w3-l3 Clinical Supply Manager
  {
    id: 'w3-l3',
    worldId: 'w3',
    roleId: 'clinical-supply-manager',
    title: 'Drug on the shelf',
    intro:
      'Sites open in three weeks and every one needs blinded VX-101 and placebo, labelled, shipped cold and logged. Shipments queue up. Get each one through the right stations before its window closes.',
    meterFocus: 'integrity',
    stages: [
      {
        id: 'ship',
        title: 'Run the depot',
        brief: 'Tap a shipment, then tap its stations in order. Watch the patience bars.',
        game: {
          engine: 'dash-manager',
          prompt: 'Get every shipment out correctly before its window closes.',
          seconds: 110,
          stations: [
            { id: 'label', label: 'Label & blind' },
            { id: 'qp', label: 'QA release' },
            { id: 'cold', label: 'Cold-chain pack' },
            { id: 'ship', label: 'Ship & log' },
            {
              id: 'skip-qa',
              label: 'Ship without QA release',
              shortcut: {
                meters: { timeline: 10, integrity: -20 },
                why: 'Faster out the door. If the batch turns out wrong, every patient dosed from it becomes a deviation.',
              },
            },
          ],
          items: [
            {
              id: 'us-site-1',
              label: 'Site 01 (US) initial supply',
              steps: ['label', 'qp', 'cold', 'ship'],
              patienceSeconds: 40,
              arrivesAt: 0,
              conceptId: 'clinical-supply',
              explanation:
                'Every shipment is labelled and blinded, released by QA, packed cold, then shipped and logged.',
              consequence: 'A site that opens without drug screens patients it cannot dose.',
            },
            {
              id: 'eu-site-2',
              label: 'Site 02 (EU) initial supply',
              steps: ['label', 'qp', 'cold', 'ship'],
              patienceSeconds: 40,
              arrivesAt: 8,
              conceptId: 'qp-release',
              explanation:
                'In the EU a [[qp-release|Qualified Person]] must certify each batch before release. No release, no shipment.',
              consequence:
                'Drug shipped into the EU without QP certification is illegal and must be quarantined.',
            },
            {
              id: 'resupply',
              label: 'Site 01 resupply',
              steps: ['qp', 'cold', 'ship'],
              patienceSeconds: 35,
              arrivesAt: 20,
              conceptId: 'cold-chain',
              explanation:
                'Resupply from an already labelled batch still needs release, [[cold-chain|cold packing]] and a log entry.',
              consequence: 'A missing log entry is an accountability gap the inspector will find.',
            },
            {
              id: 'excursion',
              label: 'Returned box: temperature excursion',
              steps: ['qp', 'ship'],
              patienceSeconds: 30,
              arrivesAt: 32,
              conceptId: 'temperature-excursion',
              explanation:
                'A [[temperature-excursion|temperature excursion]] goes to QA for a stability decision, then back out or to destruction, logged either way.',
              consequence: 'Dosing from a box that got warm is a safety risk and a deviation at once.',
            },
          ],
        },
      },
    ],
    debrief: {
      learned:
        'Clinical supply is logistics under [[gmp|GMP]]: blinded labels, QA release (a Qualified Person in the EU), cold-chain packing and a log of every unit. Excursions go to QA, never straight to a patient.',
      handoffLine:
        'You hand stocked, logged sites to the EDC Programmer, who is building where the data will live.',
    },
  },

  // ------------------------------------------------------------------ w3-l4 EDC Programmer
  {
    id: 'w3-l4',
    worldId: 'w3',
    roleId: 'edc-programmer',
    title: 'Build the eCRF',
    intro:
      'Every visit will be typed into the [[ecrf|electronic case report form]] you build now. The protocol has balanced eligibility criteria. Build the screening form and its [[edit-check|edit checks]] so wrong data is caught at entry, not at lock.',
    meterFocus: 'integrity',
    stages: [
      {
        id: 'form',
        title: 'Build the screening form',
        brief: 'Tap a part, then the slot. Some parts do not belong.',
        game: {
          engine: 'builder',
          prompt: 'Assemble the screening eCRF page.',
          seconds: 95,
          slots: [
            { id: 'fields', label: 'Eligibility fields', hint: 'What the site records at screening' },
            { id: 'check', label: 'Edit check', hint: 'The rule that fires on bad data' },
            { id: 'audit', label: 'Audit trail', hint: 'How changes are recorded' },
            { id: 'coding', label: 'Terminology', hint: 'How lab values are standardised' },
          ],
          parts: [
            {
              id: 'fields-complete',
              text: 'Age, liver tests, medications, consent date: exactly what the criteria need',
              slotId: 'fields',
              confirm: 'Complete: each criterion has a field, nothing extra.',
              conceptId: 'ecrf',
              explanation:
                'A form collects what the protocol needs to judge eligibility: no less, and no vanity fields.',
              consequence: 'A missing field means eligibility cannot be verified later.',
            },
            {
              id: 'fields-bloated',
              text: 'Everything the site could possibly measure, 90 fields',
              conceptId: 'ecrf',
              shortcut: {
                meters: { timeline: 10, integrity: -15 },
                why: 'Collect it all now, decide later. Ninety fields per visit means ninety chances for a typo and a site that stops caring.',
              },
              explanation:
                'Bloated forms slow sites and multiply queries. Data nobody analyses is data nobody cleans.',
              consequence: 'Over-collection is a recognised cause of poor data quality and site burnout.',
            },
            {
              id: 'fields-minimal',
              text: 'Age and consent date only',
              conceptId: 'ecrf',
              explanation:
                'Without liver tests and medications the form cannot show the volunteer was eligible.',
              consequence: 'Under-collection makes eligibility unverifiable at inspection.',
            },
            {
              id: 'check-range',
              text: 'Flag ALT above the upper limit and age outside 18–55 at entry',
              slotId: 'check',
              confirm: 'Yes: the criteria become live rules.',
              conceptId: 'edit-check',
              explanation:
                'An edit check turns a criterion into a rule the system enforces the moment data is typed.',
              consequence: 'Without checks, an ineligible volunteer is found months later in a listing.',
            },
            {
              id: 'check-none',
              text: 'No checks; the monitor will find problems on site',
              conceptId: 'edit-check',
              explanation: 'Monitors visit every few weeks. Edit checks fire in seconds.',
              consequence: 'Relying on monitoring alone lets bad data sit for months.',
            },
            {
              id: 'audit-on',
              text: 'Every change stamped with who, when and why',
              slotId: 'audit',
              confirm: 'Right: an audit trail is required by law.',
              conceptId: 'audit-trail',
              explanation:
                'Part 11 in the US and Annex 11 in the EU require an [[audit-trail|audit trail]] on clinical data.',
              consequence: 'Data without an audit trail is not accepted by regulators.',
            },
            {
              id: 'coding-std',
              text: 'Lab units and terms mapped to [[cdisc|CDISC]] standards',
              slotId: 'coding',
              confirm: 'Standardised now, submittable later.',
              conceptId: 'cdisc',
              explanation:
                'Standard terminology at entry saves the statistical programmers months at the end.',
              consequence: 'Non-standard data must be re-mapped before submission, at risk of error.',
            },
          ],
        },
      },
    ],
    emits: [
      {
        key: 'ecrf.fields',
        outcomes: [
          {
            tag: 'complete',
            when: { stageId: 'form', chosePart: { slotId: 'fields', partId: 'fields-complete' } },
          },
          {
            tag: 'bloated',
            when: { stageId: 'form', chosePart: { slotId: 'fields', partId: 'fields-bloated' } },
          },
          {
            tag: 'minimal',
            when: { stageId: 'form', chosePart: { slotId: 'fields', partId: 'fields-minimal' } },
          },
        ],
      },
    ],
    variants: [
      {
        when: { 'protocol.criteria': 'tight' },
        patch: {
          intro:
            "Every visit will be typed into the [[ecrf|electronic case report form]] you build now. The protocol's eligibility criteria are tight, so the form must capture each one. Build the screening page and its [[edit-check|edit checks]].",
        },
      },
      {
        when: { 'protocol.criteria': 'loose' },
        patch: {
          intro:
            "Every visit will be typed into the [[ecrf|electronic case report form]] you build now. The protocol's eligibility criteria are loose, so the form is the only place a risky volunteer can still be caught. Build it carefully.",
          meterOpening: { integrity: -5 },
        },
      },
    ],
    debrief: {
      learned:
        "The eCRF is the trial's data instrument. It collects exactly what the protocol needs, enforces rules at entry, keeps an audit trail, and uses standard terminology so the data can be submitted.",
      handoffLine:
        'You hand the tested database to the IRT Specialist, who wires up randomization. Your field choices follow the data to the clinic.',
    },
  },

  // ------------------------------------------------------------------ w3-l5 IRT / RTSM Specialist
  {
    id: 'w3-l5',
    worldId: 'w3',
    roleId: 'irt-specialist',
    title: 'Wire up randomization',
    intro:
      'When a site enrols a patient, a system decides VX-101 or placebo and which kit to hand over, without anyone knowing which is which. Configure the [[irt|IRT]] so the blind holds and no site runs out of drug.',
    meterFocus: 'integrity',
    stages: [
      {
        id: 'config',
        title: 'Configure the system',
        brief: 'Tap a setting, then the slot it belongs in.',
        game: {
          engine: 'builder',
          prompt: 'Configure the randomization and supply rules.',
          seconds: 95,
          slots: [
            { id: 'method', label: 'Randomization method' },
            { id: 'kit', label: 'Kit assignment' },
            { id: 'resupply', label: 'Resupply trigger' },
            { id: 'unblind', label: 'Emergency unblinding' },
          ],
          parts: [
            {
              id: 'block-strat',
              text: 'Blocked randomization, stratified by site and disease severity',
              slotId: 'method',
              confirm: 'Yes: balanced within site and severity.',
              conceptId: 'stratification',
              explanation:
                '[[stratification|Stratified]] blocks keep treatment groups balanced within each site and severity level.',
              consequence: 'Unbalanced groups make the final comparison harder to trust.',
            },
            {
              id: 'alternate',
              text: 'Alternate: first patient drug, second placebo, and so on',
              conceptId: 'randomization',
              explanation:
                'Alternation is predictable. A coordinator who knows the pattern can steer patients.',
              consequence: 'Predictable allocation breaks the blind and biases the study.',
            },
            {
              id: 'kit-blind',
              text: 'Assign a numbered kit whose contents only the system knows',
              slotId: 'kit',
              confirm: 'Right: numbered kits keep everyone blind.',
              conceptId: 'kit',
              explanation:
                'Identical [[kit|kits]] with numbers, not names, mean nobody at the site can tell drug from placebo.',
              consequence: 'Kits labelled by treatment unblind the whole site.',
            },
            {
              id: 'kit-labelled',
              text: 'Assign kits labelled "VX-101" or "Placebo" so the pharmacy can check',
              conceptId: 'blinding',
              explanation:
                "Checking is the pharmacy's job through kit numbers and records, never through readable labels.",
              consequence: 'A readable label is an instant, permanent unblinding.',
            },
            {
              id: 'resupply-trigger',
              text: 'Reorder when a site drops below two kits per active patient',
              slotId: 'resupply',
              confirm: 'Yes: automatic, ahead of need.',
              conceptId: 'irt',
              explanation:
                'Trigger-based resupply keeps sites stocked without shipping more than they can store.',
              consequence: 'Manual resupply is how a site runs out the day a patient is due.',
            },
            {
              id: 'unblind-gated',
              text: 'Investigator can unblind one patient, with reason logged and the sponsor alerted',
              slotId: 'unblind',
              confirm: 'Right: possible in an emergency, always recorded.',
              conceptId: 'emergency-unblinding',
              explanation:
                '[[emergency-unblinding|Emergency unblinding]] must be possible for patient safety and traceable every time.',
              consequence: "Untraceable unblinding puts the whole study's data in question.",
            },
            {
              id: 'unblind-open',
              text: 'Give sponsor staff a report of who is on which arm, for planning',
              conceptId: 'blinding',
              shortcut: {
                meters: { timeline: 10, integrity: -20 },
                why: 'Planning would be easier. It would also mean the sponsor is unblinded, and every decision after that is suspect.',
              },
              explanation: 'A sponsor that can see allocation cannot claim its decisions were blind.',
              consequence: 'Sponsor unblinding is a critical finding that can invalidate a trial.',
            },
          ],
        },
      },
    ],
    debrief: {
      learned:
        'An IRT randomizes patients unpredictably, assigns numbered kits, keeps sites supplied, and allows emergency unblinding only with a record. The blind is a system property, not a promise.',
      handoffLine:
        'You hand the configured system to the Validation Engineer, who must prove it works before it goes live.',
    },
  },

  // ------------------------------------------------------------------ w3-l6 Clinical Systems & Validation Engineer
  {
    id: 'w3-l6',
    worldId: 'w3',
    roleId: 'systems-validation-engineer',
    title: 'Prove the system works',
    intro:
      'The database and IRT go live Monday. Regulators expect [[csv|validated]] systems: tested, access-controlled, with an audit trail (US [[part-11|21 CFR Part 11]], EU Annex 11). One test record below would fail an inspection. Find it.',
    meterFocus: 'integrity',
    stages: [
      {
        id: 'validate',
        title: 'Review the validation package',
        brief: 'Tap a record to inspect it. Accuse the one that fails.',
        game: {
          engine: 'spot-the-impostor',
          prompt: 'Which record would fail an inspection?',
          seconds: 100,
          targetLabel: 'the failing record',
          cards: [
            {
              id: 'urs',
              title: 'Requirements',
              lines: ['Every edit check listed with its expected result', 'Signed by data management'],
              conceptId: 'csv',
              explanation:
                'Requirements written and signed before testing: this is what validation starts from.',
              consequence: 'Accusing a good record wastes the go-live week.',
            },
            {
              id: 'test-run',
              title: 'Test execution',
              lines: [
                'All 120 scripts run',
                'Each result recorded with screenshots',
                'Three failures fixed and re-run',
              ],
              conceptId: 'csv',
              explanation:
                'Failures found, fixed and re-tested is exactly what a healthy test record looks like.',
              consequence: 'A record with zero failures would be more suspicious than one with three.',
            },
            {
              id: 'accounts',
              title: 'User accounts',
              lines: [
                'One shared login "SITE01" for all site staff',
                'Password on a sticky note in the pharmacy',
              ],
              impostor: true,
              confirm: 'Found it: shared logins destroy attribution.',
              conceptId: 'access-control',
              explanation:
                'Part 11 requires each action to be attributable to one person. A shared login makes the audit trail meaningless.',
              consequence:
                'Shared accounts are a critical inspection finding; data from that site may be rejected.',
            },
            {
              id: 'audit-trail',
              title: 'Audit trail',
              lines: [
                'Every change stores old value, new value, user, timestamp, reason',
                'Cannot be disabled',
              ],
              conceptId: 'audit-trail',
              explanation: 'An audit trail that cannot be switched off is the core Part 11 requirement.',
              consequence: 'Disabling audit trails, even briefly, invalidates the data window.',
            },
            {
              id: 'signoff',
              title: 'Release sign-off',
              lines: ['Validation summary approved by QA', 'Known issues listed with workarounds'],
              conceptId: 'csv',
              explanation:
                'Known issues stated openly, with workarounds, is honest validation. Nobody expects zero defects.',
              consequence: 'Hiding known issues is worse than having them.',
            },
          ],
          signOff: {
            id: 'go-live-anyway',
            label: 'Go live Monday; finish validation in parallel',
            shortcut: {
              meters: { timeline: 15, integrity: -20 },
              why: 'Sites would open on time. Every record entered before validation finishes is data you cannot prove is right.',
            },
          },
        },
      },
    ],
    debrief: {
      learned:
        'Validation proves a system does what it should: requirements, tests, fixes, sign-off. Unique user accounts and an unbreakable audit trail are what let anyone trust who did what.',
      handoffLine: 'You hand validated, live systems to the TMF Specialist, who files the proof.',
    },
  },

  // ------------------------------------------------------------------ w3-l7 TMF Specialist
  {
    id: 'w3-l7',
    worldId: 'w3',
    roleId: 'tmf-specialist',
    title: 'File the evidence',
    intro:
      'The [[tmf|Trial Master File]] is the story of the trial an inspector reads without you in the room. Sort each [[essential-documents|essential document]] into the right zone before the first patient visit.',
    meterFocus: 'integrity',
    stages: [
      {
        id: 'file',
        title: 'File the documents',
        brief: 'Which zone does each document belong in?',
        game: {
          engine: 'bucket-sort',
          prompt: 'File each document in its TMF zone.',
          seconds: 75,
          buckets: [
            { id: 'trial-mgmt', label: 'Trial management', hint: 'Protocol, plans, approvals' },
            { id: 'site', label: 'Site management', hint: 'Contracts, training, site staff' },
            { id: 'ethics-reg', label: 'Ethics & regulatory', hint: 'IRB letters, IND / CTA' },
            {
              id: 'later',
              label: 'File later',
              hint: 'Keep the pile, sort it before the inspection',
              shortcut: {
                meters: { timeline: 10, integrity: -15 },
                why: 'The pile grows faster than anyone expects. Inspectors ask for documents by date, and "we have it somewhere" is a finding.',
              },
            },
          ],
          cards: [
            {
              id: 'protocol-v2',
              text: 'Protocol version 2.0, signed',
              bucketId: 'trial-mgmt',
              confirm: 'Trial management: the protocol anchors the file.',
              conceptId: 'tmf',
              explanation: 'The signed protocol and its amendments live in trial management.',
              consequence:
                'A protocol the inspector cannot find raises the question of which version sites used.',
            },
            {
              id: 'irb-approval',
              text: 'IRB approval letter for Site 03',
              bucketId: 'ethics-reg',
              confirm: 'Ethics & regulatory.',
              conceptId: 'essential-documents',
              explanation: 'Approval letters prove the site was allowed to enrol from a given date.',
              consequence: 'Missing approval letters make every patient at that site a potential violation.',
            },
            {
              id: 'cta-site',
              text: 'Signed clinical trial agreement with Site 03',
              bucketId: 'site',
              confirm: 'Site management.',
              conceptId: 'site-contract',
              explanation: 'Contracts, budgets and site staff records live under site management.',
              consequence: 'An unfiled contract makes payments and responsibilities unprovable.',
            },
            {
              id: 'training',
              text: 'Site 03 staff GCP training certificates',
              bucketId: 'site',
              confirm: 'Site management.',
              conceptId: 'gcp',
              explanation:
                'Training records show the people at the site were qualified when they enrolled patients.',
              consequence: 'Inspectors check that staff were trained before their first patient, by date.',
            },
            {
              id: 'ind-ack',
              text: 'FDA acknowledgement of the IND',
              bucketId: 'ethics-reg',
              confirm: 'Ethics & regulatory.',
              conceptId: 'ind',
              explanation:
                'Regulatory correspondence, including the IND acknowledgement, files under ethics and regulatory.',
              consequence: 'The IND acknowledgement is the first thing an FDA inspector asks for.',
            },
          ],
        },
      },
    ],
    debrief: {
      learned:
        'The TMF holds every essential document, filed by zone and date, so an inspector can reconstruct the trial. Filing "later" is how documents go missing.',
      handoffLine:
        'You hand a complete TMF to the Phase I site. Sites are open, drug is on shelves, systems are live. Nobody has been dosed yet.',
    },
  },
];
