/**
 * Reader-paced time model shared by the validator, the content report and the docs:
 * 200 words per minute, 2.5 s per decision, one wrong turn per level, role card front in
 * full plus one third of the back, sandbox excluded. Pure.
 */
import type { Level, MiniGameConfig, Role } from './types';
import { plainText } from './richText';

export const WPM = 200;
export const DECISION_SECONDS = 2.5;
/** Badge swap, stage cards, reveal animation, transitions. */
export const FIXED_SECONDS = 12;

export const words = (s: string | undefined) => (s ? plainText(s).split(/\s+/).filter(Boolean).length : 0);
const sum = (list: (string | undefined)[]) => list.reduce((n, s) => n + words(s), 0);
const avg = (list: (string | undefined)[]) => (list.length ? sum(list) / list.length : 0);

export interface LevelEstimate {
  levelId: string;
  words: { card: number; intro: number; task: number; feedback: number; debrief: number; total: number };
  decisions: number;
  seconds: number;
}

/** Visible words a player reads in a stage plus the number of decisions it asks for. */
export function stageWords(game: MiniGameConfig): {
  visible: number;
  decisions: number;
  explanations: string[];
  consequences: string[];
} {
  switch (game.engine) {
    case 'bucket-sort':
      return {
        visible:
          words(game.prompt) +
          sum(game.buckets.flatMap((b) => [b.label, b.hint])) +
          sum(game.cards.map((c) => c.text)),
        decisions: game.cards.length,
        explanations: game.cards.map((c) => c.explanation),
        consequences: game.cards.map((c) => c.consequence),
      };
    case 'builder':
      return {
        visible:
          words(game.prompt) +
          sum(game.slots.flatMap((s) => [s.label, s.hint])) +
          sum(game.parts.map((p) => p.text)),
        decisions: game.slots.length + 1,
        explanations: game.parts.map((p) => p.explanation),
        consequences: game.parts.map((p) => p.consequence),
      };
    case 'branching-scenario': {
      // A player sees one path: count the average node plus its choices, times the depth of the longest path.
      const nodes = game.nodes.filter((n) => n.choices?.length);
      const perNode =
        avg(nodes.map((n) => n.text)) + avg(nodes.map((n) => (n.choices ?? []).map((c) => c.text).join(' ')));
      const ends = game.nodes.filter((n) => n.end);
      const depth = longestPath(game.start, game);
      return {
        visible:
          Math.round(perNode * depth) + Math.round(avg(ends.map((e) => `${e.text} ${e.end?.summary ?? ''}`))),
        decisions: depth,
        explanations: nodes.flatMap((n) => (n.choices ?? []).map((c) => c.explanation)),
        consequences: nodes.flatMap((n) => (n.choices ?? []).map((c) => c.consequence)),
      };
    }
    case 'spot-the-impostor':
      return {
        visible:
          words(game.prompt) +
          sum(game.cards.map((c) => `${c.title} ${c.lines.join(' ')}`)) +
          words(game.signOff?.label),
        decisions: game.cards.length + 1,
        explanations: game.cards.map((c) => c.explanation),
        consequences: game.cards.map((c) => c.consequence),
      };
    case 'allocator':
      return {
        visible:
          words(game.prompt) +
          sum(game.context ?? []) +
          sum(game.categories.map((c) => c.label)) +
          sum((game.presets ?? []).map((p) => p.label)) +
          sum((game.simulation?.bands ?? []).slice(0, 1).map((b) => b.narration)),
        decisions: game.categories.length + 1,
        explanations: game.categories.map((c) => c.explanation),
        consequences: game.categories.map((c) => c.consequence),
      };
    case 'sequence-sort':
      return {
        visible: words(game.prompt) + sum(game.items.map((i) => i.text)),
        decisions: game.items.length,
        explanations: game.items.map((i) => i.explanation),
        consequences: game.items.map((i) => i.consequence),
      };
    case 'match-pairs':
      return {
        visible: words(game.prompt) + sum(game.pairs.flatMap((p) => [p.left, p.right])),
        decisions: game.pairs.length,
        explanations: game.pairs.map((p) => p.explanation),
        consequences: game.pairs.map((p) => p.consequence),
      };
    case 'dash-manager':
      return {
        visible:
          words(game.prompt) + sum(game.stations.map((s) => s.label)) + sum(game.items.map((i) => i.label)),
        decisions: game.items.reduce((n, i) => n + i.steps.length, 0),
        explanations: game.items.map((i) => i.explanation),
        consequences: game.items.map((i) => i.consequence),
      };
    case 'quiz-blitz':
      return {
        visible: sum(game.questions.flatMap((q) => [q.prompt, ...q.options.map((o) => o.text)])),
        decisions: game.questions.length,
        explanations: game.questions.map((q) => q.explanation),
        consequences: game.questions.map((q) => q.consequence),
      };
  }
}

function longestPath(start: string, game: Extract<MiniGameConfig, { engine: 'branching-scenario' }>): number {
  const memo = new Map<string, number>();
  const visit = (id: string, seen: Set<string>): number => {
    if (memo.has(id)) return memo.get(id)!;
    const node = game.nodes.find((n) => n.id === id);
    if (!node || !node.choices?.length || seen.has(id)) return 0;
    const next = new Set(seen).add(id);
    const d = 1 + Math.max(0, ...node.choices.map((c) => visit(c.next, next)));
    memo.set(id, d);
    return d;
  };
  return visit(start, new Set());
}

export function cardWords(role: Role | undefined): number {
  if (!role) return 0;
  const front =
    words(role.title) +
    words(role.card.whatIDo) +
    role.card.receivesFrom.length * 2 +
    role.card.handsOffTo.length * 2 +
    6;
  const back = sum([
    ...role.card.responsibilities,
    ...role.card.skills,
    ...role.card.documents,
    role.card.funFact,
    role.card.background,
  ]);
  return front + Math.round(back / 3);
}

/** Card front words only (the budget the validator checks). */
export function cardFrontWords(role: Role): number {
  return (
    words(role.title) +
    words(role.card.whatIDo) +
    role.card.receivesFrom.length * 2 +
    role.card.handsOffTo.length * 2
  );
}

export function estimateLevel(level: Level, role: Role | undefined): LevelEstimate {
  const stages = level.stages.map((s) => ({ brief: words(s.title) + words(s.brief), ...stageWords(s.game) }));
  const task = stages.reduce((n, s) => n + s.brief + s.visible, 0);
  const decisions = stages.reduce((n, s) => n + s.decisions, 0);
  // One wrong turn per level: one explanation inline, one consequence in the debrief.
  const feedback =
    Math.round(avg(stages.flatMap((s) => s.explanations))) +
    Math.round(avg(stages.flatMap((s) => s.consequences)));
  const debrief = words(level.debrief.learned) + words(level.debrief.handoffLine) + 20; // stars, XP lines, artifact card
  const card = cardWords(role);
  const intro = words(level.intro);
  const total = card + intro + task + feedback + debrief;
  const seconds = Math.round((total / WPM) * 60 + decisions * DECISION_SECONDS + FIXED_SECONDS);
  return { levelId: level.id, words: { card, intro, task, feedback, debrief, total }, decisions, seconds };
}

export const BUDGETS = {
  levelIntro: 40,
  cardText: 18,
  explanation: 25,
  consequence: 20,
  confirm: 12,
  scenarioNode: 45,
  choice: 16,
  debriefLearned: 40,
  cardFront: 60,
  levelSeconds: 210,
  crisisPoolSeconds: 120,
  firstInteractionSeconds: 45,
  worldSeconds: 720,
} as const;
