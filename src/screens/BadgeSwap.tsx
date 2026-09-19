import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { content } from '@/content';
import { navigate } from '@/app/router';
import { useSettings, resolveReducedMotion } from '@/store/settings';
import { BadgeGlyph } from '@/components/BadgeGlyph';
import { Chip } from '@/components/Hud';

const employerBg: Record<string, string> = {
  sponsor: 'bg-emp-sponsor',
  cro: 'bg-emp-cro',
  site: 'bg-emp-site',
  regulator: 'bg-emp-regulator',
  vendor: 'bg-emp-vendor',
  patient: 'bg-emp-patient',
};

export const employerLabel: Record<string, string> = {
  sponsor: 'Sponsor',
  cro: 'CRO',
  site: 'Site',
  regulator: 'Regulator / Ethics',
  vendor: 'Vendor',
  patient: 'Patient',
};

export function BadgeSwapScreen({ levelId }: { levelId: string }) {
  const level = content.levelById[levelId];
  const role = level ? content.roleRefById[level.roleId] : undefined;
  const world = level ? content.worldById[level.worldId] : undefined;
  const motionSetting = useSettings((s) => s.motion);
  const reduced = resolveReducedMotion(motionSetting);

  useEffect(() => {
    if (!level || !role) {
      navigate({ name: 'map' }, true);
      return;
    }
    const id = window.setTimeout(
      () => navigate({ name: 'role', roleId: role.id, levelId }, true),
      reduced ? 400 : 1600,
    );
    return () => window.clearTimeout(id);
  }, [level, role, levelId, reduced]);

  if (!level || !role || !world) return null;

  const go = () => navigate({ name: 'role', roleId: role.id, levelId }, true);

  return (
    <button
      type="button"
      onClick={go}
      aria-label={`Putting on the ${role.title} badge. Tap to skip.`}
      className="flex min-h-dvh w-full flex-col items-center justify-center bg-brand-800 px-6 text-white"
      data-testid="badge-swap"
    >
      <motion.div
        initial={reduced ? { opacity: 0 } : { y: -260, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 160, damping: 18 }}
        className="flex flex-col items-center"
      >
        <div className="h-24 w-1.5 rounded-full bg-brand-300" aria-hidden="true" />
        <div className="-mt-1 h-5 w-10 rounded-b-xl bg-brand-200" aria-hidden="true" />
        <div className="mt-1 w-64 overflow-hidden rounded-2xl bg-white text-fg shadow-card">
          <div
            className={`flex items-center justify-between px-4 py-2 text-xs font-bold text-white ${employerBg[role.employer]}`}
          >
            <span>WORLD {world.number}</span>
            <span>{employerLabel[role.employer]}</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-4">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-xl text-white ${employerBg[role.employer]}`}
            >
              <BadgeGlyph icon={role.badgeIcon} size={30} />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">New role</p>
              <p className="text-base font-black leading-tight">{role.title}</p>
            </div>
          </div>
          <div className="px-4 pb-3">
            <Chip color={employerBg[role.employer]}>ID · TQ-{String(world.number).padStart(2, '0')}</Chip>
          </div>
        </div>
      </motion.div>
      <p className="mt-8 text-sm text-brand-100">Badge swap… tap to skip</p>
    </button>
  );
}
