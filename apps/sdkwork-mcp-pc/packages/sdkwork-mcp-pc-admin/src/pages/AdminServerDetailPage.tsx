import { FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Button,
  ErrorAlert,
  Field,
  LoadingState,
  PageHeader,
  TextInput,
} from '@sdkwork/mcp-pc-commons';
import { ConfirmModal, SurfaceDrawer } from '../components/SurfaceOverlay.tsx';
import {
  deleteAdminConnector,
  fetchServerDetail,
  listAdminConnectors,
  upsertAdminConnector,
  useAsyncResource,
  useMCPClients,
  type UpsertMcpConnectorCommand,
} from '@sdkwork/mcp-pc-core';

import { AdminCapabilityPanel } from '../components/AdminCapabilityPanel';
import { AdminServerSettingsPanel } from '../components/AdminServerSettingsPanel';
import { mcpAdminLabel, useMcpAdminCopy } from '../copy/mcpAdminCopy';
import { useMcpAdminServersBasePath } from '../routeContext';

const defaultConnector: UpsertMcpConnectorCommand = {
  connector_key: 'default',
  transport: 'stdio',
  command_ref: 'npx',
  args_json: '[]',
  env_schema_json: '{}',
  auth_type: 'none',
  publish_status: 'draft',
  lifecycle_status: 'draft',
};

type AdminTab = 'connectors' | 'capabilities' | 'settings';

