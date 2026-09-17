import type { ReactNode } from 'react';

// Paired light/dark utilities (`THEME_DARKMODE_SPEC.md` §4 pairing rule / §8 F5).
// Dark values use the zinc ramp so cards sit flush against the host's
// `--sdk-color-surface-panel` (#18181b) chrome, and still render in the
// standalone `sdkwork-mcp-pc` app (no theme provider, no `--sdk-color-*`).
export function Card({
  children,
  className = '',
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <article
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-900 ${className}`}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </article>
  );
}
