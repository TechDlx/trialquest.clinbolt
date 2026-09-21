import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { StoryBeat } from '@/content/types';
import { Button } from '@/components/Button';
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/Icons';
import { Maya, MayaPortrait } from '@/components/Maya';
import { RichText } from '@/components/RichText';
import { Speech } from '@/components/Mascot';
import { content } from '@/content';
import { href, navigate, type Route } from '@/app/router';
import { useProgress } from '@/store/progress';
import { endSegment } from '@/engine/timing';

/**
 * The prologue's room: a window behind her and a poster she has kept. Fixed colours,
 * because this is a picture rather than a themed surface. The poster sits clear of her
 * silhouette, so widen it rather than her if the wording ever changes.
 */
function PrologueScene({ status }: { status: string }) {
  return (
    <div className="relative mx-auto w-full max-w-[350px] overflow-hidden rounded-card shadow-card">
      <svg viewBox="0 0 350 210" className="block h-auto w-full" aria-hidden="true">
        <rect width="350" height="210" fill="#fdf6e3" />
        <rect x="244" y="10" width="98" height="88" rx="8" fill="#fffbe6" stroke="#e7d9a6" strokeWidth="3" />
        <path d="M293 10v88M244 54h98" stroke="#e7d9a6" strokeWidth="3" />
        <g transform="rotate(-5 82 56)">
          <rect
            x="12"
            y="14"
            width="140"
            height="84"
            rx="6"
            fill="#ffffff"
            stroke="#e2e8f0"
            strokeWidth="2"
          />
          <g fill="#334155" fontSize="13" fontStyle="italic" fontWeight="600">
            <text x="24" y="42">
              More understanding,
            </text>
            <text x="24" y="61">
              a brighter
            </text>
            <text x="24" y="80">
              tomorrow
            </text>
          </g>
        </g>
        <path d="M330 206c-10-26 2-48 20-56-4 26-6 44-12 56z" fill="#6ee7b7" />
        <path d="M314 206c-6-22 6-42 24-48-8 18-12 32-12 48z" fill="#34d399" />
      </svg>
      <MayaPortrait className="absolute bottom-0 max-w-none" style={{ left: '45%', width: '44%' }} />
      <p className="absolute bottom-3 left-3 rounded-xl bg-surface px-3 py-2 shadow-card">
        <span className="block text-[15px] font-extrabold">Maya, 29</span>
        <span className="block text-xs text-muted">{status}</span>
      </p>
    </div>
  );
}

export function StoryBeatView({
  beat,
  kicker,
  cta,
  onContinue,
  doseLine,
  doseLabel,
  testId,
  skippable,
  skipLabel = 'Skip',
  back,
  scene,
}: {
  beat: StoryBeat;
  kicker: string;
  cta: string;
  onContinue: () => void;
  doseLine?: string;
  doseLabel?: string;
  testId?: string;
  skippable?: boolean;
  skipLabel?: string;
  /** Shows a back link beside the kicker. */
  back?: Route;
  /** Replaces the small Maya row with a full illustration. */
  scene?: ReactNode;
}) {
  const kickerText = (
    <p className="text-xs font-extrabold uppercase tracking-wide text-brand-700 dark:text-brand-300">
      {kicker}
    </p>
  );
  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 py-4 safe-top safe-bottom"
      data-testid={testId}
    >
      {back ? (
        <div className="flex items-center justify-between">
          <a
            href={href(back)}
            aria-label="Back"
            className="tap -ml-2 inline-flex items-center justify-center rounded-xl text-fg"
          >
            <ArrowLeftIcon size={26} />
          </a>
          {kickerText}
          <span className="w-9" />
        </div>
      ) : (
        kickerText
      )}
      <h1 className="mt-1 text-[clamp(2rem,10vw,2.75rem)] font-black leading-[1.05] tracking-tight text-brand-800 dark:text-fg">
        {beat.title}
      </h1>

      {scene ?? (
        <div className="mt-4 flex items-center gap-3 rounded-card bg-surface p-3 shadow-card">
          <Maya size={64} />
          <div>
            <p className="text-sm font-bold">Maya</p>
            <p className="text-sm text-muted">{beat.mayaStatus}</p>
          </div>
        </div>
      )}

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
          <Speech mood="happy" className="mt-2" {...(doseLabel ? { label: doseLabel } : {})}>
            {doseLine}
          </Speech>
        )}
      </div>

      <Button size="lg" full onClick={onContinue} className="mt-6" data-testid="story-continue">
        {cta}
        <ArrowRightIcon size={20} />
      </Button>
      {skippable && (
        <Button variant="ghost" onClick={onContinue} className="mt-1" data-testid="story-skip">
          {skipLabel}
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
      skipLabel="Skip intro"
      back={{ name: 'title' }}
      scene={
        <div className="mt-4">
          <PrologueScene status={world.intro.mayaStatus} />
        </div>
      }
      doseLabel="Dose · your guide"
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
      cta={
        beat === 'outro' && next
          ? `On to World ${next.number}`
          : beat === 'outro'
            ? 'See the finale'
            : 'Back to the map'
      }
      testId={`story-${beat}`}
      onContinue={() => {
        if (beat === 'outro' && !next) navigate({ name: 'finale' });
        else navigate({ name: 'map', worldId: beat === 'outro' && next ? next.id : world.id });
      }}
    />
  );
}
