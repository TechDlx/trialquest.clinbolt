import type { ReactNode } from 'react';
import { href, type Route } from '@/app/router';
import { BookIcon, GearIcon, ListIcon, MapIcon, ShareIcon } from './Icons';

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
      className="sticky bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur safe-bottom"
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

/** Standard page frame: scrollable content plus bottom navigation. */
export function Page({
  children,
  nav,
  className = '',
}: {
  children: ReactNode;
  nav?: Route['name'];
  className?: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className={`mx-auto w-full max-w-3xl flex-1 px-4 pb-6 safe-top ${className}`}>{children}</main>
      {nav && <BottomNav current={nav} />}
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
