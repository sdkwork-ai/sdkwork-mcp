import type { McpPromptRecord } from './mcp-prompt-record';

export interface McpGetPromptResponse {
  code: 0;
  data: unknown & { item: McpPromptRecord; };
  /** Server-owned request correlation id. */
  traceId: string;
}
