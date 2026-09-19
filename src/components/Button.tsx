import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white border-b-4 border-brand-800 hover:bg-brand-700 active:border-b-0 active:translate-y-1 disabled:bg-locked disabled:border-locked',
  secondary:
    'bg-surface text-fg border-2 border-border hover:bg-surface-2 active:translate-y-px disabled:text-muted',
  ghost: 'bg-transparent text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-surface-2',
  danger:
    'bg-bad text-white border-b-4 border-red-900 hover:brightness-110 active:border-b-0 active:translate-y-1',
};

const sizes: Record<Size, string> = {
  md: 'px-4 py-2.5 text-base',
  lg: 'px-5 py-3.5 text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  full,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`tap inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${variants[variant]} ${sizes[size]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
