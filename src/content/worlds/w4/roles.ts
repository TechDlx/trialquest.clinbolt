import type { Role } from '../../types';
import { roleRefById } from '../../roleIndex';

const ref = (id: string) => {
  const r = roleRefById[id];
  if (!r) throw new Error(`Unknown role id in roleIndex: ${id}`);
  return r;
};

export const w4Roles: Role[] = [
  {
    ...ref('principal-investigator'),
    card: {
      whatIDo:
        "I am the doctor responsible for the trial at my site. I decide who is eligible, I am accountable for every participant's safety, and I sign for the data my site produces. The protocol is the sponsor's; the patients are mine.",
      responsibilities: [
        'Screen and enrol participants against the [[eligibility-criteria|criteria]]',
        'Oversee consent, dosing and medical care',
        'Assess and report [[adverse-event|adverse events]]',
        'Supervise site staff and delegate tasks in writing',
        'Keep [[source-document|source documents]] complete and accurate',
      ],
      skills: ['Medicine', 'GCP', 'Judgement', 'Leadership of a site team'],
      background:
        'A licensed physician, often a specialist in the disease, at a hospital, clinic or dedicated research unit.',
      receivesFrom: ['clinical-scientist', 'site-startup-specialist', 'tmf-specialist', 'irb-member'],
      handsOffTo: ['study-coordinator', 'cra-monitor', 'irb-member'],
      documents: [
        "Signed protocol and [[investigators-brochure|Investigator's Brochure]]",
        'Delegation log',
        'Source documents',
        'Financial disclosure and CV',
      ],
      funFact:
        'In the US the investigator signs Form FDA 1572, a personal commitment to run the study by the rules; violations are attributed to the investigator by name.',
    },
  },
  {
    ...ref('study-coordinator'),
    card: {
      whatIDo:
        'I make the trial happen at the site, visit by visit. I walk participants through consent, run their visits, collect samples on the clock, record every event and enter the data. If the site runs, it is usually because of me.',
      responsibilities: [
        'Lead the [[consent-process|consent conversation]] and keep it documented',
        'Schedule and run study visits to the protocol',
        'Collect timed samples and vital signs',
        'Record adverse events and enter data in the eCRF',
        "Answer the monitor's queries",
      ],
      skills: [
        'Nursing or clinical background',
        'Organisation',
        'Attention to time windows',
        'Kindness under pressure',
      ],
      background: 'Nurses, allied-health professionals and science graduates employed by the site.',
      receivesFrom: ['principal-investigator', 'clinical-supply-manager', 'irt-specialist'],
      handsOffTo: ['clinical-pharmacologist', 'cra-monitor', 'clinical-data-manager'],
      documents: [
        'Consent forms',
        'Visit schedules and source notes',
        'Sample collection logs',
        'Adverse event forms',
      ],
      funFact:
        'A Phase I dosing day can involve a dozen timed blood draws per volunteer; coordinators run the day on a minute-by-minute schedule taped to the wall.',
    },
  },
  {
    ...ref('clinical-pharmacologist'),
    card: {
      whatIDo:
        'I study what the body does to the drug. From timed blood samples I read [[exposure]], [[half-life]] and how these change with dose, and I use that to recommend the next [[dose-escalation|escalation]] step and, later, the dose for patients.',
      responsibilities: [
        'Design [[pk-sampling|PK sampling]] schedules',
        'Analyse concentration-time curves',
        'Model exposure and predict the next dose',
        'Recommend escalation steps to the safety committee',
        'Support dose selection for Phase II',
      ],
      skills: [
        'Pharmacokinetics and modelling',
        'Physiology',
        'Data analysis',
        'Explaining curves to committees',
      ],
      background: 'PharmD, PhD or MD scientists at a sponsor or a specialist CRO.',
      receivesFrom: ['preclinical-toxicologist', 'study-coordinator'],
      handsOffTo: ['safety-review-committee', 'clinical-scientist', 'biostatistician'],
      documents: [
        'PK sampling schedule',
        'PK analysis report',
        'Dose escalation recommendation',
        'Population PK model',
      ],
      funFact:
        'Two people given the same dose can have exposures that differ several-fold, which is why pharmacologists talk about exposure, not dose, when judging safety.',
    },
  },
  {
    ...ref('safety-review-committee'),
    card: {
      whatIDo:
        'I sit on the committee that decides whether the next dose is given. After each cohort we review safety, PK and the [[stopping-rule|stopping rules]], and we say escalate, repeat, pause or stop. If something goes wrong, the [[clinical-hold|hold]] lands on our table.',
      responsibilities: [
        "Review each cohort's safety and PK data before escalation",
        'Apply the stopping rules written in the protocol',
        'Decide: escalate, repeat, pause or stop',
        'Manage clinical holds and regulator questions',
        'Document every decision and its reasons',
      ],
      skills: [
        'Clinical safety judgement',
        'PK literacy',
        'Decision-making under uncertainty',
        'Writing down why',
      ],
      background:
        'Sponsor physicians, the investigator, a pharmacologist and often an independent safety expert.',
      receivesFrom: ['clinical-pharmacologist', 'principal-investigator'],
      handsOffTo: ['clinical-scientist', 'recruitment-specialist', 'pharmacovigilance-associate'],
      documents: [
        'Cohort safety summary',
        'Escalation decision memo',
        'Clinical hold response',
        'Protocol amendment (input)',
      ],
      funFact:
        'Since a 2006 first-in-human disaster in London, many Phase I studies dose one "sentinel" volunteer first and wait before dosing the rest of the cohort.',
    },
  },
];
