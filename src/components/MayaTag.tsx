import { Maya } from './Maya';

/**
 * Marks an item inside a task as "a participant" without naming her. From World 5 on, one item
 * per cameo level is Maya; the debrief reveals it. The label is the anonymous study identity.
 */
export function MayaTag({ label, className = '' }: { label: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted ${className}`}
      data-testid="maya-tag"
    >
      <Maya size={16} />
      {label}
    </span>
  );
}
