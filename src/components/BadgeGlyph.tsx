import type { BadgeIcon } from '@/content/types';

/**
 * One small line-art glyph per badge icon. Kept deliberately simple (2px strokes, 24-unit grid)
 * so all 44 roles read consistently at 24-48px.
 */
const paths: Record<BadgeIcon, string> = {
  heart:
    'M12 20s-7-4.4-9-8.2C1.3 8.6 3 5 6.5 5c2 0 3.6 1.2 4.4 2.5C11.9 6.2 13.5 5 15.5 5 19 5 20.7 8.6 21 11.8 19 15.6 12 20 12 20z',
  flask: 'M9 3h6M10 3v6l-5.5 9A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-3L14 9V3M7.5 15h9',
  mouse: 'M4 14c0-4 3.6-7 8-7s8 3 8 7-3.6 5-8 5-8-1-8-5zM20 14c2 0 2-2 1-3M9 12h.01M8 7c-2-1-4 0-4 2',
  pill: 'M8.5 3.5l12 12a4.2 4.2 0 0 1-6 6l-12-12a4.2 4.2 0 0 1 6-6zM8.5 15.5l7-7',
  document: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6',
  chart: 'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3M20 16V6',
  stamp: 'M9 10V6a3 3 0 0 1 6 0v4M5 14h14v3H5zM7 17v3h10v-3',
  scale: 'M12 3v18M4 7h16M6 7l-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0zM8 21h8',
  coins:
    'M8 8a6 3 0 1 0 12 0 6 3 0 1 0-12 0zM8 8v4c0 1.7 2.7 3 6 3s6-1.3 6-3V8M4 12a6 3 0 0 0 4 2.8M4 12v4c0 1.7 2.7 3 6 3 1.4 0 2.6-.2 3.6-.6',
  calendar: 'M4 6h16v15H4zM4 10h16M8 3v5M16 3v5M8 14h2M14 14h2M8 18h2',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  truck:
    'M3 6h11v10H3zM14 10h4l3 3v3h-7zM6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  database:
    'M4 6c0 1.7 3.6 3 8 3s8-1.3 8-3-3.6-3-8-3-8 1.3-8 3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  dice: 'M4 4h16v16H4zM8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01',
  shield: 'M12 3l8 3v6c0 5-3.4 8.7-8 11-4.6-2.3-8-6-8-11V6zM9 12l2 2 4-4',
  folder: 'M3 6h6l2 2h10v12H3zM3 11h18',
  stethoscope: 'M6 3v6a5 5 0 0 0 10 0V3M11 14v3a4 4 0 0 0 8 0v-3M19 11a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  clipboard: 'M8 4h8v3H8zM6 6H5v15h14V6h-1M9 12h6M9 16h4',
  curve: 'M3 20C6 20 8 6 12 6s6 12 9 12M3 20h18',
  committee:
    'M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3M14 13h4a4 4 0 0 1 4 4v3',
  megaphone: 'M3 10v4h3l8 5V5L6 10zM17 9a4 4 0 0 1 0 6M20 6a8 8 0 0 1 0 12',
  magnifier: 'M10 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM14.5 14.5L21 21',
  tag: 'M3 12V3h9l9 9-9 9zM7.5 7.5h.01',
  siren: 'M6 18v-6a6 6 0 0 1 12 0v6M4 18h16v3H4zM12 3v2M4.5 6.5l1.5 1.5M19.5 6.5L18 8',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4M12 15v2',
  code: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
  pen: 'M4 20l4-1L19 8l-3-3L5 16zM14 7l3 3',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5',
  briefcase: 'M3 8h18v12H3zM9 8V5h6v3M3 13h18',
  factory: 'M3 21V10l5 3v-3l5 3v-3l5 3V7h3v14zM7 17h2M12 17h2M17 17h2',
  handshake: 'M2 9l4-3 4 1 3-1 4 3 5 1v6l-3 1-4 4-4-1-3 1-4-4-2-1zM11 6l-4 4 2 2 4-3',
  radar: 'M12 12L18 6M12 21a9 9 0 1 1 9-9M12 17a5 5 0 1 1 5-5M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  telescope: 'M4 14l12-8 2 4-12 8zM16 6l3-2 2 4-3 2M8 16l-3 5M10 16l3 5',
};

export function BadgeGlyph({
  icon,
  size = 28,
  className = '',
}: {
  icon: BadgeIcon;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={paths[icon]} />
    </svg>
  );
}
