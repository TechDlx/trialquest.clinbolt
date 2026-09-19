import type { MapNode, StoryBeat, World, WorldId } from './types';
import { roleIndex } from './roleIndex';
import { w1Intro, w1Outro } from './worlds/w1';
import { w2Intro, w2Outro } from './worlds/w2';
import { w3Intro, w3Outro } from './worlds/w3';
import { w4Intro, w4Outro } from './worlds/w4';
import { w5Intro, w5Outro } from './worlds/w5';
import { w6Intro, w6Outro } from './worlds/w6';
import { w7Intro, w7Outro } from './worlds/w7';
import { w8Intro, w8Outro } from './worlds/w8';

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
  world(
    'w2',
    2,
    'Designing the Trial',
    'Protocol, statistics, ethics, budget',
    [5],
    1.2,
    { intro: w2Intro, outro: w2Outro },
    'ready',
  ),
  world(
    'w3',
    3,
    'Study Start-Up',
    'Sites, supplies, systems',
    [4, 7],
    1.0,
    { intro: w3Intro, outro: w3Outro },
    'ready',
  ),
  world('w4', 4, 'Phase I', 'Is it safe?', [4], 1.0, { intro: w4Intro, outro: w4Outro }, 'ready'),
  world(
    'w5',
    5,
    'Phase II',
    'Does it work? What dose?',
    [5],
    0.9,
    { intro: w5Intro, outro: w5Outro },
    'ready',
  ),
  world('w6', 6, 'Phase III', 'Prove it at scale', [4, 7], 0.9, { intro: w6Intro, outro: w6Outro }, 'ready'),
  world(
    'w7',
    7,
    'Submission & Approval',
    'Convince the regulator',
    [5],
    0.85,
    { intro: w7Intro, outro: w7Outro },
    'ready',
  ),
  world(
    'w8',
    8,
    'Launch & Beyond',
    'Market, safety, real-world evidence',
    [7],
    0.85,
    { intro: w8Intro, outro: w8Outro },
    'ready',
  ),
];

export const worldById: Record<string, World> = Object.fromEntries(worlds.map((w) => [w.id, w]));
