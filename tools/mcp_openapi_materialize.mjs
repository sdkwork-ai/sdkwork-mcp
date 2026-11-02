#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  sdkWorkEnvelopeComponentSchemas,
  typedSdkWorkResourceResponse,
} from "../../sdkwork-specs/tools/lib/openapi-envelope-schemas.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, "..");
const OWNER = "sdkwork-mcp";
const DOMAIN = "intelligence";
const TAG = "mcp";

const domainSchemas = {
  McpServerCategoryRecord: {
    type: "object",
    additionalProperties: true,
    required: ["id", "uuid", "category_code", "name", "lifecycle_status"],
    properties: {
      id: { type: "integer", format: "int64" },
      uuid: { type: "string" },
      category_code: { type: "string" },
      name: { type: "string" },
      description: { type: "string", nullable: true },
      parent_id: { type: "integer", format: "int64" },
      sort_order: { type: "integer" },
      icon_ref: { type: "string", nullable: true },
      lifecycle_status: { type: "string" },
    },
  },
  McpServerRecord: {
    type: "object",
    additionalProperties: true,
    required: [
      "id",
      "uuid",
      "server_key",
      "name",
      "transport",
      "visibility",
      "data_scope",
      "health_status",
      "lifecycle_status",
      "allowed_role_codes",
    ],
    properties: {
      id: { type: "integer", format: "int64" },
      uuid: { type: "string" },
      server_key: { type: "string" },
      name: { type: "string" },
      description: { type: "string", nullable: true },
      category_id: { type: "integer", format: "int64", nullable: true },
      category_code: { type: "string", nullable: true },
      transport: { type: "string" },
      visibility: { type: "string" },
      data_scope: { type: "string" },
      health_status: { type: "string" },
      lifecycle_status: { type: "string" },
      tags: { type: "array", items: { type: "string" } },
      allowed_role_codes: {
        type: "array",
        items: { type: "string", pattern: "^[a-z][a-z0-9_.-]{0,127}$" },
        default: [],
        description:
          "IAM role codes allowed to see and use this server. An empty list means every role (the default).",
      },
      icon_ref: {
        type: "string",
        nullable: true,
        description: "Canonical sdkwork-drive node reference.",
        pattern: "^drive://spaces/[^/]+/nodes/[^/]+$",
      },
    },
  },
  McpConnectorRecord: {
    type: "object",
    additionalProperties: true,
    required: [
      "id",
      "uuid",
      "server_id",
      "connector_key",
      "transport",
      "publish_status",
      "lifecycle_status",
    ],
    properties: {
      id: { type: "integer", format: "int64" },
      uuid: { type: "string" },
      server_id: { type: "integer", format: "int64" },
      connector_key: { type: "string" },
      transport: { type: "string" },
      publish_status: { type: "string" },
      lifecycle_status: { type: "string" },
      endpoint_url: { type: "string", nullable: true },
    },
  },
  McpToolRecord: {
    type: "object",
    additionalProperties: true,
    required: [
      "id",
      "uuid",
      "server_id",
      "connector_id",
      "tool_key",
      "name",
      "enabled",
      "lifecycle_status",
    ],
    properties: {
      id: { type: "integer", format: "int64" },
      uuid: { type: "string" },
      server_id: { type: "integer", format: "int64" },
      connector_id: { type: "integer", format: "int64" },
      tool_key: { type: "string" },
      name: { type: "string" },
      description: { type: "string", nullable: true },
      enabled: { type: "boolean" },
      lifecycle_status: { type: "string" },
      risk_level: { type: "string" },
      requires_approval: { type: "boolean" },
    },
  },
  McpResourceRecord: {
    type: "object",
    additionalProperties: true,
    required: [
      "id",
      "uuid",
      "server_id",
      "connector_id",
      "resource_key",
      "uri",
      "name",
      "enabled",
      "lifecycle_status",
    ],
    properties: {
      id: { type: "integer", format: "int64" },
      uuid: { type: "string" },
      server_id: { type: "integer", format: "int64" },
      connector_id: { type: "integer", format: "int64" },
      resource_key: { type: "string" },
      uri: { type: "string" },
      name: { type: "string" },
      enabled: { type: "boolean" },
      lifecycle_status: { type: "string" },
    },
  },
  McpPromptRecord: {
    type: "object",
    additionalProperties: true,
    required: [
      "id",
      "uuid",
      "server_id",
      "connector_id",
      "prompt_key",
      "name",
      "enabled",
      "lifecycle_status",
    ],
    properties: {
      id: { type: "integer", format: "int64" },
      uuid: { type: "string" },
      server_id: { type: "integer", format: "int64" },
      connector_id: { type: "integer", format: "int64" },
      prompt_key: { type: "string" },
      name: { type: "string" },
      enabled: { type: "boolean" },
      lifecycle_status: { type: "string" },
    },
  },
  McpInvocationRecord: {
    type: "object",
    additionalProperties: true,
    required: ["id", "uuid", "server_id", "invocation_kind", "target_key", "status", "invoked_at"],
    properties: {
      id: { type: "integer", format: "int64" },
      uuid: { type: "string" },
      server_id: { type: "integer", format: "int64" },
      invocation_kind: { type: "string" },
      target_key: { type: "string" },
      request_id: { type: "string", nullable: true },
      trace_id: { type: "string", nullable: true },
      idempotency_key: { type: "string", nullable: true },
      status: { type: "string" },
      invoked_at: { type: "string", format: "date-time" },
    },
  },
  AppendMcpInvocationCommand: {
    type: "object",
    additionalProperties: true,
    required: ["server_id", "invocation_kind", "target_key"],
    properties: {
      server_id: { type: "integer", format: "int64" },
      connector_id: { type: "integer", format: "int64", nullable: true },
      invocation_kind: { type: "string", enum: ["tool", "resource", "prompt"] },
      target_key: { type: "string" },
      request_id: { type: "string" },
      trace_id: { type: "string" },
      idempotency_key: { type: "string", maxLength: 200 },
      request_json: { type: "string" },
      response_json: { type: "string" },
      status: { type: "string", maxLength: 32 },
      error_message: { type: "string" },
      duration_ms: { type: "integer" },
    },
  },
  CreateMcpServerCommand: {
    type: "object",
    additionalProperties: true,
    required: ["server_key", "name", "transport"],
    properties: {
      server_key: { type: "string" },
      name: { type: "string" },
      description: { type: "string" },
      transport: { type: "string" },
      visibility: { type: "string" },
      category_id: { type: "integer", format: "int64" },
      category_code: { type: "string" },
      tags: { type: "array", items: { type: "string" } },
      allowed_role_codes: {
        type: "array",
        items: { type: "string", pattern: "^[a-z][a-z0-9_.-]{0,127}$" },
        default: [],
        description:
          "IAM role codes allowed to see and use this server. An empty list means every role (the default).",
      },
      icon_ref: { type: "string", pattern: "^drive://spaces/[^/]+/nodes/[^/]+$" },
    },
  },
  UpdateMcpServerCommand: {
    type: "object",
    additionalProperties: true,
    properties: {
      name: { type: "string" },
      description: { type: "string" },
      transport: { type: "string" },
      visibility: { type: "string" },
      category_id: { type: "integer", format: "int64" },
      category_code: { type: "string" },
      tags: { type: "array", items: { type: "string" } },
      allowed_role_codes: {
        type: "array",
        items: { type: "string", pattern: "^[a-z][a-z0-9_.-]{0,127}$" },
        description:
          "Full replacement role-code list. Omitted leaves the assignment unchanged; an empty list means every role.",
      },
      icon_ref: { type: "string", pattern: "^drive://spaces/[^/]+/nodes/[^/]+$" },
      lifecycle_status: { type: "string" },
    },
  },
  UpsertMcpServerCategoryCommand: {
    type: "object",
    additionalProperties: true,
    required: ["category_code", "name"],
    properties: {
      category_code: { type: "string" },
      name: { type: "string" },
      description: { type: "string" },
      parent_id: { type: "integer", format: "int64" },
      sort_order: { type: "integer" },
      icon_ref: { type: "string", pattern: "^drive://spaces/[^/]+/nodes/[^/]+$" },
    },
  },
  UpsertMcpConnectorCommand: {
    type: "object",
    additionalProperties: true,
    required: ["connector_key", "transport"],
    properties: {
      connector_key: { type: "string" },
      transport: { type: "string" },
      endpoint_url: { type: "string" },
      command_ref: { type: "string" },
      args_json: { type: "string" },
      env_schema_json: { type: "string" },
      auth_type: { type: "string" },
      secret_ref: { type: "string" },
      timeout_ms: { type: "integer" },
      retry_policy_json: { type: "string" },
      publish_status: { type: "string" },
      lifecycle_status: { type: "string" },
    },
  },
  CreateOwnMcpServerCommand: {
    type: "object",
    additionalProperties: true,
    required: ["server_key", "name", "transport"],
    properties: {
      server_key: { type: "string" },
      name: { type: "string" },
      description: { type: "string" },
      transport: { type: "string" },
      category_id: { type: "integer", format: "int64" },
      category_code: { type: "string" },
      tags: { type: "array", items: { type: "string" } },
      icon_ref: { type: "string", pattern: "^drive://spaces/[^/]+/nodes/[^/]+$" },
    },
  },
  UpdateOwnMcpServerCommand: {
    type: "object",
    additionalProperties: true,
    properties: {
      name: { type: "string" },
      description: { type: "string" },
      transport: { type: "string" },
      category_id: { type: "integer", format: "int64" },
      category_code: { type: "string" },
      tags: { type: "array", items: { type: "string" } },
      icon_ref: { type: "string", pattern: "^drive://spaces/[^/]+/nodes/[^/]+$" },
    },
  },
  UpsertOwnMcpConnectorCommand: {
    type: "object",
    additionalProperties: true,
    required: ["connector_key", "transport"],
    properties: {
      connector_key: { type: "string" },
      transport: { type: "string" },
      endpoint_url: { type: "string" },
      command_ref: { type: "string" },
      args_json: { type: "string" },
      env_schema_json: { type: "string" },
      auth_type: { type: "string" },
      secret_ref: { type: "string" },
      timeout_ms: { type: "integer" },
      retry_policy_json: { type: "string" },
    },
  },
  UpsertMcpToolCommand: {
    type: "object",
    additionalProperties: true,
    required: ["connector_id", "tool_key", "name"],
    properties: {
      connector_id: { type: "integer", format: "int64" },
      tool_key: { type: "string" },
      name: { type: "string" },
      description: { type: "string" },
      input_schema_json: { type: "string" },
      output_schema_json: { type: "string" },
      risk_level: { type: "string" },
      requires_approval: { type: "boolean" },
      enabled: { type: "boolean" },
      sort_weight: { type: "integer" },
    },
  },
  UpsertMcpResourceCommand: {
    type: "object",
    additionalProperties: true,
    required: ["connector_id", "resource_key", "uri", "name"],
    properties: {
      connector_id: { type: "integer", format: "int64" },
      resource_key: { type: "string" },
      uri: { type: "string" },
      name: { type: "string" },
      description: { type: "string" },
      mime_type: { type: "string" },
      enabled: { type: "boolean" },
    },
  },
  UpsertMcpPromptCommand: {
    type: "object",
    additionalProperties: true,
    required: ["connector_id", "prompt_key", "name"],
    properties: {
      connector_id: { type: "integer", format: "int64" },
      prompt_key: { type: "string" },
      name: { type: "string" },
      description: { type: "string" },
      arguments_schema_json: { type: "string" },
      enabled: { type: "boolean" },
    },
  },
};

