import type { ReviewNode, StoryBeat } from '../../types';
export { w7Roles } from './roles';
export { w7Levels } from './levels';
export { w7Crisis } from './crisis';

export const w7Intro: StoryBeat = {
  id: 'w7-intro',
  title: 'The dossier',
  paragraphs: [
    'Ten years, three phases, thousands of patients, one answer. Now it has to be written down so completely that a stranger with no reason to trust you can check every claim.',
    "The application is assembled, published, submitted, reviewed, inspected and negotiated. For most of this world you are on the company's side. For one level, you are not.",
    'Maya knows she was on placebo. She has written a letter.',
  ],
  mayaStatus: 'Wrote to the regulator. Waiting for a decision.',
};

export const w7Outro: StoryBeat = {
  id: 'w7-outro',
  title: 'Approved',
  paragraphs: [
    'The letter arrives on a Thursday. VX-101 is approved for adults with Veridian Syndrome, with a boxed liver warning, a contraindication and monthly monitoring for six months.',
    'It is not a cure. It is 21 more good days a year, for people who had none, with a risk that is written down where every doctor will see it.',
    "Maya's specialist calls her that afternoon.",
  ],
  mayaStatus: 'Approved. Her doctor called.',
};

export const w7Review: ReviewNode = {
  id: 'w7-r1',
  worldId: 'w7',
  title: 'Review: Submission',
};
