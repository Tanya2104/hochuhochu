import type { ReactNode } from 'react';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-violet-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">{children}</div>
    </div>
  );
}
