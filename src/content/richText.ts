/**
 * Tiny markup for content copy: [[term-id]] or [[term-id|Shown text]] marks a glossary link.
 * Pure functions here; the React renderer lives in components/RichText.tsx.
 */
export type RichSegment = { type: 'text'; text: string } | { type: 'term'; id: string; label: string };

const LINK_RE = /\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g;

export function parseRichText(input: string, termLabel: (id: string) => string | undefined): RichSegment[] {
  const out: RichSegment[] = [];
  let last = 0;
  for (const m of input.matchAll(LINK_RE)) {
    const start = m.index ?? 0;
    if (start > last) out.push({ type: 'text', text: input.slice(last, start) });
    const id = m[1]!;
    const label = m[2] ?? termLabel(id) ?? id;
    out.push({ type: 'term', id, label });
    last = start + m[0].length;
  }
  if (last < input.length) out.push({ type: 'text', text: input.slice(last) });
  return out;
}

export function extractTermIds(input: string): string[] {
  return [...input.matchAll(LINK_RE)].map((m) => m[1]!);
}

/** Strips markup, keeping the visible label. Used for aria-labels and canvas text. */
export function plainText(input: string, termLabel?: (id: string) => string | undefined): string {
  return input.replace(LINK_RE, (_m, id: string, label?: string) => label ?? termLabel?.(id) ?? id);
}
