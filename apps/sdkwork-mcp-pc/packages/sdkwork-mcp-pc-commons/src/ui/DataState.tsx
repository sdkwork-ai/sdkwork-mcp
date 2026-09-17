import type { ReactNode } from 'react';

// Paired light/dark utilities (`THEME_DARKMODE_SPEC.md` §4 pairing rule / §8 F5).
// The `dark:` values use the zinc ramp deliberately: it is the same palette the
// host's `--sdk-color-surface-panel` / `-panel-muted` tokens resolve to
// (#18181b / #27272a), so these panels sit flush against host-owned chrome —
// while still rendering correctly in the standalone `sdkwork-mcp-pc` app, which
// mounts no theme provider and has no `--sdk-color-*` tokens.
export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-slate-500 dark:text-zinc-400">{label}</p>
    </div>
  );
}

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
      role="alert"
    >
      {message}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-base font-medium text-slate-900 dark:text-zinc-100">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">{description}</p>
      ) : null}
    </div>
  );
}

export function DataPanel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {children}
    </div>
  );
}
