/**
 * Content validator. Pure: takes the content registry, returns issues.
 * Every issue names the file, the id, what is wrong in plain language, and a suggested fix.
 * Run via `npm run validate:content` (content.validate.test.ts fails the build on any 'fail').
 */
import { artifactRegistry, isArtifactKey } from './artifacts';
import { economy } from './economy';
import { extractInterpolations, extractTermIds } from './richText';
import type {
  AllocatorConfig,
  BranchingConfig,
  CrisisBoss,
  Level,
  MiniGameConfig,
  OutcomeRule,
  QuizQuestion,
  Shortcut,
  Stage,
  World,
} from './types';
import type { Content } from './index';
import { engineRegistry, getCollection, shortcutCarriers, type RuleField } from '@/engine/registry';
import {
  buildLevel,
  consumedKeys,
  enumerateAssignments,
  PatchError,
  applyStagePatch,
} from '@/engine/variants';
import { BUDGETS, cardFrontWords, estimateLevel, words } from './estimate';

export interface Issue {
  severity: 'fail' | 'warn' | 'info';
  file: string;
  id: string;
  message: string;
  fix: string;
}

const EPS = 1e-9;
const worldOf = (id: string) => id.split('-')[0] ?? 'w?';
const levelFile = (levelId: string) => `src/content/worlds/${worldOf(levelId)}/levels.ts`;
const crisisFile = (id: string) => `src/content/worlds/${worldOf(id)}/crisis.ts`;

export function formatIssue(i: Issue): string {
  return `[${i.severity.toUpperCase()}] ${i.file} · ${i.id}\n  ${i.message}\n  Fix: ${i.fix}`;
}

