import { backendApiPath } from './paths';
import type { ApiRequestOptions, HttpClient } from '../http/client';

import type { AppendMcpInvocationCommand, CreateMcpServerCommand, McpConnectorRecord, McpInvocationRecord, McpPromptRecord, McpResourceRecord, McpServerCategoryRecord, McpServerRecord, McpToolRecord, PageInfo, UpdateMcpServerCommand, UpsertMcpConnectorCommand, UpsertMcpPromptCommand, UpsertMcpResourceCommand, UpsertMcpServerCategoryCommand, UpsertMcpToolCommand } from '../types';


export interface McpMcpAdminListCategoriesParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  q?: string;
}

export interface McpMcpAdminListServersParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  q?: string;
}

export interface McpMcpAdminListConnectorsParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  q?: string;
}

export interface McpMcpAdminListInvocationsParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  q?: string;
  serverId?: string;
}

export class McpMcpAdminApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** MCP mcpAdmin.listCategories */
  async listCategories(params?: McpMcpAdminListCategoriesParams, requestOptions?: ApiRequestOptions): Promise<{ items: McpServerCategoryRecord[]; pageInfo: PageInfo; }> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<{ items: McpServerCategoryRecord[]; pageInfo: PageInfo; }>(appendQueryString(backendApiPath(`/mcp/categories`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** MCP mcpAdmin.upsertCategory */
  async upsertCategory(body: UpsertMcpServerCategoryCommand, requestOptions?: ApiRequestOptions): Promise<McpServerCategoryRecord> {
    return this.client.request<McpServerCategoryRecord>(backendApiPath(`/mcp/categories`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }

/** MCP mcpAdmin.listServers */
  async listServers(params?: McpMcpAdminListServersParams, requestOptions?: ApiRequestOptions): Promise<{ items: McpServerRecord[]; pageInfo: PageInfo; }> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<{ items: McpServerRecord[]; pageInfo: PageInfo; }>(appendQueryString(backendApiPath(`/mcp/servers`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** MCP mcpAdmin.createServer */
  async createServer(body: CreateMcpServerCommand, requestOptions?: ApiRequestOptions): Promise<McpServerRecord> {
    return this.client.request<McpServerRecord>(backendApiPath(`/mcp/servers`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }

/** MCP mcpAdmin.updateServer */
  async updateServer(serverKey: string, body: UpdateMcpServerCommand, requestOptions?: ApiRequestOptions): Promise<McpServerRecord> {
    return this.client.request<McpServerRecord>(backendApiPath(`/mcp/servers/${serializePathParameter(serverKey, { name: 'serverKey', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'PUT' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }

/** MCP mcpAdmin.deleteServer */
  async deleteServer(serverKey: string, requestOptions?: ApiRequestOptions): Promise<McpServerRecord> {
    return this.client.request<McpServerRecord>(backendApiPath(`/mcp/servers/${serializePathParameter(serverKey, { name: 'serverKey', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'DELETE' as any, sdkworkUnwrapKind: 'item' });
  }

/** MCP mcpAdmin.listConnectors */
  async listConnectors(serverId: string, params?: McpMcpAdminListConnectorsParams, requestOptions?: ApiRequestOptions): Promise<{ items: McpConnectorRecord[]; pageInfo: PageInfo; }> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<{ items: McpConnectorRecord[]; pageInfo: PageInfo; }>(appendQueryString(backendApiPath(`/mcp/servers/${serializePathParameter(serverId, { name: 'serverId', style: 'simple', explode: false })}/connectors`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** MCP mcpAdmin.upsertConnector */
  async upsertConnector(serverId: string, body: UpsertMcpConnectorCommand, requestOptions?: ApiRequestOptions): Promise<{ items: McpConnectorRecord[]; pageInfo: PageInfo; }> {
    return this.client.request<{ items: McpConnectorRecord[]; pageInfo: PageInfo; }>(backendApiPath(`/mcp/servers/${serializePathParameter(serverId, { name: 'serverId', style: 'simple', explode: false })}/connectors`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'page' });
  }

/** MCP mcpAdmin.deleteConnector */
  async deleteConnector(serverId: string, connectorKey: string, requestOptions?: ApiRequestOptions): Promise<{ items: McpConnectorRecord[]; pageInfo: PageInfo; }> {
    return this.client.request<{ items: McpConnectorRecord[]; pageInfo: PageInfo; }>(backendApiPath(`/mcp/servers/${serializePathParameter(serverId, { name: 'serverId', style: 'simple', explode: false })}/connectors/${serializePathParameter(connectorKey, { name: 'connectorKey', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'DELETE' as any, sdkworkUnwrapKind: 'page' });
  }

/** MCP mcpAdmin.upsertTool */
  async upsertTool(serverId: string, body: UpsertMcpToolCommand, requestOptions?: ApiRequestOptions): Promise<{ items: McpToolRecord[]; pageInfo: PageInfo; }> {
    return this.client.request<{ items: McpToolRecord[]; pageInfo: PageInfo; }>(backendApiPath(`/mcp/servers/${serializePathParameter(serverId, { name: 'serverId', style: 'simple', explode: false })}/tools`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'page' });
  }

/** MCP mcpAdmin.upsertResource */
  async upsertResource(serverId: string, body: UpsertMcpResourceCommand, requestOptions?: ApiRequestOptions): Promise<{ items: McpResourceRecord[]; pageInfo: PageInfo; }> {
    return this.client.request<{ items: McpResourceRecord[]; pageInfo: PageInfo; }>(backendApiPath(`/mcp/servers/${serializePathParameter(serverId, { name: 'serverId', style: 'simple', explode: false })}/resources`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'page' });
  }

/** MCP mcpAdmin.upsertPrompt */
  async upsertPrompt(serverId: string, body: UpsertMcpPromptCommand, requestOptions?: ApiRequestOptions): Promise<{ items: McpPromptRecord[]; pageInfo: PageInfo; }> {
    return this.client.request<{ items: McpPromptRecord[]; pageInfo: PageInfo; }>(backendApiPath(`/mcp/servers/${serializePathParameter(serverId, { name: 'serverId', style: 'simple', explode: false })}/prompts`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'page' });
  }

/** MCP mcpAdmin.listInvocations */
  async listInvocations(params?: McpMcpAdminListInvocationsParams, requestOptions?: ApiRequestOptions): Promise<{ items: McpInvocationRecord[]; pageInfo: PageInfo; }> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
      { name: 'server_id', value: params?.serverId, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<{ items: McpInvocationRecord[]; pageInfo: PageInfo; }>(appendQueryString(backendApiPath(`/mcp/invocations`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** MCP mcpAdmin.appendInvocation */
  async appendInvocation(body: AppendMcpInvocationCommand, requestOptions?: ApiRequestOptions): Promise<McpInvocationRecord> {
    return this.client.request<McpInvocationRecord>(backendApiPath(`/mcp/invocations`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }
}

export class McpApi {
  public readonly mcpAdmin: McpMcpAdminApi;

  constructor(client: HttpClient) {
    this.mcpAdmin = new McpMcpAdminApi(client);
  }

}

export function createMcpApi(client: HttpClient): McpApi {
  return new McpApi(client);
}

function appendQueryString(path: string, rawQueryString: string): string {
  const query = rawQueryString.replace(/^\?+/, '');
  if (!query) {
    return path;
  }
  return path.includes('?') ? `${path}&${query}` : `${path}?${query}`;
}

interface PathParameterSpec {
  name: string;
  style: string;
  explode: boolean;
}

function serializePathParameter(value: unknown, spec: PathParameterSpec): string {
  if (value === undefined || value === null) {
    return '';
  }

  const style = spec.style || 'simple';
  if (Array.isArray(value)) {
    return serializePathArray(spec.name, value, style, spec.explode);
  }
  if (typeof value === 'object') {
    return serializePathObject(spec.name, value as Record<string, unknown>, style, spec.explode);
  }
  return pathPrefix(spec.name, style, false) + encodePathValue(serializePathPrimitive(value));
}

function serializePathArray(name: string, values: unknown[], style: string, explode: boolean): string {
  const serialized = values
    .filter((item) => item !== undefined && item !== null)
    .map((item) => encodePathValue(serializePathPrimitive(item)));
  if (serialized.length === 0) {
    return pathPrefix(name, style, false);
  }
  if (style === 'matrix') {
    return explode
      ? serialized.map((item) => `;${name}=${item}`).join('')
      : `;${name}=${serialized.join(',')}`;
  }
  return pathPrefix(name, style, false) + serialized.join(explode ? '.' : ',');
}

function serializePathObject(name: string, value: Record<string, unknown>, style: string, explode: boolean): string {
  const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
  if (entries.length === 0) {
    return pathPrefix(name, style, true);
  }
  if (style === 'matrix') {
    return explode
      ? entries.map(([key, entryValue]) => `;${encodePathValue(key)}=${encodePathValue(serializePathPrimitive(entryValue))}`).join('')
      : `;${name}=${entries.flatMap(([key, entryValue]) => [encodePathValue(key), encodePathValue(serializePathPrimitive(entryValue))]).join(',')}`;
  }
  const serialized = explode
    ? entries.map(([key, entryValue]) => `${encodePathValue(key)}=${encodePathValue(serializePathPrimitive(entryValue))}`).join(style === 'label' ? '.' : ',')
    : entries.flatMap(([key, entryValue]) => [encodePathValue(key), encodePathValue(serializePathPrimitive(entryValue))]).join(',');
  return pathPrefix(name, style, true) + serialized;
}

function pathPrefix(name: string, style: string, _objectValue: boolean): string {
  if (style === 'label') return '.';
  if (style === 'matrix') return `;${name}`;
  return '';
}

function encodePathValue(value: string): string {
  return encodeURIComponent(value);
}

function serializePathPrimitive(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}
interface QueryParameterSpec {
  name: string;
  value: unknown;
  style: string;
  explode: boolean;
  allowReserved: boolean;
  contentType?: string;
}

function buildQueryString(parameters: QueryParameterSpec[]): string {
  const pairs: string[] = [];
  for (const parameter of parameters) {
    appendSerializedParameter(pairs, parameter);
  }
  return pairs.join('&');
}

function appendSerializedParameter(pairs: string[], parameter: QueryParameterSpec): void {
  if (parameter.value === undefined || parameter.value === null) {
    return;
  }

  if (parameter.contentType) {
    pairs.push(`${encodeQueryComponent(parameter.name)}=${encodeQueryValue(JSON.stringify(parameter.value), parameter.allowReserved)}`);
    return;
  }

  const style = parameter.style || 'form';
  if (style === 'deepObject') {
    appendDeepObjectParameter(pairs, parameter.name, parameter.value, parameter.allowReserved);
    return;
  }

  if (Array.isArray(parameter.value)) {
    appendArrayParameter(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
    return;
  }

  if (typeof parameter.value === 'object') {
    appendObjectParameter(pairs, parameter.name, parameter.value as Record<string, unknown>, style, parameter.explode, parameter.allowReserved);
    return;
  }

  pairs.push(`${encodeQueryComponent(parameter.name)}=${encodeQueryValue(serializePrimitive(parameter.value), parameter.allowReserved)}`);
}

function appendArrayParameter(
  pairs: string[],
  name: string,
  value: unknown[],
  style: string,
  explode: boolean,
  allowReserved: boolean,
): void {
  const values = value
    .filter((item) => item !== undefined && item !== null)
    .map((item) => serializePrimitive(item));
  if (values.length === 0) {
    return;
  }

  if (style === 'form' && explode) {
    for (const item of values) {
      pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(item, allowReserved)}`);
    }
    return;
  }

  pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(values.join(','), allowReserved)}`);
}

function appendObjectParameter(
  pairs: string[],
  name: string,
  value: Record<string, unknown>,
  style: string,
  explode: boolean,
  allowReserved: boolean,
): void {
  const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
  if (entries.length === 0) {
    return;
  }

  if (style === 'form' && explode) {
    for (const [key, entryValue] of entries) {
      pairs.push(`${encodeQueryComponent(key)}=${encodeQueryValue(serializePrimitive(entryValue), allowReserved)}`);
    }
    return;
  }

  const serialized = entries.flatMap(([key, entryValue]) => [key, serializePrimitive(entryValue)]).join(',');
  pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(serialized, allowReserved)}`);
}

function appendDeepObjectParameter(
  pairs: string[],
  name: string,
  value: unknown,
  allowReserved: boolean,
): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(serializePrimitive(value), allowReserved)}`);
    return;
  }

  for (const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
    if (entryValue === undefined || entryValue === null) {
      continue;
    }
    pairs.push(`${encodeQueryComponent(`${name}[${key}]`)}=${encodeQueryValue(serializePrimitive(entryValue), allowReserved)}`);
  }
}

function serializePrimitive(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function encodeQueryComponent(value: string): string {
  return encodeURIComponent(value);
}

function encodeQueryValue(value: string, allowReserved: boolean): string {
  const encoded = encodeURIComponent(value);
  if (!allowReserved) {
    return encoded;
  }
  return encoded.replace(/%3A/gi, ':')
    .replace(/%2F/gi, '/')
    .replace(/%3F/gi, '?')
    .replace(/%23/gi, '#')
    .replace(/%5B/gi, '[')
    .replace(/%5D/gi, ']')
    .replace(/%40/gi, '@')
    .replace(/%21/gi, '!')
    .replace(/%24/gi, '$')
    .replace(/%26/gi, '&')
    .replace(/%27/gi, "'")
    .replace(/%28/gi, '(')
    .replace(/%29/gi, ')')
    .replace(/%2A/gi, '*')
    .replace(/%2B/gi, '+')
    .replace(/%2C/gi, ',')
    .replace(/%3B/gi, ';')
    .replace(/%3D/gi, '=');
}
