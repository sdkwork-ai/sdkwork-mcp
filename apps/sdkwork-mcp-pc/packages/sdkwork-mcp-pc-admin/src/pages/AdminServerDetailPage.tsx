import { FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Button,
  ErrorAlert,
  Field,
  formatMcpPublishStatus,
  formatMcpTransport,
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
    return <LoadingState label="Loading server admin view…" />;
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
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to servers
        </Link>
      </div>
      <PageHeader
        title={server.name}
        description={`Manage connectors, capabilities, and lifecycle settings for ${server.server_key}.`}
      />
      {error ? (
        <div className="mb-4">
          <ErrorAlert message={error} />
        </div>
      ) : null}
      <div className="mb-6 flex gap-2 border-b border-slate-200">
        {([
          ['connectors', `Connectors (${connectors.length})`],
          ['capabilities', `Capabilities (${tools.length + resources.length + prompts.length})`],
          ['settings', 'Settings'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === value ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
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
              Add connector
            </Button>
          </div>
          <div className="data-surface">
            <div className="table-frame">
              {connectors.length === 0 ? (
                <div className="empty-state">
                  <h3>No connectors</h3>
                  <p>Add a connector to publish runtime configuration.</p>
                  <button
                    type="button"
                    className="skills-console-primary"
                    onClick={() => {
                      setConnectorForm(defaultConnector);
                      setConnectorDrawerOpen(true);
                    }}
                  >
                    Add connector
                  </button>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Connector</th>
                      <th>Transport</th>
                      <th>Publish</th>
                      <th>Lifecycle</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {connectors.map((connector) => (
                      <tr key={connector.id}>
                        <td>{connector.connector_key}</td>
                        <td>{formatMcpTransport(connector.transport)}</td>
                        <td>{formatMcpPublishStatus(connector.publish_status)}</td>
                        <td>{connector.lifecycle_status}</td>
                        <td>
                          <Button
                            variant="danger"
                            onClick={() => setDeleteConnectorKey(connector.connector_key)}
                          >
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
            open={connectorDrawerOpen}
            title="Upsert connector"
            onClose={() => setConnectorDrawerOpen(false)}
          >
            <form onSubmit={onCreateConnector} className="grid gap-4">
              <Field label="Connector key">
                <TextInput
                  value={connectorForm.connector_key}
                  onChange={(event) =>
                    setConnectorForm({ ...connectorForm, connector_key: event.target.value })
                  }
                  required
                />
              </Field>
              <Field label="Transport">
                <TextInput
                  value={connectorForm.transport}
                  onChange={(event) =>
                    setConnectorForm({ ...connectorForm, transport: event.target.value })
                  }
                  required
                />
              </Field>
              <Field label="Command ref">
                <TextInput
                  value={connectorForm.command_ref ?? ''}
                  onChange={(event) =>
                    setConnectorForm({ ...connectorForm, command_ref: event.target.value })
                  }
                />
              </Field>
              <Field label="Endpoint URL">
                <TextInput
                  value={connectorForm.endpoint_url ?? ''}
                  onChange={(event) =>
                    setConnectorForm({ ...connectorForm, endpoint_url: event.target.value })
                  }
                />
              </Field>
              <Field label="Secret ref" hint="Never store plaintext secrets in MCP tables.">
                <TextInput
                  value={connectorForm.secret_ref ?? ''}
                  onChange={(event) =>
                    setConnectorForm({ ...connectorForm, secret_ref: event.target.value })
                  }
                />
              </Field>
              <div className="sdkwork-surface-drawer-form-actions">
                <Button type="button" variant="secondary" onClick={() => setConnectorDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save connector</Button>
              </div>
            </form>
          </SurfaceDrawer>
          <ConfirmModal
            open={deleteConnectorKey != null}
            title="Delete connector?"
            description={`Delete “${deleteConnectorKey ?? ''}”. This cannot be undone.`}
            confirmLabel="Delete"
            cancelLabel="Cancel"
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
