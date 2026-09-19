import type { MapNode, World } from '@/content/types';

export type NodeStatus = 'locked' | 'current' | 'available' | 'done' | 'planned';

export interface ProgressSnapshot {
  levels: Record<string, { stars: number }>;
  bosses: Record<string, { stars: number }>;
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
    case 'boss':
      return (p.bosses[node.id]?.stars ?? 0) > 0;
    case 'review':
      return (p.reviews[node.id]?.count ?? 0) > 0;
    case 'finale':
      return !!p.finaleSeen;
  }
}

/**
 * Derives the status of every node on the map.
 * Rules: worlds unlock in order once the previous boss is done. Within a world, level
 * and boss nodes unlock in order; the boss needs every level. Review nodes are optional:
 * available as soon as the node before them is done, never blocking.
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
    const boss = world.nodes.find((n) => n.kind === 'boss');
    const complete = !!boss && isDone(boss, p);
    worldComplete[world.id] = complete;

    let previousRequiredDone = true;
    world.nodes.forEach((node) => {
      const done = isDone(node, p);
      if (!unlocked) {
        nodeStatus[node.id] = 'locked';
        return;
      }
      if (world.status === 'planned' && !done) {
        nodeStatus[node.id] = 'planned';
        return;
      }
      if (node.kind === 'review') {
        nodeStatus[node.id] = done ? 'done' : previousRequiredDone ? 'available' : 'locked';
        return;
      }
      if (done) {
        nodeStatus[node.id] = 'done';
      } else if (previousRequiredDone && currentNodeId === null) {
        nodeStatus[node.id] = 'current';
        currentNodeId = node.id;
        currentWorldId = world.id;
      } else {
        nodeStatus[node.id] = 'locked';
      }
      previousRequiredDone = previousRequiredDone && done;
    });

    previousWorldComplete = complete;
  }

  return { nodeStatus, worldUnlocked, worldComplete, currentNodeId, currentWorldId };
}

export function isPlayable(status: NodeStatus): boolean {
  return status === 'current' || status === 'available' || status === 'done';
}
