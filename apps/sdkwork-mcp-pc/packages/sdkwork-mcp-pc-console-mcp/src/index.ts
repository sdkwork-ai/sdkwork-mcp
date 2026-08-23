export { EditMcpServerPage, MyMcpServersPage, RegisterMcpServerPage } from './pages';
export {
  formatMcpHealthLocalized,
  formatMcpVisibilityLocalized,
  normalizeMcpConsoleLocale,
  translateMcpConsole,
  type McpConsoleLocale,
  type McpConsoleMessageKey,
} from './i18n.ts';
export {
  McpConsoleLocaleProvider,
  useMcpConsoleLocale,
  useMcpConsoleT,
} from './locale.tsx';
