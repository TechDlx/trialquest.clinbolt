import { content } from '@/content';
import { artifactRegistry, type ArtifactKey } from '@/content/artifacts';
import type { Employer } from '@/content/types';
import { href } from '@/app/router';
import { useProgress } from '@/store/progress';
import { Page, TopBar } from '@/components/Layout';
import { BadgeGlyph } from '@/components/BadgeGlyph';
import { ArrowRightIcon } from '@/components/Icons';
import { employerLabel } from './BadgeSwap';

const employerBg: Record<string, string> = {
  sponsor: 'bg-emp-sponsor',
  cro: 'bg-emp-cro',
  site: 'bg-emp-site',
  regulator: 'bg-emp-regulator',
  vendor: 'bg-emp-vendor',
  patient: 'bg-emp-patient',
};

const LANES: Employer[] = ['patient', 'sponsor', 'cro', 'site', 'regulator', 'vendor'];

/** One artifact edge: who produces it, who it changes. */
export interface ArtifactEdge {
  key: ArtifactKey;
  title: string;
  from: string[];
  to: string[];
}

/** Derived from content: emitters are levels with `emits`, consumers are levels whose variants branch on the key. */
export function artifactEdges(): ArtifactEdge[] {
  return (Object.keys(artifactRegistry) as ArtifactKey[]).map((key) => {
    const from = content.levels.filter((l) => l.emits?.some((e) => e.key === key)).map((l) => l.roleId);
    const to = content.levels
      .filter((l) => l.variants?.some((v) => Object.keys(v.when).includes(key)))
      .map((l) => l.roleId);
    return { key, title: artifactRegistry[key].title, from: [...new Set(from)], to: [...new Set(to)] };
  });
}

/** Lane diagram: roles by employer in play order, hand-offs across lanes, and the artifacts that travel. */
export function HandoffScreen() {
  const cardsViewed = useProgress((s) => s.cardsViewed);
  const artifacts = useProgress((s) => s.artifacts);
  const seen = (id: string) => !!cardsViewed[id];
  const unlockedCount = content.roleIndex.filter((r) => seen(r.id)).length;
  const edges = artifactEdges();

  return (
    <Page nav="handoff">
      <TopBar title="Handoff map" />
      <p className="text-sm text-muted">
        Who passes what to whom, by employer. {unlockedCount} of {content.roleIndex.length} roles unlocked.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2" data-testid="handoff-lanes">
        {LANES.map((emp) => {
          const roles = content.roleIndex.filter((r) => r.employer === emp);
          return (
            <section
              key={emp}
              className="rounded-card bg-surface p-3 shadow-card"
              data-testid={`lane-${emp}`}
            >
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
                <span className={`inline-block h-3 w-3 rounded-sm ${employerBg[emp]}`} aria-hidden="true" />
                {employerLabel[emp]}
              </h2>
              <ol className="mt-2 grid gap-1.5">
                {roles.map((r) => {
                  const full = content.roleById[r.id];
                  const unlocked = seen(r.id);
                  return (
                    <li key={r.id} className="text-sm">
                      <a
                        href={href({ name: 'codex', roleId: r.id })}
                        className={`flex items-center gap-2 rounded-xl px-1 py-0.5 ${unlocked ? 'font-bold' : 'text-muted'}`}
                        aria-label={`${r.shortTitle}${unlocked ? '' : ', locked'}`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${unlocked ? `${employerBg[emp]} text-white` : 'bg-surface-2 text-locked'}`}
                        >
                          <BadgeGlyph icon={r.badgeIcon} size={16} />
                        </span>
                        <span className="min-w-0 flex-1 truncate">{r.shortTitle}</span>
                        <span className="text-xs text-muted">W{r.worldId.slice(1)}</span>
                      </a>
                      {unlocked && full && (
                        <div className="ml-9 mt-0.5 flex flex-wrap items-center gap-1 text-xs">
                          <ArrowRightIcon size={12} className="text-muted" />
                          {full.card.handsOffTo.map((id) => {
                            const t = content.roleRefById[id];
                            if (!t) return null;
                            return (
                              <span
                                key={id}
                                className={`rounded-full px-1.5 py-0.5 font-semibold ${seen(id) ? `${employerBg[t.employer]} text-white` : 'border border-border text-muted'}`}
                              >
                                {t.shortTitle}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>

      <section className="mt-5" data-testid="handoff-artifacts">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted">What travels down the chain</h2>
        <p className="mt-1 text-sm text-muted">
          Some decisions follow the drug into later worlds. Your version appears once you have made it.
        </p>
        <ul className="mt-2 grid gap-2">
          {edges.map((e) => {
            const mine = artifacts[e.key];
            const name = (id: string) => content.roleRefById[id]?.shortTitle ?? id;
            return (
              <li
                key={e.key}
                className="rounded-card bg-surface p-3 text-sm shadow-card"
                data-testid={`artifact-${e.key}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold">{e.title}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${mine ? 'bg-brand-100 text-brand-800' : 'border border-border text-muted'}`}
                  >
                    {mine ? mine.tag : 'not yet'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {e.from.map(name).join(', ') || 'nobody yet'}
                  <ArrowRightIcon size={12} className="mx-1 inline text-muted" />
                  {e.to.length ? e.to.map(name).join(', ') : 'the story'}
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </Page>
  );
}
