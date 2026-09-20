import type { StoredArtifact } from '@/content/artifacts';
import { artifactRegistry } from '@/content/artifacts';
import { content } from '@/content';
import { finaleContent } from '@/content/finale';
import type { Level, MeterId, Role } from '@/content/types';

export interface JourneyStats {
  /** Roles whose level was passed at least once. */
  rolesMastered: number;
  rolesTotal: number;
  threeStarLevels: number;
  crisesCleared: number;
  /** Simulated development time and cost, shifted by how the timeline meter ended. */
  years: number;
  costBillions: number;
  /** Test Yourself: roles with a ribbon, and whether the player ever opened it. */
  knowledgeRibbons: number;
  knowledgeOpened: boolean;
}

export interface JourneyInput {
  levels: Record<string, { stars: number }>;
  crises: Record<string, { stars: number }>;
  meters: Record<MeterId, number>;
  knowledge: Record<string, { attempts: number; ribbon: boolean }>;
}

/** Pure: everything the finale and certificate show. */
export function journeyStats(p: JourneyInput): JourneyStats {
  const levelRoles = content.levels.filter((l) => (p.levels[l.id]?.stars ?? 0) > 0);
  const { baseYears, baseCostBillions, timelinePivot, yearsPerTimelinePoint, costPerTimelinePoint } =
    finaleContent.journey;
  const drift = timelinePivot - p.meters.timeline; // positive when the timeline meter ended low
  const years = Math.round((baseYears + drift * yearsPerTimelinePoint) * 10) / 10;
  const costBillions = Math.round((baseCostBillions + drift * costPerTimelinePoint) * 100) / 100;
  const knowledge = Object.values(p.knowledge);
  return {
    rolesMastered: new Set(levelRoles.map((l) => l.roleId)).size,
    rolesTotal: content.roleIndex.length,
    threeStarLevels: content.levels.filter((l) => (p.levels[l.id]?.stars ?? 0) === 3).length,
    crisesCleared: content.crises.filter((c) => (p.crises[c.id]?.stars ?? 0) > 0).length,
    years: Math.max(6, years),
    costBillions: Math.max(0.5, costBillions),
    knowledgeRibbons: knowledge.filter((k) => k.ribbon).length,
    knowledgeOpened: knowledge.some((k) => k.attempts > 0),
  };
}

export interface RelayStep {
  role: Role;
  level: Level;
  handoffLine: string;
  /** Artifacts this level emitted, as the player actually produced them. */
  artifacts: { key: string; title: string; tag: string }[];
}

/** The relay chain: every role in play order with its hand-off line and the artifacts it produced. */
export function relayChain(artifacts: Partial<Record<string, StoredArtifact>>): RelayStep[] {
  const steps: RelayStep[] = [];
  for (const world of content.worlds) {
    for (const node of world.nodes) {
      if (node.kind !== 'level') continue;
      const role = content.roleById[node.roleId];
      const level = content.levelById[node.id];
      if (!role || !level) continue;
      const produced = (level.emits ?? [])
        .map((e) => artifacts[e.key])
        .filter((a): a is StoredArtifact => !!a && a.emittedBy === level.id)
        .map((a) => ({ key: a.key, title: artifactRegistry[a.key].title, tag: a.tag }));
      steps.push({ role, level, handoffLine: level.debrief.handoffLine, artifacts: produced });
    }
  }
  return steps;
}
