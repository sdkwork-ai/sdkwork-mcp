import type {
  McpInvocationRecord,
  McpPromptRecord,
  McpResourceRecord,
  McpServerCategoryRecord,
  McpServerRecord,
  McpToolRecord,
} from '@sdkwork/mcp-app-sdk';

import type { MCPClients } from '../clients';
import { unwrapSdkWorkPage } from '../sdk/sdkPage';

const catalogListParams = { pageSize: 200 } as const;

export async function fetchMarketplaceCatalog(clients: MCPClients) {
  const [categoryResponse, serverResponse] = await Promise.all([
    clients.app.mcp.categories.list(catalogListParams),
    clients.app.mcp.servers.list(catalogListParams),
  ]);
  return {
    categories: unwrapSdkWorkPage<McpServerCategoryRecord>(categoryResponse).items,
    servers: unwrapSdkWorkPage<McpServerRecord>(serverResponse).items,
  };
}

export async function fetchServerDetail(clients: MCPClients, serverKey: string) {
  const server = await clients.app.mcp.servers.retrieve(serverKey);
  const serverId = String(server.id);
  const [tools, resources, prompts] = await Promise.all([
    clients.app.mcp.servers.tools.list(serverId, catalogListParams),
    clients.app.mcp.servers.resources.list(serverId, catalogListParams),
    clients.app.mcp.servers.prompts.list(serverId, catalogListParams),
  ]);
  return {
    server,
    tools: unwrapSdkWorkPage<McpToolRecord>(tools).items,
    resources: unwrapSdkWorkPage<McpResourceRecord>(resources).items,
    prompts: unwrapSdkWorkPage<McpPromptRecord>(prompts).items,
  };
}

export async function fetchConsoleOverview(clients: MCPClients) {
  const [servers, invocations] = await Promise.all([
    clients.app.mcp.servers.list(catalogListParams),
    clients.app.mcp.invocations.list({ pageSize: 20 }),
  ]);
  return {
    servers: unwrapSdkWorkPage<McpServerRecord>(servers).items,
    invocations: unwrapSdkWorkPage<McpInvocationRecord>(invocations).items,
  };
}
