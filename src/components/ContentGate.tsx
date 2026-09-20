import { useEffect, useState, type ReactNode } from 'react';
import type { WorldId } from '@/content/types';
import { isWorldLoaded, loadWorlds } from '@/content';
import { Page } from './Layout';

/** True once every listed world's content chunk is registered; kicks off the loads otherwise. */
export function useWorldContent(ids: (WorldId | undefined)[]): boolean {
  const key = ids.filter((w): w is WorldId => !!w).join(',');
  const need = key ? (key.split(',') as WorldId[]) : [];
  const ready = need.every(isWorldLoaded);
  const [, bump] = useState(0);
  useEffect(() => {
    if (ready) return;
    let alive = true;
    void loadWorlds(key ? (key.split(',') as WorldId[]) : []).then(() => {
      if (alive) bump((n) => n + 1);
    });
    return () => {
      alive = false;
    };
  }, [key, ready]);
  return ready;
}

/** Renders its children only when the worlds they read from are loaded. */
export function ContentGate({ worlds, children }: { worlds: (WorldId | undefined)[]; children: ReactNode }) {
  const ready = useWorldContent(worlds);
  if (!ready)
    return (
      <Page nav="map">
        <p className="mt-8 text-center text-sm text-muted" role="status" data-testid="content-loading">
          Loading…
        </p>
      </Page>
    );
  return <>{children}</>;
}
