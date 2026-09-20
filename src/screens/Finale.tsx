import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { content } from '@/content';
import { finaleContent } from '@/content/finale';
import { rankForXp } from '@/content/economy';
import { navigate } from '@/app/router';
import { useProgress } from '@/store/progress';
import { journeyStats, relayChain } from '@/engine/finale';
import { drawCertificate, saveCertificate } from '@/engine/certificate';
import { playSound } from '@/engine/sound';
import { Button } from '@/components/Button';
import { Disclaimer } from '@/components/Layout';
import { BadgeGlyph } from '@/components/BadgeGlyph';
import { Maya } from '@/components/Maya';
import { RichText } from '@/components/RichText';
import { Speech } from '@/components/Mascot';
import { employerLabel } from './BadgeSwap';

const employerBg: Record<string, string> = {
  sponsor: 'bg-emp-sponsor',
  cro: 'bg-emp-cro',
  site: 'bg-emp-site',
  regulator: 'bg-emp-regulator',
  vendor: 'bg-emp-vendor',
  patient: 'bg-emp-patient',
};

/** Maya's last scene, the relay chain of every badge, the journey stat card, and the certificate. */
export function FinaleScreen() {
  const progress = useProgress();
  const stats = journeyStats({
    levels: progress.levels,
    crises: progress.crises,
    meters: progress.meters,
    knowledge: progress.knowledge,
  });
  const chain = relayChain(progress.artifacts);
  const rank = rankForXp(progress.xp).current.title;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawn, setDrawn] = useState<boolean | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const beat = finaleContent.beat;
  const knowledgeLine = stats.knowledgeOpened
    ? `Knowledge checks: ${stats.knowledgeRibbons} of ${stats.rolesTotal} ribbons`
    : undefined;

  useEffect(() => {
    playSound('unlock');
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ok = drawCertificate(canvas, {
      rank,
      rolesMastered: stats.rolesMastered,
      rolesTotal: stats.rolesTotal,
      threeStarLevels: stats.threeStarLevels,
      years: stats.years,
      costBillions: stats.costBillions,
      knowledgeLine,
      date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
    });
    // Drawing happens after paint; the flag only drives the fallback text.
    setDrawn(ok);
  }, [
    rank,
    stats.rolesMastered,
    stats.rolesTotal,
    stats.threeStarLevels,
    stats.years,
    stats.costBillions,
    knowledgeLine,
  ]);

  const finish = () => {
    progress.setFinaleSeen();
    navigate({ name: 'map', worldId: 'w8' });
  };

  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 py-6 safe-top safe-bottom"
      data-testid="finale"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-brand-700 dark:text-brand-300">Finale</p>
      <h1 className="mt-1 text-2xl font-black">{beat.title}</h1>
      <div className="mt-4 flex items-center gap-3 rounded-card bg-surface p-3 shadow-card">
        <Maya size={64} />
        <div>
          <p className="text-sm font-bold">Maya</p>
          <p className="text-sm text-muted">{beat.mayaStatus}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {beat.paragraphs.map((p, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 * i, duration: 0.3 }}
            className="text-base leading-relaxed"
          >
            <RichText text={p} />
          </motion.p>
        ))}
      </div>

      <section className="mt-6 rounded-card bg-surface p-4 shadow-card" data-testid="finale-stats">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted">Your journey</h2>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <Stat label="Roles mastered" value={`${stats.rolesMastered} of ${stats.rolesTotal}`} />
          <Stat label="Three-star levels" value={String(stats.threeStarLevels)} />
          <Stat label="Crises cleared" value={`${stats.crisesCleared} of ${content.crises.length}`} />
          <Stat label="Rank" value={rank} />
          <Stat label="Your timeline" value={`${stats.years} years`} />
          <Stat label="Your cost" value={`about $${stats.costBillions.toFixed(1)} billion`} />
        </dl>
        <p className="mt-3 text-sm text-muted">
          Real-world averages: {finaleContent.journey.realWorld.years}, {finaleContent.journey.realWorld.cost}
          . Only {finaleContent.journey.realWorld.approval} is ever approved.
        </p>
      </section>

      <section className="mt-6" data-testid="finale-relay">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted">The relay</h2>
        <ol className="mt-2 grid gap-2">
          {chain.map((step, i) => (
            <li
              key={step.role.id}
              className="flex gap-3 rounded-card bg-surface p-3 shadow-card"
              data-testid="relay-step"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ${employerBg[step.role.employer]}`}
                aria-label={employerLabel[step.role.employer]}
              >
                <BadgeGlyph icon={step.role.badgeIcon} size={20} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold">
                  {i + 1}. {step.role.shortTitle}
                </p>
                <RichText as="p" text={step.handoffLine} className="mt-0.5 text-xs text-muted" />
                {step.artifacts.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {step.artifacts.map((a) => (
                      <span
                        key={a.key}
                        className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800"
                        data-testid="relay-artifact"
                      >
                        {a.title}: {a.tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6" data-testid="finale-certificate">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted">Your certificate</h2>
        <canvas
          ref={canvasRef}
          className="mt-2 w-full rounded-card shadow-card"
          role="img"
          aria-label={`Certificate of completion: ${stats.rolesMastered} of ${stats.rolesTotal} roles, rank ${rank}`}
        />
        {drawn === false && (
          <p
            className="mt-2 rounded-card bg-surface p-3 text-sm shadow-card"
            data-testid="certificate-fallback"
          >
            {finaleContent.certificate.title}: {stats.rolesMastered} of {stats.rolesTotal} roles, rank {rank}.
            {knowledgeLine ? ` ${knowledgeLine}.` : ''}
          </p>
        )}
        <Button
          variant="secondary"
          full
          className="mt-3"
          onClick={async () => {
            const ok = canvasRef.current ? await saveCertificate(canvasRef.current) : false;
            setSaved(
              ok
                ? 'Saved as trial-quest-certificate.png'
                : 'Your browser could not save the image. Take a screenshot instead.',
            );
          }}
          data-testid="certificate-save"
        >
          Save image
        </Button>
        {saved && (
          <p className="mt-2 text-sm text-muted" role="status">
            {saved}
          </p>
        )}
      </section>

      <Speech mood="happy" className="mt-6">
        Every level stays open. Replay any role for three stars, or open Test Yourself from a finished node.
      </Speech>
      <Button size="lg" full className="mt-4" onClick={finish} data-testid="finale-continue">
        Back to the map
      </Button>
      <Disclaimer className="mt-6" />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2 px-3 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}
