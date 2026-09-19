import type { BossQuiz } from '../../types';

export const w1Boss: BossQuiz = {
  id: 'w1-boss',
  worldId: 'w1',
  title: 'World 1 Boss: From need to molecule',
  secondsPerQuestion: 15,
  questions: [
    {
      id: 'w1-boss-q1',
      roleId: 'patient-advocate',
      conceptId: 'unmet-need',
      prompt: 'Put simply, why do new medicines get developed?',
      options: [
        { text: 'Because patients have an unmet medical need', correct: true },
        { text: 'Because labs have spare robots' },
        { text: 'Because regulators require one per year' },
        { text: 'Because old medicines expire' },
      ],
      explanation: 'An unmet need is the reason the whole relay race starts.',
      consequence: 'Development without a real need behind it produces medicines nobody uses.',
    },
    {
      id: 'w1-boss-q2',
      roleId: 'discovery-scientist',
      conceptId: 'lead-compound',
      prompt: 'Which is the correct order in discovery?',
      options: [
        { text: 'Target → Hit → Lead → Candidate', correct: true },
        { text: 'Lead → Hit → Target → Candidate' },
        { text: 'Hit → Target → Candidate → Lead' },
        { text: 'Candidate → Target → Hit → Lead' },
      ],
      explanation:
        'Pick a target, screen to find hits, improve the best hit into a lead, nominate a candidate for development.',
      consequence: 'Skipping steps means moving forward with a molecule nobody has tuned for safety.',
    },
    {
      id: 'w1-boss-q3',
      roleId: 'discovery-scientist',
      conceptId: 'in-vivo',
      prompt: '"In vivo" means…',
      options: [
        { text: 'In a living organism', correct: true },
        { text: 'In a test tube' },
        { text: 'In a computer model' },
        { text: 'In a hospital pharmacy' },
      ],
      explanation:
        'In vivo is a living body (usually animals before humans). In vitro is a dish. In silico is a computer.',
      consequence: 'Confusing dish results with body results leads to over-confident claims.',
    },
    {
      id: 'w1-boss-q4',
      roleId: 'cmc-scientist',
      conceptId: 'gmp',
      prompt: 'Which set of rules covers making the drug product?',
      options: [
        { text: 'GMP: Good Manufacturing Practice', correct: true },
        { text: 'GLP: Good Laboratory Practice' },
        { text: 'GCP: Good Clinical Practice' },
        { text: 'GVP: Good Vigilance Practice' },
      ],
      explanation:
        'GMP is manufacturing. GLP is preclinical labs. GCP is human trials. GVP is safety monitoring after approval.',
      consequence: 'Drug made outside GMP cannot be given to people.',
    },
    {
      id: 'w1-boss-q5',
      roleId: 'preclinical-toxicologist',
      conceptId: 'noael',
      prompt: 'NOAEL means…',
      options: [
        { text: 'The highest dose that caused no harmful effect in animal studies', correct: true },
        { text: 'The lowest dose that caused death' },
        { text: 'The dose that works best in humans' },
        { text: 'The dose written on the pharmacy label' },
      ],
      explanation: 'No Observed Adverse Effect Level. It is the anchor for the first human dose.',
      consequence: 'A wrong NOAEL can put volunteers in danger on day one.',
    },
    {
      id: 'w1-boss-q6',
      roleId: 'preclinical-toxicologist',
      conceptId: 'starting-dose',
      prompt: 'Why divide the human equivalent dose by a safety factor before the first human trial?',
      options: [
        { text: 'Humans may be more sensitive than animals, so start lower', correct: true },
        { text: 'To save money on drug supply' },
        { text: 'Because regulators like round numbers' },
        { text: 'So the drug works faster' },
      ],
      explanation: 'The safety factor (usually 10 or more) protects the first volunteers from surprises.',
      consequence: 'First-in-human disasters have happened when starting doses were set too high.',
    },
    {
      id: 'w1-boss-q7',
      roleId: 'cmc-scientist',
      conceptId: 'excipient',
      prompt: 'Which of these is an excipient?',
      options: [
        { text: 'Lactose used as a filler in a tablet', correct: true },
        { text: 'The molecule that blocks VRD-1' },
        { text: 'The disease target' },
        { text: 'The trial sponsor' },
      ],
      explanation: 'Excipients are the inactive ingredients: fillers, binders, coatings, preservatives.',
      consequence: 'Patients with allergies (e.g. to lactose) need excipients listed accurately.',
    },
    {
      id: 'w1-boss-q8',
      roleId: 'patient-advocate',
      conceptId: 'development-timeline',
      prompt: 'Roughly how long does it typically take from discovery to an approved medicine?',
      options: [
        { text: '10 to 15 years', correct: true },
        { text: '6 months' },
        { text: '2 years' },
        { text: '50 years' },
      ],
      explanation:
        'Discovery, preclinical work, three trial phases and regulatory review add up to over a decade for most drugs.',
      consequence: 'Patients like Maya wait years. Every avoidable delay in the relay matters.',
    },
  ],
};
