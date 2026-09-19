import type { MapNode, World } from '@/content/types';

export type NodeStatus = 'locked' | 'current' | 'available' | 'done' | 'planned';

export interface ProgressSnapshot {
  levels: Record<string, { stars: number }>;
  crises: Record<string, { stars: number }>;
  reviews: Record<string, { count: number }>;
  finaleSeen?: boolean;
}

export interface MapState {
  nodeStatus: Record<string, NodeStatus>;
  worldUnlocked: Record<string, boolean>;
  worldComplete: Record<string, boolean>;
  currentNodeId: string | null;
  currentWorldId: string | null;
}

function isDone(node: MapNode, p: ProgressSnapshot): boolean {
  switch (node.kind) {
    case 'level':
      return (p.levels[node.id]?.stars ?? 0) > 0;
    case 'crisis':
      return (p.crises[node.id]?.stars ?? 0) > 0;
    case 'review':
      return (p.reviews[node.id]?.count ?? 0) > 0;
    case 'finale':
      return !!p.finaleSeen;
  }
}

/**
 * Worlds unlock in order once the previous crisis is done. Within a world, level and crisis
 * nodes unlock in order; the crisis needs every level. Review nodes are optional.
 */
export function computeMapState(worlds: World[], p: ProgressSnapshot): MapState {
  const nodeStatus: Record<string, NodeStatus> = {};
  const worldUnlocked: Record<string, boolean> = {};
  const worldComplete: Record<string, boolean> = {};
  let currentNodeId: string | null = null;
  let currentWorldId: string | null = null;
  let previousWorldComplete = true;

  for (const world of worlds) {
    const unlocked = previousWorldComplete;
    worldUnlocked[world.id] = unlocked;
    const crisis = world.nodes.find((n) => n.kind === 'crisis');
    const complete = !!crisis && isDone(crisis, p);
    worldComplete[world.id] = complete;

    let previousRequiredDone = true;
    for (const node of world.nodes) {
      const done = isDone(node, p);
      if (!unlocked) {
        nodeStatus[node.id] = 'locked';
        continue;
      }
      if (world.status === 'planned' && !done) {
        nodeStatus[node.id] = 'planned';
        continue;
      }
      if (node.kind === 'review') {
        nodeStatus[node.id] = done ? 'done' : previousRequiredDone ? 'available' : 'locked';
        continue;
      }
      if (done) nodeStatus[node.id] = 'done';
      else if (previousRequiredDone && currentNodeId === null) {
        nodeStatus[node.id] = 'current';
        currentNodeId = node.id;
        currentWorldId = world.id;
      } else nodeStatus[node.id] = 'locked';
      previousRequiredDone = previousRequiredDone && done;
    }
    previousWorldComplete = complete;
  }
  return { nodeStatus, worldUnlocked, worldComplete, currentNodeId, currentWorldId };
}

export function isPlayable(status: NodeStatus): boolean {
  return status === 'current' || status === 'available' || status === 'done';
}
