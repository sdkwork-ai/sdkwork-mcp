import type { McpServerRecord } from './mcp-server-record';

export interface McpAdminCreateServerResponse {
  code: 0;
  data: unknown & { item: McpServerRecord; };
  /** Server-owned request correlation id. */
  traceId: string;
}
