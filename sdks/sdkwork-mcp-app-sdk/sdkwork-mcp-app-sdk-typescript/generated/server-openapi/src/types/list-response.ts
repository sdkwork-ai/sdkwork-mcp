import type { McpServerCategoryRecord } from './mcp-server-category-record';
import type { PageInfo } from './page-info';

export interface ListResponse {
  code: 0;
  data: unknown & { items: McpServerCategoryRecord[]; pageInfo: PageInfo; };
  /** Server-owned request correlation id. */
  traceId: string;
}