export function AdminServerDetailPage() {
  const clients = useMCPClients();
  const copy = useMcpAdminCopy();
  const serversBasePath = useMcpAdminServersBasePath();
  const { serverKey = '' } = useParams();
  const [tab, setTab] = useState<AdminTab>('connectors');
  const [error, setError] = useState<string | null>(null);
  const [connectorForm, setConnectorForm] = useState<UpsertMcpConnectorCommand>(defaultConnector);
  const [connectorDrawerOpen, setConnectorDrawerOpen] = useState(false);
  const [deleteConnectorKey, setDeleteConnectorKey] = useState<string | null>(null);
  const [deletingConnector, setDeletingConnector] = useState(false);
  const { data, error: detailError, loading, reload } = useAsyncResource(async () => {
    const detail = await fetchServerDetail(clients, serverKey);
    const connectors = await listAdminConnectors(clients, detail.server.id);
    return { ...detail, connectors };
  }, [clients, serverKey]);

  async function onCreateConnector(event: FormEvent) {
    event.preventDefault();
    if (!data) {
      return;
    }
    setError(null);
    try {
      await upsertAdminConnector(clients, data.server.id, connectorForm);
      setConnectorForm(defaultConnector);
      setConnectorDrawerOpen(false);
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  async function confirmDeleteConnector() {
    if (!data || !deleteConnectorKey) {
      return;
    }
    setDeletingConnector(true);
    setError(null);
    try {
      await deleteAdminConnector(clients, data.server.id, deleteConnectorKey);
      setDeleteConnectorKey(null);
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setDeletingConnector(false);
    }
  }

  if (loading) {
    return <LoadingState label={copy.serverDetail.loading} />;
  }

  if (detailError) {
    return <ErrorAlert message={detailError} />;
  }

  if (!data) {
    return null;
  }

  const { server, tools, resources, prompts, connectors } = data;

  return (
    <div className="embedded-fill-page">
      <div className="mb-4">
        <Link
          to={serversBasePath}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {copy.serverDetail.back}
        </Link>
      </div>
      <PageHeader
        title={server.name}
        description={copy.serverDetail.description(server.server_key)}
      />
      {error ? (
        <div className="mb-4">
          <ErrorAlert message={error} />
        </div>
      ) : null}
      <div className="mb-6 flex gap-2 border-b border-slate-200 dark:border-zinc-800">
        {([
          ['connectors', copy.serverDetail.connectorsTab(connectors.length)],
          [
            'capabilities',
            copy.serverDetail.capabilitiesTab(tools.length + resources.length + prompts.length),
          ],
          ['settings', copy.serverDetail.settingsTab],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === value ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100'}`}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'connectors' ? (
        <section className="embedded-fill-page" style={{ padding: 0 }}>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => {
                setConnectorForm(defaultConnector);
                setConnectorDrawerOpen(true);
              }}
            >
              {copy.serverDetail.connectors.add}
            </Button>
          </div>
          <div className="data-surface">
            <div className="table-frame">
              {connectors.length === 0 ? (
                <div className="empty-state">
                  <h3>{copy.serverDetail.connectors.empty.title}</h3>
                  <p>{copy.serverDetail.connectors.empty.description}</p>
                  <button
                    type="button"
                    className="skills-console-primary"
                    onClick={() => {
                      setConnectorForm(defaultConnector);
                      setConnectorDrawerOpen(true);
                    }}
                  >
                    {copy.serverDetail.connectors.empty.action}
                  </button>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>{copy.serverDetail.connectors.table.connector}</th>
                      <th>{copy.serverDetail.connectors.table.transport}</th>
                      <th>{copy.serverDetail.connectors.table.publish}</th>
                      <th>{copy.serverDetail.connectors.table.lifecycle}</th>
                      <th>{copy.serverDetail.connectors.table.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {connectors.map((connector) => (
                      <tr key={connector.id}>
                        <td>{connector.connector_key}</td>
                        <td>{mcpAdminLabel(copy, 'transport', connector.transport)}</td>
                        <td>{mcpAdminLabel(copy, 'publishStatus', connector.publish_status)}</td>
                        <td>{mcpAdminLabel(copy, 'lifecycle', connector.lifecycle_status)}</td>
                        <td>
                          <Button
                            variant="danger"
                            onClick={() => setDeleteConnectorKey(connector.connector_key)}
                          >
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
            open={connectorDrawerOpen}
            title={copy.serverDetail.connectors.drawer.title}
            onClose={() => setConnectorDrawerOpen(false)}
          >
            {/* `skills-console-form` is the host console contract; `grid gap-4` covers the
                standalone `sdkwork-mcp-pc` app, whose Tailwind entry defines no contract. */}
            <form onSubmit={onCreateConnector} className="skills-console-form grid gap-4">
              <Field label={copy.serverDetail.fields.connectorKey}>
                <TextInput
                  value={connectorForm.connector_key}
                  onChange={(event) =>
                    setConnectorForm({ ...connectorForm, connector_key: event.target.value })
                  }
                  required
                />
              </Field>
              <Field label={copy.serverDetail.fields.transport}>
                <TextInput
                  value={connectorForm.transport}
                  onChange={(event) =>
                    setConnectorForm({ ...connectorForm, transport: event.target.value })
                  }
                  required
                />
              </Field>
              <Field label={copy.serverDetail.fields.commandRef}>
                <TextInput
                  value={connectorForm.command_ref ?? ''}
                  onChange={(event) =>
                    setConnectorForm({ ...connectorForm, command_ref: event.target.value })
                  }
                />
              </Field>
              <Field label={copy.serverDetail.fields.endpointUrl}>
                <TextInput
                  value={connectorForm.endpoint_url ?? ''}
                  onChange={(event) =>
                    setConnectorForm({ ...connectorForm, endpoint_url: event.target.value })
                  }
                />
              </Field>
              <Field
                label={copy.serverDetail.fields.secretRef}
                hint={copy.serverDetail.fields.secretRefHint}
              >
                <TextInput
                  value={connectorForm.secret_ref ?? ''}
                  onChange={(event) =>
                    setConnectorForm({ ...connectorForm, secret_ref: event.target.value })
                  }
                />
              </Field>
              <div className="sdkwork-surface-drawer-form-actions">
                <Button type="button" variant="secondary" onClick={() => setConnectorDrawerOpen(false)}>
                  {copy.common.cancel}
                </Button>
                <Button type="submit">{copy.serverDetail.connectors.save}</Button>
              </div>
            </form>
          </SurfaceDrawer>
          <ConfirmModal
            open={deleteConnectorKey != null}
            title={copy.serverDetail.connectors.delete.title}
            description={copy.serverDetail.connectors.delete.description(deleteConnectorKey ?? '')}
            confirmLabel={copy.common.delete}
            cancelLabel={copy.common.cancel}
            busy={deletingConnector}
            onCancel={() => setDeleteConnectorKey(null)}
            onConfirm={() => {
              void confirmDeleteConnector();
            }}
          />
        </section>
      ) : tab === 'capabilities' ? (
        <div className="data-surface">
          <div className="table-frame">
            <AdminCapabilityPanel
              serverId={server.id}
              connectors={connectors}
              tools={tools}
              resources={resources}
              prompts={prompts}
              onSaved={reload}
            />
          </div>
        </div>
      ) : (
        <div className="data-surface">
          <div className="table-frame">
            <AdminServerSettingsPanel server={server} serverKey={serverKey} onSaved={reload} />
          </div>
        </div>
      )}
    </div>
  );
}
