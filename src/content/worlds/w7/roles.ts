import type { Role } from '../../types';
import { roleRefById } from '../../roleIndex';

const ref = (id: string) => {
  const r = roleRefById[id];
  if (!r) throw new Error(`Unknown role id in roleIndex: ${id}`);
  return r;
};

export const w7Roles: Role[] = [
  {
    ...ref('regulatory-affairs-lead'),
    card: {
      whatIDo:
        'I lead the marketing application. I decide the regulatory strategy, assemble the [[nda|NDA]] or [[maa|MAA]] across all five [[ectd|eCTD]] modules, negotiate with the agency during review, and own the answer to every question they send.',
      responsibilities: [
        'Set the global submission strategy and timeline',
        'Assemble and quality-check the dossier',
        'Lead agency meetings and respond to review questions',
        'Negotiate the label with the regulator',
        'Manage post-approval commitments',
      ],
      skills: [
        'Regulatory law and guidance',
        'Strategy',
        'Negotiation',
        'Coordinating hundreds of contributors',
      ],
      background: 'Senior regulatory professionals, often with 15 or more years across several submissions.',
      receivesFrom: [
        'regulatory-affairs-specialist',
        'medical-writer',
        'database-lock-lead',
        'statistical-programmer',
      ],
      handsOffTo: ['submission-publisher', 'health-authority-reviewer', 'labeling-specialist'],
      documents: [
        'Regulatory strategy',
        'NDA / MAA dossier',
        'Agency correspondence',
        'Post-approval commitment tracker',
      ],
      funFact:
        'A single marketing application can exceed 100,000 pages; the five-module eCTD structure is the same in the US, EU, Japan and beyond, which is why it was invented.',
    },
  },
  {
    ...ref('submission-publisher'),
    card: {
      whatIDo:
        "I turn the dossier into a single electronic submission the regulator's gateway will accept. Bookmarks, hyperlinks, file formats, lifecycle attributes and [[technical-validation|validation checks]]: if any of it is wrong, the whole submission bounces.",
      responsibilities: [
        'Publish documents to eCTD specifications',
        'Build bookmarks, links and the submission backbone',
        'Run technical validation before submission',
        'Submit through the electronic gateway',
        'Manage lifecycle for amendments and responses',
      ],
      skills: [
        'eCTD tools and specifications',
        'Attention to detail',
        'Working to fixed dates',
        'Calm at 2 am',
      ],
      background: 'Specialists at sponsors and publishing vendors, often from document management or IT.',
      receivesFrom: ['regulatory-affairs-lead', 'statistical-programmer', 'medical-writer'],
      handsOffTo: ['health-authority-reviewer', 'regulatory-affairs-lead'],
      documents: [
        'eCTD backbone (XML)',
        'Validation report',
        'Gateway acknowledgement',
        'Publishing checklist',
      ],
      funFact:
        'Regulators run automated validation on every submission; a single broken hyperlink can be a "high" error that stops the clock until it is fixed.',
    },
  },
  {
    ...ref('health-authority-reviewer'),
    card: {
      whatIDo:
        'I review medicines for the public. At the [[fda|FDA]], the [[ema|EMA]] or another agency, I read the dossier, question the sponsor, weigh [[benefit-risk|benefit against risk]], and recommend approval, conditions, or refusal. The company is not my client. Patients are.',
      responsibilities: [
        'Conduct the [[filing-review|filing review]] and the full scientific review',
        'Send questions and information requests to the sponsor',
        'Weigh benefit-risk for the proposed population',
        'Present to [[advisory-committee|advisory committees]] where needed',
        'Draft the decision and negotiate the label',
      ],
      skills: [
        'Medicine, pharmacology or statistics',
        'Critical reading',
        'Independence',
        'Writing decisions that hold up',
      ],
      background:
        'Physicians, pharmacologists, statisticians and chemists employed by a national or regional regulator.',
      receivesFrom: ['submission-publisher', 'regulatory-affairs-lead', 'dsmb-member', 'medical-writer'],
      handsOffTo: ['inspection-readiness-lead', 'labeling-specialist', 'signal-detection-scientist'],
      documents: [
        'Review memos',
        'Information requests',
        'Advisory committee briefing',
        'Approval letter or complete response letter',
      ],
      funFact:
        'A standard FDA review of a new drug application takes about ten months from filing; the EU centralised procedure runs to a 210-day active clock, paused while the sponsor answers questions.',
    },
  },
  {
    ...ref('inspection-readiness-lead'),
    card: {
      whatIDo:
        'I prepare the company for the day an inspector walks in. I keep the [[tmf|TMF]] retrievable, train staff to answer questions accurately, run mock inspections, and on the day I run the back room that finds every document the inspector asks for.',
      responsibilities: [
        'Maintain inspection readiness across sites and vendors',
        'Run mock [[gcp-inspection|inspections]] and fix what they find',
        'Manage the inspection back room and request log',
        'Coordinate answers and escort the inspector',
        'Respond to inspection findings with [[capa|CAPAs]]',
      ],
      skills: [
        'GCP and inspection practice',
        'Organisation',
        'Coaching people under pressure',
        'Document retrieval',
      ],
      background: 'Quality and clinical operations professionals with experience of real inspections.',
      receivesFrom: [
        'health-authority-reviewer',
        'tmf-specialist',
        'qa-auditor',
        'systems-validation-engineer',
      ],
      handsOffTo: ['labeling-specialist', 'qa-auditor', 'regulatory-affairs-lead'],
      documents: [
        'Inspection readiness plan',
        'Request and handover log',
        'Mock inspection report',
        'Inspection response',
      ],
      funFact:
        "Pre-approval inspections often target the sites that enrolled the most patients or had the most unusual data, which is why the central monitor's outlier list is the inspection's reading list.",
    },
  },
  {
    ...ref('labeling-specialist'),
    card: {
      whatIDo:
        'I write and negotiate the [[prescribing-information|label]]: the official text that tells doctors who the medicine is for, who must not take it, what to warn about and what to monitor. Every word is agreed with the regulator, and every word matters.',
      responsibilities: [
        'Draft the prescribing information and patient leaflet',
        'Negotiate wording with the regulator',
        'Decide the prominence of warnings, including [[boxed-warning|boxed warnings]]',
        'Keep labels consistent across countries',
        'Update the label as new safety data emerge',
      ],
      skills: ['Medical writing', 'Regulatory labeling rules', 'Negotiation', 'Precision with words'],
      background: 'Medical writers, pharmacists and regulatory professionals who specialise in labeling.',
      receivesFrom: [
        'regulatory-affairs-lead',
        'health-authority-reviewer',
        'pharmacovigilance-associate',
        'inspection-readiness-lead',
      ],
      handsOffTo: ['brand-marketing-manager', 'medical-science-liaison', 'signal-detection-scientist'],
      documents: [
        'Prescribing information (US) / SmPC (EU)',
        'Patient information leaflet',
        'Label negotiation history',
        'Label change control',
      ],
      funFact:
        'In the US the label is called prescribing information; in the EU the Summary of Product Characteristics. Marketing may only claim what these documents say.',
    },
  },
];
