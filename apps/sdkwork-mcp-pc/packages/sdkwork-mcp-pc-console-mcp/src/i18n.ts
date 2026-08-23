export type McpConsoleLocale = "en-US" | "zh-CN";

const enUs = {
  "mine.title": "My MCP Servers",
  "mine.description":
    "MCP servers you registered are active in your workspace. Marketplace publication is managed by administrators.",
  "mine.register": "Register a new MCP server",
  "mine.loading": "Loading your MCP servers…",
  "mine.empty": "You have not registered any MCP servers yet",
  "mine.empty.title": "No MCP servers yet",
  "mine.empty.description": "Register a server to manage it in this workspace.",
  "mine.empty.action": "Register MCP server",
  "mine.edit": "Edit",
  "mine.delete": "Delete",
  "mine.column.name": "Server",
  "mine.column.key": "Server key",
  "mine.column.health": "Health",
  "mine.column.visibility": "Visibility",
  "mine.column.actions": "Actions",
  "mine.delete.confirmTitle": "Delete MCP server?",
  "mine.delete.confirmDescription": "Delete “{name}” from your workspace. This cannot be undone.",
  "dialog.cancel": "Cancel",
  "register.title": "Register MCP Server",
  "register.description":
    "Register an MCP server into your workspace. The server becomes tenant-visible immediately; publication scope stays admin-managed.",
  "register.submit": "Register Server",
  "register.uploading": "Uploading...",
  "register.uploadIcon": "Upload Icon",
  "register.created": "Registered MCP server {id}.",
  "register.error.selectIcon": "Select an icon image to upload through sdkwork-drive.",
  "register.field.serverKey": "Server key",
  "register.field.name": "Display name",
  "register.field.description": "Description",
  "register.field.transport": "Transport",
  "register.field.commandRef": "Command reference",
  "register.field.commandRef.hint": "Drive reference to the local command descriptor",
  "register.field.endpointUrl": "Endpoint URL",
  "register.field.categoryCode": "Category code",
  "register.field.tags": "Tags",
  "register.field.tags.hint": "Comma separated",
  "register.field.icon": "Icon",
  "register.field.icon.hint": "Uploaded through sdkwork-drive",
  "register.placeholder.serverKey": "mcp.my-workspace-server",
  "register.placeholder.name": "My Workspace Server",
  "register.placeholder.description": "What this MCP server provides",
  "register.placeholder.commandRef": "drive://spaces/.../nodes/...",
  "register.placeholder.endpointUrl": "https://mcp.example.com/sse",
  "register.placeholder.categoryCode": "general",
  "register.placeholder.tags": "workspace, tools",
  "edit.title": "Edit {serverKey}",
  "edit.description":
    "Update metadata for an MCP server you own. Transport and server key stay immutable.",
  "edit.back": "Back to My MCP Servers",
  "edit.loading": "Loading MCP server…",
  "edit.save": "Save changes",
  "edit.notFound": "MCP server {serverKey} was not found in your workspace.",
  "edit.field.name": "Display name",
  "edit.field.description": "Description",
  "edit.field.categoryCode": "Category code",
  "edit.field.tags": "Tags",
  "edit.field.tags.hint": "Comma separated",
  "edit.field.iconRef": "Icon reference",
  "edit.placeholder.iconRef": "drive://spaces/.../nodes/...",
  "mine.visibility.private": "private",
  "mine.visibility.tenant": "tenant",
  "mine.visibility.public": "public",
  "health.unknown": "Unknown",
  "health.healthy": "Healthy",
  "health.degraded": "Degraded",
  "health.unhealthy": "Unhealthy",
} as const;

