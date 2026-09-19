import type { GlossaryTerm } from '../types';

/** Terms introduced in World 6 — Phase III. */
export const w6Terms: GlossaryTerm[] = [
  {
    id: 'enrolment-rate',
    term: 'Enrolment rate',
    short: 'How many patients a site, country or study enrols per month, tracked against the forecast.',
    aliases: ['Enrollment rate'],
    worldId: 'w6',
  },
  {
    id: 'protocol-amendment',
    term: 'Protocol amendment',
    short:
      'A formal change to the protocol after approval; it must be approved by regulators and ethics committees before sites use it.',
    aliases: ['Amendment'],
    worldId: 'w6',
  },
  {
    id: 'risk-based-monitoring',
    term: 'Risk-based monitoring',
    short:
      'Focusing monitoring effort on the sites and data where errors are most likely and most important, guided by central data review.',
    aliases: ['RBM'],
    worldId: 'w6',
  },
  {
    id: 'key-risk-indicator',
    term: 'Key risk indicator (KRI)',
    short:
      'A metric such as query rate, enrolment speed or adverse event rate, compared across sites to spot trouble.',
    aliases: ['KRI'],
    worldId: 'w6',
  },
  {
    id: 'audit',
    term: 'Audit',
    short:
      "An independent check by the sponsor's quality function that a site, vendor or process follows GCP and the protocol.",
    worldId: 'w6',
  },
  {
    id: 'audit-finding',
    term: 'Audit finding',
    short:
      'A problem found in an audit, graded critical (harm or unreliable data), major (could affect safety or data) or minor.',
    aliases: ['Critical finding', 'Major finding', 'Minor finding'],
    worldId: 'w6',
  },
  {
    id: 'capa',
    term: 'CAPA',
    short: 'Corrective and preventive action: the plan that fixes a finding and stops it happening again.',
    worldId: 'w6',
  },
  {
    id: 'delegation-log',
    term: 'Delegation log',
    short:
      "The investigator's signed list of who at the site is allowed to do which study tasks, and from when.",
    worldId: 'w6',
  },
  {
    id: 'dsmb',
    term: 'Data Safety Monitoring Board (DSMB)',
    short:
      'An independent committee that reviews unblinded data during a trial and recommends whether it continues, changes or stops.',
    aliases: ['DSMB', 'DMC', 'Data Monitoring Committee'],
    worldId: 'w6',
  },
  {
    id: 'interim-analysis',
    term: 'Interim analysis',
    short:
      'A planned look at the data before the trial ends, done by an independent group against boundaries set in advance.',
    worldId: 'w6',
  },
  {
    id: 'futility',
    term: 'Futility',
    short:
      'When an interim look shows the trial is unlikely to succeed even if it continues; a pre-set boundary decides.',
    worldId: 'w6',
  },
  {
    id: 'database-lock',
    term: 'Database lock',
    short:
      'The signed, timestamped moment after which no trial data can be changed; unblinding happens only after it.',
    worldId: 'w6',
  },
  {
    id: 'unblinding',
    term: 'Unblinding',
    short:
      'Revealing which patients received drug and which placebo; done for the whole trial only after database lock.',
    worldId: 'w6',
  },
  {
    id: 'sdtm',
    term: 'SDTM',
    short:
      'Study Data Tabulation Model: the CDISC standard structure for collected trial data, organised by domain.',
    worldId: 'w6',
  },
  {
    id: 'adam',
    term: 'ADaM',
    short:
      'Analysis Data Model: CDISC datasets derived from SDTM and ready for the statistical analysis, traceable back to source.',
    worldId: 'w6',
  },
  {
    id: 'tlf',
    term: 'Tables, listings and figures (TLFs)',
    short: 'The programmed outputs from which every number in a study report is taken.',
    aliases: ['TLF', 'TFL'],
    worldId: 'w6',
  },
  {
    id: 'double-programming',
    term: 'Double programming',
    short:
      'Having a second programmer independently reproduce each dataset and table so errors are caught before the report.',
    worldId: 'w6',
  },
  {
    id: 'csr',
    term: 'Clinical Study Report (CSR)',
    short:
      "The full report of a trial's design, conduct and results, written to a fixed international structure for regulators.",
    aliases: ['CSR'],
    worldId: 'w6',
  },
  {
    id: 'ich-e3',
    term: 'ICH E3',
    short: 'The international guideline that sets the structure and content of a Clinical Study Report.',
    worldId: 'w6',
  },
  {
    id: 'post-hoc-analysis',
    term: 'Post-hoc analysis',
    short:
      'An analysis decided after seeing the data; exploratory only, and never a substitute for the pre-specified result.',
    aliases: ['Post hoc'],
    worldId: 'w6',
  },
  {
    id: 'benefit-risk',
    term: 'Benefit-risk',
    short:
      'The judgement that weighs how much a medicine helps against the harm it can do, for a defined group of patients.',
    worldId: 'w6',
  },
];