const schemas = {
  ...structuredClone(sdkWorkEnvelopeComponentSchemas),
  ...domainSchemas,
};

function typedSdkWorkListResponse(itemsRef) {
  return {
    allOf: [
      { $ref: "#/components/schemas/SdkWorkApiResponse" },
      {
        type: "object",
        required: ["data"],
        properties: {
          data: {
            type: "object",
            additionalProperties: false,
            required: ["items", "pageInfo"],
            properties: {
              items: { type: "array", items: { $ref: itemsRef } },
              pageInfo: { $ref: "#/components/schemas/PageInfo" },
            },
          },
        },
      },
    ],
  };
}

function listResponse(itemsRef) {
  return typedSdkWorkListResponse(itemsRef);
}

function resourceResponse(itemRef) {
  return typedSdkWorkResourceResponse(itemRef);
}

function listQueryParameters() {
  return [
    {
      name: "page",
      in: "query",
      required: false,
      description: "One-based page index for offset pagination. Default 1.",
      schema: { type: "integer", format: "int32", minimum: 1, default: 1 },
    },
    {
      name: "page_size",
      in: "query",
      required: false,
      description: "Page size for offset pagination. Default 20, maximum 200.",
      schema: { type: "integer", format: "int32", minimum: 1, maximum: 200, default: 20 },
    },
    {
      name: "cursor",
      in: "query",
      required: false,
      description: "Opaque cursor token from a previous list response pageInfo.nextCursor.",
      schema: { type: "string", minLength: 1, maxLength: 512 },
    },
    {
      name: "q",
      in: "query",
      required: false,
      description: "Generic free-text search keyword.",
      schema: { type: "string", maxLength: 256 },
    },
  ];
}

