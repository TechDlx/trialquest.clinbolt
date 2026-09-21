import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { displayLabel, parseRichText, plainText } from '@/content/richText';
import { content } from '@/content';
import { navigate } from '@/app/router';

/** Copy with glossary markup resolved to plain words, for aria-labels and other attributes. */
export const plainCopy = (text: string) => plainText(text, (id) => content.glossaryById[id]?.term);

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
  /**
   * false renders terms as plain words: use inside buttons (a button may not contain a button, so
   * the term could not open its definition, and an underline would promise one).
   */
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
  const [pos, setPos] = useState<{ top: number; left: number; width: number; above: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  const popRef = useRef<HTMLSpanElement>(null);
  const popId = useId();
  const term = content.glossaryById[id];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !popRef.current?.contains(t)) setOpen(false);
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

  // Below the term when it fits; otherwise above it, so a term low on the screen stays readable.
  useLayoutEffect(() => {
    const el = popRef.current;
    if (!open || !pos || !el) return;
    const h = el.offsetHeight;
    const margin = 8;
    if (pos.top + h <= window.innerHeight - margin) return;
    const top = Math.max(margin, pos.above - h);
    if (top !== pos.top) setPos({ ...pos, top });
  }, [open, pos]);

  if (!term) return <span>{label}</span>;
  if (!interactive) return <span>{label}</span>;

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
          setPos({ top: (r?.bottom ?? 0) + 4, left, width, above: (r?.top ?? 0) - 4 });
          setOpen((o) => !o);
        }}
        className={`inline rounded-sm font-semibold underline decoration-dotted decoration-2 underline-offset-2 ${linkClassName ?? 'text-brand-700 dark:text-brand-300'}`}
      >
        {label}
      </button>
      {open &&
        // Portalled to <body>: a transformed or overflow-clipped ancestor (a flipping card, an
        // animated panel) would otherwise capture position:fixed and hide the popover.
        createPortal(
          <span
            ref={popRef}
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
          </span>,
          document.body,
        )}
    </span>
  );
}
