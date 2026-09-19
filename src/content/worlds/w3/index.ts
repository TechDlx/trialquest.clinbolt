import type { ReviewNode, StoryBeat } from '../../types';
export { w3Roles } from './roles';
export { w3Levels } from './levels';
export { w3Crisis } from './crisis';

export const w3Intro: StoryBeat = {
  id: 'w3-intro',
  title: 'Building the machine',
  paragraphs: [
    'A trial on paper is a promise. A trial in the world is hospitals, contracts, freezers, databases and people who know what to do on a Tuesday afternoon when a shipment goes missing.',
    'World 3 is the part nobody films. It is also where most trials lose their first six months.',
    "Maya's clinic is not on the site list. She checked.",
  ],
  mayaStatus: 'Looking for a site near her. None yet.',
};

export const w3Outro: StoryBeat = {
  id: 'w3-outro',
  title: 'Ready to dose',
  paragraphs: [
    'Sites are open. Drug sits on their shelves, blinded and logged. The database is live and validated, the randomization system is waiting for its first patient, and the file that proves all of it is complete.',
    'Nobody has been dosed. Tomorrow, someone will be.',
  ],
  mayaStatus: 'Found a site two hours away. Phase I is not for her, yet.',
};

export const w3Reviews: ReviewNode[] = [
  { id: 'w3-r1', worldId: 'w3', title: 'Review: Sites and supplies' },
  { id: 'w3-r2', worldId: 'w3', title: 'Review: Systems and files' },
];
