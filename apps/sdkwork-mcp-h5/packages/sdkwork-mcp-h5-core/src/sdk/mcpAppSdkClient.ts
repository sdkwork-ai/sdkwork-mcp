import {
  createClient,
  type SdkworkAppClient as GeneratedSdkworkMCPAppClient,
} from "@sdkwork/mcp-app-sdk";
import type { SdkworkAppConfig } from "@sdkwork/mcp-app-sdk";
import { resolveBaseUrl } from "@sdkwork/sdk-common";
import type { Interceptors } from "@sdkwork/sdk-common";

import {
  createSdkworkChatRequestContextInterceptors,
  getSdkworkChatGlobalTokenManager,
  readAppSdkSessionTokens,
  resolveAppSdkAccessToken,
  resolveAppSdkAuthToken,
  type SdkworkChatSession,
} from "../session/session";

export type SdkworkMCPAppClient = GeneratedSdkworkMCPAppClient;
export type SdkworkMCPAppClientConfig = SdkworkAppConfig & {
  interceptors?: Interceptors;
};
export type { McpServerRecord } from "@sdkwork/mcp-app-sdk";

let mcpAppSdkClient: SdkworkMCPAppClient | null = null;

export function resolveMCPAppSdkBaseUrl(): string {
  // Single shared base-url key; candidates may be comma/semicolon separated and
  // the matching API host is chosen from the current page's environment+brand
  // (https page -> https://api-*, http page -> http://api-*). preservePath keeps
  // the /app/v3/api suffix this SDK client expects.
  return resolveBaseUrl({
    envKey: "SDKWORK_API_BASE_URL",
    preservePath: true,
  }).url;
}

export function createMCPAppSdkClientConfig(
  session?: SdkworkChatSession | null,
): SdkworkMCPAppClientConfig {
  const currentSession = session ?? readAppSdkSessionTokens();
  const envAccessToken =
    typeof import.meta.env.SDKWORK_ACCESS_TOKEN === "string"
      ? import.meta.env.SDKWORK_ACCESS_TOKEN.trim()
      : undefined;

  return {
    baseUrl: resolveMCPAppSdkBaseUrl(),
    accessToken: resolveAppSdkAccessToken(currentSession) ?? envAccessToken,
    authToken: resolveAppSdkAuthToken(currentSession),
    interceptors: createSdkworkChatRequestContextInterceptors(
      () => readAppSdkSessionTokens() ?? currentSession,
    ),
    platform: "h5",
    tokenManager: getSdkworkChatGlobalTokenManager(),
  };
}

export function initMCPAppSdkClient(
  config: SdkworkMCPAppClientConfig = createMCPAppSdkClientConfig(),
): SdkworkMCPAppClient {
  mcpAppSdkClient = createClient(config);
  return mcpAppSdkClient;
}

export function getMCPAppSdkClient(): SdkworkMCPAppClient {
  return mcpAppSdkClient ?? initMCPAppSdkClient();
}

export function getMCPAppSdkClientWithSession(
  session = readAppSdkSessionTokens(),
): SdkworkMCPAppClient {
  return initMCPAppSdkClient(createMCPAppSdkClientConfig(session));
}

export function resetMCPAppSdkClient(): void {
  mcpAppSdkClient = null;
}

export function useMCPAppSdkClient(): SdkworkMCPAppClient {
  return getMCPAppSdkClientWithSession();
}
