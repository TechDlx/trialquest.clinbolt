import type { Role } from '../../types';
import { roleRefById } from '../../roleIndex';

const ref = (id: string) => {
  const r = roleRefById[id];
  if (!r) throw new Error(`Unknown role id in roleIndex: ${id}`);
  return r;
};

export const w6Roles: Role[] = [
  {
    ...ref('global-study-manager'),
    card: {
      whatIDo:
        'I run the biggest study in the programme across dozens of countries. Country teams, vendors and sites escalate to me; I assess, plan, get approval and track until every country is enrolling and every problem has an owner.',
      responsibilities: [
        'Own the global timeline, budget and [[enrolment-rate|enrolment forecast]]',
        'Coordinate country teams and CRO partners',
        'Roll out [[protocol-amendment|protocol amendments]] worldwide',
        'Escalate risks to the sponsor leadership',
        'Report to the DSMB and steering committee',
      ],
      skills: ['Programme management', 'Cross-cultural communication', 'Prioritisation', 'Stamina'],
      background: 'Senior project managers with years of study experience at a sponsor or global CRO.',
      receivesFrom: ['clinical-project-manager', 'recruitment-specialist'],
      handsOffTo: ['central-monitor', 'dsmb-member', 'database-lock-lead'],
      documents: [
        'Global study plan',
        'Enrolment dashboard',
        'Risk and issue log',
        'Steering committee pack',
      ],
      funFact:
        'A large Phase III trial can run in 40 or more countries at once, which means a protocol amendment can need 40 separate ethics approvals before every site is on the same version.',
    },
  },
  {
    ...ref('central-monitor'),
    card: {
      whatIDo:
        "I monitor the trial from a screen. Using [[risk-based-monitoring|risk-based monitoring]], I compare every site's data against the rest, watch [[key-risk-indicator|risk indicators]], and send the travelling monitors where the numbers look wrong, including where they look too right.",
      responsibilities: [
        'Define and track key risk indicators',
        'Review data trends across sites and countries',
        'Trigger targeted site visits and audits',
        'Detect fabrication, outliers and systematic errors',
        'Report risk to the study team',
      ],
      skills: ['Data analysis', 'Pattern recognition', 'Statistics basics', 'Scepticism'],
      background: 'Analysts and former monitors at CROs and sponsors, often with a data-science background.',
      receivesFrom: ['cra-monitor', 'global-study-manager', 'clinical-data-manager'],
      handsOffTo: ['qa-auditor', 'cra-monitor', 'database-lock-lead'],
      documents: [
        'Risk-based monitoring plan',
        'Key risk indicator dashboard',
        'Site risk reports',
        'Trigger log',
      ],
      funFact:
        'Regulators encouraged risk-based monitoring partly because studies showed that checking every data point at every site found very few errors that changed the result.',
    },
  },
  {
    ...ref('qa-auditor'),
    card: {
      whatIDo:
        "I audit. Independently of the study team, I check sites, vendors and the sponsor's own processes against [[gcp|GCP]] and the protocol, grade what I find, and make sure a corrective plan follows. I report to quality, not to the people I audit.",
      responsibilities: [
        'Plan and conduct [[audit|audits]] of sites, vendors and systems',
        'Grade [[audit-finding|findings]] as critical, major or minor',
        'Require and verify [[capa|corrective and preventive actions]]',
        'Report critical findings to leadership and, where required, regulators',
        'Prepare the organisation for inspections',
      ],
      skills: ['GCP and regulations', 'Independence', 'Interviewing', 'Writing findings that stick'],
      background:
        'Experienced monitors, data managers or quality professionals in a sponsor or CRO quality department.',
      receivesFrom: ['central-monitor', 'cra-monitor', 'tmf-specialist'],
      handsOffTo: ['dsmb-member', 'inspection-readiness-lead', 'global-study-manager'],
      documents: ['Audit plan', 'Audit report', 'CAPA plan', 'Audit certificate'],
      funFact:
        "Audits are done by the sponsor to check itself; inspections are done by regulators to check the sponsor. A good audit finds the inspection's findings first.",
    },
  },
  {
    ...ref('dsmb-member'),
    card: {
      whatIDo:
        'I sit on the independent [[dsmb|Data Safety Monitoring Board]]. We are the only people who see unblinded results while the trial runs. At each [[interim-analysis|interim look]] we decide: continue, modify or stop, and we tell the sponsor only the decision.',
      responsibilities: [
        'Review unblinded safety and efficacy data at planned interims',
        'Apply the stopping boundaries in the DSMB charter',
        'Recommend continue, modify or stop',
        "Protect the sponsor's blind",
        'Document decisions in closed-session minutes',
      ],
      skills: ['Clinical expertise', 'Statistics', 'Independence', 'Discretion'],
      background: 'Independent clinicians and statisticians with no stake in the sponsor or the result.',
      receivesFrom: ['global-study-manager', 'pharmacovigilance-associate', 'qa-auditor'],
      handsOffTo: ['database-lock-lead', 'clinical-scientist', 'health-authority-reviewer'],
      documents: [
        'DSMB charter',
        'Closed-session interim report',
        'Recommendation letter',
        'Meeting minutes (open and closed)',
      ],
      funFact:
        'DSMB meetings have an open session with the sponsor and a closed session without; the closed minutes are sealed until the trial ends.',
    },
  },
  {
    ...ref('database-lock-lead'),
    card: {
      whatIDo:
        'Together, the data manager and the statistician take the trial past the point of no return. We settle every query, reconcile every safety case, sign the [[database-lock|lock]], and only then release the codes for [[unblinding]] and run the analysis.',
      responsibilities: [
        'Complete the database lock checklist',
        'Reconcile clinical and safety databases',
        'Freeze and lock the database with access removed',
        'Release randomization codes after lock',
        'Run the primary analysis per the [[sap|SAP]]',
      ],
      skills: ['Data management', 'Statistics', 'Process discipline', 'Nerves'],
      background:
        'Senior data managers and biostatisticians at a sponsor or CRO, working as one team for this step.',
      receivesFrom: ['clinical-data-manager', 'biostatistician', 'irt-specialist', 'dsmb-member'],
      handsOffTo: ['statistical-programmer', 'medical-writer', 'regulatory-affairs-lead'],
      documents: [
        'Database lock checklist',
        'Lock memo with timestamp',
        'Unblinding memo',
        'Primary analysis output',
      ],
      funFact:
        'Unlocking a database after lock is possible, but every unlock must be justified and documented, and reviewers read those justifications closely.',
    },
  },
  {
    ...ref('statistical-programmer'),
    card: {
      whatIDo:
        'I write the code that turns locked raw data into what regulators read. I map data to [[sdtm|SDTM]], derive [[adam|ADaM]] analysis datasets, and program every [[tlf|table, listing and figure]], with a second programmer reproducing each one independently.',
      responsibilities: [
        'Map raw data to SDTM domains',
        'Derive ADaM datasets per the SAP',
        'Program tables, listings and figures',
        'Validate outputs by [[double-programming|double programming]]',
        'Prepare Define-XML metadata for submission',
      ],
      skills: ['SAS or R', 'CDISC standards', 'Attention to detail', 'Reproducibility'],
      background: 'Programmers with statistics or computer-science backgrounds at CROs and sponsors.',
      receivesFrom: ['database-lock-lead', 'medical-coder', 'biostatistician'],
      handsOffTo: ['medical-writer', 'submission-publisher', 'regulatory-affairs-lead'],
      documents: [
        'SDTM and ADaM datasets',
        'Define-XML',
        'Tables, listings and figures',
        'Programming validation log',
      ],
      funFact:
        'A single Phase III submission can contain more than a thousand tables and figures, each produced twice by independent programmers before anyone reads it.',
    },
  },
  {
    ...ref('medical-writer'),
    card: {
      whatIDo:
        'I write the documents regulators read: the [[csr|Clinical Study Report]] above all. I take validated tables and turn them into clear, accurate text in a fixed structure, with every number traceable and every conclusion in proportion to the evidence.',
      responsibilities: [
        'Write the Clinical Study Report to [[ich-e3|ICH E3]]',
        'Draft protocols, consent forms and submission summaries',
        'Keep every statement traceable to a source',
        'Coordinate review by clinical, statistical and regulatory experts',
        'Manage document versions and quality control',
      ],
      skills: [
        'Scientific writing',
        'Regulatory document structure',
        'Attention to detail',
        'Diplomacy across reviewers',
      ],
      background: 'Life-science PhDs and communication specialists at sponsors, CROs and writing agencies.',
      receivesFrom: ['statistical-programmer', 'database-lock-lead', 'clinical-scientist'],
      handsOffTo: ['regulatory-affairs-lead', 'submission-publisher', 'health-authority-reviewer'],
      documents: [
        'Clinical Study Report',
        'Clinical summaries (eCTD Module 2)',
        'Patient narratives',
        'Quality control checklist',
      ],
      funFact:
        'A Clinical Study Report with its appendices can run to thousands of pages; the 12-page synopsis at the front is often the only part a busy reviewer reads first.',
    },
  },
];
