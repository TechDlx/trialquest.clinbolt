import type { HTMLAttributes, ReactNode } from 'react';

export function Card({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={`rounded-card bg-surface shadow-card border border-border/60 ${className}`} {...rest}>
      {children}
    </div>
  );
}
