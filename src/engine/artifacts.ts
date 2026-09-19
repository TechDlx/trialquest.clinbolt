/** Evaluates OutcomeRules against an EngineResult and produces stored artifacts. Pure. */
import { artifactRegistry, type ArtifactKey, type StoredArtifact } from '@/content/artifacts';
import type { EmitSpec, OutcomeRule, EmitDataSource, CrisisEmitSpec } from '@/content/types';
import type { EngineResult } from './scoring';

/** Results keyed by stage id, plus the level aggregate. */
export interface StageResults {
  byStage: Record<string, EngineResult>;
  level: EngineResult;
}

export function ruleMatches(rule: OutcomeRule, results: StageResults): boolean {
  const r = rule.stageId ? results.byStage[rule.stageId] : results.level;
  if (!r) return false;
  if (rule.accuracyAtLeast !== undefined && r.accuracy < rule.accuracyAtLeast) return false;
  if (rule.band !== undefined && r.outcomes.band !== rule.band) return false;
  if (rule.endNode !== undefined && r.outcomes.endNode !== rule.endNode) return false;
  if (rule.chosePart && r.outcomes.parts?.[rule.chosePart.slotId] !== rule.chosePart.partId) return false;
  if (rule.bucketOf && r.outcomes.buckets?.[rule.bucketOf.itemId] !== rule.bucketOf.bucketId) return false;
  if (rule.accused !== undefined && !r.outcomes.accused?.includes(rule.accused)) return false;
  if (rule.tookShortcut !== undefined && !r.outcomes.shortcutsTaken.includes(rule.tookShortcut)) return false;
  return true;
}

export function resolveTag(
  outcomes: { tag: string; when: OutcomeRule }[],
  defaultTag: string,
  results: StageResults,
): string {
  for (const o of outcomes) if (ruleMatches(o.when, results)) return o.tag;
  return defaultTag;
}

function sourceValue(
  src: EmitDataSource,
  results: StageResults,
  stageId?: string,
): string | number | undefined {
  const r = stageId ? results.byStage[stageId] : results.level;
  const any = Object.values(results.byStage);
  switch (src) {
    case 'inputValue':
      return (
        r?.outcomes.inputValue ?? any.find((x) => x.outcomes.inputValue !== undefined)?.outcomes.inputValue
      );
    case 'band':
      return r?.outcomes.band ?? any.find((x) => x.outcomes.band)?.outcomes.band;
    case 'endNode':
      return r?.outcomes.endNode ?? any.find((x) => x.outcomes.endNode)?.outcomes.endNode;
    case 'accuracy':
      return Math.round((results.level.accuracy ?? 0) * 100) / 100;
  }
}

export function evaluateEmits(
  emits: EmitSpec[] | undefined,
  results: StageResults,
  levelId: string,
  now = new Date(),
): StoredArtifact[] {
  return (emits ?? []).map((e) => {
    const tag = resolveTag(e.outcomes, artifactRegistry[e.key].defaultTag, results);
    const data: Record<string, string | number | boolean> = {};
    for (const [field, src] of Object.entries(e.data ?? {})) {
      const stageId = e.outcomes.find((o) => o.when.stageId)?.when.stageId;
      const v = sourceValue(src, results, stageId);
      if (v !== undefined) data[field] = v;
    }
    return {
      key: e.key as ArtifactKey,
      tag,
      data: Object.keys(data).length ? data : undefined,
      emittedBy: levelId,
      emittedAt: now.toISOString(),
    };
  });
}

/** Crisis-local hand-offs: same rules, never persisted. */
export function evaluateCrisisEmits(
  emits: CrisisEmitSpec[] | undefined,
  result: EngineResult,
): Record<string, string> {
  const out: Record<string, string> = {};
  const results: StageResults = { byStage: {}, level: result };
  for (const e of emits ?? []) out[e.key] = resolveTag(e.outcomes, e.defaultTag, results);
  return out;
}
