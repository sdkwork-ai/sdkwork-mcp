import type { McpResourceRecord } from './mcp-resource-record';

export interface McpGetResourceResponse {
  code: 0;
  data: unknown & { item: McpResourceRecord; };
  /** Server-owned request correlation id. */
  traceId: string;
}
