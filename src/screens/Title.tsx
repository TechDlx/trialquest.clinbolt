import { Button } from '@/components/Button';
import { Dose } from '@/components/Mascot';
import { Disclaimer } from '@/components/Layout';
import { navigate } from '@/app/router';
import { useProgress } from '@/store/progress';
import { rankForXp } from '@/content/economy';

export function TitleScreen() {
  const introSeen = useProgress((s) => s.introSeen);
  const xp = useProgress((s) => s.xp);
  const levelsDone = useProgress((s) => Object.values(s.levels).filter((l) => l.stars > 0).length);
  const hasProgress = introSeen || levelsDone > 0;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-between px-6 py-8 text-center safe-top safe-bottom">
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Dose size={140} mood="cheer" />
        <h1 className="text-4xl font-black tracking-tight text-brand-700 dark:text-brand-300">Trial Quest</h1>
        <p className="max-w-xs text-base text-muted">
          Work every job it takes to turn a molecule into a medicine, and get Maya the treatment she needs.
        </p>
        <ul className="mt-2 grid max-w-xs gap-1.5 text-left text-sm">
          <li className="rounded-xl bg-surface px-3 py-2 shadow-card">🪪 Put on 44 different ID badges</li>
          <li className="rounded-xl bg-surface px-3 py-2 shadow-card">
            ⏱️ Play 1-3 minute tasks that mimic real work
          </li>
          <li className="rounded-xl bg-surface px-3 py-2 shadow-card">
            🧠 Learn the hand-offs, the jargon, and the trade-offs
          </li>
        </ul>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        {hasProgress ? (
          <>
            <Button size="lg" full onClick={() => navigate({ name: 'map' })} data-testid="continue">
              Continue · {rankForXp(xp).current.title} · {xp} XP
            </Button>
            <Button variant="ghost" onClick={() => navigate({ name: 'intro' })}>
              Replay the intro
            </Button>
          </>
        ) : (
          <Button size="lg" full onClick={() => navigate({ name: 'intro' })} data-testid="play">
            Play
          </Button>
        )}
        <Disclaimer />
      </div>
    </div>
  );
}
