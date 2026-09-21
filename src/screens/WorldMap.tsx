import { useEffect, useMemo, useRef } from 'react';
import type { MapNode, World } from '@/content/types';
import { content, isWorldLoaded } from '@/content';
import { economy, rankForXp } from '@/content/economy';
import { computeMapState, isPlayable, type NodeStatus } from '@/engine/progression';
import { useProgress } from '@/store/progress';
import { useSettings, resolveReducedMotion } from '@/store/settings';
import { Page, Disclaimer } from '@/components/Layout';
import { Hearts, Meters, Stars } from '@/components/Hud';
import { BadgeGlyph } from '@/components/BadgeGlyph';
import { FlagIcon, FlameIcon, LockIcon, RefreshIcon, RibbonIcon, SirenIcon } from '@/components/Icons';
import { Modal } from '@/components/Modal';
import { useState } from 'react';
import { Dose, Speech } from '@/components/Mascot';
import { Button } from '@/components/Button';
import { navigate, type Route } from '@/app/router';

const employerBg: Record<string, string> = {
  sponsor: 'bg-emp-sponsor',
  cro: 'bg-emp-cro',
  site: 'bg-emp-site',
  regulator: 'bg-emp-regulator',
  vendor: 'bg-emp-vendor',
  patient: 'bg-emp-patient',
};

const ROW = 92;
const OFFSETS = [0, 72, 0, -72];

function routeFor(node: MapNode): Route {
  switch (node.kind) {
    case 'level':
      return { name: 'badge', levelId: node.id };
    case 'crisis':
      return { name: 'crisis', crisisId: node.id };
    case 'review':
      return { name: 'review', reviewId: node.id };
    case 'finale':
      return { name: 'finale' };
  }
}

function nodeLabel(node: MapNode): string {
  switch (node.kind) {
    case 'level':
      return content.roleRefById[node.roleId]?.shortTitle ?? node.id;
    case 'crisis':
      return 'Crisis';
    case 'review':
      return 'Review';
    case 'finale':
      return 'Finale';
  }
}

