import type { McpToolRecord } from './mcp-tool-record';

export interface McpAdminUpsertToolResponse {
  code: 0;
  data: unknown & { item: McpToolRecord; };
  /** Server-owned request correlation id. */
  traceId: string;
}
