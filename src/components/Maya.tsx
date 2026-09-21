import type { CSSProperties } from 'react';
import mayaUrl from '@/assets/maya.png';

/**
 * The unframed portrait, for scenes that place her in a setting rather than an avatar.
 * Decorative: the surrounding copy always names her.
 */
export function MayaPortrait({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <img src={mayaUrl} alt="" className={className} style={style} />;
}

/**
 * Maya, the patient. An illustrated portrait framed in a circle so every call site
 * keeps treating her as a square avatar. Offsets are percentages of the frame, so
 * `size` may be a pixel number or a CSS length such as "100%".
 */
export function Maya({ size = 96, className = '' }: { size?: number | string; className?: string }) {
  return (
    <span
      role="img"
      aria-label="Maya"
      className={`relative inline-block shrink-0 overflow-hidden rounded-full bg-maya ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={mayaUrl}
        alt=""
        className="absolute max-w-none"
        style={{ width: '134.5%', height: '160.7%', left: '-17.9%', top: '4.8%' }}
      />
    </span>
  );
}
