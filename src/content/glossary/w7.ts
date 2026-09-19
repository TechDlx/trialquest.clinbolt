import type { GlossaryTerm } from '../types';

/** Terms introduced in World 7 — Submission & Approval. */
export const w7Terms: GlossaryTerm[] = [
  {
    id: 'nda',
    term: 'NDA',
    short:
      'New Drug Application: the US marketing application asking the FDA to approve a medicine for sale.',
    worldId: 'w7',
  },
  {
    id: 'maa',
    term: 'MAA',
    short: 'Marketing Authorisation Application: the EU equivalent of the NDA, reviewed by the EMA.',
    worldId: 'w7',
  },
  {
    id: 'ectd-modules',
    term: 'eCTD modules',
    short:
      'The five sections of a submission: 1 regional forms, 2 summaries, 3 quality, 4 nonclinical, 5 clinical.',
    worldId: 'w7',
  },
  {
    id: 'technical-validation',
    term: 'Technical validation',
    short:
      "Automated checks that a submission's files, links, formats and metadata meet the regulator's specifications.",
    worldId: 'w7',
  },
  {
    id: 'filing-review',
    term: 'Filing review',
    short:
      "The regulator's first check (about 60 days in the US) that an application is complete enough to review in full.",
    aliases: ['Day 74 letter', 'Validation phase'],
    worldId: 'w7',
  },
  {
    id: 'advisory-committee',
    term: 'Advisory committee',
    short:
      'A public meeting of outside experts, and often patients, who advise the regulator on a difficult approval decision.',
    worldId: 'w7',
  },
  {
    id: 'complete-response-letter',
    term: 'Complete response letter',
    short:
      "The FDA's letter saying an application cannot be approved as submitted and what would be needed; the EU equivalent is a negative opinion.",
    aliases: ['CRL'],
    worldId: 'w7',
  },
  {
    id: 'gcp-inspection',
    term: 'GCP inspection',
    short:
      "A regulator's on-site examination of a sponsor, site or vendor to check the trial was run and reported properly.",
    aliases: ['Inspection', 'BIMO inspection'],
    worldId: 'w7',
  },
  {
    id: 'prescribing-information',
    term: 'Prescribing information',
    short:
      'The official label for doctors: indication, dosing, warnings, contraindications and monitoring; called the SmPC in the EU.',
    aliases: ['Label', 'SmPC', 'Package insert'],
    worldId: 'w7',
  },
  {
    id: 'boxed-warning',
    term: 'Boxed warning',
    short:
      'The most prominent warning a US label can carry, in a box at the top, reserved for serious or life-threatening risks.',
    aliases: ['Black box warning'],
    worldId: 'w7',
  },
  {
    id: 'indication',
    term: 'Indication',
    short: 'The disease and population a medicine is approved to treat; anything outside it is off-label.',
    worldId: 'w7',
  },
  {
    id: 'contraindication',
    term: 'Contraindication',
    short: 'A condition in which a medicine must not be used because the risk clearly outweighs any benefit.',
    worldId: 'w7',
  },
];
