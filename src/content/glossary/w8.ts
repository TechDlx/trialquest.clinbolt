import type { GlossaryTerm } from '../types';

/** Terms introduced in World 8 — Launch & Beyond. */
export const w8Terms: GlossaryTerm[] = [
  {
    id: 'scale-up',
    term: 'Scale-up',
    short:
      'Moving a manufacturing process from clinical-trial quantities to commercial volumes while keeping the product identical.',
    worldId: 'w8',
  },
  {
    id: 'process-validation',
    term: 'Process validation',
    short:
      'Documented proof, usually from consecutive full-scale batches, that a manufacturing process reliably makes product to specification.',
    worldId: 'w8',
  },
  {
    id: 'launch-stock',
    term: 'Launch stock',
    short:
      'The released, in-date product built up before launch so that the first months of demand can be met.',
    worldId: 'w8',
  },
  {
    id: 'payer',
    term: 'Payer',
    short: 'Whoever pays for medicines: a national health system, an insurer or a health plan.',
    worldId: 'w8',
  },
  {
    id: 'hta',
    term: 'Health technology assessment (HTA)',
    short:
      "A formal review of whether a medicine's benefit is worth its cost to the health system; the verdict shapes reimbursement.",
    aliases: ['HTA'],
    worldId: 'w8',
  },
  {
    id: 'value-dossier',
    term: 'Value dossier',
    short:
      'The evidence package that argues what a medicine is worth: clinical benefit, quality of life, and cost compared with alternatives.',
    worldId: 'w8',
  },
  {
    id: 'reimbursement',
    term: 'Reimbursement',
    short: 'An agreement that a payer will cover a medicine, at what price and for which patients.',
    worldId: 'w8',
  },
  {
    id: 'off-label',
    term: 'Off-label',
    short:
      'Use of a medicine outside its approved indication; doctors may prescribe off-label, but companies may not promote it.',
    worldId: 'w8',
  },
  {
    id: 'fair-balance',
    term: 'Fair balance',
    short: 'The rule that promotional material must present risks with prominence comparable to benefits.',
    worldId: 'w8',
  },
  {
    id: 'promotional-review',
    term: 'Promotional review',
    short: 'The medical, legal and regulatory check every promotional piece must pass before use.',
    aliases: ['MLR review'],
    worldId: 'w8',
  },
  {
    id: 'non-promotional',
    term: 'Non-promotional',
    short:
      'Scientific exchange that informs without selling: balanced, evidence-based, and never tied to sales goals.',
    worldId: 'w8',
  },
  {
    id: 'medical-information',
    term: 'Medical information',
    short:
      "A company's function for answering questions about its medicines factually, from the label and the evidence.",
    worldId: 'w8',
  },
  {
    id: 'detailing',
    term: 'Detailing',
    short:
      "A sales representative's presentation of a medicine to a prescriber, using approved materials only.",
    worldId: 'w8',
  },
  {
    id: 'inducement',
    term: 'Inducement',
    short:
      'Anything of value offered to influence prescribing, such as gifts, travel or payments; prohibited under anti-corruption rules.',
    worldId: 'w8',
  },
  {
    id: 'spontaneous-report',
    term: 'Spontaneous report',
    short:
      'A report of a suspected adverse reaction sent voluntarily by a doctor, pharmacist, patient or company employee after approval.',
    worldId: 'w8',
  },
  {
    id: 'signal-detection',
    term: 'Signal detection',
    short:
      'Searching post-market reports and databases for patterns suggesting a new or changed risk of a medicine.',
    aliases: ['Safety signal'],
    worldId: 'w8',
  },
  {
    id: 'disproportionality',
    term: 'Disproportionality',
    short:
      'When an event is reported for a medicine more often than expected compared with all other medicines; a statistical signal.',
    worldId: 'w8',
  },
  {
    id: 'label-update',
    term: 'Label update',
    short:
      'Changing the approved label to add a new risk, warning or instruction, agreed with the regulator.',
    worldId: 'w8',
  },
  {
    id: 'phase-4',
    term: 'Phase IV / post-approval study',
    short:
      'A study run after approval to answer questions the earlier trials could not, often required by the regulator.',
    aliases: ['Phase IV', 'Post-authorisation safety study', 'PASS'],
    worldId: 'w8',
  },
  {
    id: 'rwe',
    term: 'Real-world evidence (RWE)',
    short:
      'Evidence about a medicine from routine care: registries, health records, claims data and pragmatic trials.',
    aliases: ['RWE', 'Real-world data'],
    worldId: 'w8',
  },
  {
    id: 'registry',
    term: 'Registry',
    short:
      'An organised collection of data on patients with a disease or on a treatment, followed over time.',
    worldId: 'w8',
  },
  {
    id: 'post-approval-commitment',
    term: 'Post-approval commitment',
    short: 'A study or action a company promises the regulator as a condition of approval, with deadlines.',
    aliases: ['Post-marketing requirement'],
    worldId: 'w8',
  },
];
