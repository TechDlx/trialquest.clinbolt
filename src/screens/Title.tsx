import logoUrl from '@/assets/clinbolt-logo.png';
import { Button } from '@/components/Button';
import { Dose } from '@/components/Mascot';
import { Maya } from '@/components/Maya';
import { Disclaimer } from '@/components/Layout';
import { ArrowRightIcon, BadgeIcon, ClockIcon, StarIcon } from '@/components/Icons';
import { navigate } from '@/app/router';
import { useProgress } from '@/store/progress';
import { rankForXp } from '@/content/economy';
import { startSegment } from '@/engine/timing';

/**
 * The relay in one picture: Dose hands work along a dotted path through the lab,
 * the protocol and the clinic, and it ends with Maya. Glyphs take `currentColor`
 * so the whole scene follows the theme.
 */
function QuestScene({ className = '' }: { className?: string }) {
  return (
    <div className={`relative mx-auto w-full max-w-[350px] lg:max-w-[630px] ${className}`}>
      {/* Desktop only: a soft halo that holds the picture in the wide right column. */}
      <span
        className="absolute -top-[12%] bottom-[-4%] left-[4%] right-[4%] hidden rounded-full bg-tile-role lg:block dark:bg-tile-role-dark"
        aria-hidden="true"
      />
      <svg
        viewBox="0 0 350 240"
        className="relative block h-auto w-full text-brand-700 dark:text-brand-300"
        aria-hidden="true"
      >
        <g fill="currentColor" opacity="0.08">
          <ellipse cx="62" cy="44" rx="46" ry="15" />
          <ellipse cx="86" cy="33" rx="25" ry="13" />
        </g>
        <path d="M330 236c-12-26 0-48 20-56-4 26-6 44-12 56z" fill="#6ee7b7" />
        <path d="M310 236c-6-22 6-42 24-48-8 18-12 32-12 48z" fill="#34d399" />

        {/* the hand-off path */}
        <path
          d="M120 170Q150 118 200 116T272 88"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="1 9"
        />

        {/* discovery */}
        <circle cx="150" cy="150" r="25" fill="var(--color-surface)" stroke="currentColor" strokeWidth="2" />
        <path
          d="M150 140l-10 16M150 140l10 16M140 156h20"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="150" cy="140" r="5.5" fill="currentColor" />
        <circle cx="140" cy="156" r="5.5" fill="#f59e0b" />
        <circle cx="160" cy="156" r="5.5" fill="#14b8a6" />

        {/* the study */}
        <circle cx="200" cy="118" r="25" fill="var(--color-surface)" stroke="currentColor" strokeWidth="2" />
        <path d="M191 125h18l2.5 5a3 3 0 0 1-3 3h-17a3 3 0 0 1-3-3z" fill="currentColor" opacity="0.4" />
        <path
          d="M196 102h8v9l8 15a3 3 0 0 1-3 5h-18a3 3 0 0 1-3-5l8-15z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M193 102h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

        {/* the clinic */}
        <circle cx="250" cy="142" r="25" fill="var(--color-surface)" stroke="currentColor" strokeWidth="2" />
        <rect
          x="239"
          y="130"
          width="22"
          height="26"
          rx="3"
          fill="var(--color-surface)"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <rect x="245" y="126" width="10" height="7" rx="2" fill="currentColor" />
        <path
          d="M244 140h12M244 146h12M244 152h7"
          stroke="var(--color-locked)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <g fill="var(--color-muted)" fontSize="14" fontStyle="italic" fontWeight="600">
          <text x="142" y="30" transform="rotate(-6 142 30)">
            People like Maya
          </text>
          <text x="124" y="226" transform="rotate(-4 124 226)">
            Big work takes many people
          </text>
        </g>
        <g
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M250 36q10 6 13 16" />
          <path d="M258 49l5 4v-7" />
          <path d="M142 210q-9-13-15-25" />
          <path d="M124 190l2-7 5 5" />
        </g>
      </svg>

      <span className="absolute aspect-square" style={{ left: '1%', bottom: '2%', width: '34%' }}>
        <Dose size="100%" mood="cheer" />
      </span>
      <span
        className="absolute aspect-square rounded-full ring-4 ring-surface lg:ring-[6px]"
        style={{ right: '2%', top: '1%', width: '24%' }}
      >
        <Maya size="100%" />
      </span>
    </div>
  );
}

function Tile({
  icon,
  title,
  children,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  tone: 'role' | 'time';
}) {
  const skin =
    tone === 'role' ? 'bg-tile-role dark:bg-tile-role-dark' : 'bg-tile-time dark:bg-tile-time-dark';
  const body = tone === 'role' ? 'dark:text-brand-100' : 'dark:text-amber-200';
  return (
    <li className={`flex items-center gap-2 rounded-2xl p-2.5 lg:gap-3 lg:p-4 ${skin}`}>
      <span className="shrink-0 text-brand-700 dark:text-brand-300">{icon}</span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[15px] font-extrabold leading-tight lg:text-lg">{title}</span>
        <span className={`text-xs leading-[1.4] text-slate-700 lg:text-sm ${body}`}>{children}</span>
      </span>
    </li>
  );
}

