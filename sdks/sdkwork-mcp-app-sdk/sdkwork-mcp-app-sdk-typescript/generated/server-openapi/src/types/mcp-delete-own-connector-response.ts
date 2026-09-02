import type { McpConnectorRecord } from './mcp-connector-record';

export interface McpDeleteOwnConnectorResponse {
  code: 0;
  data: unknown & { item: McpConnectorRecord; };
  /** Server-owned request correlation id. */
  traceId: string;
}
