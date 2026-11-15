import type {
  AppendMcpInvocationCommand,
  CreateMcpServerCommand,
  McpConnectorRecord,
  McpInvocationRecord,
  McpServerCategoryRecord,
  McpServerRecord,
  UpdateMcpServerCommand,
  UpsertMcpConnectorCommand,
  UpsertMcpPromptCommand,
  UpsertMcpResourceCommand,
  UpsertMcpServerCategoryCommand,
  UpsertMcpToolCommand,
} from '@sdkwork/mcp-backend-sdk';

import type { MCPClients } from '../clients';
import { unwrapSdkWorkPage } from '../sdk/sdkPage';

const catalogListParams = { pageSize: 200 } as const;

export async function listAdminCategories(clients: MCPClients) {
  const response = await clients.backend.mcp.mcpAdmin.listCategories(catalogListParams);
  return unwrapSdkWorkPage<McpServerCategoryRecord>(response).items;
}

export async function upsertAdminCategory(
  clients: MCPClients,
  command: UpsertMcpServerCategoryCommand,
) {
  return clients.backend.mcp.mcpAdmin.upsertCategory(command);
}

export async function listAdminServers(clients: MCPClients) {
  const response = await clients.backend.mcp.mcpAdmin.listServers(catalogListParams);
  return unwrapSdkWorkPage<McpServerRecord>(response).items;
}

export async function createAdminServer(clients: MCPClients, command: CreateMcpServerCommand) {
  return clients.backend.mcp.mcpAdmin.createServer(command);
}

export async function updateAdminServer(
  clients: MCPClients,
  serverKey: string,
  command: UpdateMcpServerCommand,
) {
  return clients.backend.mcp.mcpAdmin.updateServer(serverKey, command);
}

export async function deleteAdminServer(clients: MCPClients, serverKey: string) {
  return clients.backend.mcp.mcpAdmin.deleteServer(serverKey);
}

export async function listAdminConnectors(clients: MCPClients, serverId: string) {
  const response = await clients.backend.mcp.mcpAdmin.listConnectors(serverId, catalogListParams);
  return unwrapSdkWorkPage<McpConnectorRecord>(response).items;
}

export async function upsertAdminConnector(
  clients: MCPClients,
  serverId: string,
  command: UpsertMcpConnectorCommand,
) {
  return clients.backend.mcp.mcpAdmin.upsertConnector(serverId, command);
}

export async function deleteAdminConnector(
  clients: MCPClients,
  serverId: string,
  connectorKey: string,
) {
  return clients.backend.mcp.mcpAdmin.deleteConnector(serverId, connectorKey);
}

export async function upsertAdminTool(
  clients: MCPClients,
  serverId: string,
  command: UpsertMcpToolCommand,
) {
  return clients.backend.mcp.mcpAdmin.upsertTool(serverId, command);
}

export async function deleteAdminTool(
  clients: MCPClients,
  serverId: string,
  toolKey: string,
) {
  return clients.backend.mcp.mcpAdmin.deleteTool(serverId, toolKey);
}

export async function upsertAdminResource(
  clients: MCPClients,
  serverId: string,
  command: UpsertMcpResourceCommand,
) {
  return clients.backend.mcp.mcpAdmin.upsertResource(serverId, command);
}

export async function deleteAdminResource(
  clients: MCPClients,
  serverId: string,
  resourceKey: string,
) {
  return clients.backend.mcp.mcpAdmin.deleteResource(serverId, resourceKey);
}

export async function upsertAdminPrompt(
  clients: MCPClients,
  serverId: string,
  command: UpsertMcpPromptCommand,
) {
  return clients.backend.mcp.mcpAdmin.upsertPrompt(serverId, command);
}

export async function deleteAdminPrompt(
  clients: MCPClients,
  serverId: string,
  promptKey: string,
) {
  return clients.backend.mcp.mcpAdmin.deletePrompt(serverId, promptKey);
}

export async function deleteAdminCategory(clients: MCPClients, categoryCode: string) {
  return clients.backend.mcp.mcpAdmin.deleteCategory(categoryCode);
}

export async function listAdminInvocations(clients: MCPClients) {
  const response = await clients.backend.mcp.mcpAdmin.listInvocations({ pageSize: 100 });
  return unwrapSdkWorkPage<McpInvocationRecord>(response).items;
}

export async function appendAdminInvocation(
  clients: MCPClients,
  command: AppendMcpInvocationCommand,
) {
  return clients.backend.mcp.mcpAdmin.appendInvocation(command);
}
