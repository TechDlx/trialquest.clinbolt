import type { Role } from '../../types';
import { roleRefById } from '../../roleIndex';

const ref = (id: string) => {
  const r = roleRefById[id];
  if (!r) throw new Error(`Unknown role id in roleIndex: ${id}`);
  return r;
};

export const w3Roles: Role[] = [
  {
    ...ref('clinical-project-manager'),
    card: {
      whatIDo:
        'I run the trial as a project. I own the timeline, the budget, the vendors and the risk plan, and I make sure every start-up step happens in the right order so the first patient can be dosed on schedule.',
      responsibilities: [
        'Build and track the study timeline and budget',
        'Select and manage vendors (CRO, labs, systems)',
        'Write and maintain the [[risk-management-plan|risk management plan]]',
        'Chair study team meetings and escalate issues',
        'Report progress to the sponsor and portfolio lead',
      ],
      skills: ['Project management', 'Budgeting', 'Vendor oversight', 'Calm under slippage'],
      background:
        'Often former coordinators, CRAs or scientists; many hold a project management certification.',
      receivesFrom: ['portfolio-lead', 'regulatory-affairs-specialist'],
      handsOffTo: ['site-startup-specialist', 'clinical-supply-manager', 'global-study-manager'],
      documents: ['Project plan and timeline', 'Study budget', 'Risk management plan', 'Vendor contracts'],
      funFact:
        'Industry surveys keep finding that most trials miss their planned first-patient date, usually because of contracts and ethics approvals, not science.',
    },
  },
  {
    ...ref('site-startup-specialist'),
    card: {
      whatIDo:
        'I find the hospitals and clinics where the trial will run. I survey sites, visit the promising ones, negotiate contracts and budgets, and collect every document a site needs before it may enrol its first patient.',
      responsibilities: [
        'Run [[site-feasibility|feasibility]] surveys and qualification visits',
        'Negotiate [[site-contract|clinical trial agreements]] and site budgets',
        'Collect regulatory and ethics documents for each site',
        'Track country-specific start-up requirements',
        'Hand ready sites to the monitoring team',
      ],
      skills: ['Negotiation', 'Attention to documents', 'Knowledge of country rules', 'Persistence'],
      background: 'Usually at a CRO or sponsor; many started as study coordinators at a site.',
      receivesFrom: ['clinical-project-manager', 'irb-member'],
      handsOffTo: ['clinical-supply-manager', 'principal-investigator', 'cra-monitor'],
      documents: [
        'Feasibility questionnaire',
        'Clinical trial agreement',
        'Site regulatory package',
        'Site activation checklist',
      ],
      funFact:
        'A large global trial can involve more than a thousand sites in dozens of countries, each with its own contract, ethics approval and start date.',
    },
  },
  {
    ...ref('clinical-supply-manager'),
    card: {
      whatIDo:
        'I make sure every site has the right drug at the right time and nobody can tell drug from placebo. I forecast demand, arrange blinded labels, manage [[cold-chain|cold-chain]] shipping and keep the records that account for every single unit.',
      responsibilities: [
        'Forecast drug demand across sites and countries',
        'Arrange labelling, blinding and packaging',
        'Ship under [[cold-chain|cold-chain]] conditions and handle [[temperature-excursion|excursions]]',
        'Maintain drug accountability records',
        'Coordinate [[qp-release|QP release]] for the EU',
      ],
      skills: ['Logistics', 'GMP and GDP knowledge', 'Forecasting', 'Attention to detail'],
      background: 'Pharmacists, supply-chain specialists and engineers at a sponsor or a specialist depot.',
      receivesFrom: ['cmc-scientist', 'clinical-project-manager', 'site-startup-specialist'],
      handsOffTo: ['edc-programmer', 'irt-specialist', 'study-coordinator'],
      documents: [
        'Supply forecast',
        'Label text and approvals',
        'Shipping and temperature records',
        'Drug accountability log',
      ],
      funFact:
        'A temperature logger travels inside most shipments; if it shows the box got too warm, the drug cannot be used until a stability expert says it is still good.',
    },
  },
  {
    ...ref('edc-programmer'),
    card: {
      whatIDo:
        'I build the database the trial runs on. From the protocol I design the [[ecrf|electronic case report forms]], program the [[edit-check|edit checks]] that catch bad data at entry, and test everything before a site types a single value.',
      responsibilities: [
        'Design eCRFs from the protocol',
        'Program edit checks and derivations',
        'Map data to [[cdisc|CDISC]] standards',
        'Test the database with data management',
        'Release changes under version control',
      ],
      skills: ['Database design', 'Clinical data standards', 'Logical thinking', 'Testing discipline'],
      background: 'Computer science or life science graduates at a CRO, sponsor or software vendor.',
      receivesFrom: ['clinical-scientist', 'clinical-supply-manager'],
      handsOffTo: ['irt-specialist', 'systems-validation-engineer', 'clinical-data-manager'],
      documents: [
        'eCRF specification',
        'Edit check specification',
        'Database test scripts',
        'Data management plan (input)',
      ],
      funFact:
        'Well-designed edit checks resolve most data problems while the coordinator is still at the keyboard, before a monitor or data manager ever sees them.',
    },
  },
  {
    ...ref('irt-specialist'),
    card: {
      whatIDo:
        'I configure the system that randomizes patients and assigns their drug kits. The [[irt|IRT]] keeps the blind, keeps sites supplied and logs every assignment, so nobody has to know who got what until the study is over.',
      responsibilities: [
        'Configure [[randomization]] lists and [[stratification]]',
        'Set kit assignment and resupply rules',
        'Control [[emergency-unblinding|emergency unblinding]]',
        'Test the system with the statistician and supply manager',
        'Support sites when the system asks a question they cannot answer',
      ],
      skills: ['Systems configuration', 'Randomization logic', 'Supply planning', 'Precision'],
      background: 'Usually at a specialist IRT vendor; backgrounds in software, statistics or supply chain.',
      receivesFrom: ['biostatistician', 'clinical-supply-manager', 'edc-programmer'],
      handsOffTo: ['systems-validation-engineer', 'study-coordinator', 'database-lock-lead'],
      documents: ['IRT specification', 'Randomization schedule', 'Kit list', 'Unblinding log'],
      funFact:
        'IRT stands for Interactive Response Technology; older systems answered a phone call with a recorded voice, which is why some people still call it IVRS.',
    },
  },
  {
    ...ref('systems-validation-engineer'),
    card: {
      whatIDo:
        'I prove that the computer systems a trial relies on do what they claim. I plan and run [[csv|validation]], set up user access, and check the [[audit-trail|audit trail]], so that regulators can trust electronic records as much as paper.',
      responsibilities: [
        'Write validation plans and test scripts',
        'Execute and document testing',
        'Set up role-based [[access-control|access control]]',
        'Verify audit trails and electronic signatures ([[part-11|Part 11]] / Annex 11)',
        'Manage change control after go-live',
      ],
      skills: ['Software testing', 'Regulations for electronic records', 'Documentation', 'Scepticism'],
      background: 'IT and quality professionals at sponsors, CROs and software vendors.',
      receivesFrom: ['edc-programmer', 'irt-specialist'],
      handsOffTo: ['tmf-specialist', 'clinical-data-manager', 'inspection-readiness-lead'],
      documents: [
        'Validation plan and summary report',
        'Test scripts and evidence',
        'User access matrix',
        'Change control records',
      ],
      funFact:
        'The FDA rule on electronic records, 21 CFR Part 11, dates from 1997 and still shapes how every clinical database in the world is built.',
    },
  },
  {
    ...ref('tmf-specialist'),
    card: {
      whatIDo:
        'I keep the [[tmf|Trial Master File]]: the organised collection of every [[essential-documents|essential document]] that lets an inspector reconstruct how the trial was run. If it is not in the TMF, as far as an inspector is concerned, it did not happen.',
      responsibilities: [
        'File documents in the right TMF zone, on time',
        'Run quality checks for missing or expired documents',
        'Support inspections and audits with fast retrieval',
        'Track site-level files against the central file',
        'Archive the TMF at the end of the trial',
      ],
      skills: ['Organisation', 'Knowledge of GCP documents', 'Attention to dates', 'Calm during inspections'],
      background:
        'Document specialists at CROs and sponsors; many come from library, records or administrative roles.',
      receivesFrom: ['systems-validation-engineer', 'clinical-project-manager'],
      handsOffTo: ['principal-investigator', 'inspection-readiness-lead', 'qa-auditor'],
      documents: [
        'TMF index (reference model)',
        'Document completeness report',
        'Archiving certificate',
        'Inspection retrieval log',
      ],
      funFact:
        'The industry TMF Reference Model organises trial documents into zones and artefacts, so an inspector in any country knows where to look for the same document.',
    },
  },
];
