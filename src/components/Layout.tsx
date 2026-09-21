import type { ReactNode } from 'react';
import { href, type Route } from '@/app/router';
import { BookIcon, GearIcon, ListIcon, MapIcon, ShareIcon } from './Icons';
import logoUrl from '@/assets/clinbolt-logo.png';

export const DISCLAIMER =
  'Educational simulation. Veridian Syndrome and VX-101 are fictional. The process is simplified. Not medical or regulatory advice.';

export function Disclaimer({ className = '' }: { className?: string }) {
  return <p className={`text-center text-xs leading-snug text-muted ${className}`}>{DISCLAIMER}</p>;
}

const tabs: { route: Route; label: string; Icon: typeof MapIcon; testId: string }[] = [
  { route: { name: 'map' }, label: 'Map', Icon: MapIcon, testId: 'nav-map' },
  { route: { name: 'codex' }, label: 'Codex', Icon: BookIcon, testId: 'nav-codex' },
  { route: { name: 'handoff' }, label: 'Handoffs', Icon: ShareIcon, testId: 'nav-handoff' },
  { route: { name: 'glossary' }, label: 'Glossary', Icon: ListIcon, testId: 'nav-glossary' },
  { route: { name: 'settings' }, label: 'Settings', Icon: GearIcon, testId: 'nav-settings' },
];

export function BottomNav({ current }: { current: Route['name'] }) {
  return (
    <nav
      aria-label="Main"
      className="sticky bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur safe-bottom lg:hidden"
      data-testid="bottom-nav"
    >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-around">
        {tabs.map(({ route, label, Icon, testId }) => {
          const active = current === route.name;
          return (
            <li key={label} className="flex-1">
              <a
                href={href(route)}
                data-testid={testId}
                aria-current={active ? 'page' : undefined}
                className={`tap flex flex-col items-center justify-center gap-0.5 py-1.5 text-xs font-semibold ${
                  active ? 'text-brand-700 dark:text-brand-300' : 'text-muted'
                }`}
              >
                <Icon size={22} />
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** The same tabs as a left rail from 1024px up; the bottom bar hides at that width. */
export function SideNav({ current }: { current: Route['name'] }) {
  return (
    <nav
      aria-label="Main"
      className="sticky top-0 hidden h-dvh w-[232px] shrink-0 flex-col gap-6 border-r border-border bg-surface px-4 py-6 lg:flex"
      data-testid="side-nav"
    >
      <a href={href({ name: 'title' })} className="flex flex-col gap-1.5 px-2" aria-label="Trial Quest home">
        <img src={logoUrl} alt="ClinBolt" width="122" height="30" className="block h-[30px] w-auto self-start" />
        <span className="text-lg font-black tracking-tight text-brand-800 dark:text-brand-100">
          Trial Quest
        </span>
      </a>
      <ul className="flex flex-col gap-1">
        {tabs.map(({ route, label, Icon, testId }) => {
          const active = current === route.name;
          return (
            <li key={label}>
              <a
                href={href(route)}
                data-testid={`side-${testId}`}
                aria-current={active ? 'page' : undefined}
                className={`tap flex items-center gap-3 rounded-xl px-3 text-[15px] ${
                  active
                    ? 'bg-brand-100 font-extrabold text-brand-800 dark:bg-brand-800 dark:text-brand-100'
                    : 'font-semibold text-muted hover:bg-surface-2'
                }`}
              >
                <Icon size={20} />
                {label}
              </a>
            </li>
          );
        })}
      </ul>
      <Disclaimer className="mt-auto px-2 text-left" />
    </nav>
  );
}

/**
 * Standard page frame. Below 1024px: a single column with the bottom tabs. From 1024px: the tabs
 * become a left rail and the column widens. From 1280px an optional `aside` sits to the right.
 */
export function Page({
  children,
  nav,
  aside,
  className = '',
}: {
  children: ReactNode;
  nav?: Route['name'];
  /** Desktop-only side panel (1280px+): progress, context, next step. */
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {nav && <SideNav current={nav} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <div
          className={`mx-auto w-full max-w-3xl flex-1 px-4 lg:max-w-[800px] lg:px-8 ${
            aside ? 'xl:grid xl:max-w-[1200px] xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-8' : ''
          }`}
        >
          <main className={`min-w-0 pb-6 safe-top ${className}`}>{children}</main>
          {aside && (
            <aside className="hidden xl:block" aria-label="Your progress">
              <div className="sticky top-6 flex flex-col gap-4 pt-6">{aside}</div>
            </aside>
          )}
        </div>
        {nav && <BottomNav current={nav} />}
      </div>
    </div>
  );
}

export function TopBar({ title, back, right }: { title: string; back?: Route; right?: ReactNode }) {
  return (
    <header className="flex items-center gap-2 py-2">
      {back && (
        <a
          href={href(back)}
          aria-label="Back"
          className="tap inline-flex items-center justify-center rounded-xl text-fg"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
        </a>
      )}
      <h1 className="flex-1 truncate text-lg font-bold">{title}</h1>
      {right}
    </header>
  );
}
