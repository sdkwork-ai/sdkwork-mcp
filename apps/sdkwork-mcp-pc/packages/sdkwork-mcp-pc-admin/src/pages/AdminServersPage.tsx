import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isBlank, trim } from '@sdkwork/utils';
import {
  Badge,
  Button,
  ErrorAlert,
  Field,
  healthTone,
  normalizeAllowedRoleCodes,
  PageHeader,
  RoleMultiSelect,
  TextInput,
} from '@sdkwork/mcp-pc-commons';
import { isDrivePackageRef } from '@sdkwork/mcp-pc-commons/driveUri';
import {
  createAdminServer,
  createMcpServerIconImageService,
  deleteAdminServer,
  listAdminCategories,
  listAdminServers,
  updateAdminServer,
  useAsyncResource,
  useMCPClients,
  type AdminServerListFilters,
  type CreateMcpServerCommand,
  type McpServerCategoryRecord,
} from '@sdkwork/mcp-pc-core';
import {
  DriveUploadImage,
  useDriveUploadImageController,
  useDriveUploadImageSnapshot,
} from 'sdkwork-drive-pc-upload-image';

import { ConfirmModal, SurfaceDrawer } from '../components/SurfaceOverlay.tsx';
import { mcpAdminLabel, useMcpAdminCopy, type McpAdminCopy } from '../copy/mcpAdminCopy';
import { useMcpAdminServersBasePath } from '../routeContext';

/**
 * Seed for a new server. Display name and description are copy so a Chinese
 * console does not prefill English; the key, category code, tag and transport
 * are identifiers and stay untranslated.
 */
function createServerForm(copy: McpAdminCopy): CreateMcpServerCommand {
  return {
    server_key: 'mcp.demo.sample',
    name: copy.servers.seed.name,
    description: copy.servers.seed.description,
    transport: 'stdio',
    visibility: 'tenant',
    category_code: 'general',
    tags: ['demo'],
    allowed_role_codes: [],
    icon_ref: '',
  };
}

/** Role column summary: an empty assignment means every role. */
function roleSummary(copy: McpAdminCopy, codes: readonly string[] | null | undefined): string {
  const allowed = normalizeAllowedRoleCodes(codes ?? []);
  return allowed.length === 0 ? copy.servers.table.allRoles : allowed.join(', ');
}

type OwnedServer = Awaited<ReturnType<typeof listAdminServers>>[number];

/**
 * Active category options for the filter select.
 *
 * A category can be retired after it was selected; retaining the selected
 * value as an option keeps the select from rendering blank while the server
 * list stays filtered by that code.
 */
function activeCategoryOptions(
  categories: readonly McpServerCategoryRecord[] | null | undefined,
  selected: string,
): { value: string; label: string }[] {
  const rows = categories ?? [];
  const options = rows
    .filter((category) => category.lifecycle_status === 'active')
    .slice()
    .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0))
    .map((category) => ({ value: category.category_code, label: category.name }));
  if (selected.length > 0 && !options.some((option) => option.value === selected)) {
    const retained = rows.find((category) => category.category_code === selected);
    options.push({ value: selected, label: retained?.name ?? selected });
  }
  return options;
}

/** Data-scope selector of the catalog list; `mine` = the operator's roles. */
type RoleScope = 'all' | 'mine';

export interface AdminServersPageProps {
  /**
   * IAM role codes of the signed-in operator, supplied by the composing host.
   *
   * The page offers the catalog's role-scope switch with them: `All data`
   * lists the whole tenant registry, `My roles` keeps the servers this
   * operator can reach. Without role codes the switch stays on `All data`,
   * because a scope the host cannot name would silently empty the table.
   */
  roleCodes?: readonly string[];
}

