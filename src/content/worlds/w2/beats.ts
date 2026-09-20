import type { ReviewNode, StoryBeat } from '../../types';

export const w2Intro: StoryBeat = {
  id: 'w2-intro',
  title: 'On paper first',
  paragraphs: [
    'VX-101 is a capsule in a bottle and a stack of animal data. Before it can meet a single person, someone has to write down exactly what the study will ask, measure and protect.',
    'A trial is designed twice: once by the scientists who want it to work, and once by the people whose job is to make sure the answer can be trusted even if it does not.',
    'Maya is reading everything she can find about Phase I studies. She will not be in this one. She is watching anyway.',
  ],
  mayaStatus: 'Following the science. Not yet eligible.',
};

export const w2Outro: StoryBeat = {
  id: 'w2-outro',
  title: 'Permission to begin',
  paragraphs: [
    'The protocol exists. The statistics are fixed. The ethics committee has a consent form it can live with, and the regulator has not objected. The budget is signed.',
    'None of this is a medicine yet. It is permission to find out. Somewhere a clinical site needs to be found, a database built, and a freezer plugged in.',
  ],
  mayaStatus: 'Heard the trial was approved. Asked her doctor about it.',
};

export const w2Review: ReviewNode = {
  id: 'w2-r1',
  worldId: 'w2',
  title: 'Review: Trial design',
};
