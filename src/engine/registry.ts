/**
 * What each engine exposes to the content system: its patchable item collections, which
 * OutcomeRule fields it can satisfy, and which collection carries shortcuts.
 */
import type { EngineId, MiniGameConfig, OutcomeRule, ScenarioChoice, ScenarioNode } from '@/content/types';

export type RuleField = Exclude<keyof OutcomeRule, 'stageId' | 'accuracyAtLeast' | 'tookShortcut'>;

export interface EngineMeta {
  /** Collections a variant may patch by item id. */
  collections: readonly string[];
  /** Collections whose items may carry `shortcut`. */
  shortcutCarriers: readonly string[];
  ruleFields: readonly RuleField[];
  mainPath: boolean;
}

export const engineRegistry: Record<EngineId, EngineMeta> = {
  'quiz-blitz': { collections: ['questions'], shortcutCarriers: [], ruleFields: [], mainPath: false },
  'bucket-sort': {
    collections: ['buckets', 'cards'],
    shortcutCarriers: ['buckets'],
    ruleFields: ['bucketOf'],
    mainPath: true,
  },
  builder: {
    collections: ['slots', 'parts'],
    shortcutCarriers: ['parts'],
    ruleFields: ['chosePart', 'band'],
    mainPath: true,
  },
  'branching-scenario': {
    collections: ['nodes', 'choices'],
    shortcutCarriers: ['choices'],
    ruleFields: ['endNode'],
    mainPath: true,
  },
  'spot-the-impostor': {
    collections: ['cards'],
    shortcutCarriers: [],
    ruleFields: ['accused'],
    mainPath: true,
  },
  allocator: {
    collections: ['categories', 'presets'],
    shortcutCarriers: ['presets'],
    ruleFields: ['band'],
    mainPath: true,
  },
  'sequence-sort': { collections: ['items'], shortcutCarriers: [], ruleFields: [], mainPath: true },
  'match-pairs': { collections: ['pairs'], shortcutCarriers: [], ruleFields: [], mainPath: true },
  'dash-manager': {
    collections: ['stations', 'items'],
    shortcutCarriers: ['stations'],
    ruleFields: [],
    mainPath: true,
  },
};

/** Node fields a variant may change with `nodes.replace` (copy only; structure lives in `choices`). */
export const NODE_COPY_FIELDS = ['text', 'speaker', 'end'] as const;

/** Reads a collection from a config. `choices` is the virtual, flattened collection of a scenario. */
export function getCollection(config: MiniGameConfig, name: string): { id: string }[] {
  if (config.engine === 'branching-scenario' && name === 'choices') {
    return config.nodes.flatMap((n) => n.choices ?? []);
  }
  const value = (config as unknown as Record<string, unknown>)[name];
  return Array.isArray(value) ? (value as { id: string }[]) : [];
}

/** Every scorable/patchable item of a config, with its collection name. */
export function allItems(config: MiniGameConfig): { collection: string; item: { id: string } }[] {
  return engineRegistry[config.engine].collections.flatMap((c) =>
    getCollection(config, c).map((item) => ({ collection: c, item })),
  );
}

/** Every item that carries a shortcut, plus the impostor sign-off action. */
export function shortcutCarriers(config: MiniGameConfig): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = [];
  for (const c of engineRegistry[config.engine].shortcutCarriers) {
    for (const item of getCollection(config, c) as {
      id: string;
      shortcut?: unknown;
      label?: string;
      text?: string;
    }[]) {
      if (item.shortcut) out.push({ id: item.id, label: item.label ?? item.text ?? item.id });
    }
  }
  if (config.engine === 'spot-the-impostor' && config.signOff)
    out.push({ id: config.signOff.id, label: config.signOff.label });
  return out;
}

export function findNodeOfChoice(nodes: ScenarioNode[], choiceId: string): ScenarioNode | undefined {
  return nodes.find((n) => n.choices?.some((c: ScenarioChoice) => c.id === choiceId));
}
