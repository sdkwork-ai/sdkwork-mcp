import {resolveBaseUrlWithAlignProtocol} from "@sdkwork/sdk-common";

export interface MCPEnvironment {
  apiBaseUrl: string;
  appbaseAppApiBaseUrl: string;
  backendApiBaseUrl: string;
  appbaseLoginUrl: string;
}

const APP_API_SUFFIX = "/app/v3/api";
const BACKEND_API_SUFFIX = "/backend/v3/api";

function joinOrigin(origin: string, suffix: string): string {
  return `${origin.replace(/\/+$/u, "")}${suffix}`;
}

/**
 * Resolves the browser runtime base origin through the shared
 * `resolveBaseUrl` contract (ENVIRONMENT_SPEC.md §6.3): the unified
 * `SDKWORK_API_BASE_URL` candidate list (comma/semicolon separated) is matched
 * against the current page host, environment and deployment profile;
 * `pnpm dev` pages resolve to the same-origin dev server (standalone) or the
 * local cloud-gateway dev port (cloud). Authored `VITE_SDKWORK_MCP_H5_*`
 * overrides remain the explicit per-surface contract and win when present.
 */
export function resolveEnvironment(): MCPEnvironment {
  const runtime = resolveBaseUrlWithAlignProtocol({
    baseUrls:
      import.meta.env.VITE_SDKWORK_API_BASE_URL
      ?? import.meta.env.VITE_SDKWORK_MCP_H5_APPLICATION_PUBLIC_HTTP_URL,
  });
  const origin = runtime.url;

  return {
    apiBaseUrl: import.meta.env.VITE_SDKWORK_MCP_H5_APP_API_BASE_URL ?? origin,
    appbaseAppApiBaseUrl:
      import.meta.env.VITE_SDKWORK_MCP_H5_APPBASE_APP_API_BASE_URL
      ?? joinOrigin(origin, APP_API_SUFFIX),
    backendApiBaseUrl:
      import.meta.env.VITE_SDKWORK_MCP_H5_BACKEND_API_BASE_URL
      ?? joinOrigin(origin, BACKEND_API_SUFFIX),
    appbaseLoginUrl:
      import.meta.env.VITE_SDKWORK_MCP_H5_APPBASE_LOGIN_URL ?? origin,
  };
}
