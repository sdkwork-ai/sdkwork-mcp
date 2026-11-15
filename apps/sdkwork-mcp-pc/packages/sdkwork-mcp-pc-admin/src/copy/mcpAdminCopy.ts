import { useEffect, useState } from 'react';

/**
 * Local copy bundle for the MCP administration block.
 *
 * The admin surfaces are mounted by several hosts (the standalone
 * `sdkwork-mcp-pc` app and the Cloud Router console), so the block carries its
 * own English and Chinese copy instead of depending on host-specific
 * translation keys. The language is read from the host document language
 * (`<html lang>`), which both hosts keep in sync with their i18n instance.
 *
 * Wire values are never translated here: `server_key`, `stdio`/`sse`/
 * `streamable_http`, JSON payloads, URLs and ids are identifiers. Only their
 * display labels are localized, which is why the label tables below are keyed
 * by the wire value itself.
 */

/**
 * Wire-value groups whose display labels are localized. Each group is a closed
 * set on the platform contract; values outside the table fall back to the wire
 * value so a newly added enum member still renders instead of throwing.
 */
export type McpAdminLabelGroup =
  | 'transport'
  | 'health'
  | 'lifecycle'
  | 'visibility'
  | 'publishStatus'
  | 'capabilityKind'
  | 'riskLevel';

/** Localized label table for one wire-value group. */
type LabelMap = Readonly<Record<string, string | undefined>>;

const LABELS_EN: Readonly<Record<McpAdminLabelGroup, LabelMap>> = {
  transport: {
    stdio: 'Stdio',
    sse: 'SSE',
    http: 'HTTP',
    streamable_http: 'Streamable HTTP',
  },
  health: {
    unknown: 'Unknown',
    healthy: 'Healthy',
    degraded: 'Degraded',
    unhealthy: 'Unhealthy',
  },
  lifecycle: {
    draft: 'Draft',
    active: 'Active',
    deprecated: 'Deprecated',
    archived: 'Archived',
  },
  visibility: {
    private: 'Private',
    tenant: 'Tenant',
    organization: 'Organization',
    public: 'Public',
  },
  publishStatus: {
    draft: 'Draft',
    published: 'Published',
    deprecated: 'Deprecated',
  },
  capabilityKind: {
    tool: 'tool',
    resource: 'resource',
    prompt: 'prompt',
  },
  riskLevel: {
    low: 'low',
    medium: 'medium',
    high: 'high',
  },
};

const LABELS_ZH: Readonly<Record<McpAdminLabelGroup, LabelMap>> = {
  transport: {
    stdio: 'stdio（标准输入输出）',
    sse: 'SSE（服务器发送事件）',
    http: 'HTTP',
    streamable_http: 'streamable_http（流式 HTTP）',
  },
  health: {
    unknown: '未知',
    healthy: '健康',
    degraded: '降级',
    unhealthy: '异常',
  },
  lifecycle: {
    draft: '草稿',
    active: '启用',
    deprecated: '已弃用',
    archived: '已归档',
  },
  visibility: {
    private: '私有',
    tenant: '租户',
    organization: '组织',
    public: '公开',
  },
  publishStatus: {
    draft: '草稿',
    published: '已发布',
    deprecated: '已弃用',
  },
  capabilityKind: {
    tool: '工具',
    resource: '资源',
    prompt: '提示词',
  },
  riskLevel: {
    low: '低',
    medium: '中',
    high: '高',
  },
};

/**
 * English copy. Not `as const`: the Chinese bundle is declared as
 * `McpAdminCopy = typeof en`, and literal string types would reject every
 * differing translation (`TS2322: Type '"MCP 服务"' is not assignable to type
 * '"MCP Servers"'`). Widened inference keeps both bundles structurally checked
 * against each other while allowing different text.
 */
