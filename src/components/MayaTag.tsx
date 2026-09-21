import { Maya } from './Maya';

/**
 * Marks an item inside a task as "a participant" without naming her. From World 5 on, one item
 * per cameo level is Maya; the debrief reveals it. The label is the anonymous study identity.
 */
export function MayaTag({
  label,
  className = '',
  labelHidden = false,
}: {
  label: string;
  className?: string;
  /** Keep the label for screen readers only (when the surrounding text already shows it). */
  labelHidden?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted ${className}`}
      data-testid="maya-tag"
      aria-hidden={labelHidden || undefined}
    >
      <Maya size={16} />
      {!labelHidden && <span>{label}</span>}
    </span>
  );
}
