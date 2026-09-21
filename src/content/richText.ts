/**
 * Copy markup, pure functions only (React renderer in components/RichText.tsx):
 *   [[term-id]] / [[term-id|Shown text]]   glossary link
 *   {{artifact.key.field}}                 value from a stored artifact, or the registry fallback
 */
import { artifactRegistry, isArtifactKey, type ArtifactStore } from './artifacts';

export type RichSegment =
  { type: 'text'; text: string } | { type: 'term'; id: string; label: string; explicit: boolean };

const LINK_RE = /\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g;
const INTERP_RE = /\{\{([a-z0-9]+\.[a-z0-9]+)\.([A-Za-z0-9]+)\}\}/g;

export function parseRichText(input: string, termLabel: (id: string) => string | undefined): RichSegment[] {
  const out: RichSegment[] = [];
  let last = 0;
  for (const m of input.matchAll(LINK_RE)) {
    const start = m.index ?? 0;
    if (start > last) out.push({ type: 'text', text: input.slice(last, start) });
    const id = m[1]!;
    out.push({ type: 'term', id, label: m[2] ?? termLabel(id) ?? id, explicit: m[2] !== undefined });
    last = start + m[0].length;
  }
  if (last < input.length) out.push({ type: 'text', text: input.slice(last) });
  return out;
}

/**
 * Display form of a glossary term used without an explicit label: lower-cased mid-sentence
 * unless it starts with an acronym or brand-style casing (GCP, eCRF, MedDRA), kept as-is at
 * the start of a sentence.
 */
export function displayLabel(label: string, precedingText: string): string {
  const first = label.split(/\s+/)[0] ?? '';
  const acronymLike =
    /^[A-Z0-9][A-Z0-9-]+$/.test(first) || /^[a-z]+[A-Z]/.test(first) || /^[A-Z][a-z]*[A-Z]/.test(first);
  if (acronymLike) return label;
  const before = precedingText.trimEnd();
  const sentenceStart = before === '' || /[.!?:]$/.test(before);
  if (sentenceStart) return label;
  return label.charAt(0).toLowerCase() + label.slice(1);
}

export function extractTermIds(input: string): string[] {
  return [...input.matchAll(LINK_RE)].map((m) => m[1]!);
}

export function extractInterpolations(input: string): { key: string; field: string }[] {
  return [...input.matchAll(INTERP_RE)].map((m) => ({ key: m[1]!, field: m[2]! }));
}

/** Replaces {{key.field}} with the stored value or the registry fallback. Unknown refs are left as-is. */
export function interpolate(input: string, artifacts: ArtifactStore): string {
  return input.replace(INTERP_RE, (whole, key: string, field: string) => {
    if (!isArtifactKey(key)) return whole;
    const spec = artifactRegistry[key] as { fields?: Record<string, { fallback: string | number }> };
    const fb = spec.fields?.[field];
    if (!fb) return whole;
    const stored = artifacts[key]?.data?.[field];
    return String(stored ?? fb.fallback);
  });
}

export function plainText(input: string, termLabel?: (id: string) => string | undefined): string {
  return input.replace(LINK_RE, (_m, id: string, label?: string) => label ?? termLabel?.(id) ?? id);
}
