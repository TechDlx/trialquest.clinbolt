import { useEffect, useId, useRef, useState } from 'react';
import { parseRichText } from '@/content/richText';
import { content } from '@/content';
import { navigate } from '@/app/router';

/**
 * Renders content copy with [[term]] glossary links as tappable, underlined terms.
 * Tap opens a small popover with the one-sentence definition and a link to the glossary.
 */
export function RichText({
  text,
  className = '',
  as: Tag = 'span',
  linkClassName,
}: {
  text: string;
  className?: string;
  as?: 'span' | 'p';
  /** Colour classes for glossary links; pass e.g. "text-white" on dark or coloured panels. */
  linkClassName?: string;
}) {
  const segments = parseRichText(text, (id) => content.glossaryById[id]?.term);
  return (
    <Tag className={className}>
      {segments.map((seg, i) =>
        seg.type === 'text' ? (
          <span key={i}>{seg.text}</span>
        ) : (
          <Term key={i} id={seg.id} label={seg.label} linkClassName={linkClassName} />
        ),
      )}
    </Tag>
  );
}

function Term({ id, label, linkClassName }: { id: string; label: string; linkClassName?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const popId = useId();
  const term = content.glossaryById[id];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!term) return <span>{label}</span>;

  return (
    <span ref={ref} className="relative inline">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={popId}
        onClick={() => setOpen((o) => !o)}
        className={`inline rounded-sm font-semibold underline decoration-dotted decoration-2 underline-offset-2 ${linkClassName ?? 'text-brand-700 dark:text-brand-300'}`}
      >
        {label}
      </button>
      {open && (
        <span
          id={popId}
          role="dialog"
          aria-label={term.term}
          className="absolute left-0 top-full z-30 mt-1 block w-72 max-w-[85vw] rounded-xl border border-border bg-surface p-3 text-left text-sm font-normal text-fg shadow-card"
        >
          <span className="block font-bold">{term.term}</span>
          <span className="mt-1 block">{term.short}</span>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate({ name: 'glossary', termId: term.id });
            }}
            className="tap mt-1 inline-flex items-center rounded-lg px-1 text-xs font-semibold text-brand-700 dark:text-brand-300"
          >
            Open in glossary
          </button>
        </span>
      )}
    </span>
  );
}
