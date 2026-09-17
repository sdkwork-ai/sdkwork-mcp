import {
  Badge,
  ErrorAlert,
  LoadingState,
  PageHeader,
} from '@sdkwork/mcp-pc-commons';
import { listAdminInvocations, useAsyncResource, useMCPClients } from '@sdkwork/mcp-pc-core';

// Table chrome paired light/dark (`THEME_DARKMODE_SPEC.md` §4 pairing rule / §8 F5).
// The zinc ramp matches the host's `--sdk-color-surface-panel*` tokens
// (#18181b / #27272a) so the table sits flush against host chrome, while still
// rendering correctly in the standalone `sdkwork-mcp-pc` app (no theme provider,
// no `--sdk-color-*` tokens).
export function AdminInvocationsPage() {
  const clients = useMCPClients();
  const { data: invocations, error, loading } = useAsyncResource(
    () => listAdminInvocations(clients),
    [clients],
  );

  if (loading) {
    return <LoadingState label="Loading invocation audit log…" />;
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  return (
    <div className="embedded-fill-page">
      <PageHeader
        title="Invocation Audit"
        description="Append-only audit trail with trace correlation and idempotency keys."
      />
      <div className="data-surface">
        <div className="table-frame">
          {!invocations || invocations.length === 0 ? (
            <div className="empty-state">
              <h3>No invocations recorded</h3>
              <p>Runtime workers append audit rows via admin API.</p>
            </div>
          ) : (
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-zinc-800">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-zinc-800/60 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Kind</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Trace</th>
                <th className="px-4 py-3">Invoked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {invocations.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-zinc-100">{item.target_key}</p>
                    <p className="font-mono text-xs text-slate-500 dark:text-zinc-400">server {item.server_id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="brand">{item.invocation_kind}</Badge>
                  </td>
                  <td className="px-4 py-3">{item.status}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-zinc-400">
                    {item.trace_id ?? item.request_id ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-zinc-400">{item.invoked_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-zinc-400">
        Showing {invocations?.length ?? 0} recent rows. Sensitive payload fields remain governed by redaction policy.
      </p>
    </div>
  );
}