export function validateContent(c: Content): Issue[] {
  const issues: Issue[] = [];
  const fail = (file: string, id: string, message: string, fix: string) =>
    issues.push({ severity: 'fail', file, id, message, fix });
  const warn = (file: string, id: string, message: string, fix: string) =>
    issues.push({ severity: 'warn', file, id, message, fix });

  // ---------------------------------------------------------------- roles & worlds
  const roleIds = c.roleIndex.map((r) => r.id);
  if (new Set(roleIds).size !== roleIds.length)
    fail(
      'src/content/roleIndex.ts',
      'roleIndex',
      'Role ids are not unique.',
      'Give every role a distinct id.',
    );
  if (roleIds.length !== 44)
    fail(
      'src/content/roleIndex.ts',
      'roleIndex',
      `Expected 44 roles, found ${roleIds.length}.`,
      'Check the role list against SPEC.md.',
    );
  for (const r of c.roleIndex)
    if (r.shortTitle.length > 20)
      fail(
        'src/content/roleIndex.ts',
        r.id,
        `shortTitle "${r.shortTitle}" is longer than 20 characters.`,
        'Shorten it so it fits on a badge.',
      );

  const nodeOrder: string[] = [];
  c.worlds.forEach((w, i) => {
    if (w.number !== i + 1)
      fail(
        'src/content/worlds.ts',
        w.id,
        `World number ${w.number} is out of order.`,
        'Worlds must be numbered 1 to 8 in order.',
      );
    const rolesInWorld = c.roleIndex.filter((r) => r.worldId === w.id).map((r) => r.id);
    const levelRoles = w.nodes.filter((n) => n.kind === 'level').map((n) => (n as { roleId: string }).roleId);
    if (JSON.stringify(levelRoles) !== JSON.stringify(rolesInWorld))
      fail(
        'src/content/worlds.ts',
        w.id,
        'Level nodes do not match the roles of this world, in order.',
        'Level nodes are generated from roleIndex; check role worldIds.',
      );
    const kinds = w.nodes.map((n) => n.kind);
    if (w.id === 'w8' ? kinds.slice(-2).join() !== 'crisis,finale' : kinds.at(-1) !== 'crisis')
      fail(
        'src/content/worlds.ts',
        w.id,
        'World must end with a crisis node (and the finale in world 8).',
        'Fix the node list.',
      );
    for (const n of w.nodes) nodeOrder.push(n.id);
  });
  if (new Set(nodeOrder).size !== nodeOrder.length)
    fail('src/content/worlds.ts', 'nodes', 'Node ids are not globally unique.', 'Rename the duplicate node.');
  const nodeIndex = (id: string) => nodeOrder.indexOf(id);

  for (const w of c.worlds.filter((x) => x.status === 'ready')) validateReadyWorld(c, w, fail, warn);

  for (const role of c.roles) {
    for (const id of [...role.card.receivesFrom, ...role.card.handsOffTo]) {
      if (!c.roleRefById[id])
        fail(
          `src/content/worlds/${role.worldId}/roles.ts`,
          role.id,
          `Hand-off references unknown role "${id}".`,
          'Use an id from roleIndex.ts.',
        );
      if (id === role.id)
        fail(
          `src/content/worlds/${role.worldId}/roles.ts`,
          role.id,
          'Role hands off to itself.',
          'Remove the self-reference.',
        );
    }
    if (role.id !== 'patient-advocate' && role.card.receivesFrom.length === 0)
      fail(
        `src/content/worlds/${role.worldId}/roles.ts`,
        role.id,
        'Role receives from nobody.',
        'Every role after the first receives from at least one role.',
      );
  }

  // ---------------------------------------------------------------- glossary & copy
  const termIds = c.glossary.map((t) => t.id);
  if (new Set(termIds).size !== termIds.length)
    fail('src/content/glossary.ts', 'glossary', 'Glossary ids are not unique.', 'Rename the duplicate term.');
  for (const t of c.glossary)
    if (t.short.length < 15 || t.short.length > 220)
      fail(
        'src/content/glossary.ts',
        t.id,
        'Short definition should be one sentence (15–220 characters).',
        'Rewrite `short`.',
      );

  const checkCopy = (file: string, id: string, value: unknown) => {
    for (const s of collectStrings(value)) {
      for (const term of extractTermIds(s))
        if (!c.glossaryById[term])
          fail(
            file,
            id,
            `Glossary link [[${term}]] points to a term that does not exist.`,
            `Add "${term}" to glossary.ts or fix the link.`,
          );
      for (const { key, field } of extractInterpolations(s)) {
        if (!isArtifactKey(key))
          fail(
            file,
            id,
            `{{${key}.${field}}} names an artifact that does not exist.`,
            'Use a key from src/content/artifacts.ts.',
          );
        else if (!(artifactRegistry[key] as { fields?: Record<string, unknown> }).fields?.[field])
          fail(
            file,
            id,
            `{{${key}.${field}}}: artifact "${key}" has no field "${field}".`,
            `Declare the field (with a fallback) under fields in artifacts.ts.`,
          );
      }
    }
  };
  for (const r of c.roles) checkCopy(`src/content/worlds/${r.worldId}/roles.ts`, r.id, r.card);
  for (const w of c.worlds.filter((x) => x.status === 'ready'))
    checkCopy('src/content/worlds.ts', w.id, [w.intro, w.outro]);
  for (const k of c.knowledge)
    checkCopy(`src/content/knowledge/${worldOf(k.id.replace('kc-', ''))}.ts`, k.id, k.questions);

  // ---------------------------------------------------------------- levels
  const emittedBy: Record<string, string> = {};
  for (const l of c.levels) for (const e of l.emits ?? []) emittedBy[e.key] = l.id;

  for (const level of c.levels) {
    const file = levelFile(level.id);
    const world = c.worldById[level.worldId];
    checkCopy(file, level.id, [level.intro, level.debrief, level.stages.map((s) => [s.brief, s.game])]);
    if (!level.debrief.learned || level.debrief.learned.length < 20)
      fail(
        file,
        level.id,
        'Debrief "learned" is missing or too short.',
        'Write two sentences of what the player learned.',
      );
    if (!level.debrief.handoffLine || level.debrief.handoffLine.length < 10)
      fail(file, level.id, 'Debrief hand-off line is missing.', 'Say who receives the work next.');
    if (!c.roleRefById[level.roleId])
      fail(file, level.id, `roleId "${level.roleId}" is not in roleIndex.`, 'Use a real role id.');
    budget(warn, file, level.id, 'intro', level.intro, BUDGETS.levelIntro);
    budget(warn, file, level.id, 'debrief.learned', level.debrief.learned, BUDGETS.debriefLearned);
    const est = estimateLevel(level, c.roleById[level.roleId]);
    const estMsg = `Estimated ${est.seconds} s at 200 wpm (${est.words.total} words, ${est.decisions} decisions)`;
    if (est.seconds > BUDGETS.levelSeconds)
      warn(file, level.id, `${estMsg}; budget is ${BUDGETS.levelSeconds} s.`, 'Trim copy or reduce items.');
    else issues.push({ severity: 'info', file, id: level.id, message: `${estMsg}.`, fix: '' });

    const stageIds = level.stages.map((s) => s.id);
    if (new Set(stageIds).size !== stageIds.length)
      fail(file, level.id, 'Stage ids repeat within the level.', 'Give each stage a unique id.');
    for (const s of level.stages) {
      if (typeof s.weight === 'number' && s.weight <= 0)
        fail(file, `${level.id}/${s.id}`, 'Stage weight must be positive.', 'Use 1 or more.');
      validateStage(file, `${level.id}/${s.id}`, s, fail, warn, c);
    }

    // shortcuts
    const carriers = level.stages.flatMap((s) => shortcutCarriers(s.game));
    if (carriers.length === 0 && !level.shortcutPrompt)
      warn(
        file,
        level.id,
        'Level offers no tempting shortcut.',
        'Add a shortcut to a bucket, part, choice, preset or station, or a level-level shortcutPrompt.',
      );
    const allShortcuts: { id: string; s: Shortcut }[] = [];
    for (const s of level.stages) {
      const g = s.game as unknown as Record<string, { id: string; shortcut?: Shortcut }[]>;
      for (const col of engineRegistry[s.game.engine].shortcutCarriers)
        for (const it of g[col] ?? []) if (it.shortcut) allShortcuts.push({ id: it.id, s: it.shortcut });
      if (s.game.engine === 'spot-the-impostor' && s.game.signOff)
        allShortcuts.push({ id: s.game.signOff.id, s: s.game.signOff.shortcut });
    }
    if (level.shortcutPrompt)
      allShortcuts.push({ id: level.shortcutPrompt.id, s: level.shortcutPrompt.accept });
    for (const { id, s } of allShortcuts) {
      const m = s.meters;
      if (!((m.timeline ?? 0) > 0) || !((m.safety ?? 0) < 0 || (m.integrity ?? 0) < 0))
        warn(
          file,
          `${level.id}/${id}`,
          'Shortcut does not trade timeline against safety or integrity.',
          'Give it a positive timeline delta and a negative safety or integrity delta.',
        );
      if (!s.why) fail(file, `${level.id}/${id}`, 'Shortcut has no "why" line.', 'Write the Dose aside.');
    }

    // emits
    for (const e of level.emits ?? []) {
      if (!isArtifactKey(e.key)) {
        fail(file, level.id, `emits unknown artifact "${e.key}".`, 'Add it to artifacts.ts.');
        continue;
      }
      const spec = artifactRegistry[e.key];
      for (const o of e.outcomes) {
        if (!(spec.tags as readonly string[]).includes(o.tag))
          fail(
            file,
            level.id,
            `emits tag "${o.tag}" which is not in the tags of "${e.key}".`,
            `Use one of: ${spec.tags.join(', ')}.`,
          );
        validateRule(file, `${level.id}/emits/${e.key}`, o.when, level, fail);
      }
    }

    // variants / consumers
    for (const key of consumedKeys(level)) {
      const emitter = emittedBy[key];
      if (!emitter) {
        // Missing emitters FAIL, unless the key or the level is marked planned: then they are listed
        // in the summary and skipped, until the owning world is released.
        const plannedRef = !!(artifactRegistry[key] as { planned?: boolean }).planned || !!level.planned;
        if (plannedRef && world?.status !== 'ready')
          issues.push({
            severity: 'info',
            file,
            id: level.id,
            message: `Planned: consumes "${key}" whose emitting level is not written yet.`,
            fix: 'Write the emitter before releasing the world.',
          });
        else
          fail(
            file,
            level.id,
            `Consumes "${key}" but no level emits it${plannedRef ? ' and the world is released' : ''}.`,
            plannedRef
              ? 'Write the emitting level, or keep the world planned.'
              : 'Add an emits entry to an earlier level, or mark the key or level planned: true.',
          );
      } else if (nodeIndex(emitter) >= nodeIndex(level.id) && nodeIndex(level.id) >= 0)
        fail(
          file,
          level.id,
          `Consumes "${key}" which is emitted by ${emitter}, a later level.`,
          'Consumers must come after their emitters on the map.',
        );
    }
    (level.variants ?? []).forEach((v, i) => {
      for (const [k, tag] of Object.entries(v.when)) {
        if (!isArtifactKey(k))
          fail(
            file,
            `${level.id}/variant ${i}`,
            `when references unknown artifact "${k}".`,
            'Use a key from artifacts.ts.',
          );
        else if (!(artifactRegistry[k].tags as readonly string[]).includes(tag!))
          fail(
            file,
            `${level.id}/variant ${i}`,
            `when tag "${tag}" is not a tag of "${k}".`,
            `Use one of: ${artifactRegistry[k].tags.join(', ')}.`,
          );
      }
    });
    const assignments = enumerateAssignments(level);
    if (assignments.length > 24)
      warn(
        file,
        level.id,
        `${assignments.length} tag assignments to validate (over 24).`,
        'Consume fewer artifacts or artifacts with fewer tags.',
      );
    for (const a of assignments) {
      const label =
        Object.entries(a)
          .map(([k, t]) => `${k}=${t}`)
          .join(',') || 'base';
      try {
        const built = buildLevel(level, {}, a);
        const opening = economy.meters.setbackResetTo;
        for (const [m, d] of Object.entries(built.meterOpening)) {
          if (opening + (d ?? 0) <= economy.meters.openingFloor)
            fail(
              file,
              `${level.id} [${label}]`,
              `meterOpening on ${m} sums to ${d}; from the post-setback floor of ${opening} that leaves ${opening + (d ?? 0)}, which is ${economy.meters.openingFloor} or below.`,
              'Reduce the opening hits so the player can always act before a setback.',
            );
        }
        const builtIds = new Set(built.stages.map((s) => s.id));
        for (const s of built.stages)
          validateStage(file, `${level.id}/${s.id} [${label}]`, s, fail, () => {}, c);
        if (built.mayaCameo) {
          const stage = built.stages.find((s) => s.id === built.mayaCameo!.stageId);
          if (!stage || !builtIds.has(built.mayaCameo.stageId))
            fail(
              file,
              `${level.id} [${label}]`,
              `mayaCameo names unknown stage "${built.mayaCameo.stageId}".`,
              'Use a stage id from this level.',
            );
          else if (!hasItem(stage.game, built.mayaCameo.itemId))
            fail(
              file,
              `${level.id} [${label}]`,
              `mayaCameo.itemId "${built.mayaCameo.itemId}" does not exist in stage "${stage.id}".`,
              'Use an item id from that stage.',
            );
        }
        for (const e of built.emits ?? [])
          for (const o of e.outcomes)
            validateRule(file, `${level.id}/emits/${e.key} [${label}]`, o.when, built, fail);
      } catch (err) {
        if (err instanceof PatchError)
          fail(
            file,
            `${level.id} [${label}]`,
            err.message,
            'Fix the variant patch so every id it names exists.',
          );
        else throw err;
      }
    }
    if (level.mayaCameo && world && world.number < 5)
      warn(file, level.id, 'mayaCameo used before World 5.', 'Maya appears inside levels from World 5 on.');
  }

  // ---------------------------------------------------------------- crises
  for (const crisis of c.crises) validateCrisis(c, crisis, fail, warn, checkCopy);

  // ---------------------------------------------------------------- knowledge
  const seenQ = new Set<string>();
  for (const k of c.knowledge) {
    const file = `src/content/knowledge/${worldOf(c.roleRefById[k.roleId]?.worldId ?? 'w?')}.ts`;
    if (!c.roleRefById[k.roleId]) fail(file, k.id, `roleId "${k.roleId}" is not a role.`, 'Use a role id.');
    for (const q of k.questions) {
      if (seenQ.has(q.id)) fail(file, q.id, 'Question id repeats.', 'Give each question a unique id.');
      seenQ.add(q.id);
      if (q.roleId !== k.roleId)
        fail(
          file,
          q.id,
          `Question roleId "${q.roleId}" does not match the check's role "${k.roleId}".`,
          'Set roleId on the question.',
        );
      validateQuestion(file, q, fail, c);
    }
  }
  return issues;
}

