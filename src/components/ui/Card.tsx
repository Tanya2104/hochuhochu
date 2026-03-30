import type { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={
        `rounded-2xl bg-white/90 p-4 shadow-sm sm:p-6 ${className ?? ''}`.trim()
      }
    >
      {children}
    </div>
  );
}
