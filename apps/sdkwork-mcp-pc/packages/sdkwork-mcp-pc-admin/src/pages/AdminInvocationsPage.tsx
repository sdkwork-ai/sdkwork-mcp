import {
  Badge,
  ErrorAlert,
  LoadingState,
  PageHeader,
} from '@sdkwork/mcp-pc-commons';
import { listAdminInvocations, useAsyncResource, useMCPClients } from '@sdkwork/mcp-pc-core';

import { useMcpAdminCopy } from '../copy/mcpAdminCopy';

// Table chrome paired light/dark (`THEME_DARKMODE_SPEC.md` §4 pairing rule / §8 F5).
// The zinc ramp matches the host's `--sdk-color-surface-panel*` tokens
// (#18181b / #27272a) so the table sits flush against host chrome, while still
// rendering correctly in the standalone `sdkwork-mcp-pc` app (no theme provider,
// no `--sdk-color-*` tokens).
export function AdminInvocationsPage() {
  const clients = useMCPClients();
  const copy = useMcpAdminCopy();
  const { data: invocations, error, loading } = useAsyncResource(
    () => listAdminInvocations(clients),
    [clients],
  );

  if (loading) {
    return <LoadingState label={copy.invocations.loading} />;
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  return (
    <div className="embedded-fill-page">
      <PageHeader dense
        title={copy.invocations.title}
        description={copy.invocations.description}
      />
      <div className="data-surface">
        <div className="table-frame">
          {!invocations || invocations.length === 0 ? (
            <div className="empty-state">
              <h3>{copy.invocations.empty.title}</h3>
              <p>{copy.invocations.empty.description}</p>
            </div>
          ) : (
            <table className="admin-list-table min-w-full">
              <thead>
                <tr>
                  <th>{copy.invocations.table.target}</th>
                  <th>{copy.invocations.table.kind}</th>
                  <th>{copy.invocations.table.status}</th>
                  <th>{copy.invocations.table.trace}</th>
                  <th>{copy.invocations.table.invoked}</th>
                </tr>
              </thead>
              <tbody>
                {invocations.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <p className="font-medium text-slate-900 dark:text-zinc-100">{item.target_key}</p>
                      <p className="font-mono text-xs text-slate-500 dark:text-zinc-400">
                        {copy.invocations.server(item.server_id)}
                      </p>
                    </td>
                    <td>
                      <Badge tone="brand">{item.invocation_kind}</Badge>
                    </td>
                    <td>{item.status}</td>
                    <td className="font-mono text-xs text-slate-600 dark:text-zinc-400">
                      {item.trace_id ?? item.request_id ?? '—'}
                    </td>
                    <td className="text-slate-600 dark:text-zinc-400">{item.invoked_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="admin-list-footer">
          <span>{copy.invocations.footer(invocations?.length ?? 0)}</span>
        </div>
      </div>
    </div>
  );
}