function invocationListParameters() {
  return [
    ...listQueryParameters(),
    {
      name: "server_id",
      in: "query",
      required: false,
      schema: { type: "integer", format: "int64" },
    },
  ];
}

const appRoutes = [
  route("get", "/app/v3/api/mcp/categories", "mcp.listCategories", listResponse("#/components/schemas/McpServerCategoryRecord"), listQueryParameters(), null, "mcp.marketplace.read"),
  route("get", "/app/v3/api/mcp/servers", "mcp.listServers", listResponse("#/components/schemas/McpServerRecord"), listQueryParameters(), null, "mcp.marketplace.read"),
  route("post", "/app/v3/api/mcp/servers", "mcp.createOwnServer", resourceResponse("#/components/schemas/McpServerRecord"), [], "CreateOwnMcpServerCommand", "mcp.servers.create"),
  route("get", "/app/v3/api/mcp/servers/owned", "mcp.listOwnedServers", listResponse("#/components/schemas/McpServerRecord"), listQueryParameters(), null, "mcp.marketplace.read"),
  route("get", "/app/v3/api/mcp/servers/{serverKey}", "mcp.getServer", resourceResponse("#/components/schemas/McpServerRecord"), [pathParam("serverKey")], null, "mcp.marketplace.read"),
  route("patch", "/app/v3/api/mcp/servers/{serverKey}", "mcp.updateOwnServer", resourceResponse("#/components/schemas/McpServerRecord"), [pathParam("serverKey")], "UpdateOwnMcpServerCommand", "mcp.servers.update"),
  route("delete", "/app/v3/api/mcp/servers/{serverKey}", "mcp.deleteOwnServer", resourceResponse("#/components/schemas/McpServerRecord"), [pathParam("serverKey")], null, "mcp.servers.delete"),
  route("get", "/app/v3/api/mcp/servers/{serverId}/tools", "mcp.listTools", listResponse("#/components/schemas/McpToolRecord"), [pathParamInt("serverId"), ...listQueryParameters()], null, "mcp.marketplace.read"),
  route("get", "/app/v3/api/mcp/servers/{serverId}/tools/{toolKey}", "mcp.getTool", resourceResponse("#/components/schemas/McpToolRecord"), [pathParamInt("serverId"), pathParam("toolKey")], null, "mcp.marketplace.read"),
  route("get", "/app/v3/api/mcp/servers/{serverId}/resources", "mcp.listResources", listResponse("#/components/schemas/McpResourceRecord"), [pathParamInt("serverId"), ...listQueryParameters()], null, "mcp.marketplace.read"),
  route("get", "/app/v3/api/mcp/servers/{serverId}/prompts", "mcp.listPrompts", listResponse("#/components/schemas/McpPromptRecord"), [pathParamInt("serverId"), ...listQueryParameters()], null, "mcp.marketplace.read"),
  route("post", "/app/v3/api/mcp/servers/{serverId}/connectors", "mcp.upsertOwnConnector", resourceResponse("#/components/schemas/McpConnectorRecord"), [pathParamInt("serverId")], "UpsertOwnMcpConnectorCommand", "mcp.connectors.create"),
  route("delete", "/app/v3/api/mcp/servers/{serverId}/connectors/{connectorKey}", "mcp.deleteOwnConnector", resourceResponse("#/components/schemas/McpConnectorRecord"), [pathParamInt("serverId"), pathParam("connectorKey")], null, "mcp.connectors.delete"),
  route("get", "/app/v3/api/mcp/invocations", "mcp.listInvocations", listResponse("#/components/schemas/McpInvocationRecord"), invocationListParameters(), null, "mcp.invocations.read"),
];

