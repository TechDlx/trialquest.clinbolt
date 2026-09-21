import { useState, type ReactNode } from 'react';
import type { MeterId } from '@/content/types';
import { Hearts, Meters } from '@/components/Hud';
import { PauseIcon } from '@/components/Icons';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { useSettings } from '@/store/settings';

export interface TaskShellProps {
  title: string;
  hearts: number;
  meters: Record<MeterId, number>;
  children: ReactNode;
  paused: boolean;
  onPause: (paused: boolean) => void;
  onQuit: () => void;
  onReadCard?: () => void;
  /** Desktop-only side panel (1280px+): the badge in play and the task's rules. */
  aside?: ReactNode;
}

/** HUD + pause menu shared by every mini-game engine. */
export function TaskShell({
  title,
  hearts,
  meters,
  children,
  paused,
  onPause,
  onQuit,
  onReadCard,
  aside,
}: TaskShellProps) {
  const relaxed = useSettings((s) => s.relaxed);
  const setRelaxed = useSettings((s) => s.setRelaxed);
  const [confirmQuit, setConfirmQuit] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur safe-top">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-1.5 lg:max-w-[1200px] lg:gap-4 lg:px-8">
          <button
            type="button"
            onClick={() => onPause(true)}
            aria-label="Pause"
            data-testid="pause"
            className="tap inline-flex items-center justify-center rounded-xl bg-surface text-fg shadow-card"
          >
            <PauseIcon size={20} />
          </button>
          <h1 className="flex-1 truncate text-sm font-bold sm:text-base">{title}</h1>
          <div className="hidden w-[420px] lg:block">
            <Meters meters={meters} compact />
          </div>
          <Hearts hearts={hearts} />
        </div>
        <div className="mx-auto max-w-3xl px-3 pb-1.5 lg:hidden">
          <Meters meters={meters} compact />
        </div>
      </header>
      <div
        className={`mx-auto w-full max-w-3xl flex-1 lg:max-w-[800px] lg:px-8 ${
          aside ? 'xl:grid xl:max-w-[1200px] xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-8' : ''
        }`}
      >
        <main className="flex min-w-0 flex-col px-3 py-3 pb-8 lg:px-0">{children}</main>
        {aside && (
          <aside className="hidden xl:block" aria-label="Your role">
            <div className="sticky top-24 flex flex-col gap-4 pt-3">{aside}</div>
          </aside>
        )}
      </div>

      <Modal open={paused} title="Paused" onClose={() => onPause(false)}>
        <div className="flex flex-col gap-2">
          <Button onClick={() => onPause(false)} full size="lg" data-testid="resume">
            Resume
          </Button>
          <label className="flex items-center justify-between rounded-2xl border-2 border-border px-4 py-3">
            <span className="font-semibold">Relaxed mode (no timers)</span>
            <input
              type="checkbox"
              checked={relaxed}
              onChange={(e) => setRelaxed(e.target.checked)}
              className="h-6 w-6 accent-brand-600"
            />
          </label>
          {onReadCard && (
            <Button variant="secondary" onClick={onReadCard} full>
              Re-read Role Card
            </Button>
          )}
          {!confirmQuit ? (
            <Button variant="ghost" onClick={() => setConfirmQuit(true)} full>
              Quit to map
            </Button>
          ) : (
            <div className="rounded-2xl bg-surface-2 p-3 text-sm">
              <p>Quit now? This attempt will not count.</p>
              <div className="mt-2 flex gap-2">
                <Button variant="danger" onClick={onQuit} className="flex-1">
                  Quit
                </Button>
                <Button variant="secondary" onClick={() => setConfirmQuit(false)} className="flex-1">
                  Stay
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