function validateReadyWorld(c: Content, world: World, fail: Fail, warn: Fail) {
  for (const node of world.nodes) {
    if (node.kind === 'level') {
      const role = c.roleById[node.roleId];
      const rf = `src/content/worlds/${world.id}/roles.ts`;
      if (!role) {
        fail(rf, node.roleId, 'Ready world is missing this role card.', 'Write the card in roles.ts.');
        continue;
      }
      const card = role.card;
      if (cardFrontWords(role) > BUDGETS.cardFront)
        warn(
          rf,
          role.id,
          `Card front is ${cardFrontWords(role)} words; budget is ${BUDGETS.cardFront}.`,
          'Shorten "What I do".',
        );
      if (card.whatIDo.length < 40)
        fail(rf, role.id, '"What I do" is too short.', 'Write 2–3 plain sentences.');
      if (card.responsibilities.length < 3 || card.responsibilities.length > 5)
        fail(
          rf,
          role.id,
          `Needs 3–5 responsibilities, has ${card.responsibilities.length}.`,
          'Adjust the list.',
        );
      if (card.skills.length === 0 || card.documents.length === 0)
        fail(rf, role.id, 'Skills or documents list is empty.', 'Add at least one item.');
      if (card.funFact.length < 20 || card.background.length < 10)
        fail(rf, role.id, 'Fun fact or background is missing.', 'Fill both in.');
      const level = c.levelById[node.id];
      if (!level)
        fail(
          levelFile(node.id),
          node.id,
          'Ready world is missing this level.',
          'Write the level in levels.ts.',
        );
      else if (level.roleId !== node.roleId || level.worldId !== world.id)
        fail(
          levelFile(node.id),
          node.id,
          'Level roleId/worldId do not match its map node.',
          'Fix roleId and worldId.',
        );
    } else if (node.kind === 'crisis') {
      if (!c.crisisById[node.id])
        fail(
          crisisFile(node.id),
          node.id,
          'Ready world is missing its crisis boss.',
          'Write it in crisis.ts.',
        );
    } else if (node.kind === 'review') {
      if (!c.reviewById[node.id])
        fail(
          `src/content/worlds/${world.id}/index.ts`,
          node.id,
          'Ready world is missing this review node.',
          'Export it from the world index.',
        );
    }
  }
}

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectStrings(v, out));
  return out;
}