const backendRoutes = [
  route("get", "/backend/v3/api/mcp/categories", "mcpAdmin.listCategories", listResponse("#/components/schemas/McpServerCategoryRecord"), listQueryParameters(), null, "mcp.admin.marketplace.read"),
  route("post", "/backend/v3/api/mcp/categories", "mcpAdmin.upsertCategory", resourceResponse("#/components/schemas/McpServerCategoryRecord"), [], "UpsertMcpServerCategoryCommand", "mcp.admin.category.manage"),
  route("get", "/backend/v3/api/mcp/servers", "mcpAdmin.listServers", listResponse("#/components/schemas/McpServerRecord"), listQueryParameters(), null, "mcp.admin.marketplace.read"),
  route("post", "/backend/v3/api/mcp/servers", "mcpAdmin.createServer", resourceResponse("#/components/schemas/McpServerRecord"), [], "CreateMcpServerCommand", "mcp.admin.server.manage"),
  route("put", "/backend/v3/api/mcp/servers/{serverKey}", "mcpAdmin.updateServer", resourceResponse("#/components/schemas/McpServerRecord"), [pathParam("serverKey")], "UpdateMcpServerCommand", "mcp.admin.server.manage"),
  route("delete", "/backend/v3/api/mcp/servers/{serverKey}", "mcpAdmin.deleteServer", resourceResponse("#/components/schemas/McpServerRecord"), [pathParam("serverKey")], null, "mcp.admin.server.manage"),
  route("get", "/backend/v3/api/mcp/servers/{serverId}/connectors", "mcpAdmin.listConnectors", listResponse("#/components/schemas/McpConnectorRecord"), [pathParamInt("serverId"), ...listQueryParameters()], null, "mcp.admin.marketplace.read"),
  route("post", "/backend/v3/api/mcp/servers/{serverId}/connectors", "mcpAdmin.upsertConnector", listResponse("#/components/schemas/McpConnectorRecord"), [pathParamInt("serverId")], "UpsertMcpConnectorCommand", "mcp.admin.server.manage"),
  route("delete", "/backend/v3/api/mcp/servers/{serverId}/connectors/{connectorKey}", "mcpAdmin.deleteConnector", listResponse("#/components/schemas/McpConnectorRecord"), [pathParamInt("serverId"), pathParam("connectorKey")], null, "mcp.admin.server.manage"),
  route("post", "/backend/v3/api/mcp/servers/{serverId}/tools", "mcpAdmin.upsertTool", listResponse("#/components/schemas/McpToolRecord"), [pathParamInt("serverId")], "UpsertMcpToolCommand", "mcp.admin.server.manage"),
  route("post", "/backend/v3/api/mcp/servers/{serverId}/resources", "mcpAdmin.upsertResource", listResponse("#/components/schemas/McpResourceRecord"), [pathParamInt("serverId")], "UpsertMcpResourceCommand", "mcp.admin.server.manage"),
  route("post", "/backend/v3/api/mcp/servers/{serverId}/prompts", "mcpAdmin.upsertPrompt", listResponse("#/components/schemas/McpPromptRecord"), [pathParamInt("serverId")], "UpsertMcpPromptCommand", "mcp.admin.server.manage"),
  route("get", "/backend/v3/api/mcp/invocations", "mcpAdmin.listInvocations", listResponse("#/components/schemas/McpInvocationRecord"), invocationListParameters(), null, "mcp.admin.invocation.read"),
  route("post", "/backend/v3/api/mcp/invocations", "mcpAdmin.appendInvocation", resourceResponse("#/components/schemas/McpInvocationRecord"), [], "AppendMcpInvocationCommand", "mcp.admin.invocation.read"),
];

