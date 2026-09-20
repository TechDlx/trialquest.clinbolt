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
  interactive = true,
}: {
  text: string;
  className?: string;
  as?: 'span' | 'p';
  /** Colour classes for glossary links; pass e.g. "text-white" on dark or coloured panels. */
  linkClassName?: string;
  /** false renders terms as plain underlined text: use inside buttons (a button may not contain a button). */
  interactive?: boolean;
}) {
  const segments = parseRichText(text, (id) => content.glossaryById[id]?.term);
  return (
    <Tag className={className}>
      {segments.map((seg, i) =>
        seg.type === 'text' ? (
          <span key={i}>{seg.text}</span>
        ) : (
          <Term
            key={i}
            id={seg.id}
            label={seg.label}
            linkClassName={linkClassName}
            interactive={interactive}
          />
        ),
      )}
    </Tag>
  );
}

function Term({
  id,
  label,
  linkClassName,
  interactive,
}: {
  id: string;
  label: string;
  linkClassName?: string;
  interactive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
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
  if (!interactive)
    return (
      <span className={`underline decoration-dotted decoration-2 underline-offset-2 ${linkClassName ?? ''}`}>
        {label}
      </span>
    );

  return (
    <span ref={ref} className="relative inline">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={popId}
        onClick={() => {
          // Keep the popover on screen when the term sits near the right edge.
          const r = ref.current?.getBoundingClientRect();
          setAlignRight(!!r && r.left + 300 > window.innerWidth);
          setOpen((o) => !o);
        }}
        className={`inline rounded-sm font-semibold underline decoration-dotted decoration-2 underline-offset-2 ${linkClassName ?? 'text-brand-700 dark:text-brand-300'}`}
      >
        {label}
      </button>
      {open && (
        <span
          id={popId}
          role="dialog"
          aria-label={term.term}
          className={`absolute top-full z-30 mt-1 block w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface p-3 text-left text-sm font-normal text-fg shadow-card ${alignRight ? 'right-0' : 'left-0'}`}
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
