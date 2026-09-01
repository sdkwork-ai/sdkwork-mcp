import type { McpInvocationRecord } from './mcp-invocation-record';

export interface McpAdminCreatePostResponse2016 {
  code: 0;
  data: unknown & { item: McpInvocationRecord; };
  /** Server-owned request correlation id. */
  traceId: string;
}