const en = {
  common: {
    cancel: 'Cancel',
    delete: 'Delete',
    close: 'Close',
    iconRefInvalid: 'icon_ref must be a sdkwork-drive URI.',
  },
  /** Copy override for the drive upload-image picker. */
  icon: {
    pickImage: 'Upload icon',
    removeImage: 'Remove icon',
    uploading: 'Uploading…',
    uploadFailed: 'Upload failed',
  },
  labels: LABELS_EN,
  servers: {
    title: 'MCP Servers',
    description:
      'Register MCP servers, transport metadata, visibility, and drive-backed icons.',
    loading: 'Loading servers…',
    create: 'Create server',
    creating: 'Creating…',
    empty: {
      title: 'No MCP servers yet',
      description: 'Create the first server from the header action.',
      action: 'Create server',
    },
    table: {
      server: 'Server',
      transport: 'Transport',
      health: 'Health',
      lifecycle: 'Lifecycle',
      roles: 'Roles',
      actions: 'Actions',
      allRoles: 'All roles',
    },
    drawer: {
      title: 'Create server',
      description: 'Register transport metadata, visibility, and a drive-backed icon.',
    },
    fields: {
      serverKey: 'Server key',
      name: 'Name',
      transport: 'Transport',
      categoryCode: 'Category code',
      tags: 'Tags',
      tagsHint: 'Comma-separated',
      icon: 'Icon',
    },
    /** Seed values for a new server; identifiers stay untranslated. */
    seed: {
      name: 'Demo MCP Server',
      description: 'Sample MCP server registered through admin console.',
    },
    delete: {
      title: 'Delete MCP server?',
      description: (name: string) => `Delete “${name}”. This cannot be undone.`,
    },
  },
  serverDetail: {
    loading: 'Loading server admin view…',
    back: '← Back to servers',
    description: (serverKey: string) =>
      `Manage connectors, capabilities, and lifecycle settings for ${serverKey}.`,
    connectorsTab: (count: number) => `Connectors (${count})`,
    capabilitiesTab: (count: number) => `Capabilities (${count})`,
    settingsTab: 'Settings',
    connectors: {
      add: 'Add connector',
      empty: {
        title: 'No connectors',
        description: 'Add a connector to publish runtime configuration.',
        action: 'Add connector',
      },
      table: {
        connector: 'Connector',
        transport: 'Transport',
        publish: 'Publish',
        lifecycle: 'Lifecycle',
        actions: 'Actions',
      },
      drawer: {
        title: 'Upsert connector',
      },
      save: 'Save connector',
      delete: {
        title: 'Delete connector?',
        description: (connectorKey: string) =>
          `Delete “${connectorKey}”. This cannot be undone.`,
      },
    },
    fields: {
      connectorKey: 'Connector key',
      transport: 'Transport',
      commandRef: 'Command ref',
      endpointUrl: 'Endpoint URL',
      secretRef: 'Secret ref',
      secretRefHint: 'Never store plaintext secrets in MCP tables.',
    },
  },
  categories: {
    title: 'Categories',
    description:
      'Curate marketplace navigation groups. A category is identified by its code; saving an existing code updates it, and the backend exposes no delete.',
    create: 'Create category',
    loading: 'Loading categories…',
    empty: {
      title: 'No categories',
      description:
        'Create one from the header action. MCP servers cannot be registered without a category.',
      action: 'Create category',
    },
    table: {
      name: 'Name',
      code: 'Code',
      parent: 'Parent',
      sort: 'Sort',
      lifecycle: 'Lifecycle',
      actions: 'Actions',
      edit: 'Edit',
    },
    drawer: {
      createTitle: 'Create category',
      saveTitle: (categoryCode: string) => `Save ${categoryCode}`,
      codeExists: 'This code already exists — saving overwrites that category.',
      codeNew: 'New code — saving creates a category.',
      save: 'Save category',
      create: 'Create category',
    },
    fields: {
      categoryCode: 'Category code',
      name: 'Name',
      description: 'Description',
      parent: 'Parent category',
      noneTopLevel: 'None (top level)',
      sortOrder: 'Sort order',
      iconRef: 'Icon reference',
    },
    /** Seed values for a new category; the code stays untranslated. */
    seed: {
      name: 'Integrations',
      description: 'Third-party and integration MCP servers.',
    },
  },
  invocations: {
    title: 'Invocation Audit',
    description: 'Append-only audit trail with trace correlation and idempotency keys.',
    loading: 'Loading invocation audit log…',
    empty: {
      title: 'No invocations recorded',
      description: 'Runtime workers append audit rows via admin API.',
    },
    table: {
      target: 'Target',
      kind: 'Kind',
      status: 'Status',
      trace: 'Trace',
      invoked: 'Invoked',
    },
    server: (serverId: string) => `server ${serverId}`,
    footer: (count: number) =>
      `Showing ${count} recent rows. Sensitive payload fields remain governed by redaction policy.`,
  },
  capabilities: {
    requiresConnector: {
      title: 'Add a connector first',
      description: 'Tools, resources, and prompts are scoped to a connector.',
    },
    add: (kind: string) => `Add ${kind}`,
    save: (kind: string) => `Save ${kind}`,
    empty: (kind: string) => `No ${kind}s yet`,
    emptyHint: 'Add a capability from the header action.',
    enabled: 'Enabled',
    disabled: 'Disabled',
    fields: {
      connector: 'Connector',
      toolKey: 'Tool key',
      resourceKey: 'Resource key',
      promptKey: 'Prompt key',
      name: 'Name',
      riskLevel: 'Risk level',
      inputSchema: 'Input schema JSON',
      uri: 'URI',
      argumentsSchema: 'Arguments schema JSON',
    },
    /** Seed values for a new capability; keys, URIs and JSON stay untranslated. */
    seed: {
      toolName: 'Sample Tool',
      toolDescription: 'Example MCP tool capability',
      resourceName: 'Sample Resource',
      resourceDescription: 'Example MCP resource capability',
      promptName: 'Sample Prompt',
      promptDescription: 'Example MCP prompt capability',
    },
  },
  settings: {
    heading: 'Server settings',
    save: 'Save settings',
    saving: 'Saving…',
    fields: {
      name: 'Name',
      description: 'Description',
      transport: 'Transport',
      visibility: 'Visibility',
      lifecycleStatus: 'Lifecycle status',
      categoryCode: 'Category code',
      tags: 'Tags',
      tagsHint: 'Comma-separated',
      icon: 'Icon',
    },
  },
};

