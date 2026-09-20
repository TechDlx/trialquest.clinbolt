import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { content } from '@/content';
import { economy } from '@/content/economy';
import { navigate, href } from '@/app/router';
import { useProgress } from '@/store/progress';
import { useSettings, resolveReducedMotion } from '@/store/settings';
import { endSegment, startSegment } from '@/engine/timing';
import { Button } from '@/components/Button';
import { Page, TopBar } from '@/components/Layout';
import { Chip } from '@/components/Hud';
import { BadgeGlyph } from '@/components/BadgeGlyph';
import { RichText } from '@/components/RichText';
import { Speech } from '@/components/Mascot';
import { ArrowRightIcon, HeartIcon, LockIcon } from '@/components/Icons';
import { employerLabel } from './BadgeSwap';

const employerBg: Record<string, string> = {
  sponsor: 'bg-emp-sponsor',
  cro: 'bg-emp-cro',
  site: 'bg-emp-site',
  regulator: 'bg-emp-regulator',
  vendor: 'bg-emp-vendor',
  patient: 'bg-emp-patient',
};

function RoleChip({ roleId }: { roleId: string }) {
  const ref = content.roleRefById[roleId];
  const viewed = useProgress((s) => !!s.cardsViewed[roleId]);
  if (!ref) return null;
  const inner = (
    <>
      <BadgeGlyph icon={ref.badgeIcon} size={14} />
      <span>{ref.shortTitle}</span>
      {!viewed && <LockIcon size={12} />}
    </>
  );
  const cls = `tap inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
    viewed ? `${employerBg[ref.employer]} text-white` : 'bg-surface-2 text-muted border border-border'
  }`;
  return viewed ? (
    <a href={href({ name: 'codex', roleId })} className={cls}>
      {inner}
    </a>
  ) : (
    <span className={cls} title="Not met yet">
      {inner}
    </span>
  );
}

/**
 * Front (<= 60 words): title, employer, what I do, receive from -> hand off to.
 * Back: responsibilities, skills, documents, day in the life as skimmable bullets.
 * The task unlocks after the front has been read and the card flipped once.
 */
