import type { ButtonHTMLAttributes } from 'react';

/**
 * Console button.
 *
 * Three rules from `THEME_DARKMODE_SPEC.md` are in play (`§1` token consumption,
 * `§4` pairing rule / `§8` F5):
 *
 * 1. Every light palette utility carries a `dark:` counterpart. This package
 *    also ships inside the standalone `sdkwork-mcp-pc` app, which mounts no
 *    `SdkworkThemeProvider` and therefore has no `--sdk-color-*` tokens.
 * 2. `primary` additionally carries the host's `.skills-console-primary`
 *    token class, and `danger` the host's
 *    `.sdkwork-surface-modal-confirm--danger`. Inside the Web Server host those
 *    unlayered rules are what actually paint the text: the host reset
 *    `button, input, select, textarea { color: inherit }` sits outside every
 *    `@layer`, and unlayered declarations outrank layered utilities — so the
 *    `text-white` below is INERT on a `<button>` there. Without the contract
 *    class a primary button renders with inherited body text on brand blue
 *    (~3.4:1) and a danger button with inherited body text on red
 *    (#18181b on #e11d48 ≈ 3.8:1 in light mode) instead of white-on-red.
 *    Hosts without the contract fall back to the utilities, where `text-white`
 *    is live and correct.
 * 3. `secondary` / `ghost` have no host contract of their own; they rely on the
 *    paired utilities, which is sufficient because their backgrounds come from
 *    the same layered utility layer as their foregrounds.
 */

const variants = {
  primary: 'skills-console-primary bg-blue-600 text-white hover:bg-blue-700',
  secondary:
    'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-700',
  danger:
    'sdkwork-surface-modal-confirm sdkwork-surface-modal-confirm--danger bg-rose-600 text-white hover:bg-rose-700',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
};

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
