import type { GlossaryTerm } from '../types';

/** Terms introduced in World 5 — Phase II. */
export const w5Terms: GlossaryTerm[] = [
  {
    id: 'patient-recruitment',
    term: 'Patient recruitment',
    short:
      'Finding and enrolling the people a study needs, through clinics, patient groups and approved advertising.',
    worldId: 'w5',
  },
  {
    id: 'recruitment-materials',
    term: 'Recruitment materials',
    short:
      'Ads, posters and web pages inviting people to a study; all must say it is research and be approved by the ethics committee.',
    worldId: 'w5',
  },
  {
    id: 'sdv',
    term: 'Source data verification (SDV)',
    short:
      'Comparing what is in the study database with the original clinic records to confirm it is accurate.',
    aliases: ['SDV'],
    worldId: 'w5',
  },
  {
    id: 'protocol-deviation',
    term: 'Protocol deviation',
    short:
      'Any departure from the protocol; serious ones (dosing before consent, ineligible patients) must be reported.',
    aliases: ['Deviation', 'Protocol violation'],
    worldId: 'w5',
  },
  {
    id: 'monitoring-visit',
    term: 'Monitoring visit',
    short:
      "A monitor's scheduled visit to a site to verify data, consent, drug accountability and the site file.",
    worldId: 'w5',
  },
  {
    id: 'data-query',
    term: 'Data query',
    short:
      'A question sent to a site about a value that looks wrong, missing or contradictory, answered from source and then closed.',
    aliases: ['Query'],
    worldId: 'w5',
  },
  {
    id: 'data-cleaning',
    term: 'Data cleaning',
    short: 'The review, query and correction cycle that makes a study database fit to analyse.',
    worldId: 'w5',
  },
  {
    id: 'medical-coding',
    term: 'Medical coding',
    short:
      'Mapping what patients and doctors wrote to standard dictionary terms so events can be counted consistently.',
    aliases: ['Coding'],
    worldId: 'w5',
  },
  {
    id: 'meddra',
    term: 'MedDRA',
    short: 'The standard medical dictionary used to code adverse events and diagnoses in trials worldwide.',
    worldId: 'w5',
  },
  {
    id: 'whodrug',
    term: 'WHODrug',
    short: 'The standard dictionary used to code medicines patients take during a trial.',
    worldId: 'w5',
  },
  {
    id: 'sae',
    term: 'Serious adverse event (SAE)',
    short:
      'An adverse event that results in death, is life-threatening, requires hospitalisation, or causes lasting disability or a birth defect.',
    aliases: ['SAE'],
    worldId: 'w5',
  },
  {
    id: 'susar',
    term: 'SUSAR',
    short:
      'A suspected unexpected serious adverse reaction: serious, not already known for the drug, and possibly caused by it; reported to regulators fast.',
    worldId: 'w5',
  },
  {
    id: 'expedited-reporting',
    term: 'Expedited reporting',
    short:
      'Reporting a SUSAR to regulators within 7 days (fatal or life-threatening) or 15 days, counted from when the sponsor learned of it.',
    worldId: 'w5',
  },
  {
    id: 'causality',
    term: 'Causality',
    short:
      'The judgement of whether the study drug could have caused an event, from "not related" to "definitely related".',
    aliases: ['Relatedness'],
    worldId: 'w5',
  },
];
