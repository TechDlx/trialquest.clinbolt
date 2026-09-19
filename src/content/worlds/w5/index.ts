import type { ReviewNode, StoryBeat } from '../../types';
export { w5Roles } from './roles';
export { w5Levels } from './levels';
export { w5Crisis } from './crisis';

export const w5Intro: StoryBeat = {
  id: 'w5-intro',
  title: 'Maya enrols',
  paragraphs: [
    "The Phase II study opens to patients. Maya's specialist mentions it at her next visit. Two hundred people with Veridian Syndrome, randomized to VX-101 or placebo, for a year.",
    'She reads the consent form twice. It says she may get placebo. It says nobody, not even her doctor, will know which. She signs.',
    'From here on, she is Participant 0417. You will see that number. You will not be told it is her until afterwards.',
  ],
  mayaStatus: 'Enrolled. Blinded. Participant 0417.',
};

export const w5Outro: StoryBeat = {
  id: 'w5-outro',
  title: 'A signal',
  paragraphs: [
    'The data are clean, the events are coded, the safety reports went out on time. When the blinded summary reaches the committee, there is something in it: fewer fatigue days in one arm, and a dose that separates from the others.',
    'Nobody knows which arm Maya is in. She thinks she feels better. So do half the people on placebo.',
    'A signal is not proof. Proof needs thousands.',
  ],
  mayaStatus: 'Finished her Phase II visits. Thinks she feels better.',
};

export const w5Review: ReviewNode = {
  id: 'w5-r1',
  worldId: 'w5',
  title: 'Review: Running the study',
};
