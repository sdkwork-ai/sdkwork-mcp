import type { McpResourceRecord } from './mcp-resource-record';
import type { PageInfo } from './page-info';

export interface McpListResourcesResponse {
  code: 0;
  data: unknown & { items: McpResourceRecord[]; pageInfo: PageInfo; };
  /** Server-owned request correlation id. */
  traceId: string;
}
