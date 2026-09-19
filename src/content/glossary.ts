import type { GlossaryTerm } from './types';
import { w2Terms } from './glossary/w2';
import { w3Terms } from './glossary/w3';
import { w4Terms } from './glossary/w4';

/**
 * Glossary. Link to a term in any copy with [[id]] or [[id|Shown text]].
 * Keep `short` to one sentence at a 9th-grade reading level.
 */
export const glossary: GlossaryTerm[] = [
  // Basics
  {
    id: 'clinical-trial',
    term: 'Clinical trial',
    short: 'A research study in people that tests whether a medical treatment is safe and works.',
    worldId: 'w1',
  },
  {
    id: 'unmet-need',
    term: 'Unmet medical need',
    short: 'A health problem with no good treatment available, which is why new medicines get developed.',
    worldId: 'w1',
  },
  {
    id: 'rare-disease',
    term: 'Rare disease',
    short:
      'A disease affecting a small number of people (in the US, fewer than 200,000; in the EU, fewer than 1 in 2,000).',
    worldId: 'w1',
  },
  {
    id: 'patient-advocate',
    term: 'Patient advocate',
    short: "Someone who speaks up for patients' needs to doctors, researchers, companies and regulators.",
    worldId: 'w1',
  },
  {
    id: 'patient-reported-outcome',
    term: 'Patient-reported outcome (PRO)',
    short:
      'A report of how a patient feels or functions, given directly by the patient without a doctor interpreting it.',
    aliases: ['PRO'],
    worldId: 'w1',
  },
  {
    id: 'natural-history',
    term: 'Natural history study',
    short: 'A study of how a disease progresses over time without treatment, used to plan trials.',
    worldId: 'w1',
  },
  {
    id: 'attrition',
    term: 'Attrition',
    short:
      'The high failure rate of drug candidates: roughly 9 in 10 that enter human trials never get approved.',
    worldId: 'w1',
  },
  {
    id: 'development-timeline',
    term: 'Development timeline',
    short:
      'Taking a new medicine from discovery to approval typically takes 10 to 15 years and costs over a billion dollars.',
    worldId: 'w1',
  },
  {
    id: 'sponsor',
    term: 'Sponsor',
    short: 'The company or organization that takes responsibility for a trial.',
    worldId: 'w1',
  },
  {
    id: 'cro',
    term: 'CRO',
    short: 'Contract Research Organization: a company hired by a sponsor to run parts of a trial.',
    aliases: ['Contract Research Organization'],
    worldId: 'w1',
  },
  {
    id: 'placebo',
    term: 'Placebo',
    short: 'A dummy treatment that looks like the real one, used so results can be compared fairly.',
    worldId: 'w1',
  },
  {
    id: 'protocol',
    term: 'Protocol',
    short: 'The written plan for a trial: what will be done, to whom, how, and why.',
    worldId: 'w2',
  },
  {
    id: 'gcp',
    term: 'GCP',
    short:
      'Good Clinical Practice: the international ethical and quality standard for trials in people (ICH E6).',
    aliases: ['Good Clinical Practice', 'ICH E6'],
    worldId: 'w2',
  },
  {
    id: 'fda',
    term: 'FDA',
    short: 'US Food and Drug Administration: the US regulator that approves medicines.',
    worldId: 'w1',
  },
  {
    id: 'ema',
    term: 'EMA',
    short: 'European Medicines Agency: the EU body that evaluates medicines for approval.',
    worldId: 'w1',
  },
  {
    id: 'informed-consent',
    term: 'Informed consent',
    short: 'The process where a person learns what a study involves and freely agrees to take part.',
    worldId: 'w2',
  },
  {
    id: 'irb',
    term: 'IRB / Ethics Committee',
    short: 'An independent group that reviews a study to protect the people taking part.',
    aliases: ['IRB', 'Ethics Committee', 'IEC'],
    worldId: 'w2',
  },

  // Discovery
  {
    id: 'target',
    term: 'Target',
    short: 'The molecule in the body, often a protein, that a drug is designed to act on.',
    worldId: 'w1',
  },
  {
    id: 'hts',
    term: 'High-throughput screening',
    short: 'Robots test thousands of compounds quickly to see which ones act on the target.',
    aliases: ['HTS'],
    worldId: 'w1',
  },
  {
    id: 'hit',
    term: 'Hit',
    short: 'A compound that shows activity against the target in an early screening test.',
    worldId: 'w1',
  },
  {
    id: 'lead-compound',
    term: 'Lead compound',
    short: 'The most promising hit, improved and chosen for development toward a medicine.',
    worldId: 'w1',
  },
  {
    id: 'mechanism-of-action',
    term: 'Mechanism of action',
    short: 'How a drug produces its effect in the body.',
    aliases: ['MoA'],
    worldId: 'w1',
  },
  {
    id: 'biomarker',
    term: 'Biomarker',
    short:
      'A measurable sign in the body, like a blood protein, that shows how a disease or treatment is behaving.',
    worldId: 'w1',
  },
  {
    id: 'in-vitro',
    term: 'In vitro',
    short: 'Experiments done in test tubes or cell dishes, not in a living body.',
    worldId: 'w1',
  },
  {
    id: 'in-vivo',
    term: 'In vivo',
    short: 'Experiments done in a living organism, such as animal studies.',
    worldId: 'w1',
  },

  // Preclinical
  {
    id: 'preclinical',
    term: 'Preclinical',
    short: 'Lab and animal studies done before a drug is tested in people.',
    aliases: ['Nonclinical'],
    worldId: 'w1',
  },
  {
    id: 'glp',
    term: 'GLP',
    short: 'Good Laboratory Practice: rules for how preclinical safety studies must be run and recorded.',
    aliases: ['Good Laboratory Practice'],
    worldId: 'w1',
  },
  {
    id: 'toxicology',
    term: 'Toxicology',
    short: 'The study of how, and at what doses, a substance causes harm.',
    worldId: 'w1',
  },
  {
    id: 'noael',
    term: 'NOAEL',
    short:
      'No Observed Adverse Effect Level: the highest dose in animal studies that caused no harmful effects.',
    worldId: 'w1',
  },
  {
    id: 'starting-dose',
    term: 'Starting dose (MRSD)',
    short:
      'Maximum Recommended Starting Dose: the first dose given to humans, calculated from animal data with a safety margin.',
    aliases: ['MRSD', 'First-in-human dose'],
    worldId: 'w1',
  },
  {
    id: 'pharmacokinetics',
    term: 'Pharmacokinetics (PK)',
    short: 'What the body does to a drug: how it is absorbed, distributed, broken down and removed.',
    aliases: ['PK', 'ADME'],
    worldId: 'w1',
  },
  {
    id: 'pharmacodynamics',
    term: 'Pharmacodynamics (PD)',
    short: 'What the drug does to the body.',
    aliases: ['PD'],
    worldId: 'w1',
  },
  {
    id: 'three-rs',
    term: 'The 3Rs',
    short: 'Replace, Reduce, Refine: the ethical principles for using animals in research.',
    aliases: ['3Rs'],
    worldId: 'w1',
  },
  {
    id: 'safety-pharmacology',
    term: 'Safety pharmacology',
    short:
      "Studies of a drug's effects on vital systems like the heart, lungs and brain before human trials.",
    worldId: 'w1',
  },
  {
    id: 'investigators-brochure',
    term: "Investigator's Brochure (IB)",
    short: 'The summary of everything known about a drug, given to every doctor running a trial with it.',
    aliases: ['IB'],
    worldId: 'w1',
  },

  // CMC
  {
    id: 'cmc',
    term: 'CMC',
    short:
      'Chemistry, Manufacturing and Controls: the work of making a drug product consistently and proving it.',
    worldId: 'w1',
  },
  {
    id: 'api',
    term: 'API',
    short: 'Active Pharmaceutical Ingredient: the part of a medicine that produces its effect.',
    aliases: ['Active ingredient', 'Drug substance'],
    worldId: 'w1',
  },
  {
    id: 'excipient',
    term: 'Excipient',
    short: 'An inactive ingredient, like a filler or coating, that helps deliver the active ingredient.',
    worldId: 'w1',
  },
  {
    id: 'formulation',
    term: 'Formulation',
    short:
      'The recipe that turns an active ingredient into a usable product, such as a tablet, capsule or injection.',
    worldId: 'w1',
  },
  {
    id: 'stability',
    term: 'Stability study',
    short: 'Testing whether a product keeps its strength and purity over time under set storage conditions.',
    worldId: 'w1',
  },
  {
    id: 'gmp',
    term: 'GMP',
    short:
      'Good Manufacturing Practice: rules that ensure medicines are made and checked to consistent quality standards.',
    aliases: ['Good Manufacturing Practice'],
    worldId: 'w1',
  },
  {
    id: 'batch-record',
    term: 'Batch record',
    short: 'The document that records exactly how one batch of drug was made and tested.',
    worldId: 'w1',
  },
  {
    id: 'shelf-life',
    term: 'Shelf life',
    short: 'How long a product stays within its quality limits under the storage conditions on its label.',
    worldId: 'w1',
  },

  // Regulatory basics
  {
    id: 'ind',
    term: 'IND',
    short:
      'Investigational New Drug application: the filing that lets a sponsor start testing a drug in people in the US.',
    worldId: 'w1',
  },
  {
    id: 'cta',
    term: 'CTA',
    short:
      'Clinical Trial Application: the filing used in the EU and many other regions to start a trial, similar to a US IND.',
    worldId: 'w1',
  },
  {
    id: 'ectd',
    term: 'eCTD',
    short:
      'Electronic Common Technical Document: the standard 5-module format for sending submissions to regulators.',
    worldId: 'w1',
  },
  {
    id: 'phase-1',
    term: 'Phase I',
    short: 'The first trials in people, usually small and focused on safety and dosing.',
    worldId: 'w1',
  },
  {
    id: 'phase-2',
    term: 'Phase II',
    short: 'Mid-size trials that look for evidence the drug works and find the best dose.',
    worldId: 'w1',
  },
  {
    id: 'phase-3',
    term: 'Phase III',
    short: 'Large trials that aim to prove the drug works and is safe enough to approve.',
    worldId: 'w1',
  },

  // Amendment 1 additions
  {
    id: 'alt',
    term: 'ALT',
    short: 'Alanine aminotransferase: a liver enzyme that rises in the blood when liver cells are damaged.',
    aliases: ['liver enzyme'],
    worldId: 'w1',
  },
  {
    id: 'hed',
    term: 'Human equivalent dose (HED)',
    short:
      'An animal dose converted to a human dose, usually by body surface area, before a safety factor is applied.',
    aliases: ['HED'],
    worldId: 'w1',
  },
  {
    id: 'safety-factor',
    term: 'Safety factor',
    short:
      'The number (at least 10 by default) the human equivalent dose is divided by to set a cautious first dose.',
    worldId: 'w1',
  },
  {
    id: 'mabel',
    term: 'MABEL',
    short:
      'Minimal Anticipated Biological Effect Level: a first-dose approach used in the EU for higher-risk molecules, starting from the lowest dose expected to do anything.',
    worldId: 'w1',
  },
  {
    id: 'clinical-hold',
    term: 'Clinical hold',
    short:
      'An FDA order pausing a trial until the sponsor answers safety or quality questions; EU regulators use similar powers under different names.',
    worldId: 'w4',
  },
  {
    id: 'sentinel-dosing',
    term: 'Sentinel dosing',
    short:
      'Dosing one or two volunteers first and waiting before the rest of the cohort, to limit exposure if something goes wrong.',
    worldId: 'w4',
  },
  {
    id: 'selectivity',
    term: 'Selectivity',
    short:
      'How much more strongly a compound acts on its target than on similar molecules; poor selectivity means side effects.',
    worldId: 'w1',
  },
  {
    id: 'pains',
    term: 'Assay interference',
    short:
      'Compounds that fool the screening test itself, looking active when they are not; a common source of false hits.',
    aliases: ['PAINS'],
    worldId: 'w1',
  },
  {
    id: 'dissolution',
    term: 'Dissolution test',
    short: 'A lab test of how fast a tablet or capsule releases its drug, run on every batch.',
    worldId: 'w1',
  },
  ...w2Terms,
  ...w3Terms,
  ...w4Terms,
];

export const glossaryById: Record<string, GlossaryTerm> = Object.fromEntries(glossary.map((t) => [t.id, t]));
