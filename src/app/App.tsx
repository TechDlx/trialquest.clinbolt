import { lazy, Suspense, useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { navigate, useRoute } from './router';
import { isLockedRoute } from './gate';
import { useSettings, resolveTheme } from '@/store/settings';
import { useProgress } from '@/store/progress';
import { TitleScreen } from '@/screens/Title';
import { IntroScreen, StoryScreen } from '@/screens/StoryBeat';
import { WorldMapScreen } from '@/screens/WorldMap';
import { BadgeSwapScreen } from '@/screens/BadgeSwap';
import { RoleCardScreen } from '@/screens/RoleCard';
import { LevelScreen } from '@/screens/Level';
import { CrisisScreen } from '@/screens/Crisis';
import { Page, TopBar } from '@/components/Layout';
import { Button } from '@/components/Button';
import { LockIcon } from '@/components/Icons';
import { ContentGate } from '@/components/ContentGate';
import { content, worldIdOf, worldsOfRoles } from '@/content';
import type { WorldId } from '@/content/types';

const ALL_WORLDS = content.worlds.map((w) => w.id);
const roleWorld = (roleId?: string): WorldId | undefined =>
  roleId ? content.roleRefById[roleId]?.worldId : undefined;
/** Worlds whose cards the player has collected (Codex, Handoff map, hearts sheet). */
const viewedWorlds = (): WorldId[] => worldsOfRoles(Object.keys(useProgress.getState().cardsViewed));
/** A review replays situations from any world the player has been wrong in. */
const reviewWorlds = (reviewId: string): (WorldId | undefined)[] => [
  worldIdOf(reviewId),
  ...new Set(Object.keys(useProgress.getState().situations).map((k) => worldIdOf(k.split(':')[0]))),
];

// Screens off the main play loop load on demand, keeping the first paint small.
const TestYourselfScreen = lazy(() =>
  import('@/screens/TestYourself').then((m) => ({ default: m.TestYourselfScreen })),
);
const ReviewNodeScreen = lazy(() =>
  import('@/screens/ReviewNode').then((m) => ({ default: m.ReviewNodeScreen })),
);
const CodexScreen = lazy(() => import('@/screens/Codex').then((m) => ({ default: m.CodexScreen })));
const GlossaryScreen = lazy(() => import('@/screens/Glossary').then((m) => ({ default: m.GlossaryScreen })));
const HandoffScreen = lazy(() => import('@/screens/Handoff').then((m) => ({ default: m.HandoffScreen })));
const SettingsScreen = lazy(() => import('@/screens/Settings').then((m) => ({ default: m.SettingsScreen })));
const LabScreen = lazy(() => import('@/screens/Lab').then((m) => ({ default: m.LabScreen })));
const FinaleScreen = lazy(() => import('@/screens/Finale').then((m) => ({ default: m.FinaleScreen })));

function Loading() {
  return (
    <Page nav="map">
      <p className="mt-8 text-center text-sm text-muted" role="status">
        Loading…
      </p>
    </Page>
  );
}

/** Shown for a deep link to a node the map has not unlocked yet. */
function LockedScreen() {
  return (
    <Page nav="map">
      <TopBar title="Not unlocked yet" back={{ name: 'map' }} />
      <div className="mt-4 flex flex-col items-center gap-3 rounded-card bg-surface p-6 text-center shadow-card">
        <LockIcon size={32} className="text-locked" />
        <p className="font-bold">This part of the journey is still locked.</p>
        <p className="text-sm text-muted">Follow the path on the map to reach it.</p>
        <Button full onClick={() => navigate({ name: 'map' })} data-testid="locked-to-map">
          Back to the map
        </Button>
      </div>
    </Page>
  );
}

function useDocumentSettings() {
  const theme = useSettings((s) => s.theme);
  const motion = useSettings((s) => s.motion);
  const textSize = useSettings((s) => s.textSize);
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => root.setAttribute('data-theme', resolveTheme(theme));
    apply();
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    mq?.addEventListener?.('change', apply);
    return () => mq?.removeEventListener?.('change', apply);
  }, [theme]);
  useEffect(() => {
    const root = document.documentElement;
    if (motion === 'reduce') root.setAttribute('data-motion', 'reduce');
    else root.removeAttribute('data-motion');
  }, [motion]);
  useEffect(() => {
    document.documentElement.setAttribute('data-text', textSize);
  }, [textSize]);
}

