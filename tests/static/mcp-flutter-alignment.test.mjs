#!/usr/bin/env node

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const flutterRoot = path.join(repoRoot, 'apps/sdkwork-mcp-flutter-mobile');

function readFlutter(relativePath) {
  return fs.readFileSync(path.join(flutterRoot, relativePath), 'utf8');
}

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('flutter app root uses sdkwork_mcp naming', () => {
  const pubspec = readFlutter('pubspec.yaml');
  assert.match(pubspec, /name: sdkwork_mcp_flutter_mobile/);
  assert.doesNotMatch(pubspec, /sdkwork_agents|sdkwork-agents/i);
});

test('flutter pubspec.lock references mcp core package path', () => {
  const lock = readFlutter('pubspec.lock');
  assert.match(lock, /sdkwork_mcp_flutter_mobile_core/);
  assert.doesNotMatch(lock, /sdkwork_agents_flutter_mobile_core/);
});

test('flutter lib sources must not reference legacy agents branding', () => {
  const libRoot = path.join(flutterRoot, 'lib');
  const stack = [libRoot];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
        continue;
      }
      if (!entry.name.endsWith('.dart')) {
        continue;
      }
      const source = fs.readFileSync(absolutePath, 'utf8');
      assert.doesNotMatch(source, /AgentsApp|SDKWork Agents|sdkwork_agents/i, absolutePath);
      assert.doesNotMatch(source, /agents-flutter|sdkwork-agents/i, absolutePath);
    }
  }
});

test('flutter lib sources expose marketplace routes', () => {
  const routes = readFlutter('lib/bootstrap/routes.dart');
  assert.match(routes, /McpRoutes/);
  assert.match(routes, /serverDetail/);
  const app = readFlutter('lib/app.dart');
  assert.match(app, /MarketplacePage/);
  assert.match(app, /ServerDetailPage/);
  const marketplace = readFlutter('lib/pages/marketplace_page.dart');
  assert.match(marketplace, /MCP Marketplace/);
  assert.match(marketplace, /fetchMarketplaceCatalog/);
});

test('flutter core wires generated sdkwork-mcp-app-sdk flutter client', () => {
  const corePubspec = readFlutter('packages/sdkwork_mcp_flutter_mobile_core/pubspec.yaml');
  assert.match(
    corePubspec,
    /sdkwork_mcp_app_sdk_generated_flutter:[\s\S]*sdkwork-mcp-app-sdk-flutter\/generated\/server-openapi/,
  );
  const sdkClients = readFlutter(
    'packages/sdkwork_mcp_flutter_mobile_core/lib/bootstrap/sdk_clients.dart',
  );
  assert.match(sdkClients, /sdkwork-mcp-app-sdk/);
  assert.match(sdkClients, /SdkworkMcpFlutterSdkClients/);
  assert.match(sdkClients, /appClient/);
  assert.doesNotMatch(sdkClients, /pendingGeneratedSdk/);
  assert.doesNotMatch(
    sdkClients,
    /sdkwork-drive-app-sdk/,
    'flutter must not claim drive SDK until generated flutter client is wired',
  );
});

test('flutter core exposes IAM session model and appbase bridge', () => {
  const session = readFlutter(
    'packages/sdkwork_mcp_flutter_mobile_core/lib/src/session/mcp_app_session.dart',
  );
  assert.match(session, /mcpFlutterMobileSessionStorageKey/);
  assert.match(session, /legacyMcpFlutterMobileSessionStorageKeys/);
  assert.match(session, /tenantId: '100001'/);
  const bridge = readFlutter(
    'packages/sdkwork_mcp_flutter_mobile_core/lib/src/session/appbase_auth_bridge.dart',
  );
  assert.match(bridge, /resolveMcpAppSession/);
  assert.match(bridge, /sdkworkmcp:\/\/auth\/callback/);
});

