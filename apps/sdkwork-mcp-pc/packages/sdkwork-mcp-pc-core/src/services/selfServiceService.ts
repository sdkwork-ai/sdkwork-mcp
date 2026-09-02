import type {
  CreateOwnMcpServerCommand,
  McpConnectorRecord,
  McpServerRecord,
  UpdateOwnMcpServerCommand,
  UpsertOwnMcpConnectorCommand,
} from '@sdkwork/mcp-app-sdk';

import type { MCPClients } from '../clients';
import { unwrapSdkWorkPage } from '../sdk/sdkPage';

const catalogListParams = { pageSize: 200 } as const;

export async function listOwnedMcpServers(clients: MCPClients) {
  const response = await clients.app.mcp.servers.owned.list(catalogListParams);
  return unwrapSdkWorkPage<McpServerRecord>(response).items;
}

export async function createOwnMcpServer(
  clients: MCPClients,
  command: CreateOwnMcpServerCommand,
): Promise<McpServerRecord> {
  return clients.app.mcp.servers.create(command);
}

export async function updateOwnMcpServer(
  clients: MCPClients,
  serverKey: string,
  command: UpdateOwnMcpServerCommand,
): Promise<McpServerRecord> {
  return clients.app.mcp.servers.update(serverKey, command);
}

export async function deleteOwnMcpServer(
  clients: MCPClients,
  serverKey: string,
): Promise<void> {
  await clients.app.mcp.servers.delete(serverKey);
}

export async function upsertOwnMcpConnector(
  clients: MCPClients,
  serverId: string,
  command: UpsertOwnMcpConnectorCommand,
): Promise<McpConnectorRecord> {
  return clients.app.mcp.servers.connectors.create(serverId, command);
}

export async function deleteOwnMcpConnector(
  clients: MCPClients,
  serverId: string,
  connectorKey: string,
): Promise<void> {
  await clients.app.mcp.servers.connectors.delete(serverId, connectorKey);
}
