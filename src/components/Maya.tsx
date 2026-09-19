/** Maya, the patient. Simple flat SVG portrait. */
export function Maya({ size = 96, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" role="img" aria-label="Maya" className={className}>
      <circle cx="48" cy="48" r="46" fill="#fde68a" />
      <path d="M22 60c0-22 10-36 26-36s26 14 26 36v10H22z" fill="#3f2a1d" />
      <circle cx="48" cy="50" r="19" fill="#c68642" />
      <path d="M29 44c2-12 9-18 19-18s17 6 19 18c-4-6-10-9-19-9s-15 3-19 9z" fill="#3f2a1d" />
      <circle cx="41" cy="50" r="2.4" fill="#0f172a" />
      <circle cx="55" cy="50" r="2.4" fill="#0f172a" />
      <path d="M42 59q6 4 12 0" stroke="#0f172a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M22 96c2-14 12-22 26-22s24 8 26 22z" fill="#0f766e" />
    </svg>
  );
}
