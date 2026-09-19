import type { Role } from '../../types';
import { roleRefById } from '../../roleIndex';

const ref = (id: string) => {
  const r = roleRefById[id];
  if (!r) throw new Error(`Unknown role id in roleIndex: ${id}`);
  return r;
};

export const w2Roles: Role[] = [
  {
    ...ref('clinical-scientist'),
    card: {
      whatIDo:
        'I turn a promising molecule into a study plan. I write the [[protocol]]: the question, the [[primary-endpoint|primary endpoint]], who may join, and how the trial stays fair. I am the medical mind behind every design decision.',
      responsibilities: [
        'Write the protocol and its scientific rationale',
        'Choose objectives, endpoints and [[eligibility-criteria|eligibility criteria]]',
        'Judge whether emerging safety data changes the plan',
        "Answer investigators' medical questions during the study",
        'Interpret results with the statistician',
      ],
      skills: [
        'Medicine or life science',
        'Trial design',
        'Clear scientific writing',
        'Judgement under uncertainty',
      ],
      background:
        'Usually a physician or PhD at a sponsor; medical directors are often specialists in the disease.',
      receivesFrom: ['patient-advocate', 'preclinical-toxicologist'],
      handsOffTo: ['biostatistician', 'regulatory-affairs-specialist', 'principal-investigator'],
      documents: [
        'Protocol',
        'Protocol synopsis',
        "Investigator's Brochure (clinical sections)",
        'Study concept document',
      ],
      funFact:
        'A protocol for a large trial can run to 150 pages, and every amendment to it after approval must go back through the regulator and the ethics committee.',
    },
  },
  {
    ...ref('biostatistician'),
    card: {
      whatIDo:
        'I make sure the trial can answer its question with numbers. I set the [[sample-size|sample size]], design the [[randomization]], and write the [[sap|statistical analysis plan]] before anyone sees data, so the result cannot be bent afterwards.',
      responsibilities: [
        'Calculate sample size and [[statistical-power|power]]',
        'Design randomization and stratification',
        'Write the statistical analysis plan (SAP)',
        'Support the data monitoring committee with blinded and unblinded analyses',
        'Analyse the final data and co-author the report',
      ],
      skills: [
        'Statistics',
        'Programming (SAS, R)',
        'Trial methodology',
        'Explaining numbers to non-statisticians',
      ],
      background: 'MSc or PhD in statistics or biostatistics, at a sponsor, a CRO or a university.',
      receivesFrom: ['clinical-scientist'],
      handsOffTo: ['regulatory-affairs-specialist', 'irt-specialist', 'database-lock-lead'],
      documents: [
        'Statistical analysis plan (SAP)',
        'Randomization specification',
        'Sample size justification',
        'Tables, listings and figures (TLFs)',
      ],
      funFact:
        'The rule that the analysis must be fixed before the data are unblinded exists because a clever analyst can find a "positive" result in almost any dataset if allowed to choose the method afterwards.',
    },
  },
  {
    ...ref('regulatory-affairs-specialist'),
    card: {
      whatIDo:
        'I am the bridge between the company and the regulator. I assemble the [[ind|IND]] (US) or [[cta|CTA]] (EU) that asks permission to start a trial, keep every later change filed, and make sure nothing is dosed that the agency has not seen.',
      responsibilities: [
        'Plan and request meetings with the regulator',
        'Assemble and submit the IND / CTA',
        'Track review clocks and answer agency questions',
        'File protocol amendments and annual reports',
        'Advise teams on what regulators expect',
      ],
      skills: ['Regulations and guidance', 'Project management', 'Precise writing', 'Negotiation'],
      background:
        'Scientists or pharmacists who moved into regulatory work; many hold a regulatory affairs certification.',
      receivesFrom: ['preclinical-toxicologist', 'cmc-scientist', 'clinical-scientist', 'biostatistician'],
      handsOffTo: ['irb-member', 'clinical-project-manager', 'regulatory-affairs-lead'],
      documents: [
        'IND / CTA',
        'Pre-submission meeting package',
        'Protocol amendments',
        'Annual reports / DSURs',
      ],
      funFact:
        'In the US, an IND becomes active 30 days after the FDA receives it unless the agency objects. Silence is permission. In the EU, you wait for an explicit authorisation.',
    },
  },
  {
    ...ref('irb-member'),
    card: {
      whatIDo:
        'I sit on the committee that protects the people in a trial. Before a study opens, and at every change, we review the protocol and the [[informed-consent|consent form]] and ask one question: is this fair and safe for the person who signs?',
      responsibilities: [
        'Review protocols and consent forms before a study starts',
        'Weigh risks against benefits for participants',
        'Check that consent language is honest and understandable',
        'Review amendments, safety reports and deviations',
        'Approve, request changes, or reject',
      ],
      skills: ['Ethics', 'Reading science critically', 'Plain-language judgement', 'Independence'],
      background:
        'A mix of scientists, doctors, lawyers and community members. In the US the body is called an [[irb|IRB]]; in Europe, an ethics committee.',
      receivesFrom: ['regulatory-affairs-specialist', 'principal-investigator'],
      handsOffTo: ['portfolio-lead', 'site-startup-specialist', 'principal-investigator'],
      documents: ['Consent form', 'Protocol', 'Approval letter', 'Continuing review reports'],
      funFact:
        'US rules require at least one committee member who is not a scientist and one with no ties to the institution, so the review never becomes scientists approving each other.',
    },
  },
  {
    ...ref('portfolio-lead'),
    card: {
      whatIDo:
        'I decide which programmes get money and when. I weigh VX-101 against every other project, set the budget and the milestones, and make the [[go-no-go|go / no-go]] call when the data come in. Most programmes I fund will fail. My job is to fail cheaply.',
      responsibilities: [
        'Build and defend the programme budget',
        'Run go / no-go reviews at each milestone',
        'Balance risk across the whole pipeline',
        'Model timelines, costs and probability of success',
        'Report to the executive team and investors',
      ],
      skills: [
        'Finance and valuation',
        'Decision analysis',
        'Understanding of drug development',
        'Saying no',
      ],
      background:
        'Often an MBA or finance background paired with scientists; sits in R&D strategy or portfolio management.',
      receivesFrom: ['irb-member', 'regulatory-affairs-specialist'],
      handsOffTo: ['clinical-project-manager', 'manufacturing-supply-lead'],
      documents: [
        'Programme budget',
        'Stage-gate review pack',
        'Probability of success model',
        'Portfolio dashboard',
      ],
      funFact:
        'Because roughly 9 in 10 programmes entering human trials never reach approval, a portfolio is priced as a set of options, not as a list of products.',
    },
  },
];
