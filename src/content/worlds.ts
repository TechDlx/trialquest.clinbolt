import type { MapNode, StoryBeat, World, WorldId } from './types';
import { roleIndex } from './roleIndex';
import { w1Intro, w1Outro } from './worlds/w1';

/** Builds level nodes for a world from the role index, in order. */
function levelNodes(worldId: WorldId): MapNode[] {
  return roleIndex
    .filter((r) => r.worldId === worldId)
    .map((r, i) => ({ kind: 'level', id: `${worldId}-l${i + 1}`, roleId: r.id }));
}

/** Inserts review nodes after the given level indexes (1-based). */
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

export const worlds: World[] = [
  {
    id: 'w1',
    number: 1,
    title: 'Diagnosis & Discovery',
    subtitle: 'From a patient to a molecule',
    status: 'ready',
    intro: w1Intro,
    outro: w1Outro,
    nodes: [...withReviews('w1', levelNodes('w1'), [4]), { kind: 'boss', id: 'w1-boss' }],
    timerScale: 1.4,
    firstMistakeFree: true,
  },
  {
    id: 'w2',
    number: 2,
    title: 'Designing the Trial',
    subtitle: 'Protocol, statistics, ethics, budget',
    status: 'planned',
    intro: planned('w2-intro', 'On paper first', 'Waiting for a trial to exist.'),
    outro: planned('w2-outro', 'Permission to begin', 'Waiting for a trial to open.'),
    nodes: [...withReviews('w2', levelNodes('w2'), [5]), { kind: 'boss', id: 'w2-boss' }],
    timerScale: 1.2,
    firstMistakeFree: false,
  },
  {
    id: 'w3',
    number: 3,
    title: 'Study Start-Up',
    subtitle: 'Sites, supplies, systems',
    status: 'planned',
    intro: planned('w3-intro', 'Building the machine', 'Waiting for a site near her.'),
    outro: planned('w3-outro', 'Ready to dose', 'Waiting for a site near her.'),
    nodes: [...withReviews('w3', levelNodes('w3'), [4, 7]), { kind: 'boss', id: 'w3-boss' }],
    timerScale: 1.0,
    firstMistakeFree: false,
  },
  {
    id: 'w4',
    number: 4,
    title: 'Phase I',
    subtitle: 'Is it safe?',
    status: 'planned',
    intro: planned('w4-intro', 'First in human', 'Reading about the Phase I study.'),
    outro: planned('w4-outro', 'A safe range', 'Reading about the Phase I study.'),
    nodes: [...withReviews('w4', levelNodes('w4'), [4]), { kind: 'boss', id: 'w4-boss' }],
    timerScale: 1.0,
    firstMistakeFree: false,
  },
  {
    id: 'w5',
    number: 5,
    title: 'Phase II',
    subtitle: 'Does it work? What dose?',
    status: 'planned',
    intro: planned('w5-intro', 'Maya enrols', 'Enrolled. Blinded.'),
    outro: planned('w5-outro', 'A signal', 'Enrolled. Blinded.'),
    nodes: [...withReviews('w5', levelNodes('w5'), [5]), { kind: 'boss', id: 'w5-boss' }],
    timerScale: 0.9,
    firstMistakeFree: false,
  },
  {
    id: 'w6',
    number: 6,
    title: 'Phase III',
    subtitle: 'Prove it at scale',
    status: 'planned',
    intro: planned('w6-intro', 'Thousands of Mayas', 'Completed her study visits.'),
    outro: planned('w6-outro', 'The reveal', 'Completed her study visits.'),
    nodes: [...withReviews('w6', levelNodes('w6'), [4, 7]), { kind: 'boss', id: 'w6-boss' }],
    timerScale: 0.9,
    firstMistakeFree: false,
  },
  {
    id: 'w7',
    number: 7,
    title: 'Submission & Approval',
    subtitle: 'Convince the regulator',
    status: 'planned',
    intro: planned('w7-intro', 'The dossier', 'Waiting for a decision.'),
    outro: planned('w7-outro', 'Approved', 'Waiting for a decision.'),
    nodes: [...withReviews('w7', levelNodes('w7'), [5]), { kind: 'boss', id: 'w7-boss' }],
    timerScale: 0.85,
    firstMistakeFree: false,
  },
  {
    id: 'w8',
    number: 8,
    title: 'Launch & Beyond',
    subtitle: 'Market, safety, real-world evidence',
    status: 'planned',
    intro: planned('w8-intro', 'Launch day', 'Waiting for a prescription.'),
    outro: planned('w8-outro', "Maya's medicine", 'Treated.'),
    nodes: [
      ...withReviews('w8', levelNodes('w8'), [7]),
      { kind: 'boss', id: 'w8-boss' },
      { kind: 'finale', id: 'finale' },
    ],
    timerScale: 0.85,
    firstMistakeFree: false,
  },
];

export const worldById: Record<string, World> = Object.fromEntries(worlds.map((w) => [w.id, w]));
