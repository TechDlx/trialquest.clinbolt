import type { Role } from '../../types';
import { roleRefById } from '../../roleIndex';

const ref = (id: string) => {
  const r = roleRefById[id];
  if (!r) throw new Error(`Unknown role id in roleIndex: ${id}`);
  return r;
};

export const w1Roles: Role[] = [
  {
    ...ref('patient-advocate'),
    card: {
      whatIDo:
        'I live with Veridian Syndrome, and I speak up for people like me. I tell researchers, doctors and companies what living with the disease is really like, what would count as a real improvement, and what a [[clinical-trial|trial]] would need to offer for people to join it.',
      responsibilities: [
        'Describe symptoms, daily impact, and what a meaningful improvement would feel like',
        'Push for research into diseases with an [[unmet-need|unmet need]]',
        'Review trial plans and [[informed-consent|consent forms]] for clarity and burden on participants',
        'Connect patients with trials, registries and support groups',
        'Report side effects and experiences honestly',
      ],
      skills: [
        'Lived experience',
        'Clear communication',
        'Basic research literacy',
        'Empathy and persistence',
      ],
      background: 'Patients, caregivers and staff at patient organizations; no medical degree required.',
      receivesFrom: [],
      handsOffTo: ['discovery-scientist', 'clinical-scientist'],
      documents: [
        'Patient registry',
        'Natural history data',
        'Patient-reported outcome (PRO) questionnaires',
        'Informed consent form (as reviewer)',
      ],
      funFact:
        'Regulators such as the [[fda|FDA]] and [[ema|EMA]] now formally ask patients which outcomes matter most to them, and that input can shape what a trial measures.',
    },
  },
  {
    ...ref('discovery-scientist'),
    card: {
      whatIDo:
        'I hunt for the biology behind a disease and for molecules that can change it. I choose a [[target]], screen thousands of compounds against it, and turn the best [[hit]] into a [[lead-compound|lead]] that could become a medicine.',
      responsibilities: [
        'Identify and validate a biological target',
        'Run [[hts|high-throughput screens]]',
        'Improve hits into lead compounds (stronger, more selective)',
        'Test leads in cell and tissue models',
        'Record results so others can reproduce them',
      ],
      skills: [
        'Biology, chemistry or pharmacology',
        'Lab techniques',
        'Data analysis',
        'Curiosity and patience',
      ],
      background:
        'Usually a PhD or MSc in a life science, working at a pharma company, biotech or university lab.',
      receivesFrom: ['patient-advocate'],
      handsOffTo: ['preclinical-toxicologist', 'cmc-scientist'],
      documents: [
        'Electronic lab notebook (ELN)',
        'Target validation report',
        'Screening data sets',
        'Candidate nomination package',
      ],
      funFact:
        'For every 5,000 to 10,000 compounds screened, only around 250 reach animal testing, and roughly one becomes an approved medicine.',
    },
  },
  {
    ...ref('preclinical-toxicologist'),
    card: {
      whatIDo:
        'Before a molecule ever touches a human, I find out what it does to a living body. I run lab and animal studies under strict [[glp|GLP]] rules to learn which doses are safe and which organs to watch, and I calculate the first dose that can be given to people.',
      responsibilities: [
        'Design and run GLP [[toxicology]] studies',
        'Find the [[noael|NOAEL]] and identify organs at risk',
        'Study [[pharmacokinetics|PK]]: how the body absorbs, spreads, breaks down and removes the drug',
        'Calculate the [[starting-dose|first human dose]] with a safety margin',
        'Apply the [[three-rs|3Rs]]: replace, reduce and refine animal use',
      ],
      skills: [
        'Toxicology and pharmacology',
        'Veterinary or lab science',
        'Statistics',
        'Attention to detail',
      ],
      background: 'PhD, DVM or MSc scientists at a sponsor or a specialist [[cro|CRO]] lab.',
      receivesFrom: ['discovery-scientist'],
      handsOffTo: ['clinical-scientist', 'regulatory-affairs-specialist', 'clinical-pharmacologist'],
      documents: [
        'GLP study reports',
        "[[investigators-brochure|Investigator's Brochure]] safety sections",
        '[[ind|IND]] / [[cta|CTA]] nonclinical sections',
        '[[safety-pharmacology|Safety pharmacology]] package',
      ],
      funFact:
        'The human starting dose is usually the animal NOAEL, converted to a human dose by body surface area, then divided by a safety factor of at least 10.',
    },
  },
  {
    ...ref('cmc-scientist'),
    card: {
      whatIDo:
        'I turn a promising molecule into a real product that can be made the same way every time. I choose the dosage form, the inactive ingredients and the packaging, and I define the tests that prove each batch is what it says it is.',
      responsibilities: [
        'Develop a stable, manufacturable [[formulation]] (tablet, capsule or injection)',
        'Set specifications and analytical test methods',
        'Run [[stability|stability studies]] to set [[shelf-life|shelf life]] and storage conditions',
        'Make clinical trial batches under [[gmp|GMP]]',
        'Write the [[cmc|CMC]] sections of the IND / CTA and, later, the marketing application',
      ],
      skills: [
        'Pharmaceutical sciences or chemistry',
        'Chemical engineering',
        'GMP knowledge',
        'Analytical methods',
      ],
      background: 'Chemists, pharmacists and engineers at a sponsor or contract manufacturer.',
      receivesFrom: ['discovery-scientist', 'preclinical-toxicologist'],
      handsOffTo: ['clinical-supply-manager', 'regulatory-affairs-specialist', 'manufacturing-supply-lead'],
      documents: [
        '[[batch-record|Batch records]]',
        'Certificate of Analysis (CoA)',
        'Stability reports',
        '[[ectd|eCTD]] Module 3 (Quality)',
      ],
      funFact:
        'A tablet is often 90 percent inactive ingredients. Choosing them is a science: they control how fast the drug dissolves and whether it survives a year on a shelf.',
    },
  },
];