export function hasItem(config: MiniGameConfig, itemId: string): boolean {
  if (
    engineRegistry[config.engine].collections.some((col) =>
      getCollection(config, col).some((i) => i.id === itemId),
    )
  )
    return true;
  return config.engine === 'spot-the-impostor' && config.signOff?.id === itemId;
}

type Fail = (file: string, id: string, message: string, fix: string) => void;

/** WARN when a copy field is over its word budget (docs/CONTENT_GUIDE.md §12). */
function budget(warn: Fail, file: string, id: string, field: string, text: string | undefined, max: number) {
  const n = words(text);
  if (n > max)
    warn(file, id, `${field} is ${n} words; budget is ${max}.`, 'Tighten the sentence; keep the fact.');
}

function validateExplained(
  file: string,
  id: string,
  e: { explanation?: string; consequence?: string; conceptId?: string; confirm?: string; text?: string },
  fail: Fail,
  c: Content,
  warn: Fail = () => {},
) {
  budget(warn, file, id, 'explanation', e.explanation, BUDGETS.explanation);
  budget(warn, file, id, 'consequence', e.consequence, BUDGETS.consequence);
  budget(warn, file, id, 'confirm', e.confirm, BUDGETS.confirm);
  if (typeof e.text === 'string') budget(warn, file, id, 'text', e.text, BUDGETS.cardText);
  if (!e.explanation || e.explanation.length < 10)
    fail(file, id, 'Missing explanation (why the right answer is right).', 'Add one or two sentences.');
  if (!e.consequence || e.consequence.length < 10)
    fail(file, id, 'Missing real-world consequence.', 'Say what goes wrong in real life.');
  if (!e.conceptId || !c.glossaryById[e.conceptId])
    fail(
      file,
      id,
      `conceptId "${e.conceptId}" is not a glossary term.`,
      'Point it at a term in glossary.ts.',
    );
}