export function RoleCardScreen({ roleId, levelId }: { roleId: string; levelId?: string }) {
  const role = content.roleById[roleId];
  const level = levelId ? content.levelById[levelId] : undefined;
  const world = role ? content.worldById[role.worldId] : undefined;
  const cardRecord = useProgress((s) => s.cardsViewed[roleId]);
  const hearts = useProgress((s) => s.hearts);
  const markCardViewed = useProgress((s) => s.markCardViewed);
  const claimCodexHeart = useProgress((s) => s.claimCodexHeart);
  const tipsDismissed = useProgress((s) => s.tipsDismissed);
  const dismissTip = useProgress((s) => s.dismissTip);
  const levelsDone = useProgress((s) => s.levels);
  const ribbon = useProgress((s) => !!s.knowledge[roleId]?.ribbon);
  const reduced = resolveReducedMotion(useSettings((s) => s.motion));
  const [face, setFace] = useState<'front' | 'back'>('front');
  const [flips, setFlips] = useState(0);
  const [xpToast, setXpToast] = useState<number | null>(null);
  const [heartToast, setHeartToast] = useState(false);

  useEffect(() => {
    if (levelId) startSegment(`card ${roleId}`);
  }, [levelId, roleId]);

  const flip = () => {
    const nextFace = face === 'front' ? 'back' : 'front';
    setFace(nextFace);
    setFlips((n) => n + 1);
    if (nextFace === 'back') {
      const { xpGained } = markCardViewed(roleId);
      if (xpGained > 0) setXpToast(xpGained);
    }
  };

  if (!role || !world) {
    return (
      <Page nav="codex">
        <TopBar title="Role not found" back={{ name: 'codex' }} />
      </Page>
    );
  }

  const flipped = !!cardRecord?.flipped;
  const canStart = flipped && !!level;
  const fromCodex = !level;
  const canClaimHeart =
    fromCodex && flipped && hearts < economy.hearts.max && cardRecord?.lastHeartClaimDay !== todayKey();
  const tipId = 'rolecard-first';
  const flipAnim =
    flips === 0 ? { rotateY: 0, opacity: 1 } : reduced ? { opacity: [0.4, 1] } : { rotateY: [90, 0] };

  return (
    <Page nav={fromCodex ? 'codex' : undefined}>
      <TopBar
        title={fromCodex ? 'Career Codex' : `World ${world.number} · Role Card`}
        back={fromCodex ? { name: 'codex' } : { name: 'map', worldId: world.id }}
      />

      {!tipsDismissed[tipId] && level && (
        <Speech mood="think" className="mb-3" onDismiss={() => dismissTip(tipId)}>
          Read the front, flip once, then start. The back is there whenever you want it.
        </Speech>
      )}

      <motion.article
        key={face}
        animate={flipAnim}
        transition={{ duration: 0.35 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="overflow-hidden rounded-card bg-surface shadow-card"
        aria-live="polite"
        data-testid={`rolecard-${face}`}
      >
        <div className={`flex items-center gap-3 px-4 py-3 text-white ${employerBg[role.employer]}`}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <BadgeGlyph icon={role.badgeIcon} size={28} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-white">
              {face === 'front' ? 'Front' : 'Back'} · Works for the {employerLabel[role.employer]}
            </p>
            <h1 className="text-lg font-black leading-tight">{role.title}</h1>
          </div>
        </div>

        {face === 'front' ? (
          <div className="flex flex-col gap-4 p-4">
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wide text-muted">What I do</h2>
              <RichText as="p" text={role.card.whatIDo} className="mt-1 text-base leading-relaxed" />
            </section>
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wide text-muted">
                I receive from → I hand off to
              </h2>
              <div className="mt-1 flex flex-col gap-2 text-sm">
                <div className="flex flex-wrap items-center gap-1.5">
                  {role.card.receivesFrom.length === 0 ? (
                    <span className="text-muted">It starts with me.</span>
                  ) : (
                    role.card.receivesFrom.map((id) => <RoleChip key={id} roleId={id} />)
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <ArrowRightIcon size={18} />
                  <span className="text-xs">then me, then</span>
                  <ArrowRightIcon size={18} />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {role.card.handsOffTo.map((id) => (
                    <RoleChip key={id} roleId={id} />
                  ))}
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-4 text-sm">
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wide text-muted">Key responsibilities</h2>
              <ul className="mt-1 grid gap-1">
                {role.card.responsibilities.map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-800">
                      {i + 1}
                    </span>
                    <RichText text={r} />
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wide text-muted">Skills & background</h2>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {role.card.skills.map((s) => (
                  <Chip key={s} color="bg-brand-700">
                    {s}
                  </Chip>
                ))}
              </div>
              <RichText as="p" text={role.card.background} className="mt-1 text-muted" />
            </section>
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wide text-muted">Documents & systems</h2>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {role.card.documents.map((d) => (
                  <li key={d} className="rounded-lg bg-surface-2 px-2 py-1 text-xs font-medium">
                    <RichText text={d} />
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-xl bg-star-soft p-3 text-amber-950">
              <h2 className="text-xs font-bold uppercase tracking-wide">A day in the life</h2>
              <RichText as="p" text={role.card.funFact} className="mt-1" />
            </section>
          </div>
        )}
      </motion.article>

      {xpToast && (
        <p className="mt-2 text-center text-sm font-bold text-brand-700 dark:text-brand-300" role="status">
          +{xpToast} XP · Card added to your Codex
        </p>
      )}
      {heartToast && (
        <p
          className="mt-2 inline-flex w-full items-center justify-center gap-1 text-center text-sm font-bold text-heart"
          role="status"
        >
          <HeartIcon size={16} /> +1 heart for reviewing
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2">
        <Button variant="secondary" full onClick={flip} data-testid="flip-card">
          {face === 'front' ? 'Flip: responsibilities, skills, documents →' : '← Flip back'}
        </Button>
        {level && (
          <Button
            size="lg"
            full
            disabled={!canStart}
            onClick={() => {
              endSegment(`card ${roleId}`);
              navigate({ name: 'level', levelId: level.id }, true);
            }}
            data-testid="start-task"
          >
            {canStart ? `Start task: ${level.title}` : 'Flip the card once to unlock the task'}
          </Button>
        )}
        {fromCodex &&
          content.knowledgeByRole[roleId] &&
          Object.values(content.levelById).some(
            (l) => l.roleId === roleId && (levelsDone[l.id]?.stars ?? 0) > 0,
          ) && (
            <Button
              variant="secondary"
              full
              onClick={() => navigate({ name: 'test', roleId })}
              data-testid="codex-test"
            >
              {ribbon ? '🎗️ Test Yourself again (optional)' : 'Test Yourself (optional)'}
            </Button>
          )}
        {canClaimHeart && (
          <Button
            variant="secondary"
            full
            onClick={() => {
              if (claimCodexHeart(roleId)) setHeartToast(true);
            }}
          >
            <HeartIcon size={18} className="text-heart" /> Reviewed it: claim a heart
          </Button>
        )}
      </div>
    </Page>
  );
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