function useHeartSync() {
  const syncHearts = useProgress((s) => s.syncHearts);
  useEffect(() => {
    syncHearts();
    const onVis = () => {
      if (document.visibilityState === 'visible') syncHearts();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [syncHearts]);
}

export function App() {
  const route = useRoute();
  const motionSetting = useSettings((s) => s.motion);
  useDocumentSettings();
  useHeartSync();
  const gateProgress = useProgress(
    useShallow((s) => ({
      levels: s.levels,
      crises: s.crises,
      reviews: s.reviews,
      finaleSeen: s.finaleSeen,
      cardsViewed: s.cardsViewed,
    })),
  );

  const reduced = motionSetting === 'reduce' ? 'always' : motionSetting === 'full' ? 'never' : 'user';

  let screen: React.ReactNode;
  if (isLockedRoute(route, gateProgress)) screen = <LockedScreen />;
  else
    switch (route.name) {
      case 'title':
        screen = <TitleScreen />;
        break;
      case 'intro':
        screen = <IntroScreen />;
        break;
      case 'map':
        screen = <WorldMapScreen focusWorldId={route.worldId} />;
        break;
      case 'badge':
        screen = (
          <ContentGate worlds={[worldIdOf(route.levelId)]}>
            <BadgeSwapScreen levelId={route.levelId} />
          </ContentGate>
        );
        break;
      case 'role':
        screen = (
          <ContentGate worlds={[roleWorld(route.roleId), worldIdOf(route.levelId)]}>
            <RoleCardScreen roleId={route.roleId} levelId={route.levelId} />
          </ContentGate>
        );
        break;
      case 'level':
        screen = (
          <ContentGate worlds={[worldIdOf(route.levelId), ...viewedWorlds()]}>
            <LevelScreen key={route.levelId} levelId={route.levelId} />
          </ContentGate>
        );
        break;
      case 'crisis':
        screen = (
          <ContentGate worlds={[worldIdOf(route.crisisId)]}>
            <CrisisScreen key={route.crisisId} crisisId={route.crisisId} />
          </ContentGate>
        );
        break;
      case 'test':
        screen = (
          <ContentGate worlds={[roleWorld(route.roleId), route.worldId as WorldId | undefined]}>
            <TestYourselfScreen
              key={route.roleId ?? route.worldId}
              roleId={route.roleId}
              worldId={route.worldId}
            />
          </ContentGate>
        );
        break;
      case 'review':
        screen = (
          <ContentGate worlds={reviewWorlds(route.reviewId)}>
            <ReviewNodeScreen key={route.reviewId} reviewId={route.reviewId} />
          </ContentGate>
        );
        break;
      case 'story':
        screen = <StoryScreen worldId={route.worldId} beat={route.beat} />;
        break;
      case 'codex':
        screen = (
          <ContentGate worlds={[...viewedWorlds(), roleWorld(route.roleId)]}>
            <CodexScreen roleId={route.roleId} />
          </ContentGate>
        );
        break;
      case 'glossary':
        screen = <GlossaryScreen termId={route.termId} />;
        break;
      case 'handoff':
        screen = (
          <ContentGate worlds={viewedWorlds()}>
            <HandoffScreen />
          </ContentGate>
        );
        break;
      case 'finale':
        screen = (
          <ContentGate worlds={ALL_WORLDS}>
            <FinaleScreen />
          </ContentGate>
        );
        break;
      case 'settings':
        screen = <SettingsScreen />;
        break;
      case 'lab':
        screen = <LabScreen />;
        break;
      default:
        screen = (
          <Page nav="map">
            <TopBar title="Page not found" back={{ name: 'map' }} />
            <p className="text-sm text-muted">Nothing lives at {route.path}.</p>
          </Page>
        );
    }

  return (
    <MotionConfig reducedMotion={reduced}>
      <Suspense fallback={<Loading />}>{screen}</Suspense>
    </MotionConfig>
  );
}