function validateQuestion(file: string, q: QuizQuestion, fail: Fail, c: Content) {
  if (q.options.length !== 4)
    fail(file, q.id, `Question has ${q.options.length} options; needs exactly 4.`, 'Add or remove options.');
  if (q.options.filter((o) => o.correct).length !== 1)
    fail(
      file,
      q.id,
      'Question must have exactly one correct option.',
      'Mark exactly one option correct: true.',
    );
  validateExplained(file, q.id, q, fail, c);
}

export function validateStage(file: string, id: string, stage: Stage, fail: Fail, warn: Fail, c: Content) {
  const g = stage.game;
  if (!engineRegistry[g.engine].mainPath)
    fail(
      file,
      id,
      `Engine "${g.engine}" is not allowed on the main path.`,
      'quiz-blitz lives only in Test Yourself (src/content/knowledge).',
    );
  const ids = engineRegistry[g.engine].collections.flatMap((col) => getCollection(g, col).map((i) => i.id));
  const dupes = ids.filter((x, i) => ids.indexOf(x) !== i);
  if (dupes.length)
    fail(
      file,
      id,
      `Item ids repeat within the stage: ${[...new Set(dupes)].join(', ')}.`,
      'Item ids must be unique across all collections of a stage.',
    );
  const explained = (items: { id: string }[]) =>
    items.forEach((it) => validateExplained(file, `${id}/${it.id}`, it as never, fail, c, warn));

  switch (g.engine) {
    case 'bucket-sort': {
      if (g.buckets.length < 2 || g.buckets.length > 4)
        fail(file, id, `bucket-sort needs 2–4 buckets, has ${g.buckets.length}.`, 'Adjust the buckets.');
      if (g.cards.length < 1) fail(file, id, 'bucket-sort has no cards.', 'Add cards.');
      for (const card of g.cards)
        if (!g.buckets.some((b) => b.id === card.bucketId))
          fail(
            file,
            `${id}/${card.id}`,
            `Card points at unknown bucket "${card.bucketId}".`,
            'Use a bucket id from this stage.',
          );
      for (const b of g.buckets)
        if (b.shortcut && g.cards.some((cd) => cd.bucketId === b.id))
          fail(
            file,
            `${id}/${b.id}`,
            'A shortcut bucket cannot be the correct bucket for any card.',
            'Point cards at a non-shortcut bucket.',
          );
      explained(g.cards);
      break;
    }
    case 'builder': {
      if (g.slots.length < 1) fail(file, id, 'builder has no slots.', 'Add slots.');
      for (const p of g.parts) {
        if (p.slotId && !g.slots.some((s) => s.id === p.slotId))
          fail(file, `${id}/${p.id}`, `Part points at unknown slot "${p.slotId}".`, 'Use a slot id.');
        if (p.shortcut && p.slotId)
          fail(
            file,
            `${id}/${p.id}`,
            'A shortcut part cannot also be a correct part.',
            'Remove slotId or the shortcut.',
          );
      }
      for (const s of g.slots)
        if (!g.parts.some((p) => p.slotId === s.id))
          fail(file, `${id}/${s.id}`, 'Slot has no correct part.', 'Add a part with this slotId.');
      explained(g.parts);
      if (g.simulation) validateSimulationParts(file, id, g, fail);
      break;
    }
    case 'branching-scenario': {
      validateBranching(file, id, g, fail, warn, c);
      break;
    }
    case 'spot-the-impostor': {
      if (g.cards.length < 3)
        fail(file, id, `spot-the-impostor needs at least 3 cards, has ${g.cards.length}.`, 'Add cards.');
      if (!g.cards.some((cd) => cd.impostor))
        fail(file, id, 'No card is marked impostor: true.', 'Mark the one to find.');
      explained(g.cards);
      if (g.signOff && !g.signOff.shortcut.why)
        fail(file, `${id}/${g.signOff.id}`, 'signOff shortcut has no why.', 'Write the Dose aside.');
      break;
    }
    case 'allocator': {
      validateAllocator(file, id, g, fail, c);
      break;
    }
    case 'sequence-sort': {
      if (g.items.length < 3) fail(file, id, 'sequence-sort needs at least 3 items.', 'Add items.');
      explained(g.items);
      break;
    }
    case 'match-pairs': {
      if (g.pairs.length < 3) fail(file, id, 'match-pairs needs at least 3 pairs.', 'Add pairs.');
      explained(g.pairs);
      break;
    }
    case 'dash-manager': {
      if (g.stations.length < 2) fail(file, id, 'dash-manager needs at least 2 stations.', 'Add stations.');
      for (const it of g.items)
        for (const st of it.steps)
          if (!g.stations.some((s) => s.id === st))
            fail(file, `${id}/${it.id}`, `Step "${st}" is not a station.`, 'Use station ids.');
      explained(g.items);
      break;
    }
    case 'quiz-blitz':
      break;
  }
}

