import type { McpInvocationRecord } from './mcp-invocation-record';
import type { PageInfo } from './page-info';

export interface ListGetResponse6 {
  code: 0;
  data: unknown & { items: McpInvocationRecord[]; pageInfo: PageInfo; };
  /** Server-owned request correlation id. */
  traceId: string;
}
