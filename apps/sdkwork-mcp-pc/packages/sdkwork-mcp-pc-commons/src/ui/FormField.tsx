import type { InputHTMLAttributes, ReactNode } from 'react';

/**
 * Canonical console field primitives.
 *
 * Two layers, both required (`THEME_DARKMODE_SPEC.md` §1 semantic consumption,
 * §4 pairing rule, §8 F5/F6):
 *
 * 1. `.skills-console-field*` — the token-driven console field contract owned by
 *    the embedding host, which `sdkwork-skills`' `CreateSkillForm` already
 *    consumes. It is declared with `var(--sdk-color-*)`, so inside the Web Server
 *    console the fields follow the live colour mode. The host declares it OUTSIDE
 *    every `@layer`, so it outranks the utilities below and is the real painter
 *    there.
 * 2. The layout/colour utilities below — this package also ships inside the
 *    standalone `sdkwork-mcp-pc` app, whose `src/index.css` is a 26-line Tailwind
 *    entry that defines no console contract at all. There the contract class is
 *    simply an unknown class name and these utilities are what style the field.
 *    Dropping them would silently break the standalone app, so they stay.
 *
 * Why the bare light utilities were not enough on their own: inside the host,
 * `button, input, select, textarea { color: inherit }` is declared outside every
 * `@layer`, and unlayered declarations outrank layered Tailwind utilities — so
 * `text-slate-900` never applied. Input paint came from inheritance, which is
 * exactly why dark mode rendered white-on-white.
 *
 * Every light utility is paired with a `dark:` counterpart (§8 F5).
 */

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="skills-console-field grid gap-1.5 text-sm">
      <span className="skills-console-field-label font-medium text-slate-700 dark:text-zinc-300">
        {label}
      </span>
      {children}
      {hint ? (
        <small className="skills-console-field-hint text-xs text-slate-500 dark:text-zinc-400">
          {hint}
        </small>
      ) : null}
    </label>
  );
}

const CONTROL_CLASS =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-blue-500 focus:border-blue-500 focus:ring-2 placeholder:text-slate-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-400';

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={CONTROL_CLASS} {...props} />;
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={CONTROL_CLASS} {...props} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`min-h-24 ${CONTROL_CLASS}`} {...props} />;
}
