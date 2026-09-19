import type { GlossaryTerm } from '../types';

/** Terms introduced in World 3 — Study Start-Up. */
export const w3Terms: GlossaryTerm[] = [
  {
    id: 'study-startup',
    term: 'Study start-up',
    short:
      'Everything between approval and the first patient: sites, contracts, supplies, systems and documents.',
    worldId: 'w3',
  },
  {
    id: 'site-feasibility',
    term: 'Site feasibility',
    short: 'Checking whether a hospital or clinic has the patients, staff and time to run the study.',
    worldId: 'w3',
  },
  {
    id: 'site-selection',
    term: 'Site selection',
    short: 'Choosing which sites will run the trial, based on feasibility answers and qualification visits.',
    worldId: 'w3',
  },
  {
    id: 'site-qualification-visit',
    term: 'Site qualification visit',
    short: "An in-person check of a candidate site's facilities, staff and experience before it is selected.",
    worldId: 'w3',
  },
  {
    id: 'site-contract',
    term: 'Clinical trial agreement',
    short:
      'The contract between the sponsor (or CRO) and a site covering duties, budget and responsibilities.',
    aliases: ['CTA (site)', 'Site contract'],
    worldId: 'w3',
  },
  {
    id: 'site-initiation-visit',
    term: 'Site initiation visit (SIV)',
    short: 'The training visit that confirms a site is ready; only after it may the site screen patients.',
    aliases: ['SIV'],
    worldId: 'w3',
  },
  {
    id: 'risk-management-plan',
    term: 'Risk management plan',
    short:
      'The list of things that could go wrong in a trial, how likely they are, and what will be done about them.',
    worldId: 'w3',
  },
  {
    id: 'clinical-supply',
    term: 'Clinical supply',
    short: 'Getting study drug and placebo made, labelled, shipped and accounted for at every site.',
    worldId: 'w3',
  },
  {
    id: 'qp-release',
    term: 'QP release',
    short: 'In the EU, a Qualified Person must certify every batch of study drug before it can be used.',
    aliases: ['Qualified Person'],
    worldId: 'w3',
  },
  {
    id: 'cold-chain',
    term: 'Cold chain',
    short:
      'Keeping a drug within its required temperature range from factory to patient, with records to prove it.',
    worldId: 'w3',
  },
  {
    id: 'temperature-excursion',
    term: 'Temperature excursion',
    short:
      'Any time a drug goes outside its allowed temperature range; the drug is quarantined until experts rule on it.',
    worldId: 'w3',
  },
  {
    id: 'ecrf',
    term: 'eCRF',
    short: "Electronic case report form: the screens where site staff enter each patient's study data.",
    aliases: ['Case report form', 'CRF'],
    worldId: 'w3',
  },
  {
    id: 'edit-check',
    term: 'Edit check',
    short: 'A rule in the database that flags impossible or out-of-range data the moment it is entered.',
    worldId: 'w3',
  },
  {
    id: 'audit-trail',
    term: 'Audit trail',
    short: 'A record of every change to data: who changed it, when, from what to what, and why.',
    worldId: 'w3',
  },
  {
    id: 'cdisc',
    term: 'CDISC standards',
    short:
      'Industry data standards (such as CDASH, SDTM and ADaM) that make trial data consistent and submittable.',
    aliases: ['CDISC'],
    worldId: 'w3',
  },
  {
    id: 'irt',
    term: 'IRT / RTSM',
    short: 'The system that randomizes patients and assigns numbered drug kits while keeping everyone blind.',
    aliases: ['IRT', 'RTSM', 'IVRS', 'IWRS'],
    worldId: 'w3',
  },
  {
    id: 'stratification',
    term: 'Stratification',
    short:
      'Randomizing separately within groups (such as site or disease severity) so treatments stay balanced within each.',
    worldId: 'w3',
  },
  {
    id: 'kit',
    term: 'Drug kit',
    short:
      'A numbered package of study drug or placebo, identical in appearance, assigned to a patient by the IRT.',
    worldId: 'w3',
  },
  {
    id: 'emergency-unblinding',
    term: 'Emergency unblinding',
    short: "Revealing one patient's treatment when a doctor must know it for their safety; always logged.",
    worldId: 'w3',
  },
  {
    id: 'csv',
    term: 'Computer system validation',
    short:
      'Documented proof that a computer system does what it is supposed to do, required before it holds trial data.',
    aliases: ['CSV', 'Validation'],
    worldId: 'w3',
  },
  {
    id: 'part-11',
    term: '21 CFR Part 11',
    short: 'The US rule for electronic records and signatures; the EU equivalent is Annex 11.',
    aliases: ['Part 11', 'Annex 11'],
    worldId: 'w3',
  },
  {
    id: 'access-control',
    term: 'Access control',
    short:
      'Giving each person their own login and only the permissions their role needs, so every action is attributable.',
    worldId: 'w3',
  },
  {
    id: 'tmf',
    term: 'Trial Master File (TMF)',
    short: 'The organised collection of documents that lets an inspector reconstruct how a trial was run.',
    aliases: ['TMF', 'eTMF'],
    worldId: 'w3',
  },
  {
    id: 'essential-documents',
    term: 'Essential documents',
    short:
      'The documents GCP says must exist to show a trial was run properly: protocol, approvals, contracts, training and more.',
    worldId: 'w3',
  },
];
