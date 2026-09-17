import type { ReactNode } from 'react';

// Paired light/dark utilities (`THEME_DARKMODE_SPEC.md` §4 pairing rule / §8 F5).
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between dark:border-zinc-800">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-zinc-400">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
