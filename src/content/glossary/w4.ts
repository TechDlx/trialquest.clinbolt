import type { GlossaryTerm } from '../types';

/** Terms introduced in World 4 — Phase I. */
export const w4Terms: GlossaryTerm[] = [
  {
    id: 'screening',
    term: 'Screening',
    short: 'The visit where a candidate is checked against the eligibility criteria before joining a study.',
    worldId: 'w4',
  },
  {
    id: 'screen-failure',
    term: 'Screen failure',
    short: 'A candidate who does not meet the eligibility criteria and therefore cannot join the study.',
    worldId: 'w4',
  },
  {
    id: 'source-document',
    term: 'Source document',
    short:
      'The original record of a fact about a participant (a lab report, a clinic note) that the study data is checked against.',
    aliases: ['Source data'],
    worldId: 'w4',
  },
  {
    id: 'protocol-clarification',
    term: 'Protocol clarification',
    short:
      'A written answer from the sponsor when the protocol is silent or unclear, so every site applies it the same way.',
    worldId: 'w4',
  },
  {
    id: 'consent-process',
    term: 'Consent process',
    short:
      'The conversation, time to ask questions, and signature that together make consent informed; the signature alone is not enough.',
    worldId: 'w4',
  },
  {
    id: 'pk-sampling',
    term: 'PK sampling',
    short:
      'Blood draws at exact times after a dose, used to measure how much drug is in the body and how fast it leaves.',
    worldId: 'w4',
  },
  {
    id: 'exposure',
    term: 'Exposure',
    short:
      'How much drug actually reaches the blood over time (often measured as peak level and area under the curve).',
    aliases: ['AUC', 'Cmax'],
    worldId: 'w4',
  },
  {
    id: 'half-life',
    term: 'Half-life',
    short: 'The time it takes for the amount of drug in the body to fall by half.',
    worldId: 'w4',
  },
  {
    id: 'dose-escalation',
    term: 'Dose escalation',
    short:
      'Giving small groups rising doses, one step at a time, and reviewing safety and exposure before each step.',
    aliases: ['Escalation'],
    worldId: 'w4',
  },
  {
    id: 'stopping-rule',
    term: 'Stopping rule',
    short:
      'A rule written in the protocol that says exactly when dosing must pause or stop, before anyone sees the data.',
    worldId: 'w4',
  },
];
