import type { McpToolRecord } from './mcp-tool-record';

export interface McpGetToolResponse {
  code: 0;
  data: unknown & { item: McpToolRecord; };
  /** Server-owned request correlation id. */
  traceId: string;
}