function validateBranching(file: string, id: string, g: BranchingConfig, fail: Fail, warn: Fail, c: Content) {
  const nodeIds = new Set(g.nodes.map((n) => n.id));
  if (!nodeIds.has(g.start))
    fail(file, id, `start node "${g.start}" does not exist.`, 'Point start at a node id.');
  let allSame = true;
  for (const n of g.nodes) {
    if (!n.choices?.length && !n.end)
      fail(
        file,
        `${id}/${n.id}`,
        'Node has neither choices nor an end.',
        'Add choices, or end: { summary }.',
      );
    if (n.choices?.length && n.end)
      fail(file, `${id}/${n.id}`, 'Node has both choices and an end.', 'Pick one.');
    budget(warn, file, `${id}/${n.id}`, 'node text', n.text, BUDGETS.scenarioNode);
    for (const ch of n.choices ?? []) {
      budget(warn, file, `${id}/${ch.id}`, 'choice', ch.text, BUDGETS.choice);
      if (!nodeIds.has(ch.next))
        fail(file, `${id}/${ch.id}`, `Choice goes to unknown node "${ch.next}".`, 'Point next at a node id.');
      validateExplained(file, `${id}/${ch.id}`, ch, fail, c, warn);
      if (ch.shortcut && ch.quality !== 'bad')
        fail(
          file,
          `${id}/${ch.id}`,
          'A shortcut choice must have quality "bad" (it never counts as correct).',
          'Set quality: "bad".',
        );
    }
    if (n.choices && n.choices.length > 1 && new Set(n.choices.map((x) => x.next)).size > 1) allSame = false;
  }
  if (allSame && g.nodes.some((n) => (n.choices?.length ?? 0) > 1))
    warn(
      file,
      id,
      'Every decision leads to the same next node: the scenario never branches.',
      'Route at least one choice somewhere different.',
    );
  // reachability of ends
  const reach = new Set<string>();
  const stack = [g.start];
  while (stack.length) {
    const cur = stack.pop()!;
    if (reach.has(cur)) continue;
    reach.add(cur);
    for (const ch of g.nodes.find((n) => n.id === cur)?.choices ?? []) stack.push(ch.next);
  }
  for (const n of g.nodes)
    if (!reach.has(n.id))
      warn(file, `${id}/${n.id}`, 'Node is unreachable from start.', 'Link it from a choice or remove it.');
}

function validateAllocator(file: string, id: string, g: AllocatorConfig, fail: Fail, c: Content) {
  for (const cat of g.categories) {
    if (!(cat.min < cat.max) || cat.step <= 0)
      fail(file, `${id}/${cat.id}`, 'Category range or step is invalid.', 'min < max and step > 0.');
    if (
      Math.abs(((cat.max - cat.min) / cat.step) % 1) > 1e-6 &&
      Math.abs((((cat.max - cat.min) / cat.step) % 1) - 1) > 1e-6
    )
      fail(file, `${id}/${cat.id}`, 'max − min is not a whole number of steps.', 'Adjust min, max or step.');
    if (cat.target[0] < cat.min - EPS || cat.target[1] > cat.max + EPS || cat.target[0] > cat.target[1])
      fail(file, `${id}/${cat.id}`, 'target range is outside min..max or reversed.', 'Fix target.');
    validateExplained(file, `${id}/${cat.id}`, cat, fail, c);
  }
  for (const p of g.presets ?? [])
    for (const k of Object.keys(p.values))
      if (!g.categories.some((cat) => cat.id === k))
        fail(file, `${id}/${p.id}`, `Preset sets unknown category "${k}".`, 'Use category ids.');
  const sim = g.simulation;
  if (!sim) return;
  const cat = g.categories.find((x) => x.id === sim.input.categoryId);
  if (!cat) {
    fail(
      file,
      `${id}/simulation`,
      `simulation.input.categoryId "${sim.input.categoryId}" is not a category.`,
      'Use a category id.',
    );
    return;
  }
  if (Math.abs(sim.input.min - cat.min) > EPS || Math.abs(sim.input.max - cat.max) > EPS)
    fail(file, `${id}/simulation`, 'simulation.input min/max differ from the category.', 'Make them match.');
  const tags = sim.bands.map((b) => b.tag);
  if (new Set(tags).size !== tags.length)
    fail(file, `${id}/simulation`, 'Band tags repeat.', 'Each band needs a unique tag.');
  if (!tags.includes(sim.targetBand))
    fail(
      file,
      `${id}/simulation`,
      `targetBand "${sim.targetBand}" is not a band tag.`,
      `Use one of: ${tags.join(', ')}.`,
    );
  const bands = sim.bands as { tag: string; range: [number, number]; visual: { exposureCurve?: string } }[];
  bands.forEach((b, i) => {
    if (i === 0 && Math.abs(b.range[0] - sim.input.min) > EPS)
      fail(
        file,
        `${id}/simulation/${b.tag}`,
        `First band starts at ${b.range[0]}, not at the input minimum ${sim.input.min}.`,
        'Start the first band at min.',
      );
    if (i > 0 && Math.abs(b.range[0] - bands[i - 1]!.range[1]) > EPS)
      fail(
        file,
        `${id}/simulation/${b.tag}`,
        `Band starts at ${b.range[0]} but the previous band ends at ${bands[i - 1]!.range[1]} (gap or overlap).`,
        'Make each band start where the previous one ends.',
      );
    if (i === bands.length - 1 && Math.abs(b.range[1] - sim.input.max) > EPS)
      fail(
        file,
        `${id}/simulation/${b.tag}`,
        `Last band ends at ${b.range[1]}, not at the input maximum ${sim.input.max}.`,
        'End the last band at max.',
      );
    if (b.range[0] >= b.range[1])
      fail(
        file,
        `${id}/simulation/${b.tag}`,
        'Band range is empty or reversed.',
        'min must be less than max.',
      );
    if (b.visual.exposureCurve && !sim.curves?.some((cv) => cv.id === b.visual.exposureCurve))
      fail(
        file,
        `${id}/simulation/${b.tag}`,
        `exposureCurve "${b.visual.exposureCurve}" is not a curve id.`,
        'Add the curve or fix the id.',
      );
  });
  if (sim.preview === 'live' && !sim.curves?.length)
    fail(
      file,
      `${id}/simulation`,
      'Live preview needs at least one curve.',
      'Add curves, or use preview: "on-commit".',
    );
  for (const cv of sim.curves ?? []) {
    if (cv.points.length < 2)
      fail(file, `${id}/simulation/${cv.id}`, 'Curve needs at least 2 points.', 'Add points.');
    for (let i = 1; i < cv.points.length; i++)
      if (cv.points[i]![0] <= cv.points[i - 1]![0])
        fail(file, `${id}/simulation/${cv.id}`, 'Curve x values must strictly increase.', 'Sort the points.');
    if (cv.points[0]![0] > sim.input.min + EPS || cv.points.at(-1)![0] < sim.input.max - EPS)
      fail(
        file,
        `${id}/simulation/${cv.id}`,
        'Curve does not cover the whole input range.',
        'Add a point at min and at max.',
      );
  }
}

