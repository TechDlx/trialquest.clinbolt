/**
 * Builds the level a player actually sees: resolves artifact tags, applies matching
 * variants in declared order, and interpolates {{key.field}} copy.
 * Pure; used by both the runtime and the validator.
 */
import { artifactRegistry, isArtifactKey, type ArtifactKey, type ArtifactStore } from '@/content/artifacts';
import { interpolate } from '@/content/richText';
import type {
  ItemPatch,
  Level,
  LevelVariant,
  MeterDelta,
  MiniGameConfig,
  ScenarioChoice,
  ScenarioNode,
  Stage,
  StagePatch,
} from '@/content/types';
import { engineRegistry } from './registry';

export interface BuiltLevel extends Level {
  /** Sum of matching variants' meterOpening, clamped by the caller. */
  meterOpening: MeterDelta;
  /** Which variants applied, by index. */
  appliedVariants: number[];
  /** Tag assignment used for the build. */
  assignment: Partial<Record<ArtifactKey, string>>;
}

export class PatchError extends Error {}

/** Keys a level consumes = every key named in any variant's `when`. */
export function consumedKeys(level: Pick<Level, 'variants'>): ArtifactKey[] {
  const keys = new Set<ArtifactKey>();
  for (const v of level.variants ?? [])
    for (const k of Object.keys(v.when)) if (isArtifactKey(k)) keys.add(k);
  return [...keys];
}

/** Resolves the tag for each consumed key from the store or the registry default. */
export function resolveAssignment(
  level: Pick<Level, 'variants'>,
  artifacts: ArtifactStore,
): Partial<Record<ArtifactKey, string>> {
  const out: Partial<Record<ArtifactKey, string>> = {};
  for (const k of consumedKeys(level)) out[k] = artifacts[k]?.tag ?? artifactRegistry[k].defaultTag;
  return out;
}

/** Every tag assignment over the consumed keys (cartesian product). */
export function enumerateAssignments(level: Pick<Level, 'variants'>): Partial<Record<ArtifactKey, string>>[] {
  const keys = consumedKeys(level);
  let out: Partial<Record<ArtifactKey, string>>[] = [{}];
  for (const k of keys) {
    const next: Partial<Record<ArtifactKey, string>>[] = [];
    for (const base of out) for (const tag of artifactRegistry[k].tags) next.push({ ...base, [k]: tag });
    out = next;
  }
  return out;
}

export function variantMatches(v: LevelVariant, assignment: Partial<Record<ArtifactKey, string>>): boolean {
  return Object.entries(v.when).every(([k, tag]) => assignment[k as ArtifactKey] === tag);
}

function patchList<T extends { id: string }>(list: T[], patch: ItemPatch<T>, where: string): T[] {
  let out = list.slice();
  for (const id of patch.remove ?? []) {
    if (!out.some((i) => i.id === id)) throw new PatchError(`${where}: cannot remove unknown id "${id}"`);
    out = out.filter((i) => i.id !== id);
  }
  for (const r of patch.replace ?? []) {
    const idx = out.findIndex((i) => i.id === r.id);
    if (idx < 0) throw new PatchError(`${where}: cannot replace unknown id "${r.id}"`);
    out[idx] = { ...out[idx]!, ...r };
  }
  for (const a of patch.add ?? []) {
    if (out.some((i) => i.id === a.id)) throw new PatchError(`${where}: cannot add duplicate id "${a.id}"`);
    out.push(a);
  }
  return out;
}

export function applyStagePatch(stage: Stage, patch: StagePatch, where: string): Stage {
  let game = { ...stage.game } as MiniGameConfig;
  const meta = engineRegistry[game.engine];
  for (const [field, value] of Object.entries(patch.fields ?? {})) {
    if (field === 'engine') throw new PatchError(`${where}: "engine" can never be patched`);
    if ((meta.collections as readonly string[]).includes(field))
      throw new PatchError(`${where}: use items.${field}, not fields.${field}`);
    (game as unknown as Record<string, unknown>)[field] = value;
  }
  for (const [collection, itemPatch] of Object.entries(patch.items ?? {})) {
    if (!(meta.collections as readonly string[]).includes(collection)) {
      throw new PatchError(`${where}: engine "${game.engine}" has no collection "${collection}"`);
    }
    if (game.engine === 'branching-scenario' && collection === 'choices') {
      game = {
        ...game,
        nodes: patchChoices(game.nodes, itemPatch as ItemPatch<ScenarioChoice & { nodeId?: string }>, where),
      };
      continue;
    }
    if (game.engine === 'branching-scenario' && collection === 'nodes') {
      for (const r of itemPatch.replace ?? []) {
        if ('choices' in r)
          throw new PatchError(
            `${where}: nodes.replace may change copy only (text, speaker, end); patch items.choices instead`,
          );
      }
    }
    const g = game as unknown as Record<string, { id: string }[]>;
    g[collection] = patchList(
      g[collection] ?? [],
      itemPatch as ItemPatch<{ id: string }>,
      `${where}.${collection}`,
    );
  }
  return { ...stage, brief: patch.brief ?? stage.brief, game };
}

