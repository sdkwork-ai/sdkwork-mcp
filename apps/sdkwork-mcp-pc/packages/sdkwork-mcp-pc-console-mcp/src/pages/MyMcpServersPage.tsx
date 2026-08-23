import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Badge,
  ErrorAlert,
  healthTone,
  LoadingState,
} from '@sdkwork/mcp-pc-commons';
import {
  deleteOwnMcpServer,
  listOwnedMcpServers,
  useAsyncResource,
  useMCPClients,
} from '@sdkwork/mcp-pc-core';
import { EditMcpServerForm } from '../components/EditMcpServerForm.tsx';
import { RegisterMcpServerForm } from '../components/RegisterMcpServerForm.tsx';
import { ConfirmModal, SurfaceDrawer } from '../components/SurfaceOverlay.tsx';
import { formatMcpHealthLocalized, formatMcpVisibilityLocalized } from '../i18n.ts';
import { useMcpConsoleLocale, useMcpConsoleT } from '../locale.tsx';

type DrawerState =
  | { kind: 'register' }
  | { kind: 'edit'; serverKey: string }
  | null;

type OwnedServer = Awaited<ReturnType<typeof listOwnedMcpServers>>[number];

export function MyMcpServersPage() {
  const t = useMcpConsoleT();
  const locale = useMcpConsoleLocale();
  const clients = useMCPClients();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, error, loading, reload } = useAsyncResource(
    () => listOwnedMcpServers(clients),
    [clients],
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [deleteTarget, setDeleteTarget] = useState<OwnedServer | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const register = searchParams.get('register');
    const editKey = searchParams.get('edit');
    if (register === '1' || register === 'true') {
      setDrawer({ kind: 'register' });
      return;
    }
    if (editKey) {
      setDrawer({ kind: 'edit', serverKey: editKey });
    }
  }, [searchParams]);

  function clearOverlayParams() {
    if (!searchParams.has('register') && !searchParams.has('edit')) return;
    const next = new URLSearchParams(searchParams);
    next.delete('register');
    next.delete('edit');
    setSearchParams(next, { replace: true });
  }

  function closeDrawer() {
    setDrawer(null);
    clearOverlayParams();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setActionError(null);
    try {
      await deleteOwnMcpServer(clients, deleteTarget.server_key);
      setDeleteTarget(null);
      await reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <LoadingState label={t('mine.loading')} />;
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  return (
    <section className="skills-console-page">
      <header className="skills-console-header">
        <div>
          <h2>{t('mine.title')}</h2>
          <p>{t('mine.description')}</p>
        </div>
        <button
          type="button"
          className="skills-console-primary"
          onClick={() => setDrawer({ kind: 'register' })}
        >
          {t('mine.register')}
        </button>
      </header>
      {actionError ? <ErrorAlert message={actionError} /> : null}
      <div className="data-surface">
        <div className="table-frame">
          {!data || data.length === 0 ? (
            <div className="empty-state">
              <h3>{t('mine.empty.title')}</h3>
              <p>{t('mine.empty.description')}</p>
              <button
                type="button"
                className="skills-console-primary"
                onClick={() => setDrawer({ kind: 'register' })}
              >
                {t('mine.empty.action')}
              </button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{t('mine.column.name')}</th>
                  <th>{t('mine.column.key')}</th>
                  <th>{t('mine.column.health')}</th>
                  <th>{t('mine.column.visibility')}</th>
                  <th>{t('mine.column.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((server) => (
                  <tr key={server.id}>
                    <td>{server.name}</td>
                    <td>{server.server_key} · {server.transport}</td>
                    <td>
                      <Badge tone={healthTone(server.health_status)}>
                        {formatMcpHealthLocalized(locale, server.health_status)}
                      </Badge>
                    </td>
                    <td>{formatMcpVisibilityLocalized(locale, server.visibility)}</td>
                    <td>
                      <div className="skills-console-actions">
                        <button
                          type="button"
                          onClick={() => setDrawer({ kind: 'edit', serverKey: server.server_key })}
                        >
                          {t('mine.edit')}
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(server)}>
                          {t('mine.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <SurfaceDrawer
        open={drawer?.kind === 'register'}
        title={t('register.title')}
        description={t('register.description')}
        onClose={closeDrawer}
      >
        <RegisterMcpServerForm
          onCancel={closeDrawer}
          onSuccess={async () => {
            closeDrawer();
            await reload();
          }}
        />
      </SurfaceDrawer>

      <SurfaceDrawer
        open={drawer?.kind === 'edit'}
        title={drawer?.kind === 'edit' ? t('edit.title', { serverKey: drawer.serverKey }) : t('edit.title', { serverKey: '' })}
        description={t('edit.description')}
        onClose={closeDrawer}
      >
        {drawer?.kind === 'edit' ? (
          <EditMcpServerForm
            serverKey={drawer.serverKey}
            onCancel={closeDrawer}
            onSuccess={async () => {
              closeDrawer();
              await reload();
            }}
          />
        ) : null}
      </SurfaceDrawer>

      <ConfirmModal
        open={deleteTarget != null}
        title={t('mine.delete.confirmTitle')}
        description={t('mine.delete.confirmDescription', {
          name: deleteTarget?.name ?? '',
        })}
        confirmLabel={t('mine.delete')}
        cancelLabel={t('dialog.cancel')}
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
    </section>
  );
}