test('flutter app bootstrap wires session storage and environment', () => {
  const appAuth = readFlutter('lib/bootstrap/app_auth.dart');
  assert.match(appAuth, /initAppAuthStorage/);
  assert.match(appAuth, /saveAppSession/);
  assert.match(appAuth, /legacyMcpFlutterMobileSessionStorageKeys/);
  const environment = readFlutter('lib/bootstrap/environment.dart');
  assert.match(environment, /SDKWORK_MCP_FLUTTER_APPLICATION_PUBLIC_HTTP_URL/);
  assert.match(environment, /8095/);
  assert.doesNotMatch(environment, /DRIVE_APP_API_BASE_URL/);
  const appAuthGate = readFlutter('lib/app_auth_gate.dart');
  assert.match(appAuthGate, /Continue with Appbase/);
  assert.doesNotMatch(appAuthGate, /bootstrap ready|Dart SDK pending/i);
});

test('flutter marketplace service uses generated MCP app SDK client', () => {
  const service = readFlutter(
    'packages/sdkwork_mcp_flutter_mobile_core/lib/src/services/marketplace_service.dart',
  );
  assert.match(service, /fetchMarketplaceCatalog/);
  assert.match(service, /client\.mcp\.listCategories/);
  assert.match(service, /client\.mcp\.listServers/);
  assert.match(service, /_catalogPageSize/);
  assert.match(service, /client\.mcp\.getServer/);
  assert.doesNotMatch(service, /package:http\/http\.dart|HttpClient\(\)/i);
});

test('flutter lib pages must not call raw MCP HTTP endpoints', () => {
  for (const relativePath of ['lib/pages/marketplace_page.dart', 'lib/pages/server_detail_page.dart']) {
    const source = readFlutter(relativePath);
    assert.doesNotMatch(source, /\/app\/v3\/api\/mcp\//);
    assert.doesNotMatch(source, /package:http\/http\.dart/);
  }
});

test('mcp app sdk manifest declares flutter generated package', () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'sdks/sdkwork-mcp-app-sdk/sdk-manifest.json'), 'utf8'),
  );
  assert.ok(manifest.generatedPackages?.flutter, 'sdk-manifest must declare flutter generated package');
  assert.ok(manifest.generatedPackages?.typescript, 'sdk-manifest must declare typescript generated package');
  assert.match(
    manifest.generatedPackages.flutter.generatedOutput,
    /sdkwork-mcp-app-sdk-flutter\/generated\/server-openapi/,
  );
});

test('shared health probes are centralized in sdkwork-routes-mcp-shared', () => {
  const sharedHealth = readText('crates/sdkwork-routes-mcp-shared/src/health.rs');
  assert.match(sharedHealth, /DbReadinessCheck/);
  assert.match(sharedHealth, /readyz_with_state/);
  for (const crate of ['sdkwork-routes-mcp-app-api', 'sdkwork-routes-mcp-backend-api']) {
    const health = readText(`crates/${crate}/src/health.rs`);
    assert.match(health, /sdkwork_routes_mcp_shared::health/);
  }
});

test('h5 core reuses sdkPage helper for SdkWorkPageData', () => {
  const sdkPage = readText('apps/sdkwork-mcp-h5/packages/sdkwork-mcp-h5-core/src/sdk/sdkPage.ts');
  assert.match(sdkPage, /@sdkwork\/utils/);
  assert.match(sdkPage, /SdkWorkPageData/);
  const marketplace = readText(
    'apps/sdkwork-mcp-h5/packages/sdkwork-mcp-h5-core/src/services/marketplaceService.ts',
  );
  assert.match(marketplace, /from '\.\.\/sdk\/sdkPage'/);
  assert.doesNotMatch(marketplace, /function unwrapSdkWorkPage/);
});

test('client app configs must not describe H5 as scaffold', () => {
  const h5Config = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'apps/sdkwork-mcp-h5/agent.app.config.json'), 'utf8'),
  );
  assert.doesNotMatch(String(h5Config.app?.description ?? ''), /scaffold/i);
  assert.doesNotMatch(String(h5Config.metadata?.managedBy ?? ''), /scaffold/i);
});
