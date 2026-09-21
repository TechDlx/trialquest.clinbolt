import { useEffect, useState } from 'react';
import { content } from '@/content';
import { economy } from '@/content/economy';
import { useProgress } from '@/store/progress';
import { dayKey } from '@/engine/dates';
import { msToNextHeart } from '@/engine/hearts';
import { Modal } from './Modal';
import { Button } from './Button';
import { Hearts } from './Hud';
import { RichText } from './RichText';
import { BadgeGlyph } from './BadgeGlyph';

/**
 * Shown inside a level when hearts hit zero. The player can re-read any collected Role Card
 * here and claim a heart (once per card per day), or wait for the refill, then continue
 * exactly where they stopped. Nothing is unmounted, so no progress is lost.
 */
export function HeartsSheet({
  open,
  onContinue,
  onQuit,
  worldId,
}: {
  open: boolean;
  onContinue: () => void;
  onQuit: () => void;
  /** Cards from this world are listed first. */
  worldId?: string;
}) {
  const hearts = useProgress((s) => s.hearts);
  const heartsUpdatedAt = useProgress((s) => s.heartsUpdatedAt);
  const cardsViewed = useProgress((s) => s.cardsViewed);
  const claim = useProgress((s) => s.claimCodexHeart);
  const syncHearts = useProgress((s) => s.syncHearts);
  const [reading, setReading] = useState<string | null>(null);
  const [, tick] = useState(0);

  // Keep the refill countdown honest while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => {
      syncHearts();
      tick((n) => n + 1);
    }, 15_000);
    return () => window.clearInterval(id);
  }, [open, syncHearts]);

  const today = dayKey();
  const claimable = Object.keys(cardsViewed)
    .map((id) => content.roleById[id])
    .filter((r): r is NonNullable<typeof r> => !!r && cardsViewed[r.id]?.lastHeartClaimDay !== today)
    .sort((a, b) => Number(b.worldId === worldId) - Number(a.worldId === worldId));
  const wait = msToNextHeart({ hearts, heartsUpdatedAt });
  const readingRole = reading ? content.roleById[reading] : undefined;

  return (
    <Modal open={open} title={hearts > 0 ? 'Heart restored' : 'Out of hearts'}>
      <div className="flex flex-col gap-3" data-testid="hearts-sheet">
        <Hearts hearts={hearts} />
        {hearts > 0 ? (
          <Button size="lg" full onClick={onContinue} data-testid="hearts-continue">
            Continue where you left off
          </Button>
        ) : (
          <p className="text-sm text-muted">
            Your progress in this level is kept. Re-read a Role Card for a heart, or wait{' '}
            {wait ? `about ${Math.ceil(wait / 60_000)} minutes` : `${economy.hearts.refillMinutes} minutes`}{' '}
            for the next refill.
          </p>
        )}
        {readingRole ? (
          <div className="rounded-2xl bg-surface-2 p-3 text-sm" data-testid="hearts-reading">
            <p className="font-bold">{readingRole.title}</p>
            <RichText as="p" text={readingRole.card.whatIDo} className="mt-1" />
            <ul className="mt-2 grid gap-1">
              {readingRole.card.responsibilities.map((r, i) => (
                <li key={i}>
                  • <RichText text={r} />
                </li>
              ))}
            </ul>
            <Button
              className="mt-3"
              full
              onClick={() => {
                if (claim(readingRole.id)) setReading(null);
              }}
              data-testid="hearts-claim"
            >
              Reviewed it: claim a heart
            </Button>
          </div>
        ) : (
          hearts === 0 && (
            <ul className="grid max-h-[40dvh] gap-1 overflow-y-auto" aria-label="Role cards you can review">
              {claimable.length === 0 && (
                <li className="text-sm text-muted">
                  Every card has been reviewed today. Wait for the refill.
                </li>
              )}
              {claimable.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setReading(r.id)}
                    className="tap flex w-full items-center gap-2 rounded-xl border-2 border-border bg-surface px-3 py-2 text-left text-sm font-semibold"
                    data-testid={`hearts-card-${r.id}`}
                  >
                    <BadgeGlyph icon={r.badgeIcon} size={18} />
                    Re-read: {r.title}
                  </button>
                </li>
              ))}
            </ul>
          )
        )}
        <Button variant="ghost" full onClick={onQuit}>
          Quit to map (your stage progress is saved)
        </Button>
      </div>
    </Modal>
  );
}
