import { motion } from 'framer-motion';
import type { StoryBeat } from '@/content/types';
import { Button } from '@/components/Button';
import { Maya } from '@/components/Maya';
import { RichText } from '@/components/RichText';
import { Speech } from '@/components/Mascot';
import { content } from '@/content';
import { navigate } from '@/app/router';
import { useProgress } from '@/store/progress';
import { endSegment } from '@/engine/timing';

export function StoryBeatView({
  beat,
  kicker,
  cta,
  onContinue,
  doseLine,
  testId,
  skippable,
}: {
  beat: StoryBeat;
  kicker: string;
  cta: string;
  onContinue: () => void;
  doseLine?: string;
  testId?: string;
  skippable?: boolean;
}) {
  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 py-6 safe-top safe-bottom"
      data-testid={testId}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-brand-700 dark:text-brand-300">{kicker}</p>
      <h1 className="mt-1 text-2xl font-black">{beat.title}</h1>
      <div className="mt-4 flex items-center gap-3 rounded-card bg-surface p-3 shadow-card">
        <Maya size={64} />
        <div>
          <p className="text-sm font-bold">Maya</p>
          <p className="text-sm text-muted">{beat.mayaStatus}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-1 flex-col gap-3">
        {beat.paragraphs.map((p, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 * i, duration: 0.3 }}
            className="text-base leading-relaxed"
          >
            <RichText text={p} />
          </motion.p>
        ))}
        {doseLine && (
          <Speech mood="happy" className="mt-2">
            {doseLine}
          </Speech>
        )}
      </div>
      <Button size="lg" full onClick={onContinue} className="mt-6" data-testid="story-continue">
        {cta}
      </Button>
      {skippable && (
        <Button variant="ghost" onClick={onContinue} className="mt-1" data-testid="story-skip">
          Skip
        </Button>
      )}
    </div>
  );
}

export function IntroScreen() {
  const setIntroSeen = useProgress((s) => s.setIntroSeen);
  const world = content.worldById.w1!;
  return (
    <StoryBeatView
      beat={world.intro}
      kicker="Prologue"
      cta="Start World 1"
      testId="intro"
      skippable
      doseLine="Hi, I'm Dose. I'll be with you on every job. Tap any underlined word for a quick definition."
      onContinue={() => {
        setIntroSeen();
        endSegment('intro');
        navigate({ name: 'map', worldId: 'w1' });
      }}
    />
  );
}

export function StoryScreen({ worldId, beat }: { worldId: string; beat: 'intro' | 'outro' }) {
  const world = content.worldById[worldId];
  if (!world) {
    navigate({ name: 'map' }, true);
    return null;
  }
  const next = content.worlds.find((w) => w.number === world.number + 1);
  return (
    <StoryBeatView
      beat={beat === 'intro' ? world.intro : world.outro}
      kicker={beat === 'intro' ? `World ${world.number}` : `End of World ${world.number}`}
      cta={beat === 'outro' && next ? `On to World ${next.number}` : 'Back to the map'}
      testId={`story-${beat}`}
      onContinue={() => navigate({ name: 'map', worldId: beat === 'outro' && next ? next.id : world.id })}
    />
  );
}
