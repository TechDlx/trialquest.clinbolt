import type { Level } from '../../types';

/** World 8 — Launch & Beyond. Seven levels; chain (b) ends here in the label consumers. */
export const w8Levels: Level[] = [
  // ------------------------------------------------------------------ w8-l1 Manufacturing & Supply Chain Lead
  {
    id: 'w8-l1',
    worldId: 'w8',
    roleId: 'manufacturing-supply-lead',
    title: 'Make a million capsules',
    intro:
      'Clinical batches were thousands of capsules. Launch needs millions, made the same way every time under [[gmp|GMP]]. Split the [[scale-up|scale-up]] budget so the process is proven, the stock is ready and nothing ships unreleased.',
    meterFocus: 'integrity',
    stages: [
      {
        id: 'scaleup',
        title: 'Fund the scale-up',
        brief: 'Sliders must total $40M. Every line has a range the launch can live with.',
        game: {
          engine: 'allocator',
          prompt: 'Allocate the $40M manufacturing budget.',
          seconds: 80,
          total: 40,
          context: [
            '[[process-validation|Process validation]]: three consecutive full-scale batches must pass ($10–14M)',
            'Launch stock: enough for the first six months, released and on shelves ($12–18M)',
            'Quality systems and testing capacity for commercial volumes ($8–12M)',
            'Contingency: a failed batch costs $4M and eight weeks (keep $4–8M)',
          ],
          categories: [
            {
              id: 'validation',
              label: 'Process validation',
              unit: '$M',
              min: 0,
              max: 40,
              step: 2,
              initial: 6,
              target: [10, 14],
              conceptId: 'process-validation',
              explanation:
                'Three validation batches at full scale prove the process. Underfund it and the regulator will not release the product.',
              consequence: 'Skipped validation is a launch delayed by a pre-approval inspection finding.',
            },
            {
              id: 'stock',
              label: 'Launch stock',
              unit: '$M',
              min: 0,
              max: 40,
              step: 2,
              initial: 22,
              target: [12, 18],
              conceptId: 'launch-stock',
              explanation:
                'Six months of stock is the plan. More is money sitting in a warehouse with a shelf life.',
              consequence:
                'Under-stocking means shortages at launch; over-stocking means expired drug destroyed.',
            },
            {
              id: 'quality',
              label: 'Quality & testing',
              unit: '$M',
              min: 0,
              max: 40,
              step: 2,
              initial: 6,
              target: [8, 12],
              conceptId: 'gmp',
              explanation:
                'Every commercial batch is tested and released. Testing capacity must scale with volume.',
              consequence: 'A testing bottleneck leaves finished product waiting in quarantine.',
            },
            {
              id: 'contingency',
              label: 'Contingency',
              unit: '$M',
              min: 0,
              max: 40,
              step: 2,
              initial: 6,
              target: [4, 8],
              conceptId: 'risk-management-plan',
              explanation: 'One failed batch is normal at scale-up. Budget for it.',
              consequence: 'No contingency turns one failed batch into a missed launch.',
            },
          ],
          presets: [
            {
              id: 'ship-clinical',
              label: 'Launch with the clinical-scale process; validate at full scale later',
              values: { validation: 2, stock: 24, quality: 8, contingency: 6 },
              shortcut: {
                meters: { timeline: 15, integrity: -20 },
                why: 'Launch on time. And a process nobody has proven at this scale, making a million capsules whose contents you are guessing.',
              },
            },
          ],
        },
      },
    ],
    debrief: {
      learned:
        'Commercial manufacturing means proving the full-scale process with validation batches, building launch stock that is released and within shelf life, and scaling quality testing with volume. Contingency is not optional.',
      handoffLine:
        'You hand a validated process and six months of released stock to Market Access, who must get it paid for.',
    },
  },

  // ------------------------------------------------------------------ w8-l2 Market Access / HEOR Specialist
  {
    id: 'w8-l2',
    worldId: 'w8',
    roleId: 'market-access-specialist',
    title: 'What is it worth?',
    intro:
      'An approved medicine nobody will pay for reaches nobody. Set the monthly price, then watch what [[payer|payers]] and [[hta|health technology assessment]] bodies do with it. The [[value-dossier|value dossier]] argues 21 more good days a year.',
    meterFocus: 'timeline',
    stages: [
      {
        id: 'price',
        title: 'Set the price',
        brief: 'Coverage and patients reached move as you move the slider. Your first commit counts.',
        game: {
          engine: 'allocator',
          prompt: 'Choose the monthly list price for VX-101.',
          seconds: 90,
          context: [
            'Cost to make and distribute: about $150 per month',
            'Value dossier: 21 fatigue-free days a year; rare disease, no alternative',
            'Payers cover what they judge cost-effective; HTA bodies publish the verdict',
          ],
          categories: [
            {
              id: 'price',
              label: 'Monthly price',
              unit: '$',
              min: 200,
              max: 3000,
              step: 100,
              initial: 2400,
              target: [800, 1600],
              conceptId: 'reimbursement',
              explanation:
                'Around $800–1,600 a month is where payers judge the benefit worth the cost and most patients get covered.',
              consequence:
                'Priced too high, patients are refused coverage; too low, the next rare-disease drug never gets funded.',
            },
          ],
          presets: [
            {
              id: 'max-launch',
              label: 'Launch at $2,800: capture value early, negotiate down later',
              values: { price: 2800 },
              shortcut: {
                meters: { timeline: 10, integrity: -15 },
                why: 'Revenue looks great for a quarter. Then the HTA verdict says "not cost-effective", coverage collapses, and the patients waiting were real.',
              },
            },
          ],
          simulation: {
            kind: 'price-access',
            host: 'allocator',
            preview: 'live',
            revealSeconds: 3,
            commitLabel: 'Project the first year',
            targetBand: 'fair',
            input: { categoryId: 'price', min: 200, max: 3000, step: 100, unit: '$/month' },
            curves: [
              {
                id: 'coverage',
                label: 'Payer coverage',
                unit: '',
                format: 'percent',
                points: [
                  [200, 98],
                  [800, 92],
                  [1600, 78],
                  [2400, 45],
                  [3000, 20],
                ],
              },
              {
                id: 'reached',
                label: 'Patients reached',
                unit: '',
                format: 'percent',
                points: [
                  [200, 95],
                  [800, 90],
                  [1600, 74],
                  [2400, 38],
                  [3000, 15],
                ],
              },
            ],
            bands: [
              {
                tag: 'underpriced',
                label: 'Under-priced',
                range: [200, 800],
                narration:
                  "Dose's projection: almost everyone is covered. Revenue does not repay development, and the company's next rare-disease programme is cancelled.",
                meters: { timeline: -10 },
                consequence:
                  'Pricing below sustainable levels reaches patients today and defunds the medicines after this one.',
                visual: { coveragePct: 96, patientsReachedPct: 93, revenueIndex: 35 },
              },
              {
                tag: 'fair',
                label: 'Value-based',
                range: [800, 1600],
                narration:
                  "Dose's projection: HTA bodies call it cost-effective. Most payers cover it; most patients who need it get it; the programme repays itself.",
                visual: { coveragePct: 85, patientsReachedPct: 82, revenueIndex: 100 },
              },
              {
                tag: 'premium',
                label: 'Premium',
                range: [1600, 2400],
                narration:
                  "Dose's projection: half the payers demand discounts or restrict use. A third of patients wait months for approval of their prescription.",
                meters: { timeline: -5, integrity: -5 },
                consequence:
                  'Premium pricing above the value case turns access into a fight for every patient.',
                visual: { coveragePct: 58, patientsReachedPct: 52, revenueIndex: 105 },
              },
              {
                tag: 'exclusionary',
                label: 'Exclusionary',
                range: [2400, 3000],
                narration:
                  "Dose's projection: HTA says no. Most payers refuse. The medicine exists, and most people with Veridian Syndrome cannot get it.",
                meters: { timeline: -10, integrity: -10 },
                consequence:
                  'A price that excludes most patients is a medicine that was developed for almost nobody.',
                visual: { coveragePct: 30, patientsReachedPct: 24, revenueIndex: 70 },
              },
            ],
          },
        },
      },
    ],
    debrief: {
      learned:
        'Market access turns approval into availability: a price payers judge worth the benefit, a value dossier that proves it, and reimbursement negotiated country by country. Too high excludes patients; too low defunds the next medicine.',
      handoffLine:
        'You hand the price and the value story to the Brand Manager, who may only say what the label says.',
    },
  },

  // ------------------------------------------------------------------ w8-l3 Brand / Product Marketing Manager
  {
    id: 'w8-l3',
    worldId: 'w8',
    roleId: 'brand-marketing-manager',
    title: 'Only what the label says',
    intro:
      'The launch campaign is drafted. Every claim must be on-label, substantiated and [[fair-balance|balanced]] with the risks. One claim in this campaign is [[off-label|off-label]]. Find it before [[promotional-review|promotional review]] does, or before a regulator does.',
    meterFocus: 'integrity',
    stages: [
      {
        id: 'claims',
        title: 'Review the campaign',
        brief: 'Tap a claim to see its support. Accuse the one that cannot run.',
        game: {
          engine: 'spot-the-impostor',
          prompt: 'Which claim is off-label or unsubstantiated?',
          seconds: 100,
          targetLabel: 'the off-label claim',
          cards: [
            {
              id: 'claim-days',
              title: 'Claim A',
              lines: [
                '"21 more fatigue-free days a year versus placebo"',
                'Source: Phase III primary endpoint',
                'Boxed warning shown alongside',
              ],
              conceptId: 'fair-balance',
              explanation:
                'The primary endpoint, from the label, with the warning beside it. This is what a claim should look like.',
              consequence: 'Accusing a compliant claim delays a launch that follows the rules.',
            },
            {
              id: 'claim-adults',
              title: 'Claim B',
              lines: [
                '"For adults living with Veridian Syndrome"',
                'Source: approved indication',
                'Contraindication footnoted',
              ],
              conceptId: 'indication',
              explanation: 'The indication, word for word, with the contraindication. Compliant.',
              consequence: "Compliant claims are the campaign's foundation.",
            },
            {
              id: 'claim-teens',
              title: 'Claim C',
              lines: [
                '"Ask about VX-101 for teenagers with early symptoms"',
                'Source: none; no adolescent data',
                'No warning shown',
              ],
              impostor: true,
              confirm: 'Found it: an unapproved population, no data, no warning.',
              conceptId: 'off-label',
              explanation:
                'The label says adults. Adolescents were never studied. Promoting an unapproved use is illegal.',
              consequence: 'Off-label promotion has cost companies billions in fines and destroyed launches.',
            },
            {
              id: 'claim-monitor',
              title: 'Claim D',
              lines: [
                '"Monthly liver tests for six months keep treatment on track"',
                'Source: label monitoring section',
                'Presented as a requirement, not a burden',
              ],
              conceptId: 'prescribing-information',
              explanation: 'Turning the monitoring requirement into clear guidance is compliant and useful.',
              consequence: 'Campaigns that hide monitoring requirements are unbalanced.',
            },
            {
              id: 'claim-quality',
              title: 'Claim E',
              lines: [
                '"Made to the same standard as every batch in the trials"',
                'Source: GMP release records',
                'Neutral, factual',
              ],
              conceptId: 'gmp',
              explanation: 'A factual, substantiated statement about manufacturing. Fine.',
              consequence: 'Factual claims need substantiation, and this one has it.',
            },
          ],
          signOff: {
            id: 'launch-now',
            label: 'Approve the campaign; legal can review after launch',
            shortcut: {
              meters: { timeline: 10, integrity: -25 },
              why: 'The campaign runs on launch day. So does the off-label claim, in front of a regulator who screenshots everything.',
            },
          },
        },
      },
    ],
    variants: [
      {
        when: { 'label.warnings': 'minimal' },
        patch: {
          intro:
            'The launch campaign is drafted. Every claim must be on-label, substantiated and [[fair-balance|balanced]], and with a label that buried the liver risk in a table, balance is harder to show. One claim is [[off-label|off-label]]. Find it before [[promotional-review|promotional review]] does.',
          meterOpening: { integrity: -5 },
        },
      },
      {
        when: { 'label.warnings': 'boxed' },
        patch: {
          intro:
            'The launch campaign is drafted. Every claim must be on-label, substantiated and [[fair-balance|balanced]], and the boxed warning must appear wherever benefit is claimed. One claim is [[off-label|off-label]]. Find it before [[promotional-review|promotional review]] does.',
        },
      },
    ],
    debrief: {
      learned:
        'Promotion may claim only what the approved label says, backed by evidence, with risks presented in fair balance. An unapproved population or use is off-label, and promoting it is illegal everywhere.',
      handoffLine:
        'You hand the compliant campaign to the field. Medical Science Liaisons handle the questions marketing may not.',
    },
  },

  // ------------------------------------------------------------------ w8-l4 Medical Science Liaison
  {
    id: 'w8-l4',
    worldId: 'w8',
    roleId: 'medical-science-liaison',
    title: 'The scientific conversation',
    intro:
      "You are the company's scientist in the field, not its salesperson. Doctors ask you what marketing cannot answer. Every reply must be scientific, balanced and [[non-promotional|non-promotional]], especially when the question is off-label.",
    meterFocus: 'integrity',
    mayaCameo: {
      stageId: 'talk',
      itemId: 'n-patient',
      presentation: 'dialogue',
      label: 'A patient at the clinic',
      debriefLine:
        'The patient in the waiting room who asked about the liver tests was Maya. Month two on VX-101, monitored monthly, doing well.',
    },
    stages: [
      {
        id: 'talk',
        title: 'Answer the questions',
        brief: 'Three conversations. Say what the science says, and nothing more.',
        game: {
          engine: 'branching-scenario',
          start: 'n-offlabel',
          nodes: [
            {
              id: 'n-offlabel',
              speaker: 'Specialist',
              text: 'I have a 16-year-old with early Veridian Syndrome. Would VX-101 work for her?',
              choices: [
                {
                  id: 'c-data',
                  text: 'Explain no adolescent data exist, share the adult evidence, and leave the decision to her',
                  confirm: 'Scientific, balanced, and the decision stays hers.',
                  quality: 'best',
                  next: 'n-patient',
                  conceptId: 'non-promotional',
                  explanation:
                    'An unsolicited off-label question gets a factual, balanced scientific answer. Not a recommendation.',
                  consequence: 'This is the line between medical exchange and illegal promotion.',
                },
                {
                  id: 'c-encourage',
                  text: 'Say many doctors are already using it in teenagers with good results',
                  quality: 'bad',
                  next: 'n-patient',
                  conceptId: 'off-label',
                  shortcut: {
                    meters: { timeline: 10, integrity: -25 },
                    why: 'She prescribes it tomorrow. And the company has just promoted an unapproved use through its scientist, which regulators treat as worse than an ad.',
                  },
                  explanation:
                    'Anecdotes about off-label use, from a company employee, are promotion. There are no adolescent data.',
                  consequence:
                    'MSLs who encourage off-label use turn a compliance function into evidence for prosecutors.',
                },
                {
                  id: 'c-refuse',
                  text: 'Refuse to discuss anything off-label at all',
                  quality: 'ok',
                  next: 'n-patient',
                  meters: { integrity: -5 },
                  conceptId: 'medical-information',
                  explanation:
                    'Too cautious. Doctors may ask, and MSLs may answer scientifically. Silence leaves her guessing.',
                  consequence: 'Refusing all scientific exchange pushes doctors to less reliable sources.',
                },
              ],
            },
            {
              id: 'n-patient',
              text: 'In the waiting room, a patient on VX-101 overhears and asks: "The monthly liver tests. Are they really necessary if I feel fine?"',
              choices: [
                {
                  id: 'c-refer',
                  text: 'Explain why the tests exist, and refer her to her doctor for her own care',
                  confirm: 'Right: inform, then refer to the treating doctor.',
                  quality: 'best',
                  next: 'n-adverse',
                  conceptId: 'medical-information',
                  explanation:
                    'Company staff may explain the label; individual medical advice belongs to her doctor.',
                  consequence:
                    'Company employees advising patients directly is a boundary regulators police.',
                },
                {
                  id: 'c-advise',
                  text: 'Tell her she can probably skip them if her first two were normal',
                  quality: 'bad',
                  next: 'n-adverse',
                  meters: { safety: -20 },
                  conceptId: 'prescribing-information',
                  explanation:
                    'The label says six months. A company employee undercutting the label is a safety failure and a compliance one.',
                  consequence: 'The liver cases in the trial were caught by exactly these tests.',
                },
              ],
            },
            {
              id: 'n-adverse',
              speaker: 'Specialist',
              text: 'By the way, one of my patients on VX-101 developed jaundice last month. I managed it. Is that something you need to know?',
              choices: [
                {
                  id: 'c-report',
                  text: 'Yes: take the details and report it to pharmacovigilance within one business day',
                  confirm: 'Yes: every employee is a reporting channel.',
                  quality: 'best',
                  next: 'end-good',
                  conceptId: 'spontaneous-report',
                  explanation:
                    'Any company employee who hears of an adverse event must pass it to safety, fast. This is a [[spontaneous-report|spontaneous report]].',
                  consequence: 'Post-market safety depends on employees passing on what they hear.',
                },
                {
                  id: 'c-managed',
                  text: 'Say that since it was managed, it need not be reported',
                  quality: 'bad',
                  next: 'end-missed',
                  meters: { safety: -15 },
                  conceptId: 'spontaneous-report',
                  explanation:
                    'Managed or not, jaundice on a drug with a boxed liver warning is exactly the report the signal team needs.',
                  consequence: 'Unreported events are how a real-world signal is missed for a year.',
                },
              ],
            },
            {
              id: 'end-good',
              text: 'Three conversations, three boundaries held: science not promotion, information not advice, and every event reported.',
              end: {
                summary: 'The MSL says what the evidence says, to the right person, and reports the rest.',
              },
            },
            {
              id: 'end-missed',
              text: 'The jaundice case never reaches the safety database. Nine months later, the signal detection team finds it in a hospital letter, with six others.',
              end: { summary: 'A managed case is still a case.' },
            },
          ],
        },
      },
    ],
    debrief: {
      learned:
        'Medical Science Liaisons exchange science, not sales: they answer unsolicited off-label questions with balanced evidence, leave individual advice to doctors, and report every adverse event they hear about within a day.',
      handoffLine:
        "You hand the doctor's jaundice report to Pharmacovigilance and the field to the Sales Representative.",
    },
  },

  // ------------------------------------------------------------------ w8-l5 Sales Representative
  {
    id: 'w8-l5',
    worldId: 'w8',
    roleId: 'sales-representative',
    title: 'Five minutes with the doctor',
    intro:
      'You have five minutes in a clinic corridor. [[detailing|Detailing]] means presenting VX-101 from approved materials only, with the boxed warning as prominent as the benefit. The doctor will test the line. Hold it.',
    meterFocus: 'integrity',
    stages: [
      {
        id: 'detail',
        title: 'The detail',
        brief: 'Three moments. Approved materials, fair balance, no promises.',
        game: {
          engine: 'branching-scenario',
          start: 'n-open',
          nodes: [
            {
              id: 'n-open',
              speaker: 'Doctor',
              text: 'Two minutes. What does it do?',
              choices: [
                {
                  id: 'c-balanced',
                  text: 'Show the approved visual: 21 more fatigue-free days a year, boxed liver warning, monthly monitoring',
                  confirm: 'Benefit and risk, from the approved piece.',
                  quality: 'best',
                  next: 'n-compare',
                  conceptId: 'fair-balance',
                  explanation:
                    'Approved materials present benefit and risk together. That is [[fair-balance|fair balance]].',
                  consequence:
                    'Reps who lead with benefit and mumble the warning generate the complaints regulators act on.',
                },
                {
                  id: 'c-benefit-only',
                  text: 'Lead with the benefit; mention the warning only if asked',
                  quality: 'bad',
                  next: 'n-compare',
                  meters: { integrity: -15 },
                  conceptId: 'fair-balance',
                  explanation:
                    'A boxed warning is not optional context. Omitting it is a misleading presentation.',
                  consequence: 'Unbalanced detailing is the most common promotional violation.',
                },
                {
                  id: 'c-my-words',
                  text: 'Explain it in your own words; the visual is dull',
                  quality: 'ok',
                  next: 'n-compare',
                  meters: { integrity: -5 },
                  conceptId: 'promotional-review',
                  explanation: 'Only reviewed materials are approved. Your own words are unreviewed claims.',
                  consequence:
                    'Improvised claims are unreviewed claims, and unreviewed claims cause recalls of campaigns.',
                },
              ],
            },
            {
              id: 'n-compare',
              speaker: 'Doctor',
              text: 'Is it better than the anti-inflammatory I already use for these patients?',
              choices: [
                {
                  id: 'c-no-data',
                  text: 'Say no head-to-head data exist; offer to have an MSL share what is known',
                  confirm: 'Honest: no comparison data, so no comparison claim.',
                  quality: 'best',
                  next: 'n-dinner',
                  conceptId: 'promotional-review',
                  explanation:
                    'A comparative claim needs comparative evidence. There is none, so the honest answer is no, and the scientific question goes to the MSL.',
                  consequence: 'Comparative claims without head-to-head trials are false advertising.',
                },
                {
                  id: 'c-better',
                  text: 'Say yes, it is much better; everyone is switching',
                  quality: 'bad',
                  next: 'n-dinner',
                  conceptId: 'off-label',
                  shortcut: {
                    meters: { timeline: 10, integrity: -20 },
                    why: 'She switches three patients this week. And the company made a comparative claim with no data, which the competitor reports the same afternoon.',
                  },
                  explanation:
                    'Unsupported comparative claims are among the fastest ways to a warning letter.',
                  consequence: 'Competitors monitor rep claims and report them.',
                },
              ],
            },
            {
              id: 'n-dinner',
              speaker: 'Doctor',
              text: 'There is a conference in Lisbon next month. Could the company cover my flights and hotel?',
              choices: [
                {
                  id: 'c-decline',
                  text: 'Decline; explain the company cannot pay for travel, but can share the congress data afterwards',
                  confirm: 'Right: no gifts, no travel, no inducements.',
                  quality: 'best',
                  next: 'end-clean',
                  conceptId: 'inducement',
                  explanation:
                    "Paying a prescriber's travel is an [[inducement]]. The rules on this are strict almost everywhere.",
                  consequence: 'Inducements to prescribe are bribery under most anti-corruption laws.',
                },
                {
                  id: 'c-pay',
                  text: 'Say you will see what you can do',
                  quality: 'bad',
                  next: 'end-dirty',
                  meters: { integrity: -20 },
                  conceptId: 'inducement',
                  explanation:
                    '"See what I can do" is a promise of an inducement. The transcript reads badly in court.',
                  consequence:
                    'Travel for prescribers has produced some of the largest corporate fines in the industry.',
                },
              ],
            },
            {
              id: 'end-clean',
              text: 'Five minutes, three lines held. The doctor has the approved facts, a route to the science, and no reason to feel bought.',
              end: { summary: 'Compliant selling is slower and survives the audit.' },
            },
            {
              id: 'end-dirty',
              text: "The flights are booked. Two years later, a whistleblower's email lands the conversation in a settlement announcement.",
              end: { summary: 'The cheapest inducement is the most expensive sentence in the transcript.' },
            },
          ],
        },
      },
    ],
    debrief: {
      learned:
        'Compliant detailing uses approved materials only, presents benefit and risk in fair balance, makes no comparative claims without data, and never offers anything of value to influence prescribing.',
      handoffLine:
        'You hand the field feedback to Pharmacovigilance. Something in the real-world reports is starting to show.',
    },
  },

  // ------------------------------------------------------------------ w8-l6 Post-Market Pharmacovigilance / Signal Detection Scientist
  {
    id: 'w8-l6',
    worldId: 'w8',
    roleId: 'signal-detection-scientist',
    title: 'The signal in the noise',
    intro:
      'Forty thousand patients are on VX-101. [[spontaneous-report|Spontaneous reports]] arrive daily: most are noise. [[signal-detection|Signal detection]] means finding the pattern that is real. One of these five is a signal that must go to the regulator.',
    meterFocus: 'safety',
    stages: [
      {
        id: 'signals',
        title: 'Find the signal',
        brief: 'Tap a pattern to see its evidence. Accuse the real signal.',
        game: {
          engine: 'spot-the-impostor',
          prompt: 'Which pattern is a real safety signal?',
          seconds: 100,
          targetLabel: 'the real signal',
          cards: [
            {
              id: 'sig-headache',
              title: 'Headache',
              lines: ['300 reports', 'Already in the label as common', 'Reporting rate flat over time'],
              conceptId: 'signal-detection',
              explanation: 'Known, labelled, stable. Noise, not signal.',
              consequence: 'Chasing labelled, expected events wastes the capacity to find the real one.',
            },
            {
              id: 'sig-pancreas',
              title: 'Pancreatitis',
              lines: [
                '9 reports in 3 months, 1 expected by background rate',
                'Not in the label',
                '6 of 9 within weeks of starting, 2 recurred on rechallenge',
              ],
              impostor: true,
              confirm: 'Found it: unexpected, disproportionate, timed, and recurring on rechallenge.',
              conceptId: 'disproportionality',
              explanation:
                'Nine versus one expected is [[disproportionality|disproportionate]]. Not labelled, time-linked, recurring on rechallenge: a signal. Validate and report it.',
              consequence:
                'A missed post-market signal is how a drug harms thousands before its label changes.',
            },
            {
              id: 'sig-liver',
              title: 'Liver enzyme rise',
              lines: [
                '120 reports',
                'Boxed warning already in place',
                'Rate matches the trial rate; monitoring catching cases early',
              ],
              conceptId: 'signal-detection',
              explanation: 'Known, boxed, and behaving as the trials predicted. Watched, not new.',
              consequence: 'The boxed warning is doing its job; the monitoring is why cases are mild.',
            },
            {
              id: 'sig-social',
              title: 'Hair loss',
              lines: [
                '40 social media posts, 3 formal reports',
                'Background rate in this population is high',
                'No time pattern',
              ],
              conceptId: 'spontaneous-report',
              explanation:
                'A social media cluster with no time pattern and a high background rate: monitor, but not a signal yet.',
              consequence: 'Acting on every online cluster would relabel every drug monthly.',
            },
            {
              id: 'sig-fracture',
              title: 'Fractures',
              lines: [
                '15 reports',
                'All in patients over 70 with prior osteoporosis',
                'Rate below the background rate',
              ],
              conceptId: 'signal-detection',
              explanation: 'Below the expected rate, in a group already at risk. Not a signal.',
              consequence: 'Confusing background events with drug effects produces false alarms.',
            },
          ],
          signOff: {
            id: 'quarterly-review',
            label: 'Defer to the quarterly review; nothing looks urgent',
            shortcut: {
              meters: { timeline: 10, safety: -25 },
              why: 'A quiet quarter. And nine pancreatitis cases become thirty before anyone looks again.',
            },
          },
        },
      },
    ],
    variants: [
      {
        when: { 'label.warnings': 'minimal' },
        patch: {
          intro:
            'Forty thousand patients are on VX-101, with a label that buried the liver risk in a table. [[spontaneous-report|Spontaneous reports]] arrive daily. [[signal-detection|Signal detection]] means finding the pattern that is real. One of these five must go to the regulator.',
          meterOpening: { safety: -10 },
          stages: {
            signals: {
              items: {
                cards: {
                  replace: [
                    {
                      id: 'sig-liver',
                      lines: [
                        '210 reports, 14 serious',
                        'Only a table entry in the label',
                        'Many patients never had the monthly tests',
                      ],
                      explanation:
                        "Known, but the label never made doctors monitor. Serious cases are arriving that the trials' monitoring would have caught.",
                    },
                  ],
                },
              },
            },
          },
        },
      },
      {
        when: { 'label.warnings': 'boxed' },
        patch: {
          intro:
            'Forty thousand patients are on VX-101, and the boxed warning is doing its work. [[spontaneous-report|Spontaneous reports]] arrive daily; most are noise. [[signal-detection|Signal detection]] means finding the pattern that is real. One of these five must go to the regulator.',
        },
      },
    ],
    emits: [],
    debrief: {
      learned:
        'Post-market safety watches spontaneous reports for signals: unexpected events, reported more often than the background rate, with a time link and, at best, recurrence on rechallenge. A validated signal goes to the regulator and, if confirmed, into the label.',
      handoffLine:
        'You hand the pancreatitis signal to the regulator and to the Real-World Evidence Lead, who must design the study that settles it.',
    },
  },

  // ------------------------------------------------------------------ w8-l7 Real-World Evidence / Phase IV Lead
  {
    id: 'w8-l7',
    worldId: 'w8',
    roleId: 'rwe-lead',
    title: 'The study after approval',
    intro:
      'The regulator accepts the signal and requires a [[phase-4|post-approval study]]. Design it: a question the trials could not answer, in the patients who actually take the drug, using [[rwe|real-world evidence]] where it fits and a trial where it does not.',
    meterFocus: 'integrity',
    stages: [
      {
        id: 'design',
        title: 'Design the study',
        brief: 'Tap a part, then the slot it fits. Some parts fit nowhere.',
        game: {
          engine: 'builder',
          prompt: 'Assemble the post-approval study.',
          seconds: 95,
          slots: [
            { id: 'question', label: 'Question', hint: 'What must be settled' },
            { id: 'source', label: 'Data source', hint: 'Where the answer lives' },
            { id: 'comparator', label: 'Comparator', hint: 'Against what' },
            { id: 'commitment', label: 'Commitment', hint: 'What is promised to the regulator' },
          ],
          parts: [
            {
              id: 'q-pancreas',
              text: 'Does VX-101 increase the rate of pancreatitis, and in whom?',
              slotId: 'question',
              confirm: 'The question the signal raised, made answerable.',
              conceptId: 'phase-4',
              explanation:
                'A post-approval study answers the specific safety question the trials could not, in the real population.',
              consequence: 'Vague questions produce studies that settle nothing.',
            },
            {
              id: 'q-market',
              text: 'Does VX-101 outperform competitors in patient satisfaction?',
              conceptId: 'phase-4',
              explanation: 'A marketing question dressed as research. The regulator required a safety study.',
              consequence: 'Studies run for marketing are recognised and discounted.',
            },
            {
              id: 'src-registry',
              text: 'A disease [[registry]] linked to hospital records, 40,000 patients',
              slotId: 'source',
              confirm: 'Registry plus records: real patients, real outcomes.',
              conceptId: 'registry',
              explanation:
                'Registries and linked records capture what happens to everyone on the drug, not just trial volunteers.',
              consequence: 'Without real-world data, rare events stay invisible for years.',
            },
            {
              id: 'src-social',
              text: 'Social media mentions of VX-101',
              conceptId: 'rwe',
              explanation: 'Mentions are not diagnoses. Useful for listening, not for measuring rates.',
              consequence: 'Studies built on social media cannot establish incidence.',
            },
            {
              id: 'comp-similar',
              text: 'Patients with Veridian Syndrome on other treatments, matched for age and severity',
              slotId: 'comparator',
              confirm: 'A matched comparison separates the drug from the disease.',
              conceptId: 'rwe',
              explanation:
                'Comparing to similar patients not on VX-101 shows whether the drug, or the disease, causes the events.',
              consequence: 'Without a comparator, every disease complication looks like a drug effect.',
            },
            {
              id: 'comp-none',
              text: 'No comparator; just count the cases',
              conceptId: 'rwe',
              explanation: 'A count without a comparison cannot tell excess from background.',
              consequence: 'Uncontrolled counts produce either panic or false reassurance.',
            },
            {
              id: 'commit-full',
              text: 'Report interim results yearly; update the label if the risk is confirmed',
              slotId: 'commitment',
              confirm: 'A real commitment with a label consequence.',
              conceptId: 'post-approval-commitment',
              explanation:
                'A [[post-approval-commitment|post-approval commitment]] is a promise with dates and consequences.',
              consequence: 'Commitments without dates are commitments nobody keeps.',
            },
            {
              id: 'commit-none',
              text: 'Run the study quietly; publish only if the results are favourable',
              conceptId: 'post-approval-commitment',
              shortcut: {
                meters: { timeline: 10, integrity: -25 },
                why: 'No bad news for years. Then a journalist finds the unpublished study, and the bad news is the cover-up.',
              },
              explanation: 'Selective publication of safety studies is the definition of hiding a risk.',
              consequence: "Unpublished safety data have ended companies' credibility overnight.",
            },
          ],
        },
      },
    ],
    debrief: {
      learned:
        'Post-approval studies answer what the trials could not, in the patients who take the drug: a precise question, real-world data with a comparator, and a commitment to report and relabel. A medicine is studied as long as it is used.',
      handoffLine:
        'You hand the study plan to the regulator. VX-101 is a medicine that will be watched for the rest of its life. Maya takes hers every morning.',
    },
  },
];
