import type { McpConnectorRecord } from './mcp-connector-record';
import type { PageInfo } from './page-info';

export interface McpAdminListGetResponse2 {
  code: 0;
  data: unknown & { items: McpConnectorRecord[]; pageInfo: PageInfo; };
  /** Server-owned request correlation id. */
  traceId: string;
}
