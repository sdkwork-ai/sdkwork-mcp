import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isBlank, trim } from '@sdkwork/utils';
import {
  Badge,
  Button,
  ErrorAlert,
  Field,
  formatMcpHealth,
  formatMcpLifecycle,
  formatMcpTransport,
  healthTone,
  PageHeader,
  TextInput,
} from '@sdkwork/mcp-pc-commons';
import { isDrivePackageRef } from '@sdkwork/mcp-pc-commons/driveUri';
import {
  createAdminServer,
  createMcpServerIconImageService,
  deleteAdminServer,
  listAdminServers,
  updateAdminServer,
  useAsyncResource,
  useMCPClients,
  type CreateMcpServerCommand,
} from '@sdkwork/mcp-pc-core';
import {
  DriveUploadImage,
  useDriveUploadImageController,
  useDriveUploadImageSnapshot,
} from 'sdkwork-drive-pc-upload-image';

import { ConfirmModal, SurfaceDrawer } from '../components/SurfaceOverlay.tsx';
import { useMcpAdminServersBasePath } from '../routeContext';

const ICON_COPY = {
  pickImage: 'Upload icon',
  removeImage: 'Remove icon',
  uploading: 'Uploading…',
  uploadFailed: 'Upload failed',
} as const;

const defaultForm: CreateMcpServerCommand = {
  server_key: 'mcp.demo.sample',
  name: 'Demo MCP Server',
  description: 'Sample MCP server registered through admin console.',
  transport: 'stdio',
  visibility: 'tenant',
  category_code: 'general',
  tags: ['demo'],
  icon_ref: '',
};

type OwnedServer = Awaited<ReturnType<typeof listAdminServers>>[number];

export function AdminServersPage() {
  const clients = useMCPClients();
  const serversBasePath = useMcpAdminServersBasePath();
  const [form, setForm] = useState<CreateMcpServerCommand>(defaultForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OwnedServer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { data: servers, error: loadError, loading, reload } = useAsyncResource(
    () => listAdminServers(clients),
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
        throw new Error('icon_ref must be a sdkwork-drive URI.');
      }
      if (iconRef !== undefined) {
        await updateAdminServer(clients, record.server_key, { icon_ref: iconRef });
      }
      setForm(defaultForm);
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

  if (loading) {
    return <p className="text-sm text-slate-500 dark:text-zinc-400">Loading servers…</p>;
  }

  return (
    <div className="embedded-fill-page">
      <PageHeader
        title="MCP Servers"
        description="Register MCP servers, transport metadata, visibility, and drive-backed icons."
        actions={(
          <Button type="button" onClick={() => setCreateOpen(true)}>
            Create server
          </Button>
        )}
      />
      {error || loadError ? <div className="mb-4"><ErrorAlert message={error ?? loadError ?? ''} /></div> : null}
      <div className="data-surface">
        <div className="table-frame">
          {!servers || servers.length === 0 ? (
            <div className="empty-state">
              <h3>No MCP servers yet</h3>
              <p>Create the first server from the header action.</p>
              <button type="button" className="skills-console-primary" onClick={() => setCreateOpen(true)}>
                Create server
              </button>
            </div>
          ) : (
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-zinc-800">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-zinc-800/60 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Server</th>
                <th className="px-4 py-3">Transport</th>
                <th className="px-4 py-3">Health</th>
                <th className="px-4 py-3">Lifecycle</th>
                <th className="px-4 py-3">Actions</th>
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
                  <td className="px-4 py-3">{formatMcpTransport(server.transport)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={healthTone(server.health_status)}>
                      {formatMcpHealth(server.health_status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{formatMcpLifecycle(server.lifecycle_status)}</td>
                  <td className="px-4 py-3">
                    <Button variant="danger" onClick={() => setDeleteTarget(server)}>
                      Delete
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
        title="Create server"
        description="Register transport metadata, visibility, and a drive-backed icon."
        onClose={closeCreateDrawer}
      >
        {/* `skills-console-form` is the host console contract (`display:grid; gap:14px;
            max-width:40rem`); `grid gap-4` covers the standalone `sdkwork-mcp-pc` app,
            whose Tailwind entry defines no console contract at all. */}
        <form onSubmit={onSubmit} className="skills-console-form grid gap-4">
          <Field label="Server key">
            <TextInput
              value={form.server_key}
              onChange={(event) => setForm({ ...form, server_key: event.target.value })}
              required
            />
          </Field>
          <Field label="Name">
            <TextInput
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </Field>
          <Field label="Transport">
            <TextInput
              value={form.transport}
              onChange={(event) => setForm({ ...form, transport: event.target.value })}
              required
            />
          </Field>
          <Field label="Category code">
            <TextInput
              value={form.category_code ?? ''}
              onChange={(event) => setForm({ ...form, category_code: event.target.value })}
            />
          </Field>
          <Field label="Tags" hint="Comma-separated">
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
          <Field label="Icon">
            <DriveUploadImage
              controller={iconController}
              service={iconService}
              shape="circle"
              sizePx={64}
              accept={['image/*']}
              copy={ICON_COPY}
            />
            {iconRefText ? (
              <span className="font-mono text-xs text-slate-500 dark:text-zinc-400">
                {iconRefText}
              </span>
            ) : null}
          </Field>
          <div className="sdkwork-surface-drawer-form-actions">
            <Button type="button" variant="secondary" onClick={closeCreateDrawer}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create server'}
            </Button>
          </div>
        </form>
      </SurfaceDrawer>

      <ConfirmModal
        open={deleteTarget != null}
        title="Delete MCP server?"
        description={`Delete “${deleteTarget?.name ?? ''}”. This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
    </div>
  );
}
