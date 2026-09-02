import type { McpToolRecord } from './mcp-tool-record';
import type { PageInfo } from './page-info';

export interface McpListToolsResponse {
  code: 0;
  data: unknown & { items: McpToolRecord[]; pageInfo: PageInfo; };
  /** Server-owned request correlation id. */
  traceId: string;
}
