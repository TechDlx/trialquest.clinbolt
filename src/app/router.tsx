import { useCallback, useEffect, useState } from 'react';
import { trackScreen } from './analytics';

/**
 * Tiny hash router. Routes look like "#/level/w1-l1". Hash routing works on any static
 * host (GitHub Pages, Netlify) without rewrite rules and keeps the PWA scope simple.
 */
export type Route =
  | { name: 'title' }
  | { name: 'intro' }
  | { name: 'map'; worldId?: string }
  | { name: 'badge'; levelId: string }
  | { name: 'role'; roleId: string; levelId?: string }
  | { name: 'level'; levelId: string }
  | { name: 'crisis'; crisisId: string }
  | { name: 'test'; roleId?: string; worldId?: string }
  | { name: 'review'; reviewId: string }
  | { name: 'story'; worldId: string; beat: 'intro' | 'outro' }
  | { name: 'codex'; roleId?: string }
  | { name: 'glossary'; termId?: string }
  | { name: 'handoff' }
  | { name: 'finale' }
  | { name: 'settings' }
  | { name: 'lab' }
  | { name: 'notfound'; path: string };

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '').replace(/^\/+/, '');
  const [head, a, b] = path.split('/').map((s) => decodeURIComponent(s));
  const query = new URLSearchParams(path.split('?')[1] ?? '');
  switch (head ?? '') {
    case '':
      return { name: 'title' };
    case 'intro':
      return { name: 'intro' };
    case 'map':
      return a ? { name: 'map', worldId: a.split('?')[0] } : { name: 'map' };
    case 'badge':
      return a ? { name: 'badge', levelId: a } : { name: 'map' };
    case 'role': {
      if (!a) return { name: 'codex' };
      const roleId = a.split('?')[0]!;
      const levelId = query.get('level') ?? undefined;
      return levelId ? { name: 'role', roleId, levelId } : { name: 'role', roleId };
    }
    case 'level':
      return a ? { name: 'level', levelId: a } : { name: 'map' };
    case 'crisis':
      return a ? { name: 'crisis', crisisId: a } : { name: 'map' };
    case 'test':
      if (a === 'world' && b) return { name: 'test', worldId: b };
      return a ? { name: 'test', roleId: a } : { name: 'codex' };
    case 'review':
      return a ? { name: 'review', reviewId: a } : { name: 'map' };
    case 'story':
      return a && (b === 'intro' || b === 'outro') ? { name: 'story', worldId: a, beat: b } : { name: 'map' };
    case 'codex':
      return a ? { name: 'codex', roleId: a } : { name: 'codex' };
    case 'glossary':
      return a ? { name: 'glossary', termId: a } : { name: 'glossary' };
    case 'handoff':
      return { name: 'handoff' };
    case 'finale':
      return { name: 'finale' };
    case 'settings':
      return { name: 'settings' };
    case 'lab':
      return { name: 'lab' };
    default:
      return { name: 'notfound', path };
  }
}

export function href(route: Route): string {
  switch (route.name) {
    case 'title':
      return '#/';
    case 'intro':
      return '#/intro';
    case 'map':
      return route.worldId ? `#/map/${route.worldId}` : '#/map';
    case 'badge':
      return `#/badge/${route.levelId}`;
    case 'role':
      return route.levelId ? `#/role/${route.roleId}?level=${route.levelId}` : `#/role/${route.roleId}`;
    case 'level':
      return `#/level/${route.levelId}`;
    case 'crisis':
      return `#/crisis/${route.crisisId}`;
    case 'test':
      return route.worldId ? `#/test/world/${route.worldId}` : `#/test/${route.roleId}`;
    case 'review':
      return `#/review/${route.reviewId}`;
    case 'story':
      return `#/story/${route.worldId}/${route.beat}`;
    case 'codex':
      return route.roleId ? `#/codex/${route.roleId}` : '#/codex';
    case 'glossary':
      return route.termId ? `#/glossary/${route.termId}` : '#/glossary';
    case 'handoff':
      return '#/handoff';
    case 'finale':
      return '#/finale';
    case 'settings':
      return '#/settings';
    case 'lab':
      return '#/lab';
    case 'notfound':
      return `#/${route.path}`;
  }
}

export function navigate(route: Route, replace = false): void {
  const target = href(route);
  if (replace) {
    const url = `${window.location.pathname}${window.location.search}${target}`;
    window.history.replaceState(null, '', url);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = target;
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  const onChange = useCallback(() => setRoute(parseHash(window.location.hash)), []);
  useEffect(() => {
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, [onChange]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
    // Every screen, now and future, goes through here, so each one is counted once.
    trackScreen(route);
  }, [route]);
  return route;
}
