import { useEffect, useState } from 'react';
import {
  listPublishedMcpCategories,
  useMCPClients,
  type McpServerCategoryRecord,
} from '@sdkwork/mcp-pc-core';

/**
 * Loads the admin-published MCP category catalog for the console.
 *
 * Read path only: writes stay on the admin surface (`upsertAdminCategory`), so
 * the console never gains category authority it should not have. The wire call
 * itself lives in `@sdkwork/mcp-pc-core` (`listPublishedMcpCategories`) — this
 * hook only owns the React lifecycle, keeping the console free of SDK plumbing.
 */
export interface McpCategoriesState {
  categories: McpServerCategoryRecord[];
  loading: boolean;
  error: string | null;
}

export function useMcpCategories(): McpCategoriesState {
  const clients = useMCPClients();
  const [categories, setCategories] = useState<McpServerCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void listPublishedMcpCategories(clients)
      .then((items) => {
        if (active) setCategories(items ?? []);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : String(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [clients]);

  return { categories, loading, error };
}
