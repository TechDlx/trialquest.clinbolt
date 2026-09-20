import type { ReviewNode, StoryBeat } from '../../types';

export const w6Intro: StoryBeat = {
  id: 'w6-intro',
  title: 'Thousands of Mayas',
  paragraphs: [
    'A signal in 200 people is a hope. Proof takes 1,200 patients in 40 countries, followed for a year, against placebo, with a committee watching the unblinded data that nobody else may see.',
    'Phase III is the largest, slowest and most expensive thing a company does. It exists to answer one question so clearly that a regulator will accept it.',
    "Maya's Phase II visits are over. She has rolled into the long-term extension. She still does not know which arm she was in.",
  ],
  mayaStatus: 'In the extension study. Still blinded.',
};

export const w6Outro: StoryBeat = {
  id: 'w6-outro',
  title: 'The reveal',
  paragraphs: [
    'The database locks. The codes are released. The primary analysis runs exactly as it was written three years ago.',
    'VX-101 worked: 21 more fatigue-free days a year than placebo, with liver enzyme rises that will need a warning. The report says so, in proportion, with every number traceable to a table.',
    'And Maya, Participant 0417, who thought she felt better: she was on placebo. The whole time.',
  ],
  mayaStatus: 'Unblinded. She was on placebo. She laughed, then cried.',
};

export const w6Reviews: ReviewNode[] = [
  { id: 'w6-r1', worldId: 'w6', title: 'Review: Running at scale' },
  { id: 'w6-r2', worldId: 'w6', title: 'Review: Lock, program, write' },
];
