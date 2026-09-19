import type { Role } from '../../types';
import { roleRefById } from '../../roleIndex';

const ref = (id: string) => {
  const r = roleRefById[id];
  if (!r) throw new Error(`Unknown role id in roleIndex: ${id}`);
  return r;
};

export const w8Roles: Role[] = [
  {
    ...ref('manufacturing-supply-lead'),
    card: {
      whatIDo:
        'I take a process that made thousands of capsules and make it produce millions, identically, under [[gmp|GMP]]. I run [[scale-up|scale-up]] and [[process-validation|validation]], build [[launch-stock|launch stock]], and keep the supply chain moving for as long as the medicine is sold.',
      responsibilities: [
        'Scale the manufacturing process to commercial volume',
        'Run process validation batches',
        'Plan and build launch and ongoing stock',
        'Manage contract manufacturers and suppliers',
        'Handle shortages, recalls and quality deviations',
      ],
      skills: ['Chemical or process engineering', 'GMP', 'Supply planning', 'Crisis handling'],
      background: 'Engineers and pharmacists who rose through manufacturing operations.',
      receivesFrom: ['cmc-scientist', 'portfolio-lead', 'labeling-specialist'],
      handsOffTo: ['market-access-specialist', 'brand-marketing-manager', 'signal-detection-scientist'],
      documents: [
        'Process validation protocol and report',
        'Batch records',
        'Supply plan',
        'Deviation and recall procedures',
      ],
      funFact:
        'A medicine can be approved and still not launch for months because the commercial-scale process failed validation; regulators inspect the factory as well as the data.',
    },
  },
  {
    ...ref('market-access-specialist'),
    card: {
      whatIDo:
        'I make sure an approved medicine can actually be prescribed and paid for. I build the [[value-dossier|value dossier]], set the pricing strategy, and negotiate [[reimbursement]] with [[payer|payers]] and [[hta|HTA]] bodies, country by country.',
      responsibilities: [
        'Build the health-economic value case',
        'Set pricing strategy across markets',
        'Prepare and defend HTA submissions',
        'Negotiate reimbursement and access agreements',
        'Monitor real-world access and address barriers',
      ],
      skills: ['Health economics', 'Negotiation', 'Understanding of health systems', 'Modelling'],
      background: 'Economists, pharmacists and policy specialists at sponsors and consultancies.',
      receivesFrom: ['manufacturing-supply-lead', 'health-authority-reviewer', 'medical-writer'],
      handsOffTo: ['brand-marketing-manager', 'medical-science-liaison', 'rwe-lead'],
      documents: ['Global value dossier', 'Pricing strategy', 'HTA submissions', 'Reimbursement agreements'],
      funFact:
        'In many countries a medicine can be approved as safe and effective but judged "not cost-effective" by an HTA body, which means the health system will not pay for it.',
    },
  },
  {
    ...ref('brand-marketing-manager'),
    card: {
      whatIDo:
        'I lead the launch and the brand. Every campaign I run may claim only what the approved label says, backed by evidence, with risks in [[fair-balance|fair balance]]. Everything goes through [[promotional-review|promotional review]] before a doctor or patient sees it.',
      responsibilities: [
        'Plan and run the launch campaign',
        'Ensure every claim is on-label and substantiated',
        'Submit all materials to medical, legal and regulatory review',
        'Train the sales force on compliant messaging',
        'Track performance and adjust within the rules',
      ],
      skills: [
        'Marketing',
        'Regulatory promotion rules',
        'Discipline',
        'Judgement under commercial pressure',
      ],
      background: 'Marketing professionals, often with a science degree, at the sponsor.',
      receivesFrom: ['labeling-specialist', 'market-access-specialist', 'manufacturing-supply-lead'],
      handsOffTo: ['medical-science-liaison', 'sales-representative', 'signal-detection-scientist'],
      documents: [
        'Launch plan',
        'Approved promotional materials',
        'Promotional review records',
        'Claims substantiation file',
      ],
      funFact:
        'Regulators and competitors both monitor promotional materials; a single [[off-label|off-label]] claim can trigger a warning letter, a corrective advertising campaign and a fine.',
    },
  },
  {
    ...ref('medical-science-liaison'),
    card: {
      whatIDo:
        "I am the company's scientist in the field. I discuss the evidence with specialists, answer their unsolicited questions, including off-label ones, in a [[non-promotional|non-promotional]] way, bring their insights back, and report any adverse event I hear about.",
      responsibilities: [
        'Hold scientific exchange with specialists and researchers',
        'Answer unsolicited questions with balanced evidence',
        'Support investigator-initiated research appropriately',
        'Report adverse events heard in the field within one business day',
        'Stay separate from sales and marketing',
      ],
      skills: ['Deep therapeutic knowledge', 'Scientific communication', 'Boundaries', 'Listening'],
      background: "PhDs, PharmDs and MDs in the sponsor's medical affairs department.",
      receivesFrom: ['brand-marketing-manager', 'labeling-specialist', 'market-access-specialist'],
      handsOffTo: ['sales-representative', 'signal-detection-scientist', 'rwe-lead'],
      documents: [
        'Scientific response documents',
        'Field insight reports',
        'Adverse event reports',
        'Medical affairs plan',
      ],
      funFact:
        'MSLs are deliberately not paid on sales and do not carry promotional materials; the separation exists so that doctors can trust what they say.',
    },
  },
  {
    ...ref('sales-representative'),
    card: {
      whatIDo:
        'I present VX-101 to doctors, from approved materials only. [[detailing|Detailing]] means showing the benefit and the risk together, answering within the label, passing scientific questions to the MSL, and never offering anything that could look like an [[inducement]].',
      responsibilities: [
        'Present approved materials to prescribers',
        'Keep every conversation on-label and in fair balance',
        'Refer scientific and off-label questions to medical affairs',
        'Report adverse events heard in the field',
        'Follow gift, hospitality and interaction rules',
      ],
      skills: ['Communication', 'Product knowledge', 'Compliance discipline', 'Resilience'],
      background:
        'Sales professionals, often with a science or nursing background, trained and certified on the product.',
      receivesFrom: ['brand-marketing-manager', 'medical-science-liaison'],
      handsOffTo: ['signal-detection-scientist', 'medical-science-liaison'],
      documents: [
        'Approved detail aids',
        'Call records',
        'Compliance training certificates',
        'Adverse event reporting form',
      ],
      funFact:
        'In the US, payments and even meals given to doctors by companies are published in a public database, so a lunch bought for a prescriber is a matter of record.',
    },
  },
  {
    ...ref('signal-detection-scientist'),
    card: {
      whatIDo:
        'I watch the medicine after approval, when it meets forty thousand patients instead of a thousand. I read [[spontaneous-report|spontaneous reports]] and databases for [[signal-detection|signals]]: patterns of harm the trials were too small to see, and get them into the label.',
      responsibilities: [
        'Run signal detection on spontaneous reports and databases',
        'Assess [[disproportionality]] and validate signals',
        'Report validated signals to regulators',
        'Write periodic safety update reports',
        'Drive label updates and risk minimisation',
      ],
      skills: ['Pharmacoepidemiology', 'Statistics', 'Medical judgement', 'Persistence'],
      background: "Doctors, pharmacists and epidemiologists in a sponsor's pharmacovigilance department.",
      receivesFrom: [
        'pharmacovigilance-associate',
        'medical-science-liaison',
        'sales-representative',
        'labeling-specialist',
      ],
      handsOffTo: ['rwe-lead', 'labeling-specialist', 'health-authority-reviewer'],
      documents: [
        'Signal detection reports',
        'Periodic safety update report (PSUR)',
        'Risk management plan (post-market)',
        'Label change proposal',
      ],
      funFact:
        'Some of the most important drug safety discoveries came from post-market reports, because an event affecting one patient in 10,000 is invisible in a trial of 1,000.',
    },
  },
  {
    ...ref('rwe-lead'),
    card: {
      whatIDo:
        'I study the medicine in the real world. I design [[phase-4|post-approval studies]] and [[rwe|real-world evidence]] analyses using [[registry|registries]], health records and pragmatic trials, to answer what the pre-approval trials could not and to keep the label honest.',
      responsibilities: [
        'Design post-approval and post-authorisation safety studies',
        'Build real-world evidence from registries and records',
        'Meet [[post-approval-commitment|post-approval commitments]] on time',
        'Publish results whatever they show',
        'Feed findings back into the label and clinical practice',
      ],
      skills: ['Epidemiology', 'Study design', 'Data science', 'Scientific integrity'],
      background:
        'Epidemiologists and health-services researchers at sponsors, universities and research organisations.',
      receivesFrom: ['signal-detection-scientist', 'medical-science-liaison', 'market-access-specialist'],
      handsOffTo: ['labeling-specialist', 'health-authority-reviewer', 'patient-advocate'],
      documents: [
        'Post-approval study protocol',
        'Registry data agreements',
        'Study reports and publications',
        'Label update evidence package',
      ],
      funFact:
        'A medicine keeps being studied for as long as it is sold; some drugs have had their labels updated dozens of times over decades as real-world evidence accumulated.',
    },
  },
];
