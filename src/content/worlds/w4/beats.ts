import type { ReviewNode, StoryBeat } from '../../types';

export const w4Intro: StoryBeat = {
  id: 'w4-intro',
  title: 'First in human',
  paragraphs: [
    'Tomorrow a healthy volunteer will swallow a capsule of VX-101 for the first time. He does not have Veridian Syndrome. He is here for the science, the payment, and because someone has to be first.',
    'Phase I asks one question: is it safe enough to keep going? Small groups, rising doses, blood drawn on the clock, and a committee that decides after every step.',
    'Maya is reading the trial registry entry. "Healthy volunteers only." Not yet.',
  ],
  mayaStatus: 'Reading about the Phase I study. Not eligible.',
};

export const w4Outro: StoryBeat = {
  id: 'w4-outro',
  title: 'A safe range',
  paragraphs: [
    'The hold is lifted. The escalation ends with a dose range the committee can defend: measurable exposure, manageable side effects, a liver that is watched at every visit.',
    'Most molecules that reach this point still fail. But VX-101 now has something it did not have before: a dose a patient could be given.',
  ],
  mayaStatus: 'Heard the Phase I finished. Her doctor mentioned a Phase II.',
};

export const w4Review: ReviewNode = {
  id: 'w4-r1',
  worldId: 'w4',
  title: 'Review: First in human',
};
