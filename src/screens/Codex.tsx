import { content } from '@/content';
import { economy } from '@/content/economy';
import { href } from '@/app/router';
import { useProgress } from '@/store/progress';
import { Page, TopBar } from '@/components/Layout';
import { BadgeGlyph } from '@/components/BadgeGlyph';
import { LockIcon } from '@/components/Icons';
import { RoleCardScreen } from './RoleCard';

const employerBg: Record<string, string> = {
  sponsor: 'bg-emp-sponsor',
  cro: 'bg-emp-cro',
  site: 'bg-emp-site',
  regulator: 'bg-emp-regulator',
  vendor: 'bg-emp-vendor',
  patient: 'bg-emp-patient',
};

export function CodexScreen({ roleId }: { roleId?: string }) {
  const cardsViewed = useProgress((s) => s.cardsViewed);
  if (roleId && content.roleById[roleId] && cardsViewed[roleId]) return <RoleCardScreen roleId={roleId} />;

  const viewedCount = Object.keys(cardsViewed).filter((id) => content.roleRefById[id]).length;

  return (
    <Page nav="codex">
      <TopBar title="Career Codex" />
      <p className="text-sm text-muted">
        {viewedCount} of {content.roleIndex.length} roles collected. Tap a collected badge to re-read its card
        (and claim a heart, up to {economy.hearts.codexDailyMax} a day).
      </p>
      {content.worlds.map((world) => {
        const roles = content.roleIndex.filter((r) => r.worldId === world.id);
        return (
          <section key={world.id} className="mt-5" aria-labelledby={`codex-${world.id}`}>
            <h2 id={`codex-${world.id}`} className="text-sm font-bold">
              World {world.number} · {world.title}
            </h2>
            <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {roles.map((role) => {
                const viewed = !!cardsViewed[role.id];
                const inner = (
                  <>
                    <span
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl ${viewed ? `${employerBg[role.employer]} text-white` : 'bg-surface-2 text-locked'}`}
                    >
                      {viewed ? <BadgeGlyph icon={role.badgeIcon} size={28} /> : <LockIcon size={22} />}
                    </span>
                    <span
                      className={`text-center text-xs font-semibold leading-tight ${viewed ? '' : 'text-muted'}`}
                    >
                      {viewed ? role.shortTitle : '???'}
                    </span>
                  </>
                );
                return (
                  <li key={role.id}>
                    {viewed ? (
                      <a
                        href={href({ name: 'codex', roleId: role.id })}
                        className="tap flex flex-col items-center gap-1 rounded-xl p-1.5 hover:bg-surface"
                        data-testid={`codex-${role.id}`}
                      >
                        {inner}
                      </a>
                    ) : (
                      <div
                        className="flex flex-col items-center gap-1 p-1.5"
                        aria-label={`${role.title}: not collected yet`}
                      >
                        {inner}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </Page>
  );
}
