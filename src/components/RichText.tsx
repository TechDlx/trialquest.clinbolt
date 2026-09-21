import { useEffect, useId, useRef, useState } from 'react';
import { displayLabel, parseRichText } from '@/content/richText';
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
      {segments.map((seg, i) => {
        if (seg.type === 'text') return <span key={i}>{seg.text}</span>;
        const prev = segments[i - 1];
        const label = seg.explicit
          ? seg.label
          : displayLabel(seg.label, prev?.type === 'text' ? prev.text : '');
        return (
          <Term key={i} id={seg.id} label={label} linkClassName={linkClassName} interactive={interactive} />
        );
      })}
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
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
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
    const onScroll = () => setOpen(false);
    document.addEventListener('pointerdown', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('pointerdown', onDoc);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
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
          // Fixed positioning, clamped to the viewport: never clipped by a card or column.
          const r = ref.current?.getBoundingClientRect();
          const margin = 16;
          const width = Math.min(288, window.innerWidth - margin * 2);
          const left = r ? Math.max(margin, Math.min(r.left, window.innerWidth - margin - width)) : margin;
          setPos({ top: (r?.bottom ?? 0) + 4, left, width });
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
          style={pos ? { top: pos.top, left: pos.left, width: pos.width } : undefined}
          className="fixed z-30 block rounded-xl border border-border bg-surface p-3 text-left text-sm font-normal text-fg shadow-card"
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
