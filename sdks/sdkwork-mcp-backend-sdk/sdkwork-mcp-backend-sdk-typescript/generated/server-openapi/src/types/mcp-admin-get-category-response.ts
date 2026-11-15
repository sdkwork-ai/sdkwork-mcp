import type { McpServerCategoryRecord } from './mcp-server-category-record';

export interface McpAdminGetCategoryResponse {
  code: 0;
  data: unknown & { item: McpServerCategoryRecord; };
  /** Server-owned request correlation id. */
  traceId: string;
}
