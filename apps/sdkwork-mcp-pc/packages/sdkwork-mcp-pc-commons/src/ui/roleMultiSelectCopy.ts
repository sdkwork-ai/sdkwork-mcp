import { useEffect, useState } from 'react';

/**
 * Local copy bundle for the shared MCP role multi-select.
 *
 * The control is rendered by the admin surfaces and by the console, and those
 * hosts come from different applications, so the copy travels with the
 * component instead of depending on host-specific translation keys. The
 * language is read from the host document language (`<html lang>`), which the
 * Cloud Router admin shell keeps in sync with its i18n instance.
 */
const en = {
  legend: 'Visible to roles',
  allRoles: 'All roles (default)',
  customRole: 'Custom role',
  roleLabels: {} as Record<string, string>,
};

export type RoleMultiSelectCopy = typeof en;

const zh: RoleMultiSelectCopy = {
  legend: '可见角色',
  allRoles: '全部角色（默认）',
  customRole: '自定义角色',
  roleLabels: {
    app_user: '应用用户',
    org_admin: '组织管理员',
    org_assistant: '组织助理',
    org_auditor: '组织审计员',
    org_finance: '组织财务',
    org_operations: '组织运营',
    platform_system_admin: '平台系统管理员',
    platform_super_admin: '平台超级管理员',
    mcp_admin_operator: 'MCP 管理员',
    mcp_workspace_user: 'MCP 工作区用户',
  },
};

export const ROLE_MULTI_SELECT_COPY: Record<'en' | 'zh', RoleMultiSelectCopy> = { en, zh };

function documentLanguage(): 'en' | 'zh' {
  if (typeof document === 'undefined') {
    return 'en';
  }
  return document.documentElement.lang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function useRoleMultiSelectLocale(): 'en' | 'zh' {
  const [language, setLanguage] = useState(documentLanguage);
  useEffect(() => {
    const update = () => setLanguage(documentLanguage());
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

export function useRoleMultiSelectCopy(): RoleMultiSelectCopy {
  return ROLE_MULTI_SELECT_COPY[useRoleMultiSelectLocale()];
}