function patchChoices(
  nodes: ScenarioNode[],
  patch: ItemPatch<ScenarioChoice & { nodeId?: string }>,
  where: string,
): ScenarioNode[] {
  let out = nodes.map((n) => ({ ...n, choices: n.choices ? n.choices.slice() : n.choices }));
  const find = (id: string) => out.find((n) => n.choices?.some((c) => c.id === id));
  for (const id of patch.remove ?? []) {
    const n = find(id);
    if (!n) throw new PatchError(`${where}.choices: cannot remove unknown id "${id}"`);
    n.choices = n.choices!.filter((c) => c.id !== id);
  }
  for (const r of patch.replace ?? []) {
    const n = find(r.id);
    if (!n) throw new PatchError(`${where}.choices: cannot replace unknown id "${r.id}"`);
    n.choices = n.choices!.map((c) => (c.id === r.id ? { ...c, ...r } : c));
  }
  for (const a of patch.add ?? []) {
    const { nodeId, ...choice } = a;
    if (!nodeId) throw new PatchError(`${where}.choices: add needs a nodeId`);
    if (find(choice.id)) throw new PatchError(`${where}.choices: cannot add duplicate id "${choice.id}"`);
    const n = out.find((x) => x.id === nodeId);
    if (!n) throw new PatchError(`${where}.choices: add targets unknown node "${nodeId}"`);
    n.choices = [...(n.choices ?? []), choice as ScenarioChoice];
  }
  out = out.map((n) => (n.choices && n.choices.length === 0 ? { ...n, choices: undefined } : n));
  return out;
}

/** Applies matching variants (in declared order) and interpolates copy. */
export function buildLevel(
  level: Level,
  artifacts: ArtifactStore,
  assignmentOverride?: Partial<Record<ArtifactKey, string>>,
): BuiltLevel {
  const assignment = assignmentOverride ?? resolveAssignment(level, artifacts);
  let built: Level = { ...level, stages: level.stages.map((s) => ({ ...s })) as Level['stages'] };
  const meterOpening: MeterDelta = {};
  const appliedVariants: number[] = [];
  (level.variants ?? []).forEach((v, i) => {
    if (!variantMatches(v, assignment)) return;
    appliedVariants.push(i);
    const p = v.patch;
    if (p.intro !== undefined) built.intro = p.intro;
    if (p.debrief) built.debrief = { ...built.debrief, ...p.debrief };
    for (const [m, d] of Object.entries(p.meterOpening ?? {})) {
      meterOpening[m as keyof MeterDelta] = (meterOpening[m as keyof MeterDelta] ?? 0) + (d ?? 0);
    }
    for (const [stageId, sp] of Object.entries(p.stages ?? {})) {
      const idx = built.stages.findIndex((s) => s.id === stageId);
      if (idx < 0) throw new PatchError(`${level.id} variant ${i}: unknown stage "${stageId}"`);
      built.stages[idx] = applyStagePatch(
        built.stages[idx]!,
        sp,
        `${level.id} variant ${i} stage ${stageId}`,
      );
    }
  });
  built = interpolateLevel(built, artifacts);
  return { ...built, meterOpening, appliedVariants, assignment };
}

function interpolateLevel(level: Level, artifacts: ArtifactStore): Level {
  const t = (s: string) => interpolate(s, artifacts);
  return {
    ...level,
    intro: t(level.intro),
    debrief: { learned: t(level.debrief.learned), handoffLine: t(level.debrief.handoffLine) },
    stages: level.stages.map((s) => ({
      ...s,
      brief: s.brief ? t(s.brief) : s.brief,
      game: interpolateConfig(s.game, t),
    })) as Level['stages'],
  };
}

function interpolateConfig(game: MiniGameConfig, t: (s: string) => string): MiniGameConfig {
  if (game.engine === 'branching-scenario') {
    return {
      ...game,
      nodes: game.nodes.map((n) => ({
        ...n,
        text: t(n.text),
        end: n.end ? { summary: t(n.end.summary) } : n.end,
      })),
    };
  }
  if ('prompt' in game) return { ...game, prompt: t(game.prompt) };
  return game;
}
