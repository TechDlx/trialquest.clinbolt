import { content } from '@/content';
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

/**
 * Milestone 1 version of the Handoff Map: a relay list that fills in as roles are unlocked.
 * Milestone 3 replaces it with the lane diagram (sponsor / CRO / site / regulator / vendor).
 */
export function HandoffScreen() {
  const cardsViewed = useProgress((s) => s.cardsViewed);
  const unlocked = content.roles.filter((r) => cardsViewed[r.id]);

  return (
    <Page nav="handoff">
      <TopBar title="Handoff map" />
      <p className="text-sm text-muted">Who passes what to whom. Fills in as you unlock roles.</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {Object.entries(employerLabel).map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-1">
            <span className={`inline-block h-3 w-3 rounded-sm ${employerBg[k]}`} aria-hidden="true" /> {v}
          </span>
        ))}
      </div>
      {unlocked.length === 0 ? (
        <p className="mt-6 rounded-card bg-surface p-4 text-sm shadow-card">
          No roles unlocked yet. Play the first level to start the relay.
        </p>
      ) : (
        <ol className="mt-4 grid gap-2">
          {unlocked.map((role) => (
            <li key={role.id} className="rounded-card bg-surface p-3 shadow-card">
              <a
                href={href({ name: 'codex', roleId: role.id })}
                className="flex items-center gap-2 font-bold"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-white ${employerBg[role.employer]}`}
                >
                  <BadgeGlyph icon={role.badgeIcon} size={20} />
                </span>
                {role.title}
              </a>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-muted">hands off to</span>
                <ArrowRightIcon size={14} className="text-muted" />
                {role.card.handsOffTo.map((id) => {
                  const r = content.roleRefById[id];
                  if (!r) return null;
                  const seen = !!cardsViewed[id];
                  return (
                    <span
                      key={id}
                      className={`rounded-full px-2 py-0.5 font-semibold ${seen ? `${employerBg[r.employer]} text-white` : 'border border-border text-muted'}`}
                    >
                      {r.shortTitle}
                    </span>
                  );
                })}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Page>
  );
}