function NodeButton({
  node,
  status,
  stars,
  current,
}: {
  node: MapNode;
  status: NodeStatus;
  stars: number;
  current: boolean;
}) {
  const playable = isPlayable(status);
  const role = node.kind === 'level' ? content.roleRefById[node.roleId] : undefined;
  const label = nodeLabel(node);
  const [sheet, setSheet] = useState(false);
  const ribbon = useProgress((s) => (role ? !!s.knowledge[role.id]?.ribbon : false));
  const legacy = useProgress((s) => (node.kind === 'crisis' ? !!s.crises[node.id]?.legacy : false));
  // Every role has a Test Yourself set; assume so until its world's chunk is loaded.
  const hasTest = !!role && (!isWorldLoaded(role.worldId) || !!content.knowledgeByRole[role.id]);
  const onTap = () => {
    if (status === 'done' && (hasTest || node.kind === 'crisis')) setSheet(true);
    else navigate(routeFor(node));
  };
  const statusText =
    status === 'locked'
      ? 'locked'
      : status === 'planned'
        ? 'coming soon'
        : status === 'done'
          ? `done, ${stars} star${stars === 1 ? '' : 's'}`
          : status === 'current'
            ? 'up next'
            : 'available';

  let face = 'bg-surface text-fg border-4 border-border';
  if (status === 'done')
    face = `${role ? employerBg[role.employer] : 'bg-brand-600'} text-white border-4 border-white/70`;
  else if (status === 'current') face = 'bg-brand-600 text-white border-4 border-brand-200 pulse-ring';
  else if (status === 'available')
    face = 'bg-surface text-brand-700 dark:text-brand-300 border-4 border-brand-500';
  else if (status === 'planned') face = 'bg-surface-2 text-locked border-4 border-dashed border-border';
  else face = 'bg-surface-2 text-locked border-4 border-border';

  const icon =
    node.kind === 'level' && role ? (
      <BadgeGlyph icon={role.badgeIcon} size={28} />
    ) : node.kind === 'crisis' ? (
      <SirenIcon size={28} />
    ) : node.kind === 'review' ? (
      <RefreshIcon size={26} />
    ) : (
      <FlagIcon size={26} />
    );

  return (
    <div className="flex w-32 flex-col items-center gap-1">
      <button
        type="button"
        disabled={!playable}
        onClick={onTap}
        data-testid={`node-${node.id}`}
        data-status={status}
        aria-label={`${label}, ${statusText}`}
        aria-current={current ? 'step' : undefined}
        className={`tap relative flex h-16 w-16 items-center justify-center rounded-full shadow-card transition enabled:active:scale-95 ${face} ${
          playable ? '' : 'cursor-not-allowed'
        }`}
      >
        {icon}
        {status === 'locked' && (
          <span className="absolute -bottom-1 -right-1 rounded-full bg-surface p-0.5 text-locked shadow">
            <LockIcon size={14} />
          </span>
        )}
        {ribbon && (
          <span
            className="absolute -top-1 -right-1 rounded-full bg-surface p-0.5 text-star shadow"
            title="Knowledge Check ribbon"
            data-testid={`ribbon-${node.id}`}
          >
            <RibbonIcon size={14} />
          </span>
        )}
      </button>
      <span className={`text-center text-xs font-semibold leading-tight ${playable ? '' : 'text-muted'}`}>
        {label}
        {legacy && <span className="block text-xs font-normal text-muted">cleared (legacy quiz)</span>}
      </span>
      {status === 'done' && stars > 0 && <Stars stars={stars} size={14} />}
      <Modal open={sheet} title={label} onClose={() => setSheet(false)}>
        <div className="grid gap-2">
          <Button full onClick={() => navigate(routeFor(node))} data-testid="sheet-replay">
            {node.kind === 'crisis'
              ? legacy
                ? 'Play the crisis for stars'
                : 'Replay for more stars'
              : 'Replay for more stars'}
          </Button>
          {hasTest && role && (
            <Button
              variant="secondary"
              full
              onClick={() => navigate({ name: 'test', roleId: role.id })}
              data-testid="sheet-test"
            >
              Test Yourself (optional)
            </Button>
          )}
          <Button variant="ghost" full onClick={() => setSheet(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function WorldSection({
  world,
  status,
  stars,
  currentNodeId,
  unlocked,
  complete,
}: {
  world: World;
  status: Record<string, NodeStatus>;
  stars: (n: MapNode) => number;
  currentNodeId: string | null;
  unlocked: boolean;
  complete: boolean;
}) {
  const n = world.nodes.length;
  const height = n * ROW;
  const points = world.nodes.map((_, i) => ({ x: OFFSETS[i % OFFSETS.length]!, y: i * ROW + 36 }));
  const d = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1]!;
      const my = (prev.y + p.y) / 2;
      return `C ${prev.x} ${my}, ${p.x} ${my}, ${p.x} ${p.y}`;
    })
    .join(' ');

  return (
    <section aria-labelledby={`world-${world.id}`} className="mt-6" data-testid={`world-${world.id}`}>
      <div
        className={`flex items-center gap-3 rounded-card p-3 shadow-card ${unlocked ? 'bg-brand-600 text-white' : 'bg-surface text-muted'}`}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-black">
          {world.number}
        </div>
        <div className="min-w-0 flex-1">
          <h2 id={`world-${world.id}`} className="truncate text-base font-bold">
            {world.title}
          </h2>
          <p className={`truncate text-xs ${unlocked ? 'text-white' : ''}`}>{world.subtitle}</p>
        </div>
        {complete ? (
          <span className="text-xs font-bold">Complete</span>
        ) : !unlocked ? (
          <LockIcon size={20} />
        ) : null}
      </div>

      <div className="relative mx-auto mt-3 w-full max-w-sm" style={{ height }}>
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`-160 0 320 ${height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d={d}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="2 12"
            className="text-border"
          />
        </svg>
        {world.nodes.map((node, i) => {
          const s = status[node.id] ?? 'locked';
          const current = node.id === currentNodeId;
          return (
            <div
              key={node.id}
              className="absolute flex items-start"
              style={{ left: `calc(50% + ${points[i]!.x}px)`, top: i * ROW, transform: 'translateX(-50%)' }}
              data-current={current || undefined}
            >
              <NodeButton node={node} status={s} stars={stars(node)} current={current} />
              {current && (
                <div className="absolute -right-14 top-0 hidden sm:block" aria-hidden="true">
                  <Dose size={56} mood="happy" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function WorldMapScreen({ focusWorldId }: { focusWorldId?: string }) {
  const progress = useProgress();
  const motion = useSettings((s) => s.motion);
  const mapState = useMemo(
    () =>
      computeMapState(content.worlds, {
        levels: progress.levels,
        crises: progress.crises,
        reviews: progress.reviews,
        finaleSeen: progress.finaleSeen,
      }),
    [progress.levels, progress.crises, progress.reviews, progress.finaleSeen],
  );
  const syncHearts = useProgress((s) => s.syncHearts);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    syncHearts();
  }, [syncHearts]);

  useEffect(() => {
    const el =
      (focusWorldId &&
        containerRef.current?.querySelector<HTMLElement>(`[data-testid="world-${focusWorldId}"]`)) ||
      containerRef.current?.querySelector<HTMLElement>('[data-current]');
    if (!el) return;
    const id = window.setTimeout(
      () =>
        el.scrollIntoView({ block: 'center', behavior: resolveReducedMotion(motion) ? 'auto' : 'smooth' }),
      50,
    );
    return () => window.clearTimeout(id);
  }, [focusWorldId, motion]);

  const rank = rankForXp(progress.xp);
  // A promotion is announced on one map visit, then counts as seen, so it never follows the player around.
  const [promotion, setPromotion] = useState(() =>
    rank.current.title !== useProgress.getState().rankSeen ? rank.current.title : null,
  );
  const markRankSeen = useProgress((s) => s.markRankSeen);
  useEffect(() => {
    if (promotion) markRankSeen(promotion);
  }, [promotion, markRankSeen]);
  const currentNode = mapState.currentNodeId
    ? content.worlds.flatMap((w) => w.nodes).find((n) => n.id === mapState.currentNodeId)
    : undefined;
  const currentWorld = mapState.currentWorldId ? content.worldById[mapState.currentWorldId] : undefined;
  const allReadyDone = !currentNode;
  const tipId = 'map-first';
  const showTip = !progress.tipsDismissed[tipId] && Object.keys(progress.levels).length === 0;

  return (
    <Page nav="map">
      <div ref={containerRef}>
        <header className="sticky top-0 z-30 -mx-4 bg-bg/95 px-4 pb-2 pt-1 backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{rank.current.title}</p>
              <p className="text-xs text-muted">
                {progress.xp} XP{rank.next && ` · ${rank.next.xp - progress.xp} to ${rank.next.title}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="inline-flex items-center gap-1 text-sm font-semibold"
                aria-label={`${progress.streak.count} day streak`}
              >
                <FlameIcon size={18} className={progress.streak.count > 0 ? 'text-star' : 'text-locked'} />
                {progress.streak.count}
              </span>
              <Hearts hearts={progress.hearts} />
            </div>
          </div>
          <div className="mt-2">
            <Meters meters={progress.meters} compact />
          </div>
        </header>
        {promotion && (
          <div
            role="status"
            className="mt-3 flex items-center justify-between gap-2 rounded-2xl border-2 border-star bg-star-soft px-3 py-2 text-sm font-bold text-amber-950"
            data-testid="rank-banner"
          >
            <span>Promoted: {promotion}</span>
            <button
              type="button"
              onClick={() => setPromotion(null)}
              className="tap rounded-lg px-2 py-1 text-xs font-semibold"
              aria-label="Dismiss"
            >
              OK
            </button>
          </div>
        )}

        {showTip && (
          <Speech mood="happy" className="mt-3" onDismiss={() => progress.dismissTip(tipId)}>
            This is Maya's journey. Tap the glowing node to put on your first badge.
          </Speech>
        )}

        {currentNode && currentWorld && (
          <Button
            size="lg"
            full
            className="mt-3"
            onClick={() => navigate(routeFor(currentNode))}
            data-testid="continue-current"
          >
            {currentNode.kind === 'crisis' ? 'Face the crisis' : `Next: ${nodeLabel(currentNode)}`}
          </Button>
        )}
        {allReadyDone && (
          <div className="mt-3 rounded-card bg-surface p-4 text-sm shadow-card">
            <p className="font-bold">You have finished everything that is built so far.</p>
            <p className="mt-1 text-muted">
              Worlds 2 to 8 are coming in the next milestones. Replay any node for more stars meanwhile.
            </p>
          </div>
        )}

        {content.worlds.map((world) => (
          <WorldSection
            key={world.id}
            world={world}
            status={mapState.nodeStatus}
            currentNodeId={mapState.currentNodeId}
            unlocked={mapState.worldUnlocked[world.id] ?? false}
            complete={mapState.worldComplete[world.id] ?? false}
            stars={(n) =>
              n.kind === 'level'
                ? (progress.levels[n.id]?.stars ?? 0)
                : n.kind === 'crisis'
                  ? (progress.crises[n.id]?.stars ?? 0)
                  : 0
            }
          />
        ))}
        <p className="mt-6 text-center text-xs text-muted">
          Hearts refill 1 every {economy.hearts.refillMinutes} minutes, or review a Role Card in the Codex.
        </p>
        <Disclaimer className="mt-3" />
      </div>
    </Page>
  );
}