function ref(name) {
  return { $ref: `#/components/schemas/${name}` };
}

function pathParam(name) {
  return { name, in: "path", required: true, schema: { type: "string" } };
}

function pathParamInt(name) {
  return { name, in: "path", required: true, schema: { type: "integer", format: "int64" } };
}

function problemResponse() {
  return {
    description: "Problem detail",
    content: {
      "application/problem+json": {
        schema: ref("ProblemDetail"),
      },
    },
  };
}

function route(
  method,
  pathKey,
  operationId,
  responseSchema,
  parameters = [],
  bodySchemaName = null,
  permission = null,
) {
  return {
    method,
    path: pathKey,
    operation: {
      tags: [TAG],
      summary: `MCP ${operationId}`,
      operationId,
      parameters,
      ...(bodySchemaName
        ? {
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: ref(bodySchemaName),
                },
              },
            },
          }
        : {}),
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              schema: responseSchema,
            },
          },
        },
        400: problemResponse(),
        401: problemResponse(),
        403: problemResponse(),
        404: problemResponse(),
      },
      security: [{ AuthToken: [], AccessToken: [] }],
      "x-sdkwork-owner": OWNER,
      "x-sdkwork-api-authority": "",
      "x-sdkwork-domain": DOMAIN,
      "x-sdkwork-resource": operationId.split(".")[0],
      "x-sdkwork-public": false,
      "x-sdkwork-api-surface": "",
      "x-sdkwork-request-context": "WebRequestContext",
      ...(permission ? { "x-sdkwork-permission": permission } : {}),
    },
  };
}

