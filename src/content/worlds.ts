import type { MapNode, StoryBeat, World, WorldId } from './types';
import { roleIndex } from './roleIndex';
import { w1Intro, w1Outro } from './worlds/w1';

function levelNodes(worldId: WorldId): MapNode[] {
  return roleIndex
    .filter((r) => r.worldId === worldId)
    .map((r, i) => ({ kind: 'level', id: `${worldId}-l${i + 1}`, roleId: r.id }));
}

function withReviews(worldId: WorldId, levels: MapNode[], after: number[]): MapNode[] {
  const out: MapNode[] = [];
  levels.forEach((n, i) => {
    out.push(n);
    const idx = after.indexOf(i + 1);
    if (idx >= 0) out.push({ kind: 'review', id: `${worldId}-r${idx + 1}` });
  });
  return out;
}

const planned = (id: string, title: string, mayaStatus: string): StoryBeat => ({
  id,
  title,
  paragraphs: ['This chapter is coming soon.'],
  mayaStatus,
});

const world = (
  id: WorldId,
  number: number,
  title: string,
  subtitle: string,
  reviewsAfter: number[],
  timerScale: number,
  beats: { intro: StoryBeat; outro: StoryBeat },
  status: World['status'] = 'planned',
): World => ({
  id,
  number,
  title,
  subtitle,
  status,
  intro: beats.intro,
  outro: beats.outro,
  nodes: [
    ...withReviews(id, levelNodes(id), reviewsAfter),
    { kind: 'crisis', id: `${id}-crisis` },
    ...(id === 'w8' ? [{ kind: 'finale', id: 'finale' } as MapNode] : []),
  ],
  timerScale,
  firstMistakeFree: id === 'w1',
});

export const worlds: World[] = [
  world(
    'w1',
    1,
    'Diagnosis & Discovery',
    'From a patient to a molecule',
    [4],
    1.4,
    { intro: w1Intro, outro: w1Outro },
    'ready',
  ),
  world('w2', 2, 'Designing the Trial', 'Protocol, statistics, ethics, budget', [5], 1.2, {
    intro: planned('w2-intro', 'On paper first', 'Waiting for a trial to exist.'),
    outro: planned('w2-outro', 'Permission to begin', 'Waiting for a trial to open.'),
  }),
  world('w3', 3, 'Study Start-Up', 'Sites, supplies, systems', [4, 7], 1.0, {
    intro: planned('w3-intro', 'Building the machine', 'Waiting for a site near her.'),
    outro: planned('w3-outro', 'Ready to dose', 'Waiting for a site near her.'),
  }),
  world('w4', 4, 'Phase I', 'Is it safe?', [4], 1.0, {
    intro: planned('w4-intro', 'First in human', 'Reading about the Phase I study.'),
    outro: planned('w4-outro', 'A safe range', 'Reading about the Phase I study.'),
  }),
  world('w5', 5, 'Phase II', 'Does it work? What dose?', [5], 0.9, {
    intro: planned('w5-intro', 'Maya enrols', 'Enrolled. Blinded.'),
    outro: planned('w5-outro', 'A signal', 'Enrolled. Blinded.'),
  }),
  world('w6', 6, 'Phase III', 'Prove it at scale', [4, 7], 0.9, {
    intro: planned('w6-intro', 'Thousands of Mayas', 'Completed her study visits.'),
    outro: planned('w6-outro', 'The reveal', 'Completed her study visits.'),
  }),
  world('w7', 7, 'Submission & Approval', 'Convince the regulator', [5], 0.85, {
    intro: planned('w7-intro', 'The dossier', 'Waiting for a decision.'),
    outro: planned('w7-outro', 'Approved', 'Waiting for a decision.'),
  }),
  world('w8', 8, 'Launch & Beyond', 'Market, safety, real-world evidence', [7], 0.85, {
    intro: planned('w8-intro', 'Launch day', 'Waiting for a prescription.'),
    outro: planned('w8-outro', "Maya's medicine", 'Treated.'),
  }),
];

export const worldById: Record<string, World> = Object.fromEntries(worlds.map((w) => [w.id, w]));
