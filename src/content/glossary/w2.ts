import type { GlossaryTerm } from '../types';

/** Terms introduced in World 2 — Designing the Trial. */
export const w2Terms: GlossaryTerm[] = [
  {
    id: 'primary-endpoint',
    term: 'Primary endpoint',
    short: 'The one measurement, chosen before the study starts, that answers its main question.',
    worldId: 'w2',
  },
  {
    id: 'adverse-event',
    term: 'Adverse event (AE)',
    short: 'Any unwanted medical event in a participant during a study, whether or not the drug caused it.',
    aliases: ['AE'],
    worldId: 'w2',
  },
  {
    id: 'eligibility-criteria',
    term: 'Eligibility criteria',
    short: 'The inclusion and exclusion rules that decide who may join a study and who may not.',
    aliases: ['Inclusion criteria', 'Exclusion criteria'],
    worldId: 'w2',
  },
  {
    id: 'randomization',
    term: 'Randomization',
    short:
      'Assigning participants to treatment or placebo by chance, so the groups are alike except for the treatment.',
    worldId: 'w2',
  },
  {
    id: 'blinding',
    term: 'Blinding',
    short:
      'Keeping participants (single-blind) or participants and staff (double-blind) from knowing who gets the drug and who gets placebo.',
    aliases: ['Double-blind', 'Masking'],
    worldId: 'w2',
  },
  {
    id: 'statistical-power',
    term: 'Statistical power',
    short: 'The chance a study detects an effect that is really there; usually set at 80 to 90 percent.',
    aliases: ['Power'],
    worldId: 'w2',
  },
  {
    id: 'sample-size',
    term: 'Sample size',
    short:
      'The number of participants a study needs, calculated from the expected effect, the noise and the power wanted.',
    worldId: 'w2',
  },
  {
    id: 'sap',
    term: 'Statistical analysis plan (SAP)',
    short:
      'The document that fixes exactly how the data will be analysed, written before anyone sees unblinded results.',
    aliases: ['SAP'],
    worldId: 'w2',
  },
  {
    id: 'pre-ind-meeting',
    term: 'Pre-submission meeting',
    short:
      'A meeting with the regulator before filing (a pre-IND meeting in the US, scientific advice in the EU) to agree what the package needs.',
    aliases: ['Pre-IND meeting', 'Scientific advice'],
    worldId: 'w2',
  },
  {
    id: 'therapeutic-misconception',
    term: 'Therapeutic misconception',
    short: 'When a participant wrongly believes a research study is designed to treat them personally.',
    worldId: 'w2',
  },
  {
    id: 'undue-influence',
    term: 'Undue influence',
    short:
      "Pressure, such as a large payment or a doctor's authority, that makes agreeing to a study less than voluntary.",
    worldId: 'w2',
  },
  {
    id: 'go-no-go',
    term: 'Go / no-go decision',
    short:
      'A milestone review where a company decides whether a programme continues to the next stage or stops.',
    aliases: ['Stage gate'],
    worldId: 'w2',
  },
];
