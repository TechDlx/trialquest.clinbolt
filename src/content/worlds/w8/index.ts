import type { ReviewNode, StoryBeat } from '../../types';
export { w8Roles } from './roles';
export { w8Levels } from './levels';
export { w8Crisis } from './crisis';

export const w8Intro: StoryBeat = {
  id: 'w8-intro',
  title: 'Launch day',
  paragraphs: [
    'Approval is a piece of paper. A medicine is a million capsules, a price someone will pay, a campaign that tells the truth, and a safety team that never stops watching.',
    'World 8 is where VX-101 meets forty thousand patients instead of a thousand, and where every shortcut taken in the last seven worlds finally sends its bill.',
    'Maya picked up her first prescription this morning. Her pharmacist pointed at the boxed warning and booked her liver test.',
  ],
  mayaStatus: 'On VX-101. First liver test booked.',
};

export const w8Outro: StoryBeat = {
  id: 'w8-outro',
  title: "Maya's medicine",
  paragraphs: [
    "Month six. Maya's liver tests are normal. She has had more good days this spring than in the three years before it. The pancreatitis signal is confirmed, the label is updated, and the post-approval study is enrolling.",
    'Forty-four jobs. Ten years. One capsule every morning, made the same way every time, with a warning on the box that a doctor will read.',
    'That is what it takes. You did all of it.',
  ],
  mayaStatus: 'Treated. Monitored. Having a good spring.',
};

export const w8Review: ReviewNode = {
  id: 'w8-r1',
  worldId: 'w8',
  title: 'Review: On the market',
};
