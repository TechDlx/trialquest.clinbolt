import type { Level } from '../../types';

/** World 6 — Phase III. Seven levels; the DSMB level carries Maya as a blinded data point. */
export const w6Levels: Level[] = [
  // ------------------------------------------------------------------ w6-l1 Global Study Manager
  {
    id: 'w6-l1',
    worldId: 'w6',
    roleId: 'global-study-manager',
    title: 'Forty countries, one deadline',
    intro:
      'The [[phase-3|Phase III]] study runs at 180 sites in 40 countries. Problems arrive from every time zone and each one has a window. Route each escalation through the right steps before a country stalls.',
    meterFocus: 'timeline',
    stages: [
      {
        id: 'ops',
        title: 'Run the week',
        brief: 'Tap an escalation, then its stations in order. More arrive as you work.',
        game: {
          engine: 'dash-manager',
          prompt: 'Keep every country moving.',
          seconds: 120,
          stations: [
            { id: 'assess', label: 'Assess impact' },
            { id: 'plan', label: 'Agree a plan' },
            { id: 'approve', label: 'Get approval' },
            { id: 'execute', label: 'Execute & track' },
            {
              id: 'push',
              label: 'Push sites to enrol faster',
              shortcut: {
                meters: { timeline: 10, integrity: -15 },
                why: 'Enrolment ticks up for a month. So do eligibility deviations, because sites under pressure round the criteria in your favour.',
              },
            },
          ],
          items: [
            {
              id: 'lag-country',
              label: 'Country A: enrolment 40% behind',
              steps: ['assess', 'plan', 'approve', 'execute'],
              patienceSeconds: 45,
              arrivesAt: 0,
              conceptId: 'enrolment-rate',
              explanation:
                'Assess why, agree a plan (more sites, better referral), get it approved, then execute and track.',
              consequence:
                'A lagging country left alone becomes the reason the whole study finishes a year late.',
            },
            {
              id: 'amendment',
              label: 'Protocol amendment needs 40 ethics approvals',
              steps: ['plan', 'approve', 'execute'],
              patienceSeconds: 45,
              arrivesAt: 12,
              conceptId: 'protocol-amendment',
              explanation:
                'A [[protocol-amendment|amendment]] rolls out country by country; plan the sequence and track each approval.',
              consequence:
                'Sites running on the old version after others switch produce data that cannot be pooled.',
            },
            {
              id: 'import',
              label: 'Country B: drug stuck at customs',
              steps: ['assess', 'plan', 'execute'],
              patienceSeconds: 40,
              arrivesAt: 26,
              conceptId: 'clinical-supply',
              explanation:
                'Assess how many patients are due, plan a reroute, execute before a site runs dry.',
              consequence:
                'Patients who miss a dose because of customs are protocol deviations nobody planned.',
            },
            {
              id: 'staff',
              label: 'Site 088: coordinator resigned',
              steps: ['assess', 'plan', 'execute'],
              patienceSeconds: 35,
              arrivesAt: 42,
              conceptId: 'site-feasibility',
              explanation:
                'Assess the visits at risk, plan cover and training, execute before the next visit window.',
              consequence: 'An unstaffed site misses visits and loses data for every enrolled patient.',
            },
            {
              id: 'dsmb-request',
              label: 'DSMB requests an extra safety listing',
              steps: ['plan', 'execute'],
              patienceSeconds: 30,
              arrivesAt: 56,
              conceptId: 'dsmb',
              explanation: 'A committee request has priority: plan who produces it and deliver it.',
              consequence: 'A DSMB kept waiting delays the interim decision for everyone.',
            },
          ],
        },
      },
    ],
    debrief: {
      learned:
        'A global study is managed by escalation: assess the impact, agree a plan, get it approved, execute and track. Pushing sites for speed buys enrolment and pays for it in deviations.',
      handoffLine: 'You hand the site-level dashboards to the Central Monitor, who reads them for risk.',
    },
  },

  // ------------------------------------------------------------------ w6-l2 Central Monitor / Risk-Based Monitoring Analyst
  {
    id: 'w6-l2',
    worldId: 'w6',
    roleId: 'central-monitor',
    title: 'The outlier site',
    intro:
      "You never leave the office. [[risk-based-monitoring|Risk-based monitoring]] means reading every site's data against the rest and sending the monitors where the numbers are strange. Five site dashboards. One needs a visit this week.",
    meterFocus: 'integrity',
    stages: [
      {
        id: 'dashboards',
        title: 'Read the dashboards',
        brief:
          'Tap a site to see its [[key-risk-indicator|risk indicators]]. Accuse the one that needs an urgent visit.',
        game: {
          engine: 'spot-the-impostor',
          prompt: 'Which site is the outlier?',
          seconds: 100,
          targetLabel: 'the outlier site',
          cards: [
            {
              id: 'site-021',
              title: 'Site 021',
              lines: [
                'Enrolment on plan',
                'Query rate near the study average',
                'AE rate near the study average',
              ],
              conceptId: 'key-risk-indicator',
              explanation: 'Average on every indicator. A visit here finds nothing new.',
              consequence: 'Sending monitors to average sites is the old, expensive model.',
            },
            {
              id: 'site-034',
              title: 'Site 034',
              lines: ['Enrolment slow', 'Query rate slightly high', 'Two documented deviations, both minor'],
              conceptId: 'risk-based-monitoring',
              explanation: 'Slow and slightly messy: a support call, not an urgent visit.',
              consequence: 'Every slow site is not a risk site.',
            },
            {
              id: 'site-047',
              title: 'Site 047',
              lines: [
                'Enrolment fastest in the study',
                'Zero queries in 6 months',
                'AE rate one fifth of the average',
                'Visit dates cluster on Fridays',
              ],
              impostor: true,
              confirm: 'Found it: too fast, too clean, too few events.',
              conceptId: 'key-risk-indicator',
              explanation:
                'Fast, clean and event-free at once is the fabrication pattern. Send a monitor for source verification now.',
              consequence: 'Central monitoring exists to catch this before the data reach the analysis.',
            },
            {
              id: 'site-052',
              title: 'Site 052',
              lines: ['Enrolment on plan', 'AE rate above average', 'Every AE has source and follow-up'],
              conceptId: 'risk-based-monitoring',
              explanation: 'A high, well-documented AE rate is a site that reports properly.',
              consequence: 'Punishing honest reporting teaches sites to stop reporting.',
            },
            {
              id: 'site-063',
              title: 'Site 063',
              lines: ['Enrolment on plan', 'One late SAE report, corrected', 'Retraining documented'],
              conceptId: 'monitoring-visit',
              explanation: 'One slip, corrected and retrained. Watch, do not rush.',
              consequence: 'A corrected error is a site learning; an outlier is a site hiding.',
            },
          ],
          signOff: {
            id: 'routine-schedule',
            label: 'Keep the routine visit schedule; nothing looks urgent',
            shortcut: {
              meters: { timeline: 10, integrity: -20 },
              why: "No extra travel this quarter. And Site 047's data sit in the analysis set for another four months.",
            },
          },
        },
      },
    ],
    variants: [
      {
        when: { 'monitoring.deviations': 'noisy' },
        patch: {
          intro:
            "You never leave the office. [[risk-based-monitoring|Risk-based monitoring]] means reading every site's data against the rest. Phase II monitoring was signed off without looking, so the baseline is noisy. Five site dashboards. One needs a visit this week.",
          meterOpening: { integrity: -5 },
        },
      },
      {
        when: { 'monitoring.deviations': 'clean' },
        patch: {
          intro:
            "You never leave the office. [[risk-based-monitoring|Risk-based monitoring]] means reading every site's data against the rest. Phase II monitoring was thorough, so the baseline is trustworthy. Five site dashboards. One needs a visit this week.",
        },
      },
    ],
    debrief: {
      learned:
        'Central monitoring compares sites on risk indicators: enrolment speed, query rate, event rate, visit timing. The dangerous site is the one that looks too good. Monitors go where the numbers say.',
      handoffLine: 'You hand the outlier to the QA Auditor for a formal audit.',
    },
  },

  // ------------------------------------------------------------------ w6-l3 QA Auditor
  {
    id: 'w6-l3',
    worldId: 'w6',
    roleId: 'qa-auditor',
    title: 'Grade the findings',
    intro:
      'The [[audit]] of Site 047 is done. Now grade what you found: critical, major or minor. The grade decides what happens next, from a retraining note to reporting the site to the regulator.',
    meterFocus: 'integrity',
    stages: [
      {
        id: 'grade',
        title: 'Classify each finding',
        brief: 'Critical, major, or minor?',
        game: {
          engine: 'bucket-sort',
          prompt: 'Grade each [[audit-finding|audit finding]].',
          seconds: 75,
          buckets: [
            { id: 'critical', label: 'Critical', hint: 'Participants harmed or data unreliable; report it' },
            { id: 'major', label: 'Major', hint: 'Could affect safety or data; needs a corrective plan' },
            { id: 'minor', label: 'Minor', hint: 'Isolated slip; fix and note' },
            {
              id: 'downgrade',
              label: 'Downgrade to keep the site',
              hint: 'It is our fastest site',
              shortcut: {
                meters: { timeline: 10, integrity: -20 },
                why: 'The site stays open and enrolling. The audit report becomes a document you hope nobody reads next to the data.',
              },
            },
          ],
          cards: [
            {
              id: 'f-fabricated',
              text: 'Visit data for four patients entered with no source; two patients cannot be shown to exist',
              bucketId: 'critical',
              confirm: 'Critical: data are unreliable and participants may not exist.',
              conceptId: 'audit-finding',
              explanation:
                "Fabrication is critical by definition. It goes to the sponsor's leadership and the regulator.",
              consequence: 'Grading fabrication below critical is itself a compliance failure.',
            },
            {
              id: 'f-consent',
              text: 'Three patients consented on an outdated consent form after the amendment',
              bucketId: 'major',
              confirm: 'Major: consent gap with a corrective plan.',
              conceptId: 'audit-finding',
              explanation:
                'Real consent, wrong version: patients must be re-consented and the process fixed with a [[capa|CAPA]].',
              consequence: 'Left ungraded, version slips become systematic.',
            },
            {
              id: 'f-temp',
              text: 'One fridge temperature log missing for a single weekend, drug within range before and after',
              bucketId: 'minor',
              confirm: 'Minor: isolated, no impact shown.',
              conceptId: 'audit-finding',
              explanation: 'An isolated gap with evidence the drug stayed in range: fix the log and note it.',
              consequence: 'Grading every gap as major buries the findings that matter.',
            },
            {
              id: 'f-delegation',
              text: 'A nurse assessed adverse events for two months before being added to the delegation log',
              bucketId: 'major',
              confirm: 'Major: undelegated tasks affect the data.',
              conceptId: 'delegation-log',
              explanation:
                'Work done by someone not on the [[delegation-log|delegation log]] is work nobody authorised. Retrain, correct, document.',
              consequence: 'Undelegated assessments can be excluded from the analysis.',
            },
            {
              id: 'f-cv',
              text: "The investigator's CV on file is dated four years ago",
              bucketId: 'minor',
              confirm: 'Minor: update the document.',
              conceptId: 'essential-documents',
              explanation: 'An out-of-date CV is a housekeeping finding.',
              consequence:
                'Over-grading paperwork makes audits feel like punishment and sites stop cooperating.',
            },
          ],
        },
      },
    ],
    debrief: {
      learned:
        'Audits grade findings by impact: critical (harm or unreliable data, reported up and out), major (needs a corrective and preventive plan), minor (fix and note). Downgrading to protect enrolment is the shortcut that ends careers.',
      handoffLine:
        'You hand the audit report to the DSMB, who must decide whether the study itself should continue.',
    },
  },

  // ------------------------------------------------------------------ w6-l4 DSMB Member
  {
    id: 'w6-l4',
    worldId: 'w6',
    roleId: 'dsmb-member',
    title: 'The interim look',
    intro:
      'You sit on the [[dsmb|Data Safety Monitoring Board]]: the only people allowed to see unblinded results before the end. The [[interim-analysis|interim analysis]] is on the table. Continue, modify, or stop?',
    meterFocus: 'safety',
    mayaCameo: {
      stageId: 'decide',
      itemId: 'n-point',
      presentation: 'blinded-point',
      label: 'Participant 0417',
      debriefLine:
        'The point on the fatigue chart you looked at was Maya. You still do not know which arm she is in. Neither does she.',
    },
    stages: [
      {
        id: 'decide',
        title: 'Decide',
        brief: "Three decisions, unblinded, with the trial's future on the table.",
        game: {
          engine: 'branching-scenario',
          start: 'n-safety',
          nodes: [
            {
              id: 'n-safety',
              speaker: 'Independent statistician',
              text: 'Unblinded safety: liver enzyme rises are 4% on VX-101 versus 1% on placebo. None serious. Efficacy is not at the stopping boundary either way.',
              choices: [
                {
                  id: 'c-continue-watch',
                  text: 'Continue; add liver monitoring and a lower threshold for the next look',
                  confirm: 'Continue with tighter monitoring: proportionate.',
                  quality: 'best',
                  next: 'n-point',
                  conceptId: 'interim-analysis',
                  explanation:
                    'A manageable imbalance with no serious cases justifies continuing with closer watching, not stopping.',
                  consequence:
                    'Stopping every trial at the first imbalance means no drug with any side effect ever gets tested.',
                },
                {
                  id: 'c-stop-harm',
                  text: 'Stop the trial for harm',
                  quality: 'ok',
                  next: 'n-point',
                  meters: { timeline: -15 },
                  conceptId: 'dsmb',
                  explanation:
                    'Cautious, but 4% mild enzyme rises with no serious cases is not the harm boundary the charter set.',
                  consequence:
                    'Stopping for an imbalance below the boundary throws away a possibly effective drug.',
                },
                {
                  id: 'c-ignore',
                  text: 'Note it and continue unchanged; enzymes are normal noise',
                  quality: 'bad',
                  next: 'n-point',
                  meters: { safety: -10 },
                  conceptId: 'interim-analysis',
                  explanation:
                    'A 4-to-1 imbalance in the target organ is a signal to watch, not noise to dismiss.',
                  consequence: 'Committees that dismiss early signals are named in the inquiry later.',
                },
              ],
            },
            {
              id: 'n-point',
              text: "One point on the fatigue chart sits at the edge of its arm: a patient whose good and bad weeks do not fit the average. The sponsor's observer asks which arm it is in.",
              choices: [
                {
                  id: 'c-no-tell',
                  text: 'Decline. The sponsor stays blinded; the board reports decisions, not data',
                  confirm: 'Right: the sponsor never sees arm-level data.',
                  quality: 'best',
                  next: 'n-futility',
                  conceptId: 'dsmb',
                  explanation:
                    'The board exists so the sponsor can stay blinded. One answer breaks that for the whole trial.',
                  consequence:
                    'A sponsor that learns arm-level results cannot run the rest of the trial without bias.',
                },
                {
                  id: 'c-tell',
                  text: 'Tell them; it is one point and they are paying for the study',
                  quality: 'bad',
                  next: 'n-futility',
                  conceptId: 'unblinding',
                  shortcut: {
                    meters: { timeline: 10, integrity: -20 },
                    why: 'The sponsor would plan the launch a year early. And every decision they make from now on is made knowing the answer.',
                  },
                  explanation:
                    'Paying for the study buys no right to unblinded data. That is the point of the board.',
                  consequence: 'Sponsor unblinding at interim is a critical finding that can void the trial.',
                },
              ],
            },
            {
              id: 'n-futility',
              speaker: 'Independent statistician',
              text: "The conditional power calculation says there is still a 55% chance of a positive result if the trial continues. The sponsor's [[futility|futility]] boundary was 20%.",
              choices: [
                {
                  id: 'c-continue',
                  text: 'Continue; the trial is well above the futility boundary',
                  confirm: 'Continue: the boundary was set in advance for a reason.',
                  quality: 'best',
                  next: 'end-continue',
                  conceptId: 'futility',
                  explanation:
                    'Boundaries are set before the data so the decision is not made on hope or fear. 55% is far from futile.',
                  consequence:
                    'Stopping a trial that could still succeed wastes every patient who took part.',
                },
                {
                  id: 'c-stop-early',
                  text: 'Stop for futility; 55% is a coin flip',
                  quality: 'bad',
                  next: 'end-stop',
                  meters: { timeline: -20 },
                  conceptId: 'futility',
                  explanation:
                    'The charter defined futility at 20%. Moving the line after seeing data is exactly what the charter forbids.',
                  consequence: 'Ad hoc stopping decisions are indefensible to regulators and patients.',
                },
                {
                  id: 'c-expand',
                  text: 'Recommend enrolling 100 more patients to be sure',
                  quality: 'ok',
                  next: 'end-continue',
                  meters: { timeline: -10 },
                  conceptId: 'interim-analysis',
                  explanation:
                    'Sample size re-estimation is legitimate only if the plan allowed it. Here it did not.',
                  consequence: 'Unplanned expansions raise questions about the analysis and add a year.',
                },
              ],
            },
            {
              id: 'end-continue',
              text: 'The board\'s letter to the sponsor is one line: "Continue the trial as planned, with enhanced liver monitoring." Nobody outside the room knows why.',
              end: { summary: 'The board sees everything and says almost nothing. That is the job.' },
            },
            {
              id: 'end-stop',
              text: 'The trial stops. Months later, the full data show it would probably have succeeded. The patients who enrolled get nothing, and neither does anyone after them.',
              end: { summary: 'A boundary moved after the data is not a boundary.' },
            },
          ],
        },
      },
    ],
    debrief: {
      learned:
        'A DSMB sees unblinded interim data and decides: continue, modify or stop, against boundaries fixed in a charter before the trial began. It tells the sponsor the decision, never the data.',
      handoffLine:
        'You hand "continue as planned" to the study team. The next stop is the last one: database lock.',
    },
  },

  // ------------------------------------------------------------------ w6-l5 Data Manager + Biostatistician (Database Lock)
  {
    id: 'w6-l5',
    worldId: 'w6',
    roleId: 'database-lock-lead',
    title: 'Lock and unblind',
    intro:
      'The last patient has had the last visit. What happens now decides whether the answer can be trusted: [[database-lock|lock]] the data, then and only then, [[unblinding|unblind]]. Put the steps in order. There is no undo.',
    meterFocus: 'integrity',
    shortcutPrompt: {
      id: 'peek',
      offer:
        'Dose: "The statistician could run the primary analysis now, on the near-final data, so the press release is ready the day of lock."',
      accept: {
        meters: { timeline: 10, integrity: -25 },
        why: 'A week saved. And a result seen before the data were final, which means every query closed after that is suspect.',
      },
    },
    stages: [
      {
        id: 'lock',
        title: 'Order the lock',
        brief: 'Move each step up or down, then check.',
        game: {
          engine: 'sequence-sort',
          prompt: 'Put the road from last visit to unblinding in order.',
          seconds: 80,
          items: [
            {
              id: 'queries',
              text: 'Resolve every open query and complete coding',
              conceptId: 'database-lock',
              explanation: 'Lock means nothing changes afterwards. Everything outstanding is settled first.',
              consequence:
                'Locking with open queries means unlocking later, and every unlock is a question at inspection.',
            },
            {
              id: 'reconcile',
              text: 'Reconcile the safety database with the clinical database',
              conceptId: 'data-cleaning',
              explanation: 'Every serious event must appear identically in both systems before lock.',
              consequence: 'Mismatched safety data are a standard finding at submission.',
            },
            {
              id: 'sign',
              text: 'Sign the lock checklist; remove write access',
              conceptId: 'database-lock',
              explanation: 'Lock is a signed event with a timestamp, after which nobody can edit.',
              consequence: 'A lock without removed access is not a lock.',
            },
            {
              id: 'unblind',
              text: 'Release the randomization codes to the statistician',
              conceptId: 'unblinding',
              explanation:
                'Codes are released only after the lock is signed, so no result can influence the data.',
              consequence: 'Unblinding before lock makes every later data change look like tampering.',
            },
            {
              id: 'analyse',
              text: 'Run the primary analysis exactly as the SAP describes',
              conceptId: 'sap',
              explanation: 'The analysis was written years ago. Now it runs, unchanged.',
              consequence: 'An analysis adjusted after unblinding is not the pre-specified one.',
            },
          ],
        },
      },
    ],
    debrief: {
      learned:
        'Database lock is the point of no return: queries resolved, safety data reconciled, access removed, then the codes are released and the pre-specified analysis runs. Peeking before lock taints everything after it.',
      handoffLine:
        'You hand the locked, unblinded dataset to the Statistical Programmer. The result exists now. Nobody has said it out loud.',
    },
  },

  // ------------------------------------------------------------------ w6-l6 Statistical Programmer
  {
    id: 'w6-l6',
    worldId: 'w6',
    roleId: 'statistical-programmer',
    title: 'From raw data to the answer',
    intro:
      'The locked database is thousands of raw rows. Regulators expect standard shapes: [[sdtm|SDTM]], then [[adam|ADaM]], then the [[tlf|tables, listings and figures]] the report is built from. Order the pipeline, then match each standard to its job.',
    meterFocus: 'integrity',
    shortcutPrompt: {
      id: 'skip-validation',
      offer:
        'Dose: "Double programming takes a second programmer a week. We could skip it and read the output ourselves."',
      accept: {
        meters: { timeline: 10, integrity: -15 },
        why: 'A week saved. And a table with a wrong denominator that becomes the headline number in the submission.',
      },
    },
    stages: [
      {
        id: 'pipeline',
        title: 'Order the pipeline',
        brief: 'Raw data in, tables out. Move each step into place.',
        weight: 1,
        game: {
          engine: 'sequence-sort',
          prompt: 'Put the programming pipeline in order.',
          seconds: 60,
          items: [
            {
              id: 'raw',
              text: 'Extract the locked raw data from the database',
              conceptId: 'database-lock',
              explanation: 'Everything starts from the locked extract, never from a working copy.',
              consequence:
                'Programming from an unlocked copy means results that do not match the final data.',
            },
            {
              id: 'sdtm',
              text: 'Map raw data to SDTM: one standard structure per domain',
              conceptId: 'sdtm',
              explanation:
                'SDTM organises what was collected into standard domains (adverse events, labs, exposure) any reviewer can read.',
              consequence: 'Without SDTM, regulators cannot run their own review tools on the data.',
            },
            {
              id: 'adam',
              text: 'Derive ADaM datasets: analysis-ready, with the populations and endpoints defined',
              conceptId: 'adam',
              explanation:
                'ADaM adds the derived variables and populations the SAP needs, traceable back to SDTM.',
              consequence: 'Analysis run straight from SDTM cannot be traced or reproduced.',
            },
            {
              id: 'tlf',
              text: 'Produce the tables, listings and figures from ADaM',
              conceptId: 'tlf',
              explanation: 'Every number in the report comes from a table, and every table from ADaM.',
              consequence: 'Numbers typed into a report by hand are numbers nobody can trace.',
            },
          ],
        },
      },
      {
        id: 'standards',
        title: 'Match the standard to its job',
        brief: 'Tap a standard, then what it does.',
        weight: 1,
        game: {
          engine: 'match-pairs',
          prompt: 'Match each standard to its purpose.',
          seconds: 60,
          pairs: [
            {
              id: 'm-sdtm',
              left: 'SDTM',
              right: 'Standard structure for what was collected, by domain',
              conceptId: 'sdtm',
              explanation: 'SDTM is the tabulation model: what happened, organised.',
              consequence: 'Confusing SDTM with analysis data produces untraceable results.',
            },
            {
              id: 'm-adam',
              left: 'ADaM',
              right: 'Analysis-ready datasets with derived variables and populations',
              conceptId: 'adam',
              explanation: 'ADaM is the analysis model: ready for the statistics in the SAP.',
              consequence: 'Deriving endpoints inside table code hides the logic from reviewers.',
            },
            {
              id: 'm-define',
              left: 'Define-XML',
              right: 'The metadata that explains every dataset and variable to the reviewer',
              conceptId: 'cdisc',
              explanation:
                'Define-XML is the map: without it, a reviewer opens a hundred files with no legend.',
              consequence: 'Submissions without complete metadata are refused at the gateway.',
            },
            {
              id: 'm-double',
              left: 'Double programming',
              right: 'A second programmer reproduces each output independently',
              conceptId: 'double-programming',
              explanation: 'Two people, two programs, one answer. Disagreement is caught before the report.',
              consequence:
                'Skipping [[double-programming|double programming]] ships arithmetic errors into the submission.',
            },
          ],
        },
      },
    ],
    debrief: {
      learned:
        'Statistical programming turns locked raw data into standard datasets (SDTM, then ADaM) and from them every table and figure, traceable end to end and independently reproduced. The number in the headline is a table first.',
      handoffLine:
        'You hand the validated tables and figures to the Medical Writer. The primary endpoint table says VX-101 worked.',
    },
  },

  // ------------------------------------------------------------------ w6-l7 Medical Writer
  {
    id: 'w6-l7',
    worldId: 'w6',
    roleId: 'medical-writer',
    title: 'Write the report',
    intro:
      'The [[csr|Clinical Study Report]] tells the regulator what happened, in a fixed structure ([[ich-e3|ICH E3]]) and with every number traceable to a table. Build its core from the right sources. Not every source belongs.',
    meterFocus: 'integrity',
    stages: [
      {
        id: 'assemble',
        title: 'Assemble the CSR',
        brief: 'Tap a source, then the section it feeds. Some sources feed nothing.',
        game: {
          engine: 'builder',
          prompt: 'Build the core sections of the Clinical Study Report.',
          seconds: 95,
          slots: [
            { id: 'methods', label: 'Methods', hint: 'What was planned' },
            { id: 'efficacy', label: 'Efficacy results', hint: 'What the primary endpoint showed' },
            { id: 'safety', label: 'Safety results', hint: 'What happened to patients' },
            { id: 'conclusions', label: 'Conclusions', hint: 'What it means' },
          ],
          parts: [
            {
              id: 'protocol-sap',
              text: 'Final protocol and SAP, with every amendment listed',
              slotId: 'methods',
              confirm: 'Methods come from the protocol and SAP, as amended.',
              conceptId: 'csr',
              explanation: 'Methods describe what was planned, including the changes along the way.',
              consequence: 'A methods section that hides amendments is a finding waiting to happen.',
            },
            {
              id: 'primary-table',
              text: 'Primary endpoint table from ADaM: 21 more fatigue-free days, p = 0.003',
              slotId: 'efficacy',
              confirm: 'Efficacy comes from the validated table, number for number.',
              conceptId: 'tlf',
              explanation:
                'The efficacy section reports the pre-specified analysis, from the validated table.',
              consequence: 'Any number not traceable to a table is challenged at review.',
            },
            {
              id: 'post-hoc',
              text: 'A post-hoc subgroup where the effect looked twice as large',
              conceptId: 'post-hoc-analysis',
              shortcut: {
                meters: { timeline: 10, integrity: -20 },
                why: 'A bigger number for the headline. Regulators call unplanned subgroups "exploratory" and marketing calls them "the result", and only one of them is right.',
              },
              explanation:
                'A [[post-hoc-analysis|post-hoc]] subgroup is exploratory. It can appear, labelled as such, never as the result.',
              consequence: 'Presenting post-hoc findings as primary results is a form of misconduct.',
            },
            {
              id: 'safety-tables',
              text: 'Adverse event tables by arm, with narratives for every serious event',
              slotId: 'safety',
              confirm: 'Safety: every event by arm, every serious case narrated.',
              conceptId: 'csr',
              explanation:
                'Safety reporting is complete by design: all events, both arms, narratives for the serious ones.',
              consequence: 'A safety section that summarises away the serious cases is rejected.',
            },
            {
              id: 'good-events',
              text: 'Adverse event tables for the placebo arm only',
              conceptId: 'csr',
              explanation: 'Half the safety data is not the safety data.',
              consequence: 'Selective safety reporting is a serious regulatory offence.',
            },
            {
              id: 'conclusion-fair',
              text: 'VX-101 reduced fatigue days versus placebo; liver enzyme rises were more frequent and require monitoring',
              slotId: 'conclusions',
              confirm: 'Benefit and risk, in one honest sentence.',
              conceptId: 'benefit-risk',
              explanation:
                'Conclusions state [[benefit-risk|benefit and risk]] together, in proportion to the data.',
              consequence: 'Conclusions that oversell benefit or hide risk undermine the whole submission.',
            },
            {
              id: 'conclusion-hype',
              text: 'VX-101 is a breakthrough cure for Veridian Syndrome with an excellent safety profile',
              conceptId: 'benefit-risk',
              explanation:
                '"Cure", "breakthrough" and "excellent" are not in the data. Reviewers strike them and remember who wrote them.',
              consequence:
                "Promotional language in a CSR damages the sponsor's credibility for every future submission.",
            },
          ],
        },
      },
    ],
    debrief: {
      learned:
        'The Clinical Study Report follows a fixed structure, reports the pre-specified analysis from validated tables, presents all safety data for both arms, and concludes on benefit and risk together. Exploratory findings are labelled, never headlined.',
      handoffLine:
        'You hand the Clinical Study Report to Regulatory Affairs. World 6 is over: the answer is in, and it is yes, with a warning.',
    },
  },
];
