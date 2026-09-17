import { Link } from 'react-router-dom';
import {
  Badge,
  DataPanel,
  EmptyState,
  ErrorAlert,
  formatMcpHealth,
  formatMcpTransport,
  healthTone,
  LoadingState,
  PageHeader,
} from '@sdkwork/mcp-pc-commons';
import { fetchConsoleOverview, useAsyncResource, useMCPClients } from '@sdkwork/mcp-pc-core';

export function ConsoleMCPPage() {
  const clients = useMCPClients();
  const { data, error, loading } = useAsyncResource(
    () => fetchConsoleOverview(clients),
    [clients],
  );

  if (loading) {
    return <LoadingState label="Loading tenant MCP console…" />;
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  if (!data) {
    return null;
  }

  const healthyCount = data.servers.filter((server) => server.health_status === 'healthy').length;

  return (
    <div>
      <PageHeader
        title="Tenant Console"
        description="Operational snapshot for MCP servers available to your workspace."
      />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <DataPanel>
          <div className="p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-zinc-400">Registered servers</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-zinc-100">{data.servers.length}</p>
          </div>
        </DataPanel>
        <DataPanel>
          <div className="p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-zinc-400">Healthy</p>
            <p className="mt-1 text-3xl font-semibold text-emerald-700 dark:text-emerald-400">{healthyCount}</p>
          </div>
        </DataPanel>
        <DataPanel>
          <div className="p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-zinc-400">Recent invocations</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-zinc-100">{data.invocations.length}</p>
          </div>
        </DataPanel>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">Servers</h3>
          {data.servers.length === 0 ? (
            <EmptyState title="No servers in tenant catalog" />
          ) : (
            <div className="grid gap-3">
              {data.servers.map((server) => (
                <DataPanel key={server.id}>
                  <div className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <Link
                        to={`/mcp-hub/${encodeURIComponent(server.server_key)}`}
                        className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {server.name}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">{formatMcpTransport(server.transport)}</p>
                    </div>
                    <Badge tone={healthTone(server.health_status)}>
                      {formatMcpHealth(server.health_status)}
                    </Badge>
                  </div>
                </DataPanel>
              ))}
            </div>
          )}
        </section>
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
            Recent invocations
          </h3>
          {data.invocations.length === 0 ? (
            <EmptyState title="No invocation activity" />
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-zinc-800">
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {data.invocations.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 dark:text-zinc-100">{item.target_key}</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">{item.invocation_kind}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-zinc-400">{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
