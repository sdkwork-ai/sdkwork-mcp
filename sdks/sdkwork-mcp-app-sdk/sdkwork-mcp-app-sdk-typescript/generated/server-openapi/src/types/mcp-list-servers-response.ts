import type { McpServerRecord } from './mcp-server-record';
import type { PageInfo } from './page-info';

export interface McpListServersResponse {
  code: 0;
  data: unknown & { items: McpServerRecord[]; pageInfo: PageInfo; };
  /** Server-owned request correlation id. */
  traceId: string;
}
