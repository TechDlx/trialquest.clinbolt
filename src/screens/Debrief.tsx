import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Mistake, ShortcutEvent, Stars as StarCount, XpBreakdown } from '@/engine/scoring';
import type { StoredArtifact } from '@/content/artifacts';
import { artifactRegistry } from '@/content/artifacts';
import type { StoryBeat } from '@/content/types';
import { Stars } from '@/components/Hud';
import { Button } from '@/components/Button';
import { RichText } from '@/components/RichText';
import { Speech } from '@/components/Mascot';
import { Maya } from '@/components/Maya';
import { useEffect } from 'react';
import { playSound } from '@/engine/sound';

/** Mistakes shown before "See all". */
export const TOP_MISTAKES = 2;

export interface DebriefProps {
  kind: 'level' | 'boss' | 'review';
  title: string;
  stars: StarCount;
  score: number;
  xp: XpBreakdown;
  learned?: string;
  handoffLine?: string;
  /** The cameo reveal: which item in the task was Maya. */
  mayaLine?: string;
  mistakes: Mistake[];
  shortcuts?: ShortcutEvent[];
  artifacts?: StoredArtifact[];
  /** Crisis resolution: a story beat rendered above the results. */
  story?: StoryBeat;
  correct: number;
  total: number;
  failed: boolean;
  failReason?: string;
  canRetry: boolean;
  /** Review nodes have no retry. */
  hideRetry?: boolean;
  /** What "N of M" counts: "correct" for levels, "rounds cleared" for a crisis. */
  countLabel?: string;
  onContinue: () => void;
  onRetry: () => void;
  onReadCard?: () => void;
  continueLabel?: string;
}

