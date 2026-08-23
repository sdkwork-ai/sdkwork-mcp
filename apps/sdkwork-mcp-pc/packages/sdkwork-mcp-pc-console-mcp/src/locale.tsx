import { createContext, useCallback, useContext, type ReactNode } from "react";
import {
  normalizeMcpConsoleLocale,
  translateMcpConsole,
  type McpConsoleLocale,
  type McpConsoleMessageKey,
} from "./i18n.ts";

const McpConsoleLocaleContext = createContext<McpConsoleLocale>("en-US");

export function McpConsoleLocaleProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale?: string | null;
}) {
  return (
    <McpConsoleLocaleContext.Provider value={normalizeMcpConsoleLocale(locale)}>
      {children}
    </McpConsoleLocaleContext.Provider>
  );
}

export function useMcpConsoleLocale(): McpConsoleLocale {
  return useContext(McpConsoleLocaleContext);
}

export function useMcpConsoleT() {
  const locale = useMcpConsoleLocale();
  return useCallback(
    (key: McpConsoleMessageKey, values: Record<string, string | number> = {}) =>
      translateMcpConsole(locale, key, values),
    [locale],
  );
}
