import { useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { useRoute } from './router';
import { useSettings, resolveTheme } from '@/store/settings';
import { useProgress } from '@/store/progress';
import { TitleScreen } from '@/screens/Title';
import { IntroScreen, StoryScreen } from '@/screens/StoryBeat';
import { WorldMapScreen } from '@/screens/WorldMap';
import { BadgeSwapScreen } from '@/screens/BadgeSwap';
import { RoleCardScreen } from '@/screens/RoleCard';
import { LevelScreen } from '@/screens/Level';
import { CrisisScreen } from '@/screens/Crisis';
import { TestYourselfScreen } from '@/screens/TestYourself';
import { ReviewNodeScreen } from '@/screens/ReviewNode';
import { CodexScreen } from '@/screens/Codex';
import { GlossaryScreen } from '@/screens/Glossary';
import { HandoffScreen } from '@/screens/Handoff';
import { SettingsScreen } from '@/screens/Settings';
import { LabScreen } from '@/screens/Lab';
import { Page, TopBar } from '@/components/Layout';

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

  const reduced = motionSetting === 'reduce' ? 'always' : motionSetting === 'full' ? 'never' : 'user';

  let screen: React.ReactNode;
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
      screen = <BadgeSwapScreen levelId={route.levelId} />;
      break;
    case 'role':
      screen = <RoleCardScreen roleId={route.roleId} levelId={route.levelId} />;
      break;
    case 'level':
      screen = <LevelScreen key={route.levelId} levelId={route.levelId} />;
      break;
    case 'crisis':
      screen = <CrisisScreen key={route.crisisId} crisisId={route.crisisId} />;
      break;
    case 'test':
      screen = (
        <TestYourselfScreen
          key={route.roleId ?? route.worldId}
          roleId={route.roleId}
          worldId={route.worldId}
        />
      );
      break;
    case 'review':
      screen = <ReviewNodeScreen key={route.reviewId} reviewId={route.reviewId} />;
      break;
    case 'story':
      screen = <StoryScreen worldId={route.worldId} beat={route.beat} />;
      break;
    case 'codex':
      screen = <CodexScreen roleId={route.roleId} />;
      break;
    case 'glossary':
      screen = <GlossaryScreen termId={route.termId} />;
      break;
    case 'handoff':
      screen = <HandoffScreen />;
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

  return <MotionConfig reducedMotion={reduced}>{screen}</MotionConfig>;
}