export type McpAdminCopy = typeof en;

const zh: McpAdminCopy = {
  common: {
    cancel: '取消',
    delete: '删除',
    close: '关闭',
    iconRefInvalid: 'icon_ref 必须是 sdkwork-drive URI。',
  },
  icon: {
    pickImage: '上传图标',
    removeImage: '移除图标',
    uploading: '上传中…',
    uploadFailed: '上传失败',
  },
  labels: LABELS_ZH,
  servers: {
    title: 'MCP 服务',
    description: '注册 MCP 服务，维护传输方式、可见范围与 Drive 存储的图标。',
    loading: '正在加载服务…',
    create: '创建服务',
    creating: '创建中…',
    empty: {
      title: '还没有 MCP 服务',
      description: '使用页头的创建操作添加第一个服务。',
      action: '创建服务',
    },
    table: {
      server: '服务',
      transport: '传输方式',
      health: '健康状态',
      lifecycle: '生命周期',
      roles: '角色',
      actions: '操作',
      allRoles: '所有角色',
    },
    drawer: {
      title: '创建服务',
      description: '注册传输方式、可见范围与 Drive 存储的图标。',
    },
    fields: {
      serverKey: '服务标识',
      name: '名称',
      transport: '传输方式',
      categoryCode: '分类编码',
      tags: '标签',
      tagsHint: '逗号分隔',
      icon: '图标',
    },
    seed: {
      name: '演示 MCP 服务',
      description: '通过管理控制台注册的示例 MCP 服务。',
    },
    delete: {
      title: '删除 MCP 服务？',
      description: (name) => `将删除“${name}”，此操作不可撤销。`,
    },
  },
  serverDetail: {
    loading: '正在加载服务管理视图…',
    back: '← 返回服务列表',
    description: (serverKey) => `管理 ${serverKey} 的连接器、能力与生命周期设置。`,
    connectorsTab: (count) => `连接器（${count}）`,
    capabilitiesTab: (count) => `能力（${count}）`,
    settingsTab: '设置',
    connectors: {
      add: '添加连接器',
      empty: {
        title: '还没有连接器',
        description: '添加连接器以发布运行时配置。',
        action: '添加连接器',
      },
      table: {
        connector: '连接器',
        transport: '传输方式',
        publish: '发布状态',
        lifecycle: '生命周期',
        actions: '操作',
      },
      drawer: {
        title: '保存连接器',
      },
      save: '保存连接器',
      delete: {
        title: '删除连接器？',
        description: (connectorKey) => `将删除“${connectorKey}”，此操作不可撤销。`,
      },
    },
    fields: {
      connectorKey: '连接器标识',
      transport: '传输方式',
      commandRef: '命令引用',
      endpointUrl: '端点 URL',
      secretRef: '密钥引用',
      secretRefHint: '不要在 MCP 数据表中保存明文密钥。',
    },
  },
  categories: {
    title: '分类',
    description:
      '维护市场导航分组。分类以编码作为唯一标识；保存已有编码即更新该分类，后端不提供删除能力。',
    create: '创建分类',
    loading: '正在加载分类…',
    empty: {
      title: '还没有分类',
      description: '使用页头操作创建一个分类。没有分类时无法注册 MCP 服务。',
      action: '创建分类',
    },
    table: {
      name: '名称',
      code: '编码',
      parent: '父分类',
      sort: '排序',
      lifecycle: '生命周期',
      actions: '操作',
      edit: '编辑',
    },
    drawer: {
      createTitle: '创建分类',
      saveTitle: (categoryCode) => `保存 ${categoryCode}`,
      codeExists: '该编码已存在 — 保存将覆盖对应分类。',
      codeNew: '新编码 — 保存将创建一个分类。',
      save: '保存分类',
      create: '创建分类',
    },
    fields: {
      categoryCode: '分类编码',
      name: '名称',
      description: '描述',
      parent: '父分类',
      noneTopLevel: '无（顶级分类）',
      sortOrder: '排序值',
      iconRef: '图标引用',
    },
    seed: {
      name: '集成',
      description: '第三方与集成类 MCP 服务。',
    },
  },
  invocations: {
    title: '调用记录',
    description: '仅追加的审计记录，包含链路追踪关联与幂等键。',
    loading: '正在加载调用审计日志…',
    empty: {
      title: '暂无调用记录',
      description: '运行时工作进程通过管理接口写入审计记录。',
    },
    table: {
      target: '调用目标',
      kind: '类型',
      status: '状态',
      trace: '链路',
      invoked: '调用时间',
    },
    server: (serverId) => `服务 ${serverId}`,
    footer: (count) => `显示最近 ${count} 条记录。敏感负载字段仍按脱敏策略处理。`,
  },
  capabilities: {
    requiresConnector: {
      title: '请先添加连接器',
      description: '工具、资源和提示词都归属于连接器。',
    },
    add: (kind) => `新增${kind}`,
    save: (kind) => `保存${kind}`,
    empty: (kind) => `还没有${kind}`,
    emptyHint: '使用页头操作添加能力。',
    enabled: '已启用',
    disabled: '已停用',
    fields: {
      connector: '连接器',
      toolKey: '工具标识',
      resourceKey: '资源标识',
      promptKey: '提示词标识',
      name: '名称',
      riskLevel: '风险等级',
      inputSchema: '输入结构 JSON',
      uri: 'URI',
      argumentsSchema: '参数结构 JSON',
    },
    seed: {
      toolName: '示例工具',
      toolDescription: 'MCP 工具能力示例',
      resourceName: '示例资源',
      resourceDescription: 'MCP 资源能力示例',
      promptName: '示例提示词',
      promptDescription: 'MCP 提示词能力示例',
    },
  },
  settings: {
    heading: '服务设置',
    save: '保存设置',
    saving: '保存中…',
    fields: {
      name: '名称',
      description: '描述',
      transport: '传输方式',
      visibility: '可见范围',
      lifecycleStatus: '生命周期状态',
      categoryCode: '分类编码',
      tags: '标签',
      tagsHint: '逗号分隔',
      icon: '图标',
    },
  },
};

export const MCP_ADMIN_COPY: Record<'en' | 'zh', McpAdminCopy> = { en, zh };

/**
 * Resolves the display label of one wire value.
 *
 * Unknown values fall back to the wire value itself, so a contract addition
 * stays readable instead of rendering `undefined`.
 */
export function mcpAdminLabel(
  copy: McpAdminCopy,
  group: McpAdminLabelGroup,
  value: string,
): string {
  return copy.labels[group][value] ?? value;
}

function documentLanguage(): 'en' | 'zh' {
  if (typeof document === 'undefined') {
    return 'en';
  }
  return document.documentElement.lang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

/** Reactive host language of the admin block (`<html lang>`). */
export function useMcpAdminLocale(): 'en' | 'zh' {
  const [language, setLanguage] = useState(documentLanguage);
  useEffect(() => {
    const update = () => setLanguage(documentLanguage);
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang'],
    });
    return () => observer.disconnect();
  }, []);
  return language;
}

/** Copy bundle for the current host language. */
export function useMcpAdminCopy(): McpAdminCopy {
  const language = useMcpAdminLocale();
  return MCP_ADMIN_COPY[language];
}
