import type { ReviewNode, StoryBeat } from '../../types';
export { w1Roles } from './roles';
export { w1Levels } from './levels';
export { w1Boss } from './boss';

export const w1Intro: StoryBeat = {
  id: 'w1-intro',
  title: 'A name for it',
  paragraphs: [
    'Maya is 29. For two years she has had joint pain, crushing fatigue and strange rashes that come and go. Doctors kept guessing.',
    'Today a specialist gives it a name: Veridian Syndrome. It is [[rare-disease|rare]], it is real, and there is no approved treatment.',
    'This is where every medicine starts: with a person who needs one. Your job is to be every person it takes to get her one.',
  ],
  mayaStatus: 'Diagnosed. No treatment yet.',
};

export const w1Outro: StoryBeat = {
  id: 'w1-outro',
  title: 'Most molecules never leave this room',
  paragraphs: [
    'Your lab found VX-101. It blocks VRD-1 in a dish and looks safe in animals at the doses tested. It is now a stable capsule with a batch record.',
    'Enjoy the moment. Of every 5,000 compounds screened, only a handful reach this point, and only about [[attrition|1 in 10]] of those will ever be approved.',
    'Next, someone has to design a study that could prove VX-101 works in people. Maya is waiting.',
  ],
  mayaStatus: 'Following the research news. Hopeful.',
};

export const w1Review: ReviewNode = {
  id: 'w1-r1',
  worldId: 'w1',
  title: 'Review: Discovery basics',
};