export function Debrief(p: DebriefProps) {
  useEffect(() => {
    if (!p.failed && p.stars > 0) playSound('star');
  }, [p.failed, p.stars]);
  const [showAll, setShowAll] = useState(false);
  const doseLine = p.failed
    ? (p.failReason ?? 'Out of hearts. Read the consequences below, then try again when a heart is back.')
    : p.stars === 3 && p.mistakes.length === 0
      ? 'Perfect. That is exactly how the pros do it.'
      : p.stars >= 2
        ? 'Solid work. One more pass would make it perfect.'
        : 'You got through. Check the consequences below so next time is cleaner.';
  const visibleMistakes = showAll ? p.mistakes : p.mistakes.slice(0, TOP_MISTAKES);

  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-6 safe-top safe-bottom"
      data-testid="debrief"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-brand-700 dark:text-brand-300">
        {p.story ? 'Resolution' : p.failed ? 'Setback' : 'Debrief'}
      </p>
      <h1 className="mt-1 text-2xl font-black">{p.story ? p.story.title : p.title}</h1>

      {p.story && (
        <div className="mt-3 rounded-card bg-surface p-3 shadow-card">
          <div className="flex items-center gap-3">
            <Maya size={56} />
            <div>
              <p className="text-sm font-bold">Maya</p>
              <p className="text-sm text-muted">{p.story.mayaStatus}</p>
            </div>
          </div>
          {p.story.paragraphs.map((t, i) => (
            <RichText key={i} as="p" text={t} className="mt-2 text-sm leading-relaxed" />
          ))}
        </div>
      )}

      <div className="mt-4 rounded-card bg-surface p-4 text-center shadow-card">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 14 }}
        >
          <Stars stars={p.stars} size={40} />
        </motion.div>
        <p className="mt-1 text-sm text-muted" data-testid="debrief-score">
          {p.correct} of {p.total} {p.countLabel ?? 'correct'} · score {p.score}
        </p>
        {p.xp.total > 0 && (
          <ul className="mt-3 grid gap-1 text-sm" aria-label="XP earned">
            {p.xp.lines.map((l) => (
              <li key={l.label} className="flex justify-between">
                <span>{l.label}</span>
                <span className="font-bold tabular-nums">+{l.xp} XP</span>
              </li>
            ))}
            <li
              className="mt-1 flex justify-between border-t border-border pt-1 text-base font-black"
              data-testid="debrief-xp"
            >
              <span>Total</span>
              <span className="tabular-nums">+{p.xp.total} XP</span>
            </li>
          </ul>
        )}
      </div>

      <Speech mood={p.failed ? 'oops' : p.stars === 3 ? 'cheer' : 'happy'} className="mt-4">
        {doseLine}
      </Speech>

      {p.learned && (
        <section className="mt-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted">What you just learned</h2>
          <RichText as="p" text={p.learned} className="mt-1 text-base leading-relaxed" />
        </section>
      )}

      {p.mayaLine && !p.failed && (
        <section
          className="mt-4 flex items-start gap-3 rounded-2xl bg-surface-2 p-3"
          data-testid="debrief-maya"
        >
          <Maya size={40} />
          <RichText as="p" text={p.mayaLine} className="text-sm leading-relaxed" />
        </section>
      )}

      {p.mistakes.length > 0 && (
        <section className="mt-4" data-testid="debrief-mistakes">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted">
            {p.mistakes.length > TOP_MISTAKES && !showAll
              ? `Consequences (top ${TOP_MISTAKES} of ${p.mistakes.length})`
              : 'Consequences of your mistakes'}
          </h2>
          <ul className="mt-1 grid gap-2">
            {visibleMistakes.map((m, i) => (
              <li key={i} className="rounded-xl border border-bad/40 bg-bad-soft p-3 text-sm text-red-950">
                <RichText as="p" text={m.prompt} className="font-semibold" />
                <p className="mt-1">
                  You chose{' '}
                  <em>
                    <RichText text={m.chosen} />
                  </em>
                  . Correct:{' '}
                  <strong>
                    <RichText text={m.correctAnswer} />
                  </strong>
                  .
                </p>
                <RichText as="p" text={m.explanation} className="mt-1" />
                <p className="mt-1">
                  <span className="font-bold">Real-world consequence:</span> <RichText text={m.consequence} />
                </p>
              </li>
            ))}
          </ul>
          {p.mistakes.length > TOP_MISTAKES && !showAll && (
            <Button
              variant="ghost"
              className="mt-2"
              onClick={() => setShowAll(true)}
              data-testid="debrief-see-all"
            >
              See all {p.mistakes.length}
            </Button>
          )}
        </section>
      )}

      {p.shortcuts && p.shortcuts.length > 0 && (
        <section className="mt-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted">Shortcuts you took</h2>
          <ul className="mt-1 grid gap-2">
            {p.shortcuts.map((s, i) => (
              <li
                key={i}
                className="rounded-xl border border-star/60 bg-star-soft p-3 text-sm text-amber-950"
              >
                <p className="font-semibold">
                  {Object.entries(s.meters)
                    .map(([m, d]) => `${m} ${(d ?? 0) > 0 ? '+' : ''}${d}`)
                    .join(', ')}
                </p>
                <RichText as="p" text={s.why} className="mt-1" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {p.artifacts && p.artifacts.length > 0 && !p.failed && (
        <section
          className="mt-4 rounded-card border-2 border-border bg-surface p-3 text-sm"
          data-testid="debrief-artifacts"
        >
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted">You handed off</h2>
          <ul className="mt-1 grid gap-1">
            {p.artifacts.map((a) => (
              <li key={a.key} className="flex items-center justify-between">
                <span className="font-semibold">{artifactRegistry[a.key].title}</span>
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-800">
                  {a.tag}
                  {a.data && Object.values(a.data).length > 0 ? ` · ${Object.values(a.data).join(', ')}` : ''}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-muted">This will shape a later level.</p>
        </section>
      )}

      {p.handoffLine && !p.failed && (
        <section className="mt-4 rounded-card border-2 border-brand-500 bg-brand-50 p-3 text-sm text-brand-800 dark:bg-surface dark:text-brand-100">
          <h2 className="text-xs font-bold uppercase tracking-wide">Hand-off</h2>
          <RichText as="p" text={p.handoffLine} className="mt-1 font-semibold" />
        </section>
      )}

      <div className="mt-6 flex flex-col gap-2">
        {!p.failed && (
          <Button size="lg" full onClick={p.onContinue} data-testid="debrief-continue">
            {p.continueLabel ?? 'Continue'}
          </Button>
        )}
        {!p.hideRetry && (
          <Button
            variant={p.failed ? 'primary' : 'secondary'}
            full
            onClick={p.onRetry}
            disabled={!p.canRetry}
            data-testid="debrief-retry"
          >
            {p.canRetry
              ? p.failed
                ? 'Try again'
                : p.stars === 3
                  ? 'Play again'
                  : 'Retry for more stars'
              : 'No hearts left: wait or review a Role Card'}
          </Button>
        )}
        {p.onReadCard && (
          <Button variant="ghost" full onClick={p.onReadCard}>
            View Role Card
          </Button>
        )}
        {p.failed && (
          <Button variant="ghost" full onClick={p.onContinue}>
            Back to the map
          </Button>
        )}
      </div>
    </div>
  );
}
