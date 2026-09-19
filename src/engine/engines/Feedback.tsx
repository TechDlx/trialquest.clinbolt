import { motion } from 'framer-motion';
import { Button } from '@/components/Button';
import { RichText } from '@/components/RichText';

export type FeedbackKind = 'correct' | 'wrong' | 'shortcut' | 'info';

/** The explanation panel every engine shows after a scorable action. */
export function Feedback({
  kind,
  title,
  correctAnswer,
  explanation,
  note,
  nextLabel = 'Next',
  onNext,
}: {
  kind: FeedbackKind;
  title: string;
  correctAnswer?: string;
  explanation: string;
  note?: string;
  nextLabel?: string;
  onNext: () => void;
}) {
  const cls =
    kind === 'correct'
      ? 'border-ok bg-ok-soft text-green-950'
      : kind === 'wrong'
        ? 'border-bad bg-bad-soft text-red-950'
        : kind === 'shortcut'
          ? 'border-star bg-star-soft text-amber-950'
          : 'border-border bg-surface text-fg';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      role="status"
      aria-live="polite"
      data-testid="engine-feedback"
      data-kind={kind}
      className={`rounded-card border-2 p-4 ${cls}`}
    >
      <p className="font-bold">{title}</p>
      {correctAnswer && (
        <p className="mt-1 text-sm">
          Correct: <strong>{correctAnswer}</strong>
        </p>
      )}
      <RichText as="p" text={explanation} className="mt-1 text-sm" />
      {note && <p className="mt-1 text-sm font-semibold">{note}</p>}
      <Button onClick={onNext} className="mt-3" full data-testid="engine-next">
        {nextLabel}
      </Button>
    </motion.div>
  );
}
