import { useEffect, useMemo, useRef, useState } from 'react';
import { content } from '@/content';
import { Page, TopBar } from '@/components/Layout';

export function GlossaryScreen({ termId }: { termId?: string }) {
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLDListElement>(null);
  const terms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...content.glossary]
      .filter(
        (t) =>
          !q ||
          t.term.toLowerCase().includes(q) ||
          t.short.toLowerCase().includes(q) ||
          t.aliases?.some((a) => a.toLowerCase().includes(q)),
      )
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [query]);

  useEffect(() => {
    if (!termId) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-term="${termId}"]`);
    el?.scrollIntoView({ block: 'center' });
    el?.focus();
  }, [termId, terms]);

  return (
    <Page nav="glossary">
      <TopBar title="Glossary" />
      <label className="block">
        <span className="sr-only">Search terms</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search terms, e.g. GCP, NOAEL, placebo"
          className="tap w-full rounded-2xl border-2 border-border bg-surface px-4 py-2.5 text-base"
        />
      </label>
      <p className="mt-2 text-xs text-muted">
        {terms.length} terms. New terms are added as you unlock worlds.
      </p>
      <dl ref={listRef} className="mt-3 grid gap-2">
        {terms.map((t) => (
          <div
            key={t.id}
            data-term={t.id}
            tabIndex={-1}
            className={`rounded-xl bg-surface p-3 shadow-card outline-none ${t.id === termId ? 'ring-4 ring-brand-300' : ''}`}
          >
            <dt className="font-bold">
              {t.term}
              {t.aliases && t.aliases.length > 0 && (
                <span className="ml-2 text-xs font-medium text-muted">also: {t.aliases.join(', ')}</span>
              )}
            </dt>
            <dd className="mt-0.5 text-sm">{t.short}</dd>
            {t.long && <dd className="mt-1 text-sm text-muted">{t.long}</dd>}
          </div>
        ))}
        {terms.length === 0 && <p className="text-sm text-muted">No matches.</p>}
      </dl>
    </Page>
  );
}