export function AdminServersPage({ roleCodes = [] }: AdminServersPageProps = {}) {
  const clients = useMCPClients();
  const copy = useMcpAdminCopy();
  const serversBasePath = useMcpAdminServersBasePath();
  const [form, setForm] = useState<CreateMcpServerCommand>(() => createServerForm(copy));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OwnedServer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [roleScope, setRoleScope] = useState<RoleScope>('all');

  const usableRoleCodes = useMemo(
    () => roleCodes.map((code) => trim(code)).filter((code) => !isBlank(code)),
    [roleCodes],
  );
  const roleScopeCodes = roleScope === 'mine' ? [...usableRoleCodes].sort().join(',') : '';
  const listFilters = useMemo<AdminServerListFilters>(
    () => ({
      ...(isBlank(trim(keyword)) ? {} : { q: trim(keyword) }),
      ...(isBlank(trim(categoryCode)) ? {} : { categoryCode: trim(categoryCode) }),
      ...(isBlank(roleScopeCodes) ? {} : { roleCodes: roleScopeCodes }),
    }),
    [keyword, categoryCode, roleScopeCodes],
  );

  const { data: servers, error: loadError, loading, reload } = useAsyncResource(
    () => listAdminServers(clients, listFilters),
    [clients, listFilters],
  );
  const { data: categories } = useAsyncResource(
    () => listAdminCategories(clients),
    [clients],
  );

  // Persist-first icon flow: the server record does not exist while the picker
  // is open, so the controller holds the picked image in `pending` and the
  // upload runs after `createAdminServer` returns the entity id (DRIVE_SPEC.md
  // section 18.3 — appResourceId must anchor an existing entity).
  const iconService = useMemo(() => createMcpServerIconImageService(clients.drive), [clients]);
  const iconController = useDriveUploadImageController({ service: iconService, accept: ['image/*'] });
  const iconSnapshot = useDriveUploadImageSnapshot(iconController);
  const iconRefText = iconSnapshot.values[iconSnapshot.values.length - 1]?.uri ?? '';

  function closeCreateDrawer() {
    setCreateOpen(false);
    iconController.clear();
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const record = await createAdminServer(clients, {
        ...form,
        tags: form.tags?.filter((tag) => !isBlank(trim(tag))),
      });
      const uploaded = await iconController.uploadPending({ appResourceId: record.id });
      const iconRef = uploaded[uploaded.length - 1]?.uri;
      if (iconRef !== undefined && !isDrivePackageRef(iconRef)) {
        throw new Error(copy.common.iconRefInvalid);
      }
      if (iconRef !== undefined) {
        await updateAdminServer(clients, record.server_key, { icon_ref: iconRef });
      }
      setForm(createServerForm(copy));
      iconController.clear();
      setCreateOpen(false);
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await deleteAdminServer(clients, deleteTarget.server_key);
      setDeleteTarget(null);
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="embedded-fill-page">
      <PageHeader
        title={copy.servers.title}
        description={copy.servers.description}
        actions={(
          <Button type="button" onClick={() => setCreateOpen(true)}>
            {copy.servers.create}
          </Button>
        )}
      />
      {error || loadError ? <div className="mb-4"><ErrorAlert message={error ?? loadError ?? ''} /></div> : null}

      {/* Catalog filters: keyword, category, and the operator's role scope.
          They narrow the list endpoint itself, so the totals and the visible
          rows agree, and the four AI-foundation catalogs read consistently. */}
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <label className="grid max-w-xs gap-1 text-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
            {copy.servers.filters.keywordLabel}
          </span>
          <TextInput
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={copy.servers.filters.keywordPlaceholder}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
            {copy.servers.filters.categoryLabel}
          </span>
          <select
            className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            value={categoryCode}
            onChange={(event) => setCategoryCode(event.target.value)}
          >
            <option value="">{copy.servers.filters.allCategories}</option>
            {activeCategoryOptions(categories, categoryCode).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-1 text-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
            {copy.servers.filters.roleScopeLabel}
          </span>
          <div
            className="inline-flex overflow-hidden rounded border border-slate-300 dark:border-zinc-700"
            role="group"
            aria-label={copy.servers.filters.roleScopeLabel}
          >
            {(['all', 'mine'] as const).map((scope) => {
              const disabled = scope === 'mine' && usableRoleCodes.length === 0;
              return (
                <button
                  key={scope}
                  type="button"
                  className={
                    roleScope === scope
                      ? 'bg-blue-600 px-3 py-1 text-xs font-medium text-white'
                      : 'px-3 py-1 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800'
                  }
                  aria-pressed={roleScope === scope}
                  disabled={disabled}
                  title={disabled ? copy.servers.filters.roleScopeUnavailable : undefined}
                  onClick={() => setRoleScope(scope)}
                >
                  {scope === 'all'
                    ? copy.servers.filters.roleScopeAll
                    : copy.servers.filters.roleScopeMine}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="data-surface">
        <div className="table-frame">
          {loading && !servers ? (
            <p className="text-sm text-slate-500 dark:text-zinc-400">{copy.servers.loading}</p>
          ) : !servers || servers.length === 0 ? (
            <div className="empty-state">
              <h3>{copy.servers.empty.title}</h3>
              <p>{copy.servers.empty.description}</p>
              <button type="button" className="skills-console-primary" onClick={() => setCreateOpen(true)}>
                {copy.servers.empty.action}
              </button>
            </div>
          ) : (
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-zinc-800">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-zinc-800/60 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">{copy.servers.table.server}</th>
                <th className="px-4 py-3">{copy.servers.table.transport}</th>
                <th className="px-4 py-3">{copy.servers.table.health}</th>
                <th className="px-4 py-3">{copy.servers.table.lifecycle}</th>
                <th className="px-4 py-3">{copy.servers.table.roles}</th>
                <th className="px-4 py-3">{copy.servers.table.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {servers.map((server) => (
                <tr key={server.id}>
                  <td className="px-4 py-3">
                    <Link
                      to={`${serversBasePath}/${encodeURIComponent(server.server_key)}`}
                      className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {server.name}
                    </Link>
                    <p className="font-mono text-xs text-slate-500 dark:text-zinc-400">{server.server_key}</p>
                  </td>
                  <td className="px-4 py-3">{mcpAdminLabel(copy, 'transport', server.transport)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={healthTone(server.health_status)}>
                      {mcpAdminLabel(copy, 'health', server.health_status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{mcpAdminLabel(copy, 'lifecycle', server.lifecycle_status)}</td>
                  <td className="px-4 py-3">{roleSummary(copy, server.allowed_role_codes)}</td>
                  <td className="px-4 py-3">
                    <Button variant="danger" onClick={() => setDeleteTarget(server)}>
                      {copy.common.delete}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>

      <SurfaceDrawer
        open={createOpen}
        title={copy.servers.drawer.title}
        description={copy.servers.drawer.description}
        onClose={closeCreateDrawer}
      >
        {/* `skills-console-form` is the host console contract (`display:grid; gap:14px;
            max-width:40rem`); `grid gap-4` covers the standalone `sdkwork-mcp-pc` app,
            whose Tailwind entry defines no console contract at all. */}
        <form onSubmit={onSubmit} className="skills-console-form grid gap-4">
          <Field label={copy.servers.fields.serverKey}>
            <TextInput
              value={form.server_key}
              onChange={(event) => setForm({ ...form, server_key: event.target.value })}
              required
            />
          </Field>
          <Field label={copy.servers.fields.name}>
            <TextInput
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </Field>
          <Field label={copy.servers.fields.transport}>
            <TextInput
              value={form.transport}
              onChange={(event) => setForm({ ...form, transport: event.target.value })}
              required
            />
          </Field>
          <Field label={copy.servers.fields.categoryCode}>
            <TextInput
              value={form.category_code ?? ''}
              onChange={(event) => setForm({ ...form, category_code: event.target.value })}
            />
          </Field>
          <Field label={copy.servers.fields.tags} hint={copy.servers.fields.tagsHint}>
            <TextInput
              value={(form.tags ?? []).join(', ')}
              onChange={(event) =>
                setForm({
                  ...form,
                  tags: event.target.value.split(',').map((value) => trim(value)).filter(Boolean),
                })
              }
            />
          </Field>
          <RoleMultiSelect
            value={form.allowed_role_codes ?? []}
            onChange={(allowed_role_codes) => setForm({ ...form, allowed_role_codes })}
          />
          <Field label={copy.servers.fields.icon}>
            <DriveUploadImage
              controller={iconController}
              service={iconService}
              shape="circle"
              sizePx={64}
              accept={['image/*']}
              copy={copy.icon}
            />
            {iconRefText ? (
              <span className="font-mono text-xs text-slate-500 dark:text-zinc-400">
                {iconRefText}
              </span>
            ) : null}
          </Field>
          <div className="sdkwork-surface-drawer-form-actions">
            <Button type="button" variant="secondary" onClick={closeCreateDrawer}>
              {copy.common.cancel}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? copy.servers.creating : copy.servers.create}
            </Button>
          </div>
        </form>
      </SurfaceDrawer>

      <ConfirmModal
        open={deleteTarget != null}
        title={copy.servers.delete.title}
        description={copy.servers.delete.description(deleteTarget?.name ?? '')}
        confirmLabel={copy.common.delete}
        cancelLabel={copy.common.cancel}
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
    </div>
  );
}