function validateSimulationParts(
  file: string,
  id: string,
  g: {
    slots: { id: string }[];
    parts: { id: string }[];
    simulation?: { slotId: string; bands: { tag: string; parts: string[] }[]; targetBand: string };
  },
  fail: Fail,
) {
  const sim = g.simulation!;
  if (!g.slots.some((s) => s.id === sim.slotId))
    fail(file, `${id}/simulation`, `simulation.slotId "${sim.slotId}" is not a slot.`, 'Use a slot id.');
  const seen = new Map<string, number>();
  for (const b of sim.bands) for (const p of b.parts) seen.set(p, (seen.get(p) ?? 0) + 1);
  for (const p of g.parts)
    if ((seen.get(p.id) ?? 0) !== 1)
      fail(
        file,
        `${id}/simulation`,
        `Part "${p.id}" appears in ${seen.get(p.id) ?? 0} bands; must be exactly 1.`,
        'Put every part in exactly one band.',
      );
  if (!sim.bands.some((b) => b.tag === sim.targetBand))
    fail(file, `${id}/simulation`, `targetBand "${sim.targetBand}" is not a band tag.`, 'Fix targetBand.');
}

const RULE_FIELDS: RuleField[] = ['band', 'endNode', 'chosePart', 'bucketOf', 'accused'];

function validateRule(file: string, id: string, rule: OutcomeRule, level: Level, fail: Fail) {
  const used = RULE_FIELDS.filter((f) => rule[f] !== undefined);
  if (level.stages.length > 1 && !rule.stageId && (used.length || rule.tookShortcut))
    fail(
      file,
      id,
      'OutcomeRule uses an engine field but names no stageId on a multi-stage level.',
      'Add stageId.',
    );
  const stage = rule.stageId ? level.stages.find((s) => s.id === rule.stageId) : level.stages[0];
  if (rule.stageId && !stage) {
    fail(file, id, `OutcomeRule names unknown stage "${rule.stageId}".`, 'Use a stage id.');
    return;
  }
  if (!stage) return;
  const g = stage.game;
  const meta = engineRegistry[g.engine];
  for (const f of used)
    if (!meta.ruleFields.includes(f))
      fail(
        file,
        id,
        `OutcomeRule field "${f}" does not apply to engine "${g.engine}".`,
        `Allowed here: ${meta.ruleFields.join(', ') || 'accuracyAtLeast, tookShortcut'}.`,
      );
  if (rule.endNode && g.engine === 'branching-scenario' && !g.nodes.some((n) => n.id === rule.endNode))
    fail(file, id, `endNode "${rule.endNode}" does not exist.`, 'Use a node id.');
  if (rule.band && 'simulation' in g && g.simulation && !g.simulation.bands.some((b) => b.tag === rule.band))
    fail(file, id, `band "${rule.band}" is not a band tag.`, 'Use a band tag.');
  if (rule.band && !('simulation' in g && g.simulation))
    fail(file, id, 'band rule on a stage without a simulation.', 'Add a simulation or remove the rule.');
  if (rule.chosePart && g.engine === 'builder') {
    if (!g.slots.some((s) => s.id === rule.chosePart!.slotId))
      fail(file, id, `chosePart slot "${rule.chosePart.slotId}" does not exist.`, 'Use a slot id.');
    if (!g.parts.some((p) => p.id === rule.chosePart!.partId))
      fail(file, id, `chosePart part "${rule.chosePart.partId}" does not exist.`, 'Use a part id.');
  }
  if (rule.bucketOf && g.engine === 'bucket-sort') {
    if (!g.cards.some((cd) => cd.id === rule.bucketOf!.itemId))
      fail(file, id, `bucketOf item "${rule.bucketOf.itemId}" does not exist.`, 'Use a card id.');
    if (!g.buckets.some((b) => b.id === rule.bucketOf!.bucketId))
      fail(file, id, `bucketOf bucket "${rule.bucketOf.bucketId}" does not exist.`, 'Use a bucket id.');
  }
  if (rule.accused && g.engine === 'spot-the-impostor' && !g.cards.some((cd) => cd.id === rule.accused))
    fail(file, id, `accused "${rule.accused}" is not a card.`, 'Use a card id.');
  if (
    rule.tookShortcut &&
    !shortcutCarriers(g).some((s) => s.id === rule.tookShortcut) &&
    level.shortcutPrompt?.id !== rule.tookShortcut
  )
    fail(
      file,
      id,
      `tookShortcut "${rule.tookShortcut}" is not a shortcut in this stage.`,
      'Use the id of a shortcut carrier.',
    );
}

