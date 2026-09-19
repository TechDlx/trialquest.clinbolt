import type { Level } from '../../types';

/** World 7 — Submission & Approval. Five levels; the Health Authority Reviewer is the role flip. */
export const w7Levels: Level[] = [
  // ------------------------------------------------------------------ w7-l1 Regulatory Affairs Lead
  {
    id: 'w7-l1',
    worldId: 'w7',
    roleId: 'regulatory-affairs-lead',
    title: 'Build the dossier',
    intro:
      'Ten years of work becomes one application: an [[nda|NDA]] in the US, an [[maa|MAA]] in the EU, both in the [[ectd|eCTD]] format with five [[ectd-modules|modules]]. File every document in the module a reviewer will look for it in.',
    meterFocus: 'integrity',
    stages: [
      {
        id: 'modules',
        title: 'File by module',
        brief: 'Which eCTD module does each document belong in?',
        game: {
          engine: 'bucket-sort',
          prompt: 'Sort each document into its module.',
          seconds: 80,
          buckets: [
            { id: 'm2', label: 'Module 2: Summaries', hint: 'Overviews and summaries of everything' },
            { id: 'm3', label: 'Module 3: Quality', hint: 'How the drug is made and tested' },
            { id: 'm4', label: 'Module 4: Nonclinical', hint: 'Animal and lab studies' },
            { id: 'm5', label: 'Module 5: Clinical', hint: 'Human studies and their reports' },
          ],
          cards: [
            {
              id: 'csr-phase3',
              text: 'The Phase III Clinical Study Report with its appendices',
              bucketId: 'm5',
              confirm: 'Module 5: every clinical study report lives here.',
              conceptId: 'ectd-modules',
              explanation: 'Module 5 holds the clinical study reports and the datasets behind them.',
              consequence: 'A study report filed in the wrong module is a study the reviewer cannot find.',
            },
            {
              id: 'stability',
              text: 'Two-year stability data and the shelf-life proposal',
              bucketId: 'm3',
              confirm: 'Module 3: quality, including stability.',
              conceptId: 'ectd-modules',
              explanation: 'Manufacturing, specifications and stability are quality: Module 3.',
              consequence: 'Quality data outside Module 3 delays the manufacturing review.',
            },
            {
              id: 'tox-report',
              text: 'The 28-day and 6-month rat toxicology reports',
              bucketId: 'm4',
              confirm: 'Module 4: nonclinical.',
              conceptId: 'ectd-modules',
              explanation: 'Animal toxicology, pharmacology and PK reports are Module 4.',
              consequence: 'Nonclinical reports filed under clinical confuse two review teams.',
            },
            {
              id: 'clinical-overview',
              text: 'The 30-page Clinical Overview arguing benefit and risk',
              bucketId: 'm2',
              confirm: 'Module 2: the summaries the reviewer reads first.',
              conceptId: 'ectd-modules',
              explanation: "Module 2 is the overviews and summaries: the reviewer's map to Modules 3 to 5.",
              consequence: 'Without a good Module 2, the reviewer has 100,000 pages and no guide.',
            },
            {
              id: 'susar-listing',
              text: 'The listing of every SUSAR reported during development',
              bucketId: 'm5',
              confirm: 'Module 5: clinical safety belongs with the clinical data.',
              conceptId: 'ectd-modules',
              explanation: 'Safety reports from human studies are clinical: Module 5.',
              consequence:
                'Safety data the reviewer cannot find is safety data the reviewer assumes was hidden.',
            },
          ],
        },
      },
    ],
    shortcutPrompt: {
      id: 'file-incomplete',
      offer:
        'Dose: "The 6-month rat report is late from the lab. We could file without it and add it as an amendment."',
      accept: {
        meters: { timeline: 10, integrity: -15 },
        why: 'The filing date holds. And the first thing the reviewer finds is a gap in Module 4, which becomes a refuse-to-file letter.',
      },
    },
    debrief: {
      learned:
        "The eCTD is the same five-module structure worldwide: Module 1 regional administration, 2 summaries, 3 quality, 4 nonclinical, 5 clinical. A complete dossier in the right structure is the reviewer's map.",
      handoffLine:
        'You hand the assembled dossier to the Submission Publisher, who makes it a single validated electronic package.',
    },
  },

  // ------------------------------------------------------------------ w7-l2 Regulatory Publishing / Submission Specialist
  {
    id: 'w7-l2',
    worldId: 'w7',
    roleId: 'submission-publisher',
    title: 'Validate the package',
    intro:
      "The dossier is 80,000 pages of PDFs and datasets. The regulator's gateway rejects anything that fails [[technical-validation|technical validation]]. One of these components would bounce the whole submission. Find it before the gateway does.",
    meterFocus: 'timeline',
    stages: [
      {
        id: 'validate',
        title: 'Run the pre-check',
        brief: 'Tap a component to see its validation report. Accuse the one that fails.',
        game: {
          engine: 'spot-the-impostor',
          prompt: 'Which component fails validation?',
          seconds: 100,
          targetLabel: 'the failing component',
          cards: [
            {
              id: 'pdf-links',
              title: 'Module 2 PDFs',
              lines: [
                'Bookmarks for every section',
                'All 1,400 hyperlinks resolve',
                'Text searchable, fonts embedded',
              ],
              conceptId: 'technical-validation',
              explanation: 'Navigable, searchable, complete. This is what a reviewer wants.',
              consequence: 'Accusing a clean component wastes the day before the deadline.',
            },
            {
              id: 'datasets',
              title: 'Module 5 datasets',
              lines: [
                'SDTM and ADaM in the required format',
                'Define-XML present and complete',
                'Dataset sizes under the gateway limit',
              ],
              conceptId: 'technical-validation',
              explanation: 'Standard formats, metadata present, within limits. Clean.',
              consequence: 'Datasets that fail format checks are the most common technical rejection.',
            },
            {
              id: 'lifecycle',
              title: 'Lifecycle attributes',
              lines: [
                'Every leaf marked "new"',
                'Study tagging files match the study reports',
                'Sequence number 0000',
              ],
              conceptId: 'ectd',
              explanation:
                'A first submission with everything new and a fresh sequence number is exactly right.',
              consequence: 'Wrong lifecycle attributes break how future amendments attach.',
            },
            {
              id: 'module3-scan',
              title: 'Module 3 batch records',
              lines: ['Scanned images, not text', 'No bookmarks', '600 pages, one file, 900 MB'],
              impostor: true,
              confirm: 'Found it: unsearchable scans over the size limit.',
              conceptId: 'technical-validation',
              explanation:
                'Image-only scans are not searchable, have no bookmarks, and the file breaks the size limit. The gateway rejects it.',
              consequence: 'A single failing file can reject the whole sequence and cost the filing date.',
            },
            {
              id: 'module1',
              title: 'Module 1 forms',
              lines: [
                'Application form signed electronically',
                'Cover letter references every module',
                'Regional documents complete',
              ],
              conceptId: 'ectd-modules',
              explanation: 'Regional administrative documents complete and signed. Clean.',
              consequence: 'A missing form is caught at intake, but this one is complete.',
            },
          ],
          signOff: {
            id: 'submit-unchecked',
            label: 'Submit now; the gateway will tell us if something is wrong',
            shortcut: {
              meters: { timeline: 10, integrity: -10 },
              why: 'A day saved. If the gateway bounces it, the filing date moves and the clock starts over, in public.',
            },
          },
        },
      },
    ],
    debrief: {
      learned:
        'Publishing turns thousands of documents into one navigable, searchable, validated electronic submission. Bookmarks, working links, standard datasets, correct lifecycle attributes and file limits are checked before the gateway checks them.',
      handoffLine:
        "You submit through the gateway. The dossier is now on a reviewer's desk. Time to sit on the other side of it.",
    },
  },

  // ------------------------------------------------------------------ w7-l3 Health Authority Reviewer (role flip)
  {
    id: 'w7-l3',
    worldId: 'w7',
    roleId: 'health-authority-reviewer',
    title: 'The other side of the desk',
    intro:
      "You are the regulator now. VX-101's dossier is in front of you: real benefit, a real liver signal. Your job is not to judge the company. It is to decide what is true and what patients must be told.",
    meterFocus: 'safety',
    mayaCameo: {
      stageId: 'review',
      itemId: 'n-patient',
      presentation: 'dialogue',
      label: 'Participant 0417',
      debriefLine:
        "The patient letter read into the record was Maya's. She was on placebo for a year and wrote to ask you to approve the drug anyway.",
    },
    stages: [
      {
        id: 'review',
        title: 'Review the application',
        brief: 'Three decisions. Every one is public.',
        game: {
          engine: 'branching-scenario',
          start: 'n-filing',
          nodes: [
            {
              id: 'n-filing',
              speaker: 'Review team lead',
              text: 'Day 60 [[filing-review|filing review]]. Efficacy is clear, but the sponsor\'s summary calls the liver findings "not clinically meaningful" while Module 5 shows two serious cases. What goes in the letter?',
              choices: [
                {
                  id: 'c-ask',
                  text: 'Ask for a full analysis of every liver case, with narratives, by day 90',
                  confirm: 'Right: ask for the data, judge later.',
                  quality: 'best',
                  next: 'n-patient',
                  conceptId: 'filing-review',
                  explanation:
                    'A gap between the summary and the data is a question, not a verdict. Ask, precisely, with a deadline.',
                  consequence:
                    'Reviewers who accept a summary at face value miss the signal that becomes a recall.',
                },
                {
                  id: 'c-refuse',
                  text: 'Refuse to file: the summary misrepresents the safety data',
                  quality: 'ok',
                  next: 'n-patient',
                  meters: { timeline: -15 },
                  conceptId: 'filing-review',
                  explanation:
                    'Harsh for a summary-versus-data gap that a question would resolve. Refusal is for missing pieces, not disagreements.',
                  consequence: 'Over-using refusal delays medicines that would pass with one letter.',
                },
                {
                  id: 'c-accept',
                  text: "Accept the sponsor's reading; two cases in 1,200 is small",
                  quality: 'bad',
                  next: 'n-patient',
                  meters: { safety: -15 },
                  conceptId: 'benefit-risk',
                  explanation:
                    'Two serious liver cases in a target organ is the definition of clinically meaningful. Small is not the same as nothing.',
                  consequence: 'Signals waved through at review become the post-market crisis of World 8.',
                },
              ],
            },
            {
              id: 'n-patient',
              text: 'A letter from a trial participant is read into the public record: a year on placebo, no improvement, and a request that the drug be approved for everyone who was not so unlucky. The room is quiet.',
              choices: [
                {
                  id: 'c-weigh',
                  text: 'Note it as patient perspective: it informs benefit, not the safety analysis',
                  confirm: 'Yes: heard, weighed, not decisive alone.',
                  quality: 'best',
                  next: 'n-decision',
                  conceptId: 'advisory-committee',
                  explanation:
                    'Patient testimony tells you what benefit means to people. It is evidence for the benefit side, not a vote.',
                  consequence:
                    'Ignoring patients misjudges benefit; letting one letter decide misjudges risk.',
                },
                {
                  id: 'c-moved',
                  text: 'Approve on the strength of it; patients are waiting',
                  quality: 'bad',
                  next: 'n-decision',
                  meters: { integrity: -15 },
                  conceptId: 'benefit-risk',
                  explanation:
                    'A moving letter is not a liver analysis. The decision rests on the data, or it rests on nothing.',
                  consequence: 'Decisions swayed by testimony alone are overturned in court and in history.',
                },
                {
                  id: 'c-dismiss',
                  text: 'Disregard it; anecdotes are not data',
                  quality: 'ok',
                  next: 'n-decision',
                  meters: { integrity: -5 },
                  conceptId: 'advisory-committee',
                  explanation:
                    'It is not a data point, but it is evidence about what patients value, which is part of benefit.',
                  consequence:
                    'Regulators who dismiss patient input approve drugs for outcomes nobody wanted.',
                },
              ],
            },
            {
              id: 'n-decision',
              speaker: 'Review team lead',
              text: 'The liver analysis arrived: serious cases were dose-related and reversible with monitoring. Benefit is real. What is the decision?',
              choices: [
                {
                  id: 'c-approve-warn',
                  text: 'Approve, with a prominent liver warning and mandatory monitoring in the label',
                  confirm: 'Approve with conditions: benefit and managed risk.',
                  quality: 'best',
                  next: 'end-approve',
                  conceptId: 'benefit-risk',
                  explanation:
                    'Real benefit, a manageable risk with a known mitigation: approval with a label that tells doctors exactly what to watch.',
                  consequence: 'This is what most approvals look like: yes, with conditions written down.',
                },
                {
                  id: 'c-approve-clean',
                  text: 'Approve without the warning; the sponsor says it will hurt uptake',
                  quality: 'bad',
                  next: 'end-approve-clean',
                  meters: { safety: -20 },
                  conceptId: 'boxed-warning',
                  shortcut: {
                    meters: { timeline: 10, safety: -20 },
                    why: 'The launch goes smoothly. And the first doctor who prescribes it to someone with a weak liver never read the warning, because there was none.',
                  },
                  explanation:
                    "Uptake is the sponsor's problem. The label exists so a prescriber knows the risk.",
                  consequence:
                    'A label that hides a known risk is the direct cause of the harm that follows.',
                },
                {
                  id: 'c-crl',
                  text: 'Issue a [[complete-response-letter|complete response letter]]: more liver data needed',
                  quality: 'ok',
                  next: 'end-crl',
                  meters: { timeline: -20 },
                  conceptId: 'complete-response-letter',
                  explanation:
                    'Defensible, but the data you asked for arrived and answered the question. Asking again costs patients a year.',
                  consequence: 'Unneeded complete response letters delay medicines for no gain in safety.',
                },
              ],
            },
            {
              id: 'end-approve',
              text: 'Approved, with a liver warning and monitoring requirements. The label is a negotiation now, word by word.',
              end: { summary: 'Approval is a yes with conditions written down.' },
            },
            {
              id: 'end-approve-clean',
              text: 'Approved with a clean label. Eighteen months later the post-market reports begin.',
              end: { summary: 'The risk did not disappear because the label did not mention it.' },
            },
            {
              id: 'end-crl',
              text: 'A complete response letter goes out. The sponsor resubmits in a year with the same data and a better summary. Approved then.',
              end: { summary: 'A year lost to a question that had already been answered.' },
            },
          ],
        },
      },
    ],
    debrief: {
      learned:
        'A regulator judges benefit against risk from the data, asks precise questions when summaries and data disagree, weighs patient input as evidence of benefit, and approves with conditions that tell prescribers what to watch.',
      handoffLine:
        'You hand a conditional approval to the sponsor. Before the label is final, an inspector will visit.',
    },
  },

  // ------------------------------------------------------------------ w7-l4 Inspection Readiness Lead
  {
    id: 'w7-l4',
    worldId: 'w7',
    roleId: 'inspection-readiness-lead',
    title: 'The inspector is here',
    intro:
      'A pre-approval [[gcp-inspection|GCP inspection]]. The inspector asks for documents by name and expects them in minutes. Retrieve each request through the right steps before the inspector writes "not provided".',
    meterFocus: 'integrity',
    stages: [
      {
        id: 'requests',
        title: 'Serve the requests',
        brief: 'Tap a request, then its stations in order. Requests keep coming.',
        game: {
          engine: 'dash-manager',
          prompt: 'Retrieve every document before the inspector moves on.',
          seconds: 110,
          stations: [
            { id: 'log', label: 'Log the request' },
            { id: 'retrieve', label: 'Retrieve from TMF' },
            { id: 'qc', label: 'QC before handover' },
            { id: 'hand', label: 'Hand over & record' },
            {
              id: 'improvise',
              label: 'Reconstruct it now',
              shortcut: {
                meters: { timeline: 10, integrity: -25 },
                why: "The inspector gets a document. It has today's date on a page that claims to be from three years ago, and inspectors notice dates.",
              },
            },
          ],
          items: [
            {
              id: 'req-consent',
              label: 'Signed consent forms, Site 034, first five patients',
              steps: ['log', 'retrieve', 'qc', 'hand'],
              patienceSeconds: 45,
              arrivesAt: 0,
              conceptId: 'gcp-inspection',
              explanation:
                'Log what was asked, retrieve it, check it is the right version, hand it over and record the handover.',
              consequence:
                'A consent form the sponsor cannot produce is a finding against every patient at that site.',
            },
            {
              id: 'req-delegation',
              label: 'Delegation log for Site 047',
              steps: ['log', 'retrieve', 'qc', 'hand'],
              patienceSeconds: 40,
              arrivesAt: 12,
              conceptId: 'delegation-log',
              explanation:
                'The inspector already suspects Site 047. The log must be the real one, dates and all.',
              consequence: "A missing delegation log confirms the inspector's suspicion.",
            },
            {
              id: 'req-capa',
              label: 'The CAPA for the Site 047 audit',
              steps: ['log', 'retrieve', 'hand'],
              patienceSeconds: 40,
              arrivesAt: 24,
              conceptId: 'capa',
              explanation: 'A finding with a documented corrective plan is a finding handled. Show it.',
              consequence: 'Findings without CAPAs become inspection findings against the sponsor.',
            },
            {
              id: 'req-unblind',
              label: 'The unblinding memo and database lock timestamp',
              steps: ['log', 'retrieve', 'qc', 'hand'],
              patienceSeconds: 35,
              arrivesAt: 38,
              conceptId: 'database-lock',
              explanation:
                'Lock before unblinding, with timestamps: the document that proves the result was not seen early.',
              consequence: 'If the sequence cannot be proven, the primary result is in doubt.',
            },
            {
              id: 'req-followup',
              label: 'Inspector asks a follow-up: who approved the amendment?',
              steps: ['log', 'retrieve', 'hand'],
              patienceSeconds: 30,
              arrivesAt: 52,
              conceptId: 'protocol-amendment',
              explanation:
                'Follow-ups are logged like any request. The approval letters are in the ethics zone of the TMF.',
              consequence: 'Unanswered follow-ups appear in the report as "sponsor could not explain".',
            },
          ],
        },
      },
    ],
    debrief: {
      learned:
        'An inspection is answered from the TMF: every request logged, retrieved, checked and handed over with a record. Documents that cannot be produced did not happen; documents reconstructed on the day are worse.',
      handoffLine:
        'The inspection closes with minor findings. You hand the inspection report to the Labeling Specialist, who has one negotiation left.',
    },
  },

  // ------------------------------------------------------------------ w7-l5 Labeling Specialist
  {
    id: 'w7-l5',
    worldId: 'w7',
    roleId: 'labeling-specialist',
    title: 'Every word of the label',
    intro:
      "The [[prescribing-information|label]] is the medicine's contract with every doctor who prescribes it. The regulator wants a liver warning. Build the final label, section by section, and decide how loud that warning is.",
    meterFocus: 'safety',
    stages: [
      {
        id: 'label',
        title: 'Build the label',
        brief: "Tap a text, then the section it belongs in. The warning slot decides the label's tone.",
        game: {
          engine: 'builder',
          prompt: 'Assemble the prescribing information.',
          seconds: 100,
          slots: [
            { id: 'indication', label: 'Indication', hint: 'Who it is for' },
            { id: 'warning', label: 'Liver warning', hint: 'How prominent?' },
            { id: 'contra', label: 'Contraindication', hint: 'Who must not take it' },
            { id: 'monitoring', label: 'Monitoring', hint: 'What doctors must check' },
          ],
          parts: [
            {
              id: 'ind-narrow',
              text: 'Treatment of Veridian Syndrome in adults',
              slotId: 'indication',
              confirm: 'The indication matches the population studied.',
              conceptId: 'indication',
              explanation:
                'The [[indication]] is exactly the population and disease the trials tested: adults with Veridian Syndrome.',
              consequence: 'A label broader than the evidence invites use in people it was never tested on.',
            },
            {
              id: 'ind-broad',
              text: 'Treatment of fatigue and joint pain of any cause',
              conceptId: 'indication',
              explanation:
                'The trials enrolled Veridian Syndrome, not fatigue in general. The evidence does not stretch.',
              consequence: 'Over-broad indications are refused and, if slipped through, recalled.',
            },
            {
              id: 'warn-boxed',
              text: 'Boxed warning: serious liver injury has occurred; monitor liver tests monthly',
              slotId: 'warning',
              confirm: 'Boxed: the loudest warning a label can carry.',
              conceptId: 'boxed-warning',
              explanation:
                'Two serious, dose-related liver cases in the target organ justify a [[boxed-warning|boxed warning]]: prominent, unmissable.',
              consequence:
                'A boxed warning changes how a drug is used; it exists so the risk is never a surprise.',
            },
            {
              id: 'warn-standard',
              text: 'Warnings section: liver enzyme increases were observed; consider monitoring',
              slotId: 'warning',
              conceptId: 'boxed-warning',
              explanation:
                'A standard warning is defensible for mild findings. "Consider" is weak for serious cases.',
              consequence: 'Under-warning shifts the risk to the patient who is never monitored.',
            },
            {
              id: 'warn-minimal',
              text: 'Adverse reactions table only: "ALT increased, 4%"',
              conceptId: 'boxed-warning',
              shortcut: {
                meters: { timeline: 10, safety: -25 },
                why: 'A cleaner label sells. A number in a table is not a warning, and a doctor skimming at 7 pm will never see it.',
              },
              explanation:
                'A table entry is not a warning. Serious cases require a warning a prescriber cannot miss.',
              consequence: 'Burying a serious risk in a table is how post-market injuries become lawsuits.',
            },
            {
              id: 'contra-liver',
              text: 'Contraindicated in patients with existing severe liver disease',
              slotId: 'contra',
              confirm: 'Right: those most at risk must not take it.',
              conceptId: 'contraindication',
              explanation:
                'A [[contraindication]] names who must never take the drug: here, people whose liver is already failing.',
              consequence: 'Without it, the drug reaches exactly the patients it can hurt most.',
            },
            {
              id: 'monitor-monthly',
              text: 'Liver tests before starting and monthly for six months',
              slotId: 'monitoring',
              confirm: 'Monitoring makes the risk manageable.',
              conceptId: 'prescribing-information',
              explanation:
                'The trial data showed rises were reversible when caught. Monthly tests are how they get caught.',
              consequence: 'A warning without a monitoring plan tells doctors to worry and not what to do.',
            },
          ],
        },
      },
    ],
    emits: [
      {
        key: 'label.warnings',
        outcomes: [
          {
            tag: 'boxed',
            when: { stageId: 'label', chosePart: { slotId: 'warning', partId: 'warn-boxed' } },
          },
          {
            tag: 'standard',
            when: { stageId: 'label', chosePart: { slotId: 'warning', partId: 'warn-standard' } },
          },
          {
            tag: 'minimal',
            when: { stageId: 'label', tookShortcut: 'warn-minimal' },
          },
        ],
      },
    ],
    variants: [
      {
        when: { 'safety.report': 'late' },
        patch: {
          intro:
            "The [[prescribing-information|label]] is the medicine's contract with every doctor. The regulator wants a liver warning, and remembers that the Phase II liver case was reported late. Build the final label and decide how loud that warning is.",
          meterOpening: { integrity: -5 },
        },
      },
    ],
    debrief: {
      learned:
        'The label is negotiated word by word: the indication matches the evidence, warnings are as loud as the risk (boxed for serious, well-established harm), contraindications name who must not take it, and monitoring says what to do.',
      handoffLine:
        'You hand the approved label to the launch team. VX-101 is a medicine. How loud its warning is will matter in World 8.',
    },
  },
];
