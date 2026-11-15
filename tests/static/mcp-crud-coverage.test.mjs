#!/usr/bin/env node

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

const BACKEND_MANIFEST = 'crates/sdkwork-routes-mcp-backend-api/src/http_route_manifest.rs';
const APP_MANIFEST = 'crates/sdkwork-routes-mcp-app-api/src/http_route_manifest.rs';
const BACKEND_OPENAPI = 'apis/backend-api/mcp/mcp-backend-api.openapi.json';
const APP_OPENAPI = 'apis/app-api/mcp/mcp-app-api.openapi.json';
const MATERIALIZER = 'tools/mcp_openapi_materialize.mjs';
const SERVICE_OPS = 'crates/sdkwork-routes-mcp-shared/src/service_ops.rs';
const POSTGRES = 'crates/sdkwork-intelligence-mcp-repository-sqlx/src/postgres.rs';

test('backend exposes read and delete for every MCP capability', () => {
  const manifest = readText(BACKEND_MANIFEST);
  const openapi = readText(BACKEND_OPENAPI);
  const materializer = readText(MATERIALIZER);
  for (const operationId of [
    'mcpAdmin.getCategory',
    'mcpAdmin.deleteCategory',
    'mcpAdmin.getConnector',
    'mcpAdmin.getTool',
    'mcpAdmin.deleteTool',
    'mcpAdmin.getResource',
    'mcpAdmin.deleteResource',
    'mcpAdmin.getPrompt',
    'mcpAdmin.deletePrompt',
  ]) {
    assert.match(manifest, new RegExp(operationId.replace('.', '\\.')));
    assert.match(openapi, new RegExp(`"operationId": "${operationId.replace('.', '\\.')}"`));
    assert.match(materializer, new RegExp(operationId.replace('.', '\\.')));
  }
});

test('app API exposes resource and prompt reads next to tools', () => {
  const manifest = readText(APP_MANIFEST);
  const openapi = readText(APP_OPENAPI);
  const materializer = readText(MATERIALIZER);
  for (const operationId of ['mcp.getTool', 'mcp.getResource', 'mcp.getPrompt']) {
    assert.match(manifest, new RegExp(operationId.replace('.', '\\.')));
    assert.match(openapi, new RegExp(`"operationId": "${operationId.replace('.', '\\.')}"`));
    assert.match(materializer, new RegExp(operationId.replace('.', '\\.')));
  }
});

test('service and repository implement soft delete for category, tool, resource, and prompt', () => {
  const serviceOps = readText(SERVICE_OPS);
  const postgres = readText(POSTGRES);
  for (const symbol of ['delete_category', 'delete_tool', 'delete_resource', 'delete_prompt']) {
    assert.match(serviceOps, new RegExp(`pub async fn ${symbol}`));
    assert.match(postgres, new RegExp(`pub async fn ${symbol}`));
  }
  for (const select of ['CATEGORY_SELECT', 'TOOL_SELECT', 'RESOURCE_SELECT', 'PROMPT_SELECT']) {
    assert.match(postgres, new RegExp(select));
  }
});

test('admin UI exposes delete actions for every MCP capability and category', () => {
  const panel = readText(
    'apps/sdkwork-mcp-pc/packages/sdkwork-mcp-pc-admin/src/components/AdminCapabilityPanel.tsx',
  );
  for (const action of ['deleteAdminTool', 'deleteAdminResource', 'deleteAdminPrompt']) {
    assert.match(panel, new RegExp(action));
  }
  const categories = readText(
    'apps/sdkwork-mcp-pc/packages/sdkwork-mcp-pc-admin/src/pages/AdminCategoriesPage.tsx',
  );
  assert.match(categories, /deleteAdminCategory/);
});