function validateCrisis(
  c: Content,
  crisis: CrisisBoss,
  fail: Fail,
  warn: Fail,
  checkCopy: (f: string, i: string, v: unknown) => void,
) {
  const file = crisisFile(crisis.id);
  const world = c.worldById[crisis.worldId];
  checkCopy(file, crisis.id, [crisis.situation, crisis.resolution, crisis.rounds]);
  const n = crisis.rounds.length;
  if (n < economy.crisis.minRounds || n > economy.crisis.maxRounds)
    fail(
      file,
      crisis.id,
      `Crisis has ${n} rounds; needs ${economy.crisis.minRounds}–${economy.crisis.maxRounds}.`,
      'Add or remove rounds.',
    );
  const pool =
    crisis.rounds.reduce((s, r) => s + r.seconds, 0) * (1 + (crisis.slack ?? economy.crisis.slack));
  if (pool > economy.crisis.poolMax)
    fail(
      file,
      crisis.id,
      `Crisis pool is ${Math.round(pool)} s; must be ≤ ${economy.crisis.poolMax}.`,
      'Shorten the rounds.',
    );
  const localEmitted = new Set<string>();
  crisis.rounds.forEach((r, i) => {
    const rid = `${crisis.id}/${r.id}`;
    if (r.seconds < economy.crisis.roundSeconds[0] || r.seconds > economy.crisis.roundSeconds[1])
      fail(file, rid, `Round is ${r.seconds} s; must be 15–40.`, 'Adjust seconds.');
    if (!world || c.roleRefById[r.roleId]?.worldId !== crisis.worldId)
      fail(
        file,
        rid,
        `roleId "${r.roleId}" is not a role of ${crisis.worldId}.`,
        'Use a role from this world.',
      );
    const stage: Stage = { id: r.id, game: r.game };
    validateStage(file, rid, stage, fail, warn, c);
    for (const e of r.emits ?? []) {
      if (!e.key.startsWith('local.'))
        fail(
          file,
          rid,
          `Crisis rounds may only emit local.* keys, got "${e.key}".`,
          'Prefix the key with local.',
        );
      if (!e.tags.includes(e.defaultTag))
        fail(file, rid, `defaultTag "${e.defaultTag}" is not in tags.`, 'Add it to tags.');
      for (const o of e.outcomes) {
        if (!e.tags.includes(o.tag))
          fail(file, rid, `Outcome tag "${o.tag}" is not in tags.`, 'Add it to tags.');
        validateRule(file, `${rid}/emits/${e.key}`, o.when, { stages: [stage] } as unknown as Level, fail);
      }
    }
    (r.variants ?? []).forEach((v, vi) => {
      for (const k of Object.keys(v.when)) {
        if (!k.startsWith('local.'))
          fail(
            file,
            `${rid}/variant ${vi}`,
            `Round variants may only branch on local.* keys, got "${k}".`,
            'Use a local key.',
          );
        else if (!localEmitted.has(k))
          fail(
            file,
            `${rid}/variant ${vi}`,
            `"${k}" is not emitted by an earlier round.`,
            'Emit it from a previous round.',
          );
      }
      if (v.patch.stage) {
        try {
          validateStage(
            file,
            `${rid} [variant ${vi}]`,
            applyStagePatch(stage, v.patch.stage, `${rid} variant ${vi}`),
            fail,
            () => {},
            c,
          );
        } catch (err) {
          if (err instanceof PatchError)
            fail(file, `${rid}/variant ${vi}`, err.message, 'Fix the patch ids.');
          else throw err;
        }
      }
    });
    for (const e of r.emits ?? []) localEmitted.add(e.key);
    void i;
  });
}