export function TitleScreen() {
  const introSeen = useProgress((s) => s.introSeen);
  const xp = useProgress((s) => s.xp);
  const levelsDone = useProgress((s) => Object.values(s.levels).filter((l) => l.stars > 0).length);
  const hasProgress = introSeen || levelsDone > 0;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-3.5 px-4 py-5 safe-top safe-bottom lg:max-w-[1440px] lg:px-12 lg:pb-7 lg:pt-8 xl:px-[88px]">
      <header className="flex items-center justify-between gap-3">
        <span className="inline-flex rounded-xl dark:bg-white dark:px-2 dark:py-1">
          <img
            src={logoUrl}
            alt="ClinBolt"
            width="122"
            height="30"
            className="block h-[30px] w-auto lg:h-9"
          />
        </span>
        <span className="rounded-full border-2 border-brand-600 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-700 lg:px-4 lg:py-2 lg:text-xs dark:border-brand-300 dark:text-brand-300">
          Learn by playing
        </span>
      </header>

      {/* Phone: one column in reading order. From 1024px: copy, tiles and action left; picture right. */}
      <div className="flex flex-col gap-3.5 lg:grid lg:flex-1 lg:grid-cols-2 lg:content-center lg:gap-x-10 lg:gap-y-7 xl:grid-cols-[560px_minmax(0,1fr)] xl:gap-x-14">
        <div className="flex flex-col gap-2 lg:gap-2.5">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-700 lg:text-sm dark:text-brand-300">
            A clinical trial adventure
          </p>
          <h1 className="text-[clamp(2.75rem,13vw,3.625rem)] font-black leading-none tracking-tight text-brand-800 lg:text-7xl xl:text-8xl dark:text-fg">
            Trial Quest
          </h1>
          <p className="text-[clamp(1.5rem,7vw,1.75rem)] font-extrabold leading-tight text-brand-600 lg:mt-1.5 lg:text-4xl xl:text-[44px] dark:text-brand-300">
            From molecule
            <br />
            to medicine.
          </p>
          <p className="max-w-[20rem] text-[17px] leading-relaxed lg:mt-2 lg:max-w-[470px] lg:text-lg xl:text-xl">
            Step into 44 roles. Learn how a treatment reaches the people who need it.
          </p>
        </div>

        <QuestScene className="lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:self-center" />

        <ul className="grid grid-cols-2 gap-2 lg:gap-3">
          <Tile tone="role" icon={<BadgeIcon size={26} />} title="44 roles">
            Put on 44 different ID badges.
          </Tile>
          <Tile tone="time" icon={<ClockIcon size={26} />} title="1–3 min tasks">
            Play tasks that mimic real work.
          </Tile>
        </ul>

        {hasProgress ? (
          <>
            <div className="flex flex-col gap-3 rounded-card bg-brand-100 p-4 dark:bg-brand-800">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-700 dark:text-brand-200">
                Your journey
              </p>
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white dark:bg-brand-500 dark:text-brand-800">
                  <BadgeIcon size={30} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-xl font-extrabold leading-tight">
                    {rankForXp(xp).current.title}
                  </span>
                  <span className="flex items-center gap-1.5 text-[15px] font-bold">
                    <StarIcon size={18} className="text-star" />
                    {xp.toLocaleString()} XP
                  </span>
                </div>
                <svg width="72" height="50" viewBox="0 0 88 60" aria-hidden="true" className="shrink-0">
                  <path d="M0 60L30 18l18 24 12-14 28 32z" fill="#99f6e4" />
                  <path d="M22 60L52 14l36 46z" fill="#5eead4" />
                  <path d="M52 14v-10" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" />
                  <path d="M53 4h12l-3 4 3 4H53z" fill="#f59e0b" />
                </svg>
              </div>
              <div className="flex flex-col gap-2 lg:items-start xl:flex-row xl:items-center xl:gap-5">
                <Button
                  size="lg"
                  full
                  onClick={() => navigate({ name: 'map' })}
                  className="lg:w-[300px]"
                  data-testid="continue"
                >
                  Continue quest
                  <ArrowRightIcon size={20} />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate({ name: 'intro' })}
                  className="hidden lg:inline-flex"
                >
                  Replay the intro
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate({ name: 'intro' })}
              className="self-center lg:hidden"
            >
              Replay the intro
            </Button>
          </>
        ) : (
          <div className="flex flex-col gap-2.5 lg:items-start xl:flex-row xl:items-center xl:gap-5">
            <Button
              size="lg"
              full
              onClick={() => {
                startSegment('intro');
                navigate({ name: 'intro' });
              }}
              className="lg:w-[300px] lg:shrink-0"
              data-testid="play"
            >
              Start the quest
              <ArrowRightIcon size={20} />
            </Button>
            <p className="text-center text-[13px] text-muted lg:max-w-[220px] lg:text-left lg:text-[15px]">
              About 3 to 5 hours in all. Your progress saves on this device.
            </p>
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-2.5 pt-2">
        <div className="h-px bg-border" />
        <Disclaimer />
      </div>
    </div>
  );
}
