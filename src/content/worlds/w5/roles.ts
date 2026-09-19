import type { Role } from '../../types';
import { roleRefById } from '../../roleIndex';

const ref = (id: string) => {
  const r = roleRefById[id];
  if (!r) throw new Error(`Unknown role id in roleIndex: ${id}`);
  return r;
};

export const w5Roles: Role[] = [
  {
    ...ref('recruitment-specialist'),
    card: {
      whatIDo:
        'I find the patients. I plan and run the [[patient-recruitment|recruitment]] campaign, work with patient groups and referring doctors, and make sure every poster, ad and web page is honest, approved by the ethics committee, and reaches the people the study is for.',
      responsibilities: [
        'Plan recruitment channels and budget',
        'Write [[recruitment-materials|recruitment materials]] and get them approved',
        'Work with patient organisations and referring clinics',
        'Track screening and enrolment against forecast',
        'Reach under-represented groups so results apply to everyone',
      ],
      skills: ['Communication', 'Marketing ethics', 'Community relationships', 'Reading enrolment data'],
      background:
        'Communications, marketing or patient-engagement professionals at sponsors, CROs or specialist vendors.',
      receivesFrom: ['safety-review-committee', 'patient-advocate', 'clinical-project-manager'],
      handsOffTo: ['principal-investigator', 'cra-monitor', 'study-coordinator'],
      documents: [
        'Recruitment plan',
        'Approved advertisements',
        'Enrolment forecast and tracker',
        'Diversity plan',
      ],
      funFact:
        'Around one in five trials never reaches its enrolment target, and most of the rest finish late; recruitment, not science, is the usual reason.',
    },
  },
  {
    ...ref('cra-monitor'),
    card: {
      whatIDo:
        "I am the sponsor's eyes at the site. I visit, compare the database with the clinic notes ([[sdv|source data verification]]), check consent and drug accountability, and find [[protocol-deviation|deviations]] before an inspector does. Sites see me every few weeks.",
      responsibilities: [
        'Run [[monitoring-visit|monitoring visits]] to the monitoring plan',
        'Verify source data and consent',
        'Check drug accountability and the site file',
        'Identify, document and follow up deviations',
        'Train and support site staff',
      ],
      skills: ['GCP', 'Attention to detail', 'Travel stamina', 'Tactful firmness'],
      background: 'Life-science graduates and former nurses or coordinators, employed by a CRO or sponsor.',
      receivesFrom: [
        'principal-investigator',
        'site-startup-specialist',
        'recruitment-specialist',
        'study-coordinator',
      ],
      handsOffTo: ['clinical-data-manager', 'central-monitor', 'qa-auditor'],
      documents: ['Monitoring plan', 'Monitoring visit reports', 'Deviation log', 'Follow-up letters'],
      funFact:
        'Monitors once checked every single data point at every site; risk-based monitoring now focuses visits on the data and sites where errors matter most.',
    },
  },
  {
    ...ref('clinical-data-manager'),
    card: {
      whatIDo:
        'I turn what sites enter into data that can be analysed. I raise [[data-query|queries]] on anything impossible, missing or contradictory, chase the answers, and keep the database clean enough that, when it locks, the statistician can trust every value.',
      responsibilities: [
        'Write the data management plan',
        'Review data and raise queries',
        'Track query answers and close them',
        'Reconcile the safety database with the clinical database',
        'Prepare the database for lock',
      ],
      skills: ['Attention to detail', 'Data standards', 'Persistence with sites', 'Systems know-how'],
      background:
        'Science and IT graduates at CROs and sponsors; many started in data entry or as coordinators.',
      receivesFrom: ['edc-programmer', 'systems-validation-engineer', 'cra-monitor', 'study-coordinator'],
      handsOffTo: ['medical-coder', 'database-lock-lead', 'central-monitor'],
      documents: [
        'Data management plan',
        'Query log',
        'Data review listings',
        'Database lock checklist (input)',
      ],
      funFact:
        'A large Phase III trial can generate tens of thousands of queries; a single unresolved one can hold up database lock.',
    },
  },
  {
    ...ref('medical-coder'),
    card: {
      whatIDo:
        'I translate what patients and doctors wrote into standard dictionary terms: [[meddra|MedDRA]] for adverse events and diagnoses, [[whodrug|WHODrug]] for medicines. Coding lets the same event be counted the same way at every site, in every study, in every country.',
      responsibilities: [
        'Code adverse events, medical history and medicines',
        'Query sites when a verbatim term is unclear',
        'Keep coding consistent across studies',
        'Handle dictionary version upgrades',
        'Support safety reviews with coded listings',
      ],
      skills: ['Medical terminology', 'Consistency', 'Dictionary structure', 'Judgement on ambiguous text'],
      background: 'Nurses, pharmacists and life-science graduates at CROs and sponsors.',
      receivesFrom: ['clinical-data-manager', 'study-coordinator'],
      handsOffTo: ['pharmacovigilance-associate', 'statistical-programmer', 'signal-detection-scientist'],
      documents: ['Coding conventions', 'Coded term listings', 'Coding queries', 'Dictionary version log'],
      funFact:
        'MedDRA holds more than 80,000 lowest-level terms and is updated twice a year; a term chosen in Phase II may need re-coding by the time the drug is approved.',
    },
  },
  {
    ...ref('pharmacovigilance-associate'),
    card: {
      whatIDo:
        'I watch for harm. I take in every serious event report, judge seriousness, expectedness and [[causality]], and make sure the ones that must be [[expedited-reporting|expedited]] reach regulators inside their legal deadlines. The clock never stops for weekends.',
      responsibilities: [
        'Process [[sae|SAE]] reports from sites',
        'Assess seriousness, expectedness and causality',
        'Submit [[susar|SUSARs]] to regulators within 7 or 15 days',
        'Maintain the safety database',
        'Contribute to periodic safety reports',
      ],
      skills: ['Medical knowledge', 'Regulatory deadlines', 'Precision', 'Working under a clock'],
      background: 'Nurses, pharmacists and doctors at sponsors and specialist safety vendors.',
      receivesFrom: ['medical-coder', 'study-coordinator', 'safety-review-committee'],
      handsOffTo: ['dsmb-member', 'labeling-specialist', 'signal-detection-scientist'],
      documents: [
        'SAE report forms',
        'SUSAR submissions',
        'Safety database',
        'Development safety update report (DSUR)',
      ],
      funFact:
        'A fatal or life-threatening SUSAR must reach regulators within 7 calendar days of the sponsor learning of it; everything else serious and unexpected has 15.',
    },
  },
];
