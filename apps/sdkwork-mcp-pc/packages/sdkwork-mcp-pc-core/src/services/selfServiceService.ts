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
  const response = await clients.app.mcp.listOwnedServers(catalogListParams);
  return unwrapSdkWorkPage<McpServerRecord>(response).items;
}

export async function createOwnMcpServer(
  clients: MCPClients,
  command: CreateOwnMcpServerCommand,
): Promise<McpServerRecord> {
  return clients.app.mcp.createOwnServer(command);
}

export async function updateOwnMcpServer(
  clients: MCPClients,
  serverKey: string,
  command: UpdateOwnMcpServerCommand,
): Promise<McpServerRecord> {
  return clients.app.mcp.updateOwnServer(serverKey, command);
}

export async function deleteOwnMcpServer(
  clients: MCPClients,
  serverKey: string,
): Promise<void> {
  await clients.app.mcp.deleteOwnServer(serverKey);
}

export async function upsertOwnMcpConnector(
  clients: MCPClients,
  serverId: string,
  command: UpsertOwnMcpConnectorCommand,
): Promise<McpConnectorRecord> {
  return clients.app.mcp.upsertOwnConnector(serverId, command);
}

export async function deleteOwnMcpConnector(
  clients: MCPClients,
  serverId: string,
  connectorKey: string,
): Promise<void> {
  await clients.app.mcp.deleteOwnConnector(serverId, connectorKey);
}
