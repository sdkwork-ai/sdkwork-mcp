import type { McpResourceRecord } from './mcp-resource-record';

export interface McpAdminUpsertResourceResponse {
  code: 0;
  data: unknown & { item: McpResourceRecord; };
  /** Server-owned request correlation id. */
  traceId: string;
}