function documentFor({ authority, routes, serverUrl, title, surface }) {
  const paths = {};
  for (const item of routes) {
    paths[item.path] ??= {};
    item.operation["x-sdkwork-api-authority"] = authority;
    item.operation["x-sdkwork-api-surface"] = surface;
    paths[item.path][item.method] = item.operation;
  }
  return {
    openapi: "3.1.2",
    info: {
      title,
      version: "0.1.0",
      "x-sdkwork-owner": OWNER,
      "x-sdkwork-api-authority": authority,
    },
    servers: [{ url: serverUrl }],
    tags: [{ name: TAG, description: "MCP API resources.", "x-sdk-nested-resource-surface": true }],
    paths,
    components: {
      securitySchemes: {
        AuthToken: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        AccessToken: { type: "apiKey", in: "header", name: "Access-Token" },
      },
      schemas,
    },
    "x-sdkwork-owner": OWNER,
    "x-sdkwork-api-authority": authority,
    "x-sdkwork-domain": DOMAIN,
    "x-sdkwork-standard-profile": "sdkwork-v3",
  };
}

const checkOnly = process.argv.includes("--check");
const outputs = [
  {
    file: path.join(workspaceRoot, "apis/app-api/mcp/mcp-app-api.openapi.json"),
    document: documentFor({
      authority: "sdkwork-mcp.app",
      routes: appRoutes,
      serverUrl: "http://127.0.0.1:18100",
      title: "SDKWork MCP App API",
      surface: "app-api",
    }),
  },
  {
    file: path.join(workspaceRoot, "apis/backend-api/mcp/mcp-backend-api.openapi.json"),
    document: documentFor({
      authority: "sdkwork-mcp.backend",
      routes: backendRoutes,
      serverUrl: "http://127.0.0.1:18101",
      title: "SDKWork MCP Backend API",
      surface: "backend-api",
    }),
  },
];

if (!checkOnly) {
  for (const { file, document } of outputs) {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`, "utf8");
  }
} else {
  for (const { file } of outputs) {
    try {
      readFileSync(file, "utf8");
    } catch {
      console.error(`missing openapi: ${file}`);
      process.exit(1);
    }
  }
}

process.stdout.write(`[mcp_openapi_materialize] ok app=${appRoutes.length} backend=${backendRoutes.length}\n`);