const zhCn: Record<keyof typeof enUs, string> = {
  "mine.title": "我的 MCP",
  "mine.description": "你注册的 MCP 服务器会在当前工作区保持可用。上架到市场由管理员处理。",
  "mine.register": "注册新的 MCP 服务器",
  "mine.loading": "正在加载你的 MCP 服务器…",
  "mine.empty": "你还没有注册任何 MCP 服务器",
  "mine.empty.title": "还没有 MCP 服务器",
  "mine.empty.description": "注册一台服务器后，可在此管理工作区实例。",
  "mine.empty.action": "注册 MCP 服务器",
  "mine.edit": "编辑",
  "mine.delete": "删除",
  "mine.column.name": "服务器",
  "mine.column.key": "服务器标识",
  "mine.column.health": "健康",
  "mine.column.visibility": "可见性",
  "mine.column.actions": "操作",
  "mine.delete.confirmTitle": "删除 MCP 服务器？",
  "mine.delete.confirmDescription": "将从工作区删除“{name}”，此操作不可撤销。",
  "dialog.cancel": "取消",
  "register.title": "注册 MCP 服务器",
  "register.description":
    "将 MCP 服务器注册到你的工作区。注册后立即对租户可见；发布范围仍由管理员管理。",
  "register.submit": "注册服务器",
  "register.uploading": "上传中…",
  "register.uploadIcon": "上传图标",
  "register.created": "已注册 MCP 服务器 {id}。",
  "register.error.selectIcon": "请选择要通过 sdkwork-drive 上传的图标图片。",
  "register.field.serverKey": "服务器标识",
  "register.field.name": "显示名称",
  "register.field.description": "描述",
  "register.field.transport": "传输方式",
  "register.field.commandRef": "命令引用",
  "register.field.commandRef.hint": "本地命令描述符的 Drive 引用",
  "register.field.endpointUrl": "端点 URL",
  "register.field.categoryCode": "分类代码",
  "register.field.tags": "标签",
  "register.field.tags.hint": "逗号分隔",
  "register.field.icon": "图标",
  "register.field.icon.hint": "通过 sdkwork-drive 上传",
  "register.placeholder.serverKey": "mcp.my-workspace-server",
  "register.placeholder.name": "我的工作区服务器",
  "register.placeholder.description": "该 MCP 服务器提供的能力",
  "register.placeholder.commandRef": "drive://spaces/.../nodes/...",
  "register.placeholder.endpointUrl": "https://mcp.example.com/sse",
  "register.placeholder.categoryCode": "general",
  "register.placeholder.tags": "workspace, tools",
  "edit.title": "编辑 {serverKey}",
  "edit.description": "更新你拥有的 MCP 服务器元数据。传输方式与服务器标识不可更改。",
  "edit.back": "返回我的 MCP",
  "edit.loading": "正在加载 MCP 服务器…",
  "edit.save": "保存更改",
  "edit.notFound": "工作区中未找到 MCP 服务器 {serverKey}。",
  "edit.field.name": "显示名称",
  "edit.field.description": "描述",
  "edit.field.categoryCode": "分类代码",
  "edit.field.tags": "标签",
  "edit.field.tags.hint": "逗号分隔",
  "edit.field.iconRef": "图标引用",
  "edit.placeholder.iconRef": "drive://spaces/.../nodes/...",
  "mine.visibility.private": "私有",
  "mine.visibility.tenant": "租户",
  "mine.visibility.public": "公开",
  "health.unknown": "未知",
  "health.healthy": "健康",
  "health.degraded": "降级",
  "health.unhealthy": "异常",
};

export type McpConsoleMessageKey = keyof typeof enUs;

const catalogs: Record<McpConsoleLocale, Record<McpConsoleMessageKey, string>> = {
  "en-US": enUs,
  "zh-CN": zhCn,
};

export function normalizeMcpConsoleLocale(locale?: string | null): McpConsoleLocale {
  if (!locale) {
    return "en-US";
  }
  const normalized = locale.trim().toLowerCase().replaceAll("_", "-");
  return normalized === "zh-cn" || normalized === "zh" || normalized.startsWith("zh-")
    ? "zh-CN"
    : "en-US";
}

export function formatMcpVisibilityLocalized(locale: McpConsoleLocale, value: string): string {
  switch (value) {
    case "private":
      return translateMcpConsole(locale, "mine.visibility.private");
    case "tenant":
      return translateMcpConsole(locale, "mine.visibility.tenant");
    case "public":
      return translateMcpConsole(locale, "mine.visibility.public");
    default:
      return value;
  }
}

export function translateMcpConsole(
  locale: McpConsoleLocale,
  key: McpConsoleMessageKey,
  values: Record<string, string | number> = {},
): string {
  const template = catalogs[locale][key] ?? catalogs["en-US"][key] ?? String(key);
  return Object.entries(values).reduce(
    (message, [name, value]) => message.replaceAll(`{${name}}`, String(value)),
    template,
  );
}

export function formatMcpHealthLocalized(locale: McpConsoleLocale, value: string): string {
  switch (value) {
    case "healthy":
      return translateMcpConsole(locale, "health.healthy");
    case "degraded":
      return translateMcpConsole(locale, "health.degraded");
    case "unhealthy":
      return translateMcpConsole(locale, "health.unhealthy");
    case "unknown":
      return translateMcpConsole(locale, "health.unknown");
    default:
      return value;
  }
}
