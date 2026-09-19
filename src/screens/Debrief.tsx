import { motion } from 'framer-motion';
import type { Mistake, Stars as StarCount, XpBreakdown } from '@/engine/scoring';
import { Stars } from '@/components/Hud';
import { Button } from '@/components/Button';
import { RichText } from '@/components/RichText';
import { Speech } from '@/components/Mascot';

export interface DebriefProps {
  kind: 'level' | 'boss' | 'review';
  title: string;
  stars: StarCount;
  score: number;
  xp: XpBreakdown;
  learned?: string;
  handoffLine?: string;
  mistakes: Mistake[];
  correct: number;
  total: number;
  failed: boolean;
  failReason?: string;
  canRetry: boolean;
  onContinue: () => void;
  onRetry: () => void;
  onReadCard?: () => void;
  continueLabel?: string;
}

export function Debrief(p: DebriefProps) {
  const doseLine = p.failed
    ? (p.failReason ?? 'Out of hearts. Read the consequences below, then try again when a heart is back.')
    : p.stars === 3
      ? 'Perfect. That is exactly how the pros do it.'
      : p.stars === 2
        ? 'Solid work. One more pass would make it perfect.'
        : 'You got through. Check the consequences below so next time is cleaner.';

  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-6 safe-top safe-bottom"
      data-testid="debrief"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-brand-700 dark:text-brand-300">
        {p.failed ? 'Setback' : 'Debrief'}
      </p>
      <h1 className="mt-1 text-2xl font-black">{p.title}</h1>

      <div className="mt-4 rounded-card bg-surface p-4 text-center shadow-card">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 14 }}
        >
          <Stars stars={p.stars} size={40} />
        </motion.div>
        <p className="mt-1 text-sm text-muted" data-testid="debrief-score">
          {p.correct} of {p.total} correct · score {p.score}
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

      {p.mistakes.length > 0 && (
        <section className="mt-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted">
            Consequences of your mistakes
          </h2>
          <ul className="mt-1 grid gap-2">
            {p.mistakes.map((m, i) => (
              <li key={i} className="rounded-xl border border-bad/40 bg-bad-soft p-3 text-sm text-red-950">
                <p className="font-semibold">{m.prompt}</p>
                <p className="mt-1">
                  You chose <em>{m.chosen}</em>. Correct: <strong>{m.correctAnswer}</strong>.
                </p>
                <p className="mt-1">
                  <span className="font-bold">Real-world consequence:</span> {m.consequence}
                </p>
              </li>
            ))}
          </ul>
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
              : 'Retry for more stars'
            : 'No hearts left: wait or review a Role Card'}
        </Button>
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
