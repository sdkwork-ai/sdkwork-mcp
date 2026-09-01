import type { McpPromptRecord } from './mcp-prompt-record';
import type { PageInfo } from './page-info';

export interface McpAdminCreatePostResponse2015 {
  code: 0;
  data: unknown & { items: McpPromptRecord[]; pageInfo: PageInfo; };
  /** Server-owned request correlation id. */
  traceId: string;
}
